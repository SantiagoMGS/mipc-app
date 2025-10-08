'use client';

import { useState, useEffect } from 'react';
import { itemsService } from '@/lib/api';
import { Item, CreateItemDto } from '@/types/item';
import ItemFormModal from '@/components/ItemFormModal';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import {
  Package,
  Edit,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function ProductosPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PRODUCTO' | 'SERVICIO'>(
    'ALL'
  );
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemName: string;
  }>({
    isOpen: false,
    itemId: null,
    itemName: '',
  });

  // Cargar items al montar el componente
  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, showDeleted]);

  // Filtrar items cuando cambia el término de búsqueda o el filtro
  useEffect(() => {
    // Asegurarse de que items es un array
    if (!Array.isArray(items)) {
      console.warn('⚠️ items no es un array:', items);
      setFilteredItems([]);
      return;
    }

    let filtered = items;

    // Filtrar por tipo
    if (filterType !== 'ALL') {
      filtered = filtered.filter((item) => item.itemType === filterType);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, filterType]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await itemsService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        withDeleted: showDeleted,
      });
      console.log('📦 Datos recibidos de la API:', response);

      // La API devuelve {data: [], total, page, limit}
      const itemsArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setItems(itemsArray);
      setTotalItems(response?.total || 0);
      setTotalPages(Math.ceil((response?.total || 0) / itemsPerPage));
    } catch (err: any) {
      console.error('Error al cargar items:', err);
      setError('Error al cargar los items. Por favor, intenta de nuevo.');
      setItems([]); // Asegurar que items sea un array vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreate = async (data: CreateItemDto) => {
    await itemsService.create(data);
    setCurrentPage(1); // Volver a la primera página
    await loadItems();
    setIsModalOpen(false);
    setToast({
      message: '¡Item creado exitosamente!',
      type: 'success',
    });
  };

  const handleUpdate = async (data: CreateItemDto) => {
    if (editingItem) {
      await itemsService.update(editingItem.id, data);
      await loadItems();
      setIsModalOpen(false);
      setEditingItem(null);
      setToast({
        message: '¡Item actualizado exitosamente!',
        type: 'success',
      });
    }
  };

  const handleDeleteClick = (item: Item) => {
    setConfirmDialog({
      isOpen: true,
      itemId: item.id,
      itemName: item.name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (confirmDialog.itemId) {
      try {
        await itemsService.delete(confirmDialog.itemId);
        await loadItems();
        setToast({
          message: '¡Item eliminado exitosamente!',
          type: 'success',
        });
      } catch (err: any) {
        console.error('Error al eliminar:', err);
        setToast({
          message: 'Error al eliminar el item. Por favor, intenta de nuevo.',
          type: 'error',
        });
      } finally {
        setConfirmDialog({
          isOpen: false,
          itemId: null,
          itemName: '',
        });
      }
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDialog({
      isOpen: false,
      itemId: null,
      itemName: '',
    });
  };

  const handleReactivate = async (item: Item) => {
    try {
      await itemsService.reactivate(item.id);
      await loadItems();
      setToast({
        message: '¡Item reactivado exitosamente!',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error al reactivar:', err);
      setToast({
        message: 'Error al reactivar el item. Por favor, intenta de nuevo.',
        type: 'error',
      });
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Productos y Servicios
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu catálogo de productos y servicios
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo Item</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as 'ALL' | 'PRODUCTO' | 'SERVICIO')
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">Todos</option>
            <option value="PRODUCTO">Productos</option>
            <option value="SERVICIO">Servicios</option>
          </select>

          {/* Toggle para mostrar eliminados */}
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setCurrentPage(1); // Reset to first page
              }}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Mostrar eliminados</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Cargando items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No hay items para mostrar
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterType !== 'ALL'
              ? 'No se encontraron items con los filtros aplicados'
              : 'Comienza agregando tu primer producto o servicio'}
          </p>
          {!searchTerm && filterType === 'ALL' && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Item
            </button>
          )}
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(filteredItems) &&
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
                  !item.isActive ? 'opacity-60 border-2 border-gray-300' : ''
                }`}
              >
                {/* Badge de tipo y estado */}
                <div className="px-4 pt-4 flex gap-2 flex-wrap">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      item.itemType === 'PRODUCTO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {item.itemType}
                  </span>
                  {!item.isActive && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      INACTIVO
                    </span>
                  )}
                  {item.deletedAt && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      ELIMINADO
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Código: {item.code}
                  </p>
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div
                    className={`flex items-center justify-between ${
                      !item.description ? 'mt-4' : ''
                    }`}
                  >
                    <span className="text-2xl font-bold text-primary-600">
                      ${item.price.toLocaleString('es-CO')}
                    </span>
                    <div className="flex gap-2">
                      {!item.isActive ? (
                        <button
                          onClick={() => handleReactivate(item)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Reactivar"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
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
            setCurrentPage(1); // Reset to first page when changing items per page
          }}
        />
      )}

      {/* Modal de formulario */}
      <ItemFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdate : handleCreate}
        item={editingItem}
        title={editingItem ? 'Editar Item' : 'Nuevo Item'}
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
        message={`¿Estás seguro de que deseas eliminar "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
}
