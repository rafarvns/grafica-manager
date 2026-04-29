import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface RouterContextValue {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // Ex: #/pdv -> /pdv
    const hash = window.location.hash;
    return hash ? hash.replace(/^#/, '') : '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentPath(hash ? hash.replace(/^#/, '') : '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = `#${path}`;
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter deve ser usado dentro de um RouterProvider');
  }
  return ctx;
}

interface RouteProps {
  path: string;
  component: ReactNode;
}

export function Route({ path, component }: RouteProps) {
  const { currentPath } = useRouter();
  
  // Converter path do tipo "/pedidos/:id" para regex "^/pedidos/[^/]+$"
  const regexPath = path.replace(/:[^\s/]+/g, '[^/]+');
  const matcher = new RegExp(`^${regexPath}$`);

  if (matcher.test(currentPath)) {
    return <>{component}</>;
  }
  
  return null;
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
}

export function Link({ to, children, ...props }: LinkProps) {
  const { navigate } = useRouter();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to);
  };
  
  return (
    <a href={`#${to}`} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
