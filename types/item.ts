// Tipos para productos
export interface Item {
  id: string;
  name: string;
  code: string;
  price: number;
  description?: string;
  itemType: 'PRODUCTO' | 'SERVICIO';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ServiceOrderItem {
  id: string; // ID del registro en service_order_items (usar para eliminar)
  quantity: number;
  unitPrice: string; // Decimal como string
  discount: string;
  subtotal: string;
  observation: string | null;
  hasIva: boolean;
  item: Item;
}

export interface AddItemToOrderDto {
  itemId: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  observation?: string;
  hasIva?: boolean;
}

export interface UpdateOrderItemDto {
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  observation?: string;
  hasIva?: boolean;
}

export interface CreateItemDto {
  name: string;
  code: string;
  price: number;
  description?: string;
  itemType: 'PRODUCTO' | 'SERVICIO';
}

export interface UpdateItemDto {
  name?: string;
  code?: string;
  price?: number;
  description?: string;
  itemType?: 'PRODUCTO' | 'SERVICIO';
}
