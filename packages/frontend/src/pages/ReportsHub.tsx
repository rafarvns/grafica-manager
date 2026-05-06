import React from 'react';
import { useRouter } from '@/router/HashRouter';
import { ReportsPage } from '@/pages/ReportsPage';
import { PrintJobReportPage } from '@/pages/PrintJobReportPage';

export function ReportsHub() {
  const { currentPath } = useRouter();
  const isPedidos = currentPath === '/relatorios' || currentPath === '/relatorios/pedidos';

  return (
    <>
      <div style={{ display: isPedidos ? 'block' : 'none' }}>
        <ReportsPage />
      </div>
      <div style={{ display: isPedidos ? 'none' : 'block' }}>
        <PrintJobReportPage />
      </div>
    </>
  );
}
