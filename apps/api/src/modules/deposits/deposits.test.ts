import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { generateAccessToken } from '../../lib/jwt';
import { Role, UserStatus, DepositStatus } from '../../../../../packages/shared-types/src/enums';
import { midtransClient } from '../../lib/midtrans';

describe('Deposits & Payments Module Integration Tests', () => {
  const testEmail = 'deposit_test_bidder@example.com';
  const testPhone = '+628999999888';
  let userId: string;
  let branchId: string;
  let sessionId: string;
  let token: string;

  beforeAll(async () => {
    // 1. Clean up potential leftovers
    await prisma.deposits.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({
      where: {
        OR: [{ email: testEmail }, { phone: testPhone }],
      },
    });

    // 2. Create test bidder user
    const user = await prisma.users.create({
      data: {
        email: testEmail,
        phone: testPhone,
        password_hash: 'hashedPassword',
        full_name: 'Deposit Test Bidder',
        role: Role.BIDDER,
        status: UserStatus.ACTIVE,
      },
    });
    userId = user.id;

    // 3. Create test branch
    const branch = await prisma.branches.create({
      data: {
        tenant_id: 'default',
        name: 'Test Branch',
        city: 'Bandung',
        address: 'Jl. Test No. 123',
        phone: '+6222123456',
        pic_name: 'Test PIC',
        is_active: true,
      },
    });
    branchId = branch.id;

    // 4. Create test session
    const session = await prisma.auction_sessions.create({
      data: {
        branch_id: branchId,
        title: 'Test Auction Session',
        description: 'Test session for deposits verification',
        scheduled_at: new Date(Date.now() + 86400000), // tomorrow
        status: 'published',
      },
    });
    sessionId = session.id;

    // 5. Generate access token
    token = generateAccessToken({
      id: userId,
      email: testEmail,
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
    });
  });

  afterAll(async () => {
    // Cleanup database and connections
    await prisma.deposits.deleteMany({});
    await prisma.nipl_allocations.deleteMany({});
    await prisma.auction_sessions.deleteMany({});
    await prisma.branches.deleteMany({});
    await prisma.users.deleteMany({
      where: {
        OR: [{ email: testEmail }, { phone: testPhone }],
      },
    });
    await prisma.$disconnect();
    if (redis.isOpen) {
      await redis.quit();
    }
  });

  describe('POST /api/v1/deposits/create', () => {
    it('should fail if access token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/deposits/create')
        .send({
          session_id: sessionId,
          amount: 5000000,
          bank: 'bca',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully register NIPL and generate virtual account', async () => {
      // Mock Midtrans API call
      const chargeMock = jest
        .spyOn(midtransClient, 'chargeVirtualAccount')
        .mockResolvedValue({
          order_id: 'NIPL-mocked-order-id',
          va_number: '7008888899990000',
          va_bank: 'bca',
          payment_method: 'virtual_account',
          raw_response: {},
        });

      const res = await request(app)
        .post('/api/v1/deposits/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          session_id: sessionId,
          amount: 5000000,
          bank: 'bca',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.session_id).toBe(sessionId);
      expect(res.body.data.amount).toBe(5000000);
      expect(res.body.data.va_number).toBe('7008888899990000');
      expect(res.body.data.va_bank).toBe('bca');
      expect(res.body.data.status).toBe(DepositStatus.PENDING);

      chargeMock.mockRestore();
    });

    it('should successfully register additional NIPL for same session (multiple deposits allowed)', async () => {
      // Create a paid/active deposit in DB directly
      await prisma.deposits.create({
        data: {
          user_id: userId,
          session_id: sessionId,
          amount: 5000000,
          va_number: '7008888899991111',
          va_bank: 'bca',
          status: DepositStatus.PAID,
        },
      });

      // Mock Midtrans API call
      const chargeMock = jest
        .spyOn(midtransClient, 'chargeVirtualAccount')
        .mockResolvedValue({
          order_id: 'NIPL-mocked-order-id-2',
          va_number: '7008888899992222',
          va_bank: 'bca',
          payment_method: 'virtual_account',
          raw_response: {},
        });

      const res = await request(app)
        .post('/api/v1/deposits/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          session_id: sessionId,
          amount: 5000000,
          bank: 'bca',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(5000000);

      chargeMock.mockRestore();
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    let pendingDepositId: string;

    beforeEach(async () => {
      // Setup a pending deposit in the database
      await prisma.deposits.deleteMany({});
      const dep = await prisma.deposits.create({
        data: {
          user_id: userId,
          session_id: sessionId,
          amount: 5000000,
          va_number: '7008888899992222',
          va_bank: 'bca',
          status: DepositStatus.PENDING,
        },
      });
      pendingDepositId = dep.id;
    });

    it('should fail webhook if signature is invalid', async () => {
      const verifyMock = jest
        .spyOn(midtransClient, 'verifyWebhookSignature')
        .mockReturnValue(false);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          order_id: `NIPL-${pendingDepositId}`,
          status_code: '200',
          gross_amount: '5000000.00',
          signature_key: 'invalid-key',
          transaction_status: 'settlement',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');

      verifyMock.mockRestore();
    });

    it('should successfully settle payment via webhook settlement status', async () => {
      const verifyMock = jest
        .spyOn(midtransClient, 'verifyWebhookSignature')
        .mockReturnValue(true);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          order_id: `NIPL-${pendingDepositId}`,
          status_code: '200',
          gross_amount: '5000000.00',
          signature_key: 'valid-mock-key',
          transaction_status: 'settlement',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify DB record status is updated to paid
      const updatedDep = await prisma.deposits.findUnique({
        where: { id: pendingDepositId },
      });
      expect(updatedDep?.status).toBe(DepositStatus.PAID);
      expect(updatedDep?.paid_at).not.toBeNull();

      // Verify notification is created
      const notification = await prisma.notifications.findFirst({
        where: { user_id: userId, type: 'deposit_success' },
      });
      expect(notification).not.toBeNull();
      expect(notification?.body).toContain('NIPL Anda');

      verifyMock.mockRestore();
    });

    it('should handle expire transaction status and mark deposit as expired', async () => {
      const verifyMock = jest
        .spyOn(midtransClient, 'verifyWebhookSignature')
        .mockReturnValue(true);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          order_id: `NIPL-${pendingDepositId}`,
          status_code: '200',
          gross_amount: '5000000.00',
          signature_key: 'valid-mock-key',
          transaction_status: 'expire',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedDep = await prisma.deposits.findUnique({
        where: { id: pendingDepositId },
      });
      expect(updatedDep?.status).toBe(DepositStatus.EXPIRED);

      verifyMock.mockRestore();
    });
  });

  describe('GET /api/v1/deposits', () => {
    it('should fail if access token is missing', async () => {
      const res = await request(app).get('/api/v1/deposits');
      expect(res.status).toBe(401);
    });

    it('should list deposits for authenticated bidder', async () => {
      const res = await request(app)
        .get('/api/v1/deposits')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should list all deposits for admin user', async () => {
      const adminToken = generateAccessToken({
        id: 'admin-id-dep-test',
        email: 'admin_dep_test@example.com',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      });

      const res = await request(app)
        .get('/api/v1/deposits')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Validation failures on deposit creation', () => {
    it('should return 400 validation error for missing parameters', async () => {
      const res = await request(app)
        .post('/api/v1/deposits/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // missing session_id, amount, bank
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
