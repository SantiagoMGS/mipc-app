'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import TaskFormModal from '@/components/TaskFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Circle,
  DollarSign,
  Package,
} from 'lucide-react';

export default function DetalleTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  // Queries
  const { data: task, isLoading, error } = useTask(taskId);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    await deleteMutation.mutateAsync(taskId);
    setIsConfirmDialogOpen(false);
    router.push('/dashboard/tareas');
  };

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync({ id: taskId, data });
  };

  const handleBack = () => {
    router.push('/dashboard/tareas');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando tarea...
          </p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Tareas
        </Button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
              Error al cargar la tarea
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error?.message || 'No se pudo cargar la información de la tarea'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalItems =
    task.taskItems?.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Tareas
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {task.customer}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Tarea #{task.id.slice(0, 8)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {task.isDone ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <CheckCircle className="w-4 h-4" />
                Completada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                <Circle className="w-4 h-4" />
                Pendiente
              </span>
            )}
            {task.hasInvoice ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                Con Factura
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                Sin Factura
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Descripción */}
          <div className="md:col-span-2">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-gray-700 dark:text-gray-300 font-semibold">
                  Descripción
                </Label>
                <p className="text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>
          </div>

          {/* Fecha de Creación */}
          <div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-gray-700 dark:text-gray-300 font-semibold">
                  Fecha de Creación
                </Label>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(task.createdAt).toLocaleString('es-CO', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Última Actualización */}
          <div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-gray-700 dark:text-gray-300 font-semibold">
                  Última Actualización
                </Label>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(task.updatedAt).toLocaleString('es-CO', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items de la Tarea */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Items
          </h2>
        </div>

        {task.taskItems && task.taskItems.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {task.taskItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right">
                        ${item.price.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 text-right">
                        ${(item.quantity * item.price).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 text-right"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 text-right">
                      ${totalItems.toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay items asociados a esta tarea
            </p>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        task={task}
        title="Editar Tarea"
      />

      {/* Diálogo de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onCancel={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer y se eliminarán también todos los items asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
