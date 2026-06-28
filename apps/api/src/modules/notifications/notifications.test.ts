import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { Role } from '../../../../../packages/shared-types/src/enums';
import bcrypt from 'bcrypt';

describe('Notifications Module Integration Tests', () => {
  let bidderToken: string;
  let bidderId: string;
  let notificationId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const bidder = await prisma.users.upsert({
      where: { email: 'test-bidder-notif@indo-lelang.com' },
      update: {},
      create: {
        email: 'test-bidder-notif@indo-lelang.com',
        phone: '+628110008001',
        password_hash: hashedPassword,
        full_name: 'Test Bidder Notif',
        role: Role.BIDDER,
        status: 'active',
      },
    });
    bidderId = bidder.id;

    // Create test notifications
    const notif = await prisma.notifications.create({
      data: {
        user_id: bidderId,
        type: 'bid_outbid',
        title: 'Anda telah di-outbid!',
        body: 'Bidder lain telah melampaui tawaran Anda pada lot #5',
        is_read: false,
      },
    });
    notificationId = notif.id;

    await prisma.notifications.create({
      data: {
        user_id: bidderId,
        type: 'deposit_confirmed',
        title: 'Deposit dikonfirmasi',
        body: 'Deposit NIPL Anda telah dikonfirmasi',
        is_read: true,
      },
    });

    const bidderLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-bidder-notif@indo-lelang.com', password: 'Admin123!' });
    bidderToken = bidderLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.notifications.deleteMany({ where: { user_id: bidderId } });
    await prisma.users.deleteMany({
      where: { email: 'test-bidder-notif@indo-lelang.com' },
    });
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  describe('GET /api/v1/notifications', () => {
    it('should list user notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by is_read status', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?is_read=false')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('unread_count');
      expect(res.body.data.unread_count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const res = await request(app)
        .put(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB
      const notif = await prisma.notifications.findUnique({ where: { id: notificationId } });
      expect(notif?.is_read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .put('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Create a fresh unread notification
      await prisma.notifications.create({
        data: {
          user_id: bidderId,
          type: 'system',
          title: 'Test Unread',
          body: 'This should be marked as read',
          is_read: false,
        },
      });

      const res = await request(app)
        .put('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${bidderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify all are read
      const unreadCount = await prisma.notifications.count({
        where: { user_id: bidderId, is_read: false },
      });
      expect(unreadCount).toBe(0);
    });
  });
});
