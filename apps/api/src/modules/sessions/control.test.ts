import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { generateAccessToken } from '../../lib/jwt';
import { Role, UserStatus, LotStatus, AssetStatus, SessionStatus } from '../../../../../packages/shared-types/src/enums';
import * as socketLib from '../../lib/socket';
import { Prisma } from '@prisma/client';

describe('Administrative Lelang Control Room Integration Tests', () => {
  const testAdminEmail = 'control_test_admin@example.com';
  const testPhone = '+628999999555';
  let adminId: string;
  let branchId: string;
  let sessionId: string;
  let assetId: string;
  let lotId: string;
  let token: string;
  let startMock: jest.SpyInstance;
  let closeMock: jest.SpyInstance;

  beforeAll(async () => {
    // 1. Mock Socket.io active lot timers to prevent Jest hanging handles
    startMock = jest.spyOn(socketLib, 'startActiveLot').mockImplementation(() => {});
    closeMock = jest.spyOn(socketLib, 'closeActiveLot').mockImplementation(async (id) => {
      return await prisma.lots.update({
        where: { id },
        data: { status: LotStatus.UNSOLD },
      });
    });

    // 2. Clean up leftovers
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({
      where: {
        OR: [{ email: testAdminEmail }, { phone: testPhone }],
      },
    });

    // 3. Create admin user
    const admin = await prisma.users.create({
      data: {
        email: testAdminEmail,
        phone: testPhone,
        password_hash: 'hashedPassword',
        full_name: 'Control Test Admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    // 4. Create branch
    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Test Control Branch',
        city: 'Malang',
        address: 'Jl. Dieng No. 10',
        phone: '+62341555666',
        pic_name: 'PIC Control',
        is_active: true,
      },
    });
    branchId = branch.id;

    // 5. Create session
    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Control Test Session',
        description: 'Session description',
        scheduled_at: new Date(Date.now() + 86400000), // tomorrow
        status: SessionStatus.PUBLISHED,
      },
    });
    sessionId = session.id;

    // 6. Create provider user to list asset
    const provider = await prisma.users.create({
      data: {
        email: 'provider_control@example.com',
        phone: '+628999999666',
        password_hash: 'hashed',
        full_name: 'Provider Control',
        role: Role.PROVIDER,
        status: UserStatus.ACTIVE,
      },
    });

    // 7. Create asset
    const asset = await prisma.assets.create({
      data: {
        provider_id: provider.id,
        category: 'mobil',
        title: 'Toyota Corolla Altis 2018',
        base_price: new Prisma.Decimal(180_000_000),
        status: AssetStatus.APPROVED,
      },
    });
    assetId = asset.id;

    // 8. Create lot pointing to session and asset
    const lot = await prisma.lots.create({
      data: {
        session_id: sessionId,
        asset_id: assetId,
        lot_number: 1,
        starting_price: new Prisma.Decimal(180_000_000),
        status: LotStatus.PENDING,
      },
    });
    lotId = lot.id;

    // 9. Generate token
    token = generateAccessToken({
      id: adminId,
      email: testAdminEmail,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    });
  });

  afterAll(async () => {
    // Restore mocks
    startMock.mockRestore();
    closeMock.mockRestore();

    // Database Cleanup
    await prisma.lots.deleteMany({});
    await prisma.assets.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: testAdminEmail },
          { email: 'provider_control@example.com' },
          { phone: testPhone },
        ],
      },
    });

    await prisma.$disconnect();
    if (redis.isOpen) {
      await redis.quit();
    }
  });

  describe('POST /api/v1/admin/lots/:id/activate', () => {
    it('should fail if user is not authorized (no token)', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/lots/${lotId}/activate`)
        .send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully activate pending lot and mark session as live', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/lots/${lotId}/activate`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(LotStatus.ACTIVE);

      // Verify session updated to live
      const session = await prisma.auction_sessions.findUnique({
        where: { id: sessionId },
      });
      expect(session?.status).toBe(SessionStatus.LIVE);
    });
  });

  describe('POST /api/v1/admin/lots/:id/close', () => {
    it('should successfully close active lot', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/lots/${lotId}/close`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(LotStatus.UNSOLD);
    });
  });

  describe('POST /api/v1/admin/sessions/:id/end', () => {
    it('should successfully close the session and cancel remaining lots', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session.status).toBe(SessionStatus.CLOSED);
    });
  });
});
