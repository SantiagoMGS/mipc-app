'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar pantalla de carga mientras verifica autenticación
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Verificando autenticación...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (el hook ya redirige)
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
}
