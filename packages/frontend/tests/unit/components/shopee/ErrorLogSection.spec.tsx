import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorLogSection } from '@/components/domain/shopee/ErrorLogSection';

describe('ErrorLogSection', () => {
  it('deve renderizar a lista de erros', () => {
    const mockErrors = [{ id: '1', timestamp: '2026-04-27T10:00:00Z', type: 'Timeout', message: 'API connection failed' }];
    render(<ErrorLogSection errors={mockErrors} loading={false} />);
    
    expect(screen.getByText('API connection failed')).toBeInTheDocument();
    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });
});
