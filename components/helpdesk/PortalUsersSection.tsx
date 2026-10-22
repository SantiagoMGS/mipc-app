'use client';

import { UserCircle2 } from 'lucide-react';
import PortalUsersManager from './PortalUsersManager';
import { getCurrentUserRole } from '@/lib/auth-utils';
import {
  useCreatePortalUser,
  usePortalUsers,
  useResetPortalUserPassword,
  useUpdatePortalUser,
} from '@/hooks/usePortalUsers';

/** Personas de la empresa que entran al portal. Gestionan ADMIN y TECNICO. */
export default function PortalUsersSection({
  customerId,
}: {
  customerId: string;
}) {
  const { data: users = [], isLoading } = usePortalUsers(customerId);
  const createUser = useCreatePortalUser(customerId);
  const updateUser = useUpdatePortalUser(customerId);
  const resetPassword = useResetPortalUserPassword(customerId);
  const role = getCurrentUserRole();

  return (
    <section
      aria-labelledby="portal-users-title"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6"
    >
      <PortalUsersManager
        heading={
          <h2
            id="portal-users-title"
            className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white"
          >
            <UserCircle2 className="w-6 h-6 text-primary-500" />
            Usuarios del portal
          </h2>
        }
        users={users}
        isLoading={isLoading}
        canManage={role === 'ADMIN' || role === 'TECNICO'}
        createTitle="Agregar usuario del portal"
        creating={createUser.isPending}
        onCreate={(data) => createUser.mutateAsync(data)}
        onUpdate={(id, data) => updateUser.mutateAsync({ id, data })}
        onReset={(id) => resetPassword.mutateAsync(id)}
      />
    </section>
  );
}
