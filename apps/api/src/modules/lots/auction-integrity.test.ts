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
  KycStatus,
} from '../../../../../packages/shared-types/src/enums';
import { Prisma } from '@prisma/client';

/**
 * Regression cover for the defects found after the 29 July 2026 live auction.
 *
 * Each case here corresponds to a way the auction could misbehave under
 * concurrency or bad data — the kind that passes a typecheck and a build and
 * only shows up with real bidders on the clock.
 */
describe('Auction integrity under concurrency and malformed data', () => {
  describe('withLock', () => {
    it('serialises work on the same key so read-then-write cannot interleave', async () => {
      // Models the bid handler: read a shared value, await, then write it back.
      // Without a lock both runs read 0 and the counter ends at 1 instead of 2.
      let shared = 0;
      const bump = async () => {
        const seen = shared;
        await new Promise((r) => setTimeout(r, 20));
        shared = seen + 1;
      };

      await Promise.all([withLock('k', bump), withLock('k', bump), withLock('k', bump)]);

      expect(shared).toBe(3);
    });

    it('lets work on different keys run in parallel', async () => {
      const order: string[] = [];
      const slow = async () => {
        await new Promise((r) => setTimeout(r, 40));
        order.push('slow');
      };
      const fast = async () => {
        order.push('fast');
      };

      await Promise.all([withLock('a', slow), withLock('b', fast)]);

      // 'b' did not have to wait behind 'a'.
      expect(order).toEqual(['fast', 'slow']);
    });

    it('does not let a rejected task block the queue behind it', async () => {
      const failing = withLock('q', async () => {
        throw new Error('bid rejected');
      });

      await expect(failing).rejects.toThrow('bid rejected');

      // One bidder's failed bid must not freeze the lot for everyone else.
      await expect(withLock('q', async () => 'ok')).resolves.toBe('ok');
    });

    it('propagates the result and the error to the caller', async () => {
      await expect(withLock('r', async () => 42)).resolves.toBe(42);
      await expect(
        withLock('r', async () => {
          throw new Error('boom');
        })
      ).rejects.toThrow('boom');
    });

    it('survives nested keys acquired in a consistent order', async () => {
      // Bid submission takes user then lot, always in that order, so two
      // concurrent bidders on one lot cannot deadlock against each other.
      const run = (userId: string) =>
        withLock(`user:${userId}`, () =>
          withLock('lot:shared', async () => {
            await new Promise((r) => setTimeout(r, 10));
            return userId;
          })
        );

      await expect(Promise.all([run('u1'), run('u2')])).resolves.toEqual(['u1', 'u2']);
    });
  });

  describe('lot settlement and NIPL quota', () => {
    const adminEmail = 'integrity_admin@example.com';
    const bidderEmail = 'integrity_bidder@example.com';
    const oddPkgEmail = 'integrity_oddpkg@example.com';

    let adminId: string;
    let bidderId: string;
    let oddPkgId: string;
    let branchId: string;
    let sessionId: string;
    let lotId: string;
    let quotaLotId: string;

    beforeAll(async () => {
      await prisma.bids.deleteMany({});
      await prisma.invoices.deleteMany({});
      await prisma.nipl_codes.deleteMany({});
      await prisma.deposits.deleteMany({});
      await prisma.kyc_documents.deleteMany({});
      await prisma.settlements.deleteMany({});
      await prisma.lots.deleteMany({});
      await prisma.assets.deleteMany({});
      await prisma.auction_sessions.deleteMany({});
      await prisma.branches.deleteMany({});
      await prisma.users.deleteMany({
        where: { email: { in: [adminEmail, bidderEmail, oddPkgEmail] } },
      });

      const admin = await prisma.users.create({
        data: {
          email: adminEmail,
          phone: '+628222222000',
          password_hash: 'hashed',
          full_name: 'Admin Integrity',
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
      adminId = admin.id;

      const bidder = await prisma.users.create({
        data: {
          email: bidderEmail,
          phone: '+628222222001',
          password_hash: 'hashed',
          full_name: 'Bidder Integrity',
          role: Role.BIDDER,
          status: UserStatus.ACTIVE,
        },
      });
      bidderId = bidder.id;

      const oddPkg = await prisma.users.create({
        data: {
          email: oddPkgEmail,
          phone: '+628222222002',
          password_hash: 'hashed',
          full_name: 'Bidder Paket Aneh',
          role: Role.BIDDER,
          status: UserStatus.ACTIVE,
        },
      });
      oddPkgId = oddPkg.id;

      for (const uid of [bidderId, oddPkgId]) {
        await prisma.kyc_documents.create({
          data: {
            user_id: uid,
            ktp_url: 'http://example.com/ktp.jpg',
            selfie_url: 'http://example.com/selfie.jpg',
            status: KycStatus.APPROVED,
            reviewed_at: new Date(),
            reviewer_id: adminId,
          },
        });
      }

      const branch = await prisma.branches.create({
        data: {
          tenant_id: 'default',
          name: 'Branch Integrity',
          city: 'Jakarta',
          address: 'Jl. Integritas No. 1',
          phone: '+62215550000',
          pic_name: 'PIC Integrity',
          is_active: true,
        },
      });
      branchId = branch.id;

      const session = await prisma.auction_sessions.create({
        data: {
          branch_id: branchId,
          title: 'Sesi Uji Integritas',
          scheduled_at: new Date(),
          status: SessionStatus.LIVE,
        },
      });
      sessionId = session.id;

      const asset = await prisma.assets.create({
        data: {
          provider_id: adminId,
          category: 'mobil',
          title: 'Toyota Integrity 2022',
          base_price: new Prisma.Decimal(100_000_000),
          status: AssetStatus.APPROVED,
        },
      });

      const lot = await prisma.lots.create({
        data: {
          session_id: sessionId,
          asset_id: asset.id,
          lot_number: 1,
          starting_price: new Prisma.Decimal(100_000_000),
          status: LotStatus.ACTIVE,
        },
      });
      lotId = lot.id;

      await prisma.bids.create({
        data: {
          lot_id: lotId,
          bidder_id: bidderId,
          amount: new Prisma.Decimal(101_000_000),
          is_winning: true,
        },
      });

      // A second lot, used only as the target of the quota check.
      const quotaAsset = await prisma.assets.create({
        data: {
          provider_id: adminId,
          category: 'mobil',
          title: 'Honda Integrity 2022',
          base_price: new Prisma.Decimal(50_000_000),
          status: AssetStatus.APPROVED,
        },
      });
      const quotaLot = await prisma.lots.create({
        data: {
          session_id: sessionId,
          asset_id: quotaAsset.id,
          lot_number: 2,
          starting_price: new Prisma.Decimal(50_000_000),
          status: LotStatus.ACTIVE,
        },
      });
      quotaLotId = quotaLot.id;
    });

    afterAll(async () => {
      await prisma.bids.deleteMany({});
      await prisma.invoices.deleteMany({});
      await prisma.nipl_codes.deleteMany({});
      await prisma.deposits.deleteMany({});
      await prisma.kyc_documents.deleteMany({});
      await prisma.settlements.deleteMany({});
      await prisma.lots.deleteMany({});
      await prisma.assets.deleteMany({});
      await prisma.auction_sessions.deleteMany({});
      await prisma.branches.deleteMany({});
      await prisma.users.deleteMany({
        where: { email: { in: [adminEmail, bidderEmail, oddPkgEmail] } },
      });
      await prisma.$disconnect();
    });

    it('bills the winner exactly once when the timer and an admin close the same lot together', async () => {
      // The real trigger: the countdown hits zero at the same moment an admin
      // presses "tutup lot". Before the per-lot lock both callers passed the
      // status check and the bidder got two invoices for one car.
      const results = await Promise.allSettled([
        biddingService.settleLot(lotId),
        biddingService.settleLot(lotId),
      ]);

      expect(results.every((r) => r.status === 'fulfilled')).toBe(true);

      const invoices = await prisma.invoices.findMany({ where: { lot_id: lotId } });
      expect(invoices).toHaveLength(1);

      const settlements = await prisma.settlements.findMany({ where: { lot_id: lotId } });
      expect(settlements).toHaveLength(1);

      const settledLot = await prisma.lots.findUnique({ where: { id: lotId } });
      expect(settledLot?.status).toBe(LotStatus.SOLD);
      expect(settledLot?.winner_id).toBe(bidderId);
    });

    it('refuses a bid when package_type is not a number instead of granting unlimited quota', async () => {
      // parseInt('paket-emas') is NaN, and every quota comparison is false
      // against NaN — so this row used to wave the bidder straight through with
      // no NIPL limit at all.
      await prisma.deposits.create({
        data: {
          user_id: oddPkgId,
          session_id: sessionId,
          amount: new Prisma.Decimal(5_000_000),
          unit_type: 'mobil',
          package_type: 'paket-emas',
          payment_method: 'va_bca',
          status: DepositStatus.PAID,
        },
      });

      await expect(
        biddingService.validateBid(
          {
            userId: oddPkgId,
            sessionId,
            lotId: quotaLotId,
            amount: 50_500_000,
          },
          50_000_000,
          undefined
        )
      ).rejects.toThrow(/NIPL/i);
    });

    it('still accepts a bid backed by a well-formed deposit', async () => {
      await prisma.deposits.create({
        data: {
          user_id: bidderId,
          session_id: sessionId,
          amount: new Prisma.Decimal(5_000_000),
          unit_type: 'mobil',
          package_type: '2',
          payment_method: 'va_bca',
          status: DepositStatus.PAID,
        },
      });

      await expect(
        biddingService.validateBid(
          {
            userId: bidderId,
            sessionId,
            lotId: quotaLotId,
            amount: 50_500_000,
          },
          50_000_000,
          undefined
        )
      ).resolves.toBeUndefined();
    });
  });
});
