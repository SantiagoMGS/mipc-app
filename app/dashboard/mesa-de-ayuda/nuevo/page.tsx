'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TimeSelect from '@/components/helpdesk/TimeSelect';
import {
  SELECT_CLASS,
  TEXTAREA_CLASS,
} from '@/components/helpdesk/field-styles';
import {
  useActiveContracts,
  useCreateTicket,
} from '@/hooks/useHelpdeskTickets';
import { usePortalUsers } from '@/hooks/usePortalUsers';
import { useCustomerDevices } from '@/hooks/useDevices';
import { bogotaInputToIso, bogotaInputValue, customerName } from '@/lib/format';
import { formatTarget } from '@/lib/helpdesk-format';
import {
  PRIORITY_LABELS,
  PRIORITY_LEVELS,
  PriorityLevel,
} from '@/types/helpdesk';

const SECTION =
  'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 space-y-4';

/** Lo que llegó por WhatsApp o llamada, registrado a nombre de un usuario */
export default function NewTicketPage() {
  const router = useRouter();
  const createTicket = useCreateTicket();
  const { data: contracts = [], isLoading } = useActiveContracts();

  const [customerId, setCustomerId] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [deviceId, setDeviceId] = useState('');
  const [receivedAt, setReceivedAt] = useState(() => bogotaInputValue());
  const [receivedTouched, setReceivedTouched] = useState(false);
  const [alreadyResolved, setAlreadyResolved] = useState(false);
  const [firstResponseAt, setFirstResponseAt] = useState(() =>
    bogotaInputValue()
  );
  const [resolvedAt, setResolvedAt] = useState(() => bogotaInputValue());
  const [minutes, setMinutes] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const contract = contracts.find((c) => c.customerId === customerId);
  const { data: users = [] } = usePortalUsers(customerId);
  const { data: devices = [] } = useCustomerDevices(customerId);
  const activeUsers = users.filter((u) => u.isActive);
  const selectedPriority = contract?.priorities.find(
    (p) => p.level === priority
  );
  const now = bogotaInputValue();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate(
      {
        customerId,
        requesterId,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        deviceId: deviceId || undefined,
        // Ya resuelto: las tres horas salen del formulario, al minuto, para
        // que el orden recibido ≤ respuesta ≤ solución sea el que se ve
        receivedAt:
          receivedTouched || alreadyResolved
            ? bogotaInputToIso(receivedAt)
            : undefined,
        resolved:
          alreadyResolved && minutes
            ? {
                firstResponseAt: bogotaInputToIso(firstResponseAt),
                resolvedAt: bogotaInputToIso(resolvedAt),
                billableMinutes: minutes,
                resolutionNote: note.trim(),
              }
            : undefined,
      },
      {
        onSuccess: (ticket) =>
          router.push(`/dashboard/mesa-de-ayuda/${ticket.id}`),
      }
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/dashboard/mesa-de-ayuda"
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
          Para lo que llega por WhatsApp o llamada, a nombre de la persona que
          lo pidió.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <section className={SECTION}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ticket-customer">Empresa</Label>
              <select
                id="ticket-customer"
                required
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setRequesterId('');
                  setDeviceId('');
                }}
                className={SELECT_CLASS}
              >
                <option value="">
                  {isLoading ? 'Cargando…' : 'Escoge la empresa'}
                </option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.customerId}>
                    {customerName(c.customer)}
                  </option>
                ))}
              </select>
              {!isLoading && contracts.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ninguna empresa tiene contrato activo.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ticket-requester">Solicitante</Label>
              <select
                id="ticket-requester"
                required
                disabled={!customerId}
                value={requesterId}
                onChange={(e) => setRequesterId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Escoge la persona</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </select>
              {customerId && activeUsers.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Esta empresa no tiene usuarios del portal.{' '}
                  <Link
                    href={`/dashboard/clientes/${customerId}`}
                    className="underline"
                  >
                    Créalos en la ficha del cliente
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ticket-subject">Asunto</Label>
            <Input
              id="ticket-subject"
              required
              maxLength={150}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ticket-description">Descripción</Label>
            <textarea
              id="ticket-description"
              required
              rows={4}
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ticket-priority">Prioridad</Label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className={SELECT_CLASS}
              >
                {PRIORITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {PRIORITY_LABELS[level]}
                  </option>
                ))}
              </select>
              {selectedPriority && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedPriority.criterion}. Respuesta{' '}
                  {formatTarget(
                    selectedPriority.targetAmount,
                    selectedPriority.targetUnit
                  ).toLowerCase()}
                  .
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ticket-device">Equipo (opcional)</Label>
              <select
                id="ticket-device"
                disabled={!customerId}
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Sin equipo</option>
                {devices
                  .filter((d: { isActive?: boolean }) => d.isActive !== false)
                  .map(
                    (d: {
                      id: string;
                      brand?: string;
                      model?: string;
                      deviceUser?: string;
                      serial?: string;
                    }) => (
                      <option key={d.id} value={d.id}>
                        {[d.brand, d.model, d.deviceUser, d.serial]
                          .filter(Boolean)
                          .join(' · ') || 'Equipo'}
                      </option>
                    )
                  )}
              </select>
            </div>
          </div>

          <div className="space-y-1 sm:max-w-xs">
            <Label htmlFor="ticket-received">Hora de recepción</Label>
            <Input
              id="ticket-received"
              type="datetime-local"
              required
              max={now}
              value={receivedAt}
              onChange={(e) => {
                setReceivedAt(e.target.value);
                setReceivedTouched(true);
              }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cuándo llegó la solicitud. El vencimiento se cuenta desde aquí.
            </p>
          </div>
        </section>

        <section className={SECTION}>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <input
              type="checkbox"
              checked={alreadyResolved}
              onChange={(e) => setAlreadyResolved(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Ya está resuelto
          </label>
          {alreadyResolved && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ticket-first-response">
                    Hora de respuesta
                  </Label>
                  <Input
                    id="ticket-first-response"
                    type="datetime-local"
                    required
                    max={now}
                    value={firstResponseAt}
                    onChange={(e) => setFirstResponseAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ticket-resolved-at">Hora de solución</Label>
                  <Input
                    id="ticket-resolved-at"
                    type="datetime-local"
                    required
                    max={now}
                    value={resolvedAt}
                    onChange={(e) => setResolvedAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1 sm:max-w-xs">
                <Label htmlFor="ticket-minutes">Tiempo dedicado</Label>
                <TimeSelect
                  id="ticket-minutes"
                  value={minutes}
                  onChange={setMinutes}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ticket-note">Nota de solución</Label>
                <textarea
                  id="ticket-note"
                  required
                  rows={3}
                  maxLength={4000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={TEXTAREA_CLASS}
                  placeholder="Qué se hizo. El cliente la ve en el portal."
                />
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/mesa-de-ayuda">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={createTicket.isPending || (alreadyResolved && !minutes)}
          >
            {createTicket.isPending && <Loader2 className="animate-spin" />}
            Crear ticket
          </Button>
        </div>
      </form>
    </div>
  );
}
