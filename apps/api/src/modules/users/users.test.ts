import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Users Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;
  let bidderId: string;

  beforeAll(async () => {
    // Create admin user for authenticated requests
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.users.upsert({
      where: { email: 'test-admin-users@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-users@indo-lelang.com',
        phone: '+628110001001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Users',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    const bidder = await prisma.users.upsert({
      where: { email: 'test-bidder-users@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-users@indo-lelang.com',
        phone: '+628110001002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Users',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    bidderId = bidder.id;

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-users@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-users@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-users@indo-lelang.com', 'test-bidder-users@indo-lelang.com'] },
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return profile of authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test-bidder-users@indo-lelang.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({ full_name: 'Updated Bidder Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('should list users for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?role=bidder')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject non-admin access', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    it('should get user by ID for admin', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${bidderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(bidderId);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
