import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Sessions Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;
  let branchId: string;
  let sessionId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    await prisma.users.upsert({
      where: { email: 'test-admin-session@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-session@indo-lelang.com',
        phone: '+628110004001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Session',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    await prisma.users.upsert({
      where: { email: 'test-bidder-session@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-session@indo-lelang.com',
        phone: '+628110004002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Session',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    // Create a branch for sessions
    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'test-tenant-session',
        name: 'Test Session Branch',
        city: 'Surabaya',
        address: 'Jl. Test Session No. 1',
        phone: '+62311234567',
        pic_name: 'Test PIC',
      },
    });
    branchId = branch.id;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-session@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-session@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    if (sessionId) {
      await prisma.auction_sessions.deleteMany({ where: { id: sessionId } });
    }
    await prisma.branches.deleteMany({ where: { id: branchId } });
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-session@indo-lelang.com', 'test-bidder-session@indo-lelang.com'] },
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('POST /api/v1/admin/sessions', () => {
    it('should create a new auction session', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const res = await request(app)
        .post('/api/v1/admin/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_id: branchId,
          title: 'Test Auction Session',
          description: 'Sesi lelang untuk testing',
          scheduled_at: futureDate.toISOString(),
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      if (res.body.data?.id) sessionId = res.body.data.id;
    });

    it('should fall back to default branch when branch_id is not provided', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const res = await request(app)
        .post('/api/v1/admin/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Fallback Session',
          description: 'Sesi lelang fallback',
          scheduled_at: futureDate.toISOString(),
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.branch_id).toBeDefined();
    });
  });

  describe('GET /api/v1/sessions', () => {
    it('should list sessions', async () => {
      const res = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter sessions by status', async () => {
      const res = await request(app)
        .get('/api/v1/sessions?status=draft')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/sessions/:id', () => {
    it('should get session by ID', async () => {
      if (!sessionId) return;

      const res = await request(app)
        .get(`/api/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sessionId);
    });
  });
});
