import { z } from 'zod';

export const createDepositSchema = z.object({
  body: z.object({
    session_id: z.string().uuid('ID Sesi Lelang tidak valid'),
    amount: z.number().positive('Jumlah deposit harus lebih besar dari 0'),
    bank: z.enum(['bca', 'mandiri', 'bni', 'bri', 'permata'], {
      errorMap: () => ({ message: 'Bank transfer yang dipilih tidak valid' }),
    }),
  }),
});

export const getDepositsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    session_id: z.string().uuid().optional(),
    status: z.enum(['pending', 'paid', 'expired', 'refunded']).optional(),
  }),
});
