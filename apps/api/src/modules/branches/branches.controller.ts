import { Request, Response, NextFunction } from 'express';
import { BranchesService } from './branches.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';

const branchesService = new BranchesService();

export class BranchesController {
  /**
   * Get all branches (Public or Admin)
   */
  async getBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const isActive = req.query.is_active !== undefined 
        ? req.query.is_active === 'true'
        : undefined;

      const { branches, meta } = await branchesService.getBranches(page, perPage, 'default', isActive);
      sendSuccess(res, branches, 'Daftar cabang berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get branch details by ID
   */
  async getBranchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const branch = await branchesService.getBranchById(id);
      sendSuccess(res, branch, 'Detail cabang berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new branch (Admin only)
   * Log action
   */
  async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchesService.createBranch(req.body);

      // Log admin audit trail
      logAdminAction(req, 'CREATE_BRANCH', 'branches', branch.id, null, branch);

      sendSuccess(res, branch, 'Cabang baru berhasil dibuat', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update branch details (Admin only)
   * Log action
   */
  async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const oldBranch = await branchesService.getBranchById(id);
      const branch = await branchesService.updateBranch(id, req.body);

      // Log admin audit trail
      logAdminAction(req, 'UPDATE_BRANCH', 'branches', id, oldBranch, branch);

      sendSuccess(res, branch, 'Detail cabang berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle branch status (Admin only)
   */
  async toggleBranchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const oldBranch = await branchesService.getBranchById(id);
      const newStatus = !oldBranch.is_active;
      const branch = await branchesService.updateBranch(id, { is_active: newStatus });

      // Log admin audit trail
      logAdminAction(req, 'TOGGLE_BRANCH_STATUS', 'branches', id, oldBranch, branch);

      sendSuccess(res, branch, `Status cabang berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}`);
    } catch (error) {
      next(error);
    }
  }
}

export default BranchesController;
