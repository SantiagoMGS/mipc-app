'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Task, CreateTaskDto, CreateTaskItemDto } from '@/types/task';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto) => Promise<void>;
  task?: Task | null;
  title: string;
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  title,
}: TaskFormModalProps) {
  const [formData, setFormData] = useState<CreateTaskDto>({
    customer: '',
    description: '',
    isDone: false,
    hasInvoice: false,
    items: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Items existentes (solo visualización en modo edición)
  const [existingItems, setExistingItems] = useState<CreateTaskItemDto[]>([]);
  // Items nuevos a agregar (solo estos se envían al backend en modo edición)
  const [newItemsToAdd, setNewItemsToAdd] = useState<CreateTaskItemDto[]>([]);

  // Item temporal para agregar nuevos items
  const [newItem, setNewItem] = useState<CreateTaskItemDto>({
    name: '',
    quantity: 1,
    price: 0,
  });

  useEffect(() => {
    if (task) {
      // Modo edición
      setFormData({
        customer: task.customer,
        description: task.description,
        isDone: task.isDone,
        hasInvoice: task.hasInvoice,
        items: [], // No enviamos items existentes
      });
      // Guardamos los items existentes solo para mostrarlos
      setExistingItems(
        task.taskItems?.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })) || []
      );
      setNewItemsToAdd([]); // Limpiamos items nuevos
    } else {
      // Modo creación
      setFormData({
        customer: '',
        description: '',
        isDone: false,
        hasInvoice: false,
        items: [],
      });
      setExistingItems([]);
      setNewItemsToAdd([]);
    }
    setError('');
    setNewItem({ name: '', quantity: 1, price: 0 });
  }, [task, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      setError('El nombre del item es requerido');
      return;
    }
    if (newItem.quantity < 1) {
      setError('La cantidad debe ser al menos 1');
      return;
    }
    if (newItem.price < 0) {
      setError('El precio no puede ser negativo');
      return;
    }

    if (task) {
      // Modo edición: agregamos a la lista de nuevos items
      setNewItemsToAdd([...newItemsToAdd, newItem]);
    } else {
      // Modo creación: agregamos a formData.items
      setFormData({
        ...formData,
        items: [...(formData.items || []), newItem],
      });
    }
    setNewItem({ name: '', quantity: 1, price: 0 });
    setError('');
  };

  const handleRemoveItem = (index: number, isExisting: boolean) => {
    if (isExisting) {
      // Remover de items existentes (solo visual, no afecta el backend)
      setExistingItems(existingItems.filter((_, i) => i !== index));
    } else {
      if (task) {
        // Modo edición: remover de nuevos items a agregar
        setNewItemsToAdd(newItemsToAdd.filter((_, i) => i !== index));
      } else {
        // Modo creación: remover de formData.items
        setFormData({
          ...formData,
          items: formData.items?.filter((_, i) => i !== index),
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validaciones
      if (!formData.customer.trim() || formData.customer.length > 255) {
        throw new Error(
          'El cliente es requerido y debe tener máximo 255 caracteres'
        );
      }
      if (!formData.description.trim() || formData.description.length > 1000) {
        throw new Error(
          'La descripción es requerida y debe tener máximo 1000 caracteres'
        );
      }

      const dataToSubmit: CreateTaskDto = {
        customer: formData.customer.trim(),
        description: formData.description.trim(),
        isDone: formData.isDone,
        hasInvoice: formData.hasInvoice,
      };

      // En modo edición, solo enviar nuevos items si hay
      // En modo creación, enviar todos los items de formData
      if (task) {
        // Modo edición: solo enviar items nuevos agregados en esta sesión
        if (newItemsToAdd.length > 0) {
          dataToSubmit.items = newItemsToAdd;
        }
      } else {
        // Modo creación: enviar todos los items
        if (formData.items && formData.items.length > 0) {
          dataToSubmit.items = formData.items;
        }
      }

      await onSubmit(dataToSubmit);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al guardar la tarea';
      setError(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalItems =
    formData.items?.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    ) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="customer"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customer"
                name="customer"
                required
                maxLength={255}
                value={formData.customer}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                maxLength={1000}
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Descripción de la tarea"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.description.length}/1000 caracteres
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDone"
                  name="isDone"
                  checked={formData.isDone}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="isDone"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tarea completada
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasInvoice"
                  name="hasInvoice"
                  checked={formData.hasInvoice}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="hasInvoice"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Con factura
                </label>
              </div>
            </div>
          </div>

          {/* Sección de items */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Items
            </h3>

            {/* Agregar nuevo item */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <input
                    type="text"
                    placeholder="Nombre del item"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    placeholder="Cantidad"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="number"
                    placeholder="Precio"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de items */}
            {(task ? existingItems.length + newItemsToAdd.length : formData.items?.length || 0) > 0 ? (
              <div className="space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Nombre
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Precio
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Subtotal
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Items existentes (solo en modo edición) */}
                      {task && existingItems.map((item, index) => (
                        <tr key={`existing-${index}`} className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                            {item.name}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Existente)</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                            ${item.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right font-medium">
                            ${(item.quantity * item.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index, true)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Eliminar de la vista (no afecta el backend)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Items nuevos a agregar (en modo edición) */}
                      {task && newItemsToAdd.map((item, index) => (
                        <tr key={`new-${index}`} className="bg-green-50 dark:bg-green-900/10">
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                            {item.name}
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">(Nuevo)</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                            ${item.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right font-medium">
                            ${(item.quantity * item.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index, false)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Items en modo creación */}
                      {!task && formData.items?.map((item, index) => (
                        <tr key={index} className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                            ${item.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right font-medium">
                            ${(item.quantity * item.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index, false)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 text-right"
                        >
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 text-right">
                          ${(task 
                            ? [...existingItems, ...newItemsToAdd].reduce((sum, item) => sum + item.quantity * item.price, 0)
                            : (formData.items?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0)
                          ).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay items agregados
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
