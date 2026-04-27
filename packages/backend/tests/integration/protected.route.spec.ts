import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { authMiddleware } from '../../src/infrastructure/http/middlewares/auth.middleware';

describe('GET /api/v1/protected (rota protegida)', () => {
  let app: Express;
  let server: any;
  const testToken = 'a'.repeat(32);

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.use('/api/v1', authMiddleware(() => testToken));

    app.get('/api/v1/protected', (_req, res) => {
      res.status(200).json({ message: 'Acesso autorizado' });
    });

    server = app.listen(0);
  });

  afterAll(() => {
    server.close();
  });

  it('deve retornar 200 com token válido', async () => {
    const response = await request(app)
      .get('/api/v1/protected')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Acesso autorizado' });
  });

  it('deve retornar 401 sem token', async () => {
    const response = await request(app).get('/api/v1/protected');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token não informado' });
  });

  it('deve retornar 401 com token inválido', async () => {
    const response = await request(app)
      .get('/api/v1/protected')
      .set('Authorization', `Bearer ${'b'.repeat(32)}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token inválido' });
  });

  it('deve retornar 401 com Authorization header mal formatado', async () => {
    const response = await request(app)
      .get('/api/v1/protected')
      .set('Authorization', `InvalidFormat ${testToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token inválido' });
  });
});
