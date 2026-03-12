export type StorageType = 'SSD' | 'HDD';

export interface Device {
  id: string;
  serial?: string;
  deviceUser?: string;
  description?: string;
  brand?: string;
  model?: string;
  processor?: string;
  ram?: number;
  storage?: number;
  storageType?: StorageType;
  isActive?: boolean;
  deviceTypeId?: string;
  customerId: string;
  createdAt?: string;
  updatedAt?: string;
  // Relación con deviceType
  deviceType?: {
    id: string;
    name: string;
  };
}

export interface CreateDeviceDto {
  serial?: string;
  deviceUser?: string;
  description?: string;
  brand?: string;
  model?: string;
  processor?: string;
  ram?: number;
  storage?: number;
  storageType?: StorageType;
  deviceTypeId?: string;
  customerId?: string;
}

export interface CreateDeviceForCustomerDto {
  customerId: string;
  serial?: string;
  deviceUser?: string;
  description?: string;
  brand?: string;
  model?: string;
  processor?: string;
  ram?: number;
  storage?: number;
  storageType?: StorageType;
  deviceTypeId?: string;
}

export interface UpdateDeviceDto {
  serial?: string;
  deviceUser?: string;
  description?: string;
  brand?: string;
  model?: string;
  processor?: string;
  ram?: number;
  storage?: number;
  storageType?: StorageType;
  deviceTypeId?: string;
}
