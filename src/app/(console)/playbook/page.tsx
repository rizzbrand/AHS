'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, FileText, Inbox, PenLine, Search, ShieldAlert, Users, Waypoints, type LucideIcon } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { AckChip, DraftChip } from '../../../components/playbook/Sop';
import { ResponsibilityMap } from '../../../components/playbook/ResponsibilityMap';
import { FilterField, PillSearch, PillSelect } from '../../../components/ui/DataTable';
import { useDemo } from '../../../lib/demo-store';
import { ackState, audienceFor, canEditPlaybook, isDraft, personKey, personName } from '../../../lib/playbook';
import { useSession } from '../../../lib/session';
import { Sop } from '../../../lib/types';

type Tab = 'procedures' | 'responsibilities';
type View = 'all' | 'mine' | 'drafts';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Documentation: FileText,
  'Field execution': ShieldAlert,
  Intake: Inbox,
  Workforce: Users,
  Dispatch: Waypoints,
  Closeout: CheckCircle2
};

export default function PlaybookPage() {
  const { user } = useSession();
  const { sops, acks, contractors } = useDemo();
  const [tab, setTab] = useState<Tab>('procedures');
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => Array.from(new Set(sops.map((sop) => sop.category))), [sops]);
  if (!user) return null;
  const me = personKey(user);
  const editor = canEditPlaybook(user.role);

  const mine = me ? sops.filter((sop) => sop.audience.includes(user.role) && ackState(me, sop, acks) !== 'current') : [];
  const drafts = sops.filter(isDraft);

  const list = sops.filter((sop) => {
    if (view === 'mine' && !(sop.audience.includes(user.role) && me && ackState(me, sop, acks) !== 'current')) return false;
    if (view === 'drafts' && !isDraft(sop)) return false;
    if (category !== 'all' && sop.category !== category) return false;
    const q = query.trim().toLowerCase();
    return !q || `${sop.title} ${sop.purpose} ${sop.category} ${sop.steps.join(' ')}`.toLowerCase().includes(q);
  });

  const coverage = sops.reduce(
    (totals, sop) => {
      const people = audienceFor(sop, contractors);
      totals.expected += people.length;
      totals.current += people.filter((person) => ackState(person.id, sop, acks) === 'current').length;
      return totals;
    },
    { expected: 0, current: 0 }
  );

  const views: { id: View; label: string }[] = [
    { id: 'all', label: 'All procedures' },
    { id: 'mine', label: 'Waiting on you' },
    { id: 'drafts', label: 'Drafts' }
  ];

  const filtersOn = query || category !== 'all' || view !== 'all';

  return (
    <Gate permission="playbook.read" title="Playbook is limited" body="Operating procedures are available after you sign in.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Operations manual</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">SOPs / Playbook</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            How a job is taken in, done, and documented — and who owns each part of the business. People sign off on the version they follow.
          </p>
        </header>

        <nav aria-label="Playbook sections" className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'procedures', label: 'Procedures', count: sops.length },
              { id: 'responsibilities', label: 'Responsibilities', count: undefined }
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={active}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm transition ${
                  active ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-[#4a443d] hover:border-[#cfc6b8] hover:text-ink'
                }`}
              >
                {item.label}
                {item.count != null ? (
                  <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${active ? 'bg-white/15 text-white' : 'bg-[#f3efe6] text-muted'}`}>
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {tab === 'responsibilities' ? (
          <ResponsibilityMap />
        ) : (
          <>
            <section className={`grid grid-cols-2 gap-3 ${editor ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              <Stat
                label="Procedures"
                value={sops.length}
                note={`${categories.length} categories`}
                active={view === 'all'}
                onClick={() => setView('all')}
              />
              <Stat
                label="Waiting on you"
                value={mine.length}
                note={mine.length ? 'Read and sign the current version' : 'You are current'}
                warn={mine.length > 0}
                active={view === 'mine'}
                onClick={() => setView('mine')}
              />
              <Stat
                label="Drafts"
                value={drafts.length}
                note={drafts.length ? 'Not published yet' : 'Nothing in draft'}
                active={view === 'drafts'}
                onClick={() => setView('drafts')}
              />
              {editor ? (
                <Stat
                  label="Team sign-off"
                  value={coverage.expected ? `${Math.round((coverage.current / coverage.expected) * 100)}%` : '—'}
                  note={`${coverage.current} of ${coverage.expected} current`}
                />
              ) : null}
            </section>

            <nav aria-label="Procedure views" className="flex flex-wrap gap-1.5">
              {views.map((item) => {
                const active = view === item.id;
                const count = item.id === 'all' ? sops.length : item.id === 'mine' ? mine.length : drafts.length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    aria-pressed={active}
                    className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm transition ${
                      active ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-[#4a443d] hover:border-[#cfc6b8] hover:text-ink'
                    }`}
                  >
                    {item.label}
                    <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${active ? 'bg-white/15 text-white' : 'bg-[#f3efe6] text-muted'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            <section className="rounded-2xl border border-[#ece6dc] bg-white">
              <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
                <FilterField label="Search">
                  <PillSearch value={query} onChange={setQuery} placeholder="Title, step, or purpose…" width="w-64" />
                </FilterField>
                <FilterField label="Category">
                  <PillSelect value={category} onChange={setCategory} width="w-48">
                    <option value="all">All categories</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </PillSelect>
                </FilterField>
                {filtersOn ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setCategory('all');
                      setView('all');
                    }}
                    className="h-10 px-2 text-sm font-medium text-copper hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {list.length === 0 ? (
                <div className="border-t border-[#f0ebe3] px-5 py-14 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
                    <Search size={18} />
                  </span>
                  <p className="mt-3 font-medium text-ink">No procedures match</p>
                  <p className="mt-1 text-sm text-muted">Try another category or search term.</p>
                </div>
              ) : (
                <ul className="grid gap-3 border-t border-[#f0ebe3] bg-[#faf8f5] p-5 md:grid-cols-2">
                  {list.map((sop) => (
                    <SopCard key={sop.id} sop={sop} me={me} required={Boolean(me && sop.audience.includes(user.role))} editor={editor} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </Gate>
  );
}

function SopCard({ sop, me, required, editor }: { sop: Sop; me?: string; required: boolean; editor: boolean }) {
  const { acks, contractors } = useDemo();
  const people = audienceFor(sop, contractors);
  const signed = people.filter((person) => ackState(person.id, sop, acks) === 'current').length;
  const Icon = CATEGORY_ICON[sop.category] ?? BookOpen;

  return (
    <li>
      <Link href={`/playbook/${sop.id}`} className="group flex h-full flex-col rounded-2xl border border-[#ece6dc] bg-white p-4 transition hover:border-[#cfc6b8] hover:shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[#6f6a62]">
            <Icon size={18} strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">{sop.category}</p>
              {isDraft(sop) ? <DraftChip /> : null}
              {required && me ? <AckChip state={ackState(me, sop, acks)} /> : null}
            </div>
            <h2 className="mt-1 text-[16px] font-semibold leading-5 text-ink group-hover:text-ink">{sop.title}</h2>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-5 text-[#6f6a62]">{sop.purpose}</p>
        <p className="mt-3 text-[12px] text-[#9a9187]">
          v{sop.version} · {sop.steps.length} steps · {personName(sop.ownerId)}
          {editor ? ` · ${signed}/${people.length} signed` : ''}
        </p>
      </Link>
    </li>
  );
}

function Stat({
  label,
  value,
  note,
  warn = false,
  active,
  onClick
}: {
  label: string;
  value: number | string;
  note: string;
  warn?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        {warn ? <PenLine size={16} className="text-[#7a4e08]" /> : null}
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </>
  );
  const base = `rounded-2xl border bg-white p-4 text-left ${active ? 'border-ink ring-1 ring-ink' : 'border-[#ece6dc]'}`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${base} transition hover:border-[#d9cfc0] hover:shadow-sm`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}
