import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Branches Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;
  let branchId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    await prisma.users.upsert({
      where: { email: 'test-admin-branch@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-branch@indo-lelang.com',
        phone: '+628110003001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Branch',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    await prisma.users.upsert({
      where: { email: 'test-bidder-branch@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-branch@indo-lelang.com',
        phone: '+628110003002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Branch',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-branch@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-branch@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    if (branchId) {
      await prisma.branches.deleteMany({ where: { id: branchId } });
    }
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-branch@indo-lelang.com', 'test-bidder-branch@indo-lelang.com'] },
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('POST /api/v1/admin/branches', () => {
    it('should create a new branch (admin only)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenant_id: 'test-tenant',
          name: 'Test Branch Monas',
          city: 'Jakarta',
          address: 'Jl. Test No. 1, Jakarta Pusat',
          phone: '+6281234567890',
          pic_name: 'Budi Test',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      if (res.body.data?.id) branchId = res.body.data.id;
    });

    it('should reject branch creation for bidder', async () => {
      const res = await request(app)
        .post('/api/v1/admin/branches')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          tenant_id: 'test-tenant',
          name: 'Unauthorized Branch',
          city: 'Jakarta',
          address: 'Jl. Test',
          phone: '+62211234568',
          pic_name: 'Test',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/branches', () => {
    it('should list all branches', async () => {
      const res = await request(app)
        .get('/api/v1/branches');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/branches/:id', () => {
    it('should get branch by ID', async () => {
      if (!branchId) return;

      const res = await request(app)
        .get(`/api/v1/branches/${branchId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(branchId);
    });
  });
});
