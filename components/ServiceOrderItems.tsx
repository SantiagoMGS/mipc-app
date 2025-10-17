'use client';

import { useState } from 'react';
import { useOrderItems } from '@/hooks/useOrderItems';
import { AddItemDialog } from './AddItemDialog';
import { AddItemToOrderDto } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Lock } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { ServiceOrderStatus } from '@/types/service-order';

interface ServiceOrderItemsProps {
  orderId: string;
  onOrderUpdate?: () => void;
  readOnly?: boolean;
  orderStatus?: ServiceOrderStatus; // Opcional: para mostrar mensaje específico
}

export function ServiceOrderItems({
  orderId,
  onOrderUpdate,
  readOnly = false,
  orderStatus,
}: ServiceOrderItemsProps) {
  const { items, loading, addItem, removeItem } = useOrderItems(orderId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Mensajes según el estado
  const getReadOnlyMessage = () => {
    if (!readOnly || !orderStatus) return null;

    const messages: Record<string, string> = {
      FACTURADO: 'No se pueden modificar items en órdenes facturadas',
      CANCELADO: 'No se pueden modificar items en órdenes canceladas',
      NO_REPARABLE: 'No se pueden modificar items en órdenes no reparables',
      COMPLETO: 'No se pueden modificar items en órdenes completadas',
    };

    return (
      messages[orderStatus] || 'No se pueden modificar items en esta orden'
    );
  };

  const handleAddItem = async (data: AddItemToOrderDto) => {
    const result = await addItem(data);
    if (result) {
      setDialogOpen(false);
      onOrderUpdate?.(); // Refrescar la orden completa para actualizar costos
    }
  };

  const handleRemoveClick = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (itemToDelete) {
      const result = await removeItem(itemToDelete);
      if (result) {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        onOrderUpdate?.(); // Refrescar la orden completa para actualizar costos
      }
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Items de la Orden
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Productos y servicios incluidos en esta orden
                </p>
              </div>
              {!readOnly && (
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Agregar Item</span>
                </Button>
              )}
            </div>

            {/* Mensaje informativo cuando está en readOnly */}
            {readOnly && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {getReadOnlyMessage()}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando items...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay items en esta orden
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Descuento</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      {!readOnly && (
                        <TableHead className="w-[50px]"></TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((orderItem) => (
                      <TableRow key={orderItem.id}>
                        <TableCell className="font-medium">
                          {orderItem.item.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {orderItem.item.code}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              orderItem.item.itemType === 'SERVICIO'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {orderItem.item.itemType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {orderItem.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(orderItem.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right">
                          {orderItem.discount !== '0'
                            ? formatCurrency(Number(orderItem.discount))
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(orderItem.subtotal))}
                        </TableCell>
                        {!readOnly && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveClick(orderItem.id)}
                              title="Eliminar item"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de cards para móvil */}
              <div className="md:hidden space-y-3">
                {items.map((orderItem) => (
                  <div
                    key={orderItem.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {orderItem.item.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Código: {orderItem.item.code}
                        </p>
                      </div>
                      <Badge
                        variant={
                          orderItem.item.itemType === 'SERVICIO'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {orderItem.item.itemType}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cantidad:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">
                          {orderItem.quantity}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Precio Unit.:
                        </span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(Number(orderItem.unitPrice))}
                        </span>
                      </div>
                      {orderItem.discount !== '0' && (
                        <div>
                          <span className="text-muted-foreground">
                            Descuento:
                          </span>
                          <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(Number(orderItem.discount))}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Subtotal:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                          {formatCurrency(Number(orderItem.subtotal))}
                        </span>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveClick(orderItem.id)}
                            title="Eliminar item"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAddItem}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onConfirm={handleConfirmRemove}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
        title="Eliminar Item"
        message="¿Estás seguro de que deseas eliminar este item de la orden? Esta acción actualizará los costos totales."
        type="warning"
      />
    </>
  );
}
