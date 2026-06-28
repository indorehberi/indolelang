import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Prisma } from '@prisma/client';
import { DepositStatus, LotStatus, AssetStatus, NotificationType } from '@indo-lelang/shared-types';
import { sendEmail } from '../../lib/email';
import { logger } from '../../lib/logger';

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
    if (currentPrice < 10_000_000) return 500_000;
    if (currentPrice < 50_000_000) return 1_000_000;
    if (currentPrice < 200_000_000) return 2_500_000;
    return 5_000_000;
  }

  /**
   * Process anti-sniping extension check
   */
  calculateAntiSnipe(
    timeRemaining: number,
    extensionCount: number,
    thresholdSeconds = 30,
    extensionSeconds = 120,
    maxExtensions = 3
  ): { extended: boolean; newTimeRemaining: number; extensionCount: number } {
    if (timeRemaining < thresholdSeconds && extensionCount < maxExtensions) {
      return {
        extended: true,
        newTimeRemaining: extensionSeconds,
        extensionCount: extensionCount + 1,
      };
    }
    return {
      extended: false,
      newTimeRemaining: timeRemaining,
      extensionCount,
    };
  }

  /**
   * Validate incoming bid submission
   */
  async validateBid(bid: BidSubmission, currentPrice: number, currentHighestBidderId?: string): Promise<void> {
    // 1. Verify bidder has an active NIPL (paid deposit) for this session
    const nipl = await prisma.deposits.findFirst({
      where: {
        user_id: bid.userId,
        session_id: bid.sessionId,
        status: DepositStatus.PAID,
      },
    });

    if (!nipl) {
      throw new AppError(400, ErrorCode.INSUFFICIENT_DEPOSIT, 'Anda tidak memiliki NIPL aktif untuk sesi lelang ini');
    }

    // 2. Prevent self-bidding (cannot outbid yourself)
    if (currentHighestBidderId === bid.userId) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Anda sudah memegang penawaran tertinggi saat ini');
    }

    // 3. Validate increment rules
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

    // 4. Ensure amount matches step increment
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
        asset: true,
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

      // Read platform settings for dynamic tax/commission rates
      const settings = await prisma.platform_settings.findMany({
        where: { tenant_id: 'default' },
      });
      const getSettingVal = (key: string, fallback: string) =>
        settings.find((s) => s.key === key)?.value || fallback;

      const commissionRate = parseFloat(getSettingVal('commission_percentage', '3.0')) / 100;
      const premiumRate = parseFloat(getSettingVal('buyer_premium_percentage', '1.5')) / 100;
      const taxRate = parseFloat(getSettingVal('tax_percentage', '11.0')) / 100;

      const commission = hammerPrice * commissionRate;
      const premium = hammerPrice * premiumRate;
      const subtotal = hammerPrice + commission + premium;
      const tax = subtotal * taxRate;
      const total = Math.ceil(subtotal + tax);

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
            total: new Prisma.Decimal(total),
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days payment window
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

      if (winnerUser) {
        // Send email asynchronously
        const formattedTotal = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(total);

        sendEmail({
          to: winnerUser.email,
          subject: `[Indo-Lelang] Selamat! Anda memenangkan Lot #${lot.lot_number}`,
          text: `Halo ${winnerUser.full_name},\n\nSelamat! Anda telah memenangkan lelang untuk unit "${lot.asset.title}" dengan harga ketok palu sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(hammerPrice)}.\n\nTotal kewajiban pembayaran (termasuk komisi dan PPN) adalah ${formattedTotal}. Invoice pelunasan telah dibuat dan dapat Anda akses di dasbor keuangan Anda.\n\nHarap lakukan pelunasan dalam waktu 5 hari kerja.\n\nTerima kasih,\nTim Indo-Lelang`,
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
                    <td style="padding: 4px 0; color: #718096;">Komisi Balai:</td>
                    <td style="padding: 4px 0; font-weight: bold; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(commission)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #718096;">Buyer Premium:</td>
                    <td style="padding: 4px 0; font-weight: bold; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(premium)}</td>
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
