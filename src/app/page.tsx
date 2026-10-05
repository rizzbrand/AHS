'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isFieldRole } from '../lib/permissions';
import { company, sessionUsers } from '../lib/seed';
import { useSession } from '../lib/session';
import { RoleId, SessionUser } from '../lib/types';

export default function EntryPage() {
  const { user, ready, signIn } = useSession();
  const router = useRouter();

  if (!ready) return <div className="min-h-screen bg-white" />;

  const enter = (id: string, role: RoleId) => {
    signIn(id);
    router.push(isFieldRole(role) ? '/field' : '/overview');
  };

  const office = sessionUsers.filter((person) => !isFieldRole(person.role));
  const field = sessionUsers.filter((person) => isFieldRole(person.role));

  return (
    <main className="min-h-screen bg-white lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <section className="relative h-[28vh] overflow-hidden bg-[#111] lg:h-auto">
        <img src="/ahs.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
        <div className="absolute left-6 top-6 flex items-center gap-2.5 text-white sm:left-8 sm:top-8">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[10px] font-bold text-ink">AH</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Assign Home Solutions</span>
        </div>
        <div className="absolute bottom-6 left-6 text-white sm:bottom-8 sm:left-8">
          <p className="font-display text-2xl tracking-tight">Assign Home Solutions</p>
          <p className="mt-1 text-sm text-white/70"></p>
        </div>
      </section>

      <section className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 lg:py-10">
        <header>
          <p className="text-[13px] font-medium text-ink">Assign Home Solutions</p>
          <p className="mt-0.5 text-[12px] text-[#9a9187]">Operations platform</p>
        </header>

        <div className="py-8 lg:py-0">
          <h1 className="max-w-md font-display text-[2.55rem] font-medium leading-[1.08] tracking-tight text-ink">
            Welcome, choose a seat.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#8a8278]">A role preview. This is not production authentication.</p>

          {user ? (
            <button
              type="button"
              onClick={() => enter(user.id, user.role)}
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white"
            >
              Continue as {user.name}
              <ArrowRight size={14} />
            </button>
          ) : null}

          <div className="mt-8 space-y-5">
            <SeatList title="Office" people={office} currentId={user?.id} onEnter={enter} />
            <SeatList title="Field" people={field} currentId={user?.id} onEnter={enter} />
          </div>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-[#f0ebe3] pt-5 text-[11px] text-[#b5ada2]">
          <span>© Assign Home Solutions</span>
          <span>{company.region}</span>
        </footer>
      </section>
    </main>
  );
}

function SeatList({
  title,
  people,
  currentId,
  onEnter
}: {
  title: string;
  people: SessionUser[];
  currentId?: string;
  onEnter: (id: string, role: RoleId) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#9a9187]">{title}</p>
      <ul className="space-y-2">
        {people.map((person) => {
          const current = person.id === currentId;
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onEnter(person.id, person.role)}
                className={`flex h-12 w-full items-center gap-3 rounded-full bg-ink px-2 pr-4 text-left text-white transition ${
                  current ? 'ring-2 ring-ink/20 ring-offset-2' : 'hover:bg-[#2a2622]'
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-ink">
                  {person.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{person.name}</span>
                </span>
                <span className="truncate text-[12px] text-white/60">{person.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
