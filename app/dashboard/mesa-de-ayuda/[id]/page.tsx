'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageCircle, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import AttachmentThumb from '@/components/helpdesk/AttachmentThumb';
import PriorityBadge from '@/components/helpdesk/PriorityBadge';
import TicketStatusBadge from '@/components/helpdesk/TicketStatusBadge';
import ResponseIndicator from '@/components/helpdesk/ResponseIndicator';
import TakeTicketDialog from '@/components/helpdesk/TakeTicketDialog';
import ResolveTicketDialog, {
  ResolveValues,
} from '@/components/helpdesk/ResolveTicketDialog';
import {
  SELECT_CLASS,
  TEXTAREA_CLASS,
} from '@/components/helpdesk/field-styles';
import { useStaffTicket, useTicketAction } from '@/hooks/useHelpdeskTickets';
import { useTechnicians } from '@/hooks/useAuxiliary';
import { helpdeskService } from '@/lib/api';
import { getCurrentUserId, getCurrentUserRole } from '@/lib/auth-utils';
import {
  customerName,
  formatBogotaDateTime,
  formatMinutes,
} from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import {
  PRIORITY_LABELS,
  PriorityLevel,
  StaffTicketDetail,
  TicketEvent,
} from '@/types/helpdesk';

const SECTION =
  'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 space-y-4';
const SECTION_TITLE = 'text-lg font-semibold text-gray-900 dark:text-white';

/** Qué pasó, en palabras del panel */
function describeEvent(event: TicketEvent): { title: string; detail?: string } {
  const data = (event.data ?? {}) as Record<string, any>;
  switch (event.type) {
    case 'CREATED':
      return {
        title: 'Creado',
        detail: event.actorPortalUser ? 'Desde el portal' : undefined,
      };
    case 'TAKEN':
      return { title: 'Tomado' };
    case 'ASSIGNED':
      return { title: 'Reasignado' };
    case 'PRIORITY_CHANGED':
      return {
        title: 'Prioridad cambiada',
        detail: `${PRIORITY_LABELS[data.from as PriorityLevel]} → ${PRIORITY_LABELS[data.to as PriorityLevel]}`,
      };
    case 'TIMES_CHANGED':
      return {
        title:
          data.field === 'resolvedAt'
            ? 'Hora de solución corregida'
            : 'Hora de respuesta corregida',
        detail: data.to ? formatBogotaDateTime(data.to) : undefined,
      };
    case 'RESOLVED':
      return {
        title: 'Resuelto',
        detail: data.billableMinutes
          ? formatMinutes(data.billableMinutes)
          : undefined,
      };
    case 'REOPENED':
      return { title: 'Reabierto' };
    case 'CANCELLED':
      return { title: 'Cancelado', detail: data.reason };
    case 'BILLING_CHANGED':
      if (data.field === 'isBillable') {
        return {
          title: data.to
            ? 'Marcado como facturable'
            : 'Marcado como no facturable',
        };
      }
      return {
        title: 'Tiempo corregido',
        detail: `${formatMinutes(data.from)} → ${formatMinutes(data.to)}`,
      };
    default:
      return { title: 'Cambio de estado' };
  }
}

function DataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="text-sm text-gray-900 dark:text-white break-words">
        {children}
      </dd>
    </div>
  );
}

