import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('KYC Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;
  let bidderId: string;
  let kycId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = await prisma.users.upsert({
      where: { email: 'test-admin-kyc@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-kyc@indo-lelang.com',
        phone: '+628110002001',
        password_hash: hashedPassword,
        full_name: 'Test Admin KYC',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    const bidder = await prisma.users.upsert({
      where: { email: 'test-bidder-kyc@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-kyc@indo-lelang.com',
        phone: '+628110002002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder KYC',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    bidderId = bidder.id;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-kyc@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-kyc@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.kyc_documents.deleteMany({ where: { user_id: bidderId } });
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-kyc@indo-lelang.com', 'test-bidder-kyc@indo-lelang.com'] },
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('POST /api/v1/kyc/upload-documents', () => {
    it('should submit KYC documents', async () => {
      const res = await request(app)
        .post('/api/v1/kyc/upload-documents')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          ktp_url: 'https://s3.example.com/ktp-test.jpg',
          selfie_url: 'https://s3.example.com/selfie-test.jpg',
        });

      // Accept both 201 (created) and 200 (success)
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      if (res.body.data?.id) kycId = res.body.data.id;
    });

    it('should allow updating KYC documents if already submitted', async () => {
      const res = await request(app)
        .post('/api/v1/kyc/upload-documents')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          ktp_url: 'https://s3.example.com/ktp-test2.jpg',
        });

      // Should accept since upsert updates the existing record
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/kyc/status', () => {
    it('should return KYC status for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/kyc/status')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/admin/kyc/queue', () => {
    it('should list KYC queue for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kyc/queue?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject bidder access to admin KYC queue', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kyc/queue')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/admin/kyc/:id/approve', () => {
    it('should reject bidder trying to approve KYC', async () => {
      const kyc = await prisma.kyc_documents.findFirst({
        where: { user_id: bidderId },
      });
      if (!kyc) return;

      const res = await request(app)
        .put(`/api/v1/admin/kyc/${kyc.id}/approve`)
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent KYC approval', async () => {
      const res = await request(app)
        .put('/api/v1/admin/kyc/00000000-0000-0000-0000-000000000000/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should approve KYC submission', async () => {
      // Find KYC record
      const kyc = await prisma.kyc_documents.findFirst({
        where: { user_id: bidderId },
      });
      if (!kyc) return;

      const res = await request(app)
        .put(`/api/v1/admin/kyc/${kyc.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/admin/kyc/:id/reject', () => {
    let rejectBidderId: string;
    let rejectKycId: string;

    beforeEach(async () => {
      const rejectUser = await prisma.users.create({
        data: {
          email: 'reject-bidder-kyc@indo-lelang.com',
          phone: '+628110002009',
          password_hash: 'hashed',
          full_name: 'Reject User',
          role: Role.BIDDER,
          status: 'active',
        },
      });
      rejectBidderId = rejectUser.id;

      const kyc = await prisma.kyc_documents.create({
        data: {
          user_id: rejectBidderId,
          ktp_url: 'https://s3.example.com/ktp-reject.jpg',
          status: 'pending',
        },
      });
      rejectKycId = kyc.id;
    });

    afterEach(async () => {
      await prisma.kyc_documents.deleteMany({ where: { user_id: rejectBidderId } });
      await prisma.users.deleteMany({ where: { id: rejectBidderId } });
    });

    it('should reject KYC submission with reason', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/kyc/${rejectKycId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejection_reason: 'Dokumen KTP buram dan tidak terbaca',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const kyc = await prisma.kyc_documents.findUnique({ where: { id: rejectKycId } });
      expect(kyc?.status).toBe('rejected');
      expect(kyc?.rejection_reason).toBe('Dokumen KTP buram dan tidak terbaca');
    });

    it('should return 400 when rejection reason is missing', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/kyc/${rejectKycId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}); // missing reason

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
