// Tipos de domínio compartilhados entre frontend e backend

export type ID = string;

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
