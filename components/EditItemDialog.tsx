'use client';

import { useState, useEffect } from 'react';
import { ServiceOrderItem, UpdateOrderItemDto } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface EditItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, data: UpdateOrderItemDto) => Promise<void>;
  orderItem: ServiceOrderItem | null;
}

export function EditItemDialog({
  open,
  onClose,
  onSubmit,
  orderItem,
}: EditItemDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [observation, setObservation] = useState('');
  const [hasIva, setHasIva] = useState(false);

  // Cargar los valores del item cuando se abre el diálogo
  useEffect(() => {
    if (orderItem && open) {
      setQuantity(orderItem.quantity);
      setUnitPrice(Number(orderItem.unitPrice));
      setDiscount(Number(orderItem.discount));
      setObservation(orderItem.observation || '');
      setHasIva(orderItem.hasIva);
    }
  }, [orderItem, open]);

  const handleSubmit = async () => {
    if (!orderItem || quantity <= 0) return;

    setSubmitting(true);
    try {
      await onSubmit(orderItem.id, {
        quantity,
        unitPrice,
        discount,
        observation: observation.trim() || undefined,
        hasIva,
      });
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = quantity * unitPrice - discount;

  if (!orderItem) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Item de la Orden</DialogTitle>
          <DialogDescription>
            Modifica los valores del item seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Info del item (solo lectura) */}
          <div className="bg-muted dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {orderItem.item.name}
                  </span>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Código: {orderItem.item.code}
                </p>
              </div>
            </div>
          </div>

          {/* Campos editables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="edit-quantity" className="text-sm">
                Cantidad
              </Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="edit-unitPrice" className="text-sm">
                Precio Unit.
              </Label>
              <Input
                id="edit-unitPrice"
                type="number"
                min="0"
                step="100"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="edit-discount" className="text-sm">
                Descuento
              </Label>
              <Input
                id="edit-discount"
                type="number"
                min="0"
                step="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-observation" className="text-sm">
                Observación
              </Label>
              <Input
                id="edit-observation"
                type="text"
                placeholder="Observación del item (opcional)"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-end">
              <label
                htmlFor="edit-hasIva"
                className="flex items-center gap-2 cursor-pointer h-9 px-3 border border-gray-200 dark:border-gray-700 rounded-md w-full"
              >
                <input
                  id="edit-hasIva"
                  type="checkbox"
                  checked={hasIva}
                  onChange={(e) => setHasIva(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Incluye IVA</span>
              </label>
            </div>
          </div>

          <div className="bg-muted dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                Subtotal:
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 sm:flex-initial"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={quantity <= 0 || submitting}
            className="flex-1 sm:flex-initial"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
