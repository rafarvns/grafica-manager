import { ApiError, type ApiResponse } from '@/types/api';

class ApiClient {
  private token: string | null = null;
  // Fallback URL (a Spec-0003 menciona que a URL base deve vir do env no main, 
  // mas como o frontend se comunica com a API local, vamos definir por padrão localhost:3000)
  private readonly baseUrl = 'http://localhost:3000/api';

  public setToken(token: string | null) {
    this.token = token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = { ...options.headers } as Record<string, string>;
    headers['Content-Type'] = 'application/json';
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    try {
      const finalUrl = path.startsWith('/') && !path.startsWith(this.baseUrl) ? path : url;

      const response = await fetch(finalUrl, {
        ...options,
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

  public get<T>(path: string, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body: unknown, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  public put<T>(path: string, body: unknown, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  public delete<T>(path: string, options?: RequestInit) {
    return this.fetch<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
