import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncProgressModal } from '@/components/domain/shopee/SyncProgressModal';

describe('SyncProgressModal', () => {
  it('deve renderizar o progresso corretamente', () => {
    render(
      <SyncProgressModal 
        isOpen={true} 
        progress={45} 
        processed={22} 
        total={50} 
        status="processing"
        onClose={() => {}} 
      />
    );
    
    expect(screen.getByText('Sincronizando Pedidos...')).toBeInTheDocument();
    expect(screen.getByText('Processando 22 de 50 pedidos...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45');
  });

  it('deve mostrar mensagem de conclusão quando finalizado', () => {
    render(
      <SyncProgressModal 
        isOpen={true} 
        progress={100} 
        processed={50} 
        total={50} 
        status="completed"
        onClose={() => {}} 
      />
    );
    
    expect(screen.getByText('Sincronização Concluída!')).toBeInTheDocument();
    expect(screen.getByText('✓ 50 pedidos processados com sucesso.')).toBeInTheDocument();
  });
});
