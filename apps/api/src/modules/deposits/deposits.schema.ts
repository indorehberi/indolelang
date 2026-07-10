import { z } from 'zod';

export const createDepositSchema = z.object({
  body: z.object({
    session_id: z.string().uuid('ID Sesi Lelang tidak valid').optional().nullable(),
    unit_type: z.enum(['mobil', 'motor'], {
      errorMap: () => ({ message: 'Pilih jenis unit (mobil/motor)' }),
    }),
    package_type: z.enum(['1', '2', '3', '4', 'unlimited'], {
      errorMap: () => ({ message: 'Pilih jumlah/paket NIPL yang valid' }),
    }),
    // Payment gateway is disabled — every deposit is a manual bank transfer,
    // so a bank/VA choice is no longer required from the client.
    bank: z.enum(['bca', 'mandiri', 'bni', 'bri', 'permata', 'qris']).optional(),
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
