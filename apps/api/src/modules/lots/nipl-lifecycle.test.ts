import { prisma } from '../../config/database';
import { biddingService } from './bidding.service';
import {
  Role,
  UserStatus,
  LotStatus,
  AssetStatus,
  SessionStatus,
  DepositStatus,
} from '../../../../../packages/shared-types/src/enums';
import { Prisma } from '@prisma/client';

/**
 * Siklus hidup satu kode NIPL, dari dibeli sampai terpakai atau hangus.
 *
 * Aturan yang ditegakkan di sini: jaminan dipakai pada saat MENANG, bukan saat
 * melunasi. Sebelumnya kode baru terikat ke tagihan saat checkout, sehingga
 * sisa NIPL di layar peserta tidak berkurang meski sudah menang — dan pemenang
 * yang tidak pernah checkout sama sekali jaminannya tidak pernah hangus.
 */
describe('Siklus hidup NIPL', () => {
  const tag = 'niplcycle';
  const HARGA = 100_000_000;

  let adminId: string;
  let bidderId: string;
  let branchId: string;
  let sessionId: string;
  let lotCounter = 0;

  const sisaNiplBebas = () =>
    prisma.nipl_codes.count({
      where: { status: 'active', deposit: { user_id: bidderId, status: 'paid' } },
    });

  const beriNipl = async (jumlah: number, unitType = 'mobil') => {
    const deposit = await prisma.deposits.create({
      data: {
        user_id: bidderId,
        session_id: sessionId,
        amount: new Prisma.Decimal(5_000_000 * jumlah),
        unit_type: unitType,
        package_type: String(jumlah),
        payment_method: 'manual_transfer',
        status: DepositStatus.PAID,
        paid_at: new Date(),
      },
    });
    for (let i = 0; i < jumlah; i++) {
      await prisma.nipl_codes.create({
        data: {
          deposit_id: deposit.id,
          code: `NIPL-${tag}-${unitType}-${Date.now()}-${i}`,
          unit_type: unitType,
          payment_unique_code: 100 + i,
          status: 'active',
        },
      });
    }
    return deposit;
  };

  const menangkanLot = async (unitType = 'mobil') => {
    lotCounter += 1;
    const asset = await prisma.assets.create({
      data: {
        provider_id: adminId,
        category: unitType,
        title: `Unit ${tag} ${lotCounter}`,
        base_price: new Prisma.Decimal(HARGA),
        status: AssetStatus.LISTED,
      },
    });
    const lot = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: asset.id,
        lot_number: lotCounter,
        starting_price: new Prisma.Decimal(HARGA),
        status: LotStatus.ACTIVE,
      },
    });
    await prisma.bids.create({
      data: { lot_id: lot.id, bidder_id: bidderId, amount: new Prisma.Decimal(HARGA + 500_000), is_winning: true },
    });
    await biddingService.settleLot(lot.id);
    return lot;
  };

  const bersihkan = async () => {
    await prisma.nipl_codes.deleteMany({});
    await prisma.bids.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.checkout_orders.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.notifications.deleteMany({});
    await prisma.users.deleteMany({ where: { email: { contains: tag } } });
  };

  beforeAll(async () => {
    await bersihkan();

    const admin = await prisma.users.create({
      data: {
        email: `admin_${tag}@t.test`,
        phone: '+628666000000',
        password_hash: 'x',
        full_name: 'Admin Siklus NIPL',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    const bidder = await prisma.users.create({
      data: {
        email: `bidder_${tag}@t.test`,
        phone: '+628666000001',
        password_hash: 'x',
        full_name: 'Bidder Siklus NIPL',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidderId = bidder.id;

    const branch = await prisma.branches.create({
      data: { tenant_id: 'default', name: `B ${tag}`, city: 'Jakarta', address: 'x', phone: '+62211', pic_name: 'x', is_active: true },
    });
    branchId = branch.id;

    const session = await prisma.auction_sessions.create({
      data: { branch_id: branchId, title: `S ${tag}`, scheduled_at: new Date(), status: SessionStatus.LIVE },
    });
    sessionId = session.id;
  }, 120_000);

  afterAll(async () => {
    await bersihkan();
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.nipl_codes.deleteMany({});
    await prisma.bids.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.notifications.deleteMany({});
  });

  it('NIPL berkurang begitu menang, sebelum dilunasi', async () => {
    await beriNipl(3);
    expect(await sisaNiplBebas()).toBe(3);

    await menangkanLot();

    // Inilah permintaan intinya: jaminan terpakai saat menang, bukan saat bayar.
    expect(await sisaNiplBebas()).toBe(2);

    const invoice = await prisma.invoices.findFirst({ where: { bidder_id: bidderId } });
    expect(invoice?.status).toBe('unpaid');

    const disisihkan = await prisma.nipl_codes.findMany({ where: { invoice_id: invoice!.id } });
    expect(disisihkan).toHaveLength(1);
    expect(disisihkan[0].status).toBe('reserved');
  }, 60_000);

  it('menang dua unit mengurangi dua NIPL', async () => {
    await beriNipl(3);

    await menangkanLot();
    await menangkanLot();

    expect(await sisaNiplBebas()).toBe(1);
    expect(await prisma.nipl_codes.count({ where: { status: 'reserved' } })).toBe(2);
  }, 60_000);

  it('mengambil NIPL sesuai jenis unit, tidak mencampur motor dan mobil', async () => {
    await beriNipl(1, 'mobil');
    await beriNipl(1, 'motor');

    await menangkanLot('motor');

    const tersisa = await prisma.nipl_codes.findMany({
      where: { status: 'active', deposit: { user_id: bidderId } },
    });
    expect(tersisa).toHaveLength(1);
    expect(tersisa[0].unit_type).toBe('mobil');

    const dipakai = await prisma.nipl_codes.findFirst({ where: { status: 'reserved' } });
    expect(dipakai?.unit_type).toBe('motor');
  }, 60_000);

  it('kuota menawar tidak terpotong dua kali oleh kemenangan yang sama', async () => {
    // Deposit unlimited yang sudah diturunkan menghitung kuotanya dari kode
    // yang dimiliki. Kalau kode yang disisihkan ikut dikurangi di sana,
    // peserta kena potongan dua kali untuk satu unit yang sama.
    const deposit = await prisma.deposits.create({
      data: {
        user_id: bidderId,
        session_id: sessionId,
        amount: new Prisma.Decimal(15_000_000),
        unit_type: 'mobil',
        package_type: 'unlimited',
        payment_method: 'manual_transfer',
        status: DepositStatus.PAID,
        paid_at: new Date(),
        unlimited_downgraded_at: new Date(),
      },
    });
    for (let i = 0; i < 3; i++) {
      await prisma.nipl_codes.create({
        data: {
          deposit_id: deposit.id,
          code: `NIPL-${tag}-unl-${Date.now()}-${i}`,
          unit_type: 'mobil',
          payment_unique_code: 200 + i,
          status: 'active',
        },
      });
    }

    await menangkanLot();

    // Sisa kuota harus 3 - 1 = 2 unit lagi, bukan 3 - 1 - 1 = 1.
    lotCounter += 1;
    const asset = await prisma.assets.create({
      data: { provider_id: adminId, category: 'mobil', title: `Cek ${tag}`, base_price: new Prisma.Decimal(HARGA), status: AssetStatus.LISTED },
    });
    const lotBaru = await prisma.lots.create({
      data: { session_id: sessionId, asset_id: asset.id, lot_number: lotCounter, starting_price: new Prisma.Decimal(HARGA), status: LotStatus.ACTIVE },
    });

    await expect(
      biddingService.validateBid(
        { userId: bidderId, sessionId, lotId: lotBaru.id, amount: HARGA + 500_000 },
        HARGA,
        undefined
      )
    ).resolves.toBeUndefined();
  }, 60_000);

  it('tidak menggagalkan penutupan lot ketika peserta tidak punya kode NIPL', async () => {
    // Deposit lama dari sebelum tabel nipl_codes ada. Pemenangnya tetap sah.
    await prisma.deposits.create({
      data: {
        user_id: bidderId,
        session_id: sessionId,
        amount: new Prisma.Decimal(5_000_000),
        unit_type: 'mobil',
        package_type: '1',
        payment_method: 'manual_transfer',
        status: DepositStatus.PAID,
        paid_at: new Date(),
      },
    });

    const lot = await menangkanLot();

    const settled = await prisma.lots.findUnique({ where: { id: lot.id } });
    expect(settled?.status).toBe(LotStatus.SOLD);
    expect(settled?.winner_id).toBe(bidderId);
    expect(await prisma.invoices.count({ where: { lot_id: lot.id } })).toBe(1);
  }, 60_000);

  it('menutup lot dua kali tidak menyisihkan NIPL dua kali', async () => {
    await beriNipl(3);

    lotCounter += 1;
    const asset = await prisma.assets.create({
      data: { provider_id: adminId, category: 'mobil', title: `Ganda ${tag}`, base_price: new Prisma.Decimal(HARGA), status: AssetStatus.LISTED },
    });
    const lot = await prisma.lots.create({
      data: { session_id: sessionId, asset_id: asset.id, lot_number: lotCounter, starting_price: new Prisma.Decimal(HARGA), status: LotStatus.ACTIVE },
    });
    await prisma.bids.create({
      data: { lot_id: lot.id, bidder_id: bidderId, amount: new Prisma.Decimal(HARGA + 500_000), is_winning: true },
    });

    await Promise.allSettled([biddingService.settleLot(lot.id), biddingService.settleLot(lot.id)]);

    expect(await prisma.nipl_codes.count({ where: { status: 'reserved' } })).toBe(1);
    expect(await sisaNiplBebas()).toBe(2);
  }, 60_000);
});
