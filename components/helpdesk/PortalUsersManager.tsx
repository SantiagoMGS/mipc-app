'use client';

import { useState } from 'react';
import { KeyRound, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import TemporaryPasswordDialog from './TemporaryPasswordDialog';
import {
  CreatePortalUserDto,
  PORTAL_ROLE_LABELS,
  PortalUser,
  PortalUserRole,
  PortalUserWithPassword,
  UpdatePortalUserDto,
} from '@/types/helpdesk';

const EMPTY_FORM: CreatePortalUserDto = {
  name: '',
  email: '',
  phone: '',
  role: 'CLIENT_USER',
};

interface PortalUsersManagerProps {
  heading: React.ReactNode;
  users: PortalUser[];
  isLoading: boolean;
  canManage: boolean;
  createTitle: string;
  /** El usuario que está mirando (no puede desactivarse a sí mismo) */
  currentPortalUserId?: string;
  creating: boolean;
  onCreate: (data: CreatePortalUserDto) => Promise<PortalUserWithPassword>;
  onUpdate: (id: string, data: UpdatePortalUserDto) => Promise<unknown>;
  onReset: (id: string) => Promise<PortalUserWithPassword>;
}

/** Lista y gestión de usuarios del portal, compartida por el panel y el portal */
export default function PortalUsersManager({
  heading,
  users,
  isLoading,
  canManage,
  createTitle,
  currentPortalUserId,
  creating,
  onCreate,
  onUpdate,
  onReset,
}: PortalUsersManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CreatePortalUserDto>(EMPTY_FORM);
  const [shownPassword, setShownPassword] =
    useState<PortalUserWithPassword | null>(null);
  const [confirm, setConfirm] = useState<{
    user: PortalUser;
    action: 'deactivate' | 'reset';
  } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await onCreate(form);
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setShownPassword(created);
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    const { user, action } = confirm;
    setConfirm(null);
    if (action === 'deactivate') {
      await onUpdate(user.id, { isActive: false });
    } else {
      setShownPassword(await onReset(user.id));
    }
  };

  const toggleRole = (user: PortalUser) => {
    const next: PortalUserRole =
      user.role === 'CLIENT_ADMIN' ? 'CLIENT_USER' : 'CLIENT_ADMIN';
    onUpdate(user.id, { role: next }).catch(() => undefined);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {heading}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({users.length})
          </span>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setFormOpen(true)}
            className="gap-1"
            aria-label="Agregar usuario"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar usuario</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Todavía no hay usuarios. Crea el primero para que la empresa pueda
          abrir tickets.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <li
              key={user.id}
              className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-white">
                    {user.name}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      user.role === 'CLIENT_ADMIN'
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {PORTAL_ROLE_LABELS[user.role]}
                  </span>
                  {!user.isActive && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                  {user.email} · {user.phone}
                </p>
              </div>
              {canManage && (
                <div className="flex flex-wrap items-center gap-2">
                  {user.isActive ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRole(user)}
                      >
                        {user.role === 'CLIENT_ADMIN'
                          ? 'Quitar administrador'
                          : 'Hacer administrador'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirm({ user, action: 'reset' })}
                        className="gap-1"
                      >
                        <KeyRound className="w-4 h-4" />
                        Reasignar contraseña
                      </Button>
                      {user.id !== currentPortalUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirm({ user, action: 'deactivate' })
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          Desactivar
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate(user.id, { isActive: true })}
                    >
                      Activar
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{createTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="portal-user-name">Nombre</Label>
              <Input
                id="portal-user-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="portal-user-email">Correo</Label>
              <Input
                id="portal-user-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="portal-user-phone">Celular</Label>
              <Input
                id="portal-user-phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="portal-user-role">Rol</Label>
              <select
                id="portal-user-role"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as PortalUserRole })
                }
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-gray-800 dark:text-white"
              >
                <option value="CLIENT_USER">
                  Usuario: abre tickets y ve los suyos
                </option>
                <option value="CLIENT_ADMIN">
                  Administrador: ve todo y gestiona usuarios
                </option>
              </select>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TemporaryPasswordDialog
        user={shownPassword}
        onClose={() => setShownPassword(null)}
      />

      <ConfirmDialog
        isOpen={!!confirm}
        title={
          confirm?.action === 'deactivate'
            ? 'Desactivar usuario'
            : 'Reasignar contraseña'
        }
        message={
          confirm?.action === 'deactivate'
            ? `${confirm.user.name} ya no podrá entrar al portal ni abrir tickets. Su sesión abierta se cierra.`
            : `${confirm?.user.name} recibirá una contraseña temporal nueva y su sesión abierta se cierra.`
        }
        confirmText={
          confirm?.action === 'deactivate' ? 'Desactivar' : 'Reasignar'
        }
        type={confirm?.action === 'deactivate' ? 'danger' : 'warning'}
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
