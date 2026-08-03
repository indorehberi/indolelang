import { prisma } from '../config/database';
import { FeatureToggle, FEATURE_TOGGLE_DEFAULTS } from '@indo-lelang/shared-types';
import { logger } from './logger';

/**
 * Pengiriman OTP dan notifikasi lewat WhatsApp.
 *
 * Sengaja TIDAK didaftarkan di FEATURE_TOGGLE_DEFAULTS: kunci yang tidak
 * dikenal jatuh ke `false` di bawah, jadi WhatsApp mati kecuali admin
 * menyalakannya sendiri di Pengaturan Platform. Mematikan lewat ketiadaan
 * lebih aman daripada lewat nilai bawaan yang bisa terlewat diubah.
 */
export const FEAT_WHATSAPP_OTP = 'feat_whatsapp_otp';

/**
 * Check if a feature toggle is enabled.
 * If not set in the database, falls back to the default values defined in shared-types.
 */
export async function isFeatureEnabled(
  key: FeatureToggle | string,
  tenantId = 'default'
): Promise<boolean> {
  try {
    const setting = await prisma.platform_settings.findFirst({
      where: {
        tenant_id: tenantId,
        key: key,
      },
    });

    if (setting) {
      return setting.value === 'true' || setting.value === '1' || setting.value === 'on';
    }
  } catch (error) {
    logger.error({ error, key, tenantId }, 'Error checking feature toggle in database');
  }

  // Fallback to defaults
  const enumKey = key as FeatureToggle;
  if (enumKey in FEATURE_TOGGLE_DEFAULTS) {
    return FEATURE_TOGGLE_DEFAULTS[enumKey];
  }

  return false;
}
