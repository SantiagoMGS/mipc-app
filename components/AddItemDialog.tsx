'use client';

import { useState, useEffect } from 'react';
import { Item, AddItemToOrderDto } from '@/types/item';
import { itemsService } from '@/lib/api';
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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar items cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadItems();
    } else {
      // Reset cuando se cierra
      setSelected(null);
      setQuantity(1);
      setUnitPrice(0);
      setDiscount(0);
      setSearchQuery('');
    }
  }, [open]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await itemsService.getAll({ withDeleted: false });
      // Filtrar solo items activos
      const activeItems = response.data.filter((item: Item) => item.isActive);
      setItems(activeItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

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
      });
      onClose();
    } catch (error) {
      console.error('Error submitting item:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar items basado en la búsqueda
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      item.name.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.itemType.toLowerCase().includes(query)
    );
  });

  const subtotal = quantity * unitPrice - discount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Agregar Item a la Orden</DialogTitle>
          <DialogDescription>
            Selecciona un producto o servicio del catálogo
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
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
                placeholder="Buscar por nombre, código, descripción o tipo..."
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
                  ({filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''})
                </span>
              )}
            </Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors',
                        selected?.id === item.id &&
                          'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.name}</span>
                            <Badge
                              variant={
                                item.itemType === 'SERVICIO'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {item.itemType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Código: {item.code}
                          </p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredItems.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? 'No se encontraron items que coincidan con la búsqueda'
                        : 'No hay items disponibles'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Formulario de cantidad y precio */}
          {selected && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value)))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Precio Unitario</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="100"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Descuento</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Subtotal:</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selected || quantity <= 0 || submitting}
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
