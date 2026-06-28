import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';
import { Role, UserStatus } from '@indo-lelang/shared-types';

const usersService = new UsersService();

export class UsersController {
  /**
   * Get list of all users (Admin only)
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, per_page, role, status, search } = req.query as any;
      const { users, meta } = await usersService.getUsers(
        page,
        per_page,
        role as Role,
        status as UserStatus,
        search
      );
      sendSuccess(res, users, 'Daftar pengguna berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await usersService.getUserById(userId);
      sendSuccess(res, user, 'Profil berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update own profile details
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const updatedUser = await usersService.updateUser(userId, req.body);
      sendSuccess(res, updatedUser, 'Profil berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user details (Admin only)
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);
      sendSuccess(res, user, 'Detail pengguna berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user status (Admin only)
   * Must write audit logs
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const oldUser = await usersService.getUserById(id);
      const updatedUser = await usersService.updateUserStatus(id, status);

      // Write admin action audit trail
      logAdminAction(
        req,
        'UPDATE_USER_STATUS',
        'users',
        id,
        { status: oldUser.status },
        { status: updatedUser.status }
      );

      sendSuccess(res, updatedUser, 'Status pengguna berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }
}

export default UsersController;
