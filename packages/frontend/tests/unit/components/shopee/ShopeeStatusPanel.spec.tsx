import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShopeeStatusPanel } from '@/components/domain/shopee/ShopeeStatusPanel';
import { ShopeeStatus } from '@/types/shopee';

describe('ShopeeStatusPanel', () => {
  const mockStatus: ShopeeStatus = {
    isActive: true,
    tokenConfigured: true,
    successRate: 98,
    queuedWebhooks: 3,
    lastWebhookTime: '2026-04-27T14:30:00Z',
  };

  it('deve renderizar informações de status corretamente', () => {
    render(<ShopeeStatusPanel status={mockStatus} onConfigureToken={() => {}} onSyncNow={() => {}} />);

    expect(screen.getByText('Status: Ativo')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Sucesso: 98%')).toBeInTheDocument();
    expect(screen.getByText('Webhooks em Fila: 3')).toBeInTheDocument();
  });

  it('deve chamar onConfigureToken ao clicar no botão', () => {
    const onConfigureToken = vi.fn();
    render(<ShopeeStatusPanel status={mockStatus} onConfigureToken={onConfigureToken} onSyncNow={() => {}} />);

    fireEvent.click(screen.getByText('Configurar Token'));
    expect(onConfigureToken).toHaveBeenCalled();
  });

  it('deve chamar onSyncNow ao clicar no botão', () => {
    const onSyncNow = vi.fn();
    render(<ShopeeStatusPanel status={mockStatus} onConfigureToken={() => {}} onSyncNow={onSyncNow} />);

    fireEvent.click(screen.getByText('Sincronizar Agora'));
    expect(onSyncNow).toHaveBeenCalled();
  });

  it('deve mostrar status Inativo se isActive for false', () => {
    render(<ShopeeStatusPanel status={{ ...mockStatus, isActive: false }} onConfigureToken={() => {}} onSyncNow={() => {}} />);
    expect(screen.getByText('Status: Inativo')).toBeInTheDocument();
  });
});
