import { ApiError, type ApiResponse } from '@/types/api';

class ApiClient {
  private token: string | null = null;
  private readonly baseUrl = 'http://localhost:3333';

  constructor() {
    // Tenta carregar o token do env ou localStorage
    const envToken = import.meta.env.VITE_API_TOKEN;
    const storageToken = localStorage.getItem('api_token');
    this.token = envToken || storageToken || null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('api_token', token);
    } else {
      localStorage.removeItem('api_token');
    }
  }

  private async fetch<T>(path: string, options: RequestInit & { params?: Record<string, any> } = {}): Promise<ApiResponse<T>> {
    const headers = { ...options.headers } as Record<string, string>;
    
    // Se o corpo for FormData, o navegador define o Content-Type automaticamente com o boundary correto
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const { params, ...fetchOptions } = options;

    // Normalização robusta do path
    let cleanPath = path;
    if (!path.startsWith('http')) {
      // Remove prefixos conhecidos para reconstruir do zero
      let p = path;
      if (p.startsWith('/api/v1')) p = p.substring(7);
      else if (p.startsWith('/api')) p = p.substring(4);
      else if (p.startsWith('/v1')) p = p.substring(3);
      
      // Garante que o path comece com /
      const normalizedPath = p.startsWith('/') ? p : `/${p}`;
      cleanPath = `/api/v1${normalizedPath}`;
    }

    let url = path.startsWith('http') ? path : `${this.baseUrl}${cleanPath}`;

    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          throw new Error(`Ocorreu um erro na requisição (Status: ${response.status})`);
        }
        
        throw new ApiError(
          response.status,
          errData?.code || 'UNKNOWN_ERROR',
          errData?.message || errData?.error || 'Erro desconhecido na API'
        );
      }

      const data = await response.json() as T;
      return { data, status: response.status };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error(error instanceof Error ? error.message : 'Falha na comunicação de rede');
    }
  }

  public get<T>(path: string, options?: RequestInit & { params?: Record<string, any> }) {
    return this.fetch<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body: unknown, options?: RequestInit & { params?: Record<string, any> }) {
    return this.fetch<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  public put<T>(path: string, body: unknown, options?: RequestInit & { params?: Record<string, any> }) {
    return this.fetch<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  public patch<T>(path: string, body: unknown, options?: RequestInit & { params?: Record<string, any> }) {
    return this.fetch<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  }

  public delete<T>(path: string, options?: RequestInit & { params?: Record<string, any> }) {
    return this.fetch<T>(path, { ...options, method: 'DELETE' });
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getToken(): string | null {
    return this.token;
  }
}

export const apiClient = new ApiClient();
