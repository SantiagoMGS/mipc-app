'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Customer, CreateCustomerDto, DocumentType } from '@/types/customer';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerDto) => Promise<void>;
  customer?: Customer | null;
  title: string;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  title,
}: CustomerFormModalProps) {
  const [formData, setFormData] = useState<CreateCustomerDto>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    documentType: 'CC',
    documentNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        documentType: 'CC',
        documentNumber: '',
      });
    }
    setError('');
  }, [customer, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Limpiar campos opcionales vacíos
      const dataToSubmit: CreateCustomerDto = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
      };

      if (formData.email && formData.email.trim() !== '') {
        dataToSubmit.email = formData.email;
      }

      if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
        dataToSubmit.phoneNumber = formData.phoneNumber;
      }

      await onSubmit(dataToSubmit);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al guardar el cliente';
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

          {/* Nombres y Apellidos en dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Juan"
              />
            </div>

            {/* Apellido */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Pérez"
              />
            </div>
          </div>

          {/* Tipo y Número de Documento en dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Documento */}
            <div>
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                required
                value={formData.documentType}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Número de Documento */}
            <div>
              <label
                htmlFor="documentNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Número de Documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="documentNumber"
                name="documentNumber"
                required
                minLength={5}
                value={formData.documentNumber}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="1234567890"
              />
            </div>
          </div>

          {/* Email y Teléfono en dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="juan.perez@example.com (opcional)"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Teléfono
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="3001234567 (opcional)"
              />
            </div>
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
