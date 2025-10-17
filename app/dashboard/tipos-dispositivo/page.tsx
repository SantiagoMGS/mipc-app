'use client';

import { useState, useEffect } from 'react';
import { DeviceType, CreateDeviceTypeDto } from '@/types/device-type';
import DeviceTypeFormModal from '@/components/DeviceTypeFormModal';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import {
  useDeviceTypes,
  useCreateDeviceType,
  useUpdateDeviceType,
  useDeleteDeviceType,
  useReactivateDeviceType,
} from '@/hooks/useDeviceTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cpu,
  Edit,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TiposDispositivoPage() {
  const { toast } = useToast();
  const { viewMode } = useViewMode();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // TanStack Query
  const { data, isLoading, error } = useDeviceTypes({
    page: currentPage,
    limit: itemsPerPage,
    withDeleted: showDeleted,
  });
  const createDeviceTypeMutation = useCreateDeviceType();
  const updateDeviceTypeMutation = useUpdateDeviceType();
  const deleteDeviceTypeMutation = useDeleteDeviceType();
  const reactivateDeviceTypeMutation = useReactivateDeviceType();

  const deviceTypes = data?.deviceTypes || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [filteredDeviceTypes, setFilteredDeviceTypes] = useState<DeviceType[]>(
    []
  );

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeviceType, setEditingDeviceType] = useState<DeviceType | null>(
    null
  );

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    deviceTypeId: string | null;
    deviceTypeName: string;
  }>({
    isOpen: false,
    deviceTypeId: null,
    deviceTypeName: '',
  });

  // Filtrar tipos de dispositivo cuando cambia el término de búsqueda
  useEffect(() => {
    if (!Array.isArray(deviceTypes)) {
      console.warn('⚠️ deviceTypes no es un array:', deviceTypes);
      setFilteredDeviceTypes([]);
      return;
    }

    let filtered = deviceTypes;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((deviceType) =>
        deviceType.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDeviceTypes(filtered);
  }, [deviceTypes, searchTerm]);

  const handleCreate = async (data: CreateDeviceTypeDto) => {
    await createDeviceTypeMutation.mutateAsync(data);
    setCurrentPage(1);
    setIsModalOpen(false);
  };

  const handleUpdate = async (data: CreateDeviceTypeDto) => {
    if (editingDeviceType) {
      await updateDeviceTypeMutation.mutateAsync({
        id: editingDeviceType.id,
        data,
      });
      setIsModalOpen(false);
      setEditingDeviceType(null);
    }
  };

  const handleDeleteClick = (deviceType: DeviceType) => {
    setConfirmDialog({
      isOpen: true,
      deviceTypeId: deviceType.id,
      deviceTypeName: deviceType.name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (confirmDialog.deviceTypeId) {
      try {
        await deleteDeviceTypeMutation.mutateAsync(confirmDialog.deviceTypeId);
      } finally {
        setConfirmDialog({
          isOpen: false,
          deviceTypeId: null,
          deviceTypeName: '',
        });
      }
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDialog({
      isOpen: false,
      deviceTypeId: null,
      deviceTypeName: '',
    });
  };

  const handleReactivate = async (deviceType: DeviceType) => {
    await reactivateDeviceTypeMutation.mutateAsync(deviceType.id);
  };

  const openCreateModal = () => {
    setEditingDeviceType(null);
    setIsModalOpen(true);
  };

  const openEditModal = (deviceType: DeviceType) => {
    setEditingDeviceType(deviceType);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Tipos de Dispositivo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona los tipos de dispositivos disponibles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewModeToggle />
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Tipo</span>
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Toggle para mostrar eliminados */}
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mostrar eliminados
            </span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {error.message || 'Error al cargar los tipos de dispositivo'}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando tipos de dispositivo...
          </p>
        </div>
      ) : filteredDeviceTypes.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <Cpu className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            No hay tipos de dispositivo para mostrar
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'No se encontraron tipos de dispositivo con los filtros aplicados'
              : 'Comienza agregando tu primer tipo de dispositivo'}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Tipo
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-700 dark:text-gray-300">Nombre</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Estado</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(filteredDeviceTypes) &&
                filteredDeviceTypes.map((deviceType) => (
                  <TableRow key={deviceType.id} className="border-gray-200 dark:border-gray-700">
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {deviceType.name}
                    </TableCell>
                    <TableCell>
                      {deviceType.isActive ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!deviceType.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(deviceType)}
                            className="h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(deviceType)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(deviceType)}
                              className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.isArray(filteredDeviceTypes) &&
            filteredDeviceTypes.map((deviceType) => (
              <div
                key={deviceType.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
                  !deviceType.isActive
                    ? 'opacity-60 border-2 border-gray-300 dark:border-gray-600'
                    : ''
                }`}
              >
                {/* Badges de estado */}
                {(!deviceType.isActive || deviceType.deletedAt) && (
                  <div className="px-4 pt-3 flex gap-2 flex-wrap">
                    {!deviceType.isActive && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        INACTIVO
                      </span>
                    )}
                    {deviceType.deletedAt && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        ELIMINADO
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`p-6 ${
                    !deviceType.isActive || deviceType.deletedAt ? 'pt-3' : ''
                  }`}
                >
                  {/* Ícono y nombre */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <Cpu className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex-1">
                      {deviceType.name}
                    </h3>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    {!deviceType.isActive ? (
                      <button
                        onClick={() => handleReactivate(deviceType)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Reactivar"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(deviceType)}
                          className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(deviceType)}
                          className="flex-1 flex items-center justify-center px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
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

      {/* Modal de formulario */}
      <DeviceTypeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDeviceType(null);
        }}
        onSubmit={editingDeviceType ? handleUpdate : handleCreate}
        deviceType={editingDeviceType}
        title={
          editingDeviceType
            ? 'Editar Tipo de Dispositivo'
            : 'Nuevo Tipo de Dispositivo'
        }
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar "${confirmDialog.deviceTypeName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
}
