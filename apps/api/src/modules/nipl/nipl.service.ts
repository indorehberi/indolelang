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
  allocations: Array<any>;
}

export class NiplService {
  /**
   * Get all NIPL status for a user
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
      .reduce((sum, dep) => sum + (dep.package_type === 'unlimited' ? 5 : parseInt(dep.package_type || '0')), 0);

    const purchasedMobil = getPurchased('mobil');
    const purchasedMotor = getPurchased('motor');

    // NIPL is now global. Allocated is 0, free is total purchased.
    return {
      mobil: {
        total_nipl_purchased: purchasedMobil,
        total_nipl_allocated: 0,
        total_nipl_used: 0,
        free_nipl: purchasedMobil,
      },
      motor: {
        total_nipl_purchased: purchasedMotor,
        total_nipl_allocated: 0,
        total_nipl_used: 0,
        free_nipl: purchasedMotor,
      },
      allocations: [],
    };
  }

  async allocateNipl(
    userId: string,
    sessionId: string,
    unit_type: string,
    quantity: number
  ): Promise<any> {
    throw new AppError(400, ErrorCode.BAD_REQUEST, 'Fitur alokasi NIPL telah dihapus. NIPL berlaku global untuk seluruh sesi.');
  }

  async reallocateNipl(
    userId: string,
    fromSessionId: string,
    toSessionId: string,
    unit_type: string,
    quantity: number
  ): Promise<any> {
    throw new AppError(400, ErrorCode.BAD_REQUEST, 'Fitur alokasi NIPL telah dihapus.');
  }
}
