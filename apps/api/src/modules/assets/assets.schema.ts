import { z } from 'zod';
import { AssetCategory, AssetStatus } from '@indo-lelang/shared-types';

export const createAssetSchema = z.object({
  body: z.object({
    category: z.nativeEnum(AssetCategory),
    title: z.string().min(3),
    description: z.string().optional(),
    base_price: z.any().transform(v => Number(v)),
    images: z.any().optional(),
    provider_id: z.string().uuid().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    body_type: z.string().optional(),
    year: z.any().optional(),
    police_number: z.string().optional(),
    bpkb_number: z.string().optional(),
    frame_number: z.string().optional(),
    cylinder: z.any().optional(),
    odometer: z.any().optional(),
    is_recommended: z.any().optional(),
    engine_number: z.string().optional(),
    stnk_date: z.any().optional(),
    stnk_tax_date: z.any().optional(),
    keur_date: z.any().optional(),
    doc_stnk: z.any().optional(),
    doc_bpkb: z.any().optional(),
    doc_faktur: z.any().optional(),
    doc_kwitansi: z.any().optional(),
    doc_form_a: z.any().optional(),
    doc_copy_ktp: z.any().optional(),
    doc_keur: z.any().optional(),
    doc_sph: z.any().optional(),
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
        AssetStatus.INSPECTED,
        AssetStatus.APPROVED,
        AssetStatus.LISTED,
        AssetStatus.SOLD,
        AssetStatus.RETURNED,
      ])
      .optional(),
      
    inspector_id: z.string().uuid().optional(),
    inspection_date: z.string().datetime().optional(),
    grade_interior: z.enum(['A', 'B', 'C', 'D']).optional(),
    grade_exterior: z.enum(['A', 'B', 'C', 'D']).optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    fuel_type: z.enum(['Bensin', 'Solar', 'Hybrid', 'EV']).optional(),
    transmission: z.enum(['Manual', 'Otomatis']).optional(),
    body_type: z.string().optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    police_number: z.string().optional(),
    bpkb_number: z.string().optional(),
    frame_number: z.string().optional(),
    cylinder: z.number().int().positive().optional(),
    odometer: z.number().int().nonnegative().optional(),
  }),
});

export const getAssetsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    status: z.string().optional(),
    provider_id: z.string().uuid().optional(),
    category: z.enum([
      AssetCategory.MOBIL,
      AssetCategory.MOTOR,
      AssetCategory.ALAT_BERAT,
      AssetCategory.PROPERTI,
    ]).optional(),
    search: z.string().optional(),
  }),
});

export const inspectAssetSchema = z.object({
  body: z.object({
    inspection_date: z.string().datetime(),
    grade_interior: z.enum(['A', 'B', 'C', 'D', 'E']),
    grade_exterior: z.enum(['A', 'B', 'C', 'D', 'E']),
    grade_engine: z.enum(['A', 'B', 'C', 'D', 'E']),
    category: z.nativeEnum(AssetCategory),
    brand: z.string().min(1, 'Merek wajib diisi'),
    model: z.string().min(1, 'Tipe wajib diisi'),
    color: z.string().min(1, 'Warna wajib diisi'),
    fuel_type: z.string().min(1, 'Bahan bakar wajib diisi'),
    transmission: z.string().min(1, 'Transmisi wajib diisi'),
    body_type: z.string().min(1, 'Jenis body wajib diisi'),
    year: z.number().int().min(1900),
    police_number: z.string().min(1, 'No Polisi wajib diisi'),
    bpkb_number: z.string().min(1, 'No BPKB wajib diisi'),
    frame_number: z.string().min(1, 'No Rangka wajib diisi'),
    cylinder: z.number().int().positive('CC harus positif'),
    odometer: z.number().int().nonnegative('Odometer tidak valid'),
  }),
});
 
