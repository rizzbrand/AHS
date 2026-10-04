'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/shell/AppShell';
import { useSession } from '../../lib/session';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/');
  }, [ready, router, user]);

  if (!ready || !user) return <div className="min-h-screen bg-paper" />;

  return <AppShell>{children}</AppShell>;
}
