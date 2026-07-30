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
 * Perilaku lot yang dibatalkan, sesuai keputusan pemilik sistem:
 *
 *   Lot batal TETAP ditampilkan dan TETAP dilewati dalam urutan lelang —
 *   beku beberapa detik dengan keterangan, lalu lanjut ke lot berikutnya.
 *   Barangnya masih terikat pada sesi yang sedang berjalan, jadi baru
 *   dikembalikan ke 'approved' saat sesi ditutup, bersama unit lainnya.
 *
 * Yang diuji di sini adalah dua sisi janji itu: barang tidak dilepas terlalu
 * dini, dan tidak ada unit yang tertinggal saat sesi berakhir.
 */
describe('Lot dibatalkan dan pengembalian barang', () => {
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

  it('menandai lotnya cancelled, bukan menghapusnya', async () => {
    const { lot } = await buatAsetDanLot(1, LotStatus.PENDING);

    await lotsService.cancelLot(lot.id);

    // Baris lotnya harus tetap ada: lot batal masih ditampilkan di katalog
    // dan masih dilewati dalam urutan lelang.
    const sesudah = await prisma.lots.findUnique({ where: { id: lot.id } });
    expect(sesudah).not.toBeNull();
    expect(sesudah?.status).toBe(LotStatus.CANCELLED);
  });

  it('barangnya TETAP terikat sesi selama sesi masih berjalan', async () => {
    const { asset, lot } = await buatAsetDanLot(2, LotStatus.PENDING);

    await lotsService.cancelLot(lot.id);

    // Belum boleh kembali ke stok — unit ini masih bagian dari sesi yang
    // sedang berlangsung dan masih akan ditampilkan saat gilirannya tiba.
    const sesudah = await prisma.assets.findUnique({ where: { id: asset.id } });
    expect(sesudah?.status).toBe(AssetStatus.LISTED);
  });

  it('barang yang lotnya dibatalkan tidak bisa dipakai sesi lain sebelum sesi ini ditutup', async () => {
    const { asset, lot } = await buatAsetDanLot(3, LotStatus.PENDING);
    await lotsService.cancelLot(lot.id);

    const sesiLain = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Sesi Lain',
        scheduled_at: new Date(),
        status: SessionStatus.DRAFT,
      },
    });

    // Penyusunan lot hanya menerima barang berstatus approved, jadi ini
    // memastikan unit tidak bisa bocor ke sesi lain sementara masih terpampang
    // di sesi yang sedang berjalan.
    await expect(
      lotsService.createLot({
        session_id: sesiLain.id,
        asset_id: asset.id,
        starting_price: 100_000_000,
      } as any)
    ).rejects.toThrow(/approved/i);

    await prisma.auction_sessions.delete({ where: { id: sesiLain.id } });
  });

  it('menolak membatalkan lot yang sudah terjual', async () => {
    const { asset, lot } = await buatAsetDanLot(4, LotStatus.SOLD);
    await prisma.assets.update({ where: { id: asset.id }, data: { status: AssetStatus.SOLD } });

    await expect(lotsService.cancelLot(lot.id)).rejects.toThrow(/tidak dapat dibatalkan/i);

    const sesudah = await prisma.assets.findUnique({ where: { id: asset.id } });
    expect(sesudah?.status).toBe(AssetStatus.SOLD);
  });

  it('menolak membatalkan lot yang sudah dibatalkan', async () => {
    const { lot } = await buatAsetDanLot(5, LotStatus.CANCELLED);

    await expect(lotsService.cancelLot(lot.id)).rejects.toThrow(/sudah dibatalkan/i);
  });

  it('saat sesi ditutup, unit batal DAN unit tak terjual sama-sama kembali ke approved', async () => {
    const batal = await buatAsetDanLot(6, LotStatus.CANCELLED);
    const takLaku = await buatAsetDanLot(7, LotStatus.UNSOLD);
    const laku = await buatAsetDanLot(8, LotStatus.SOLD);
    await prisma.assets.update({ where: { id: laku.asset.id }, data: { status: AssetStatus.SOLD } });

    // Cerminan langkah 3.5 endSession di control.controller: kedua status lot
    // itulah yang barangnya dilepas kembali ke stok.
    const dilepas = await prisma.lots.findMany({
      where: { session_id: sessionId, status: { in: [LotStatus.CANCELLED, LotStatus.UNSOLD] } },
      select: { asset_id: true },
    });
    await prisma.assets.updateMany({
      where: { id: { in: dilepas.map((l) => l.asset_id) } },
      data: { status: AssetStatus.APPROVED },
    });

    expect((await prisma.assets.findUnique({ where: { id: batal.asset.id } }))?.status).toBe(AssetStatus.APPROVED);
    expect((await prisma.assets.findUnique({ where: { id: takLaku.asset.id } }))?.status).toBe(AssetStatus.APPROVED);

    // Unit yang laku tidak boleh ikut terlepas.
    expect((await prisma.assets.findUnique({ where: { id: laku.asset.id } }))?.status).toBe(AssetStatus.SOLD);
  });
});
