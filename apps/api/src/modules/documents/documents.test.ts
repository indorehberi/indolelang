import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { generateAccessToken } from '../../lib/jwt';
import { Role, UserStatus } from '../../../../../packages/shared-types/src/enums';
import fs from 'fs';
import path from 'path';
import { htmlToPdf } from '../../lib/pdf';

jest.mock('../../lib/pdf', () => ({
  htmlToPdf: jest.fn(),
}));

describe('Documents Generation & Verification Module Integration Tests', () => {
  const bidder1Email = 'bidder1@example.com';
  const bidder2Email = 'bidder2@example.com';
  const adminEmail = 'admin_doc_test@example.com';

  let bidder1Id: string;
  let bidder2Id: string;
  let adminId: string;

  let branchId: string;
  let sessionId: string;
  let assetId: string;
  let lot1Id: string;
  let lot2Id: string;

  let invoice1Id: string; // unpaid
  let invoice2Id: string; // paid

  let bidder1Token: string;
  let bidder2Token: string;
  let adminToken: string;

  beforeAll(async () => {
    // Cleanup leftovers
    await prisma.documents.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.bids.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.nipl_allocations.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    const testPhones = ['+628111111111', '+628222222222', '+628333333333'];
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: { in: [bidder1Email, bidder2Email, adminEmail] } },
          { phone: { in: testPhones } },
        ],
      },
    });

    // Create users
    const bidder1 = await prisma.users.create({
      data: {
        email: bidder1Email,
        phone: '+628111111111',
        password_hash: 'hashed',
        full_name: 'Bidder Satu',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidder1Id = bidder1.id;

    const bidder2 = await prisma.users.create({
      data: {
        email: bidder2Email,
        phone: '+628222222222',
        password_hash: 'hashed',
        full_name: 'Bidder Dua',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    bidder2Id = bidder2.id;

    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        phone: '+628333333333',
        password_hash: 'hashed',
        full_name: 'Admin Toko',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    // Create branch
    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Cabang Jakarta Pusat',
        city: 'Jakarta',
        address: 'Jl. Hayam Wuruk',
        phone: '+6221555555',
        pic_name: 'Pak Budi',
        is_active: true,
      },
    });
    branchId = branch.id;

    // Create session
    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Sesi Kendaraan JKT',
        scheduled_at: new Date(),
        status: 'published',
      },
    });
    sessionId = session.id;

    // Create asset
    const asset = await prisma.assets.create({
      data: {
        provider_id: adminId,
        category: 'mobil',
        title: 'Honda Civic Turbo 2020',
        base_price: 350000000,
        status: 'approved',
      },
    });
    assetId = asset.id;

    // Create lots
    const lot1 = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: assetId,
        lot_number: 1,
        starting_price: 350000000,
        hammer_price: 360000000,
        winner_id: bidder1Id,
        status: 'sold',
      },
    });
    lot1Id = lot1.id;

    const lot2 = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: assetId,
        lot_number: 2,
        starting_price: 350000000,
        hammer_price: 355000000,
        winner_id: bidder1Id,
        status: 'sold',
      },
    });
    lot2Id = lot2.id;

    // Create invoices
    const invoice1 = await prisma.invoices.create({
      data: {
        lot_id: lot1Id,
        bidder_id: bidder1Id,
        hammer_price: 360000000,
        commission: 10800000,
        tax: 1188000,
        total: 371988000,
        due_date: new Date(Date.now() + 5 * 86400000),
        status: 'unpaid',
      },
    });
    invoice1Id = invoice1.id;

    const invoice2 = await prisma.invoices.create({
      data: {
        lot_id: lot2Id,
        bidder_id: bidder1Id,
        hammer_price: 355000000,
        commission: 10650000,
        tax: 1171500,
        total: 366821500,
        due_date: new Date(Date.now() + 5 * 86400000),
        status: 'paid',
        paid_at: new Date(),
      },
    });
    invoice2Id = invoice2.id;

    // Generate tokens
    bidder1Token = generateAccessToken({ id: bidder1Id, email: bidder1Email, role: Role.BIDDER, status: UserStatus.ACTIVE });
    bidder2Token = generateAccessToken({ id: bidder2Id, email: bidder2Email, role: Role.BIDDER, status: UserStatus.ACTIVE });
    adminToken = generateAccessToken({ id: adminId, email: adminEmail, role: Role.ADMIN, status: UserStatus.ACTIVE });
  });

  beforeEach(() => {
    (htmlToPdf as jest.Mock).mockResolvedValue(Buffer.from('mocked pdf content'));
  });

  afterAll(async () => {
    // Cleanup
    await prisma.documents.deleteMany({});
    await prisma.settlements.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.bids.deleteMany({});
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.nipl_allocations.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    const testPhones = ['+628111111111', '+628222222222', '+628333333333'];
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: { in: [bidder1Email, bidder2Email, adminEmail] } },
          { phone: { in: testPhones } },
        ],
      },
    });

    await prisma.$disconnect();
    if (redis.isOpen) {
      await redis.quit();
    }

    // Cleanup uploaded files
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

  describe('GET /api/v1/documents/invoices', () => {
    it('should fail if access token is missing', async () => {
      const res = await request(app).get('/api/v1/documents/invoices');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return paginated invoices for admin', async () => {
      const res = await request(app)
        .get('/api/v1/documents/invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta).toBeDefined();
    });

    it('should return only bidder-specific invoices for bidder', async () => {
      const res = await request(app)
        .get('/api/v1/documents/invoices')
        .set('Authorization', `Bearer ${bidder1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/documents/invoice/:invoiceId/download', () => {
    it('should allow the winner bidder to download invoice PDF', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/invoice/${invoice1Id}/download`)
        .set('Authorization', `Bearer ${bidder1Token}`);

      expect(res.status).toBe(200);
      // Wait: depending on puppeteer availability, it can be pdf or html fallback
      expect(res.header['content-type']).toMatch(/pdf|octet-stream|html/);
    });

    it('should deny access to another bidder', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/invoice/${invoice1Id}/download`)
        .set('Authorization', `Bearer ${bidder2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/documents/sj/:invoiceId/download', () => {
    it('should fail with 400 if invoice is unpaid', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/sj/${invoice1Id}/download`)
        .set('Authorization', `Bearer ${bidder1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should succeed with 200 if invoice is paid', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/sj/${invoice2Id}/download`)
        .set('Authorization', `Bearer ${bidder1Token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/documents/bast/:invoiceId/download', () => {
    it('should fail with 400 if invoice is unpaid', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/bast/${invoice1Id}/download`)
        .set('Authorization', `Bearer ${bidder1Token}`);

      expect(res.status).toBe(400);
    });

    it('should succeed with 200 if invoice is paid', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/bast/${invoice2Id}/download`)
        .set('Authorization', `Bearer ${bidder1Token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/documents/:qr_hash/verify', () => {
    it('should verify document and return validation metadata', async () => {
      // First, trigger a download to generate a document record
      await request(app)
        .get(`/api/v1/documents/invoice/${invoice2Id}/download`)
        .set('Authorization', `Bearer ${bidder1Token}`);

      // Retrieve the generated document qr_hash
      const doc = await prisma.documents.findFirst({
        where: { invoice_id: invoice2Id, type: 'invoice' },
      });
      expect(doc).toBeDefined();
      expect(doc!.qr_hash).toBeDefined();

      // Verify publicly
      const res = await request(app).get(`/api/v1/documents/${doc!.qr_hash}/verify`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('valid');
      expect(res.body.data.document_type).toBe('invoice');
      expect(res.body.data.bidder_name).toBe('Bidder Satu');
    });

    it('should return 404 for invalid qr_hash', async () => {
      const res = await request(app).get('/api/v1/documents/non_existent_hash_123/verify');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
