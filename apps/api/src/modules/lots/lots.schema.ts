import { z } from 'zod';
import { LotStatus } from '@indo-lelang/shared-types';

export const createLotSchema = z.object({
  body: z.object({
    session_id: z.string().uuid('ID Sesi Lelang tidak valid'),
    asset_id: z.string().uuid('ID Barang tidak valid'),
    // Opsional: jika tidak diisi (mode otomatis), nomor lot berikutnya yang
    // tersedia akan dihitung otomatis di server.
    lot_number: z.number().int().positive('Nomor lot harus berupa angka positif').optional(),
    starting_price: z.number().positive('Harga mulai harus lebih besar dari 0'),
  }),
});

export const updateLotSchema = z.object({
  body: z.object({
    session_id: z.string().uuid('ID Sesi Lelang tidak valid').optional(),
    asset_id: z.string().uuid('ID Barang tidak valid').optional(),
    lot_number: z.number().int().positive('Nomor lot harus berupa angka positif').optional(),
    starting_price: z.number().positive('Harga mulai harus lebih besar dari 0').optional(),
    hammer_price: z.number().positive('Harga ketuk palu harus lebih besar dari 0').optional(),
    winner_id: z.string().uuid('ID Pemenang tidak valid').optional(),
    status: z
      .enum([
        LotStatus.PENDING,
        LotStatus.ACTIVE,
        LotStatus.SOLD,
        LotStatus.UNSOLD,
        LotStatus.CANCELLED,
      ])
      .optional(),
  }),
});

export const getLotsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    session_id: z.string().uuid('ID Sesi Lelang tidak valid').optional(),
    status: z.string().optional(),
    provider_id: z.string().uuid().optional(),
  }),
});
