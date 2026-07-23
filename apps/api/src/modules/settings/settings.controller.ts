import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';
import { sendEmail } from '../../lib/email';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { sendWhatsAppTest } from '../../lib/whatsapp';
import { env } from '../../config/env';

const settingsService = new SettingsService();

export class SettingsController {
  /**
   * Get all settings (Admin/Superadmin only)
   */
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.query.tenant_id as string) || 'default';
      const settings = await settingsService.getSettings(tenantId);
      sendSuccess(res, settings, 'Platform settings berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single setting value by key
   */
  async getSettingByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const tenantId = (req.query.tenant_id as string) || 'default';
      const setting = await settingsService.getSettingByKey(key, tenantId);
      sendSuccess(res, setting, `Setting untuk ${key} berhasil dimuat`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update platform setting (Admin/Superadmin only)
   * Write audit log
   */
  async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const userId = req.user!.id;
      const tenantId = (req.query.tenant_id as string) || 'default';

      let oldSetting = null;
      try {
        oldSetting = await settingsService.getSettingByKey(key, tenantId);
      } catch (err) {
        // setting doesn't exist yet, which is fine
      }

      const updatedSetting = await settingsService.updateSetting(key, value, userId, tenantId);

      // Write admin action audit trail
      logAdminAction(
        req,
        'UPDATE_PLATFORM_SETTING',
        'platform_settings',
        updatedSetting.id,
        oldSetting ? { value: oldSetting.value } : null,
        { value: updatedSetting.value }
      );

      sendSuccess(res, updatedSetting, `Setting ${key} berhasil diperbarui`);
    } catch (error) {
      next(error);
    }
  }
  /**
   * Send a test email using the current SMTP configuration in the database
   */
  async testEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const to = req.body?.to || req.user?.email;
      if (!to) {
        throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Alamat email tujuan harus diisi');
      }

      await sendEmail({
        to,
        subject: '[Test] Konfigurasi SMTP Indo-Lelang',
        text: 'Ini adalah email pengujian dari sistem Indo-Lelang. Jika Anda menerima email ini, konfigurasi SMTP Anda sudah benar.',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2f855a;">✅ Konfigurasi SMTP Berhasil!</h2>
            <p>Halo,</p>
            <p>Ini adalah email pengujian dari sistem <strong>Indo-Lelang</strong>.</p>
            <p>Jika Anda menerima email ini, konfigurasi SMTP yang Anda simpan di Pengaturan Platform sudah bekerja dengan benar.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #888; font-size: 0.85em;">Dikirim dari: Indo-Lelang Admin Panel &bull; ${new Date().toLocaleString('id-ID')}</p>
          </div>
        `,
      });

      logAdminAction(req, 'TEST_EMAIL_SENT', 'platform_settings', 'smtp', null, { to });
      sendSuccess(res, { to }, `Email uji berhasil dikirim ke ${to}`);
    } catch (error: any) {
      // Surface the real SMTP error message to help admin diagnose the issue
      next(new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Gagal mengirim email uji: ${error?.message || 'Unknown error'}. Periksa konfigurasi SMTP Anda.`
      ));
    }
  }

  /**
   * Send a test WhatsApp message using the current Fonnte configuration
   */
  async testWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { to } = req.body;
      if (!to) {
        throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Nomor WhatsApp tujuan harus diisi');
      }

      const token = (await settingsService.getDecryptedSetting('fonnte_token')) || env.FONNTE_TOKEN;
      const isDevMode = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
      const sendRealOtp = process.env.SEND_REAL_OTP === 'true';
      const isMock = !token || (isDevMode && !sendRealOtp);

      const result = await sendWhatsAppTest(
        to,
        `[Test] Halo! Ini adalah pesan WhatsApp pengujian dari sistem Indo-Lelang. Jika Anda menerima pesan ini, konfigurasi Fonnte WhatsApp Gateway Anda sudah benar.`
      );

      if (result.success) {
        logAdminAction(req, 'TEST_WHATSAPP_SENT', 'platform_settings', 'fonnte', null, { to, isMock });
        sendSuccess(
          res,
          { to, isMock },
          result.message
        );
      } else {
        throw new AppError(
          500,
          ErrorCode.INTERNAL_SERVER_ERROR,
          result.message
        );
      }
    } catch (error: any) {
      next(error);
    }
  }
}

export default SettingsController;
