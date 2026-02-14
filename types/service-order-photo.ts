export type PhotoCategory = 'ANTES' | 'DESPUES';

export interface ServiceOrderPhoto {
  id: string;
  serviceOrderId: string;
  category: PhotoCategory;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  caption?: string;
  url: string;
  createdAt: string;
}

export interface ServiceOrderPhotosResponse {
  before: ServiceOrderPhoto[];
  after: ServiceOrderPhoto[];
}
