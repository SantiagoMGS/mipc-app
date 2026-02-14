'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { deviceTypesService, customersService } from '@/lib/api';
import {
  CreateCustomerDto,
  DocumentType,
  CustomerType,
} from '@/types/customer';
import { Device, CreateDeviceForCustomerDto } from '@/types/device';
import { DeviceType } from '@/types/device-type';
import DeviceFormModal from '@/components/DeviceFormModal';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import {
  useCustomerDevices,
  useCreateDeviceForCustomer,
  useDeleteDevice,
  useActivateDevice,
} from '@/hooks/useDevices';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  User,
  Building2,
  Laptop,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  Mail,
  Phone,
  FileText,
  CreditCard,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
  { value: 'NATURAL', label: 'Persona Natural' },
  { value: 'JURIDICA', label: 'Persona Jurídica' },
];

export default function ClienteDetallesPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { toast } = useToast();

  // TanStack Query hooks
  const {
    data: customer,
    isLoading: isLoadingCustomer,
    error: customerError,
  } = useCustomer(customerId);
  const { data: devices = [], isLoading: isLoadingDevices } =
    useCustomerDevices(customerId);
  const updateCustomerMutation = useUpdateCustomer();
  const createDeviceMutation = useCreateDeviceForCustomer();
  const deleteDeviceMutation = useDeleteDevice();
  const activateDeviceMutation = useActivateDevice();

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Datos editables del cliente
  const [editableData, setEditableData] = useState<CreateCustomerDto>({
    customerType: 'NATURAL',
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phoneNumber: '',
    documentType: 'CC',
    documentNumber: '',
  });

  // Modal de dispositivo
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    deviceId: string | null;
    deviceName: string;
  }>({
    isOpen: false,
    deviceId: null,
    deviceName: '',
  });

  // Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Sincronizar editableData cuando customer cambia
  useEffect(() => {
    if (customer) {
      setEditableData({
        customerType: customer.customerType,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        businessName: customer.businessName || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
      });
    }
  }, [customer]);

  // Cargar tipos de dispositivo (solo una vez)
  useEffect(() => {
    const loadDeviceTypes = async () => {
      try {
        const response = await deviceTypesService.getAll({ limit: 1000 });
        const typesArray = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        const activeTypes = typesArray.filter(
          (type: DeviceType) => type.isActive !== false
        );
        setDeviceTypes(activeTypes);
      } catch (err) {
        console.error('Error al cargar tipos de dispositivo:', err);
      }
    };
    loadDeviceTypes();
  }, []);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Restaurar datos originales
    if (customer) {
      setEditableData({
        customerType: customer.customerType,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        businessName: customer.businessName || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditableData({
      ...editableData,
      [name]: value,
    });
  };

  const handleSaveChanges = async () => {
    if (!customer) return;

    // Preparar datos para enviar
    const dataToSubmit: CreateCustomerDto = {
      customerType: editableData.customerType,
      documentType: editableData.documentType,
      documentNumber: editableData.documentNumber,
      phoneNumber: editableData.phoneNumber,
    };

    if (editableData.customerType === 'NATURAL') {
      dataToSubmit.firstName = editableData.firstName;
      dataToSubmit.lastName = editableData.lastName;
    } else {
      dataToSubmit.businessName = editableData.businessName;
      if (editableData.firstName && editableData.firstName.trim() !== '') {
        dataToSubmit.firstName = editableData.firstName;
      }
      if (editableData.lastName && editableData.lastName.trim() !== '') {
        dataToSubmit.lastName = editableData.lastName;
      }
    }

    if (editableData.email && editableData.email.trim() !== '') {
      dataToSubmit.email = editableData.email;
    }

    try {
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        data: dataToSubmit,
      });
      setIsEditMode(false);
    } catch (err: any) {
      console.error('Error al actualizar cliente:', err);
    }
  };

  const handleAddDevice = async (data: CreateDeviceForCustomerDto) => {
    await createDeviceMutation.mutateAsync(data);
  };

  const handleDeleteDeviceClick = (device: Device) => {
    setConfirmDialog({
      isOpen: true,
      deviceId: device.id,
      deviceName: device.serial || device.model || 'Dispositivo',
    });
  };

  const handleDeleteDeviceConfirm = async () => {
    if (confirmDialog.deviceId) {
      try {
        await deleteDeviceMutation.mutateAsync(confirmDialog.deviceId);
      } finally {
        setConfirmDialog({
          isOpen: false,
          deviceId: null,
          deviceName: '',
        });
      }
    }
  };

  const handleDeleteDeviceCancel = () => {
    setConfirmDialog({
      isOpen: false,
      deviceId: null,
      deviceName: '',
    });
  };

  const handleActivateDevice = async (device: Device) => {
    await activateDeviceMutation.mutateAsync(device.id);
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsSettingPassword(true);
    try {
      await customersService.setPassword(customerId, newPassword);
      toast({
        title: 'Contraseña asignada',
        description: 'El cliente ya puede iniciar sesión en el portal',
      });
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err.response?.data?.message || 'Error al asignar contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const getDeviceTypeName = (deviceTypeId?: string) => {
    if (!deviceTypeId) return 'Sin tipo';
    const deviceType = deviceTypes.find((type) => type.id === deviceTypeId);
    return deviceType?.name || 'Desconocido';
  };

  const isLoading = isLoadingCustomer || isLoadingDevices;
  const error = customerError ? 'Error al cargar los datos del cliente' : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando datos del cliente...
          </p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => router.push('/dashboard/clientes')}
              className="mt-3 text-sm text-red-600 dark:text-red-400 underline"
            >
              Volver a clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isNatural = editableData.customerType === 'NATURAL';

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/clientes')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {isNatural
                ? `${customer.firstName} ${customer.lastName}`
                : customer.businessName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {customer.documentType}: {customer.documentNumber}
            </p>
          </div>
        </div>

        {!isEditMode ? (
          <div className="flex gap-3">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Asignar contraseña para el portal de clientes"
            >
              <KeyRound className="w-5 h-5" />
              <span className="hidden sm:inline">Portal</span>
            </button>
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Editar Cliente
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={updateCustomerMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {updateCustomerMutation.isPending
                ? 'Guardando...'
                : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Datos del Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          {isNatural ? (
            <User className="w-6 h-6 text-primary-500" />
          ) : (
            <Building2 className="w-6 h-6 text-primary-500" />
          )}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Información del Cliente
          </h2>
        </div>

        <div className="space-y-4">
          {/* Tipo de Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Cliente
            </label>
            {isEditMode ? (
              <select
                name="customerType"
                value={editableData.customerType}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {CUSTOMER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-800 dark:text-white">
                {
                  CUSTOMER_TYPES.find((t) => t.value === customer.customerType)
                    ?.label
                }
              </p>
            )}
          </div>

          {/* Campos según tipo */}
          {isNatural ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editableData.firstName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">
                    {customer.firstName || '-'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apellido
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="lastName"
                    value={editableData.lastName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">
                    {customer.lastName || '-'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Razón Social
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="businessName"
                    value={editableData.businessName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">
                    {customer.businessName || '-'}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de Contacto
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="firstName"
                      value={editableData.firstName}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">
                      {customer.firstName || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apellido de Contacto
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="lastName"
                      value={editableData.lastName}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">
                      {customer.lastName || '-'}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Documento
              </label>
              {isEditMode ? (
                <select
                  name="documentType"
                  value={editableData.documentType}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-800 dark:text-white">
                  {
                    DOCUMENT_TYPES.find(
                      (t) => t.value === customer.documentType
                    )?.label
                  }
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Documento
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  name="documentNumber"
                  value={editableData.documentNumber}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-800 dark:text-white">
                  {customer.documentNumber}
                </p>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Correo Electrónico
              </label>
              {isEditMode ? (
                <input
                  type="email"
                  name="email"
                  value={editableData.email}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-800 dark:text-white">
                  {customer.email || '-'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono <span className="text-red-500">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editableData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-800 dark:text-white">
                  {customer.phoneNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dispositivos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Laptop className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Dispositivos
            </h2>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              {devices.length}
            </span>
          </div>
          <button
            onClick={() => setIsDeviceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Agregar Dispositivo</span>
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Laptop className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              No hay dispositivos registrados
            </p>
            <p className="text-sm">
              Agrega el primer dispositivo de este cliente
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Serial
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Marca/Modelo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Especificaciones
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {device.serial || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {getDeviceTypeName(device.deviceTypeId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {device.brand && device.model
                        ? `${device.brand} ${device.model}`
                        : device.brand || device.model || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="space-y-1">
                        {device.processor && (
                          <div className="text-xs">{device.processor}</div>
                        )}
                        {(device.ram || device.storage) && (
                          <div className="text-xs">
                            {device.ram && `${device.ram}GB RAM`}
                            {device.ram && device.storage && ' • '}
                            {device.storage &&
                              `${device.storage}GB ${device.storageType || ''}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          device.isActive !== false
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {device.isActive !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            /* TODO: Implementar edición */
                            toast({
                              title: 'Función no disponible',
                              description:
                                'La edición de dispositivos aún no está disponible',
                            });
                          }}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar dispositivo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Botón dinámico según estado del dispositivo */}
                        {device.isActive !== false ? (
                          <button
                            onClick={() => handleDeleteDeviceClick(device)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Inactivar dispositivo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateDevice(device)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Activar dispositivo"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de dispositivo */}
      <DeviceFormModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onSubmit={handleAddDevice}
        customerId={customerId}
        deviceTypes={deviceTypes}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Inactivar dispositivo"
        message={`¿Estás seguro de que deseas inactivar el dispositivo "${confirmDialog.deviceName}"? El dispositivo quedará marcado como inactivo pero podrás verlo en la lista.`}
        confirmText="Inactivar"
        cancelText="Cancelar"
        onConfirm={handleDeleteDeviceConfirm}
        onCancel={handleDeleteDeviceCancel}
        type="danger"
      />

      {/* Modal de contraseña para portal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Asignar Contraseña del Portal
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta contraseña permitirá al cliente iniciar sesión en el portal
              de clientes usando su número de documento{' '}
              <strong>{customer.documentNumber}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setNewPassword('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSetPassword}
                disabled={isSettingPassword || newPassword.length < 6}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSettingPassword ? 'Guardando...' : 'Asignar Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
