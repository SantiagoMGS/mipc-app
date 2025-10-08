'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DeviceType, CreateDeviceTypeDto } from '@/types/device-type';

interface DeviceTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeviceTypeDto) => Promise<void>;
  deviceType?: DeviceType | null;
  title: string;
}

export default function DeviceTypeFormModal({
  isOpen,
  onClose,
  onSubmit,
  deviceType,
  title,
}: DeviceTypeFormModalProps) {
  const [formData, setFormData] = useState<CreateDeviceTypeDto>({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deviceType) {
      setFormData({
        name: deviceType.name,
      });
    } else {
      setFormData({
        name: '',
      });
    }
    setError('');
  }, [deviceType, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Convertir a mayúsculas automáticamente
    setFormData({
      name: value.toUpperCase(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al guardar el tipo de dispositivo';
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              minLength={1}
              value={formData.name}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
              placeholder="SENSOR"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">
              El nombre se guardará en mayúsculas automáticamente
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
