'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateServiceOrder } from '@/hooks/useServiceOrders';
import { useCustomerSearch, useTechnicians } from '@/hooks/useAuxiliary';
import { useCustomerDevices } from '@/hooks/useDevices';
import { getCurrentUserId } from '@/lib/auth-utils';
import { Customer } from '@/types/customer';
import { Device } from '@/types/device';
import { ServiceOrderPriority, PRIORITY_LABELS } from '@/types/service-order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Save,
  Search,
  User,
  Laptop,
  UserCog,
  AlertTriangle,
} from 'lucide-react';

export default function NuevaOrdenServicioPage() {
  const router = useRouter();
  const createOrderMutation = useCreateServiceOrder();

  // Estados del formulario
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [priority, setPriority] = useState<ServiceOrderPriority>('NORMAL');
  const [problemDescription, setProblemDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');

  // Control de UI
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: searchResults = [], isLoading: isSearching } =
    useCustomerSearch(customerSearchQuery, 10);
  const { data: customerDevices = [], isLoading: isLoadingDevices } =
    useCustomerDevices(selectedCustomer?.id || '');
  const { data: technicians = [], isLoading: isLoadingTechnicians } =
    useTechnicians();

  // Auto-asignar el técnico logueado al cargar la página
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId && !selectedTechnicianId) {
      setSelectedTechnicianId(currentUserId);
    }
  }, [selectedTechnicianId]);

  // Efecto para ocultar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(
      customer.customerType === 'JURIDICA' && customer.businessName
        ? customer.businessName
        : `${customer.firstName} ${customer.lastName}`
    );
    setShowCustomerDropdown(false);
    setSelectedDeviceId(''); // Reset device selection
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.customer;
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedCustomer) {
      errors.customer = 'Debe seleccionar un cliente';
    }
    if (!selectedDeviceId) {
      errors.device = 'Debe seleccionar un dispositivo';
    }
    if (!selectedTechnicianId) {
      errors.technician = 'Debe seleccionar un técnico';
    }
    if (!problemDescription.trim()) {
      errors.problemDescription = 'La descripción del problema es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const orderData = {
        customerId: selectedCustomer!.id,
        deviceId: selectedDeviceId,
        technicianId: selectedTechnicianId,
        priority,
        problemDescription: problemDescription.trim(),
        observations: observations.trim() || undefined,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      };

      await createOrderMutation.mutateAsync(orderData);
      router.push('/dashboard/ordenes-servicio');
    } catch (error) {
      console.error('Error al crear orden:', error);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/ordenes-servicio');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Volver"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Nueva Orden de Servicio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete la información para crear una nueva orden
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Cliente
            </h2>
          </div>

          <div className="customer-search-container relative">
            <Label htmlFor="customer-search">Buscar Cliente *</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="customer-search"
                type="text"
                placeholder="Buscar por nombre, documento, email..."
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setShowCustomerDropdown(true);
                  if (!e.target.value) {
                    setSelectedCustomer(null);
                  }
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className={`pl-10 ${
                  formErrors.customer ? 'border-red-500' : ''
                }`}
              />
            </div>

            {/* Dropdown de resultados */}
            {showCustomerDropdown && customerSearchQuery.length >= 2 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Buscando...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron clientes
                  </div>
                ) : (
                  searchResults.map((customer: Customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {customer.customerType === 'JURIDICA' &&
                        customer.businessName
                          ? customer.businessName
                          : `${customer.firstName} ${customer.lastName}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.documentType}: {customer.documentNumber}
                      </div>
                      {customer.phoneNumber && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Tel: {customer.phoneNumber}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {formErrors.customer && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {formErrors.customer}
              </p>
            )}

            {selectedCustomer && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Cliente seleccionado:{' '}
                  {selectedCustomer.customerType === 'JURIDICA' &&
                  selectedCustomer.businessName
                    ? selectedCustomer.businessName
                    : `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dispositivo (solo si hay cliente seleccionado) */}
        {selectedCustomer && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Laptop className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Dispositivo
              </h2>
            </div>

            <div>
              <Label htmlFor="device">Seleccionar Dispositivo *</Label>
              <select
                id="device"
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.device;
                    return newErrors;
                  });
                }}
                className={`mt-2 block w-full px-3 py-2 border ${
                  formErrors.device
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                disabled={isLoadingDevices}
              >
                <option value="">
                  {isLoadingDevices
                    ? 'Cargando dispositivos...'
                    : 'Seleccione un dispositivo'}
                </option>
                {Array.isArray(customerDevices) &&
                  customerDevices.map((device: Device) => (
                    <option key={device.id} value={device.id}>
                      {device.deviceType?.name || 'Sin tipo'} -{' '}
                      {device.brand || 'Sin marca'} {device.model || ''}
                      {device.serial ? ` (S/N: ${device.serial})` : ''}
                    </option>
                  ))}
              </select>
              {formErrors.device && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                  {formErrors.device}
                </p>
              )}
              {Array.isArray(customerDevices) &&
                customerDevices.length === 0 &&
                !isLoadingDevices && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Este cliente no tiene dispositivos registrados
                  </p>
                )}
            </div>
          </div>
        )}

        {/* Técnico y Prioridad */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCog className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Asignación
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Técnico */}
            <div>
              <Label htmlFor="technician">Técnico Asignado *</Label>
              <select
                id="technician"
                value={selectedTechnicianId}
                onChange={(e) => {
                  setSelectedTechnicianId(e.target.value);
                  setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.technician;
                    return newErrors;
                  });
                }}
                className={`mt-2 block w-full px-3 py-2 border ${
                  formErrors.technician
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                disabled={isLoadingTechnicians}
              >
                <option value="">
                  {isLoadingTechnicians
                    ? 'Cargando técnicos...'
                    : 'Seleccione un técnico'}
                </option>
                {Array.isArray(technicians) &&
                  technicians.map((tech: any) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
              </select>
              {formErrors.technician && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                  {formErrors.technician}
                </p>
              )}
            </div>

            {/* Prioridad */}
            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as ServiceOrderPriority)
                }
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Descripción del Problema */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Detalles del Servicio
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="problemDescription">
                Descripción del Problema *
              </Label>
              <textarea
                id="problemDescription"
                value={problemDescription}
                onChange={(e) => {
                  setProblemDescription(e.target.value);
                  setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.problemDescription;
                    return newErrors;
                  });
                }}
                rows={4}
                className={`mt-2 block w-full px-3 py-2 border ${
                  formErrors.problemDescription
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Describa el problema reportado por el cliente..."
              />
              {formErrors.problemDescription && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                  {formErrors.problemDescription}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="observations">Observaciones</Label>
              <textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Observaciones adicionales (opcional)..."
              />
            </div>

            <div>
              <Label htmlFor="estimatedDeliveryDate">
                Fecha Estimada de Entrega
              </Label>
              <Input
                id="estimatedDeliveryDate"
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createOrderMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {createOrderMutation.isPending ? 'Creando...' : 'Crear Orden'}
          </Button>
        </div>
      </form>
    </div>
  );
}
