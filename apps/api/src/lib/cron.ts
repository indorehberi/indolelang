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

            const durationStr = await getSetting('auction_lot_duration_secs', '30');
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

  // Auto-expire unpaid invoices after 3 days
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      
      // Find invoices that are unpaid and created > 3 days ago
      const expireTime = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
      
      const expiredInvoices = await prisma.invoices.findMany({
        where: {
          status: 'unpaid',
          created_at: { lt: expireTime }
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
    } catch (err) {
      logger.error({ err }, 'CRON: Error in invoice auto-expire job');
    }
  });

  logger.info('Cron jobs initialized successfully');
}
