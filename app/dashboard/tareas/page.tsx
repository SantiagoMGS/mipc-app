'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks, useDeleteTask } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import TaskFormModal from '@/components/TaskFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  Eye,
  Plus,
  Search,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { ViewModeToggle } from '@/components/ViewModeToggle';

export default function TareasPage() {
  const router = useRouter();
  const { viewMode } = useViewMode();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros
  const [isDoneFilter, setIsDoneFilter] = useState<boolean | undefined>(
    undefined
  );
  const [hasInvoiceFilter, setHasInvoiceFilter] = useState<boolean | undefined>(
    undefined
  );

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // TanStack Query
  const { data, isLoading, error } = useTasks({
    customer: searchTerm || undefined,
    description: searchTerm || undefined,
    isDone: isDoneFilter,
    hasInvoice: hasInvoiceFilter,
    page: currentPage,
    limit: itemsPerPage,
  });

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const tasks = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Filtrar tareas por término de búsqueda local
  useEffect(() => {
    if (!Array.isArray(tasks)) {
      setFilteredTasks([]);
      return;
    }

    let filtered = tasks;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.customer.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm]);

  const handleViewDetails = (taskId: string) => {
    router.push(`/dashboard/tareas/${taskId}`);
  };

  const handleCreateNew = () => {
    setSelectedTask(null);
    setModalTitle('Nueva Tarea');
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setModalTitle('Editar Tarea');
    setIsModalOpen(true);
  };

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(taskId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await deleteMutation.mutateAsync(taskToDelete);
      setIsConfirmDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleSubmit = async (data: any) => {
    if (selectedTask) {
      await updateMutation.mutateAsync({ id: selectedTask.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Tareas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona las tareas y trabajos realizados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewModeToggle />
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Tarea</span>
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por cliente o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro de Estado Completado */}
          <select
            value={
              isDoneFilter === undefined ? '' : isDoneFilter ? 'true' : 'false'
            }
            onChange={(e) => {
              const value = e.target.value;
              setIsDoneFilter(
                value === '' ? undefined : value === 'true'
              );
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="false">Pendientes</option>
            <option value="true">Completadas</option>
          </select>

          {/* Filtro de Factura */}
          <select
            value={
              hasInvoiceFilter === undefined
                ? ''
                : hasInvoiceFilter
                ? 'true'
                : 'false'
            }
            onChange={(e) => {
              const value = e.target.value;
              setHasInvoiceFilter(
                value === '' ? undefined : value === 'true'
              );
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todas las facturas</option>
            <option value="true">Con Factura</option>
            <option value="false">Sin Factura</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {error.message || 'Error al cargar las tareas'}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando tareas...
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            No hay tareas para mostrar
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || isDoneFilter !== undefined || hasInvoiceFilter !== undefined
              ? 'No se encontraron tareas con los filtros aplicados'
              : 'Comienza creando tu primera tarea'}
          </p>
          {!searchTerm && isDoneFilter === undefined && hasInvoiceFilter === undefined && (
            <Button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Tarea
            </Button>
          )}
        </div>
      ) : (
        /* Tasks Table/Cards */
        <>
          {viewMode === 'table' ? (
            /* Table View */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Factura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => handleViewDetails(task.id)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.customer}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                            {task.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.isDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              <CheckCircle className="w-3 h-3" />
                              Completada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                              <Circle className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.hasInvoice ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Con Factura
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              Sin Factura
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(task.createdAt).toLocaleDateString(
                              'es-CO'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(task.id)}
                              className="inline-flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEdit(task, e)}
                              className="inline-flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(task.id, e)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(task.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {task.customer}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(task.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Descripción */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {task.description}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {task.isDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <CheckCircle className="w-3 h-3" />
                          Completada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          <Circle className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                      {task.hasInvoice ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Con Factura
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          Sin Factura
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(task.id);
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEdit(task, e)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(task.id, e)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Paginación */}
      {!isLoading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(perPage) => {
            setItemsPerPage(perPage);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Modal de Formulario */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        task={selectedTask}
        title={modalTitle}
      />

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onCancel={() => {
          setIsConfirmDialogOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
