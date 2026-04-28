import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createOrdersRouter } from '@/infrastructure/http/routes/orders.routes';

// Mock do Prisma
const prismaMock = {
  order: {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    findUnique: vi.fn().mockResolvedValue({ id: '1', status: 'draft', position: 0 }),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue({ id: '1', position: 10 }),
  },
  orderAttachment: {
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'file-1', ...data })),
    delete: vi.fn().mockResolvedValue({ id: 'file-1' }),
    update: vi.fn().mockResolvedValue({ id: 'file-1', deletedAt: new Date() }),
    upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'file-1', ...create })),
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue({ id: 'file-1', originalFilename: 'test.txt', mimeType: 'text/plain', filepath: 'path/1' }),
  },
  printJob: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'job-1', ...data })),
  }
} as any;

describe('Order Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // No teste, registramos direto no /api/v1/orders para simplificar e bater com o que o frontend chama
    app.use('/api/v1/orders', createOrdersRouter(prismaMock));
  });

  describe('GET /api/v1/orders', () => {
    it('deve retornar lista de pedidos com status 200', async () => {
      const response = await request(app).get('/api/v1/orders');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('POST /api/v1/orders', () => {
    it('deve retornar 400 se faltar campos obrigatórios', async () => {
      const response = await request(app).post('/api/v1/orders').send({});
      expect(response.status).toBe(400);
    });
  });
  describe('PATCH /api/v1/orders/:id', () => {
    it('deve atualizar a posição do pedido com status 200', async () => {
      const response = await request(app).patch('/api/v1/orders/1').send({ position: 10 });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('position', 10);
    });
  });

  describe('POST /api/v1/orders/:id/attachments', () => {
    it('deve adicionar um anexo ao pedido com status 201', async () => {
      const response = await request(app)
        .post('/api/v1/orders/1/attachments')
        .attach('file', Buffer.from('%PDF-1.4'), 'test.pdf');
      
      if (response.status !== 201) {
        console.log('Upload failed body:', response.body);
      }
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('originalFilename', 'test.pdf');
    });
  });

  describe('DELETE /api/v1/orders/:id/attachments/:fileId', () => {
    it('deve remover um anexo do pedido com status 204', async () => {
      const response = await request(app).delete('/api/v1/orders/1/attachments/file-1');
      expect(response.status).toBe(204);
    });
  });

  describe('GET /api/v1/orders/:id/print-jobs', () => {
    it('deve retornar lista de impressões do pedido com status 200', async () => {
      const response = await request(app).get('/api/v1/orders/1/print-jobs');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/v1/orders/:id/print-jobs', () => {
    it('deve criar uma nova impressão vinculada ao pedido com status 201', async () => {
      const response = await request(app)
        .post('/api/v1/orders/1/print-jobs')
        .send({
          printerId: 'printer-1',
          quality: 'NORMAL',
          colorProfile: 'CMYK',
          paperTypeId: 'paper-1',
          pagesBlackAndWhite: 0,
          pagesColor: 1
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderId', '1');
    });
  });
});
