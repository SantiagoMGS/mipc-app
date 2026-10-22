'use client';

import PortalShell, { PortalLoading } from '@/components/portal/PortalShell';
import PortalUsersManager from '@/components/helpdesk/PortalUsersManager';
import { usePortalSession } from '@/hooks/usePortalSession';
import { usePortalSelfUsers } from '@/hooks/usePortalSelfUsers';

/** El administrador del cliente gestiona a las personas de su empresa */
export default function PortalUsersPage() {
  const { session } = usePortalSession({ adminOnly: true });
  if (!session) return <PortalLoading />;
  return (
    <PortalShell session={session}>
      <UsersContent currentPortalUserId={session.portalUserId} />
    </PortalShell>
  );
}

function UsersContent({
  currentPortalUserId,
}: {
  currentPortalUserId?: string;
}) {
  const { users, create, update, reset } = usePortalSelfUsers();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <PortalUsersManager
        heading={
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Usuarios
          </h1>
        }
        users={users.data ?? []}
        isLoading={users.isLoading}
        canManage
        createTitle="Agregar usuario"
        currentPortalUserId={currentPortalUserId}
        creating={create.isPending}
        onCreate={(data) => create.mutateAsync(data)}
        onUpdate={(id, data) => update.mutateAsync({ id, data })}
        onReset={(id) => reset.mutateAsync(id)}
      />
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Los usuarios abren tickets y ven solo los suyos. Los administradores ven
        todos los tickets de la empresa, las horas del mes y gestionan esta
        lista.
      </p>
    </div>
  );
}
