'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  Task,
  CreateTaskDto,
  CreateTaskItemDto,
  TaskItem,
  UpdateTaskDto,
} from '@/types/task';
import { useDeleteTaskItem } from '@/hooks/useTasks';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto & UpdateTaskDto) => Promise<void>;
  task?: Task | null;
  title: string;
}

const inputClass =
  'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

// Un campo numérico vacío queda en NaN para poder borrarlo y escribir otro
// valor; la validación lo rechaza al agregar o al guardar.
const parseNumber = (value: string) => (value === '' ? NaN : Number(value));
const showNumber = (value: number) => (Number.isNaN(value) ? '' : value);

const emptyItem = (): CreateTaskItemDto => ({
  name: '',
  quantity: 1,
  price: NaN,
});

function validateItem(item: CreateTaskItemDto): string | null {
  if (!item.name.trim()) return 'El nombre del item es requerido';
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    return 'La cantidad debe ser un número entero de al menos 1';
  }
  if (Number.isNaN(item.price)) {
    return 'El precio es requerido (0 si no tiene costo)';
  }
  if (item.price < 0) return 'El precio no puede ser negativo';
  return null;
}

const trimItem = (item: CreateTaskItemDto): CreateTaskItemDto => ({
  name: item.name.trim(),
  quantity: item.quantity,
  price: item.price,
});

const subtotalOf = (item: CreateTaskItemDto) =>
  (item.quantity || 0) * (item.price || 0);

interface ItemRowProps {
  item: CreateTaskItemDto;
  tag?: React.ReactNode;
  className: string;
  onChange: (changes: Partial<CreateTaskItemDto>) => void;
  onRemove: () => void;
  removeDisabled?: boolean;
}

/**
 * Fila editable de un item. En el celular el nombre va arriba y cantidad,
 * precio y subtotal debajo; desde md va todo en una línea bajo el encabezado.
 */
