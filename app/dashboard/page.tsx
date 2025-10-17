'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Obtener datos del usuario
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Bienvenido al Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Sistema de gestión de órdenes de servicio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Productos */}
        <div
          onClick={() => router.push('/dashboard/productos')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-primary-500"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Productos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Gestiona el catálogo de productos
          </p>
        </div>

        {/* Card Clientes */}
        <div
          onClick={() => router.push('/dashboard/clientes')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-primary-500"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Clientes
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Administra la información de clientes
          </p>
        </div>

        {/* Card Órdenes de Servicio */}
        <div
          onClick={() => router.push('/dashboard/ordenes-servicio')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-primary-500"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Órdenes de Servicio
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Gestiona las órdenes de servicio
          </p>
        </div>
      </div>
    </div>
  );
}
