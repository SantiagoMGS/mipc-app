'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { bogotaInputToIso, bogotaInputValue } from '@/lib/format';
import TimeSelect from './TimeSelect';
import { TEXTAREA_CLASS } from './field-styles';

export interface ResolveValues {
  billableMinutes: number;
  resolutionNote: string;
  /** Solo si se cambió la hora propuesta */
  resolvedAt?: string;
  firstResponseAt?: string;
}

interface ResolveTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "resolve" resuelve; "edit" corrige un ticket ya resuelto */
  mode: 'resolve' | 'edit';
  initial?: {
    billableMinutes: number | null;
    resolutionNote: string | null;
    resolvedAt: string | null;
    firstResponseAt: string | null;
  };
  pending: boolean;
  onConfirm: (values: ResolveValues) => void;
}

const COPY = {
  resolve: {
    title: 'Resolver ticket',
    description: 'El tiempo se descuenta de la bolsa del mes de la solución.',
    submit: 'Resolver ticket',
  },
  edit: {
    title: 'Corregir registro',
    description: 'Cada cambio queda en el historial del ticket.',
    submit: 'Guardar cambios',
  },
};

export default function ResolveTicketDialog({
  open,
  onOpenChange,
  mode,
  initial,
  pending,
  onConfirm,
}: ResolveTicketDialogProps) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [resolvedAt, setResolvedAt] = useState('');
  const [firstResponseAt, setFirstResponseAt] = useState('');
  const [touched, setTouched] = useState({ resolvedAt: false, first: false });

  useEffect(() => {
    if (!open) return;
    setMinutes(initial?.billableMinutes ?? null);
    setNote(initial?.resolutionNote ?? '');
    setResolvedAt(
      bogotaInputValue(
        initial?.resolvedAt ? new Date(initial.resolvedAt) : new Date()
      )
    );
    setFirstResponseAt(
      initial?.firstResponseAt
        ? bogotaInputValue(new Date(initial.firstResponseAt))
        : ''
    );
    setTouched({ resolvedAt: false, first: false });
    // Solo al abrir: si no, cada render del padre borraría lo escrito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copy = COPY[mode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!minutes) return;
            onConfirm({
              billableMinutes: minutes,
              resolutionNote: note.trim(),
              resolvedAt: touched.resolvedAt
                ? bogotaInputToIso(resolvedAt)
                : undefined,
              firstResponseAt: touched.first
                ? bogotaInputToIso(firstResponseAt)
                : undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="resolve-minutes">Tiempo dedicado</Label>
            <TimeSelect
              id="resolve-minutes"
              value={minutes}
              onChange={setMinutes}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              El total del ticket, aunque haya tenido varias intervenciones.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="resolve-note">Nota de solución</Label>
            <textarea
              id="resolve-note"
              required
              rows={4}
              maxLength={4000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Qué se hizo. El cliente la ve en el portal."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {mode === 'edit' && (
              <div className="space-y-1">
                <Label htmlFor="resolve-first-response">
                  Hora de respuesta
                </Label>
                <Input
                  id="resolve-first-response"
                  type="datetime-local"
                  required
                  value={firstResponseAt}
                  onChange={(e) => {
                    setFirstResponseAt(e.target.value);
                    setTouched((t) => ({ ...t, first: true }));
                  }}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="resolve-resolved-at">Hora de solución</Label>
              <Input
                id="resolve-resolved-at"
                type="datetime-local"
                required
                value={resolvedAt}
                max={bogotaInputValue()}
                onChange={(e) => {
                  setResolvedAt(e.target.value);
                  setTouched((t) => ({ ...t, resolvedAt: true }));
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !minutes}>
              {pending && <Loader2 className="animate-spin" />}
              {copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
