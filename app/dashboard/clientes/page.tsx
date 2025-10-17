'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Customer } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Users,
  Eye,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  Mail,
  Phone,
} from 'lucide-react';

export default function ClientesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // TanStack Query
  const { data, isLoading, error } = useCustomers({
    page: currentPage,
    limit: itemsPerPage,
  });
  const deleteCustomerMutation = useDeleteCustomer();

  const customers = data?.customers || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    customerId: string | null;
    customerName: string;
  }>({
    isOpen: false,
    customerId: null,
    customerName: '',
  });

  // Filtrar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (!Array.isArray(customers)) {
      console.warn('⚠️ customers no es un array:', customers);
      setFilteredCustomers([]);
      return;
    }

    let filtered = customers;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          (customer.firstName &&
            customer.firstName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (customer.lastName &&
            customer.lastName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (customer.businessName &&
            customer.businessName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          customer.documentNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (customer.email &&
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.phoneNumber &&
            customer.phoneNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const handleDeleteClick = (customer: Customer) => {
    setConfirmDialog({
      isOpen: true,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (confirmDialog.customerId) {
      try {
        await deleteCustomerMutation.mutateAsync(confirmDialog.customerId);
      } finally {
        setConfirmDialog({
          isOpen: false,
          customerId: null,
          customerName: '',
        });
      }
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDialog({
      isOpen: false,
      customerId: null,
      customerName: '',
    });
  };

  const openCreateModal = () => {
    router.push('/dashboard/clientes/nuevo');
  };

  const handleViewDetails = (customerId: string) => {
    router.push(`/dashboard/clientes/${customerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona tu base de datos de clientes
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo Cliente</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {error.message || 'Error al cargar los clientes'}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando clientes...
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            No hay clientes para mostrar
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'No se encontraron clientes con los filtros aplicados'
              : 'Comienza agregando tu primer cliente'}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Cliente
            </button>
          )}
        </div>
      ) : (
        /* Customers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(filteredCustomers) &&
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Header con tipo de documento */}
                <div className="px-4 pt-4 pb-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary-500 text-white">
                      {customer.customerType === 'NATURAL'
                        ? 'PERSONA NATURAL'
                        : 'PERSONA JURÍDICA'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {customer.documentType}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {customer.documentNumber}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Nombre completo o Razón Social */}
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                    {customer.customerType === 'JURIDICA' &&
                    customer.businessName
                      ? customer.businessName
                      : `${customer.firstName || ''} ${
                          customer.lastName || ''
                        }`.trim() || 'Sin nombre'}
                  </h3>

                  {/* Contacto de la empresa (si aplica) */}
                  {customer.customerType === 'JURIDICA' &&
                    (customer.firstName || customer.lastName) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="font-medium">Contacto:</span>{' '}
                        {customer.firstName} {customer.lastName}
                      </p>
                    )}

                  {/* Información de contacto */}
                  <div className="space-y-2 mb-4">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span>{customer.phoneNumber}</span>
                      </div>
                    )}
                    {!customer.email && !customer.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                        <AlertCircle className="w-4 h-4" />
                        <span>Sin información de contacto</span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleViewDetails(customer.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Ver Detalles"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">Ver Detalles</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(customer)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar a "${confirmDialog.customerName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
}
