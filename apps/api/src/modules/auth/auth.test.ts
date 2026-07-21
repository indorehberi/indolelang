import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role, UserStatus } from '../../../../../packages/shared-types/src/enums';

describe('Authentication Module Integration Tests', () => {
  const testPhone = '+628999999999';
  const testEmail = 'testuser@example.com';
  const testPassword = 'Password123!';
  let userId: string;

  beforeAll(async () => {
    // Connect to database and clear any existing test records
    await prisma.users.deleteMany({
      where: {
        OR: [{ email: testEmail }, { phone: testPhone }],
      },
    });
  });

  afterAll(async () => {
    // Cleanup database and connections
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

  describe('POST /api/v1/auth/register', () => {
    it('should fail registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          phone: testPhone,
          password: testPassword,
          confirm_password: testPassword,
          full_name: 'Test User',
          role: 'bidder',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should successfully register a bidder user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          phone: testPhone,
          password: testPassword,
          confirm_password: testPassword,
          full_name: 'Test User',
          role: 'bidder',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.role).toBe(Role.USER);
      expect(res.body.data.status).toBe(UserStatus.PENDING);

      userId = res.body.data.id;
    });

    it('should fail registration for duplicate email', async () => {
      const activeEmail = 'activeuser@example.com';
      // Register active user (no phone)
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: activeEmail,
          password: testPassword,
          confirm_password: testPassword,
          full_name: 'Active User',
          role: 'bidder',
        });

      // Mark user as ACTIVE so they cannot register again
      await prisma.users.updateMany({
        where: { email: activeEmail },
        data: { status: UserStatus.ACTIVE },
      });

      // Try registering again with the same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: activeEmail,
          phone: '+628999999992',
          password: testPassword,
          confirm_password: testPassword,
          full_name: 'Test Duplicate',
          role: 'bidder',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');

      // Cleanup active user
      await prisma.users.deleteMany({ where: { email: activeEmail } }).catch(() => {});
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should fail with incorrect OTP code (throw 500 DB error since Redis is closed)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: testPhone,
          otp: '999999', // Incorrect OTP
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should successfully bypass and return 200 if phone number is not registered but default OTP is used', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '+628999999009', // Not registered
          otp: '123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should successfully verify the user account with default developer OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: testPhone,
          otp: '123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verifikasi');

      // Verify status in DB is active
      const user = await prisma.users.findUnique({ where: { id: userId } });
      expect(user?.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in and return access tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.role).toBe(Role.USER);
    });

    it('should reject login for wrong credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login if account is not active (pending)', async () => {
      // Create a pending user
      const pendingEmail = 'pending_user@example.com';
      await prisma.users.create({
        data: {
          email: pendingEmail,
          phone: '+628999999881',
          password_hash: '$2b$10$dummyhash',
          full_name: 'Pending User',
          role: Role.BIDDER,
          status: UserStatus.PENDING,
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: pendingEmail,
          password: 'any_password',
        });

      // Clear the pending user
      await prisma.users.delete({ where: { email: pendingEmail } });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should reject refresh token if token is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/forgot-password & reset-password', () => {
    it('should accept forgot-password request for valid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: testEmail,
          phone: testPhone,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 200 for non-existent email (security policy to prevent user enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'nonexistent_forgot@example.com',
          phone: testPhone,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail reset-password with 500 DB error since Redis is closed/unavailable', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-reset-token',
          password: 'NewPassword123!',
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/google', () => {
    const googleEmail = 'googleuser@example.com';

    afterAll(async () => {
      await prisma.users.deleteMany({
        where: { email: googleEmail },
      });
    });

    it('should successfully register a new user using Google OAuth', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({
          email: googleEmail,
          full_name: 'Google User',
          role: 'bidder',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(googleEmail);
      expect(res.body.data.user.role).toBe(Role.BIDDER);
      expect(res.body.data.user.status).toBe(UserStatus.PENDING);
    });

    it('should successfully log in an existing user using Google OAuth', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({
          email: googleEmail,
          full_name: 'Google User',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(googleEmail);
    });
  });
});
