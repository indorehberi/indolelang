import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Assets Module Integration Tests', () => {
  let adminToken: string;
  let providerToken: string;
  let providerId: string;
  let assetId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    await prisma.users.upsert({
      where: { email: 'test-admin-asset@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-asset@indo-lelang.com',
        phone: '+628110005001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Asset',
        role: Role.ADMIN,
        status: 'active',
      },
    });

    const provider = await prisma.users.upsert({
      where: { email: 'test-provider-asset@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-provider-asset@indo-lelang.com',
        phone: '+628110005002',
        password_hash: hashedPassword,
        full_name: 'Test Provider Asset',
        role: Role.PROVIDER,
        status: 'active',
      },
    });
    providerId = provider.id;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-asset@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    const providerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-provider-asset@indo-lelang.com', password: 'Admin123!' });
    providerToken = providerLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    if (assetId) {
      await prisma.assets.deleteMany({ where: { id: assetId } });
    }
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-asset@indo-lelang.com', 'test-provider-asset@indo-lelang.com'] },
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('POST /api/v1/assets', () => {
    it('should create a new asset (provider)', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          category: 'mobil',
          title: 'Toyota Avanza 2020 Test',
          description: 'Kondisi baik, surat lengkap',
          base_price: 150000000,
          images: JSON.stringify(['https://s3.example.com/avanza-1.jpg']),
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      if (res.body.data?.id) assetId = res.body.data.id;
    });

    it('accepts a submission with only a partial body — every field is optional', async () => {
      // The "Ajukan Titip Jual" / "Tambah Barang" forms treat every field as
      // optional; createAsset() fills in defaults (category, base_price) for
      // whatever is left out rather than rejecting the request.
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Missing Fields',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      if (res.body.data?.id) {
        await prisma.assets.deleteMany({ where: { id: res.body.data.id } });
      }
    });
  });

  describe('GET /api/v1/assets', () => {
    it('should list assets', async () => {
      const res = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter assets by status', async () => {
      const res = await request(app)
        .get('/api/v1/assets?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/admin/assets/:id/approve', () => {
    it('should approve asset (admin only)', async () => {
      if (!assetId) return;

      const res = await request(app)
        .put(`/api/v1/admin/assets/${assetId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
