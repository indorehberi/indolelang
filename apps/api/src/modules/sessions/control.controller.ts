import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';
import { activeLots, startActiveLot, closeActiveLot, cancelActiveLot, getSocketIo, maskUserId } from '../../lib/socket';
import { LotStatus, SessionStatus, DepositStatus } from '@indo-lelang/shared-types';
import { logger } from '../../lib/logger';
import { isFeatureEnabled } from '../../lib/featureToggle';
import { SettingsService } from '../settings/settings.service';

export class ControlController {
  /**
   * Activate a lot to start the bidding countdown timer
   */
  async activateLot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lotId = req.params.id;

      // 1. Fetch lot details
      const lot = await prisma.lots.findUnique({
        where: { id: lotId },
        include: { asset: true },
      });

      if (!lot) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot tidak ditemukan');
      }

      if (lot.status !== LotStatus.PENDING) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'Lot sudah aktif atau telah selesai diproses');
      }

      // 2. Validate that no other lot in this session is currently active
      for (const [activeId, state] of activeLots.entries()) {
        if (state.sessionId === lot.session_id) {
          throw new AppError(
            400,
            ErrorCode.BAD_REQUEST,
            'Ada lot lain yang sedang aktif dalam sesi ini. Harap selesaikan terlebih dahulu.'
          );
        }
      }

      // 3. Mark session as live if it was published
      const session = await prisma.auction_sessions.findUnique({ where: { id: lot.session_id } });
      if (session && session.status === SessionStatus.PUBLISHED) {
        await prisma.auction_sessions.update({
          where: { id: lot.session_id },
          data: { status: SessionStatus.LIVE },
        });
      }

      // 4. Update lot status to active in DB
      const updatedLot = await prisma.lots.update({
        where: { id: lotId },
        data: { status: LotStatus.ACTIVE },
        include: { asset: true },
      });

      // 5. Fetch lot duration from settings or default to 120
      const settingsService = new SettingsService();
      let lotDuration = 120;
      try {
        const durationSetting = await settingsService.getSettingByKey('lot_duration_seconds');
        if (durationSetting && !isNaN(Number(durationSetting.value))) {
          lotDuration = Number(durationSetting.value);
        }
      } catch (err) {
        // use default 120
      }

      // 6. Trigger Socket.io countdown start
      startActiveLot(updatedLot, lotDuration);

      // Audit Log
      logAdminAction(req, 'ACTIVATE_LOT', 'lots', lotId, lot, updatedLot);

      sendSuccess(res, updatedLot, 'Lot berhasil diaktifkan. Bidding dimulai.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start an auction session manually (change status to live)
   */
  async startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.id;

      const session = await prisma.auction_sessions.findUnique({ where: { id: sessionId } });
      if (!session) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
      }

      if (session.status === SessionStatus.LIVE) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'Sesi lelang sudah dimulai');
      }

      if (session.status !== SessionStatus.PUBLISHED) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'Hanya sesi yang sudah di-publish yang bisa dimulai');
      }

      const updatedSession = await prisma.auction_sessions.update({
        where: { id: sessionId },
        data: { status: SessionStatus.LIVE },
      });

      // Audit Log
      logAdminAction(req, 'START_AUCTION_SESSION', 'auction_sessions', sessionId, session, updatedSession);

      sendSuccess(res, updatedSession, 'Sesi lelang berhasil dimulai.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close a lot manually (Hammer close / ketok palu manual)
   */
  async closeLot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lotId = req.params.id;

      const lot = await prisma.lots.findUnique({ where: { id: lotId } });
      if (!lot) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot tidak ditemukan');
      }

      if (lot.status !== LotStatus.ACTIVE) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'Lot tidak dalam status aktif (bidding tidak berjalan)');
      }

      // Settle lot using the helper which cleans up the socket state
      const settled = await closeActiveLot(lotId);

      // Audit Log
      logAdminAction(req, 'MANUAL_CLOSE_LOT', 'lots', lotId, lot, settled);

      sendSuccess(res, settled, 'Lot berhasil ditutup (ketok palu manual).');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel an active lot manually
   */
  async cancelLot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lotId = req.params.id;

      const lot = await prisma.lots.findUnique({ where: { id: lotId } });
      if (!lot) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot tidak ditemukan');
      }

      if (lot.status !== LotStatus.ACTIVE) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'Lot tidak dalam status aktif');
      }

      const cancelled = await cancelActiveLot(lotId);

      // Audit Log
      logAdminAction(req, 'CANCEL_ACTIVE_LOT', 'lots', lotId, lot, cancelled);

      sendSuccess(res, cancelled, 'Lot berhasil dibatalkan dan dikembalikan ke pending.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * End the auction session and trigger NIPL refunds for losers
   */
  async endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.id;

      const session = await prisma.auction_sessions.findUnique({ where: { id: sessionId } });
      if (!session) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
      }

      if (session.status === SessionStatus.CLOSED) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'Sesi lelang sudah ditutup sebelumnya');
      }

      // 1. Mark session as closed in DB
      const oldSession = { ...session };
      const updatedSession = await prisma.auction_sessions.update({
        where: { id: sessionId },
        data: { status: SessionStatus.CLOSED },
      });

      // 2. Cancel any remaining pending lots in this session
      await prisma.lots.updateMany({
        where: {
          session_id: sessionId,
          status: LotStatus.PENDING,
        },
        data: {
          status: LotStatus.CANCELLED,
        },
      });

      // 3. Auto-refund deposits for losing bidders (who did not win any lot in this session)
      const wonLots = await prisma.lots.findMany({
        where: {
          session_id: sessionId,
          status: LotStatus.SOLD,
          winner_id: { not: null },
        },
        select: { winner_id: true },
      });

      const winnerIds = wonLots.map((l) => l.winner_id).filter((id): id is string => !!id);

      const refundWhere: any = {
        session_id: sessionId,
        status: DepositStatus.PAID,
      };

      if (winnerIds.length > 0) {
        refundWhere.user_id = { notIn: winnerIds };
      }

      const depositsToRefund = await prisma.deposits.findMany({
        where: refundWhere,
      });

      if (depositsToRefund.length > 0) {
        const isAutoRefundEnabled = await isFeatureEnabled('feat_auto_refund');
        const targetStatus = isAutoRefundEnabled ? DepositStatus.REFUNDED : 'pending_refund';

        await prisma.deposits.updateMany({
          where: {
            id: { in: depositsToRefund.map((d) => d.id) },
          },
          data: {
            status: targetStatus,
          },
        });
      }

      // 4. Calculate session results and broadcast session:ended
      const totalLotsCount = await prisma.lots.count({ where: { session_id: sessionId } });
      const soldLotsCount = await prisma.lots.count({ where: { session_id: sessionId, status: LotStatus.SOLD } });
      const revenueRes = await prisma.lots.aggregate({
        where: { session_id: sessionId, status: LotStatus.SOLD },
        _sum: { hammer_price: true },
      });
      const revenue = Number(revenueRes._sum.hammer_price || 0);

      try {
        const io = getSocketIo();
        if (io) {
          io.to(`session:${sessionId}`).emit('session:ended', {
            session_id: sessionId,
            total_lots: totalLotsCount,
            lots_sold: soldLotsCount,
            total_revenue: revenue,
          });
        }
      } catch (err) {
        logger.error({ err }, 'Failed to broadcast session:ended event via socket');
      }

      // Audit Log
      logAdminAction(req, 'END_AUCTION_SESSION', 'auction_sessions', sessionId, oldSession, updatedSession);

      sendSuccess(res, {
        session: updatedSession,
        results: {
          total_lots: totalLotsCount,
          lots_sold: soldLotsCount,
          total_revenue: revenue,
          refunded_deposits_count: depositsToRefund.length,
        },
      }, 'Sesi lelang berhasil ditutup. Refund NIPL peserta diproses.');
    } catch (error) {
      next(error);
    }
  }
}

export default ControlController;
