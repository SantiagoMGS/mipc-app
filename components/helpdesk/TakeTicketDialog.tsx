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
import {
  bogotaInputToIso,
  bogotaInputValue,
  formatBogotaDateTime,
} from '@/lib/format';

interface TakeTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hora de respuesta ya registrada, si la hay */
  firstResponseAt: string | null;
  pending: boolean;
  /** Sin hora: la API usa "ahora" */
  onConfirm: (firstResponseAt?: string) => void;
}

/** Tomar un ticket: queda asignado a quien lo toma y se anota la hora de respuesta */
export default function TakeTicketDialog({
  open,
  onOpenChange,
  firstResponseAt,
  pending,
  onConfirm,
}: TakeTicketDialogProps) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(bogotaInputValue());
      setTouched(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tomar ticket</DialogTitle>
          <DialogDescription>
            Quedará asignado a ti y pasará a “En atención”.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Si no se cambió la hora propuesta, cuenta la hora exacta de ahora
            onConfirm(
              !firstResponseAt && touched ? bogotaInputToIso(value) : undefined
            );
          }}
          className="space-y-4"
        >
          {firstResponseAt ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              La hora de respuesta ya está registrada:{' '}
              {formatBogotaDateTime(firstResponseAt)}.
            </p>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="take-first-response">Hora de respuesta</Label>
              <Input
                id="take-first-response"
                type="datetime-local"
                required
                value={value}
                max={bogotaInputValue()}
                onChange={(e) => {
                  setValue(e.target.value);
                  setTouched(true);
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cuándo le respondiste al usuario por WhatsApp.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Tomar ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
