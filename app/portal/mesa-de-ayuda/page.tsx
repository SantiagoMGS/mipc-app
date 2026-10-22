'use client';

import PortalShell, { PortalLoading } from '@/components/portal/PortalShell';
import { usePortalSession } from '@/hooks/usePortalSession';

export default function PortalHelpdeskPage() {
  const { session } = usePortalSession();
  if (!session) return <PortalLoading />;

  return (
    <PortalShell session={session}>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Mesa de ayuda
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Aquí podrás abrir tickets de soporte y ver cómo van.
      </p>
    </PortalShell>
  );
}
