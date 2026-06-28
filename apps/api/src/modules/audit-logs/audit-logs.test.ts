import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Audit Logs Module Integration Tests', () => {
  let adminToken: string;
  let bidderToken: string;
  let adminId: string;
  let auditLogId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = await prisma.users.upsert({
      where: { email: 'test-admin-audit@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-admin-audit@indo-lelang.com',
        phone: '+628110009001',
        password_hash: hashedPassword,
        full_name: 'Test Admin Audit',
        role: Role.ADMIN,
        status: 'active',
      },
    });
    adminId = admin.id;

    await prisma.users.upsert({
      where: { email: 'test-bidder-audit@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-audit@indo-lelang.com',
        phone: '+628110009002',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Audit',
        role: Role.BIDDER,
        status: 'active',
      },
    });

    // Create test audit log entries
    const log = await prisma.audit_logs.create({
      data: {
        user_id: adminId,
        action: 'kyc_approve',
        resource_type: 'kyc_documents',
        resource_id: '00000000-0000-0000-0000-000000000001',
        old_value: JSON.stringify({ status: 'pending' }),
        new_value: JSON.stringify({ status: 'approved' }),
        ip_address: '127.0.0.1',
      },
    });
    auditLogId = log.id;

    await prisma.audit_logs.create({
      data: {
        user_id: adminId,
        action: 'settings_update',
        resource_type: 'platform_settings',
        resource_id: '00000000-0000-0000-0000-000000000002',
        old_value: JSON.stringify({ value: 'true' }),
        new_value: JSON.stringify({ value: 'false' }),
        ip_address: '127.0.0.1',
      },
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-admin-audit@indo-lelang.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data?.accessToken;

    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-audit@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.audit_logs.deleteMany({ where: { user_id: adminId } });
    await prisma.users.deleteMany({
      where: {
        email: { in: ['test-admin-audit@indo-lelang.com', 'test-bidder-audit@indo-lelang.com'] },
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('GET /api/v1/audit-logs', () => {
    it('should list audit logs for admin', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by resource_type', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs?resource_type=kyc_documents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter by user_id', async () => {
      const res = await request(app)
        .get(`/api/v1/audit-logs?user_id=${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject bidder access (admin only)', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/audit-logs/:id', () => {
    it('should get audit log by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/audit-logs/${auditLogId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(auditLogId);
      expect(res.body.data.user).toBeDefined();
    });

    it('should return 404 for non-existent log', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/audit-logs/entity/:resource_type/:resource_id', () => {
    it('should get logs for a specific entity', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs/entity/kyc_documents/00000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/audit-logs/export', () => {
    it('should export audit logs (no pagination)', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
