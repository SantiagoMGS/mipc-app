'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Paperclip } from 'lucide-react';
import PortalShell, { PortalLoading } from '@/components/portal/PortalShell';
import AttachmentThumb from '@/components/helpdesk/AttachmentThumb';
import PriorityBadge from '@/components/helpdesk/PriorityBadge';
import TicketStatusBadge from '@/components/helpdesk/TicketStatusBadge';
import { usePortalSession } from '@/hooks/usePortalSession';
import {
  usePortalHelpdeskContext,
  usePortalTicket,
} from '@/hooks/usePortalTickets';
import { portalTicketsService } from '@/lib/api';
import { mipcWhatsappLink } from '@/lib/contact';
import { formatBogotaDateTime, formatMinutes } from '@/lib/format';
import { formatTarget } from '@/lib/helpdesk-format';

const CARD = 'rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800 space-y-3';

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="text-sm text-gray-500 dark:text-gray-400 sm:w-36 sm:flex-shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-gray-900 dark:text-white break-words">
        {children}
      </dd>
    </div>
  );
}

export default function PortalTicketPage() {
  const params = useParams();
  const id = params.id as string;
  const { session } = usePortalSession();
  const { data: ticket, isLoading, error } = usePortalTicket(id, !!session);
  const { data: context } = usePortalHelpdeskContext(!!session);

  if (!session || isLoading) return <PortalLoading />;

  const back = (
    <Link
      href="/portal/mesa-de-ayuda"
      className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      <ArrowLeft className="w-4 h-4" />
      Mesa de ayuda
    </Link>
  );

  if (error || !ticket) {
    return (
      <PortalShell session={session}>
        <div className="space-y-4">
          {back}
          <p className="text-gray-700 dark:text-gray-300">
            No encontramos este ticket. Puede que sea de otra persona de tu
            empresa.
          </p>
        </div>
      </PortalShell>
    );
  }

  const target = context?.priorities.find((p) => p.level === ticket.priority);
  const resolved = ticket.status === 'RESUELTO';

  return (
    <PortalShell session={session}>
      <div className="mx-auto max-w-2xl space-y-4">
        {back}
        <div className="space-y-2">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">
            {ticket.number}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
            {ticket.subject}
          </h1>
          <div className="flex flex-wrap gap-2">
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {resolved && (
          <section aria-labelledby="portal-solution" className={CARD}>
            <h2
              id="portal-solution"
              className="font-semibold text-gray-900 dark:text-white"
            >
              Solución
            </h2>
            <p className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">
              {ticket.resolutionNote}
            </p>
            <dl className="space-y-2">
              <Row label="Tiempo descontado">
                {ticket.isBillable && ticket.billableMinutes
                  ? formatMinutes(ticket.billableMinutes)
                  : 'No descuenta horas'}
              </Row>
              {ticket.resolvedAt && (
                <Row label="Resuelto">
                  {formatBogotaDateTime(ticket.resolvedAt)}
                </Row>
              )}
            </dl>
          </section>
        )}

        <section aria-labelledby="portal-status" className={CARD}>
          <h2
            id="portal-status"
            className="font-semibold text-gray-900 dark:text-white"
          >
            Estado
          </h2>
          <dl className="space-y-2">
            {target && (
              <Row label="Prioridad">
                Respuesta en{' '}
                {formatTarget(
                  target.targetAmount,
                  target.targetUnit
                ).toLowerCase()}
              </Row>
            )}
            <Row label="Recibido">
              {formatBogotaDateTime(ticket.receivedAt)}
            </Row>
            <Row label="Respondido">
              {ticket.firstResponseAt
                ? formatBogotaDateTime(ticket.firstResponseAt)
                : 'Aún no'}
            </Row>
            <Row label="Lo atiende">
              {ticket.assignedTechnician?.name ?? 'Aún sin asignar'}
            </Row>
            <Row label="Pedido por">{ticket.requester.name}</Row>
            {ticket.status === 'CANCELADO' && (
              <Row label="Cancelado">Este ticket se canceló.</Row>
            )}
          </dl>
        </section>

        <section aria-labelledby="portal-request" className={CARD}>
          <h2
            id="portal-request"
            className="font-semibold text-gray-900 dark:text-white"
          >
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
                      portalTicketsService.getAttachmentBlob(
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

        <a
          href={mipcWhatsappLink(
            `Hola, escribo por el ticket ${ticket.number}: ${ticket.subject}`
          )}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-green-600 text-base font-medium text-white hover:bg-green-700"
        >
          <MessageCircle className="w-5 h-5" aria-hidden />
          Escribir a MiPC por WhatsApp
        </a>
      </div>
    </PortalShell>
  );
}
