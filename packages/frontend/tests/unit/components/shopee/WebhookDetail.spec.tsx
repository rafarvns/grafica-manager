import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WebhookDetail } from '@/components/domain/shopee/WebhookDetail';
import { WebhookEvent } from '@/types/shopee';

describe('WebhookDetail', () => {
  const mockWebhook: WebhookEvent = {
    id: 'wh-123',
    timestamp: '2026-04-27T14:30:00Z',
    status: 'error',
    eventType: 'ORDER_CREATED',
    shopeeOrderId: 'SHP-001',
    payload: { orders: [{ id: '123' }] },
    errorDetails: {
      type: 'Validation Error',
      message: 'Order ID not found',
      attempts: 1,
      lastAttempt: '2026-04-27T14:31:00Z',
      stacktrace: 'Full stacktrace here...'
    }
  };

  it('deve renderizar os detalhes do webhook', () => {
    render(<WebhookDetail webhook={mockWebhook} isOpen={true} onClose={() => {}} onReprocess={() => {}} />);
    
    expect(screen.getByText('Detalhes do Webhook')).toBeInTheDocument();
    expect(screen.getByText('SHP-001')).toBeInTheDocument();
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(screen.getByText('Order ID not found')).toBeInTheDocument();
  });

  it('deve mostrar o payload JSON', () => {
    render(<WebhookDetail webhook={mockWebhook} isOpen={true} onClose={() => {}} onReprocess={() => {}} />);
    
    // Verifica se o JSON formatado está presente (parcialmente)
    expect(screen.getByText(/"orders"/)).toBeInTheDocument();
  });

  it('deve chamar onReprocess ao clicar no botão', () => {
    const onReprocess = vi.fn();
    render(<WebhookDetail webhook={mockWebhook} isOpen={true} onClose={() => {}} onReprocess={onReprocess} />);
    
    const button = screen.getByText('Reprocessar Agora');
    fireEvent.click(button);
    
    expect(onReprocess).toHaveBeenCalledWith('wh-123');
  });
});
