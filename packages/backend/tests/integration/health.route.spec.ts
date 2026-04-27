import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

describe('GET /health', () => {
  let app: Express;
  let server: any;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });

    server = app.listen(0);
  });

  afterAll(() => {
    server.close();
  });

  it('deve retornar 200 com status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      uptime: expect.any(Number),
    });
  });

  it('deve retornar uptime como número positivo', async () => {
    const response = await request(app).get('/health');

    expect(response.body.uptime).toBeGreaterThan(0);
  });
});
