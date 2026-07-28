import { Server as SocketIoServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from './jwt';
import { biddingService } from '../modules/lots/bidding.service';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

export interface ActiveLotState {
  lotId: string;
  sessionId: string;
  currentPrice: number;
  highestBidderId?: string;
  highestBidderMasked?: string;
  highestBidderName?: string;
  highestBidderNipl?: string;
  bidsCount: number;
  timeRemaining: number;
  extensionCount: number;
  timerInterval?: NodeJS.Timeout;
  autoEndTrigger?: string;
}

// In-memory active lot state
export const activeLots = new Map<string, ActiveLotState>();

let io: SocketIoServer | null = null;

export function maskUserId(userId: string): string {
  return `Peserta #${userId.substring(0, 4).toUpperCase()}`;
}

// Number of sockets currently in `lot:{lotId}` — i.e. bidders with that lot
// open right now — broadcast as "Peserta Online" on the bidding-room card.
function broadcastLotPresence(ioServer: SocketIoServer, lotId: string): void {
  const room = ioServer.sockets.adapter.rooms.get(`lot:${lotId}`);
  ioServer.to(`lot:${lotId}`).emit('lot:presence', { lot_id: lotId, count: room?.size || 0 });
}

export function initSocket(server: HttpServer): SocketIoServer {
  io = new SocketIoServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // JWT authentication handshake middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const payload = verifyAccessToken(token as string);
        socket.data.user = payload;
      } catch (err) {
        logger.debug('Socket connection unauthenticated (invalid JWT token)');
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    logger.debug({ socketId: socket.id, user: socket.data.user }, 'Client connected to WebSocket');

    // 1. Join room/unwatch events
    socket.on('bid:watch', (data: { lot_id?: string; session_id?: string }) => {
      // Session room: control-room viewers join this on connect (before any lot
      // is known) so they receive session/lot-wide broadcasts like `lot:activated`,
      // `lot:closed` and `session:ended` regardless of which specific lot they're on.
      if (data.session_id) {
        socket.join(`session:${data.session_id}`);
      }

      if (!data.lot_id) return;
      socket.join(`lot:${data.lot_id}`);
      logger.debug({ socketId: socket.id, lot_id: data.lot_id }, 'Client watching lot');
      broadcastLotPresence(io!, data.lot_id);

      // Send current lot state immediately if lot is already active
      const state = activeLots.get(data.lot_id);
      if (state) {
        socket.emit('bid:update', {
          lot_id: state.lotId,
          current_price: state.currentPrice,
          bidder_id: state.highestBidderMasked || '-',
          bidder_name: state.highestBidderName || '-',
          nipl_code: state.highestBidderNipl || '-',
          bidder_count: state.bidsCount,
          time_remaining: state.timeRemaining,
          extension_count: state.extensionCount,
        });
      }
    });

    socket.on('bid:unwatch', (data: { lot_id: string }) => {
      if (!data.lot_id) return;
      socket.leave(`lot:${data.lot_id}`);
      logger.debug({ socketId: socket.id, lot_id: data.lot_id }, 'Client unwatched lot');
      broadcastLotPresence(io!, data.lot_id);
    });

    // 2. Bid submission event
    socket.on('bid:submit', async (data: { lot_id: string; session_id: string; amount: number }) => {
      try {
        const user = socket.data.user;
        if (!user) {
          socket.emit('bid:error', { message: 'Silakan login terlebih dahulu untuk melakukan bid.' });
          return;
        }

        const state = activeLots.get(data.lot_id);
        if (!state) {
          socket.emit('bid:error', { message: 'Bidding untuk lot ini belum aktif atau sudah ditutup.' });
          return;
        }

        // Validate bid constraints (NIPL, increments, self-bid)
        await biddingService.validateBid(
          {
            userId: user.id,
            sessionId: data.session_id,
            lotId: data.lot_id,
            amount: data.amount,
          },
          state.currentPrice,
          state.highestBidderId
        );

        // Save bid to database
        const bid = await prisma.bids.create({
          data: {
            lot_id: data.lot_id,
            bidder_id: user.id,
            amount: new Prisma.Decimal(data.amount),
            is_winning: true,
          },
        });

        // Set previous winner bids' winning status to false
        await prisma.bids.updateMany({
          where: {
            lot_id: data.lot_id,
            id: { not: bid.id },
          },
          data: {
            is_winning: false,
          },
        });

        // Calculate anti-sniping timer extension — "waktu pertama" and "waktu
        // kedua" are read fresh on every bid so an admin can retune them
        // between lots without restarting the process.
        const [firstDurationSetting, secondDurationSetting] = await Promise.all([
          prisma.platform_settings.findFirst({ where: { key: 'auction_lot_duration_secs' } }),
          prisma.platform_settings.findFirst({ where: { key: 'auction_lot_second_duration_secs' } }),
        ]);
        const firstDurationSecs = firstDurationSetting ? parseInt(firstDurationSetting.value, 10) : 120;
        const secondDurationSecs = secondDurationSetting ? parseInt(secondDurationSetting.value, 10) : 60;
        const snipeCheck = biddingService.calculateAntiSnipe(
          state.timeRemaining,
          state.extensionCount,
          firstDurationSecs,
          secondDurationSecs
        );

        const dbUser = await prisma.users.findUnique({
          where: { id: user.id },
          select: { full_name: true },
        });
        const bidderName = dbUser?.full_name || 'Anonymous';
        const niplCode = `NIPL-${user.id.substring(0, 8).toUpperCase()}`;

        // Update lot in-memory state
        state.currentPrice = data.amount;
        state.highestBidderId = user.id;
        state.highestBidderMasked = maskUserId(user.id);
        state.highestBidderName = bidderName;
        state.highestBidderNipl = niplCode;
        state.bidsCount += 1;

        if (snipeCheck.extended) {
          state.timeRemaining = snipeCheck.newTimeRemaining;
          state.extensionCount = snipeCheck.extensionCount;
        }

        // Broadcast updated status to everyone watching the lot
        io?.to(`lot:${data.lot_id}`).emit('bid:update', {
          lot_id: state.lotId,
          current_price: state.currentPrice,
          bidder_id: state.highestBidderMasked,
          bidder_name: bidderName,
          nipl_code: niplCode,
          bidder_count: state.bidsCount,
          time_remaining: state.timeRemaining,
          extension_count: state.extensionCount,
          extended: snipeCheck.extended,
          created_at: bid.created_at.toISOString(),
        });

        // Log admin/system audit trail if needed
        logger.info({ lotId: data.lot_id, bidder: user.id, amount: data.amount }, 'New highest bid submitted');
      } catch (err: any) {
        socket.emit('bid:error', { message: err.message || 'Gagal memproses penawaran Anda.' });
      }
    });

    // `disconnecting` (not `disconnect`) fires while socket.rooms is still
    // populated, so this is the only place we can know which lot rooms need
    // their presence count adjusted for this socket leaving.
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (!room.startsWith('lot:')) continue;
        const lotId = room.slice('lot:'.length);
        const size = io!.sockets.adapter.rooms.get(room)?.size || 1;
        io!.to(room).emit('lot:presence', { lot_id: lotId, count: Math.max(0, size - 1) });
      }
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return io;
}

