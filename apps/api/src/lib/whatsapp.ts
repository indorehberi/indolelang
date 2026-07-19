import { env } from '../config/env';
import { logger } from './logger';
import { SettingsService } from '../modules/settings/settings.service';

const settingsService = new SettingsService();

/**
 * Format phone number to Indonesian format (e.g., starts with 62)
 * Handles input like: "08123456789", "+628123456789", "628123456789"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.slice(1);
  }
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  // Default fallback if it doesn't match standard patterns
  return cleaned;
}

/**
 * Internal function to send WhatsApp message via Fonnte API or log mock in dev.
 */
async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const formattedPhone = formatPhoneNumber(phone);
  
  // Retrieve token: DB setting takes priority over env variable
  const token = (await settingsService.getDecryptedSetting('fonnte_token')) || env.FONNTE_TOKEN;

  // Development simulation mode:
  // If token is missing, or we are in development and SEND_REAL_OTP is not explicitly 'true'
  const isDevMode = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
  const sendRealOtp = process.env.SEND_REAL_OTP === 'true';

  if (!token || (isDevMode && !sendRealOtp)) {
    logger.info(
      { phone: formattedPhone, message, mock: true },
      `[WhatsApp OTP Mock] Pesan simulasi terkirim ke nomor ${formattedPhone}: "${message}"`
    );
    return true;
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
      }),
    });

    const data = (await response.json().catch(() => null)) as any;

    if (response.ok && data?.status === true) {
      logger.info({ phone: formattedPhone }, 'WhatsApp message sent successfully via Fonnte');
      return true;
    } else {
      logger.error(
        { phone: formattedPhone, status: response.status, response: data },
        'Fonnte API failed to send WhatsApp message'
      );
      return false;
    }
  } catch (error) {
    logger.error({ error, phone: formattedPhone }, 'Network error calling Fonnte API');
    return false;
  }
}

/**
 * Send WhatsApp OTP message to user
 */
export async function sendWhatsAppOtp(phone: string, otpCode: string): Promise<boolean> {
  const message = `[Indo-Lelang] Kode OTP Anda adalah: ${otpCode}. Rahasiakan kode ini dari siapapun. Berlaku selama 5 menit.`;
  return sendWhatsApp(phone, message);
}

/**
 * Send general WhatsApp notification
 */
export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  return sendWhatsApp(phone, message);
}
