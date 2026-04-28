export interface BreadcrumbItem {
  label: string;
  path: string;
}

const LABEL_MAP: Record<string, string> = {
  clientes: 'Clientes',
  pedidos: 'Pedidos',
  impressoes: 'Impressões',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  integracoes: 'Integrações',
  shopee: 'Shopee',
};

export function useBreadcrumb(currentPath: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

  if (currentPath === '/' || !currentPath) {
    return breadcrumbs;
  }

  const cleaned = currentPath.replace(/\/$/, '');
  const segments = cleaned.split('/').filter(Boolean);

  let accumulatedPath = '';
  for (const segment of segments) {
    accumulatedPath += `/${segment}`;
    const label = LABEL_MAP[segment] ?? segment;
    breadcrumbs.push({ label, path: accumulatedPath });
  }

  return breadcrumbs;
}
