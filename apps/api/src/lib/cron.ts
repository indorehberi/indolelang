import cron from 'node-cron';
import { prisma } from '../config/database';
import { SessionStatus, LotStatus } from '@indo-lelang/shared-types';
import { startActiveLot, closeActiveLot, activeLots } from './socket';
import { logger } from './logger';

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
        
        // Find published sessions whose start_time has passed
        const sessionsToStart = await prisma.auction_sessions.findMany({
          where: {
            status: SessionStatus.PUBLISHED,
            scheduled_at: { lte: now }
          }
        });

        for (const session of sessionsToStart) {
          logger.info({ sessionId: session.id }, 'CRON: Auto-starting auction session');
          
          // Update session to LIVE
          await prisma.auction_sessions.update({
            where: { id: session.id },
            data: { status: SessionStatus.LIVE }
          });

          // Find the first pending lot
          const firstLot = await prisma.lots.findFirst({
            where: { session_id: session.id, status: LotStatus.PENDING },
            orderBy: { lot_number: 'asc' },
            include: { asset: true }
          });

          if (firstLot) {
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
          } else {
            // No lots found, maybe just leave it live or close it
            logger.warn({ sessionId: session.id }, 'CRON: Auto-started session has no pending lots');
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
        }
      });

      if (expiredInvoices.length > 0) {
        logger.info({ count: expiredInvoices.length }, 'CRON: Auto-expiring unpaid invoices');
        
        await prisma.invoices.updateMany({
          where: {
            id: { in: expiredInvoices.map((inv) => inv.id) }
          },
          data: { status: 'expired' }
        });
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

  logger.info('Cron jobs initialized successfully');
}