export function getSocketIo(): SocketIoServer | null {
  return io;
}

export function startActiveLot(lot: any, durationSeconds = 120): void {
  const ioServer = io;
  if (!ioServer) {
    logger.warn('Socket.io server has not been initialized. Skipping broadcast.');
    return;
  }

  // Clear existing if any
  const existing = activeLots.get(lot.id);
  if (existing?.timerInterval) {
    clearInterval(existing.timerInterval);
  }

  // "Waktu pertama" — the initial countdown for the lot. Callers read this
  // from the auction_lot_duration_secs setting; fall back to the historical
  // 120s default if they pass nothing.
  const effectiveDuration = durationSeconds;

  logger.info({ lotId: lot.id, effectiveDuration }, 'startActiveLot — timer starting');

  const startPrice = Number(lot.starting_price);
  const state: ActiveLotState = {
    lotId: lot.id,
    sessionId: lot.session_id,
    currentPrice: startPrice,
    bidsCount: 0,
    timeRemaining: effectiveDuration,
    extensionCount: 0,
    autoEndTrigger: 'admin', // will be fetched asynchronously
  };

  // Fetch triggers
  prisma.platform_settings.findFirst({ where: { key: 'auction_lot_end_trigger' } }).then(setting => {
    if (setting) state.autoEndTrigger = setting.value;
  });

  // Start interval loop
  state.timerInterval = setInterval(async () => {
    if (state.timeRemaining > 0) {
      state.timeRemaining -= 1;
    }

    if (state.timeRemaining <= 0) {
      if (state.autoEndTrigger === 'system') {
        clearInterval(state.timerInterval);
        activeLots.delete(lot.id);

        try {
          const settled = await closeActiveLotAndTriggerNext(lot.id);
        } catch (err) {
          logger.error({ err }, 'Error in automated lot settlement');
        }
      } else {
        // Just broadcast current timer state (0) waiting for admin
        ioServer.to(`lot:${lot.id}`).emit('bid:update', {
          lot_id: state.lotId,
          current_price: state.currentPrice,
          bidder_id: state.highestBidderMasked || '-',
          bidder_name: state.highestBidderName || '-',
          nipl_code: state.highestBidderNipl || '-',
          bidder_count: state.bidsCount,
          time_remaining: 0,
          extension_count: state.extensionCount,
        });
      }
    } else {
      // Broadcast current timer state
      ioServer.to(`lot:${lot.id}`).emit('bid:update', {
        lot_id: state.lotId,
        current_price: state.currentPrice,
        bidder_id: state.highestBidderMasked || '-',
        bidder_name: state.highestBidderName || '-',
        nipl_code: state.highestBidderNipl || '-',
        bidder_count: state.bidsCount,
        time_remaining: state.timeRemaining,
        extension_count: state.extensionCount,
      });
    }
  }, 1000);

  activeLots.set(lot.id, state);

  // Broadcast activation event — also to the session room, so control-room
  // viewers who haven't joined this specific lot's room yet (e.g. they were
  // watching the queue, not this lot) still see it go active in real time.
  ioServer.to(`lot:${lot.id}`).to(`session:${lot.session_id}`).emit('lot:activated', {
    lot_id: lot.id,
    lot_data: {
      lot_number: lot.lot_number,
      asset_title: lot.asset.title,
      starting_price: startPrice,
      category: lot.asset.category,
      images: (() => {
        let parsed: string[] = [];
        try {
          const raw = typeof lot.asset.images === 'string' ? JSON.parse(lot.asset.images) : lot.asset.images;
          if (Array.isArray(raw)) parsed = raw.filter((v) => typeof v === 'string' && v);
        } catch (e) { }
        if (parsed.length > 0) return parsed;
        return ['photo_front', 'photo_left', 'photo_right', 'photo_back', 'photo_interior', 'photo_engine']
          .map((field) => lot.asset[field])
          .filter(Boolean);
      })(),
      // Include individual photo fields for frontend fallback
      photo_front: lot.asset.photo_front || undefined,
      photo_left: lot.asset.photo_left || undefined,
      photo_right: lot.asset.photo_right || undefined,
      photo_back: lot.asset.photo_back || undefined,
      photo_interior: lot.asset.photo_interior || undefined,
      photo_engine: lot.asset.photo_engine || undefined,
    },
    start_time: new Date().toISOString(),
    duration: state.timeRemaining, // Use guarded value, never 0
  });
}

