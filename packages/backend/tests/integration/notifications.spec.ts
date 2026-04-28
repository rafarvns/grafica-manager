import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createNotificationsRouter } from '@/infrastructure/http/routes/notifications.routes';

const prismaMock = {
  notification: {
    findMany: vi.fn().mockResolvedValue([
      { id: '1', title: 'N1', description: 'D1', type: 'generic', category: 'info', read: false, dismissedAt: null }
    ]),
    findUnique: vi.fn().mockResolvedValue(
      { id: '1', title: 'N1', description: 'D1', type: 'generic', category: 'info', read: false, dismissedAt: null, markAsRead: vi.fn(), dismiss: vi.fn() }
    ),
    upsert: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  }
} as any;

describe('Notification Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/notifications', createNotificationsRouter(prismaMock));
  });

  describe('GET /api/v1/notifications', () => {
    it('should return list of notifications', async () => {
      const response = await request(app).get('/api/v1/notifications');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id', '1');
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark as read', async () => {
      const response = await request(app).patch('/api/v1/notifications/1/read');
      expect(response.status).toBe(204);
      expect(prismaMock.notification.upsert).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/v1/notifications/:id/dismiss', () => {
    it('should dismiss notification', async () => {
      const response = await request(app).patch('/api/v1/notifications/1/dismiss');
      expect(response.status).toBe(204);
      expect(prismaMock.notification.upsert).toHaveBeenCalled();
    });
  });
});
