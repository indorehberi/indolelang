import { prisma } from '../../config/database';
import { checkoutService } from './checkout.service';
import { biddingService, calculateWorkingDaysDueDate } from '../lots/bidding.service';
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
 * Aturan NIPL dan kode unik sebagaimana ditetapkan pemilik sistem.
 *
 * Dua yang paling mudah rusak diam-diam:
 *
 *   - Kode unik HARUS melekat seumur hidup NIPL-nya. Itu satu-satunya cara
 *     admin dan payment gateway mengenali pembayaran siapa yang masuk. Kode
 *     yang berganti memutus jejak pembayaran.
 *   - Tenggat pelunasan ditentukan admin, bukan dipatok di kode.
 */
describe('Aturan NIPL dan kode unik', () => {
  const tag = 'niplspec';
  const HARGA = 100_000_000;
  const KODE_UNIK = 777;

  let adminId: string;
  let bidderId: string;
  let branchId: string;
  let sessionId: string;
  let lotCounter = 0;

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

  const beriNipl = async (jumlah: number, kodeUnikAwal = KODE_UNIK) => {
    const deposit = await prisma.deposits.create({
      data: {
        user_id: bidderId,
        session_id: sessionId,
        amount: new Prisma.Decimal(5_000_000 * jumlah + kodeUnikAwal),
        unit_type: 'mobil',
        package_type: String(jumlah),
        unique_code: kodeUnikAwal,
        payment_method: 'manual_transfer',
        status: DepositStatus.PAID,
        paid_at: new Date(),
      },
    });
    for (let i = 0; i < jumlah; i++) {
      await prisma.nipl_codes.create({
        data: {
          deposit_id: deposit.id,
          code: `NIPL-${tag}-${Date.now()}-${i}`,
          unit_type: 'mobil',
          payment_unique_code: kodeUnikAwal + i,
          status: 'active',
        },
      });
    }
    return deposit;
  };

  const menangkanLot = async () => {
    lotCounter += 1;
    const asset = await prisma.assets.create({
      data: {
        provider_id: adminId,
        category: 'mobil',
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
    return prisma.invoices.findFirstOrThrow({ where: { lot_id: lot.id } });
  };

  const setTenggat = async (hari: string | null) => {
    await prisma.platform_settings.deleteMany({ where: { key: 'invoice_payment_due_days' } });
    if (hari !== null) {
      await prisma.platform_settings.create({
        data: { tenant_id: 'default', key: 'invoice_payment_due_days', value: hari, is_encrypted: false },
      });
    }
  };

  beforeAll(async () => {
    await bersihkan();

    const admin = await prisma.users.create({
      data: { email: `admin_${tag}@t.test`, phone: '+628777000000', password_hash: 'x', full_name: 'Admin Spec', role: Role.ADMIN, status: UserStatus.ACTIVE },
    });
    adminId = admin.id;
    const bidder = await prisma.users.create({
      data: { email: `bidder_${tag}@t.test`, phone: '+628777000001', password_hash: 'x', full_name: 'Bidder Spec', role: Role.BIDDER, status: UserStatus.ACTIVE },
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
    await setTenggat(null);
    await bersihkan();
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.nipl_codes.deleteMany({});
    await prisma.bids.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.checkout_orders.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.notifications.deleteMany({});
  });

  describe('kode unik melekat seumur hidup NIPL', () => {
    it('kode unik yang sama bertahan saat pembayaran ditolak admin', async () => {
      await beriNipl(1);
      const invoice = await menangkanLot();

      const sebelum = await prisma.nipl_codes.findFirstOrThrow({ where: { invoice_id: invoice.id } });
      expect(sebelum.status).toBe('reserved');

      // Bidder checkout, lalu admin menolak pembayarannya.
      const order = await prisma.checkout_orders.create({
        data: {
          bidder_id: bidderId,
          total_invoices: 1,
          subtotal_amount: new Prisma.Decimal(HARGA),
          deposit_deduction: new Prisma.Decimal(5_000_000),
          final_amount: new Prisma.Decimal(HARGA - 5_000_000),
          unique_code: 0,
          gateway_fee: 0,
          status: 'pending_approval',
        },
      });
      await prisma.invoices.update({
        where: { id: invoice.id },
        data: { order_id: order.id, status: 'pending_checkout', nipl_deduction: new Prisma.Decimal(5_000_000) },
      });

      await checkoutService.verifyOrder(order.id, 'rejected', adminId);

      const sesudah = await prisma.nipl_codes.findFirstOrThrow({ where: { invoice_id: invoice.id } });

      // Inti aturannya: kode DAN kode uniknya harus persis sama.
      expect(sesudah.id).toBe(sebelum.id);
      expect(sesudah.code).toBe(sebelum.code);
      expect(sesudah.payment_unique_code).toBe(sebelum.payment_unique_code);

      // Unitnya masih terutang, jadi jaminannya tetap terikat — bukan lepas
      // jadi NIPL bebas yang bisa dipakai memenangkan unit lain.
      expect(sesudah.status).toBe('reserved');

      // Deposit pengganti membawa kode unik yang sama supaya pembayaran
      // berikutnya tetap bisa dicocokkan.
      const pengganti = await prisma.deposits.findFirstOrThrow({
        where: { user_id: bidderId, payment_method: 'nipl_refund_rejected_order' },
      });
      expect(pengganti.unique_code).toBe(sebelum.payment_unique_code);
    }, 60_000);

    it('setiap NIPL yang diterbitkan punya kode unik berbeda', async () => {
      await beriNipl(3);
      const kode = await prisma.nipl_codes.findMany({
        where: { deposit: { user_id: bidderId } },
        select: { code: true, payment_unique_code: true },
      });

      expect(new Set(kode.map((k) => k.code)).size).toBe(3);
      expect(new Set(kode.map((k) => k.payment_unique_code)).size).toBe(3);
    }, 60_000);
  });

  describe('tenggat pelunasan ditentukan admin', () => {
    // Dibandingkan dengan fungsi yang dipakai sistem itu sendiri, supaya yang
    // diuji adalah "berapa hari yang dipakai", bukan aritmetika tanggal yang
    // sudah punya tesnya sendiri.
    const tanggalTenggatUntuk = (hari: number) =>
      calculateWorkingDaysDueDate(new Date(), hari, []).toISOString().slice(0, 10);

    const tanggalDari = (d: Date) => d.toISOString().slice(0, 10);

    it('memakai jumlah hari dari pengaturan platform', async () => {
      await setTenggat('7');
      await beriNipl(1);
      const invoice = await menangkanLot();

      expect(tanggalDari(invoice.due_date)).toBe(tanggalTenggatUntuk(7));
      // Dan benar-benar berbeda dari bawaan lamanya.
      expect(tanggalDari(invoice.due_date)).not.toBe(tanggalTenggatUntuk(3));
    }, 60_000);

    it('kembali ke 3 hari kerja bila pengaturannya belum diisi', async () => {
      await setTenggat(null);
      await beriNipl(1);
      const invoice = await menangkanLot();

      expect(tanggalDari(invoice.due_date)).toBe(tanggalTenggatUntuk(3));
    }, 60_000);

    it('menolak nilai tidak masuk akal dan kembali ke 3 hari kerja', async () => {
      // Tenggat nol akan membuat tagihan lewat tenggat pada detik yang sama
      // ia terbit — NIPL peserta hangus seketika.
      await setTenggat('0');
      await beriNipl(1);
      const invoice = await menangkanLot();

      expect(tanggalDari(invoice.due_date)).toBe(tanggalTenggatUntuk(3));
    }, 60_000);
  });
});
