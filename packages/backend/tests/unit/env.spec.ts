import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('env', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Resetar process.env antes de cada teste
    Object.keys(process.env).forEach((key) => {
      if (!originalEnv[key]) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  afterEach(() => {
    // Resetar process.env após cada teste
    Object.keys(process.env).forEach((key) => {
      if (!originalEnv[key]) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
    vi.resetModules();
  });

  it('deve carregar variáveis de ambiente obrigatórias', async () => {
    process.env['DATABASE_URL'] = 'mysql://user:pass@localhost:3306/test';
    process.env['API_TOKEN'] = 'a'.repeat(32);
    process.env['PORT'] = '3333';

    const { getEnv } = await import('../../src/infrastructure/config/env');
    const env = getEnv();

    expect(env.DATABASE_URL).toBe('mysql://user:pass@localhost:3306/test');
    expect(env.API_TOKEN).toBe('a'.repeat(32));
    expect(env.PORT).toBe(3333);
  });

  it('deve falhar se DATABASE_URL está ausente', async () => {
    delete process.env['DATABASE_URL'];
    process.env['API_TOKEN'] = 'a'.repeat(32);
    process.env['PORT'] = '3333';

    const { getEnv } = await import('../../src/infrastructure/config/env');
    expect(() => getEnv()).toThrow('DATABASE_URL é obrigatória');
  });

  it('deve falhar se API_TOKEN está ausente', async () => {
    process.env['DATABASE_URL'] = 'mysql://user:pass@localhost:3306/test';
    delete process.env['API_TOKEN'];
    process.env['PORT'] = '3333';

    const { getEnv } = await import('../../src/infrastructure/config/env');
    expect(() => getEnv()).toThrow('API_TOKEN é obrigatória');
  });

  it('deve falhar se API_TOKEN tem menos de 32 caracteres', async () => {
    process.env['DATABASE_URL'] = 'mysql://user:pass@localhost:3306/test';
    process.env['API_TOKEN'] = 'short';
    process.env['PORT'] = '3333';

    const { getEnv } = await import('../../src/infrastructure/config/env');
    expect(() => getEnv()).toThrow('API_TOKEN deve ter pelo menos 32 caracteres');
  });

  it('deve falhar se PORT está ausente', async () => {
    process.env['DATABASE_URL'] = 'mysql://user:pass@localhost:3306/test';
    process.env['API_TOKEN'] = 'a'.repeat(32);
    delete process.env['PORT'];

    const { getEnv } = await import('../../src/infrastructure/config/env');
    expect(() => getEnv()).toThrow('PORT é obrigatória');
  });

  it('deve fazer cache das variáveis de ambiente', async () => {
    process.env['DATABASE_URL'] = 'mysql://user:pass@localhost:3306/test';
    process.env['API_TOKEN'] = 'a'.repeat(32);
    process.env['PORT'] = '3333';

    const { getEnv } = await import('../../src/infrastructure/config/env');
    const env1 = getEnv();
    const env2 = getEnv();

    expect(env1).toBe(env2); // mesma referência
  });

  it('deve converter PORT para número', async () => {
    process.env['DATABASE_URL'] = 'mysql://user:pass@localhost:3306/test';
    process.env['API_TOKEN'] = 'a'.repeat(32);
    process.env['PORT'] = '5000';

    const { getEnv } = await import('../../src/infrastructure/config/env');
    const env = getEnv();

    expect(typeof env.PORT).toBe('number');
    expect(env.PORT).toBe(5000);
  });
});
