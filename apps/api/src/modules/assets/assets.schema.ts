import { z } from 'zod';
import { AssetCategory, AssetStatus } from '@indo-lelang/shared-types';

// Provider/admin forms leave uuid-referencing selects (provider_id, branch_id,
// inspector_id) at an unselected "" default now that they're no longer forced
// required. `z.string().uuid().optional()` only treats `undefined` as "not
// provided" — an empty string is still a defined value and fails `.uuid()`
// with a confusing "Invalid uuid" error. Normalize "" (and null) to
// undefined before the uuid check runs, so leaving these fields blank is
// treated the same everywhere regardless of which frontend sent the request.
const optionalUuid = () =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().uuid().optional());

// branches.id is `String @id @default(uuid())` — a plain string PK, not a
// DB-enforced uuid format. The production seed (seed-prod.ts) upserts the
// default Jakarta branch with a hardcoded human-readable id
// ("default-jakarta-branch-id-production") instead of a generated uuid, so
// real branch_id values in production aren't guaranteed to be uuid-shaped.
// Validate branch_id as a normal optional string (still normalizing ""/null
// to undefined) rather than enforcing `.uuid()`.
const optionalBranchId = () =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().optional());

const optionalCategorySchema = () =>
  z.preprocess((v) => {
    if (typeof v === 'string') {
      return v.trim().toLowerCase().replace(/\s+/g, '_');
    }
    return v;
  }, z.nativeEnum(AssetCategory).optional());

export const createAssetSchema = z.object({
  body: z.object({
    // Submission forms (provider "Ajukan Titip Jual", admin "Tambah Barang")
    // treat every field as optional — assets.service.ts's createAsset() fills
    // in sensible defaults for category/title/base_price when omitted, since
    // those columns are NOT NULL at the DB level.
    category: optionalCategorySchema(),
    title: z.string().optional(),
    description: z.string().optional(),
    base_price: z.any().optional().transform(v => (v === undefined ? undefined : Number(v))),
    images: z.any().optional(),
    provider_id: optionalUuid(),
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
    branch_id: optionalBranchId(),
    pool_status: z.enum(['in_pool', 'out_pool']).optional(),
    pool_city: z.string().optional(),
    notes: z.string().optional(),
    photo_front: z.string().optional(),
    photo_back: z.string().optional(),
    photo_right: z.string().optional(),
    photo_left: z.string().optional(),
    photo_engine: z.string().optional(),
    photo_interior: z.string().optional(),
    photo_stnk: z.string().optional(),
  }),
});

export const updateAssetSchema = z.object({
  body: z.object({
    category: optionalCategorySchema(),
    title: z.string().optional(),
    description: z.string().optional(),
    base_price: z.any().optional().transform(v => (v === undefined || v === '' ? undefined : Number(v))),
    images: z.string().optional(),
    status: z
      .enum([
        AssetStatus.PENDING,
        AssetStatus.INSPECTED,
        AssetStatus.APPROVED,
        AssetStatus.LISTED,
        AssetStatus.SOLD,
        AssetStatus.REJECTED,
        AssetStatus.RETURNED,
      ])
      .optional(),

    inspector_id: optionalUuid(),
    inspection_date: z.string().datetime().optional(),
    inspection_pic_name: z.string().optional(),
    inspection_doc_url: z.string().optional(),
    grade_interior: z.string().optional(),
    grade_exterior: z.string().optional(),
    grade_engine: z.string().optional(),
    engine_number: z.string().optional(),
    is_recommended: z.any().optional(),
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
    brand: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    body_type: z.string().optional(),
    year: z.union([z.number(), z.string()]).optional(),
    police_number: z.string().optional(),
    bpkb_number: z.string().optional(),
    frame_number: z.string().optional(),
    cylinder: z.union([z.number(), z.string()]).optional(),
    odometer: z.union([z.number(), z.string()]).optional(),
    branch_id: optionalBranchId(),
    pool_status: z.string().optional(),
    pool_city: z.string().optional(),
    notes: z.string().optional(),
    rejection_reason: z.string().optional(),
    photo_front: z.string().optional(),
    photo_back: z.string().optional(),
    photo_right: z.string().optional(),
    photo_left: z.string().optional(),
    photo_engine: z.string().optional(),
    photo_interior: z.string().optional(),
    photo_stnk: z.string().optional(),
  }),
});

export const rejectAssetSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Alasan penolakan wajib diisi'),
  }),
});

export const getAssetsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    status: z.string().optional(),
    provider_id: optionalUuid(),
    category: optionalCategorySchema(),
    search: z.string().optional(),
    police_number: z.string().optional(),
    branch_id: optionalBranchId(),
    pool_status: z.enum(['in_pool', 'out_pool']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }),
});

export const inspectAssetSchema = z.object({
  body: z.object({
    // All optional — the admin "Tambah Barang" form submits this same body
    // regardless of what was left blank, and inspection is meant to be
    // revisable rather than a one-shot required gate.
    inspection_date: z.string().datetime().optional(),
    inspection_pic_name: z.string().optional(),
    grade_interior: z.string().optional(),
    grade_exterior: z.string().optional(),
    grade_engine: z.string().optional(),
    inspection_doc_url: z.string().optional(),
    category: optionalCategorySchema(),
    brand: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    body_type: z.string().optional(),
    year: z.number().int().min(1900).optional(),
    police_number: z.string().optional(),
    bpkb_number: z.string().optional(),
    frame_number: z.string().optional(),
    cylinder: z.number().int().positive('CC harus positif').optional(),
    odometer: z.number().int().nonnegative('Odometer tidak valid').optional(),
  }),
});
 
