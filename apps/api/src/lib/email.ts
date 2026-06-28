import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false, // mailhog does not require TLS by default
  auth: env.SMTP_USER
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      }
    : undefined,
});

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using pre-configured SMTP transporter
 */
export async function sendEmail(options: SendMailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
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
