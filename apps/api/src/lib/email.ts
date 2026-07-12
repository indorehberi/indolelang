import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';
import { SettingsService } from '../modules/settings/settings.service';

const settingsService = new SettingsService();

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Get dynamic SMTP Transporter.
 * Priority: DB settings (platform_settings) → environment variables.
 */
async function getTransporter() {
  const host = await settingsService.getDecryptedSetting('smtp_host') || env.SMTP_HOST;
  const port = parseInt(await settingsService.getDecryptedSetting('smtp_port') || env.SMTP_PORT?.toString() || '587');
  const user = await settingsService.getDecryptedSetting('smtp_user') || env.SMTP_USER;
  const pass = await settingsService.getDecryptedSetting('smtp_password') || env.SMTP_PASS;
  const from = await settingsService.getDecryptedSetting('smtp_from') || env.SMTP_FROM || '"Indo Lelang" <noreply@indo-lelang.com>';

  if (!host || host === 'localhost') {
    logger.warn('SMTP_HOST is not configured for production email delivery. Email will fail.');
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    }),
    fromAddress: from,
  };
}

/**
 * Send an email using pre-configured SMTP transporter.
 * Throws an error if the email cannot be sent so callers can react appropriately.
 */
export async function sendEmail(options: SendMailOptions): Promise<boolean> {
  const { transporter, fromAddress } = await getTransporter();

  const info = await transporter.sendMail({
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
  return true;
}

/**
 * Non-critical version that catches and logs errors without throwing.
 * Use for fire-and-forget notifications (bid win, payment, etc.)
 */
export async function sendEmailSafe(options: SendMailOptions): Promise<boolean> {
  try {
    return await sendEmail(options);
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email (non-critical)');
    return false;
  }
}
