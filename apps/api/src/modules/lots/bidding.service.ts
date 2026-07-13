import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Prisma } from '@prisma/client';
import { DepositStatus, LotStatus, AssetStatus, NotificationType } from '@indo-lelang/shared-types';
import { sendEmail, sendEmailSafe } from '../../lib/email';
import { logger } from '../../lib/logger';
import { paymentsService } from '../payments/payments.service';

export interface BidSubmission {
  userId: string;
  sessionId: string;
  lotId: string;
  amount: number;
}

export class BiddingService {
  /**
   * Get minimum increment based on current price range
   */
  getMinIncrement(currentPrice: number): number {
    return 500_000;
  }

  calculateAntiSnipe(
    timeRemaining: number,
    extensionCount: number,
    thresholdSeconds = 30,
    extensionSeconds = 30,
    maxExtensions = 999999
  ): { extended: boolean; newTimeRemaining: number; extensionCount: number } {
    if (timeRemaining > 60) {
      return {
        extended: true,
        newTimeRemaining: 120,
        extensionCount: extensionCount + 1,
      };
    } else if (timeRemaining > 0) {
      return {
        extended: true,
        newTimeRemaining: 60,
        extensionCount: extensionCount + 1,
      };
    }
    return {
      extended: false,
      newTimeRemaining: timeRemaining,
      extensionCount: extensionCount,
    };
  }

  /**
   * Validate incoming bid submission
   */
  async validateBid(bid: BidSubmission, currentPrice: number, currentHighestBidderId?: string): Promise<void> {
    // 1. Fetch lot to get unit_type
    const lot = await prisma.lots.findUnique({
      where: { id: bid.lotId },
      include: { asset: true },
    });

    if (!lot || !lot.asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot atau aset tidak ditemukan');
    }

    const unitType = lot.asset.category.toLowerCase().includes('motor') ? 'motor' : 'mobil';

    // 2. Block bidding for users who are active providers (cannot bid once approved as provider)
    const activeProvider = await prisma.providers.findUnique({
      where: { user_id: bid.userId },
    });

    if (activeProvider?.status === 'aktif') {
      throw new AppError(
        403,
        ErrorCode.FORBIDDEN,
        'Akun Anda sudah aktif sebagai Provider. Provider tidak dapat mengikuti lelang sebagai bidder.'
      );
    }

    // 3. Verify bidder global NIPL quota for this unit type
    const activeDeposits = await prisma.deposits.findMany({
      where: {
        user_id: bid.userId,
        status: 'paid',
        unit_type: unitType,
      },
    });

    let totalQuota = 0;
    let isUnlimited = false;

    for (const d of activeDeposits) {
      if (d.package_type === 'unlimited') {
        isUnlimited = true;
        break;
      }
      totalQuota += parseInt(d.package_type || '1', 10);
    }

    if (!isUnlimited && totalQuota <= 0) {
      throw new AppError(
        400,
        ErrorCode.INSUFFICIENT_DEPOSIT,
        'Anda tidak memiliki NIPL aktif yang sesuai untuk melakukan penawaran.'
      );
    }

    // 3. Prevent self-bidding (cannot outbid yourself)
    if (currentHighestBidderId === bid.userId) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Anda sudah memegang penawaran tertinggi saat ini');
    }

    if (!isUnlimited) {
      // Check if bidder has already reached max capacity of won lots (active + pending checkout)
      const currentWinningLiveLotsCount = await prisma.bids.count({
        where: {
          bidder_id: bid.userId,
          is_winning: true,
          lot: { status: 'active', asset: { category: { contains: unitType, mode: 'insensitive' } } },
        },
      });

      const unpaidInvoicesCount = await prisma.invoices.count({
        where: {
          bidder_id: bid.userId,
          status: 'unpaid',
          lot: { asset: { category: { contains: unitType, mode: 'insensitive' } } },
        },
      });

      const totalWon = currentWinningLiveLotsCount + unpaidInvoicesCount;
      
      // Since they are not currently the highest bidder (checked above), placing this bid means taking +1 quota
      if (totalWon >= totalQuota) {
        throw new AppError(
          400,
          ErrorCode.INSUFFICIENT_DEPOSIT,
          `Kuota NIPL Anda telah habis (Maks. menang ${totalQuota} unit). Silakan beli NIPL tambahan.`
        );
      }
    }

