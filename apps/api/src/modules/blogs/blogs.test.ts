import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Blogs Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;
  let blogId: string;
  let blogSlug: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Create Admin User
    await prisma.users.upsert({
      where: { email: 'test-admin-blog@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-blog@indo-lelang.com',
        phone: '+628110004001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Blog',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    // Create Bidder User
    await prisma.users.upsert({
      where: { email: 'test-bidder-blog@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-blog@indo-lelang.com',
        phone: '+628110004002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Blog',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-blog@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    // Login Bidder
    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-blog@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    // Cleanup created test blogs
    await prisma.blog_posts.deleteMany({
      where: {
        author: {
          email: 'test-admin-blog@indo-lelang.com',
        },
      },
    });

    // Cleanup users
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-blog@indo-lelang.com', 'test-bidder-blog@indo-lelang.com'] },
      },
    });

    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('POST /api/v1/admin/blogs', () => {
    it('should successfully create a new blog post as draft (admin only)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tips Membeli Mobil Bekas di Lelang',
          content: 'Ini adalah artikel panduan lengkap cara membeli mobil bekas berkualitas melalui pelelangan online Indo-Lelang.',
          image_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4',
          status: 'draft',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.slug).toContain('tips-membeli-mobil-bekas-di-lelang');
      expect(res.body.data.status).toBe('draft');
      blogId = res.body.data.id;
      blogSlug = res.body.data.slug;
    });

    it('should reject blog post creation for bidder user', async () => {
      const res = await request(app)
        .post('/api/v1/admin/blogs')
        .set('Authorization', `Bearer ${bidderToken}`)
        .send({
          title: 'Artikel Ilegal Bidder',
          content: 'Konten artikel ilegal dari bidder.',
        });

      expect(res.status).toBe(403);
    });

    it('should reject blog post creation with invalid parameters', async () => {
      const res = await request(app)
        .post('/api/v1/admin/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Short',
          content: 'Short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blogs', () => {
    it('should list published blogs (draft should not appear)', async () => {
      const res = await request(app).get('/api/v1/blogs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Our created blog is 'draft', so it should not be in public list
      const found = res.body.data.find((b: any) => b.id === blogId);
      expect(found).toBeUndefined();
    });
  });

  describe('PUT /api/v1/admin/blogs/:id', () => {
    it('should update blog content and change status to published', async () => {
      if (!blogId) return;

      const res = await request(app)
        .put(`/api/v1/admin/blogs/${blogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'published',
          content: 'Ini adalah artikel panduan lengkap yang telah diperbarui untuk pelelangan online Indo-Lelang.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('published');
      expect(res.body.data.published_at).toBeDefined();
    });
  });

  describe('GET /api/v1/blogs (post-publish)', () => {
    it('should now list the published blog', async () => {
      const res = await request(app).get('/api/v1/blogs');

      expect(res.status).toBe(200);
      const found = res.body.data.find((b: any) => b.id === blogId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Tips Membeli Mobil Bekas di Lelang');
    });
  });

  describe('GET /api/v1/blogs/:slug', () => {
    it('should retrieve single blog post by slug', async () => {
      if (!blogSlug) return;

      const res = await request(app).get(`/api/v1/blogs/${blogSlug}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(blogId);
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/v1/blogs/slug-palsu-123');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/admin/blogs/:id', () => {
    it('should soft delete the blog post', async () => {
      if (!blogId) return;

      const deleteRes = await request(app)
        .delete(`/api/v1/admin/blogs/${blogId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify that it is no longer retrievable via public slug
      const getRes = await request(app).get(`/api/v1/blogs/${blogSlug}`);
      expect(getRes.status).toBe(404);
    });
  });
});
