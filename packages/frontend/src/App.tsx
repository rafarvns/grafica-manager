import React, { lazy, Suspense } from 'react';
import { RouterProvider, Route } from '@/router/HashRouter';
import { AppLayout } from '@/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastContainer } from '@/components/ui/Toast/ToastContainer';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const OrdersPage = lazy(() =>
  import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const CustomersPage = lazy(() =>
  import('@/pages/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const PrintHistoryPage = lazy(() =>
  import('@/pages/PrintHistoryPage').then((m) => ({ default: m.PrintHistoryPage }))
);
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <Spinner size="lg" label="Carregando página..." />
    </div>
  );
}

export function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <RouterProvider>
          <AppLayout>
            <Suspense fallback={<LoadingFallback />}>
              <Route path="/" component={<DashboardPage />} />
              <Route path="/pedidos" component={<OrdersPage />} />
              <Route path="/clientes" component={<CustomersPage />} />
              <Route path="/impressoes" component={<PrintHistoryPage />} />
              <Route path="/relatorios" component={<ReportsPage />} />
            </Suspense>
          </AppLayout>
          <ToastContainer />
        </RouterProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