    // 4. Validate increment rules
    const minIncrement = this.getMinIncrement(currentPrice);
    if (bid.amount < currentPrice + minIncrement) {
      throw new AppError(
        400,
        ErrorCode.BID_BELOW_INCREMENT,
        `Penawaran minimal adalah ${new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(currentPrice + minIncrement)}`
      );
    }

    // 5. Ensure amount matches step increment
    const difference = bid.amount - currentPrice;
    if (difference % minIncrement !== 0) {
      throw new AppError(
        400,
        ErrorCode.BID_BELOW_INCREMENT,
        `Penawaran harus berkelipatan ${new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(minIncrement)}`
      );
    }
  }

  /**
   * Settle a lot when its timer runs out or manually closed by admin
   */
  async settleLot(lotId: string): Promise<any> {
    const lot = await prisma.lots.findUnique({
      where: { id: lotId },
      include: {
        asset: { include: { provider: true } },
        session: true,
        bids: {
          orderBy: [
            { amount: 'desc' },
            { created_at: 'asc' }, // tied amount: earliest bid wins
          ],
          take: 1,
        },
      },
    });

    if (!lot) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot tidak ditemukan');
    }

    // If already settled, skip
    if (lot.status === LotStatus.SOLD || lot.status === LotStatus.UNSOLD) {
      return lot;
    }

    const winningBid = lot.bids[0];

    if (winningBid) {
      // 1. Settle lot as SOLD
      const hammerPrice = Number(winningBid.amount);
      const winnerId = winningBid.bidder_id;

      // Ambil pengaturan dinamis dari platform_settings
      const settings = await prisma.platform_settings.findMany({
        where: {
          key: { in: ['admin_fee_tiers', 'pmk41_percentage'] }
        }
      });
      
      const pmk41Setting = settings.find(s => s.key === 'pmk41_percentage')?.value || '1.1';
      const pmk41Rate = parseFloat(pmk41Setting) / 100;
      
      let adminFee = 0;
      const adminFeeTiersRaw = settings.find(s => s.key === 'admin_fee_tiers')?.value;
      
      if (adminFeeTiersRaw) {
        try {
          const tiers = JSON.parse(adminFeeTiersRaw);
          // Cari tier yang sesuai dengan hammer price
          // Tiers diasumsikan sudah di-sort dari terkecil ke terbesar berdasarkan max_price
          let found = false;
          for (const tier of tiers) {
            if (tier.max_price === null || hammerPrice <= tier.max_price) {
              adminFee = Number(tier.fee);
              found = true;
              break;
            }
          }
          if (!found && tiers.length > 0) {
            // Jika melebihi semua max_price, gunakan fee tier terakhir
            adminFee = Number(tiers[tiers.length - 1].fee);
          }
        } catch (e) {
          console.error("Gagal parse admin_fee_tiers, fallback ke default", e);
          // Fallback
          if (hammerPrice <= 200000000) adminFee = 3500000;
          else if (hammerPrice <= 400000000) adminFee = 4000000;
          else if (hammerPrice <= 600000000) adminFee = 4500000;
          else adminFee = 6000000;
        }
      } else {
        // Fallback default
        if (hammerPrice <= 200000000) adminFee = 3500000;
        else if (hammerPrice <= 400000000) adminFee = 4000000;
        else if (hammerPrice <= 600000000) adminFee = 4500000;
        else adminFee = 6000000;
      }

      // PMK 41 fee (dari pengaturan) if not paid by provider
      let pmk41Amount = 0;
      if (!lot.asset.provider.pmk41_paid_by_provider) {
        pmk41Amount = Math.round(hammerPrice * pmk41Rate);
      }
      
      const commission = adminFee;
      const tax = 0;
      
      // Tambahkan kode unik (1-9) pada tagihan
      const uniqueCode = Math.floor(Math.random() * 9) + 1;
      const total = hammerPrice + adminFee + pmk41Amount + uniqueCode;

      // Perform updates inside database transaction
      const [updatedLot, invoice, winnerUser] = await prisma.$transaction([
        prisma.lots.update({
          where: { id: lotId },
          data: {
            status: LotStatus.SOLD,
            hammer_price: new Prisma.Decimal(hammerPrice),
            winner_id: winnerId,
          },
          include: { asset: true },
        }),
        prisma.invoices.create({
          data: {
            lot_id: lotId,
            bidder_id: winnerId,
            hammer_price: new Prisma.Decimal(hammerPrice),
            commission: new Prisma.Decimal(commission),
            tax: new Prisma.Decimal(tax),
            admin_fee: new Prisma.Decimal(adminFee),
            pmk41_amount: new Prisma.Decimal(pmk41Amount),
            total: new Prisma.Decimal(total),
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days payment window
            status: 'unpaid',
          },
        }),
        prisma.users.findUnique({
          where: { id: winnerId },
          select: { email: true, full_name: true },
        }),
        prisma.assets.update({
          where: { id: lot.asset_id },
          data: { status: AssetStatus.SOLD },
        }),
        prisma.notifications.create({
          data: {
            user_id: winnerId,
            type: NotificationType.BID_WON,
            title: 'Selamat! Anda Memenangkan Lelang',
            body: `Penawaran Anda sebesar ${new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(hammerPrice)} pada lot "${lot.asset.title}" telah disetujui sebagai pemenang.`,
          },
        }),

        prisma.audit_logs.create({
          data: {
            action: 'LOT_SETTLEMENT_SOLD',
            resource_type: 'lots',
            resource_id: lotId,
            new_value: JSON.stringify({ hammerPrice, winnerId }),
          },
        }),
      ]);

      // Generate settlement record immediately (with 'unpaid' status) so it appears in the dashboard
      await paymentsService.createSettlementForInvoice(invoice.id);

      if (winnerUser) {
        // Send email asynchronously
        const formattedTotal = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(total);

        sendEmailSafe({
          to: winnerUser.email,
          subject: `[Indo-Lelang] Selamat! Anda memenangkan Lot #${lot.lot_number}`,
          text: `Halo ${winnerUser.full_name},\n\nSelamat! Anda telah memenangkan lelang untuk unit "${lot.asset.title}" dengan harga ketok palu sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(hammerPrice)}.\n\nTotal kewajiban pembayaran (termasuk komisi dan PPN) adalah ${formattedTotal}. Invoice pelunasan telah dibuat dan dapat Anda akses di dasbor keuangan Anda.\n\nHarap lakukan pelunasan dalam waktu 3 hari kerja.\n\nTerima kasih,\nTim Indo-Lelang`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2b6cb0; text-align: center;">Selamat! Anda Memenangkan Lelang 🏆</h2>
              <p>Halo <strong>${winnerUser.full_name}</strong>,</p>
              <p>Dengan senang hati kami informasikan bahwa Anda telah memenangkan lelang unit berikut pada sesi <strong>"${lot.session.title}"</strong>:</p>
              
              <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #2d3748;">Detail Unit:</h4>
                <p style="margin: 0; font-size: 1.1rem; font-weight: bold; color: #1a0dab;">${lot.asset.title}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;" />
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #718096;">Harga Ketok Palu:</td>
                    <td style="padding: 4px 0; font-weight: bold; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(hammerPrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #718096;">Admin Fee:</td>
                    <td style="padding: 4px 0; font-weight: bold; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(adminFee)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #718096;">Biaya PMK 41:</td>
                    <td style="padding: 4px 0; font-weight: bold; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pmk41Amount)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #718096;">PPN (11%):</td>
                    <td style="padding: 4px 0; font-weight: bold; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tax)}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #e2e8f0;">
                    <td style="padding: 8px 0 0 0; font-weight: bold; color: #2d3748;">TOTAL KEWAJIBAN:</td>
                    <td style="padding: 8px 0 0 0; font-size: 1.2rem; font-weight: bold; color: #e53e3e; text-align: right;">${formattedTotal}</td>
                  </tr>
                </table>
              </div>

              <p>Invoice pelunasan telah diterbitkan di akun Anda. Silakan lakukan transfer pelunasan paling lambat sebelum tanggal <strong>${new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 0.8rem; color: #a0aec0; text-align: center;">Email ini dikirimkan secara otomatis oleh sistem Indo-Lelang.</p>
            </div>
          `,
        }).catch((err) => {
          logger.error({ err }, 'Failed to send lot winning email notification');
        });
      }

      return updatedLot;
    } else {
      // 2. Settle lot as UNSOLD
      const [updatedLot] = await prisma.$transaction([
        prisma.lots.update({
          where: { id: lotId },
          data: {
            status: LotStatus.UNSOLD,
          },
          include: { asset: true },
        }),
        prisma.assets.update({
          where: { id: lot.asset_id },
          data: { status: AssetStatus.APPROVED }, // Return status to approved so it can be re-listed
        }),
        prisma.audit_logs.create({
          data: {
            action: 'LOT_SETTLEMENT_UNSOLD',
            resource_type: 'lots',
            resource_id: lotId,
          },
        }),
      ]);

      return updatedLot;
    }
  }
}

export const biddingService = new BiddingService();
