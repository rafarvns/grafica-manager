import React, { useEffect, useState } from 'react';
import { ipcBridge } from './services/ipcBridge';
import { PrinterInfo } from './types/electron';
import { Button } from './components/ui/Button/Button';
import { Card } from './components/ui/Card/Card';

export function App(): React.ReactElement {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrinters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await ipcBridge.getPrinters();
      setPrinters(list);
    } catch (err) {
      console.error('Error fetching printers:', err);
      setError('Falha ao buscar impressoras do sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleTestPrint = async (printerName: string) => {
    try {
      // Nota: Em um cenário real, você passaria um caminho de arquivo válido.
      // Aqui estamos apenas testando se o canal IPC responde.
      const success = await ipcBridge.printPdf('dummy-path.pdf', { printer: printerName });
      if (success) {
        alert(`Comando de impressão enviado para: ${printerName}`);
      } else {
        alert(`Erro ao tentar imprimir em: ${printerName}`);
      }
    } catch (err) {
      alert(`Erro fatal na comunicação: ${err}`);
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>Centro de Testes</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Plataforma: {ipcBridge.platform}</p>
        </div>
        <Button onClick={fetchPrinters} isLoading={isLoading} variant="secondary">
          Atualizar Lista
        </Button>
      </header>

      {error && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {printers.length === 0 && !isLoading && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            Nenhuma impressora encontrada.
          </p>
        )}

        {printers.map((printer) => (
          <Card 
            key={printer.name} 
            title={printer.name}
            footer={
              <Button 
                onClick={() => handleTestPrint(printer.name)} 
                variant={printer.isDefault ? 'success' : 'primary'}
                style={{ width: '100%' }}
              >
                Teste de Impressão
              </Button>
            }
          >
            <div style={{ fontSize: 'var(--font-size-sm)' }}>
              <p><strong>Nome:</strong> {printer.displayName}</p>
              <p><strong>Status:</strong> {printer.status === 0 ? '✅ Online' : '⚠️ ' + printer.status}</p>
              <p><strong>Padrão:</strong> {printer.isDefault ? 'Sim' : 'Não'}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
