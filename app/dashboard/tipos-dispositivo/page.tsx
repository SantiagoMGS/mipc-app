'use client';

import { useState, useEffect } from 'react';
import { deviceTypesService } from '@/lib/api';
import { DeviceType, CreateDeviceTypeDto } from '@/types/device-type';
import DeviceTypeFormModal from '@/components/DeviceTypeFormModal';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import {
  Cpu,
  Edit,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function TiposDispositivoPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [filteredDeviceTypes, setFilteredDeviceTypes] = useState<DeviceType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeviceType, setEditingDeviceType] = useState<DeviceType | null>(
    null
  );

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

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

  // Cargar tipos de dispositivo al montar el componente
  useEffect(() => {
    loadDeviceTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, showDeleted]);

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

  const loadDeviceTypes = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await deviceTypesService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        withDeleted: showDeleted,
      });
      console.log('📦 Datos recibidos de la API:', response);

      // La API devuelve {data: [], total, page, limit}
      const deviceTypesArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setDeviceTypes(deviceTypesArray);
      setTotalItems(response?.total || 0);
      setTotalPages(Math.ceil((response?.total || 0) / itemsPerPage));
    } catch (err: any) {
      console.error('Error al cargar tipos de dispositivo:', err);
      setError(
        'Error al cargar los tipos de dispositivo. Por favor, intenta de nuevo.'
      );
      setDeviceTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: CreateDeviceTypeDto) => {
    await deviceTypesService.create(data);
    setCurrentPage(1);
    await loadDeviceTypes();
    setIsModalOpen(false);
    setToast({
      message: '¡Tipo de dispositivo creado exitosamente!',
      type: 'success',
    });
  };

  const handleUpdate = async (data: CreateDeviceTypeDto) => {
    if (editingDeviceType) {
      await deviceTypesService.update(editingDeviceType.id, data);
      await loadDeviceTypes();
      setIsModalOpen(false);
      setEditingDeviceType(null);
      setToast({
        message: '¡Tipo de dispositivo actualizado exitosamente!',
        type: 'success',
      });
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
        await deviceTypesService.delete(confirmDialog.deviceTypeId);
        await loadDeviceTypes();
        setToast({
          message: '¡Tipo de dispositivo eliminado exitosamente!',
          type: 'success',
        });
      } catch (err: any) {
        console.error('Error al eliminar:', err);
        setToast({
          message:
            'Error al eliminar el tipo de dispositivo. Por favor, intenta de nuevo.',
          type: 'error',
        });
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
    try {
      await deviceTypesService.reactivate(deviceType.id);
      await loadDeviceTypes();
      setToast({
        message: '¡Tipo de dispositivo reactivado exitosamente!',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error al reactivar:', err);
      setToast({
        message:
          'Error al reactivar el tipo de dispositivo. Por favor, intenta de nuevo.',
        type: 'error',
      });
    }
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
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo Tipo</span>
        </button>
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
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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
      ) : (
        /* Device Types Grid */
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
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Reactivar"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm font-medium">Reactivar</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(deviceType)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm font-medium">Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(deviceType)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Eliminar</span>
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

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
