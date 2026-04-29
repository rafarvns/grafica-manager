import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import { ApiError } from '@/types/api';

describe('apiClient', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    apiClient.setToken(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    apiClient.setToken(null);
  });

  it('faz requisição GET com sucesso e converte JSON', async () => {
    const mockData = { id: 1, name: 'Teste' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await apiClient.get<{ id: number; name: string }>('/users');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3333/api/v1/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result.data).toEqual(mockData);
  });

  it('anexa o token de autorização se estiver configurado', async () => {
    apiClient.setToken('meu-token-secreto');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiClient.get('/protected');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3333/api/v1/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer meu-token-secreto',
      },
    });
  });

  it('faz requisição POST com body serializado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const payload = { name: 'Novo' };
    await apiClient.post('/create', payload);

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3333/api/v1/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  });

  it('lança ApiError em respostas HTTP de erro', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found', code: 'ERR_NOT_FOUND' }),
    });

    await expect(apiClient.get('/missing')).rejects.toThrowError(ApiError);

    try {
      await apiClient.get('/missing');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(404);
        expect(error.code).toBe('ERR_NOT_FOUND');
        expect(error.message).toBe('Not Found');
      }
    }
  });

  it('utiliza mensagem fallback caso a resposta de erro não contenha JSON estruturado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Parsing error'); },
    });

    await expect(apiClient.get('/crash')).rejects.toThrowError('Ocorreu um erro na requisição (Status: 500)');
  });
});
