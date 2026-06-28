import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from './appError';
import { logger } from './logger';
import { ErrorCode } from '@indo-lelang/utils';

export interface ChargeVaParams {
  orderId: string;
  amount: number;
  bank: 'bca' | 'bni' | 'bri' | 'permata' | 'mandiri';
  expiryMinutes?: number;
}

export interface ChargeVaResponse {
  order_id: string;
  va_number: string;
  va_bank: string;
  payment_method: string;
  raw_response: any;
}

export class MidtransClient {
  private getBaseUrl(): string {
    return env.MIDTRANS_IS_PRODUCTION
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';
  }

  private getAuthHeader(): string {
    const serverKey = env.MIDTRANS_SERVER_KEY || 'dummy-server-key';
    const credentials = Buffer.from(`${serverKey}:`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Request Midtrans Core API to charge Virtual Account
   */
  async chargeVirtualAccount(params: ChargeVaParams): Promise<ChargeVaResponse> {
    const baseUrl = this.getBaseUrl();
    const authHeader = this.getAuthHeader();
    const expiryMinutes = params.expiryMinutes || 60;

    let payload: any = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: Math.ceil(params.amount),
      },
      custom_expiry: {
        expiry_duration: expiryMinutes,
        unit: 'minute',
      },
    };

    if (env.MIDTRANS_NOTIFICATION_URL) {
      payload.override_notification_url = env.MIDTRANS_NOTIFICATION_URL;
    }

    if (params.bank === 'mandiri') {
      payload.payment_type = 'echannel';
      payload.echannel = {
        bill_info1: 'Deposit NIPL',
        bill_info2: 'Indo-Lelang',
      };
    } else if (params.bank === 'permata') {
      payload.payment_type = 'bank_transfer';
      payload.bank_transfer = {
        bank: 'permata',
      };
    } else {
      payload.payment_type = 'bank_transfer';
      payload.bank_transfer = {
        bank: params.bank,
      };
    }

    try {
      logger.info({ orderId: params.orderId, bank: params.bank }, 'Charging Midtrans VA...');
      const response = await fetch(`${baseUrl}/v2/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as any;

      if (!response.ok || (data.status_code && data.status_code !== '201')) {
        logger.error({ errorData: data, status: response.status }, 'Midtrans VA charge failed');
        throw new AppError(
          502,
          ErrorCode.INTERNAL_SERVER_ERROR,
          data.status_message || 'Terjadi kesalahan pada Payment Gateway'
        );
      }

      let vaNumber = '';
      let vaBank = params.bank;

      if (params.bank === 'mandiri') {
        // For mandiri echannel, bill_key is the va_number, and biller_code is company code.
        // We will combine them or store bill_key. Let's store biller_code + bill_key or just bill_key.
        // For unified VA display, we will use bill_key (typically 10-13 digits)
        vaNumber = data.bill_key || '';
      } else if (params.bank === 'permata') {
        vaNumber = data.permata_va_number || '';
      } else if (data.va_numbers && data.va_numbers.length > 0) {
        vaNumber = data.va_numbers[0].va_number || '';
        vaBank = data.va_numbers[0].bank || params.bank;
      }

      return {
        order_id: data.order_id || params.orderId,
        va_number: vaNumber,
        va_bank: vaBank,
        payment_method: params.bank === 'mandiri' ? 'bill_payment' : 'virtual_account',
        raw_response: data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error }, 'Failed to charge Midtrans VA');
      throw new AppError(
        502,
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Gagal menghubungkan ke Midtrans'
      );
    }
  }

  /**
   * Verify Midtrans Signature Key to prevent webhook spoofing
   */
  verifyWebhookSignature(notification: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean {
    const serverKey = env.MIDTRANS_SERVER_KEY || 'dummy-server-key';
    const computedSignature = crypto
      .createHash('sha512')
      .update(notification.order_id + notification.status_code + notification.gross_amount + serverKey)
      .digest('hex');

    return computedSignature === notification.signature_key;
  }
}

export const midtransClient = new MidtransClient();
