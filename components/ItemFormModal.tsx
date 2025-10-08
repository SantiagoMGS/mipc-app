'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Item, CreateItemDto } from '@/types/item';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemDto) => Promise<void>;
  item?: Item | null;
  title: string;
}

export default function ItemFormModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  title,
}: ItemFormModalProps) {
  const [formData, setFormData] = useState<CreateItemDto>({
    name: '',
    code: '',
    price: 0,
    description: '',
    itemType: 'PRODUCTO',
  });
  const [priceInput, setPriceInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        code: item.code,
        price: item.price,
        description: item.description,
        itemType: item.itemType,
      });
      setPriceInput(item.price.toLocaleString('es-CO'));
    } else {
      setFormData({
        name: '',
        code: '',
        price: 0,
        description: '',
        itemType: 'PRODUCTO',
      });
      setPriceInput('');
    }
    setError('');
  }, [item, isOpen]);

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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remover todo excepto números
    const numbersOnly = value.replace(/\D/g, '');
    
    if (numbersOnly === '') {
      setPriceInput('');
      setFormData({ ...formData, price: 0 });
      return;
    }

    const numericValue = parseInt(numbersOnly, 10);
    setPriceInput(numericValue.toLocaleString('es-CO'));
    setFormData({ ...formData, price: numericValue });
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
        'Error al guardar el item';
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

          {/* Tipo de Item */}
          <div>
            <label
              htmlFor="itemType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              id="itemType"
              name="itemType"
              required
              value={formData.itemType}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="PRODUCTO">Producto</option>
              <option value="SERVICIO">Servicio</option>
            </select>
          </div>

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
              value={formData.name}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Laptop Dell"
            />
          </div>

          {/* Código */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="LAPTOP-001"
            />
          </div>

          {/* Precio */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Precio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                id="price"
                name="price"
                required
                value={priceInput}
                onChange={handlePriceChange}
                className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="1.500.000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Solo números enteros, sin decimales</p>
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Laptop de alta gama (opcional)"
            />
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
