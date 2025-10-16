'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customersService, deviceTypesService } from '@/lib/api';
import {
  CreateCustomerDto,
  DocumentType,
  CustomerType,
} from '@/types/customer';
import { CreateDeviceDto, StorageType } from '@/types/device';
import { DeviceType } from '@/types/device-type';
import Toast from '@/components/Toast';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  User,
  Building2,
  Laptop,
  AlertCircle,
} from 'lucide-react';

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

const STORAGE_TYPES: { value: StorageType; label: string }[] = [
  { value: 'SSD', label: 'SSD' },
  { value: 'HDD', label: 'HDD' },
];

export default function NuevoClientePage() {
  const router = useRouter();
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [isLoadingDeviceTypes, setIsLoadingDeviceTypes] = useState(true);

  // Estado del formulario de cliente
  const [customerData, setCustomerData] = useState<CreateCustomerDto>({
    customerType: 'NATURAL',
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phoneNumber: '',
    documentType: 'CC',
    documentNumber: '',
    devices: [],
  });

  // Estado de dispositivos
  const [devices, setDevices] = useState<CreateDeviceDto[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  // Cargar tipos de dispositivo
  useEffect(() => {
    loadDeviceTypes();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      setIsLoadingDeviceTypes(true);
      const response = await deviceTypesService.getAll({ limit: 1000 });
      const typesArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      // Filtrar solo los activos
      const activeTypes = typesArray.filter(
        (type: DeviceType) => type.isActive !== false
      );
      setDeviceTypes(activeTypes);
    } catch (err) {
      console.error('Error al cargar tipos de dispositivo:', err);
      setToast({
        message: 'Error al cargar tipos de dispositivo',
        type: 'error',
      });
    } finally {
      setIsLoadingDeviceTypes(false);
    }
  };

  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCustomerData({
      ...customerData,
      [name]: value,
    });
  };

  const handleAddDevice = () => {
    setDevices([
      ...devices,
      {
        serial: '',
        description: '',
        brand: '',
        model: '',
        processor: '',
        ram: undefined,
        storage: undefined,
        storageType: 'SSD',
        deviceTypeId: '',
      },
    ]);
  };

  const handleRemoveDevice = (index: number) => {
    setDevices(devices.filter((_, i) => i !== index));
  };

  const handleDeviceChange = (
    index: number,
    field: keyof CreateDeviceDto,
    value: string | number | undefined
  ) => {
    const updatedDevices = [...devices];
    updatedDevices[index] = {
      ...updatedDevices[index],
      [field]: value,
    };
    setDevices(updatedDevices);
  };

  const validateForm = (): boolean => {
    // Validar datos del cliente
    if (
      !customerData.documentNumber ||
      customerData.documentNumber.length < 5
    ) {
      setError('El número de documento debe tener al menos 5 caracteres');
      return false;
    }

    if (customerData.customerType === 'NATURAL') {
      if (!customerData.firstName || !customerData.lastName) {
        setError('Nombre y apellido son requeridos para personas naturales');
        return false;
      }
    } else {
      if (!customerData.businessName) {
        setError('La razón social es requerida para personas jurídicas');
        return false;
      }
    }

    // Validar email si está presente
    if (customerData.email && customerData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        setError('El correo electrónico no es válido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Preparar datos del cliente
      const dataToSubmit: CreateCustomerDto = {
        customerType: customerData.customerType,
        documentType: customerData.documentType,
        documentNumber: customerData.documentNumber,
        phoneNumber: customerData.phoneNumber,
      };

      // Agregar campos según tipo de cliente
      if (customerData.customerType === 'NATURAL') {
        dataToSubmit.firstName = customerData.firstName;
        dataToSubmit.lastName = customerData.lastName;
      } else {
        dataToSubmit.businessName = customerData.businessName;
        if (customerData.firstName && customerData.firstName.trim() !== '') {
          dataToSubmit.firstName = customerData.firstName;
        }
        if (customerData.lastName && customerData.lastName.trim() !== '') {
          dataToSubmit.lastName = customerData.lastName;
        }
      }

      // Agregar campos opcionales
      if (customerData.email && customerData.email.trim() !== '') {
        dataToSubmit.email = customerData.email;
      }

      // Agregar dispositivos si hay alguno con datos
      const validDevices = devices.filter(
        (device) =>
          device.serial || device.brand || device.model || device.deviceTypeId
      );

      if (validDevices.length > 0) {
        // Limpiar campos vacíos de los dispositivos
        dataToSubmit.devices = validDevices.map((device) => {
          const cleanDevice: CreateDeviceDto = {};
          if (device.serial) cleanDevice.serial = device.serial;
          if (device.description) cleanDevice.description = device.description;
          if (device.brand) cleanDevice.brand = device.brand;
          if (device.model) cleanDevice.model = device.model;
          if (device.processor) cleanDevice.processor = device.processor;
          if (device.ram) cleanDevice.ram = device.ram;
          if (device.storage) cleanDevice.storage = device.storage;
          if (device.storageType) cleanDevice.storageType = device.storageType;
          if (device.deviceTypeId)
            cleanDevice.deviceTypeId = device.deviceTypeId;
          return cleanDevice;
        });
      }

      await customersService.create(dataToSubmit);

      setToast({
        message: `¡Cliente creado exitosamente${
          validDevices.length > 0
            ? ` con ${validDevices.length} dispositivo(s)`
            : ''
        }!`,
        type: 'success',
      });

      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push('/dashboard/clientes');
      }, 1500);
    } catch (err: any) {
      console.error('Error al crear cliente:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al crear el cliente';
      setError(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isNatural = customerData.customerType === 'NATURAL';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
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
            Nuevo Cliente
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crea un nuevo cliente y opcionalmente agrega sus dispositivos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Datos del Cliente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            {isNatural ? (
              <User className="w-6 h-6 text-primary-500" />
            ) : (
              <Building2 className="w-6 h-6 text-primary-500" />
            )}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Datos del Cliente
            </h2>
          </div>

          <div className="space-y-4">
            {/* Tipo de Cliente */}
            <div>
              <label
                htmlFor="customerType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tipo de Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="customerType"
                name="customerType"
                required
                value={customerData.customerType}
                onChange={handleCustomerChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {CUSTOMER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos según tipo de cliente */}
            {isNatural ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={customerData.firstName}
                    onChange={handleCustomerChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={customerData.lastName}
                    onChange={handleCustomerChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Pérez"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="businessName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    required
                    value={customerData.businessName}
                    onChange={handleCustomerChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Empresa S.A.S."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Nombre de Contacto
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={customerData.firstName}
                      onChange={handleCustomerChange}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="(Opcional)"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Apellido de Contacto
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={customerData.lastName}
                      onChange={handleCustomerChange}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="(Opcional)"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="documentType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  id="documentType"
                  name="documentType"
                  required
                  value={customerData.documentType}
                  onChange={handleCustomerChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="documentNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="documentNumber"
                  name="documentNumber"
                  required
                  minLength={5}
                  value={customerData.documentNumber}
                  onChange={handleCustomerChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="1234567890"
                />
              </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customerData.email}
                  onChange={handleCustomerChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="correo@example.com (opcional)"
                />
              </div>
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={customerData.phoneNumber}
                  onChange={handleCustomerChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="3001234567"
                />
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
              <span className="text-sm text-gray-500 dark:text-gray-400">
                (Opcional)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddDevice}
              disabled={isLoadingDeviceTypes}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Agregar Dispositivo
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Laptop className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay dispositivos agregados</p>
              <p className="text-sm mt-1">
                Puedes agregar dispositivos ahora o más tarde
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-white">
                      Dispositivo #{index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleRemoveDevice(index)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar dispositivo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Serial
                      </label>
                      <input
                        type="text"
                        value={device.serial || ''}
                        onChange={(e) =>
                          handleDeviceChange(index, 'serial', e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="ABC123XYZ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Dispositivo
                      </label>
                      <select
                        value={device.deviceTypeId || ''}
                        onChange={(e) =>
                          handleDeviceChange(
                            index,
                            'deviceTypeId',
                            e.target.value
                          )
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar tipo</option>
                        {deviceTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={device.brand || ''}
                        onChange={(e) =>
                          handleDeviceChange(index, 'brand', e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="HP"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Modelo
                      </label>
                      <input
                        type="text"
                        value={device.model || ''}
                        onChange={(e) =>
                          handleDeviceChange(index, 'model', e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="EliteBook 840 G8"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Procesador
                      </label>
                      <input
                        type="text"
                        value={device.processor || ''}
                        onChange={(e) =>
                          handleDeviceChange(index, 'processor', e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Intel Core i7"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RAM (GB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={device.ram || ''}
                        onChange={(e) =>
                          handleDeviceChange(
                            index,
                            'ram',
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="16"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Almacenamiento (GB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={device.storage || ''}
                        onChange={(e) =>
                          handleDeviceChange(
                            index,
                            'storage',
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="512"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Almacenamiento
                      </label>
                      <select
                        value={device.storageType || 'SSD'}
                        onChange={(e) =>
                          handleDeviceChange(
                            index,
                            'storageType',
                            e.target.value as StorageType
                          )
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {STORAGE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={device.description || ''}
                        onChange={(e) =>
                          handleDeviceChange(
                            index,
                            'description',
                            e.target.value
                          )
                        }
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Descripción adicional del dispositivo"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.push('/dashboard/clientes')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </form>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
