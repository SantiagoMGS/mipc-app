'use client';

import { useState, useRef, useCallback } from 'react';
import {
  useServiceOrderPhotos,
  useUploadPhoto,
  useDeletePhoto,
} from '@/hooks/useServiceOrderPhotos';
import { serviceOrderPhotosService } from '@/lib/api';
import { ServiceOrderPhoto, PhotoCategory } from '@/types/service-order-photo';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDialog from './ConfirmDialog';

interface ServiceOrderPhotosProps {
  orderId: string;
  readOnly?: boolean;
}

export function ServiceOrderPhotos({
  orderId,
  readOnly = false,
}: ServiceOrderPhotosProps) {
  const { data: photos, isLoading } = useServiceOrderPhotos(orderId);
  const uploadPhotoMutation = useUploadPhoto(orderId);
  const deletePhotoMutation = useDeletePhoto(orderId);

  const [previewPhoto, setPreviewPhoto] = useState<ServiceOrderPhoto | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<ServiceOrderPhoto | null>(
    null
  );

  const beforeInputRef = useRef<HTMLInputElement>(null!);
  const afterInputRef = useRef<HTMLInputElement>(null!);

  const handleFileSelect = useCallback(
    async (files: FileList | null, category: PhotoCategory) => {
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadPhotoMutation.mutateAsync({ file, category });
      }
    },
    [uploadPhotoMutation]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    await deletePhotoMutation.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deletePhotoMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-500">Cargando fotos...</span>
      </div>
    );
  }

  const beforePhotos = photos?.before || [];
  const afterPhotos = photos?.after || [];

  return (
    <div className="space-y-6">
      {/* Sección ANTES */}
      <PhotoSection
        title="Fotos - Antes"
        description="Estado del equipo al momento de recibirlo"
        category="ANTES"
        photos={beforePhotos}
        inputRef={beforeInputRef}
        onFileSelect={handleFileSelect}
        onPreview={setPreviewPhoto}
        onDelete={setDeleteConfirm}
        isUploading={uploadPhotoMutation.isPending}
        readOnly={readOnly}
      />

      {/* Sección DESPUÉS */}
      <PhotoSection
        title="Fotos - Después"
        description="Estado del equipo después de la reparación"
        category="DESPUES"
        photos={afterPhotos}
        inputRef={afterInputRef}
        onFileSelect={handleFileSelect}
        onPreview={setPreviewPhoto}
        onDelete={setDeleteConfirm}
        isUploading={uploadPhotoMutation.isPending}
        readOnly={readOnly}
      />

      {/* Modal de previsualización */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {previewPhoto?.originalName}
            </DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={serviceOrderPhotosService.getPhotoUrl(previewPhoto.url)}
                alt={previewPhoto.originalName}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
              {previewPhoto.caption && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {previewPhoto.caption}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(previewPhoto.createdAt).toLocaleString('es-CO')} •{' '}
                {(previewPhoto.size / 1024).toFixed(0)} KB
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar foto"
        message={`¿Estás seguro de que deseas eliminar la foto "${deleteConfirm?.originalName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        type="danger"
      />
    </div>
  );
}

// ==================== Sub-componente de Sección ====================

interface PhotoSectionProps {
  title: string;
  description: string;
  category: PhotoCategory;
  photos: ServiceOrderPhoto[];
  inputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (files: FileList | null, category: PhotoCategory) => void;
  onPreview: (photo: ServiceOrderPhoto) => void;
  onDelete: (photo: ServiceOrderPhoto) => void;
  isUploading: boolean;
  readOnly: boolean;
}

function PhotoSection({
  title,
  description,
  category,
  photos,
  inputRef,
  onFileSelect,
  onPreview,
  onDelete,
  isUploading,
  readOnly,
}: PhotoSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {title}
            {photos.length > 0 && (
              <span className="text-xs font-normal bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {photos.length}
              </span>
            )}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              className="hidden"
              onChange={(e) => {
                onFileSelect(e.target.files, category);
                e.target.value = '';
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Subir foto
            </Button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
          <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">No hay fotos en esta sección</p>
          {!readOnly && (
            <p className="text-xs mt-1">
              Haz clic en &quot;Subir foto&quot; para agregar
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onPreview={onPreview}
              onDelete={onDelete}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== Sub-componente de Tarjeta de Foto ====================

interface PhotoCardProps {
  photo: ServiceOrderPhoto;
  onPreview: (photo: ServiceOrderPhoto) => void;
  onDelete: (photo: ServiceOrderPhoto) => void;
  readOnly: boolean;
}

function PhotoCard({ photo, onPreview, onDelete, readOnly }: PhotoCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 aspect-square">
      {imageError ? (
        <div className="flex items-center justify-center h-full">
          <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
        </div>
      ) : (
        <img
          src={serviceOrderPhotosService.getPhotoUrl(photo.url)}
          alt={photo.originalName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* Overlay con acciones */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          onClick={() => onPreview(photo)}
          className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
          title="Ver foto"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        {!readOnly && (
          <button
            onClick={() => onDelete(photo)}
            className="p-2 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors"
            title="Eliminar foto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Caption */}
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-xs text-white truncate">{photo.caption}</p>
        </div>
      )}
    </div>
  );
}
