'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateDeviceForCustomerDto, StorageType } from '@/types/device';
import { DeviceType } from '@/types/device-type';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeviceForCustomerDto) => Promise<void>;
  customerId: string;
  deviceTypes: DeviceType[];
}

const STORAGE_TYPES: { value: StorageType; label: string }[] = [
  { value: 'SSD', label: 'SSD' },
  { value: 'HDD', label: 'HDD' },
];

export default function DeviceFormModal({
  isOpen,
  onClose,
  onSubmit,
  customerId,
  deviceTypes,
}: DeviceFormModalProps) {
  const [formData, setFormData] = useState<CreateDeviceForCustomerDto>({
    customerId: customerId,
    serial: '',
    description: '',
    brand: '',
    model: '',
    processor: '',
    ram: undefined,
    storage: undefined,
    storageType: 'SSD',
    deviceTypeId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        customerId: customerId,
        serial: '',
        description: '',
        brand: '',
        model: '',
        processor: '',
        ram: undefined,
        storage: undefined,
        storageType: 'SSD',
        deviceTypeId: '',
      });
      setError('');
    }
  }, [isOpen, customerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'ram' || name === 'storage'
          ? value
            ? parseInt(value)
            : undefined
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Limpiar campos vacíos antes de enviar
      const dataToSubmit: CreateDeviceForCustomerDto = {
        customerId: formData.customerId,
      };

      if (formData.serial && formData.serial.trim() !== '') {
        dataToSubmit.serial = formData.serial;
      }
      if (formData.description && formData.description.trim() !== '') {
        dataToSubmit.description = formData.description;
      }
      if (formData.brand && formData.brand.trim() !== '') {
        dataToSubmit.brand = formData.brand;
      }
      if (formData.model && formData.model.trim() !== '') {
        dataToSubmit.model = formData.model;
      }
      if (formData.processor && formData.processor.trim() !== '') {
        dataToSubmit.processor = formData.processor;
      }
      if (formData.ram) {
        dataToSubmit.ram = formData.ram;
      }
      if (formData.storage) {
        dataToSubmit.storage = formData.storage;
      }
      if (formData.storageType) {
        dataToSubmit.storageType = formData.storageType;
      }
      if (formData.deviceTypeId && formData.deviceTypeId.trim() !== '') {
        dataToSubmit.deviceTypeId = formData.deviceTypeId;
      }

      await onSubmit(dataToSubmit);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar dispositivo:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al guardar el dispositivo';
      setError(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Agregar Dispositivo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="serial"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Serial
              </label>
              <input
                type="text"
                id="serial"
                name="serial"
                value={formData.serial}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ABC123XYZ"
              />
            </div>

            <div>
              <label
                htmlFor="deviceTypeId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tipo de Dispositivo
              </label>
              <select
                id="deviceTypeId"
                name="deviceTypeId"
                value={formData.deviceTypeId}
                onChange={handleChange}
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
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Marca
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="HP"
              />
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Modelo
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="EliteBook 840 G8"
              />
            </div>

            <div>
              <label
                htmlFor="processor"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Procesador
              </label>
              <input
                type="text"
                id="processor"
                name="processor"
                value={formData.processor}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Intel Core i7"
              />
            </div>

            <div>
              <label
                htmlFor="ram"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                RAM (GB)
              </label>
              <input
                type="number"
                id="ram"
                name="ram"
                min="1"
                value={formData.ram || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="16"
              />
            </div>

            <div>
              <label
                htmlFor="storage"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Almacenamiento (GB)
              </label>
              <input
                type="number"
                id="storage"
                name="storage"
                min="1"
                value={formData.storage || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="512"
              />
            </div>

            <div>
              <label
                htmlFor="storageType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tipo de Almacenamiento
              </label>
              <select
                id="storageType"
                name="storageType"
                value={formData.storageType}
                onChange={handleChange}
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
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Descripción
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Descripción adicional del dispositivo"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar Dispositivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
