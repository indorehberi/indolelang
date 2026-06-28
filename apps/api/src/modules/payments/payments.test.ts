import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { redis } from '../../config/redis';
import { generateAccessToken } from '../../lib/jwt';
import { Role, UserStatus, LotStatus, DepositStatus } from '../../../../../packages/shared-types/src/enums';
import crypto from 'crypto';

describe('Advanced Payments & Disbursements Module Integration Tests', () => {
  const bidderEmail = 'pay_test_bidder@example.com';
  const providerEmail = 'pay_test_provider@example.com';
  const adminEmail = 'pay_test_admin@example.com';

  let bidderId: string;
  let providerId: string;
  let adminId: string;

  let branchId: string;
  let sessionId: string;
  let assetId: string;
  let lotId: string;
  let invoiceId: string;

  let bidderToken: string;
  let providerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // 1. Cleanup leftovers
    await prisma.settlements.deleteMany({});
    await prisma.documents.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.platform_settings.deleteMany({
      where: { key: { in: ['feat_auto_refund'] } },
    });

    const testEmails = [bidderEmail, providerEmail, adminEmail];
    const testPhones = ['+628999999111', '+628999999222', '+628999999333'];
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: { in: testEmails } },
          { phone: { in: testPhones } },
        ],
      },
    });

    // 2. Create users
    const bidder = await prisma.users.create({
      data: {
        email: bidderEmail,
        phone: '+628999999111',
        password_hash: 'hashed',
        full_name: 'Payment Test Bidder',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidderId = bidder.id;

    const provider = await prisma.users.create({
      data: {
        email: providerEmail,
        phone: '+628999999222',
        password_hash: 'hashed',
        full_name: 'Payment Test Provider',
        role: Role.PROVIDER,
        status: UserStatus.ACTIVE,
      },
    });
    providerId = provider.id;

    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        phone: '+628999999333',
        password_hash: 'hashed',
        full_name: 'Payment Test Admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    // 3. Create branch & session & asset & lot
    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Cabang Test Payment',
        city: 'Surabaya',
        address: 'Jl. Test No. 99',
        phone: '+6231555555',
        pic_name: 'Pak Bambang',
        is_active: true,
      },
    });
    branchId = branch.id;

    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Sesi Test Payment',
        scheduled_at: new Date(),
        status: 'published',
      },
    });
    sessionId = session.id;

    const asset = await prisma.assets.create({
      data: {
        provider_id: providerId,
        category: 'mobil',
        title: 'Suzuki Ertiga 2018',
        base_price: 130000000,
        status: 'approved',
      },
    });
    assetId = asset.id;

    const lot = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: assetId,
        lot_number: 1,
        starting_price: 130000000,
        hammer_price: 135000000,
        winner_id: bidderId,
        status: 'sold',
      },
    });
    lotId = lot.id;

    // Create test invoice
    const invoice = await prisma.invoices.create({
      data: {
        lot_id: lotId,
        bidder_id: bidderId,
        hammer_price: 135000000,
        commission: 4050000,
        tax: 445500,
        total: 139505000,
        due_date: new Date(Date.now() + 5 * 86400000),
        status: 'unpaid',
      },
    });
    invoiceId = invoice.id;

    // Generate tokens
    bidderToken = generateAccessToken({ id: bidderId, email: bidderEmail, role: Role.BIDDER, status: UserStatus.ACTIVE });
    providerToken = generateAccessToken({ id: providerId, email: providerEmail, role: Role.PROVIDER, status: UserStatus.ACTIVE });
    adminToken = generateAccessToken({ id: adminId, email: adminEmail, role: Role.ADMIN, status: UserStatus.ACTIVE });
  });

  afterAll(async () => {
    // Teardown
    await prisma.settlements.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.platform_settings.deleteMany({
      where: { key: { in: ['feat_auto_refund'] } },
    });

    const testEmails = [bidderEmail, providerEmail, adminEmail];
    const testPhones = ['+628999999111', '+628999999222', '+628999999333'];
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: { in: testEmails } },
          { phone: { in: testPhones } },
        ],
      },
    });

    await prisma.$disconnect();
    if (redis.isOpen) {
      await redis.quit();
    }
  });

  describe('Invoice Webhook & Settlement Creation', () => {
    it('should process invoice paid status and create provider settlement', async () => {
      // Setup payload matching Midtrans notification signature key
      const orderId = `INV-${invoiceId}`;
      const grossAmount = '139505000.00';
      const statusCode = '200';
      const serverKey = process.env.MIDTRANS_SERVER_KEY || 'dummy-server-key';

      const signatureKey = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest('hex');

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          order_id: orderId,
          gross_amount: grossAmount,
          status_code: statusCode,
          transaction_status: 'settlement',
          signature_key: signatureKey,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify invoice updated
      const updatedInvoice = await prisma.invoices.findUnique({
        where: { id: invoiceId },
      });
      expect(updatedInvoice!.status).toBe('paid');
      expect(updatedInvoice!.paid_at).toBeDefined();

      // Verify settlement created
      const settlement = await prisma.settlements.findFirst({
        where: { lot_id: lotId },
      });
      expect(settlement).toBeDefined();
      expect(settlement!.status).toBe('pending');
      expect(Number(settlement!.gross_amount)).toBe(135000000); // hammer price
      // net = hammer * 0.95 = 128250000
      expect(Number(settlement!.net_amount)).toBe(128250000);
    });
  });

  describe('GET /api/v1/payments/settlements', () => {
    it('should allow admin to list all settlements', async () => {
      const res = await request(app)
        .get('/api/v1/payments/settlements')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should allow provider to list their own settlements', async () => {
      const res = await request(app)
        .get('/api/v1/payments/settlements')
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should deny access to bidder', async () => {
      const res = await request(app)
        .get('/api/v1/payments/settlements')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/payments/settlements/:id/disburse', () => {
    it('should allow admin to execute payout disbursement to provider', async () => {
      const settlement = await prisma.settlements.findFirst({
        where: { lot_id: lotId },
      });

      const res = await request(app)
        .post(`/api/v1/payments/settlements/${settlement!.id}/disburse`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('processed'); // COMPLETED maps to processed

      const updatedSettle = await prisma.settlements.findUnique({
        where: { id: settlement!.id },
      });
      expect(updatedSettle!.status).toBe('processed');
      expect(updatedSettle!.transferred_at).toBeDefined();
    });
  });

  describe('Auto-Refund vs Manual NIPL Refund on endSession', () => {
    let testSessionId: string;
    let losingBidderId: string;
    let losingDepositId: string;
    let losingBidderToken: string;

    beforeEach(async () => {
      // Create a separate session & deposit for clean NIPL refund testing
      const losingBidder = await prisma.users.create({
        data: {
          email: 'loser_test@example.com',
          phone: '+628999999444',
          password_hash: 'hashed',
          full_name: 'Losing Bidder',
          role: Role.BIDDER,
          status: UserStatus.ACTIVE,
        },
      });
      losingBidderId = losingBidder.id;
      losingBidderToken = generateAccessToken({ id: losingBidder.id, email: losingBidder.email, role: Role.BIDDER, status: UserStatus.ACTIVE });

      const testSession = await prisma.auction_sessions.create({
        data: {
          branch_id: branchId,
          title: 'Sesi Test Refund',
          scheduled_at: new Date(),
          status: 'published',
        },
      });
      testSessionId = testSession.id;

      const deposit = await prisma.deposits.create({
        data: {
          user_id: losingBidderId,
          session_id: testSessionId,
          amount: new Prisma.Decimal(5000000),
          status: DepositStatus.PAID,
          paid_at: new Date(),
        },
      });
      losingDepositId = deposit.id;
    });

    afterEach(async () => {
      await prisma.deposits.deleteMany({ where: { session_id: testSessionId } });
      await prisma.auction_sessions.deleteMany({ where: { id: testSessionId } });
      await prisma.users.deleteMany({ where: { id: losingBidderId } });
    });

    it('should flag deposit status to pending_refund if feat_auto_refund is OFF', async () => {
      // 1. Force feature toggle feat_auto_refund to false (OFF)
      await prisma.platform_settings.deleteMany({ where: { key: 'feat_auto_refund' } });
      await prisma.platform_settings.create({
        data: {
          tenant_id: 'default',
          key: 'feat_auto_refund',
          value: 'false',
        },
      });

      // 2. Call endSession endpoint as admin
      const res = await request(app)
        .post(`/api/v1/admin/sessions/${testSessionId}/end`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify deposit status is pending_refund
      const deposit = await prisma.deposits.findUnique({
        where: { id: losingDepositId },
      });
      expect(deposit!.status).toBe('pending_refund');

      // 3. Test that deposit is present in the manual refund queue API
      const queueRes = await request(app)
        .get('/api/v1/payments/deposits/refund-queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(queueRes.status).toBe(200);
      expect(queueRes.body.data.some((d: any) => d.id === losingDepositId)).toBe(true);

      // 4. Trigger manual refund approval as admin
      const refundRes = await request(app)
        .post(`/api/v1/payments/deposits/${losingDepositId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.success).toBe(true);
      expect(refundRes.body.data.status).toBe('refunded');
    });

    it('should immediately flag deposit status as refunded if feat_auto_refund is ON', async () => {
      // 1. Force feature toggle feat_auto_refund to true (ON)
      await prisma.platform_settings.deleteMany({ where: { key: 'feat_auto_refund' } });
      await prisma.platform_settings.create({
        data: {
          tenant_id: 'default',
          key: 'feat_auto_refund',
          value: 'true',
        },
      });

      // 2. Call endSession endpoint as admin
      const res = await request(app)
        .post(`/api/v1/admin/sessions/${testSessionId}/end`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify deposit status is immediately refunded
      const deposit = await prisma.deposits.findUnique({
        where: { id: losingDepositId },
      });
      expect(deposit!.status).toBe('refunded');
    });
  });
});
