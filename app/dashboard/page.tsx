'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DateFilter } from '@/components/analytics/DateFilter';
import { OrdersSection } from '@/components/analytics/OrdersSection';
import { RevenueSection } from '@/components/analytics/RevenueSection';
import { TechniciansSection } from '@/components/analytics/TechniciansSection';
import { CustomersSection } from '@/components/analytics/CustomersSection';
import { AnalyticsParams } from '@/lib/analytics';
import { UserRole } from '@/types/user';

export default function DashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [params, setParams] = useState<AnalyticsParams>({
    range: 'MONTH',
    startDate: '',
    endDate: '',
    compare: false,
  });

  useEffect(() => {
    // Obtener el rol del usuario desde el JWT token
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Decodificar el JWT (formato: header.payload.signature)
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        // El rol viene en el payload del JWT
        if (payload.role) {
          setUserRole(payload.role as UserRole);
        }
      } catch (error) {
        console.error('Error decoding JWT token:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const handleFilterChange = (newParams: AnalyticsParams) => {
    setParams(newParams);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  // Vista para TÉCNICOS - Cards de navegación
  if (userRole === UserRole.TECNICO) {
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
          {/* Card Órdenes de Servicio */}
          <div
            onClick={() => router.push('/dashboard/ordenes-servicio')}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Órdenes de Servicio
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Gestiona tus órdenes de servicio
            </p>
          </div>

          {/* Card Clientes */}
          <div
            onClick={() => router.push('/dashboard/clientes')}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Clientes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Consulta información de clientes
            </p>
          </div>

          {/* Card Productos */}
          <div
            onClick={() => router.push('/dashboard/productos')}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Productos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Consulta el catálogo de productos
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vista para ADMIN y AUXILIAR - Dashboard de Analytics
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Dashboard de Analytics *
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Métricas y estadísticas del negocio
          </p>
        </div>

        <DateFilter onFilterChange={handleFilterChange} showGroupBy />
      </div>

      {/* Sección de Órdenes */}
      <OrdersSection params={params} />

      {/* Sección de Ingresos */}
      <RevenueSection params={params} />

      {/* Sección de Técnicos */}
      <TechniciansSection params={params} />

      {/* Sección de Clientes */}
      <CustomersSection params={params} />
    </div>
  );
}
