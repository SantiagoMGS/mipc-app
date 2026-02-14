import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceOrderPhotosService } from '@/lib/api';
import {
  PhotoCategory,
  ServiceOrderPhotosResponse,
} from '@/types/service-order-photo';
import { useToast } from './use-toast';

// ==================== QUERY KEYS ====================
export const serviceOrderPhotoKeys = {
  all: ['serviceOrderPhotos'] as const,
  byOrder: (serviceOrderId: string) =>
    [...serviceOrderPhotoKeys.all, serviceOrderId] as const,
};

// ==================== QUERIES ====================

/**
 * Hook para obtener fotos de una orden de servicio (agrupadas antes/después)
 */
export function useServiceOrderPhotos(serviceOrderId: string) {
  return useQuery<ServiceOrderPhotosResponse>({
    queryKey: serviceOrderPhotoKeys.byOrder(serviceOrderId),
    queryFn: () => serviceOrderPhotosService.getPhotos(serviceOrderId),
    enabled: !!serviceOrderId,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para subir una foto
 */
export function useUploadPhoto(serviceOrderId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      file,
      category,
      caption,
    }: {
      file: File;
      category: PhotoCategory;
      caption?: string;
    }) =>
      serviceOrderPhotosService.uploadPhoto(
        serviceOrderId,
        file,
        category,
        caption
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceOrderPhotoKeys.byOrder(serviceOrderId),
      });
      toast({
        title: 'Éxito',
        description: 'Foto subida exitosamente',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al subir la foto';
      toast({
        title: 'Error',
        description: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para subir múltiples fotos
 */
export function useUploadMultiplePhotos(serviceOrderId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      files,
      category,
      caption,
    }: {
      files: File[];
      category: PhotoCategory;
      caption?: string;
    }) =>
      serviceOrderPhotosService.uploadMultiplePhotos(
        serviceOrderId,
        files,
        category,
        caption
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: serviceOrderPhotoKeys.byOrder(serviceOrderId),
      });
      toast({
        title: 'Éxito',
        description: `${data.length} foto(s) subida(s) exitosamente`,
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al subir las fotos';
      toast({
        title: 'Error',
        description: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para eliminar una foto
 */
export function useDeletePhoto(serviceOrderId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (photoId: string) =>
      serviceOrderPhotosService.deletePhoto(serviceOrderId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceOrderPhotoKeys.byOrder(serviceOrderId),
      });
      toast({
        title: 'Éxito',
        description: 'Foto eliminada exitosamente',
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al eliminar la foto';
      toast({
        title: 'Error',
        description: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        variant: 'destructive',
      });
    },
  });
}
