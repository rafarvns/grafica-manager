export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Wrapper genérico de resposta bem-sucedida
export type ApiResponse<T> = {
  data: T;
  status: number;
};
