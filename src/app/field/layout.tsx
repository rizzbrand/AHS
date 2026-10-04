'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, CalendarCheck } from 'lucide-react';
import { RoleMenu } from '../../components/shell/RoleMenu';
import { useDemo } from '../../lib/demo-store';
import { ROLE_LABEL } from '../../lib/labels';
import { ackState, personKey, requiredSops } from '../../lib/playbook';
import { useSession } from '../../lib/session';

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const { sops, acks } = useDemo();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace('/');
  }, [ready, router, user]);

  if (!ready || !user) return <div className="min-h-screen bg-[#e9e4dc]" />;

  const onPlaybook = pathname.startsWith('/field/playbook');
  const me = personKey(user);
  const pending = me ? requiredSops(user.role, sops).filter((sop) => ackState(me, sop, acks) !== 'current').length : 0;

  return (
    <div className="min-h-screen bg-[#e9e4dc] md:py-6">
      <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-[#f7f5f1] md:h-[calc(100vh-3rem)] md:rounded-[30px] md:border-[6px] md:border-shell md:shadow-canvas">
        <header className="flex shrink-0 items-center justify-between bg-shell px-5 py-3.5">
          <Link href="/field" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber text-[11px] font-bold text-ink">AH</span>
            <span>
              <span className="block text-[15px] font-semibold leading-none text-shell-ink">Field</span>
              <span className="mt-1 block text-[11px] leading-none text-shell-muted">
                {user.name} · {ROLE_LABEL[user.role]}
              </span>
            </span>
          </Link>
          <RoleMenu variant="avatar" />
        </header>

        <div className="relative flex-1 overflow-y-auto">{children}</div>

        <nav className="grid shrink-0 grid-cols-2 border-t border-[#ece6dc] bg-white px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
          <TabLink href="/field" label="Today" active={!onPlaybook} icon={<CalendarCheck size={19} />} />
          <TabLink href="/field/playbook" label="Playbook" active={onPlaybook} icon={<BookOpen size={19} />} badge={pending} />
        </nav>
      </div>
    </div>
  );
}

function TabLink({ href, label, active, icon, badge = 0 }: { href: string; label: string; active: boolean; icon: React.ReactNode; badge?: number }) {
  return (
    <Link href={href} className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition ${active ? 'text-ink' : 'text-[#9a9187] hover:text-ink'}`}>
      <span className={`relative grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-amber/30' : ''}`}>
        {icon}
        {badge > 0 ? (
          <span className="absolute -right-0.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-copper px-1 text-[10px] font-bold text-white">{badge}</span>
        ) : null}
      </span>
      {label}
    </Link>
  );
}
