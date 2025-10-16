'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmDialogProps) {
  const colors = {
    danger: {
      icon: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800',
    },
    warning: {
      icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-900 dark:hover:bg-yellow-800',
    },
    info: {
      icon: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800',
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${colors[type].icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button className={colors[type].button} onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
