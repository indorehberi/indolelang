import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { biddingService } from './bidding.service';
import {
  Role,
  UserStatus,
  LotStatus,
  AssetStatus,
  SessionStatus,
  DepositStatus,
  KycStatus
} from '../../../../../packages/shared-types/src/enums';
import { Prisma } from '@prisma/client';

describe('Bidding Flow End-to-End Integration Tests', () => {
  const adminEmail = 'bidding_flow_admin@example.com';
  const bidder1Email = 'bidding_flow_bidder1@example.com';
  const bidder2Email = 'bidding_flow_bidder2@example.com';
  const phoneAdmin = '+628111111000';
  const phoneBidder1 = '+628111111001';
  const phoneBidder2 = '+628111111002';

  let adminId: string;
  let bidder1Id: string;
  let bidder2Id: string;
  let branchId: string;
  let sessionId: string;
  let assetId: string;
  let lotId: string;

  beforeAll(async () => {
    // 1. Database Cleanup
    await prisma.bids.deleteMany({});
    await prisma.documents.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.nipl_allocations.deleteMany({});
    await prisma.kyc_documents.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({
      where: {
        email: {
          in: [adminEmail, bidder1Email, bidder2Email, 'hacker@example.com'],
        },
      },
    });

    // 2. Create admin
    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        phone: phoneAdmin,
        password_hash: 'hashed',
        full_name: 'Admin Bidding Flow',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    // 3. Create Bidder 1 (Verified, has paid deposit/NIPL)
    const bidder1 = await prisma.users.create({
      data: {
        email: bidder1Email,
        phone: phoneBidder1,
        password_hash: 'hashed',
        full_name: 'Bidder Satu',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidder1Id = bidder1.id;

    await prisma.kyc_documents.create({
      data: {
        user_id: bidder1Id,
        ktp_url: 'http://example.com/ktp1.jpg',
        selfie_url: 'http://example.com/selfie1.jpg',
        status: KycStatus.APPROVED,
        reviewed_at: new Date(),
        reviewer_id: adminId,
      },
    });

    // 4. Create Bidder 2 (Verified, has paid deposit/NIPL)
    const bidder2 = await prisma.users.create({
      data: {
        email: bidder2Email,
        phone: phoneBidder2,
        password_hash: 'hashed',
        full_name: 'Bidder Dua',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidder2Id = bidder2.id;

    await prisma.kyc_documents.create({
      data: {
        user_id: bidder2Id,
        ktp_url: 'http://example.com/ktp2.jpg',
        selfie_url: 'http://example.com/selfie2.jpg',
        status: KycStatus.APPROVED,
        reviewed_at: new Date(),
        reviewer_id: adminId,
      },
    });

    // 5. Create Branch
    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Branch Jakarta Bidding',
        city: 'Jakarta',
        address: 'Jl. Sudirman No. 1',
        phone: '+62215551234',
        pic_name: 'PIC Jakarta',
        is_active: true,
      },
    });
    branchId = branch.id;

    // 6. Create Auction Session
    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Lelang Mobil Mewah Jakarta',
        description: 'Sesi lelang mobil mewah',
        scheduled_at: new Date(),
        status: SessionStatus.PUBLISHED,
      },
    });
    sessionId = session.id;

    // 7. Create Asset
    const asset = await prisma.assets.create({
      data: {
        provider_id: adminId,
        category: 'mobil',
        title: 'Porsche 911 Carrera 2021',
        base_price: new Prisma.Decimal(2_000_000_000), // Starting Price 2M
        status: AssetStatus.APPROVED,
      },
    });
    assetId = asset.id;

    // 8. Create Lot
    const lot = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: assetId,
        lot_number: 1,
        starting_price: new Prisma.Decimal(2_000_000_000),
        status: LotStatus.PENDING,
      },
    });
    lotId = lot.id;

    // 9. Deposit / NIPL Setup for Bidder 1 & Bidder 2
    await prisma.deposits.create({
      data: {
        user_id: bidder1Id,
        session_id: sessionId,
        amount: new Prisma.Decimal(10_000_000),
        payment_method: 'va_bca',
        status: DepositStatus.PAID,
        va_number: '1234500001',
      },
    });

    await prisma.deposits.create({
      data: {
        user_id: bidder2Id,
        session_id: sessionId,
        amount: new Prisma.Decimal(10_000_000),
        payment_method: 'va_bca',
        status: DepositStatus.PAID,
        va_number: '1234500002',
      },
    });

    await prisma.nipl_allocations.create({
      data: {
        user_id: bidder1Id,
        session_id: sessionId,
        allocated_quantity: 2,
        used_quantity: 0,
      },
    });

    await prisma.nipl_allocations.create({
      data: {
        user_id: bidder2Id,
        session_id: sessionId,
        allocated_quantity: 2,
        used_quantity: 0,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.bids.deleteMany({});
    await prisma.documents.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.nipl_allocations.deleteMany({});
    await prisma.kyc_documents.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({
      where: {
        email: {
          in: [adminEmail, bidder1Email, bidder2Email, 'hacker@example.com'],
        },
      },
    });

    await prisma.$disconnect();
    if (redis.isOpen) {
      await redis.quit();
    }
  });

  describe('Bidding Process Validations', () => {
    it('should reject a bid if the bidder does not have NIPL (paid deposit)', async () => {
      // Create a bidder without deposit
      const hacker = await prisma.users.create({
        data: {
          email: 'hacker@example.com',
          phone: '+628999999000',
          password_hash: 'hashed',
          full_name: 'No Deposit Bidder',
          role: Role.BIDDER,
          status: UserStatus.ACTIVE,
        },
      });

      await expect(
        biddingService.validateBid(
          {
            userId: hacker.id,
            sessionId,
            lotId,
            amount: 2_005_000_000,
          },
          2_000_000_000
        )
      ).rejects.toThrow('Anda tidak memiliki NIPL aktif yang sesuai untuk melakukan penawaran.');

      await prisma.users.delete({ where: { id: hacker.id } });
    });

    it('should reject a bid if amount is below starting price plus minimum increment', async () => {
      await expect(
        biddingService.validateBid(
          {
            userId: bidder1Id,
            sessionId,
            lotId,
            amount: 2_000_400_000, // Below minimum increment
          },
          2_000_000_000
        )
      ).rejects.toThrow('Penawaran minimal adalah');
    });

    it('should allow Bidder 1 to place a valid bid', async () => {
      const bidAmount = 2_005_000_000;
      
      // Validation should pass
      await expect(
        biddingService.validateBid(
          {
            userId: bidder1Id,
            sessionId,
            lotId,
            amount: bidAmount,
          },
          2_000_000_000
        )
      ).resolves.not.toThrow();

      // Submit bid to database
      const newBid = await prisma.bids.create({
        data: {
          lot_id: lotId,
          bidder_id: bidder1Id,
          amount: new Prisma.Decimal(bidAmount),
          is_winning: true,
        },
      });

      expect(newBid.id).toBeDefined();
      expect(Number(newBid.amount)).toBe(bidAmount);
    });

    it('should reject Bidder 1 from bidding again immediately (cannot outbid yourself)', async () => {
      await expect(
        biddingService.validateBid(
          {
            userId: bidder1Id,
            sessionId,
            lotId,
            amount: 2_010_000_000,
          },
          2_005_000_000,
          bidder1Id // Currently highest bidder
        )
      ).rejects.toThrow('Anda sudah memegang penawaran tertinggi saat ini');
    });

    it('should allow Bidder 2 to outbid Bidder 1', async () => {
      const outbidAmount = 2_010_000_000;

      // Validation should pass
      await expect(
        biddingService.validateBid(
          {
            userId: bidder2Id,
            sessionId,
            lotId,
            amount: outbidAmount,
          },
          2_005_000_000,
          bidder1Id
        )
      ).resolves.not.toThrow();

      // Save Bidder 2 bid
      const newBid = await prisma.bids.create({
        data: {
          lot_id: lotId,
          bidder_id: bidder2Id,
          amount: new Prisma.Decimal(outbidAmount),
          is_winning: true,
        },
      });

      // Update previous bid is_winning to false
      await prisma.bids.updateMany({
        where: {
          lot_id: lotId,
          id: { not: newBid.id },
        },
        data: {
          is_winning: false,
        },
      });

      expect(newBid.id).toBeDefined();
    });

    it('should extend the active lot timer under 30s threshold (anti-sniping)', () => {
      // timeRemaining = 25s, extensionCount = 0.
      // Should extend to 60s and increase extensionCount to 1.
      const result = biddingService.calculateAntiSnipe(25, 0);
      expect(result.extended).toBe(true);
      expect(result.newTimeRemaining).toBe(60);
      expect(result.extensionCount).toBe(1);
    });

    it('should settle the lot successfully and determine Bidder 2 as the winner', async () => {
      // Settle lot
      const settledLot = await biddingService.settleLot(lotId);

      expect(settledLot.status).toBe(LotStatus.SOLD);
      expect(Number(settledLot.hammer_price)).toBe(2_010_000_000);
      expect(settledLot.winner_id).toBe(bidder2Id);

      // Verify invoice was created for bidder 2
      const invoice = await prisma.invoices.findFirst({
        where: {
          lot_id: lotId,
          bidder_id: bidder2Id,
        },
      });

      expect(invoice).toBeDefined();
      expect(invoice?.status).toBe('unpaid');
      expect(Number(invoice?.hammer_price)).toBe(2_010_000_000);

      // Verify notification was created
      const notif = await prisma.notifications.findFirst({
        where: {
          user_id: bidder2Id,
          type: 'bid_won',
        },
      });
      expect(notif).toBeDefined();
    });
  });
});
