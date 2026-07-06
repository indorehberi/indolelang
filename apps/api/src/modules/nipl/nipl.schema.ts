import { z } from 'zod';

export const allocateSchema = z.object({
  body: z.object({
    session_id: z.string().uuid('ID Sesi Lelang tidak valid'),
    quantity: z.number().int().positive('Jumlah alokasi harus bilangan bulat positif'),
  }),
});

export const reallocateSchema = z.object({
  body: z.object({
    from_session_id: z.string().uuid('ID Sesi Lelang asal tidak valid'),
    to_session_id: z.string().uuid('ID Sesi Lelang tujuan tidak valid'),
    quantity: z.number().int().positive('Jumlah perpindahan harus bilangan bulat positif'),
  }),
});
