import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface CustomerDetail extends Customer {
  orderSummary: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    totalValue: number;
  };
}

export interface ListCustomersInput {
  page?: number;
  pageSize?: number;
  name?: string;
  email?: string;
  city?: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface UseCustomersReturn {
  customers: Customer[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;

  listCustomers: (filters?: ListCustomersInput) => Promise<void>;
  getCustomer: (id: string) => Promise<CustomerDetail | null>;
  createCustomer: (input: CreateCustomerInput) => Promise<Customer>;
  updateCustomer: (id: string, input: UpdateCustomerInput) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; customerName: string }>;
  restoreCustomer: (id: string) => Promise<Customer>;
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listCustomers = useCallback(async (filters?: ListCustomersInput) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters?.page) {
        params.append('page', filters.page.toString());
      }
      if (filters?.pageSize) {
        params.append('pageSize', filters.pageSize.toString());
      }
      if (filters?.name) {
        params.append('name', filters.name);
      }
      if (filters?.email) {
        params.append('email', filters.email);
      }
      if (filters?.city) {
        params.append('city', filters.city);
      }

      const response = await apiClient.get<any>(
        `/api/customers?${params.toString()}`
      );
      const data = response.data;

      const customersWithDates = (data.data || []).map((customer: any) => ({
        ...customer,
        createdAt: new Date(customer.createdAt),
        deletedAt: customer.deletedAt ? new Date(customer.deletedAt) : null,
      }));

      setCustomers(customersWithDates);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomer = useCallback(
    async (id: string): Promise<CustomerDetail | null> => {
      try {
        setError(null);
        const response = await apiClient.get<any>(`/api/customers/${id}`);
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          deletedAt: response.data.deletedAt
            ? new Date(response.data.deletedAt)
            : null,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao buscar cliente';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const createCustomer = useCallback(
    async (input: CreateCustomerInput): Promise<Customer> => {
      try {
        setError(null);
        const response = await apiClient.post<any>('/api/customers', input);
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          deletedAt: response.data.deletedAt
            ? new Date(response.data.deletedAt)
            : null,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao criar cliente';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const updateCustomer = useCallback(
    async (id: string, input: UpdateCustomerInput): Promise<Customer> => {
      try {
        setError(null);
        const response = await apiClient.patch<any>(
          `/api/customers/${id}`,
          input
        );
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          deletedAt: response.data.deletedAt
            ? new Date(response.data.deletedAt)
            : null,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao atualizar cliente';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      try {
        setError(null);
        const response = await apiClient.delete<any>(`/api/customers/${id}`);
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao deletar cliente';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const restoreCustomer = useCallback(
    async (id: string): Promise<Customer> => {
      try {
        setError(null);
        const response = await apiClient.post<any>(
          `/api/customers/${id}/restore`
        );
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          deletedAt: null,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao restaurar cliente';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    listCustomers();
  }, [listCustomers]);

  return {
    customers,
    pagination,
    loading,
    error,
    listCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    restoreCustomer,
  };
}
