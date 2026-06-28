import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from './appError';
import { logger } from './logger';
import { ErrorCode } from '@indo-lelang/utils';

export interface DisburseParams {
  externalId: string;
  amount: number;
  bankCode: string;
  accountHolderName: string;
  accountNumber: string;
  description: string;
}

export interface DisburseResponse {
  id: string;
  external_id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  bank_code: string;
  account_holder_name: string;
  disbursement_description: string;
  failure_code?: string;
}

export class XenditClient {
  private getAuthHeader(): string {
    const apiKey = env.XENDIT_API_KEY || 'dummy-xendit-api-key';
    const credentials = Buffer.from(`${apiKey}:`).toString('base64');
    return `Basic ${credentials}`;
  }

  async createDisbursement(params: DisburseParams): Promise<DisburseResponse> {
    const authHeader = this.getAuthHeader();
    
    // Fallback Mock mode if no active Xendit API key is provided
    if (!env.XENDIT_API_KEY || env.XENDIT_API_KEY === 'dummy-xendit-api-key') {
      logger.info(params, 'Using Mock Xendit client for disbursement');
      
      // Simulate success unless description contains 'fail'
      const shouldFail = params.description?.toLowerCase().includes('fail');
      
      return {
        id: 'disb-' + crypto.randomUUID(),
        external_id: params.externalId,
        amount: params.amount,
        status: shouldFail ? 'FAILED' : 'COMPLETED',
        bank_code: params.bankCode,
        account_holder_name: params.accountHolderName,
        disbursement_description: params.description,
        ...(shouldFail ? { failure_code: 'REJECTED_BY_BANK' } : {}),
      };
    }

    try {
      logger.info({ externalId: params.externalId }, 'Creating Xendit disbursement...');
      const response = await fetch('https://api.xendit.co/disbursements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': params.externalId,
          Authorization: authHeader,
        },
        body: JSON.stringify({
          external_id: params.externalId,
          amount: Math.ceil(params.amount),
          bank_code: params.bankCode,
          account_holder_name: params.accountHolderName,
          account_number: params.accountNumber,
          description: params.description,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        logger.error({ errorData: data }, 'Xendit disbursement failed');
        throw new AppError(
          502,
          ErrorCode.INTERNAL_SERVER_ERROR,
          data.message || 'Pencairan dana via Xendit gagal'
        );
      }

      return {
        id: data.id,
        external_id: data.external_id,
        amount: data.amount,
        status: data.status,
        bank_code: data.bank_code,
        account_holder_name: data.account_holder_name,
        disbursement_description: data.description,
        failure_code: data.failure_code,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error }, 'Failed to call Xendit Disbursement API');
      throw new AppError(
        502,
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Gagal menghubungkan ke Xendit Disbursement API'
      );
    }
  }
}

export const xenditClient = new XenditClient();
