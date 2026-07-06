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
 * Get dynamic SMTP Transporter
 */
async function getTransporter() {
  const host = await settingsService.getDecryptedSetting('smtp_host') || env.SMTP_HOST;
  const port = parseInt(await settingsService.getDecryptedSetting('smtp_port') || env.SMTP_PORT?.toString() || '587');
  const user = await settingsService.getDecryptedSetting('smtp_user') || env.SMTP_USER;
  const pass = await settingsService.getDecryptedSetting('smtp_password') || env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

/**
 * Send an email using pre-configured SMTP transporter
 */
export async function sendEmail(options: SendMailOptions): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    const fromAddress = await settingsService.getDecryptedSetting('smtp_from') || env.SMTP_FROM || '"Indo Lelang" <noreply@indo-lelang.com>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
    return true;
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email');
    return false;
  }
}
