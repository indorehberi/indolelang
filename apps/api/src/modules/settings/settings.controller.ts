import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';

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
}

export default SettingsController;
