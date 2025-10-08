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
