import { prisma } from '../../config/database';
import { checkoutService } from './checkout.service';
import { paymentsService } from '../payments/payments.service';
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
 * Uang peserta tidak boleh berpindah atau lenyap tanpa dasar. Setiap kasus di
 * sini mewakili satu jalur di mana jaminan NIPL bisa hilang diam-diam —
 * ditemukan lewat audit alur uang setelah insiden 29 Juli 2026.
 */
describe('Integritas jaminan NIPL', () => {
  const adminEmail = 'nipl_integrity_admin@example.com';
  const bidderEmail = 'nipl_integrity_bidder@example.com';

  let adminId: string;
  let bidderId: string;
  let branchId: string;
  let sessionId: string;

  const buatLotDanTagihan = async (lotNumber: number, niplDeduction: number) => {
    const asset = await prisma.assets.create({
      data: {
        provider_id: adminId,
        category: 'mobil',
        title: `Unit Uji ${lotNumber}`,
        base_price: new Prisma.Decimal(100_000_000),
        status: AssetStatus.SOLD,
      },
    });
    const lot = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: asset.id,
        lot_number: lotNumber,
        starting_price: new Prisma.Decimal(100_000_000),
        status: LotStatus.SOLD,
        winner_id: bidderId,
        hammer_price: new Prisma.Decimal(100_000_000),
      },
    });
    const invoice = await prisma.invoices.create({
      data: {
        lot_id: lot.id,
        bidder_id: bidderId,
        hammer_price: new Prisma.Decimal(100_000_000),
        commission: new Prisma.Decimal(0),
        tax: new Prisma.Decimal(0),
        admin_fee: new Prisma.Decimal(0),
        pmk41_amount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(100_000_000),
        due_date: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        status: 'pending_checkout',
        nipl_deduction: new Prisma.Decimal(niplDeduction),
      },
    });
    return { lot, invoice };
  };

  const buatOrder = async (invoiceIds: string[]) => {
    const order = await prisma.checkout_orders.create({
      data: {
        bidder_id: bidderId,
        total_invoices: invoiceIds.length,
        subtotal_amount: new Prisma.Decimal(100_000_000 * invoiceIds.length),
        deposit_deduction: new Prisma.Decimal(0),
        final_amount: new Prisma.Decimal(100_000_000 * invoiceIds.length),
        unique_code: 0,
        gateway_fee: 0,
        status: 'pending_approval',
      },
    });
    await prisma.invoices.updateMany({
      where: { id: { in: invoiceIds } },
      data: { order_id: order.id },
    });
    return order;
  };

  const bersihkan = async () => {
    await prisma.nipl_codes.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.checkout_orders.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.bids.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.notifications.deleteMany({});
    await prisma.users.deleteMany({ where: { email: { in: [adminEmail, bidderEmail] } } });
  };

  beforeAll(async () => {
    await bersihkan();

    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        phone: '+628333333000',
        password_hash: 'hashed',
        full_name: 'Admin Integritas NIPL',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    const bidder = await prisma.users.create({
      data: {
        email: bidderEmail,
        phone: '+628333333001',
        password_hash: 'hashed',
        full_name: 'Bidder Integritas NIPL',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidderId = bidder.id;

    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Cabang Integritas NIPL',
        city: 'Jakarta',
        address: 'Jl. Uji No. 1',
        phone: '+62215551111',
        pic_name: 'PIC Uji',
        is_active: true,
      },
    });
    branchId = branch.id;

    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Sesi Integritas NIPL',
        scheduled_at: new Date(),
        status: SessionStatus.CLOSED,
      },
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    await bersihkan();
    await prisma.$disconnect();
  });

  describe('verifyOrder — persetujuan sebagian', () => {
    afterEach(async () => {
      await prisma.nipl_codes.deleteMany({});
      await prisma.invoices.deleteMany({});
      await prisma.checkout_orders.deleteMany({});
      await prisma.deposits.deleteMany({});
      await prisma.settlements.deleteMany({});
      await prisma.lots.deleteMany({});
      await prisma.assets.deleteMany({});
      await prisma.notifications.deleteMany({});
    });

    it('mengembalikan jaminan NIPL untuk unit yang TIDAK disetujui', async () => {
      // Inilah bug-nya: unit yang ditolak dilepas kembali ke keranjang dengan
      // nipl_deduction dinolkan, tetapi jaminan yang sudah dipotong tidak
      // pernah dikembalikan — hilang tanpa notifikasi dan tanpa jejak.
      const disetujui = await buatLotDanTagihan(1, 5_000_000);
      const ditolak = await buatLotDanTagihan(2, 5_000_000);
      const order = await buatOrder([disetujui.invoice.id, ditolak.invoice.id]);

      await checkoutService.verifyOrder(order.id, 'paid', adminId, [disetujui.invoice.id]);

      const pengganti = await prisma.deposits.findMany({
        where: { user_id: bidderId, payment_method: 'nipl_refund_rejected_order' },
      });

      expect(pengganti).toHaveLength(1);
      expect(Number(pengganti[0].amount)).toBe(5_000_000);
      expect(pengganti[0].status).toBe('paid');
      expect(pengganti[0].unit_type).toBe('mobil');

      // Unit yang disetujui tetap lunas, jaminannya tidak ikut dikembalikan.
      const invDisetujui = await prisma.invoices.findUnique({ where: { id: disetujui.invoice.id } });
      expect(invDisetujui?.status).toBe('paid');

      // Unit yang ditolak kembali ke keranjang.
      const invDitolak = await prisma.invoices.findUnique({ where: { id: ditolak.invoice.id } });
      expect(invDitolak?.status).toBe('unpaid');
      expect(invDitolak?.order_id).toBeNull();

      // Peserta diberi tahu — jaminan yang berpindah tanpa kabar dianggap hilang.
      const notif = await prisma.notifications.findMany({
        where: { user_id: bidderId, type: 'nipl_returned' },
      });
      expect(notif).toHaveLength(1);
    });

    it('tidak mengembalikan apa pun bila seluruh unit disetujui', async () => {
      const a = await buatLotDanTagihan(3, 5_000_000);
      const b = await buatLotDanTagihan(4, 5_000_000);
      const order = await buatOrder([a.invoice.id, b.invoice.id]);

      await checkoutService.verifyOrder(order.id, 'paid', adminId, [a.invoice.id, b.invoice.id]);

      const pengganti = await prisma.deposits.findMany({
        where: { user_id: bidderId, payment_method: 'nipl_refund_rejected_order' },
      });
      expect(pengganti).toHaveLength(0);
    });

    it('penolakan penuh mengembalikan jaminan setiap unit', async () => {
      const a = await buatLotDanTagihan(5, 5_000_000);
      const b = await buatLotDanTagihan(6, 5_000_000);
      const order = await buatOrder([a.invoice.id, b.invoice.id]);

      await checkoutService.verifyOrder(order.id, 'rejected', adminId);

      const pengganti = await prisma.deposits.findMany({
        where: { user_id: bidderId, payment_method: 'nipl_refund_rejected_order' },
      });
      expect(pengganti).toHaveLength(2);
      expect(pengganti.reduce((t, d) => t + Number(d.amount), 0)).toBe(10_000_000);
    });

    it('klik ganda admin tidak menggandakan jaminan yang dikembalikan', async () => {
      const a = await buatLotDanTagihan(7, 5_000_000);
      const order = await buatOrder([a.invoice.id]);

      // Dua permintaan berbarengan, seperti admin mengklik dua kali pada
      // halaman yang terasa lambat.
      const hasil = await Promise.allSettled([
        checkoutService.verifyOrder(order.id, 'rejected', adminId),
        checkoutService.verifyOrder(order.id, 'rejected', adminId),
      ]);

      // Satu berhasil, satu ditolak karena order sudah tidak valid lagi.
      expect(hasil.filter((r) => r.status === 'fulfilled')).toHaveLength(1);

      const pengganti = await prisma.deposits.findMany({
        where: { user_id: bidderId, payment_method: 'nipl_refund_rejected_order' },
      });
      expect(pengganti).toHaveLength(1);
      expect(Number(pengganti[0].amount)).toBe(5_000_000);
    });
  });

  describe('refundDeposit — penghangusan jaminan', () => {
    afterEach(async () => {
      await prisma.nipl_codes.deleteMany({});
      await prisma.invoices.deleteMany({});
      await prisma.deposits.deleteMany({});
      await prisma.settlements.deleteMany({});
      await prisma.lots.deleteMany({});
      await prisma.assets.deleteMany({});
      await prisma.notifications.deleteMany({});
    });

    const buatTagihanOverdue = async (lotNumber: number) => {
      const asset = await prisma.assets.create({
        data: {
          provider_id: adminId,
          category: 'mobil',
          title: `Unit Overdue ${lotNumber}`,
          base_price: new Prisma.Decimal(100_000_000),
          status: AssetStatus.SOLD,
        },
      });
      const lot = await prisma.lots.create({
        data: {
          session_id: sessionId,
          asset_id: asset.id,
          lot_number: lotNumber,
          starting_price: new Prisma.Decimal(100_000_000),
          status: LotStatus.SOLD,
        },
      });
      await prisma.invoices.create({
        data: {
          lot_id: lot.id,
          bidder_id: bidderId,
          hammer_price: new Prisma.Decimal(100_000_000),
          commission: new Prisma.Decimal(0),
          tax: new Prisma.Decimal(0),
          admin_fee: new Prisma.Decimal(0),
          pmk41_amount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(100_000_000),
          due_date: new Date(Date.now() - 24 * 3600 * 1000),
          status: 'overdue',
        },
      });
    };

    it('TIDAK menghanguskan deposit umum yang tidak terikat sesi', async () => {
      // Penyaring sesi ditulis `session_id: deposit.session_id || undefined`.
      // Prisma membuang penyaring undefined, sehingga pemeriksaan melebar ke
      // seluruh sesi dan tunggakan yang tidak ada hubungannya bisa
      // menghanguskan deposit yang bersih.
      await buatTagihanOverdue(20);

      const deposit = await prisma.deposits.create({
        data: {
          user_id: bidderId,
          session_id: null,
          amount: new Prisma.Decimal(5_000_000),
          unit_type: 'mobil',
          package_type: '1',
          payment_method: 'manual_transfer',
          status: DepositStatus.PAID,
        },
      });

      await expect(paymentsService.refundDeposit(deposit.id)).resolves.toBeDefined();

      const sesudah = await prisma.deposits.findUnique({ where: { id: deposit.id } });
      expect(sesudah?.status).toBe('refunded');
    });

    it('TIDAK menghanguskan deposit yang tidak memegang kode NIPL', async () => {
      // Aturan yang ditetapkan pemilik sistem: jaminan tanpa kode NIPL tidak
      // pernah dipertaruhkan di lelang, jadi tidak ada dasar menghanguskannya.
      await buatTagihanOverdue(21);

      const deposit = await prisma.deposits.create({
        data: {
          user_id: bidderId,
          session_id: sessionId,
          amount: new Prisma.Decimal(5_000_000),
          unit_type: 'mobil',
          package_type: '1',
          payment_method: 'manual_transfer',
          status: DepositStatus.PAID,
        },
      });

      await expect(paymentsService.refundDeposit(deposit.id)).rejects.toThrow(/tagihan pelunasan/i);

      const sesudah = await prisma.deposits.findUnique({ where: { id: deposit.id } });
      expect(sesudah?.status).toBe('paid');
    });

    it('menghanguskan deposit yang memang memegang kode NIPL saat ada tunggakan', async () => {
      await buatTagihanOverdue(22);

      const deposit = await prisma.deposits.create({
        data: {
          user_id: bidderId,
          session_id: sessionId,
          amount: new Prisma.Decimal(5_000_000),
          unit_type: 'mobil',
          package_type: '1',
          payment_method: 'manual_transfer',
          status: DepositStatus.PAID,
        },
      });
      await prisma.nipl_codes.create({
        data: {
          deposit_id: deposit.id,
          code: 'NIPL-UJI-001',
          unit_type: 'mobil',
          payment_unique_code: 123,
          status: 'used',
        },
      });

      await expect(paymentsService.refundDeposit(deposit.id)).rejects.toThrow(/hangus/i);

      const sesudah = await prisma.deposits.findUnique({ where: { id: deposit.id } });
      expect(sesudah?.status).toBe('forfeited');
    });
  });
});
