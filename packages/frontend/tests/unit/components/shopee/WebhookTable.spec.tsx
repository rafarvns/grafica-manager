import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WebhookTable } from '@/components/domain/shopee/WebhookTable';
import { WebhookEvent } from '@/types/shopee';

describe('WebhookTable', () => {
  const mockWebhooks: WebhookEvent[] = [
    {
      id: 'wh-1',
      timestamp: '2026-04-27T14:30:00Z',
      status: 'processed',
      eventType: 'ORDER_CREATED',
      shopeeOrderId: 'SHP-001',
      payload: {},
    },
    {
      id: 'wh-2',
      timestamp: '2026-04-27T15:00:00Z',
      status: 'error',
      eventType: 'ORDER_UPDATED',
      shopeeOrderId: 'SHP-002',
      payload: {},
    }
  ];

  it('deve renderizar a lista de webhooks', () => {
    render(
      <WebhookTable 
        webhooks={mockWebhooks} 
        loading={false} 
        onSelectWebhook={() => {}} 
        onReprocess={() => {}}
      />
    );

    expect(screen.getByText('SHP-001')).toBeInTheDocument();
    expect(screen.getByText('SHP-002')).toBeInTheDocument();
    expect(screen.getByText('ORDER_CREATED')).toBeInTheDocument();
    expect(screen.getByText('ORDER_UPDATED')).toBeInTheDocument();
  });

  it('deve chamar onReprocess quando o botão reprocessar é clicado em uma linha com erro', () => {
    const onReprocess = vi.fn();
    render(
      <WebhookTable 
        webhooks={mockWebhooks} 
        loading={false} 
        onSelectWebhook={() => {}} 
        onReprocess={onReprocess}
      />
    );

    const reprocessButton = screen.getByRole('button', { name: /reprocessar/i });
    fireEvent.click(reprocessButton);

    expect(onReprocess).toHaveBeenCalledWith('wh-2');
  });

  it('deve chamar onSelectWebhook ao clicar em uma linha', () => {
    const onSelectWebhook = vi.fn();
    render(
      <WebhookTable 
        webhooks={mockWebhooks} 
        loading={false} 
        onSelectWebhook={onSelectWebhook} 
        onReprocess={() => {}}
      />
    );

    const row = screen.getByText('SHP-001').closest('tr');
    if (row) fireEvent.click(row);

    expect(onSelectWebhook).toHaveBeenCalledWith(mockWebhooks[0]);
  });
});
