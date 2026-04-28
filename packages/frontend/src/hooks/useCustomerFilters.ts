import { useState } from 'react';

export interface CustomerFilters {
  name: string;
  email: string;
  city: string;
}

export function useCustomerFilters() {
  const [filters, setFilters] = useState<CustomerFilters>({
    name: '',
    email: '',
    city: '',
  });

  const clearFilters = () => {
    setFilters({ name: '', email: '', city: '' });
  };

  const isFiltered = filters.name !== '' || filters.email !== '' || filters.city !== '';

  return { filters, setFilters, clearFilters, isFiltered };
}
