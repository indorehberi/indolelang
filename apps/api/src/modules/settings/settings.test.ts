import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Settings Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    await prisma.users.upsert({
      where: { email: 'test-admin-settings@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-settings@indo-lelang.com',
        phone: '+628110007001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Settings',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    await prisma.users.upsert({
      where: { email: 'test-bidder-settings@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-settings@indo-lelang.com',
        phone: '+628110007002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Settings',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-settings@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-settings@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-settings@indo-lelang.com', 'test-bidder-settings@indo-lelang.com'] },
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('GET /api/v1/admin/settings', () => {
    it('should list all platform settings for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject bidder access to settings', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/admin/settings/:key', () => {
    it('should update a feature toggle setting', async () => {
      // Find a feature toggle to test with
      const settings = await prisma.platform_settings.findFirst({
        where: { key: { startsWith: 'feat_' } },
      });
      if (!settings) return;

      const currentValue = settings.value;
      const newValue = currentValue === 'true' ? 'false' : 'true';

      const res = await request(app)
        .put(`/api/v1/admin/settings/${settings.key}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: newValue });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Restore original value
      await request(app)
        .put(`/api/v1/admin/settings/${settings.key}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: currentValue });
    });
  });
});
