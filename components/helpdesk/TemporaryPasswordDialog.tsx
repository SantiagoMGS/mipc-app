'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TemporaryPasswordDialogProps {
  user: { name: string; email: string; temporaryPassword: string } | null;
  onClose: () => void;
}

/** Muestra una sola vez la contraseña temporal de un usuario del portal */
export default function TemporaryPasswordDialog({
  user,
  onClose,
}: TemporaryPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!user) return;
    await navigator.clipboard
      ?.writeText(user.temporaryPassword)
      .catch(() => undefined);
    setCopied(true);
  };

  const close = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseña temporal</DialogTitle>
          <DialogDescription>
            Compártela con {user?.name} ({user?.email}). Deberá cambiarla la
            primera vez que entre al portal. No se volverá a mostrar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
          <code
            data-testid="temporary-password"
            className="flex-1 font-mono text-lg tracking-wider text-gray-900 dark:text-white break-all"
          >
            {user?.temporaryPassword}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="gap-1"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copiada' : 'Copiar'}
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" onClick={close}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
