'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronsUpDown, LogOut } from 'lucide-react';
import { ROLE_LABEL } from '../../lib/labels';
import { can, fieldHome, isFieldRole } from '../../lib/permissions';
import { sessionUsers } from '../../lib/seed';
import { useSession } from '../../lib/session';

type Variant = 'paper' | 'forest' | 'sidebar' | 'avatar';

export function RoleMenu({ tone, variant, collapsed = false }: { tone?: 'paper' | 'forest'; variant?: Variant; collapsed?: boolean }) {
  const { user, signIn, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const kind: Variant = variant ?? tone ?? 'paper';
  const upward = kind === 'sidebar';

  return (
    <div className="relative">
      {kind === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          title={collapsed ? `${user.name} · switch demo role` : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-shell-hover ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber text-[11px] font-semibold text-ink">{user.initials}</span>
          {collapsed ? null : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-shell-ink">{user.name}</span>
                <span className="block truncate text-[11px] text-shell-muted">{ROLE_LABEL[user.role]}</span>
              </span>
              <ChevronsUpDown size={14} className="text-shell-faint" />
            </>
          )}
        </button>
      ) : kind === 'avatar' ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={`${user.name}, switch demo role`}
          className="grid h-9 w-9 place-items-center rounded-full bg-amber text-[11px] font-semibold text-ink ring-2 ring-white transition hover:bg-amber-deep"
        >
          {user.initials}
        </button>
      ) : (
        <button
          type="button"
          className={`flex h-9 items-center gap-2 px-2 ${kind === 'forest' ? 'text-[#f6f1e8]' : 'border border-line bg-surface'}`}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={`grid h-6 w-6 place-items-center text-[10px] font-semibold ${kind === 'forest' ? 'bg-copper text-white' : 'bg-forest text-[#f6f1e8]'}`}>{user.initials}</span>
          <span className="text-right">
            <span className="block text-xs font-semibold leading-none">{user.name}</span>
            <span className={`mt-0.5 block text-[10px] ${kind === 'forest' ? 'text-[#b7c2bb]' : 'text-muted'}`}>{ROLE_LABEL[user.role]}</span>
          </span>
          <ChevronDown size={14} className={kind === 'forest' ? 'text-[#b7c2bb]' : 'text-muted'} />
        </button>
      )}
      {open ? (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div
            className={`absolute z-50 w-64 overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-sheet ${
              upward ? `bottom-full mb-2 ${collapsed ? 'left-0' : 'left-0 right-0 w-auto'}` : 'right-0 mt-2'
            }`}
          >
            <p className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Switch demo role</p>
            <ul className="py-1">
              {sessionUsers.map((person) => {
                const current = person.id === user.id;
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-paper ${current ? 'bg-paper/60' : ''}`}
                      onClick={() => {
                        signIn(person.id);
                        setOpen(false);
                        router.push(isFieldRole(person.role) ? fieldHome(pathname) : can(person.role, 'overview.read') ? '/overview' : '/playbook');
                      }}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${current ? 'bg-amber text-ink' : 'bg-[#ece7df] text-[#5e574e]'}`}>
                        {person.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{person.name}</span>
                        <span className="block truncate text-xs text-muted">{person.title}</span>
                      </span>
                      {current ? <span className="text-[10px] font-semibold uppercase tracking-wide text-copper">Current</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-sm text-muted hover:bg-paper"
              onClick={() => {
                signOut();
                setOpen(false);
                router.push('/');
              }}
            >
              <LogOut size={14} />
              Sign out of demo
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
