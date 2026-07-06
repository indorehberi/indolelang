import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';

export interface NiplAllocationsDTO {
  mobil: {
    total_nipl_purchased: number;
    total_nipl_allocated: number;
    total_nipl_used: number;
    free_nipl: number;
  };
  motor: {
    total_nipl_purchased: number;
    total_nipl_allocated: number;
    total_nipl_used: number;
    free_nipl: number;
  };
  allocations: Array<{
    id: string;
    session_id: string;
    session_title: string;
    session_status: string;
    unit_type: string;
    allocated_quantity: number;
    used_quantity: number;
    unused_quantity: number;
  }>;
}

export class NiplService {
  /**
   * Get all NIPL allocations and status for a user
   */
  async getNiplStatus(userId: string): Promise<NiplAllocationsDTO> {
    const deposits = await prisma.deposits.findMany({
      where: {
        user_id: userId,
        status: 'paid',
      },
    });

    const getPurchased = (type: string) => deposits
      .filter(d => d.unit_type === type)
      .reduce((sum, dep) => sum + (dep.package_type === 'unlimited' ? 999 : parseInt(dep.package_type || '0')), 0);

    const purchasedMobil = getPurchased('mobil');
    const purchasedMotor = getPurchased('motor');

    const allocations = await prisma.nipl_allocations.findMany({
      where: { user_id: userId },
      include: {
        session: true,
      },
    });

    const getAllocated = (type: string) => allocations
      .filter(a => a.unit_type === type)
      .reduce((sum, al) => sum + al.allocated_quantity, 0);
      
    const getUsed = (type: string) => allocations
      .filter(a => a.unit_type === type)
      .reduce((sum, al) => sum + al.used_quantity, 0);

    const allocatedMobil = getAllocated('mobil');
    const allocatedMotor = getAllocated('motor');

    const freeMobil = purchasedMobil - allocatedMobil;
    const freeMotor = purchasedMotor - allocatedMotor;

    return {
      mobil: {
        total_nipl_purchased: purchasedMobil,
        total_nipl_allocated: allocatedMobil,
        total_nipl_used: getUsed('mobil'),
        free_nipl: freeMobil >= 0 ? freeMobil : 0,
      },
      motor: {
        total_nipl_purchased: purchasedMotor,
        total_nipl_allocated: allocatedMotor,
        total_nipl_used: getUsed('motor'),
        free_nipl: freeMotor >= 0 ? freeMotor : 0,
      },
      allocations: allocations.map((al) => ({
        id: al.id,
        session_id: al.session_id,
        session_title: al.session?.title || 'Sesi Lelang',
        session_status: al.session?.status || 'unknown',
        unit_type: al.unit_type,
        allocated_quantity: al.allocated_quantity,
        used_quantity: al.used_quantity,
        unused_quantity: al.allocated_quantity - al.used_quantity,
      })),
    };
  }

  /**
   * Allocate free NIPLs to a specific session
   */
  async allocateNipl(
    userId: string,
    sessionId: string,
    unit_type: string,
    quantity: number
  ): Promise<any> {
    // 1. Verify session exists and is not closed
    const session = await prisma.auction_sessions.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }
    if (session.status === 'closed') {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        'Sesi lelang sudah selesai, tidak dapat mengalokasikan NIPL'
      );
    }

    // 2. Get current free NIPL count
    const status = await this.getNiplStatus(userId);
    const freeNipl = unit_type === 'motor' ? status.motor.free_nipl : status.mobil.free_nipl;
    if (quantity > freeNipl) {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        `Saldo NIPL bebas tidak mencukupi. Anda hanya memiliki ${freeNipl} NIPL bebas untuk unit ${unit_type}.`
      );
    }

    // 3. Upsert allocation record
    const allocation = await prisma.nipl_allocations.upsert({
      where: {
        user_id_session_id_unit_type: {
          user_id: userId,
          session_id: sessionId,
          unit_type: unit_type,
        },
      },
      create: {
        user_id: userId,
        session_id: sessionId,
        unit_type: unit_type,
        allocated_quantity: quantity,
        used_quantity: 0,
      },
      update: {
        allocated_quantity: {
          increment: quantity,
        },
      },
    });

    return allocation;
  }

  /**
   * Move unused NIPL from one session to another
   */
  async reallocateNipl(
    userId: string,
    fromSessionId: string,
    toSessionId: string,
    unit_type: string,
    quantity: number
  ): Promise<any> {
    if (fromSessionId === toSessionId) {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        'Sesi asal dan tujuan pemindahan NIPL tidak boleh sama'
      );
    }

    // Verify destination session is active/open
    const toSession = await prisma.auction_sessions.findUnique({
      where: { id: toSessionId },
    });
    if (!toSession) {
      throw new AppError(
        404,
        ErrorCode.NOT_FOUND,
        'Sesi lelang tujuan tidak ditemukan'
      );
    }
    if (toSession.status === 'closed') {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        'Sesi lelang tujuan sudah ditutup'
      );
    }

    // Get current allocation on fromSessionId
    const fromAlloc = await prisma.nipl_allocations.findUnique({
      where: {
        user_id_session_id_unit_type: {
          user_id: userId,
          session_id: fromSessionId,
          unit_type: unit_type,
        },
      },
    });

    if (!fromAlloc) {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        'Anda tidak memiliki alokasi NIPL pada sesi asal tersebut'
      );
    }

    const unusedQuantity = fromAlloc.allocated_quantity - fromAlloc.used_quantity;
    if (quantity > unusedQuantity) {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        `NIPL tidak terpakai pada sesi asal tidak mencukupi. Anda hanya memiliki ${unusedQuantity} NIPL tidak terpakai di sesi tersebut.`
      );
    }

    // Perform transaction update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement allocation on fromSession
      const updatedFrom = await tx.nipl_allocations.update({
        where: { id: fromAlloc.id },
        data: {
          allocated_quantity: {
            decrement: quantity,
          },
        },
      });

      // 2. Increment allocation on toSession
      const updatedTo = await tx.nipl_allocations.upsert({
        where: {
          user_id_session_id_unit_type: {
            user_id: userId,
            session_id: toSessionId,
            unit_type: unit_type,
          },
        },
        create: {
          user_id: userId,
          session_id: toSessionId,
          unit_type: unit_type,
          allocated_quantity: quantity,
          used_quantity: 0,
        },
        update: {
          allocated_quantity: {
            increment: quantity,
          },
        },
      });

      return { updatedFrom, updatedTo };
    });

    return result;
  }
}
