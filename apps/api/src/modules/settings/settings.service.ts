import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { PlatformSettingDTO } from '@indo-lelang/shared-types';
import { encrypt, decrypt } from '../../lib/encryption';

const SENSITIVE_KEYS = [
  'midtrans_server_key',
  'midtrans_client_key',
  'aws_secret_key',
  'smtp_password',
  'xendit_api_key',
  'verihubs_api_key',
  'fonnte_token',
];

export class SettingsService {
  /**
   * Get all platform settings/feature flags for a tenant
   */
  async getSettings(tenantId = 'default'): Promise<PlatformSettingDTO[]> {
    const settings = await prisma.platform_settings.findMany({
      where: { tenant_id: tenantId },
      orderBy: { key: 'asc' },
    });

    return settings.map((s) => ({
      id: s.id,
      tenant_id: s.tenant_id,
      key: s.key,
      value: s.is_encrypted ? '********' : s.value,
      is_encrypted: s.is_encrypted,
      updated_by: s.updated_by || undefined,
      updated_at: s.updated_at.toISOString(),
    }));
  }

  /**
   * Get a single setting by key (masks if encrypted)
   */
  async getSettingByKey(key: string, tenantId = 'default'): Promise<PlatformSettingDTO> {
    const setting = await prisma.platform_settings.findFirst({
      where: { tenant_id: tenantId, key },
    });

    if (!setting) {
      throw new AppError(404, ErrorCode.NOT_FOUND, `Setting key "${key}" tidak ditemukan`);
    }

    return {
      id: setting.id,
      tenant_id: setting.tenant_id,
      key: setting.key,
      value: setting.is_encrypted ? '********' : setting.value,
      is_encrypted: setting.is_encrypted,
      updated_by: setting.updated_by || undefined,
      updated_at: setting.updated_at.toISOString(),
    };
  }

  /**
   * Get a decrypted setting value for internal backend use only
   */
  async getDecryptedSetting(key: string, tenantId = 'default'): Promise<string | null> {
    const setting = await prisma.platform_settings.findFirst({
      where: { tenant_id: tenantId, key },
    });

    if (!setting) {
      return null;
    }

    if (setting.is_encrypted) {
      return decrypt(setting.value);
    }

    return setting.value;
  }

  /**
   * Update or create a platform setting (Admin only)
   */
  async updateSetting(key: string, value: string, userId: string, tenantId = 'default'): Promise<PlatformSettingDTO> {
    const setting = await prisma.platform_settings.findFirst({
      where: { tenant_id: tenantId, key },
    });

    const isSensitive = SENSITIVE_KEYS.includes(key);

    // If it's sensitive and the frontend passes the mask back or empty string, ignore the update
    if (isSensitive && (value === '********' || value === '')) {
      return this.getSettingByKey(key, tenantId);
    }

    const finalValue = isSensitive ? encrypt(value) : value;

    let updated;
    if (setting) {
      updated = await prisma.platform_settings.update({
        where: { id: setting.id },
        data: {
          value: finalValue,
          is_encrypted: isSensitive,
          updated_by: userId,
        },
      });
    } else {
      updated = await prisma.platform_settings.create({
        data: {
          tenant_id: tenantId,
          key,
          value: finalValue,
          is_encrypted: isSensitive,
          updated_by: userId,
        },
      });
    }

    return {
      id: updated.id,
      tenant_id: updated.tenant_id,
      key: updated.key,
      value: updated.is_encrypted ? '********' : updated.value,
      is_encrypted: updated.is_encrypted,
      updated_by: updated.updated_by || undefined,
      updated_at: updated.updated_at.toISOString(),
    };
  }
}
