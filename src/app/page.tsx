'use client';

import { ArrowRight, Building2, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { isFieldRole } from '../lib/permissions';
import { company, sessionUsers, workOrders } from '../lib/seed';
import { useSession } from '../lib/session';
import { RoleId, SessionUser } from '../lib/types';

export default function EntryPage() {
  const { user, ready, signIn } = useSession();
  const router = useRouter();

  if (!ready) return <div className="min-h-screen bg-paper" />;

  const enter = (id: string, role: RoleId) => {
    signIn(id);
    router.push(isFieldRole(role) ? '/field' : '/overview');
  };

  const office = sessionUsers.filter((person) => !isFieldRole(person.role));
  const field = sessionUsers.filter((person) => isFieldRole(person.role));

  return (
    <main className="min-h-screen bg-paper lg:h-screen lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(520px,640px)]">
      <section className="relative flex items-center justify-between gap-4 overflow-hidden bg-shell px-5 py-4 text-shell-text sm:px-8 lg:flex-col lg:items-stretch lg:justify-between lg:px-14 lg:py-10">
        <div className="pointer-events-none absolute -right-24 -top-24 hidden h-72 w-72 rounded-full bg-amber/10 blur-3xl lg:block" />
        <div className="flex min-w-0 items-center gap-3 lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber text-[11px] font-bold text-ink">AH</span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-shell-ink lg:text-[13px] lg:tracking-[0.28em]">Assign Home</p>
              <p className="hidden text-[12px] text-shell-muted sm:block">{company.name}</p>
            </div>
          </div>
          <h1 className="mt-8 hidden max-w-lg font-display text-[2.85rem] font-medium leading-[1.18] tracking-[-0.03em] text-shell-ink lg:block">
            The operating record for the DMV.
          </h1>
          <p className="mt-4 hidden max-w-md text-[15px] leading-7 text-shell-text lg:block">
            Intake, dispatch, field work, and documentation in one place. Pricing and client contacts stay with the people who are supposed to see them.
          </p>
          <dl className="mt-8 hidden max-w-md grid-cols-3 gap-2 lg:grid">
            <Stat label="Open jobs" value={String(workOrders.length)} />
            <Stat label="Demo seats" value={String(sessionUsers.length)} />
            <Stat label="JobTread" value="Off" />
          </dl>
        </div>
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-shell-faint lg:text-[11px] lg:tracking-[0.18em]">{company.region}</p>
      </section>

      <section className="flex flex-col px-5 py-5 sm:px-8 lg:h-screen lg:overflow-hidden lg:px-8 lg:py-6">
        <header className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Demo sign-in</p>
          <h2 className="mt-1 font-display text-[1.7rem] font-medium leading-none tracking-[-0.03em] text-ink">Who is working?</h2>
          <p className="mt-1.5 text-[13px] leading-5 text-muted">A role preview, not production authentication.</p>
        </header>

        {user ? (
          <button
            type="button"
            onClick={() => enter(user.id, user.role)}
            className="mt-4 flex h-12 w-full shrink-0 items-center gap-3 rounded-xl border border-amber/50 bg-[#fbf3e8] px-3 text-left transition hover:border-amber hover:bg-[#f7ead6]"
          >
            <Avatar initials={user.initials} field={isFieldRole(user.role)} />
            <span className="min-w-0 flex-1 truncate text-sm text-ink">
              <span className="font-semibold">{user.name}</span>
              <span className="text-[#6f6a62]"> · {user.title}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-ink">
              Continue <ArrowRight size={14} />
            </span>
          </button>
        ) : null}

        <div className="mt-4 min-h-0 flex-1 space-y-3">
          <RoleGroup title="Office" hint="Console" icon={<Building2 size={13} />} people={office} currentId={user?.id} onEnter={enter} />
          <RoleGroup title="Field" hint="Phone board" icon={<Smartphone size={13} />} people={field} currentId={user?.id} onEnter={enter} />
        </div>
      </section>
    </main>
  );
}

function RoleGroup({
  title,
  hint,
  icon,
  people,
  currentId,
  onEnter
}: {
  title: string;
  hint: string;
  icon: ReactNode;
  people: SessionUser[];
  currentId?: string;
  onEnter: (id: string, role: RoleId) => void;
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[#8a8278]">{icon}</span>
        <h3 className="text-[12px] font-semibold text-ink">{title}</h3>
        <span className="text-[12px] text-[#9a9187]">{hint}</span>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {people.map((person) => {
          const current = person.id === currentId;
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onEnter(person.id, person.role)}
                className={`group flex h-[4.5rem] w-full items-center gap-2.5 rounded-xl border bg-white px-2.5 text-left transition ${
                  current ? 'border-ink shadow-sm' : 'border-[#ece6dc] hover:border-[#cfc6b8] hover:bg-[#fdfcfa]'
                }`}
              >
                <Avatar initials={person.initials} field={isFieldRole(person.role)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{person.name}</span>
                  <span className="block truncate text-[11px] text-[#8a8278]">{person.title}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-[#c4bdb2] group-hover:text-ink" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Avatar({ initials, field }: { initials: string; field: boolean }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
        field ? 'bg-[#e8efe8] text-[#1d5a32]' : 'bg-ink text-white'
      }`}
    >
      {initials}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-shell-raised px-3 py-3">
      <dt className="text-[11px] text-shell-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold text-shell-ink">{value}</dd>
    </div>
  );
}