export async function closeActiveLot(lotId: string): Promise<any> {
  const ioServer = io;
  const state = activeLots.get(lotId);
  if (state) {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    activeLots.delete(lotId);
  }

  const settled = await biddingService.settleLot(lotId);

  // Trigger auto-next if configured
  await handleAutoNextAndSessionEnd(settled);

  if (!ioServer) {
    logger.warn('Socket.io server has not been initialized. Skipping broadcast.');
    return settled;
  }

  const remainingCount = await prisma.lots.count({
    where: { session_id: settled.session_id, status: { in: ['pending', 'active'] } }
  });
  const isLastLot = remainingCount === 0;

  // Broadcast closed event to room (and session room, see startActiveLot comment)
  ioServer.to(`lot:${lotId}`).to(`session:${settled.session_id}`).emit('lot:closed', {
    lot_id: lotId,
    lot_number: settled.lot_number,
    result: settled.status,
    final_price: settled.hammer_price ? Number(settled.hammer_price) : undefined,
    start_price: settled.start_price ? Number(settled.start_price) : (settled.asset?.base_price ? Number(settled.asset.base_price) : undefined),
    winner_id: settled.winner_id ? maskUserId(settled.winner_id) : undefined,
    winner_name: state?.highestBidderName || settled.winner_name || undefined,
    winner_nipl: state?.highestBidderNipl || settled.winner_nipl || undefined,
    asset_title: settled.asset?.title || undefined,
    is_last_lot: isLastLot,
    session_title: settled.session?.title || undefined,
  });

  if (settled.status === 'sold') {
    ioServer.to(`lot:${lotId}`).emit('bid:winner', {
      lot_id: lotId,
      winner_masked_id: maskUserId(settled.winner_id!),
      final_price: Number(settled.hammer_price),
      total_bids: state ? state.bidsCount : 0,
    });
  }

  return settled;
}

