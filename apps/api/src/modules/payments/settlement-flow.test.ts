import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { generateAccessToken } from '../../lib/jwt';
import {
  Role,
  UserStatus,
  LotStatus,
  AssetStatus,
  SessionStatus,
  DepositStatus
} from '../../../../../packages/shared-types/src/enums';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

describe('Settlement Flow End-to-End Integration Tests', () => {
  const adminEmail = 'settle_flow_admin@example.com';
  const providerEmail = 'settle_flow_provider@example.com';
  const bidderEmail = 'settle_flow_bidder@example.com';
  const loserEmail = 'settle_flow_loser@example.com';

  let adminId: string;
  let providerId: string;
  let bidderId: string;
  let loserId: string;

  let branchId: string;
  let sessionId: string;
  let assetId: string;
  let lotId: string;
  let invoiceId: string;
  let loserDepositId: string;

  let adminToken: string;
  let bidderToken: string;
  let providerToken: string;

  beforeAll(async () => {
    // 1. Cleanup leftovers
    await prisma.documents.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    const emails = [adminEmail, providerEmail, bidderEmail, loserEmail];
    await prisma.users.deleteMany({
      where: {
        email: { in: emails },
      },
    });

    // 2. Create users
    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        phone: '+628777777000',
        password_hash: 'hashed',
        full_name: 'Admin Keuangan',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    const provider = await prisma.users.create({
      data: {
        email: providerEmail,
        phone: '+628777777001',
        password_hash: 'hashed',
        full_name: 'Provider Mobilindo',
        role: Role.PROVIDER,
        status: UserStatus.ACTIVE,
      },
    });
    providerId = provider.id;

    const bidder = await prisma.users.create({
      data: {
        email: bidderEmail,
        phone: '+628777777002',
        password_hash: 'hashed',
        full_name: 'Bidder Pemenang',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidderId = bidder.id;

    const loser = await prisma.users.create({
      data: {
        email: loserEmail,
        phone: '+628777777003',
        password_hash: 'hashed',
        full_name: 'Bidder Kalah',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    loserId = loser.id;

    // 3. Create branch
    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Cabang Bandung Settle',
        city: 'Bandung',
        address: 'Jl. Riau No. 50',
        phone: '+62225559876',
        pic_name: 'Pak Sitorus',
        is_active: true,
      },
    });
    branchId = branch.id;

    // 4. Create session
    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Sesi Settle Bandung',
        scheduled_at: new Date(),
        status: SessionStatus.PUBLISHED,
      },
    });
    sessionId = session.id;

    // 5. Create asset (owned by provider)
    const asset = await prisma.assets.create({
      data: {
        provider_id: providerId,
        category: 'mobil',
        title: 'Toyota Avanza Veloz 2020',
        base_price: 150_000_000,
        status: AssetStatus.APPROVED,
      },
    });
    assetId = asset.id;

    // 6. Create lot (sold status)
    const lot = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: assetId,
        lot_number: 1,
        starting_price: 150_000_000,
        hammer_price: 160_000_000,
        winner_id: bidderId,
        status: LotStatus.SOLD,
      },
    });
    lotId = lot.id;

    // 7. Create unpaid invoice for the winning lot
    // total = hammer_price (160,000,000) + commission 3% (4,800,000) + premium 1.5% (2,400,000) + tax 11% (18,480,000) = 185,680,000
    const invoice = await prisma.invoices.create({
      data: {
        lot_id: lotId,
        bidder_id: bidderId,
        hammer_price: 160_000_000,
        commission: 4_800_000,
        tax: 18_480_000,
        total: 185_680_000,
        due_date: new Date(Date.now() + 5 * 86400000),
        status: 'unpaid',
      },
    });
    invoiceId = invoice.id;

    // 8. Create deposit for bidder who lost the session (pending refund)
    const loserDeposit = await prisma.deposits.create({
      data: {
        user_id: loserId,
        session_id: sessionId,
        amount: new Prisma.Decimal(5_000_000),
        payment_method: 'va_bca',
        status: DepositStatus.PENDING,
        va_number: '1234500009',
      },
    });
    
    // Set to paid then to pending_refund to simulate the refund queue
    await prisma.deposits.update({
      where: { id: loserDeposit.id },
      data: { status: DepositStatus.PAID },
    });
    const updatedLoserDeposit = await prisma.deposits.update({
      where: { id: loserDeposit.id },
      data: { status: 'pending_refund' },
    });
    loserDepositId = updatedLoserDeposit.id;

    // 9. Generate tokens
    adminToken = generateAccessToken({ id: adminId, email: adminEmail, role: Role.ADMIN, status: UserStatus.ACTIVE });
    bidderToken = generateAccessToken({ id: bidderId, email: bidderEmail, role: Role.BIDDER, status: UserStatus.ACTIVE });
    providerToken = generateAccessToken({ id: providerId, email: providerEmail, role: Role.PROVIDER, status: UserStatus.ACTIVE });
  });

  afterAll(async () => {
    // Teardown
    await prisma.documents.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.deposits.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    const emails = [adminEmail, providerEmail, bidderEmail, loserEmail];
    await prisma.users.deleteMany({
      where: {
        email: { in: emails },
      },
    });

    await prisma.$disconnect();
    if (redis.isOpen) {
      await redis.quit();
    }

    // Cleanup generated document files
    const uploadsDir = path.resolve(process.cwd(), 'uploads/documents');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file.endsWith('.pdf') || file.endsWith('.html')) {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
          } catch (e) {}
        }
      }
    }
  });

  describe('Midtrans Payment Webhook handling', () => {
    it('should process invoice paid status and generate provider settlement record', async () => {
      const orderId = `INV-${invoiceId}`;
      const grossAmount = '185680000.00';
      const statusCode = '200';
      const serverKey = process.env.MIDTRANS_SERVER_KEY || 'dummy-server-key';

      // Signature Key generation
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

      // Verify invoice marked as paid
      const updatedInvoice = await prisma.invoices.findUnique({
        where: { id: invoiceId },
      });
      expect(updatedInvoice!.status).toBe('paid');
      expect(updatedInvoice!.paid_at).toBeDefined();

      // Verify settlement created for provider
      const settlement = await prisma.settlements.findFirst({
        where: { lot_id: lotId },
      });
      expect(settlement).toBeDefined();
      expect(settlement!.status).toBe('pending');
      expect(Number(settlement!.gross_amount)).toBe(160_000_000); // Hammer Price
      // commission_deducted = 5% of hammer = 8_000_000
      expect(Number(settlement!.commission_deducted)).toBe(8_000_000);
      // net_amount = 160_000_000 - 8_000_000 = 152_000_000
      expect(Number(settlement!.net_amount)).toBe(152_000_000);
    });
  });

  describe('Provider Settlement Disbursement via Xendit', () => {
    it('should disburse the settlement amount successfully', async () => {
      const settlement = await prisma.settlements.findFirst({
        where: { lot_id: lotId },
      });

      const res = await request(app)
        .post(`/api/v1/payments/settlements/${settlement!.id}/disburse`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('processed'); // COMPLETED status in mock mapped to processed

      const updatedSettle = await prisma.settlements.findUnique({
        where: { id: settlement!.id },
      });
      expect(updatedSettle!.status).toBe('processed');
      expect(updatedSettle!.transferred_at).toBeDefined();
    });
  });

  describe('Release and Download of Delivery Documents (Surat Jalan & BAST)', () => {
    it('should allow the bidder to download Surat Jalan now that the invoice is paid', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/sj/${invoiceId}/download`)
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/pdf|octet-stream|html/);
    });

    it('should allow the bidder to download BAST now that the invoice is paid', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/bast/${invoiceId}/download`)
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/pdf|octet-stream|html/);
    });
  });

  describe('Loser Deposit NIPL Refund processing', () => {
    it('should display the refund queue to the admin', async () => {
      const res = await request(app)
        .get('/api/v1/payments/deposits/refund-queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const item = res.body.data.find((d: any) => d.id === loserDepositId);
      expect(item).toBeDefined();
      expect(item.status).toBe('pending_refund');
    });

    it('should execute the refund of the deposit successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/payments/deposits/${loserDepositId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('refunded');

      // Verify notification generated for loser
      const notif = await prisma.notifications.findFirst({
        where: {
          user_id: loserId,
          type: 'deposit_refunded',
        },
      });
      expect(notif).toBeDefined();
    });
  });
});
