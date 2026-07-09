import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';
import { Role, UserStatus } from '@indo-lelang/shared-types';
import { SettingsService } from '../settings/settings.service';

const usersService = new UsersService();
const settingsService = new SettingsService();

export class UsersController {
  /**
   * Get list of all users (Admin only)
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, per_page, role, status, search, provider_status } = req.query as any;
      const { users, meta } = await usersService.getUsers(
        page,
        per_page,
        role as string,
        status as UserStatus,
        search,
        provider_status
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
      const userId = (req as any).user!.id;
      const user = await usersService.getUserById(userId);
      
      const bankInquiryMode = await settingsService.getDecryptedSetting('bank_inquiry_mode') || 'manual';
      
      sendSuccess(res, { ...user, bank_inquiry_mode: bankInquiryMode }, 'Profil berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update own profile details
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const updatedUser = await usersService.updateUser(userId, req.body);
      sendSuccess(res, updatedUser, 'Profil berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate bank account (Simulasi Xendit Name Validator)
   */
  async validateBankAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bank_code, account_no } = req.body;
      
      if (!bank_code || !account_no) {
        res.status(400).json({ success: false, error: { message: 'Bank code dan nomor rekening wajib diisi' } });
        return;
      }

      const bankInquiryMode = await settingsService.getDecryptedSetting('bank_inquiry_mode') || 'manual';
      
      if (bankInquiryMode === 'manual') {
        res.status(403).json({ success: false, error: { message: 'Fitur validasi bank tidak aktif' } });
        return;
      }

      // TODO: Implement actual Xendit API request using xendit_api_key.
      // For now, simulating API call as requested by previous flow if 'auto' is selected, 
      // but requiring manual input via frontend if 'manual'.
      
      const xenditApiKey = await settingsService.getDecryptedSetting('xendit_api_key');
      if (!xenditApiKey) {
        res.status(500).json({ success: false, error: { message: 'Xendit API Key belum dikonfigurasi oleh Admin' } });
        return;
      }

      // Simulasi delay jaringan Xendit Name Validator (1 detik)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulasi validasi jika nomor rekening kurang dari 5 karakter dianggap salah
      if (account_no.length < 5) {
        res.status(404).json({
          success: false,
          error: { message: "Rekening tidak ditemukan atau tidak valid" }
        });
        return;
      }

      // Simulasi berhasil, mengembalikan nama user dari profil yang login agar sesuai
      const userId = (req as any).user!.id;
      const user = await usersService.getUserById(userId);
      const simulatedName = user.full_name.toUpperCase();

      sendSuccess(res, { 
        bank_code,
        account_no,
        account_name: simulatedName 
      }, 'Rekening valid');
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

  /**
   * Admin approves/rejects provider status upgrade request
   */
  async updateProviderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, provider_fee_type, provider_fee_amount, pmk41_paid_by_provider, rejection_reason } = req.body;
      const reviewerId = (req as any).user!.id;

      const oldUser = await usersService.getUserById(id);
      const updatedUser = await usersService.updateProviderStatus(id, status, {
        provider_fee_type,
        provider_fee_amount,
        pmk41_paid_by_provider,
      }, rejection_reason, reviewerId);

      // Write admin action audit trail
      logAdminAction(
        req,
        'UPDATE_PROVIDER_STATUS',
        'users',
        id,
        { provider_status: oldUser.provider_status, role: oldUser.role },
        { provider_status: updatedUser.provider_status, role: updatedUser.role }
      );

      sendSuccess(res, updatedUser, `Pengajuan provider berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin creates a user
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newUser = await usersService.createUser(req.body);

      logAdminAction(
        req,
        'CREATE_USER',
        'users',
        newUser.id,
        null,
        newUser
      );

      sendSuccess(res, newUser, 'Pengguna berhasil dibuat', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin updates a user
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const oldUser = await usersService.getUserById(id);
      const updatedUser = await usersService.adminUpdateUser(id, req.body);

      logAdminAction(
        req,
        'UPDATE_USER',
        'users',
        id,
        oldUser,
        updatedUser
      );

      sendSuccess(res, updatedUser, 'Pengguna berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin deletes a user
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const oldUser = await usersService.getUserById(id);
      
      await usersService.deleteUser(id);

      logAdminAction(
        req,
        'DELETE_USER',
        'users',
        id,
        oldUser,
        null
      );

      sendSuccess(res, null, 'Pengguna berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}

export default UsersController;
