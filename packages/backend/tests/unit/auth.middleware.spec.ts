import { describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/infrastructure/http/middlewares/auth.middleware';

describe('authMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      },
      statusCode: 200,
      jsonData: null,
    };
    next = function () {};
  });

  it('deve permitir requisição com token válido', () => {
    process.env['API_TOKEN'] = 'a'.repeat(32);
    req.headers = {
      authorization: `Bearer ${'a'.repeat(32)}`,
    };

    const middleware = authMiddleware(() => process.env['API_TOKEN']!);
    middleware(req as Request, res as Response, next);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toBeNull();
  });

  it('deve retornar 401 se token está ausente', () => {
    process.env['API_TOKEN'] = 'a'.repeat(32);
    req.headers = {};

    const middleware = authMiddleware(() => process.env['API_TOKEN']!);
    middleware(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData).toEqual({ error: 'Token não informado' });
  });

  it('deve retornar 401 se Authorization header está vazio', () => {
    process.env['API_TOKEN'] = 'a'.repeat(32);
    req.headers = {
      authorization: '',
    };

    const middleware = authMiddleware(() => process.env['API_TOKEN']!);
    middleware(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData).toEqual({ error: 'Token não informado' });
  });

  it('deve retornar 401 se token é inválido', () => {
    process.env['API_TOKEN'] = 'a'.repeat(32);
    req.headers = {
      authorization: `Bearer ${'b'.repeat(32)}`,
    };

    const middleware = authMiddleware(() => process.env['API_TOKEN']!);
    middleware(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData).toEqual({ error: 'Token inválido' });
  });

  it('deve retornar 401 se o formato do Authorization é inválido', () => {
    process.env['API_TOKEN'] = 'a'.repeat(32);
    req.headers = {
      authorization: `InvalidFormat ${'a'.repeat(32)}`,
    };

    const middleware = authMiddleware(() => process.env['API_TOKEN']!);
    middleware(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData).toEqual({ error: 'Token inválido' });
  });

  it('deve chamar next() se autenticação é bem-sucedida', () => {
    process.env['API_TOKEN'] = 'a'.repeat(32);
    req.headers = {
      authorization: `Bearer ${'a'.repeat(32)}`,
    };

    let nextCalled = false;
    const nextMock = () => {
      nextCalled = true;
    };

    const middleware = authMiddleware(() => process.env['API_TOKEN']!);
    middleware(req as Request, res as Response, nextMock);

    expect(nextCalled).toBe(true);
  });

  it('deve usar timing-safe comparison para evitar timing attacks', () => {
    process.env['API_TOKEN'] = 'a'.repeat(32);

    // Token com caractere diferente no final
    const wrongToken = 'a'.repeat(31) + 'b';
    req.headers = {
      authorization: `Bearer ${wrongToken}`,
    };

    const middleware = authMiddleware(() => process.env['API_TOKEN']!);
    middleware(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
  });
});
