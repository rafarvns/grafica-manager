import React, { lazy, Suspense } from 'react';
import { RouterProvider, Route } from '@/router/HashRouter';
import { AppLayout } from '@/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AppProvider } from '@/contexts/AppContext';
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
const PrintPage = lazy(() =>
  import('@/pages/PrintPage').then((m) => ({ default: m.PrintPage }))
);
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const OrderDetailPage = lazy(() =>
  import('@/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ShopeeIntegrationPage = lazy(() =>
  import('@/pages/ShopeeIntegrationPage')
);
const CadastrosPage = lazy(() =>
  import('@/pages/CadastrosPage').then((m) => ({ default: m.CadastrosPage }))
);
const CustomerDetailPage = lazy(() =>
  import('@/pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage }))
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
        <AppProvider>
          <RouterProvider>
            <AppLayout>
              <Suspense fallback={<LoadingFallback />}>
                <Route path="/" component={<DashboardPage />} />
                <Route path="/pedidos" component={<OrdersPage />} />
                <Route path="/pedidos/:id" component={<OrderDetailPage />} />
                <Route path="/clientes" component={<CustomersPage />} />
                <Route path="/clientes/:id" component={<CustomerDetailPage />} />
                <Route path="/impressoes" component={<PrintPage />} />
                <Route path="/relatorios" component={<ReportsPage />} />
                <Route path="/configuracoes" component={<SettingsPage />} />
                <Route path="/shopee" component={<ShopeeIntegrationPage />} />
                <Route path="/cadastros" component={<CadastrosPage />} />
              </Suspense>
            </AppLayout>
            <ToastContainer />
          </RouterProvider>
        </AppProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
