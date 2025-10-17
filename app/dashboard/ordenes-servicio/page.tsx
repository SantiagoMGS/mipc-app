'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import {
  ServiceOrder,
  ServiceOrderStatus,
  PaymentStatus,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/types/service-order';
import {
  StatusBadge,
  PriorityBadge,
  PaymentStatusBadge,
} from '@/components/ServiceOrderBadges';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  Eye,
  Plus,
  Search,
  AlertCircle,
  Filter,
} from 'lucide-react';

export default function OrdenesServicioPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros
  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | ''>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    PaymentStatus | ''
  >('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // TanStack Query
  const { data, isLoading, error } = useServiceOrders({
    status: statusFilter || undefined,
    paymentStatus: paymentStatusFilter || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const orders = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);

  // Filtrar órdenes por término de búsqueda local
  useEffect(() => {
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.problemDescription
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm]);

  const handleViewDetails = (orderId: string) => {
    router.push(`/dashboard/ordenes-servicio/${orderId}`);
  };

  const handleCreateNew = () => {
    router.push('/dashboard/ordenes-servicio/nueva');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Órdenes de Servicio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona las órdenes de reparación y servicio técnico
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Orden</span>
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por número de orden o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro de Estado */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ServiceOrderStatus | '');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Filtro de Estado de Pago */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value as PaymentStatus | '');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos los pagos</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {error.message || 'Error al cargar las órdenes de servicio'}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando órdenes...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            No hay órdenes para mostrar
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || statusFilter || paymentStatusFilter
              ? 'No se encontraron órdenes con los filtros aplicados'
              : 'Comienza creando tu primera orden de servicio'}
          </p>
          {!searchTerm && !statusFilter && !paymentStatusFilter && (
            <Button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Orden
            </Button>
          )}
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número de Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={order.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {order.problemDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order.id)}
                        className="inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {!isLoading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(perPage) => {
            setItemsPerPage(perPage);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