function deviceText(ticket: StaffTicketDetail): string {
  const d = ticket.device;
  if (!d) return 'Sin equipo';
  const name = [d.deviceType.name, d.brand, d.model].filter(Boolean).join(' ');
  return [name, d.deviceUser, d.serial].filter(Boolean).join(' · ');
}

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: ticket, isLoading, error } = useStaffTicket(id);
  const action = useTicketAction(id);
  const { data: technicians = [] } = useTechnicians();
  const role = getCurrentUserRole();
  const canManage = role === 'ADMIN' || role === 'TECNICO';

  const [dialog, setDialog] = useState<
    'take' | 'resolve' | 'edit' | 'reopen' | 'cancel' | null
  >(null);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }
  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/mesa-de-ayuda"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Mesa de ayuda
        </Link>
        <p className="text-gray-700 dark:text-gray-300">
          No se encontró el ticket.
        </p>
      </div>
    );
  }

  const run = (
    payload: Parameters<typeof action.mutate>[0],
    after?: () => void
  ) =>
    action.mutate(payload, {
      onSuccess: () => {
        setDialog(null);
        after?.();
      },
    });

  const open = ticket.status === 'ABIERTO' || ticket.status === 'EN_ATENCION';
  // Tomar lo que ya es mío no cambia nada
  const canTake = open && ticket.assignedTechnicianId !== getCurrentUserId();
  const resolved = ticket.status === 'RESUELTO';

  const onResolve = (values: ResolveValues) =>
    run({
      type: 'resolve',
      data: {
        billableMinutes: values.billableMinutes,
        resolutionNote: values.resolutionNote,
        resolvedAt: values.resolvedAt,
      },
    });

  // Solo se envía lo que cambió
  const onEdit = (values: ResolveValues) =>
    run({
      type: 'update',
      data: {
        billableMinutes:
          values.billableMinutes !== ticket.billableMinutes
            ? values.billableMinutes
            : undefined,
        resolutionNote:
          values.resolutionNote !== ticket.resolutionNote
            ? values.resolutionNote
            : undefined,
        resolvedAt: values.resolvedAt,
        firstResponseAt: values.firstResponseAt,
      },
    });

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mesa-de-ayuda"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Mesa de ayuda
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">
            {ticket.number}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
            {ticket.subject}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <ResponseIndicator ticket={ticket} />
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            {canTake && (
              <Button
                variant={ticket.status === 'ABIERTO' ? 'default' : 'outline'}
                onClick={() => setDialog('take')}
              >
                Tomar
              </Button>
            )}
            {ticket.status === 'EN_ATENCION' && (
              <Button onClick={() => setDialog('resolve')}>Resolver</Button>
            )}
            {resolved && (
              <>
                <Button variant="outline" onClick={() => setDialog('edit')}>
                  Corregir registro
                </Button>
                <Button variant="outline" onClick={() => setDialog('reopen')}>
                  Reabrir
                </Button>
              </>
            )}
            {open && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCancelReason('');
                  setDialog('cancel');
                }}
              >
                Cancelar ticket
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 min-w-0">
          <section aria-labelledby="ticket-request" className={SECTION}>
            <h2 id="ticket-request" className={SECTION_TITLE}>
              Solicitud
            </h2>
            <p className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">
              {ticket.description}
            </p>
            {ticket.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Paperclip className="w-4 h-4" aria-hidden />
                  Capturas
                </p>
                <ul className="flex flex-wrap gap-3">
                  {ticket.attachments.map((attachment) => (
                    <AttachmentThumb
                      key={attachment.id}
                      attachment={attachment}
                      load={() =>
                        helpdeskService.getAttachmentBlob(
                          ticket.id,
                          attachment.id
                        )
                      }
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>

          {(resolved || ticket.status === 'CANCELADO') && (
            <section aria-labelledby="ticket-solution" className={SECTION}>
              <h2 id="ticket-solution" className={SECTION_TITLE}>
                {resolved ? 'Solución' : 'Cancelación'}
              </h2>
              {resolved ? (
                <>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <DataRow label="Tiempo">
                      {ticket.billableMinutes
                        ? formatMinutes(ticket.billableMinutes)
                        : '—'}
                    </DataRow>
                    <DataRow label="Resuelto">
                      {ticket.resolvedAt
                        ? formatBogotaDateTime(ticket.resolvedAt)
                        : '—'}
                    </DataRow>
                    <DataRow label="Mes de cobro">
                      {ticket.billingMonth ?? '—'}
                    </DataRow>
                  </dl>
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">
                    {ticket.resolutionNote}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {ticket.cancelReason}
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="ticket-history" className={SECTION}>
            <h2 id="ticket-history" className={SECTION_TITLE}>
              Historial
            </h2>
            <ol className="space-y-3 border-l border-gray-200 dark:border-gray-700 pl-4">
              {ticket.events.map((event) => {
                const { title, detail } = describeEvent(event);
                const actor =
                  event.actorUser?.name ?? event.actorPortalUser?.name;
                return (
                  <li key={event.id} className="relative">
                    <span
                      className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-primary-500"
                      aria-hidden
                    />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {title}
                    </p>
                    {detail && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                        {detail}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatBogotaDateTime(event.createdAt)}
                      {actor && ` · ${actor}`}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <section aria-labelledby="ticket-data" className={`${SECTION} h-fit`}>
          <h2 id="ticket-data" className={SECTION_TITLE}>
            Datos
          </h2>
          <dl className="space-y-4">
            <DataRow label="Empresa">{customerName(ticket.customer)}</DataRow>
            <DataRow label="Solicitante">
              <span className="block">{ticket.requester.name}</span>
              <span className="block text-gray-600 dark:text-gray-400">
                {ticket.requester.email}
              </span>
              <a
                href={whatsappLink(ticket.requester.phone)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-medium text-green-700 hover:underline dark:text-green-400"
              >
                <MessageCircle className="w-4 h-4" aria-hidden />
                Escribir por WhatsApp ({ticket.requester.phone})
              </a>
            </DataRow>
            <DataRow label="Equipo">{deviceText(ticket)}</DataRow>
            <DataRow label="Recibido">
              {formatBogotaDateTime(ticket.receivedAt)}
            </DataRow>
            <DataRow label="Vence la respuesta">
              {formatBogotaDateTime(ticket.responseDueAt)}
            </DataRow>
            <DataRow label="Respondido">
              {ticket.firstResponseAt
                ? formatBogotaDateTime(ticket.firstResponseAt)
                : 'Aún no'}
            </DataRow>
            {ticket.createdByStaff && (
              <DataRow label="Registrado por">
                {ticket.createdByStaff.name}
              </DataRow>
            )}
          </dl>

          {canManage && ticket.status !== 'CANCELADO' ? (
            <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="space-y-1">
                <Label htmlFor="ticket-priority">Prioridad</Label>
                <select
                  id="ticket-priority"
                  value={ticket.priority}
                  disabled={action.isPending}
                  onChange={(e) =>
                    run({
                      type: 'update',
                      data: { priority: e.target.value as PriorityLevel },
                    })
                  }
                  className={SELECT_CLASS}
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Al cambiarla se recalcula el vencimiento.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ticket-technician">Técnico</Label>
                <select
                  id="ticket-technician"
                  value={ticket.assignedTechnicianId ?? ''}
                  disabled={action.isPending}
                  onChange={(e) =>
                    e.target.value &&
                    run({
                      type: 'update',
                      data: { assignedTechnicianId: e.target.value },
                    })
                  }
                  className={SELECT_CLASS}
                >
                  <option value="" disabled>
                    Sin asignar
                  </option>
                  {technicians.map((tech: { id: string; name: string }) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={ticket.isBillable}
                  disabled={action.isPending}
                  onChange={(e) =>
                    run({
                      type: 'update',
                      data: { isBillable: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Descuenta de la bolsa (facturable)
              </label>
            </div>
          ) : (
            <dl className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <DataRow label="Técnico">
                {ticket.assignedTechnician?.name ?? 'Sin asignar'}
              </DataRow>
              <DataRow label="Facturable">
                {ticket.isBillable ? 'Sí' : 'No'}
              </DataRow>
            </dl>
          )}
        </section>
      </div>

      <TakeTicketDialog
        open={dialog === 'take'}
        onOpenChange={(value) => setDialog(value ? 'take' : null)}
        firstResponseAt={ticket.firstResponseAt}
        pending={action.isPending}
        onConfirm={(firstResponseAt) => run({ type: 'take', firstResponseAt })}
      />
      <ResolveTicketDialog
        open={dialog === 'resolve' || dialog === 'edit'}
        onOpenChange={(value) => !value && setDialog(null)}
        mode={dialog === 'edit' ? 'edit' : 'resolve'}
        initial={ticket}
        pending={action.isPending}
        onConfirm={dialog === 'edit' ? onEdit : onResolve}
      />
      <ConfirmDialog
        isOpen={dialog === 'reopen'}
        title="Reabrir ticket"
        message="Vuelve a “En atención” y deja de contar en el mes en que se resolvió hasta que lo resuelvas otra vez."
        confirmText="Reabrir ticket"
        type="warning"
        onConfirm={() => run({ type: 'reopen' })}
        onCancel={() => setDialog(null)}
        isConfirmDisabled={action.isPending}
      />
      <Dialog
        open={dialog === 'cancel'}
        onOpenChange={(value) => !value && setDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar ticket</DialogTitle>
            <DialogDescription>
              Un ticket cancelado no descuenta horas.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run({ type: 'cancel', reason: cancelReason.trim() });
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="cancel-reason">Motivo</Label>
              <textarea
                id="cancel-reason"
                required
                rows={3}
                maxLength={300}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={TEXTAREA_CLASS}
                placeholder="Por ejemplo: duplicado de otro ticket"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
              >
                Volver
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={action.isPending || !cancelReason.trim()}
              >
                Cancelar ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
