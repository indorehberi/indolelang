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
  bidsCount: number;
  timeRemaining: number;
  extensionCount: number;
  timerInterval?: NodeJS.Timeout;
}

// In-memory active lot state
export const activeLots = new Map<string, ActiveLotState>();

let io: SocketIoServer | null = null;

export function maskUserId(userId: string): string {
  return `Peserta #${userId.substring(0, 4).toUpperCase()}`;
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
    socket.on('bid:watch', (data: { lot_id: string; session_id: string }) => {
      if (!data.lot_id) return;
      socket.join(`lot:${data.lot_id}`);
      logger.debug({ socketId: socket.id, lot_id: data.lot_id }, 'Client watching lot');

      // Send current lot state immediately if lot is already active
      const state = activeLots.get(data.lot_id);
      if (state) {
        socket.emit('bid:update', {
          lot_id: state.lotId,
          current_price: state.currentPrice,
          bidder_id: state.highestBidderMasked || '-',
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

        // Calculate anti-sniping timer extension
        const snipeCheck = biddingService.calculateAntiSnipe(state.timeRemaining, state.extensionCount);

        // Update lot in-memory state
        state.currentPrice = data.amount;
        state.highestBidderId = user.id;
        state.highestBidderMasked = maskUserId(user.id);
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
          bidder_count: state.bidsCount,
          time_remaining: state.timeRemaining,
          extension_count: state.extensionCount,
          extended: snipeCheck.extended,
        });

        // Log admin/system audit trail if needed
        logger.info({ lotId: data.lot_id, bidder: user.id, amount: data.amount }, 'New highest bid submitted');
      } catch (err: any) {
        socket.emit('bid:error', { message: err.message || 'Gagal memproses penawaran Anda.' });
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

  const startPrice = Number(lot.starting_price);
  const state: ActiveLotState = {
    lotId: lot.id,
    sessionId: lot.session_id,
    currentPrice: startPrice,
    bidsCount: 0,
    timeRemaining: durationSeconds,
    extensionCount: 0,
  };

  // Start interval loop
  state.timerInterval = setInterval(async () => {
    state.timeRemaining -= 1;

    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      activeLots.delete(lot.id);

      try {
        const settled = await biddingService.settleLot(lot.id);

        // Broadcast closed event to room
        ioServer.to(`lot:${lot.id}`).emit('lot:closed', {
          lot_id: lot.id,
          result: settled.status, // 'sold' | 'unsold'
          final_price: settled.hammer_price ? Number(settled.hammer_price) : undefined,
          winner_id: settled.winner_id ? maskUserId(settled.winner_id) : undefined,
        });

        if (settled.status === 'sold') {
          ioServer.to(`lot:${lot.id}`).emit('bid:winner', {
            lot_id: lot.id,
            winner_masked_id: maskUserId(settled.winner_id!),
            final_price: Number(settled.hammer_price),
            total_bids: state.bidsCount,
          });
        }
      } catch (err) {
        logger.error({ err }, 'Error in automated lot settlement');
      }
    } else {
      // Broadcast current timer state
      ioServer.to(`lot:${lot.id}`).emit('bid:update', {
        lot_id: state.lotId,
        current_price: state.currentPrice,
        bidder_id: state.highestBidderMasked || '-',
        bidder_count: state.bidsCount,
        time_remaining: state.timeRemaining,
        extension_count: state.extensionCount,
      });
    }
  }, 1000);

  activeLots.set(lot.id, state);

  // Broadcast activation event
  ioServer.to(`lot:${lot.id}`).emit('lot:activated', {
    lot_id: lot.id,
    lot_data: {
      lot_number: lot.lot_number,
      asset_title: lot.asset.title,
      starting_price: startPrice,
      category: lot.asset.category,
      images: lot.asset.images ? JSON.parse(lot.asset.images as string) : [],
    },
    start_time: new Date().toISOString(),
    duration: durationSeconds,
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

  if (!ioServer) {
    logger.warn('Socket.io server has not been initialized. Skipping broadcast.');
    return settled;
  }

  // Broadcast closed event to room
  ioServer.to(`lot:${lotId}`).emit('lot:closed', {
    lot_id: lotId,
    result: settled.status,
    final_price: settled.hammer_price ? Number(settled.hammer_price) : undefined,
    winner_id: settled.winner_id ? maskUserId(settled.winner_id) : undefined,
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
