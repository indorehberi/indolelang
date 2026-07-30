import { prisma } from '../../config/database';
import { lotsService } from './lots.service';
import {
  Role,
  UserStatus,
  LotStatus,
  AssetStatus,
  SessionStatus,
} from '../../../../../packages/shared-types/src/enums';
import { Prisma } from '@prisma/client';

/**
 * Membatalkan lot harus langsung melepaskan barangnya kembali ke stok.
 *
 * Sebelumnya status barang hanya dikembalikan saat sesi diakhiri. Kalau sesi
 * tidak pernah ditutup, barang itu tertahan di 'listed' selamanya: tidak
 * muncul lagi di daftar penyusunan lot, dan tidak ada pesan apa pun yang
 * menjelaskan kenapa provider tidak bisa melelangnya lagi.
 */
describe('Pembatalan lot mengembalikan barang ke stok', () => {
  const adminEmail = 'lot_cancel_admin@example.com';

  let adminId: string;
  let branchId: string;
  let sessionId: string;

  const buatAsetDanLot = async (lotNumber: number, lotStatus: LotStatus) => {
    const asset = await prisma.assets.create({
      data: {
        provider_id: adminId,
        category: 'mobil',
        title: `Unit Batal ${lotNumber}`,
        base_price: new Prisma.Decimal(100_000_000),
        status: AssetStatus.LISTED,
      },
    });
    const lot = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: asset.id,
        lot_number: lotNumber,
        starting_price: new Prisma.Decimal(100_000_000),
        status: lotStatus,
      },
    });
    return { asset, lot };
  };

  const bersihkan = async () => {
    await prisma.bids.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({ where: { email: adminEmail } });
  };

  beforeAll(async () => {
    await bersihkan();

    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        phone: '+628444444000',
        password_hash: 'hashed',
        full_name: 'Admin Batal Lot',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Cabang Batal Lot',
        city: 'Jakarta',
        address: 'Jl. Batal No. 1',
        phone: '+62215552222',
        pic_name: 'PIC Batal',
        is_active: true,
      },
    });
    branchId = branch.id;

    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Sesi Uji Pembatalan Lot',
        scheduled_at: new Date(),
        status: SessionStatus.LIVE,
      },
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    await bersihkan();
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
  });

  it('mengembalikan barang ke approved tanpa menunggu sesi diakhiri', async () => {
    const { asset, lot } = await buatAsetDanLot(1, LotStatus.PENDING);

    await lotsService.cancelLot(lot.id);

    const sesudah = await prisma.assets.findUnique({ where: { id: asset.id } });
    expect(sesudah?.status).toBe(AssetStatus.APPROVED);

    // Sesi sengaja dibiarkan tetap live — inilah kondisi yang dulu membuat
    // barang tertahan selamanya.
    const sesi = await prisma.auction_sessions.findUnique({ where: { id: sessionId } });
    expect(sesi?.status).toBe(SessionStatus.LIVE);
  });

  it('menandai lotnya cancelled, bukan menghapusnya', async () => {
    const { lot } = await buatAsetDanLot(2, LotStatus.PENDING);

    await lotsService.cancelLot(lot.id);

    const sesudah = await prisma.lots.findUnique({ where: { id: lot.id } });
    expect(sesudah).not.toBeNull();
    expect(sesudah?.status).toBe(LotStatus.CANCELLED);
  });

  it('barang yang sudah dilepas bisa dipakai di sesi berikutnya', async () => {
    const { asset, lot } = await buatAsetDanLot(3, LotStatus.PENDING);
    await lotsService.cancelLot(lot.id);

    const sesiBaru = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Sesi Berikutnya',
        scheduled_at: new Date(),
        status: SessionStatus.DRAFT,
      },
    });

    // Penyusunan lot menolak barang yang statusnya bukan approved, jadi
    // berhasilnya panggilan ini membuktikan barangnya benar-benar kembali
    // tersedia — bukan sekadar kolom status yang berubah.
    const lotBaru = await lotsService.createLot({
      session_id: sesiBaru.id,
      asset_id: asset.id,
      starting_price: 100_000_000,
    } as any);

    expect(lotBaru.asset_id).toBe(asset.id);

    const asetSesudah = await prisma.assets.findUnique({ where: { id: asset.id } });
    expect(asetSesudah?.status).toBe(AssetStatus.LISTED);

    await prisma.lots.deleteMany({ where: { session_id: sesiBaru.id } });
    await prisma.auction_sessions.delete({ where: { id: sesiBaru.id } });
  });

  it('menolak membatalkan lot yang sudah terjual', async () => {
    const { asset, lot } = await buatAsetDanLot(4, LotStatus.SOLD);
    await prisma.assets.update({ where: { id: asset.id }, data: { status: AssetStatus.SOLD } });

    await expect(lotsService.cancelLot(lot.id)).rejects.toThrow(/tidak dapat dibatalkan/i);

    // Barang yang sudah laku tidak boleh ikut terlepas ke stok.
    const sesudah = await prisma.assets.findUnique({ where: { id: asset.id } });
    expect(sesudah?.status).toBe(AssetStatus.SOLD);
  });

  it('menolak membatalkan lot yang sudah dibatalkan', async () => {
    const { lot } = await buatAsetDanLot(5, LotStatus.CANCELLED);

    await expect(lotsService.cancelLot(lot.id)).rejects.toThrow(/sudah dibatalkan/i);
  });
});
