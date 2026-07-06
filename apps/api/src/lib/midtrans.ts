import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from './appError';
import { logger } from './logger';
import { ErrorCode } from '@indo-lelang/utils';

import { SettingsService } from '../modules/settings/settings.service';

const settingsService = new SettingsService();

export interface ChargeVaParams {
  orderId: string;
  amount: number;
  bank: 'bca' | 'bni' | 'bri' | 'permata' | 'mandiri' | 'qris';
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

  private async getAuthHeader(): Promise<string> {
    const dbKey = await settingsService.getDecryptedSetting('midtrans_server_key');
    const serverKey = dbKey || env.MIDTRANS_SERVER_KEY || 'dummy-server-key';
    const credentials = Buffer.from(`${serverKey}:`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Request Midtrans Core API to charge Virtual Account
   */
  async chargeVirtualAccount(params: ChargeVaParams): Promise<ChargeVaResponse> {
    const baseUrl = this.getBaseUrl();
    const authHeader = await this.getAuthHeader();
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

    if (params.bank === 'qris') {
      payload.payment_type = 'qris';
      payload.qris = {
        acquirer: 'gopay',
      };
    } else if (params.bank === 'mandiri') {
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

      if (params.bank === 'qris') {
        const qrAction = data.actions?.find((a: any) => a.name === 'generate-qr-code');
        vaNumber = qrAction?.url || data.qr_string || '';
      } else if (params.bank === 'mandiri') {
        // For mandiri echannel, bill_key is the va_number, and biller_code is company code.
        // We will combine them or store bill_key. Let's store bill_key.
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
        payment_method: params.bank === 'qris' ? 'qris' : params.bank === 'mandiri' ? 'bill_payment' : 'virtual_account',
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
  async verifyWebhookSignature(notification: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): Promise<boolean> {
    // Bypass verification in development mode to allow easy local simulator mock webhooks
    if (env.NODE_ENV === 'development' && (!notification.signature_key || notification.signature_key === 'dev-bypass')) {
      return true;
    }

    const dbKey = await settingsService.getDecryptedSetting('midtrans_server_key');
    const serverKey = dbKey || env.MIDTRANS_SERVER_KEY || 'dummy-server-key';
    const computedSignature = crypto
      .createHash('sha512')
      .update(notification.order_id + notification.status_code + notification.gross_amount + serverKey)
      .digest('hex');

    return computedSignature === notification.signature_key;
  }

  /**
   * Request Midtrans Iris API to create a Payout (Disbursement)
   */
  async createPayout(params: {
    reference_no: string;
    amount: number;
    bank_code: string;
    account_name: string;
    account_number: string;
    description: string;
    email?: string;
  }): Promise<any> {
    const irisUrl = env.MIDTRANS_IS_PRODUCTION
      ? 'https://app.midtrans.com/iris/api/v1/payouts'
      : 'https://app.sandbox.midtrans.com/iris/api/v1/payouts';
      
    // Midtrans Iris usually requires an Approver Key / Creator Key. 
    // We will use the generic server key or dummy for simulation.
    const authHeader = await this.getAuthHeader();

    if (env.NODE_ENV === 'development') {
      logger.info(params, 'Using Mock Midtrans Iris for payout');
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1000));
      return { status: 'COMPLETED', reference_no: params.reference_no };
    }

    try {
      logger.info({ reference_no: params.reference_no }, 'Creating Midtrans Iris Payout...');
      const response = await fetch(irisUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
          'X-Idempotency-Key': params.reference_no
        },
        body: JSON.stringify({
          payouts: [
            {
              beneficiary_name: params.account_name,
              beneficiary_account: params.account_number,
              beneficiary_bank: params.bank_code.toLowerCase(),
              beneficiary_email: params.email || 'finance@indo-lelang.com',
              amount: params.amount.toString(),
              notes: params.description
            }
          ]
        }),
      });

      const data = await response.json() as any;
      if (!response.ok) {
        logger.error({ errorData: data }, 'Midtrans Iris payout failed');
        throw new AppError(
          502,
          'PAYOUT_FAILED',
          data.error_message || 'Pencairan dana via Midtrans Iris gagal'
        );
      }

      return { status: 'COMPLETED', reference_no: params.reference_no, raw: data };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error }, 'Failed to call Midtrans Iris API');
      throw new AppError(
        502,
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Gagal menghubungkan ke Midtrans Iris'
      );
    }
  }
}

export const midtransClient = new MidtransClient();
