import { prisma } from '../../config/database';
import { biddingService } from './bidding.service';
import { withLock } from '../../lib/mutex';
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
 * Detik-detik terakhir sebuah lot: puluhan peserta melihat harga yang sama di
 * layar, lalu menekan BID pada saat yang hampir bersamaan.
 *
 * Yang diukur di sini bukan kebenaran angkanya saja, tapi APA YANG DIRASAKAN
 * peserta — berapa yang penawarannya masuk, berapa yang ditolak, dan dengan
 * alasan apa.
 */
describe('Puluhan peserta menawar bersamaan', () => {
  const tag = 'scramble';
  const HARGA_AWAL = 100_000_000;
  const KELIPATAN = 500_000;

  let sessionId: string;
  let lotId: string;
  let bidders: { id: string; full_name: string }[] = [];

  const bersihkan = async () => {
    await prisma.bids.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.nipl_codes.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({ where: { email: { contains: tag } } });
  };

  beforeAll(async () => {
    await bersihkan();

    const prov = await prisma.users.create({
      data: {
        email: `prov_${tag}@t.test`,
        phone: '+628555000000',
        password_hash: 'x',
        full_name: 'Provider Scramble',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    const branch = await prisma.branches.create({
      data: { tenant_id: 'default', name: `B ${tag}`, city: 'Jakarta', address: 'x', phone: '+62211', pic_name: 'x', is_active: true },
    });
    const session = await prisma.auction_sessions.create({
      data: { branch_id: branch.id, title: `S ${tag}`, scheduled_at: new Date(), status: SessionStatus.LIVE },
    });
    sessionId = session.id;
    const asset = await prisma.assets.create({
      data: { provider_id: prov.id, category: 'mobil', title: `A ${tag}`, base_price: new Prisma.Decimal(HARGA_AWAL), status: AssetStatus.LISTED },
    });
    const lot = await prisma.lots.create({
      data: { session_id: sessionId, asset_id: asset.id, lot_number: 1, starting_price: new Prisma.Decimal(HARGA_AWAL), status: LotStatus.ACTIVE },
    });
    lotId = lot.id;

    for (let i = 0; i < 30; i++) {
      const u = await prisma.users.create({
        data: {
          email: `b${i}_${tag}@t.test`,
          phone: `+6285551${String(i).padStart(5, '0')}`,
          password_hash: 'x',
          full_name: `Bidder ${i}`,
          role: Role.BIDDER,
          status: UserStatus.ACTIVE,
        },
      });
      await prisma.deposits.create({
        data: {
          user_id: u.id,
          session_id: sessionId,
          amount: new Prisma.Decimal(5_000_000),
          unit_type: 'mobil',
          package_type: '2',
          payment_method: 'manual_transfer',
          status: DepositStatus.PAID,
          paid_at: new Date(),
        },
      });
      bidders.push({ id: u.id, full_name: u.full_name });
    }
  }, 120_000);

  afterAll(async () => {
    await bersihkan();
    await prisma.$disconnect();
  });

  it('hanya satu penawaran yang menang, sisanya ditolak karena harga sudah bergerak', async () => {
    // Keadaan lot di memori, meniru activeLots di socket.ts
    const state: { currentPrice: number; highestBidderId?: string } = { currentPrice: HARGA_AWAL };

    // Semua peserta melihat harga yang SAMA lalu menghitung penawarannya dari
    // situ — persis seperti yang dilakukan handlePlaceBid di sisi klien.
    const amount = state.currentPrice + KELIPATAN;

    const mulai = Date.now();
    const hasil = await Promise.allSettled(
      bidders.map((u) =>
        withLock(`user:${u.id}`, () =>
          withLock(`lot:${lotId}`, async () => {
            await biddingService.validateBid(
              { userId: u.id, sessionId, lotId, amount },
              state.currentPrice,
              state.highestBidderId
            );
            await prisma.bids.create({
              data: { lot_id: lotId, bidder_id: u.id, amount: new Prisma.Decimal(amount), is_winning: true },
            });
            state.currentPrice = amount;
            state.highestBidderId = u.id;
          })
        )
      )
    );
    const durasi = Date.now() - mulai;

    const sukses = hasil.filter((r) => r.status === 'fulfilled').length;
    const gagal = hasil.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    const alasan: Record<string, number> = {};
    gagal.forEach((r) => {
      const kunci = String(r.reason?.message || '').slice(0, 55);
      alasan[kunci] = (alasan[kunci] || 0) + 1;
    });

    console.log(`\n  ${bidders.length} peserta menekan BID bersamaan pada harga ${HARGA_AWAL.toLocaleString('id-ID')}`);
    console.log(`  Semua mengirim ${amount.toLocaleString('id-ID')}`);
    console.log(`  Diproses dalam ${durasi} ms (${(durasi / bidders.length).toFixed(1)} ms per penawaran)`);
    console.log(`  BERHASIL : ${sukses}`);
    console.log(`  DITOLAK  : ${gagal.length}`);
    Object.entries(alasan).forEach(([m, c]) => console.log(`     ${c}x "${m}..."`));

    // Antrean kunci memastikan tidak ada dua penawaran dengan harga sama yang
    // lolos — itu memang tujuannya. Konsekuensinya: semua yang kalah cepat
    // menerima penolakan, bukan sekadar kalah diam-diam.
    expect(sukses).toBe(1);
    expect(gagal.length).toBe(bidders.length - 1);

    // Semua penolakan harus berupa "harga sudah naik", bukan error sistem.
    const semuaKarenaHarga = gagal.every((r) => /minimal|kelipatan/i.test(String(r.reason?.message || '')));
    expect(semuaKarenaHarga).toBe(true);

    // Hanya satu baris bid yang tersimpan — tidak ada penawaran hantu.
    expect(await prisma.bids.count({ where: { lot_id: lotId } })).toBe(1);
  }, 120_000);

  it('penawaran bertingkat dari puluhan peserta semuanya masuk dan urut', async () => {
    await prisma.bids.deleteMany({ where: { lot_id: lotId } });

    // Skenario realistis kedua: setiap peserta menawar di atas harga terkini,
    // bukan harga yang sudah basi. Semuanya harus masuk tanpa satu pun hilang.
    const state: { currentPrice: number; highestBidderId?: string } = { currentPrice: HARGA_AWAL };

    const mulai = Date.now();
    for (const u of bidders) {
      await withLock(`user:${u.id}`, () =>
        withLock(`lot:${lotId}`, async () => {
          const amount = state.currentPrice + KELIPATAN;
          await biddingService.validateBid(
            { userId: u.id, sessionId, lotId, amount },
            state.currentPrice,
            state.highestBidderId
          );
          await prisma.bids.create({
            data: { lot_id: lotId, bidder_id: u.id, amount: new Prisma.Decimal(amount), is_winning: true },
          });
          state.currentPrice = amount;
          state.highestBidderId = u.id;
        })
      );
    }
    const durasi = Date.now() - mulai;

    console.log(`\n  ${bidders.length} penawaran berurutan diproses dalam ${durasi} ms`);
    console.log(`  Rata-rata ${(durasi / bidders.length).toFixed(1)} ms per penawaran`);
    console.log(`  Harga akhir ${state.currentPrice.toLocaleString('id-ID')}`);

    expect(await prisma.bids.count({ where: { lot_id: lotId } })).toBe(bidders.length);
    expect(state.currentPrice).toBe(HARGA_AWAL + KELIPATAN * bidders.length);

    // Sanggup memproses jauh lebih cepat dari satu detik per penawaran, jadi
    // antrean tidak akan terasa oleh peserta.
    expect(durasi / bidders.length).toBeLessThan(200);
  }, 120_000);
});
