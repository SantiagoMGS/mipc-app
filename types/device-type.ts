export interface DeviceType {
  id: string;
  name: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeviceTypeDto {
  name: string;
}

export interface UpdateDeviceTypeDto {
  name?: string;
}
