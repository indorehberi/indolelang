import cron from 'node-cron';
import { prisma } from '../config/database';
import { SessionStatus, LotStatus } from '@indo-lelang/shared-types';
import { startActiveLot, closeActiveLot, activeLots, getSocketIo, handleAutoNextAndSessionEnd } from './socket';
import { logger } from './logger';
import { paymentsService } from '../modules/payments/payments.service';
import { UNLIMITED_PACKAGE_TYPE_FILTER } from './niplPackage';

async function getSetting(key: string, defaultValue: string): Promise<string> {
  const setting = await prisma.platform_settings.findFirst({ where: { key } });
  return setting ? setting.value : defaultValue;
}

export function initCronJobs() {
  // Check every minute
  cron.schedule('* * * * *', async () => {
    try {
      const sessionTrigger = await getSetting('auction_session_start_trigger', 'admin');
      
      if (sessionTrigger === 'system') {
        const now = new Date();

        // Never start a session on top of one that is already running. Two live
        // sessions at once would have two lots counting down in parallel, and
        // bidders polling `/lots?status=active` would flip between them.
        const liveCount = await prisma.auction_sessions.count({
          where: { status: SessionStatus.LIVE },
        });
        if (liveCount > 0) {
          return;
        }

        // Find published sessions whose start_time has passed
        const sessionsToStart = await prisma.auction_sessions.findMany({
          where: {
            status: SessionStatus.PUBLISHED,
            scheduled_at: { lte: now }
          },
          // Oldest scheduled first, so a backlog starts in the intended order.
          orderBy: { scheduled_at: 'asc' },
          // One per tick — the next tick re-checks the guard above, which the
          // session just started will now trip.
          take: 1,
        });

        for (const session of sessionsToStart) {
          logger.info({ sessionId: session.id }, 'CRON: Auto-starting auction session');
          
          // Update session to LIVE
          await prisma.auction_sessions.update({
            where: { id: session.id },
            data: { status: SessionStatus.LIVE }
          });

          // Find the first pending or cancelled lot
          const firstLot = await prisma.lots.findFirst({
            where: {
              session_id: session.id,
              status: { in: [LotStatus.PENDING, LotStatus.CANCELLED] },
            },
            orderBy: { lot_number: 'asc' },
            include: { asset: true }
          });

          if (firstLot) {
            if (firstLot.status === LotStatus.CANCELLED) {
              logger.info({ lotId: firstLot.id }, 'CRON: First lot in session is cancelled, emitting freeze and auto-nexting');
              const durationStr = await getSetting('auction_lot_canceled_duration_secs', '5');
              const freezeDurationSecs = parseInt(durationStr, 10) || 5;

              const ioServer = getSocketIo();
              if (ioServer) {
                ioServer.to(`session:${session.id}`).emit('lot:start', {
                  lot_id: firstLot.id,
                  is_canceled: true,
                  freeze_duration_secs: freezeDurationSecs,
                  lot_data: firstLot,
                });
              }

              setTimeout(() => {
                handleAutoNextAndSessionEnd(firstLot);
              }, freezeDurationSecs * 1000);
            } else {
              logger.info({ lotId: firstLot.id }, 'CRON: Auto-activating first lot in session');
              
              // Mark lot as active
              const updatedLot = await prisma.lots.update({
                where: { id: firstLot.id },
                data: { status: LotStatus.ACTIVE },
                include: { asset: true }
              });

              // 120s matches the historical hardcoded lot duration — see
              // startActiveLot in socket.ts for why that fallback matters.
              const durationStr = await getSetting('auction_lot_duration_secs', '120');
              startActiveLot(updatedLot, parseInt(durationStr, 10));
            }
          } else {
            // No lots found, maybe just leave it live or close it
            logger.warn({ sessionId: session.id }, 'CRON: Auto-started session has no pending or cancelled lots');
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'CRON: Error in auction session auto-start job');
    }
  });

  // Auto-expire unpaid invoices past their due date (due_date is set to +3 days
  // at invoice creation — checked here directly instead of re-deriving a separate
  // fixed window from created_at, so the two stay in sync if the payment window
  // is ever changed).
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      // 1. Find and expire unpaid invoices whose due_date is past (due_date is exactly 18:00 WIB of the expiration day)
      const expiredInvoices = await prisma.invoices.findMany({
        where: {
          status: 'unpaid',
          due_date: { lt: now }
        },
        include: {
          lot: {
            include: {
              asset: { include: { provider: true } },
            },
          },
        },
      });

      if (expiredInvoices.length > 0) {
        logger.info({ count: expiredInvoices.length }, 'CRON: Auto-expiring unpaid invoices');
        
        await prisma.invoices.updateMany({
          where: {
            id: { in: expiredInvoices.map((inv) => inv.id) }
          },
          data: { status: 'expired' }
        });

        // 1b. NIPL Forfeiture: for each expired invoice, forfeit any NIPL
        //     deposit that was consumed at checkout (linked via nipl_codes).
        //     Then create a half-NIPL settlement for the provider.
        const niplBaseAmountSetting = await prisma.platform_settings.findFirst({
          where: { key: 'nipl_deposit_amount' }
        });
        const niplMotorAmountSetting = await prisma.platform_settings.findFirst({
          where: { key: 'nipl_motor_deposit_amount' }
        });
        const niplMobilBase = Number(niplBaseAmountSetting?.value) || 5000000;
        const niplMotorBase = Number(niplMotorAmountSetting?.value) || 1000000;

        for (const inv of expiredInvoices) {
          try {
            const providerId = inv.lot.asset.provider_id ?? inv.lot.asset.provider?.id;
            if (!providerId) continue;

            const isMotor = inv.lot.asset.category?.toLowerCase().includes('motor');
            const niplBase = isMotor ? niplMotorBase : niplMobilBase;

            // Kode NIPL yang terikat pada tagihan ini.
            //
            // 'reserved' wajib ikut. Jaminan kini disisihkan pada saat MENANG,
            // bukan saat checkout — dan justru pemenang yang tidak pernah
            // checkout sama sekali adalah kasus gagal bayar paling umum.
            // Sebelumnya mereka tidak punya kode terikat sehingga tidak ada
            // yang hangus, dan jaminannya selamat meski unitnya tidak dilunasi.
            const usedNiplCodes = await prisma.nipl_codes.findMany({
              where: { invoice_id: inv.id, status: { in: ['used', 'reserved'] } },
              include: { deposit: true },
            });

            if (usedNiplCodes.length > 0) {
              // Forfeit all deposits linked to this invoice's NIPL codes
              const depositIdsToForfeit = [...new Set(usedNiplCodes.map((c) => c.deposit_id).filter(Boolean))] as string[];

              await prisma.$transaction([
                // Mark deposits as forfeited
                prisma.deposits.updateMany({
                  where: { id: { in: depositIdsToForfeit } },
                  data: { status: 'forfeited' },
                }),
                // Mark NIPL codes as forfeited
                prisma.nipl_codes.updateMany({
                  where: { invoice_id: inv.id, status: { in: ['used', 'reserved'] } },
                  data: { status: 'forfeited' },
                }),
                // Notify bidder
                prisma.notifications.create({
                  data: {
                    user_id: inv.bidder_id,
                    type: 'nipl_forfeited',
                    title: 'Jaminan NIPL Hangus',
                    body: `Jaminan NIPL Anda untuk unit "${inv.lot.asset.title}" hangus karena pelunasan tidak dilakukan sebelum batas waktu.`,
                  },
                }),
                // Audit log
                prisma.audit_logs.create({
                  data: {
                    action: 'NIPL_FORFEITED',
                    resource_type: 'invoices',
                    resource_id: inv.id,
                    new_value: JSON.stringify({ depositIds: depositIdsToForfeit, reason: 'invoice expired unpaid' }),
                  },
                }),
              ]);

              logger.info({ invoiceId: inv.id, depositCount: depositIdsToForfeit.length }, 'CRON: NIPL forfeited for expired invoice');

              // Bagian provider hanya boleh terbit kalau memang ada NIPL yang
              // benar-benar disita. Sebelumnya panggilan ini berada di luar
              // blok ini, sehingga SETIAP tagihan lewat tenggat membayar ½
              // NIPL ke provider — termasuk saat pemenang tidak pernah
              // checkout dan tidak ada jaminan yang hangus sama sekali.
              // Platform menombok selisihnya dari kantong sendiri.
              await paymentsService.createForfeitureSettlement(inv.lot_id, providerId, niplBase);
              logger.info({ invoiceId: inv.id, providerId }, 'CRON: Forfeiture settlement created for provider');
            } else {
              logger.info(
                { invoiceId: inv.id, providerId },
                'CRON: Tagihan lewat tenggat tanpa NIPL terpakai — tidak ada yang hangus, bagian provider tidak diterbitkan'
              );
            }
          } catch (forfeitErr) {
            logger.error({ err: forfeitErr, invoiceId: inv.id }, 'CRON: Error processing NIPL forfeiture for expired invoice');
          }
        }
      }

      // 2. Revert asset status back to APPROVED for expired invoices after 23:59 WIB (16:59:59 UTC) of the expiration day
      const expiredInvoicesToRevert = await prisma.invoices.findMany({
        where: {
          status: 'expired',
          lot: {
            asset: {
              status: 'sold'
            }
          }
        },
        include: {
          lot: {
            include: {
              asset: true
            }
          }
        }
      });

      const toRevert = expiredInvoicesToRevert.filter((inv) => {
        const dueDate = new Date(inv.due_date);
        // due_date is set to 11:00 UTC (18:00 WIB)
        // 23:59 WIB of the same day is 16:59 UTC
        const endOfDayUtc = new Date(Date.UTC(
          dueDate.getUTCFullYear(),
          dueDate.getUTCMonth(),
          dueDate.getUTCDate(),
          16, 59, 59, 999
        ));
        return now >= endOfDayUtc;
      });

      if (toRevert.length > 0) {
        logger.info({ count: toRevert.length }, 'CRON: Reverting asset statuses back to APPROVED for expired invoices');
        
        const assetIds = toRevert.map((inv) => inv.lot.asset_id).filter(Boolean);
        
        await prisma.$transaction([
          prisma.assets.updateMany({
            where: {
              id: { in: assetIds }
            },
            data: {
              status: 'approved'
            }
          }),
          ...toRevert.map((inv) => prisma.audit_logs.create({
            data: {
              action: 'ASSET_REVERTED_EXPIRED_INVOICE',
              resource_type: 'assets',
              resource_id: inv.lot.asset_id,
              new_value: JSON.stringify({ invoice_id: inv.id, reason: 'unpaid invoice expired and past grace period' }),
            }
          }))
        ]);
      }
    } catch (err) {
      logger.error({ err }, 'CRON: Error in invoice auto-expire and revert job');
    }
  });

  // Downgrade spent-out "unlimited" NIPL packages once their day is over.
  //
  // Unlimited lets a bidder win any number of units, but only on the WIB day
  // the deposit was activated. From the next day on they hold an ordinary
  // deposit worth however many NIPL slots they never used — and those cannot
  // be topped back up to unlimited. Runs at 00:05 WIB (17:05 UTC), just after
  // the day flips, and again hourly-safe because it is idempotent: the
  // `unlimited_downgraded_at: null` filter means an already-downgraded
  // deposit is never picked up twice.
  cron.schedule('5 17 * * *', async () => {
    try {
      // Server clock is UTC; WIB is UTC+7. Shift into WIB to read off today's
      // calendar date there, then convert that day's midnight back to UTC.
      const nowUtc = new Date();
      const wibNow = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
      const startOfTodayWib = new Date(
        Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()) -
          7 * 60 * 60 * 1000
      );

      const expired = await prisma.deposits.findMany({
        where: {
          // Matches both spellings — the legacy '999' rows are unlimited too.
          ...UNLIMITED_PACKAGE_TYPE_FILTER,
          status: 'paid',
          unlimited_downgraded_at: null,
          // Activated on an earlier WIB day. paid_at is the moment the
          // privilege started; fall back to created_at for older rows that
          // predate paid_at being populated.
          OR: [
            { paid_at: { lt: startOfTodayWib } },
            { paid_at: null, created_at: { lt: startOfTodayWib } },
          ],
        },
        select: { id: true, user_id: true, unit_type: true },
      });

      if (expired.length === 0) return;

      for (const dep of expired) {
        const totalCodes = await prisma.nipl_codes.count({ where: { deposit_id: dep.id } });
        if (totalCodes === 0) {
          // A paid deposit from before the nipl_codes table existed. There is
          // nothing to count, so downgrading would drop the bidder to a quota
          // of zero and strip slots they actually paid for. Leaving it alone
          // keeps the deposit exactly as the admin recorded it — deliberately
          // never forfeiting NIPL just because the rows are missing.
          logger.warn(
            { depositId: dep.id },
            'CRON: Skipping unlimited downgrade — legacy deposit has no nipl_codes rows to count'
          );
          continue;
        }

        const remaining = await prisma.nipl_codes.count({
          where: { deposit_id: dep.id, status: 'active' },
        });

        await prisma.$transaction([
          prisma.deposits.update({
            where: { id: dep.id },
            data: { unlimited_downgraded_at: nowUtc },
          }),
          prisma.notifications.create({
            data: {
              user_id: dep.user_id,
              type: 'nipl_unlimited_downgraded',
              title: 'Paket NIPL Unlimited Berakhir',
              body: remaining > 0
                ? `Masa berlaku NIPL Unlimited Anda telah berakhir. Anda kini memiliki ${remaining} NIPL ${dep.unit_type || ''} tersisa yang tetap dapat digunakan atau diajukan refund.`.trim()
                : 'Masa berlaku NIPL Unlimited Anda telah berakhir dan seluruh NIPL sudah terpakai. Silakan beli NIPL baru untuk mengikuti lelang berikutnya.',
            },
          }),
          prisma.audit_logs.create({
            data: {
              action: 'NIPL_UNLIMITED_DOWNGRADED',
              resource_type: 'deposits',
              resource_id: dep.id,
              new_value: JSON.stringify({ remaining_nipl: remaining, reason: 'unlimited day elapsed' }),
            },
          }),
        ]);

        logger.info({ depositId: dep.id, remaining }, 'CRON: Unlimited NIPL downgraded to satuan');
      }
    } catch (err) {
      logger.error({ err }, 'CRON: Error downgrading expired unlimited NIPL deposits');
    }
  });

  logger.info('Cron jobs initialized successfully');
}
