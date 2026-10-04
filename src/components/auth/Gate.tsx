'use client';

import { Permission } from '../../lib/types';
import { can } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { AccessDenied } from '../ui/PageHeader';

export function Gate({
  permission,
  title,
  body,
  children
}: {
  permission: Permission;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const { user, ready } = useSession();
  if (!ready || !user) return null;
  if (!can(user.role, permission)) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <AccessDenied title={title} body={body} />
      </div>
    );
  }
  return <>{children}</>;
}
