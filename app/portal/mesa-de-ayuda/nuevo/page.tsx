'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PortalShell, { PortalLoading } from '@/components/portal/PortalShell';
import PriorityPicker from '@/components/portal/PriorityPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SELECT_CLASS,
  TEXTAREA_CLASS,
} from '@/components/helpdesk/field-styles';
import { usePortalSession } from '@/hooks/usePortalSession';
import {
  useCreatePortalTicket,
  usePortalHelpdeskContext,
} from '@/hooks/usePortalTickets';
import { PriorityLevel } from '@/types/helpdesk';

const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/** Mismas reglas que la API, para avisar antes de enviar */
function filesError(files: File[]): string | null {
  if (files.length > MAX_FILES) return 'Puedes adjuntar hasta 3 imágenes.';
  if (files.some((f) => f.type && !ACCEPTED.includes(f.type))) {
    return 'Solo se aceptan imágenes JPG, PNG, WebP o HEIC.';
  }
  if (files.some((f) => f.size > MAX_BYTES)) {
    return 'Cada imagen puede pesar hasta 10 MB.';
  }
  return null;
}

export default function NewPortalTicketPage() {
  const router = useRouter();
  const { session } = usePortalSession();
  const { data: context, isLoading } = usePortalHelpdeskContext(!!session);
  const createTicket = useCreatePortalTicket();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [deviceId, setDeviceId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileProblem = filesError(files);

  if (!session || isLoading) return <PortalLoading />;

  return (
    <PortalShell session={session}>
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/portal/mesa-de-ayuda"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Mesa de ayuda
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nuevo ticket
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Cuéntanos qué pasa. Te respondemos por WhatsApp y aquí queda el
            registro.
          </p>
        </div>

        {!context?.hasActiveContract ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Tu empresa no tiene un contrato de mesa de ayuda activo.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (fileProblem) return;
              createTicket.mutate(
                {
                  data: {
                    subject: subject.trim(),
                    description: description.trim(),
                    priority,
                    deviceId: deviceId || undefined,
                  },
                  files,
                },
                {
                  onSuccess: (ticket) =>
                    router.push(`/portal/mesa-de-ayuda/${ticket.id}`),
                }
              );
            }}
            className="space-y-5"
          >
            <div className="space-y-1">
              <Label htmlFor="portal-ticket-subject">Asunto</Label>
              <Input
                id="portal-ticket-subject"
                required
                maxLength={150}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Por ejemplo: no hay internet en recepción"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="portal-ticket-description">Descripción</Label>
              <textarea
                id="portal-ticket-description"
                required
                rows={5}
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={TEXTAREA_CLASS}
                placeholder="Qué pasa, desde cuándo y a quién afecta."
              />
            </div>

            <PriorityPicker
              priorities={context.priorities}
              value={priority}
              onChange={setPriority}
            />

            {context.devices.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="portal-ticket-device">Equipo (opcional)</Label>
                <select
                  id="portal-ticket-device"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">No sé o no aplica</option>
                  {context.devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="portal-ticket-files">Capturas (opcional)</Label>
              <input
                id="portal-ticket-files"
                type="file"
                multiple
                accept={ACCEPTED.join(',')}
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-white"
              />
              <p
                className={`text-xs ${fileProblem ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {fileProblem ?? 'Hasta 3 imágenes de 10 MB cada una.'}
              </p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={createTicket.isPending || !!fileProblem}
            >
              {createTicket.isPending && <Loader2 className="animate-spin" />}
              Enviar ticket
            </Button>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
