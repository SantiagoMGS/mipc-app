'use client';

import { useState, useEffect } from 'react';
import { Item, AddItemToOrderDto } from '@/types/item';
import { useItems } from '@/hooks/useItems';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, cn } from '@/lib/utils';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddItemToOrderDto) => Promise<void>;
}

export function AddItemDialog({ open, onClose, onSubmit }: AddItemDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [observation, setObservation] = useState('');
  const [hasIva, setHasIva] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Cargar items con búsqueda en el backend
  const { data, isLoading } = useItems({
    withDeleted: false,
    search: debouncedSearch || undefined,
    limit: 50, // Traer más items para el modal
  });

  const items = data?.items || [];
  const totalItems = data?.total || 0;

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQuantity(1);
      setUnitPrice(0);
      setDiscount(0);
      setObservation('');
      setHasIva(false);
      setSearchQuery('');
    }
  }, [open]);

  const handleSelectItem = (item: Item) => {
    setSelected(item);
    setUnitPrice(item.price);
    setDiscount(0);
  };

  const handleSubmit = async () => {
    if (!selected || quantity <= 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        itemId: selected.id,
        quantity,
        unitPrice,
        discount,
        observation: observation.trim() || undefined,
        hasIva,
      });
      onClose();
    } catch (error) {
      console.error('Error submitting item:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = quantity * unitPrice - discount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Agregar Item a la Orden</DialogTitle>
          <DialogDescription>
            Selecciona un producto o servicio del catálogo
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-1">
          <div className="grid gap-4 pr-3">
            {/* Buscador */}
            <div>
              <Label htmlFor="search" className="mb-2 block">
                Buscar Item
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Buscar por nombre, código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Lista de items */}
            <div>
              <Label className="mb-2 block">
                Seleccionar Item del Catálogo
                {searchQuery && (
                  <span className="text-muted-foreground text-sm ml-2">
                    ({totalItems} resultado
                    {totalItems !== 1 ? 's' : ''})
                  </span>
                )}
              </Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="h-[180px] border border-gray-200 dark:border-gray-700 rounded-md p-2 overflow-y-auto">
                  <div className="space-y-2">
                    {items.map((item: Item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={cn(
                          'p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-accent transition-colors',
                          selected?.id === item.id &&
                            'border-primary bg-primary/5 dark:bg-primary/10'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </span>
                              <Badge
                                variant={
                                  item.itemType === 'SERVICIO'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="flex-shrink-0"
                              >
                                {item.itemType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Código: {item.code}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-sm whitespace-nowrap text-gray-900 dark:text-white flex-shrink-0">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && !isLoading && (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? 'No se encontraron items'
                          : 'No hay items disponibles'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Formulario de cantidad y precio */}
            {selected && (
              <div className="space-y-3 border-t pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="quantity" className="text-sm">
                      Cantidad
                    </Label>
                    <Input
                      id="quantity"
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
                    <Label htmlFor="unitPrice" className="text-sm">
                      Precio Unit.
                    </Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="100"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount" className="text-sm">
                      Descuento
                    </Label>
                    <Input
                      id="discount"
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
                    <Label htmlFor="observation" className="text-sm">
                      Observación
                    </Label>
                    <Input
                      id="observation"
                      type="text"
                      placeholder="Observación del item (opcional)"
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end">
                    <label
                      htmlFor="hasIva"
                      className="flex items-center gap-2 cursor-pointer h-9 px-3 border border-gray-200 dark:border-gray-700 rounded-md w-full"
                    >
                      <input
                        id="hasIva"
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
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 mt-4 gap-2 sm:gap-0">
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
            disabled={!selected || quantity <= 0 || submitting}
            className="flex-1 sm:flex-initial"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              'Agregar Item'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
