import { useState, useEffect } from 'react';
import { serviceOrderItemsService } from '@/lib/api';
import { ServiceOrderItem, AddItemToOrderDto, UpdateOrderItemDto } from '@/types/item';
import { ServiceOrder } from '@/types/service-order';
import { useToast } from '@/hooks/use-toast';

export function useOrderItems(orderId: string) {
  const [items, setItems] = useState<ServiceOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await serviceOrderItemsService.getOrderItems(orderId);
      setItems(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Error al cargar los items';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error fetching order items:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (
    data: AddItemToOrderDto
  ): Promise<ServiceOrder | null> => {
    setLoading(true);
    setError(null);

    try {
      // El backend retorna la orden actualizada con los nuevos costos
      const updatedOrder = await serviceOrderItemsService.addItem(
        orderId,
        data
      );
      toast({
        title: 'Éxito',
        description: 'Item agregado correctamente',
      });

      // Refrescar la lista de items
      await fetchItems();

      return updatedOrder;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Error al agregar el item';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error adding item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string): Promise<ServiceOrder | null> => {
    setLoading(true);
    setError(null);

    try {
      // El backend retorna la orden actualizada con los nuevos costos
      const updatedOrder = await serviceOrderItemsService.removeItem(
        orderId,
        itemId
      );
      toast({
        title: 'Éxito',
        description: 'Item eliminado correctamente',
      });

      // Refrescar la lista de items
      await fetchItems();

      return updatedOrder;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Error al eliminar el item';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error removing item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (
    itemId: string,
    data: UpdateOrderItemDto
  ): Promise<ServiceOrder | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedOrder = await serviceOrderItemsService.updateItem(
        orderId,
        itemId,
        data
      );
      toast({
        title: 'Éxito',
        description: 'Item actualizado correctamente',
      });

      await fetchItems();

      return updatedOrder;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Error al actualizar el item';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error updating item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [orderId]);

  return {
    items,
    loading,
    error,
    addItem,
    removeItem,
    updateItem,
    refetch: fetchItems,
  };
}
