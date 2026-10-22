'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileImage } from 'lucide-react';
import { TicketAttachment } from '@/types/helpdesk';

interface AttachmentThumbProps {
  attachment: TicketAttachment;
  /** Descarga el archivo con la sesión de quien mira */
  load: () => Promise<Blob>;
}

/** Captura de un ticket; nunca es pública, se baja con la sesión */
export default function AttachmentThumb({
  attachment,
  load,
}: AttachmentThumbProps) {
  const { data: blob } = useQuery({
    queryKey: ['ticket-attachment', attachment.id],
    queryFn: load,
    staleTime: Infinity,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  // Los navegadores no muestran HEIC: se ofrece para descargar
  const previewable = !/hei[cf]/.test(attachment.mimeType);
  return (
    <li>
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        download={previewable ? undefined : attachment.originalName}
        className="block w-28 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 hover:border-primary-500"
      >
        {url && previewable ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={attachment.originalName}
            className="h-20 w-28 object-cover"
          />
        ) : (
          <span className="flex h-20 w-28 items-center justify-center bg-gray-50 dark:bg-gray-900">
            <FileImage className="w-6 h-6 text-gray-400" aria-hidden />
          </span>
        )}
        <span className="block truncate px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
          {attachment.originalName}
        </span>
      </a>
    </li>
  );
}