function ItemRow({
  item,
  tag,
  className,
  onChange,
  onRemove,
  removeDisabled,
}: ItemRowProps) {
  const mobileLabel =
    'md:hidden block text-xs text-gray-500 dark:text-gray-400 mb-1';

  return (
    <div
      className={`grid grid-cols-12 gap-2 items-end md:items-center p-3 rounded-lg ${className}`}
    >
      <div className="col-span-11 md:col-span-5">
        <input
          type="text"
          aria-label="Nombre del item"
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={inputClass}
        />
        {tag}
      </div>
      <div className="col-span-1 flex justify-center self-start md:self-center md:order-last">
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Eliminar item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <label className="col-span-3 md:col-span-2">
        <span className={mobileLabel}>Cantidad</span>
        <input
          type="number"
          inputMode="numeric"
          aria-label="Cantidad"
          min="1"
          step="1"
          value={showNumber(item.quantity)}
          onChange={(e) => onChange({ quantity: parseNumber(e.target.value) })}
          className={`${inputClass} text-right`}
        />
      </label>
      <label className="col-span-5 md:col-span-2">
        <span className={mobileLabel}>Precio</span>
        <input
          type="number"
          inputMode="decimal"
          aria-label="Precio"
          min="0"
          step="0.01"
          value={showNumber(item.price)}
          onChange={(e) => onChange({ price: parseNumber(e.target.value) })}
          className={`${inputClass} text-right`}
        />
      </label>
      <div className="col-span-4 md:col-span-2 text-right">
        <span className={mobileLabel}>Subtotal</span>
        <p className="py-2 text-sm font-medium text-gray-800 dark:text-gray-200">
          ${subtotalOf(item).toLocaleString()}
        </p>
      </div>
    </div>
  );
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
  const errorRef = useRef<HTMLDivElement>(null);

  // Items existentes CON IDs (editables; se eliminan directo en el backend)
  const [existingItems, setExistingItems] = useState<TaskItem[]>([]);
  // Items nuevos a agregar en modo edición
  const [newItemsToAdd, setNewItemsToAdd] = useState<CreateTaskItemDto[]>([]);

  // Hook para eliminar items del backend
  const deleteItemMutation = useDeleteTaskItem();

  // Item temporal para agregar nuevos items
  const [newItem, setNewItem] = useState<CreateTaskItemDto>(emptyItem);

  // Se reinicia al abrir el modal o al cambiar de tarea, no cada vez que se
  // vuelve a consultar la tarea (por ejemplo tras eliminar un item): eso
  // borraría lo que el usuario lleva editado.
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
      setExistingItems(task.taskItems || []);
      setNewItemsToAdd([]);
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
    setNewItem(emptyItem());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, isOpen]);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

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
    const itemError = validateItem(newItem);
    if (itemError) {
      setError(itemError);
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
    setNewItem(emptyItem());
    setError('');
  };

  const updateAt = <T,>(items: T[], index: number, changes: Partial<T>) =>
    items.map((item, i) => (i === index ? { ...item, ...changes } : item));

  const handleChangeExistingItem = (
    index: number,
    changes: Partial<CreateTaskItemDto>
  ) => setExistingItems((items) => updateAt<TaskItem>(items, index, changes));

  const handleChangeNewItem = (
    index: number,
    changes: Partial<CreateTaskItemDto>
  ) => {
    if (task) {
      setNewItemsToAdd((items) => updateAt(items, index, changes));
    } else {
      setFormData((data) => ({
        ...data,
        items: updateAt(data.items || [], index, changes),
      }));
    }
  };

  const handleRemoveItem = async (index: number, isExisting: boolean) => {
    if (isExisting && task) {
      // Eliminar del backend si es un item existente
      const itemToDelete = existingItems[index];
      if (!itemToDelete?.id) return;

      try {
        await deleteItemMutation.mutateAsync({
          taskId: task.id,
          itemId: itemToDelete.id,
        });
        // Remover de la lista local después de eliminar del backend
        setExistingItems((items) =>
          items.filter((item) => item.id !== itemToDelete.id)
        );
      } catch (error) {
        console.error('Error al eliminar item:', error);
        // El toast ya se muestra en el hook useDeleteTaskItem
      }
    } else {
      if (task) {
        // Modo edición: remover de nuevos items a agregar (solo local)
        setNewItemsToAdd(newItemsToAdd.filter((_, i) => i !== index));
      } else {
        // Modo creación: remover de formData.items (solo local)
        setFormData({
          ...formData,
          items: formData.items?.filter((_, i) => i !== index),
        });
      }
    }
  };

  const originalItems = new Map(
    (task?.taskItems || []).map((item) => [item.id, item])
  );
  const isModified = (item: TaskItem) => {
    const original = originalItems.get(item.id);
    return (
      !!original &&
      (original.name !== item.name ||
        original.quantity !== item.quantity ||
        original.price !== item.price)
    );
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

      const itemsToSave = task
        ? [...existingItems, ...newItemsToAdd]
        : formData.items || [];
      for (const item of itemsToSave) {
        const itemError = validateItem(item);
        if (itemError) {
          throw new Error(
            `${itemError} (${item.name.trim() || 'item sin nombre'})`
          );
        }
      }

      const dataToSubmit: CreateTaskDto & UpdateTaskDto = {
        customer: formData.customer.trim(),
        description: formData.description.trim(),
        isDone: formData.isDone,
        hasInvoice: formData.hasInvoice,
      };

      if (task) {
        // Modo edición: items nuevos de esta sesión y existentes modificados
        if (newItemsToAdd.length > 0) {
          dataToSubmit.items = newItemsToAdd.map(trimItem);
        }
        const updatedItems = existingItems
          .filter(isModified)
          .map((item) => ({ id: item.id, ...trimItem(item) }));
        if (updatedItems.length > 0) {
          dataToSubmit.updatedItems = updatedItems;
        }
      } else {
        // Modo creación: enviar todos los items
        if (formData.items && formData.items.length > 0) {
          dataToSubmit.items = formData.items.map(trimItem);
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

  const allItems: CreateTaskItemDto[] = task
    ? [...existingItems, ...newItemsToAdd]
    : formData.items || [];
  const total = allItems.reduce((sum, item) => sum + subtotalOf(item), 0);

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
            <div
              ref={errorRef}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
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
                className={inputClass}
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
                className={inputClass}
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
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Cantidad"
                    min="1"
                    step="1"
                    value={showNumber(newItem.quantity)}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseNumber(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Precio"
                    min="0"
                    step="0.01"
                    value={showNumber(newItem.price)}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        price: parseNumber(e.target.value),
                      })
                    }
                    className={inputClass}
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

            {/* Lista de items (editables) */}
            {allItems.length > 0 ? (
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  <span className="col-span-5">Nombre</span>
                  <span className="col-span-2 text-right">Cantidad</span>
                  <span className="col-span-2 text-right">Precio</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                  <span className="col-span-1" />
                </div>

                {/* Items existentes (solo en modo edición) */}
                {task &&
                  existingItems.map((item, index) => {
                    const modified = isModified(item);
                    return (
                      <ItemRow
                        key={item.id}
                        item={item}
                        className={
                          modified
                            ? 'bg-amber-50 dark:bg-amber-900/10'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }
                        tag={
                          modified && (
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
                              Modificado (se guarda al pulsar Guardar)
                            </p>
                          )
                        }
                        onChange={(changes) =>
                          handleChangeExistingItem(index, changes)
                        }
                        onRemove={() => handleRemoveItem(index, true)}
                        removeDisabled={deleteItemMutation.isPending}
                      />
                    );
                  })}

                {/* Items nuevos (en edición) o items en modo creación */}
                {(task ? newItemsToAdd : formData.items || []).map(
                  (item, index) => (
                    <ItemRow
                      key={`new-${index}`}
                      item={item}
                      className={
                        task
                          ? 'bg-green-50 dark:bg-green-900/10'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }
                      tag={
                        task && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            Nuevo
                          </p>
                        )
                      }
                      onChange={(changes) =>
                        handleChangeNewItem(index, changes)
                      }
                      onRemove={() => handleRemoveItem(index, false)}
                    />
                  )
                )}

                <div className="flex justify-end gap-4 px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">${total.toLocaleString()}</span>
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
