import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Testimonials Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;
  let testimonialId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Create Admin User
    await prisma.users.upsert({
      where: { email: 'test-admin-testimonial@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-testimonial@indo-lelang.com',
        phone: '+628110005001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Testimonial',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    // Create Bidder User
    await prisma.users.upsert({
      where: { email: 'test-bidder-testimonial@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-testimonial@indo-lelang.com',
        phone: '+628110005002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Testimonial',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-testimonial@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    // Login Bidder
    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-testimonial@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    // Cleanup created test testimonials
    await prisma.testimonials.deleteMany({
      where: {
        user: {
          email: 'test-bidder-testimonial@indo-lelang.com',
        },
      },
    });

    // Cleanup users
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-testimonial@indo-lelang.com', 'test-bidder-testimonial@indo-lelang.com'] },
      },
    });

    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('POST /api/v1/testimonials', () => {
    it('should successfully submit a new testimonial (bidder only)', async () => {
      const res = await request(app)
        .post('/api/v1/testimonials')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          rating: 5,
          content: 'Layanan pelelangan mobil yang sangat profesional, cepat, dan transparan!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('pending'); // Default status should be pending
      expect(res.body.data.rating).toBe(5);
      testimonialId = res.body.data.id;
    });

    it('should reject testimonial creation with invalid rating (e.g. 6)', async () => {
      const res = await request(app)
        .post('/api/v1/testimonials')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          rating: 6,
          content: 'Rating terlalu tinggi, harusnya ditolak.',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject testimonial creation with too short content', async () => {
      const res = await request(app)
        .post('/api/v1/testimonials')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          rating: 4,
          content: 'Pendek',
        });

      expect(res.status).toBe(400);
    });

    it('should reject testimonial submission if token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/testimonials')
        .send({
          rating: 4,
          content: 'Mencoba mengirimkan tanpa login',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/testimonials (pending status)', () => {
    it('should not display the pending testimonial in public list', async () => {
      const res = await request(app).get('/api/v1/testimonials');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.find((t: any) => t.id === testimonialId);
      expect(found).toBeUndefined();
    });
  });

  describe('GET /api/v1/admin/testimonials', () => {
    it('should list all testimonials for admin including pending ones', async () => {
      const res = await request(app)
        .get('/api/v1/admin/testimonials')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.find((t: any) => t.id === testimonialId);
      expect(found).toBeDefined();
      expect(found.status).toBe('pending');
    });

    it('should reject bidder accessing administrative list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/testimonials')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/admin/testimonials/:id/status', () => {
    it('should approve the pending testimonial successfully (admin only)', async () => {
      if (!testimonialId) return;

      const res = await request(app)
        .put(`/api/v1/admin/testimonials/${testimonialId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
    });
  });

  describe('GET /api/v1/testimonials (post-approve)', () => {
    it('should now display the approved testimonial in public list', async () => {
      const res = await request(app).get('/api/v1/testimonials');

      expect(res.status).toBe(200);
      const found = res.body.data.find((t: any) => t.id === testimonialId);
      expect(found).toBeDefined();
      expect(found.user.full_name).toBe('Test Bidder Testimonial');
    });
  });

  describe('DELETE /api/v1/admin/testimonials/:id', () => {
    it('should soft delete the testimonial', async () => {
      if (!testimonialId) return;

      const deleteRes = await request(app)
        .delete(`/api/v1/admin/testimonials/${testimonialId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify that it is no longer listed in the public approved list
      const getRes = await request(app).get('/api/v1/testimonials');
      const found = getRes.body.data.find((t: any) => t.id === testimonialId);
      expect(found).toBeUndefined();
    });
  });
});