export async function cancelActiveLot(lotId: string): Promise<any> {
  const ioServer = io;
  const state = activeLots.get(lotId);
  if (state) {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    activeLots.delete(lotId);
  }

  const updated = await prisma.lots.update({
    where: { id: lotId },
    data: { status: 'cancelled' },
    include: { asset: true },
  });

  if (ioServer) {
    ioServer.to(`lot:${lotId}`).to(`session:${updated.session_id}`).emit('lot:cancelled', {
      lot_id: lotId,
    });
  }

  // Trigger auto-next if auto mode is enabled.
  // The cancelled lot overlay shows for 5 seconds, so we delay the auto-next by 5 seconds!
  const nextSetting = await prisma.platform_settings.findFirst({ where: { key: 'auction_lot_next_trigger' } });
  if (nextSetting?.value === 'system') {
    const freezeDurationSetting = await prisma.platform_settings.findFirst({ where: { key: 'auction_lot_canceled_duration_secs' } });
    const freezeDurationSecs = freezeDurationSetting ? parseInt(freezeDurationSetting.value, 10) : 5;
    setTimeout(async () => {
      await handleAutoNextAndSessionEnd(updated);
    }, freezeDurationSecs * 1000);
  }

  return updated;
}

export async function closeActiveLotAndTriggerNext(lotId: string): Promise<any> {
  return await closeActiveLot(lotId);
}

export async function handleAutoNextAndSessionEnd(settledLot: any) {
  try {
    const sessionId = settledLot.session_id;

    // Check if there are remaining pending or cancelled lots in this session (we must traverse cancelled lots too)
    const nextLot = await prisma.lots.findFirst({
      where: {
        session_id: sessionId,
        status: { in: ['pending', 'cancelled'] },
        lot_number: { gt: settledLot.lot_number }
      },
      orderBy: { lot_number: 'asc' },
      include: { asset: true }
    });

    if (nextLot) {
      // Auto-next trigger check
      const nextSetting = await prisma.platform_settings.findFirst({ where: { key: 'auction_lot_next_trigger' } });
      const nextDelaySetting = await prisma.platform_settings.findFirst({ where: { key: 'auction_lot_next_delay_secs' } });
      
      if (nextSetting?.value === 'system') {
        const delay = nextDelaySetting ? parseInt(nextDelaySetting.value, 10) * 1000 : 10000;
        logger.info({ lotId: nextLot.id, delayMs: delay }, 'Auto-next trigger enabled. Next lot will start shortly.');
        
        setTimeout(async () => {
          // Double check if it's still pending or cancelled
          const currentStatus = await prisma.lots.findUnique({ where: { id: nextLot.id } });
          
          if (currentStatus?.status === 'cancelled') {
            // Emits freeze event to frontend
            const ioServer = getSocketIo();
            const freezeDurationSetting = await prisma.platform_settings.findFirst({ where: { key: 'auction_lot_canceled_duration_secs' } });
            const freezeDurationSecs = freezeDurationSetting ? parseInt(freezeDurationSetting.value, 10) : 5;
            
            if (ioServer) {
              ioServer.to(`session:${sessionId}`).emit('lot:start', {
                lot_id: nextLot.id,
                is_canceled: true,
                freeze_duration_secs: freezeDurationSecs,
                lot_data: nextLot,
              });
            }

            // Auto next again after freeze
            setTimeout(() => {
               handleAutoNextAndSessionEnd(nextLot);
            }, freezeDurationSecs * 1000);

          } else if (currentStatus?.status === 'pending') {
            const updated = await prisma.lots.update({
              where: { id: nextLot.id },
              data: { status: 'active' },
              include: { asset: true }
            });
            // 120s matches the historical hardcoded lot duration.
            const durationSetting = await prisma.platform_settings.findFirst({ where: { key: 'auction_lot_duration_secs' } });
            startActiveLot(updated, durationSetting ? parseInt(durationSetting.value, 10) : 120);
          }
        }, delay);
      }
    } else {
      // No more lots. Auto-end session trigger check
      const sessionEndSetting = await prisma.platform_settings.findFirst({ where: { key: 'auction_session_end_trigger' } });
      if (sessionEndSetting?.value === 'system') {
        logger.info({ sessionId }, 'All lots finished. Auto-ending session triggered by system.');
        
        // This simulates endSession logic from control controller
        await prisma.auction_sessions.update({
          where: { id: sessionId },
          data: { status: 'closed' }
        });
        
        // Broadcast session:ended
        const ioServer = getSocketIo();
        if (ioServer) {
          const totalLotsCount = await prisma.lots.count({ where: { session_id: sessionId } });
          const soldLotsCount = await prisma.lots.count({ where: { session_id: sessionId, status: 'sold' } });
          const revenueRes = await prisma.lots.aggregate({
            where: { session_id: sessionId, status: 'sold' },
            _sum: { hammer_price: true },
          });
          ioServer.to(`session:${sessionId}`).emit('session:ended', {
            session_id: sessionId,
            total_lots: totalLotsCount,
            lots_sold: soldLotsCount,
            total_revenue: Number(revenueRes._sum.hammer_price || 0),
          });
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error handling auto-next lot or session end');
  }
}

