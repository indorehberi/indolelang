import { z } from 'zod';
import { AssetCategory, AssetStatus } from '@indo-lelang/shared-types';

export const createAssetSchema = z.object({
  body: z.object({
    category: z.enum([
      AssetCategory.MOBIL,
      AssetCategory.MOTOR,
      AssetCategory.ALAT_BERAT,
      AssetCategory.PROPERTI,
    ], {
      errorMap: () => ({ message: 'Kategori barang tidak valid' }),
    }),
    title: z.string().min(5, 'Nama barang minimal 5 karakter'),
    description: z.string().optional(),
    base_price: z.number().positive('Harga dasar harus lebih besar dari 0'),
    images: z.string().optional(), // stringified JSON array
  }),
});

export const updateAssetSchema = z.object({
  body: z.object({
    category: z
      .enum([
        AssetCategory.MOBIL,
        AssetCategory.MOTOR,
        AssetCategory.ALAT_BERAT,
        AssetCategory.PROPERTI,
      ])
      .optional(),
    title: z.string().min(5, 'Nama barang minimal 5 karakter').optional(),
    description: z.string().optional(),
    base_price: z.number().positive('Harga dasar harus lebih besar dari 0').optional(),
    images: z.string().optional(),
    status: z
      .enum([
        AssetStatus.PENDING,
        AssetStatus.APPROVED,
        AssetStatus.LISTED,
        AssetStatus.SOLD,
        AssetStatus.RETURNED,
      ])
      .optional(),
  }),
});

export const getAssetsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    status: z.enum([
      AssetStatus.PENDING,
      AssetStatus.APPROVED,
      AssetStatus.LISTED,
      AssetStatus.SOLD,
      AssetStatus.RETURNED,
    ]).optional(),
    category: z.enum([
      AssetCategory.MOBIL,
      AssetCategory.MOTOR,
      AssetCategory.ALAT_BERAT,
      AssetCategory.PROPERTI,
    ]).optional(),
    search: z.string().optional(),
  }),
});
