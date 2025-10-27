'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth-utils';
import { Shield, AlertCircle } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export function RoleProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = () => {
      const role = getCurrentUserRole();
      setCurrentRole(role);

      if (!role) {
        // No hay rol, redirigir al login
        router.push('/login');
        return;
      }

      if (!allowedRoles.includes(role)) {
        // El usuario no tiene permiso
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    };

    checkRole();
  }, [router, allowedRoles]);

  // Mientras se verifica
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verificando permisos...
          </p>
        </div>
      </div>
    );
  }

  // Si no tiene permiso
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Acceso Denegado
            </h2>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">
                No tienes permiso para acceder a esta página
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tu rol actual ({currentRole}) no tiene los permisos necesarios
              para ver este contenido.
            </p>
            <button
              onClick={() => router.push(fallbackPath)}
              className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene permiso, mostrar el contenido
  return <>{children}</>;
}
