'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, UserX } from 'lucide-react';
import { Avatar, FilterField, PillSearch } from '../ui/DataTable';
import { AckChip } from './Sop';
import { useDemo } from '../../lib/demo-store';
import { TODAY, shortDate, timeLabel } from '../../lib/format';
import { ROLE_LABEL } from '../../lib/labels';
import { ackState, canDelegate, personName } from '../../lib/playbook';
import { employees } from '../../lib/seed';
import { useSession } from '../../lib/session';
import { Responsibility } from '../../lib/types';

const OWNER_ID = 'p-jordan';

type View = 'all' | 'owner' | 'backup' | 'cover';

function isCovering(duty: Responsibility) {
  return Boolean(duty.coverUntil && duty.coverUntil >= TODAY);
}

export function ResponsibilityMap() {
  const { user } = useSession();
  const { responsibilities, sops, acks, delegationLog } = useDemo();
  const [editing, setEditing] = useState<string | null>(null);
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  if (!user) return null;

  const withOwner = responsibilities.filter((item) => item.ownerId === OWNER_ID);
  const noBackup = responsibilities.filter((item) => !item.backupId);
  const covering = responsibilities.filter(isCovering);
  const manage = canDelegate(user.role);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return responsibilities.filter((duty) => {
      if (view === 'owner' && duty.ownerId !== OWNER_ID) return false;
      if (view === 'backup' && duty.backupId) return false;
      if (view === 'cover' && !isCovering(duty)) return false;
      if (!q) return true;
      const sop = sops.find((item) => item.id === duty.sopId);
      return `${duty.functionName} ${duty.description} ${personName(duty.ownerId)} ${personName(duty.backupId)} ${sop?.title ?? ''}`.toLowerCase().includes(q);
    });
  }, [responsibilities, sops, view, query]);

  const views: { id: View; label: string; count: number }[] = [
    { id: 'all', label: 'All functions', count: responsibilities.length },
    { id: 'owner', label: 'Still with Kay', count: withOwner.length },
    { id: 'backup', label: 'No backup', count: noBackup.length },
    { id: 'cover', label: 'Covering', count: covering.length }
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {views.map((item) => (
          <Stat
            key={item.id}
            label={item.label === 'All functions' ? 'Functions' : item.label}
            value={item.count}
            note={
              item.id === 'all'
                ? 'Named parts of the business'
                : item.id === 'owner'
                  ? withOwner.length ? 'Kay is still operating these' : 'Mostly handed off'
                  : item.id === 'backup'
                    ? noBackup.length ? 'Cover is missing' : 'Every function has a backup'
                    : covering.length
                      ? 'Temporary ownership'
                      : 'Nobody is covering'
            }
            warn={(item.id === 'owner' && withOwner.length > 1) || (item.id === 'backup' && noBackup.length > 0)}
            active={view === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
      </section>

      <section className="rounded-2xl border border-[#ece6dc] bg-white">
        <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
          <FilterField label="Search">
            <PillSearch value={query} onChange={setQuery} placeholder="Function, person, or SOP…" width="w-64" />
          </FilterField>
          {query || view !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setView('all');
              }}
              className="h-10 px-2 text-sm font-medium text-copper hover:underline"
            >
              Clear
            </button>
          ) : null}
          <p className="ml-auto self-center text-[13px] text-[#9a9187]">
            {manage ? 'Hand a function off, or set cover, from any card.' : 'Only the owner can change who holds a function.'}
          </p>
        </div>

        {list.length === 0 ? (
          <div className="border-t border-[#f0ebe3] px-5 py-14 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
              <Search size={18} />
            </span>
            <p className="mt-3 font-medium text-ink">No functions match</p>
            <p className="mt-1 text-sm text-muted">Try another filter or search term.</p>
          </div>
        ) : (
          <ul className="space-y-3 border-t border-[#f0ebe3] bg-[#faf8f5] p-5">
            {list.map((duty) => {
              const sop = sops.find((item) => item.id === duty.sopId);
              const ownerState = sop ? ackState(duty.ownerId, sop, acks) : undefined;
              const onOwner = duty.ownerId === OWNER_ID;
              const cover = isCovering(duty);
              const open = editing === duty.id;
              return (
                <li key={duty.id} className={`rounded-2xl border bg-white ${open ? 'border-ink' : 'border-[#ece6dc]'}`}>
                  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-[15px] font-semibold text-ink">{duty.functionName}</h3>
                        {onOwner ? <Chip tone="warn">Kay still owns</Chip> : null}
                        {!duty.backupId ? <Chip tone="risk">No backup</Chip> : null}
                        {cover ? <Chip tone="warn">Cover until {shortDate(duty.coverUntil!)}</Chip> : null}
                        {!duty.delegable ? <Chip>Owner only</Chip> : null}
                        {!sop ? <Chip tone="risk">No SOP</Chip> : null}
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-[#6f6a62]">{duty.description}</p>
                      <p className="mt-1 text-[12px] text-[#9a9187]">{duty.cadence}</p>
                    </div>
                    <dl className="grid min-w-0 flex-1 grid-cols-3 gap-3">
                      <Seat label="Owner" id={duty.ownerId} />
                      <Seat label="Backup" id={duty.backupId} empty="None" />
                      <Seat label="Approver" id={duty.approverId} empty="—" />
                    </dl>
                    <div className="flex shrink-0 flex-col items-start gap-2 lg:w-52 lg:items-end">
                      {sop ? (
                        <Link href={`/playbook/${sop.id}`} className="text-[13px] font-medium text-ink hover:text-copper lg:text-right">
                          {sop.title}
                        </Link>
                      ) : (
                        <p className="text-[13px] font-semibold text-[#9f2d2d] lg:text-right">Write an SOP first</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                        {ownerState ? <AckChip state={ownerState} /> : null}
                      </div>
                      <p className="text-[12px] leading-4 text-[#9a9187] lg:text-right">{duty.readiness}</p>
                      {manage ? (
                        <button
                          type="button"
                          onClick={() => setEditing(open ? null : duty.id)}
                          className="h-9 rounded-xl bg-ink px-3 text-[13px] font-semibold text-white hover:bg-black"
                        >
                          {open ? 'Close' : 'Hand off'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {manage && open ? (
                    <div className="border-t border-[#f0ebe3] bg-[#faf8f5] px-4 py-4">
                      <HandoffForm duty={duty} onDone={() => setEditing(null)} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
        <div className="border-b border-[#f0ebe3] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">Delegation log</h2>
          <p className="mt-0.5 text-[12px] text-[#9a9187]">Every change to who owns, backs up, or approves a function.</p>
        </div>
        <ol className="divide-y divide-[#f0ebe3] text-sm">
          {delegationLog.map((entry) => (
            <li key={entry.id} className="px-5 py-3">
              <p>
                <span className="font-semibold text-ink">{entry.action}</span>
                <span className="text-[#6f6a62]"> · {entry.detail}</span>
              </p>
              <p className="mt-0.5 text-xs text-[#9a9187]">
                {entry.actor} · {timeLabel(entry.at)}
              </p>
            </li>
          ))}
          {delegationLog.length === 0 ? <li className="px-5 py-6 text-sm text-[#9a9187]">No changes recorded in this session.</li> : null}
        </ol>
      </section>
    </div>
  );
}

function Seat({ label, id, empty }: { label: string; id?: string; empty?: string }) {
  const person = id ? employees.find((item) => item.id === id) : undefined;
  return (
    <div>
      <dt className="text-[11px] font-medium text-[#9a9187]">{label}</dt>
      <dd className="mt-1.5">
        {person ? (
          <Link href={`/workforce/${person.id}`} className="flex items-center gap-2 hover:text-copper">
            <Avatar name={person.name} tone="person" size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-ink">{person.name}</span>
              <span className="block truncate text-[11px] text-[#9a9187]">{person.title}</span>
            </span>
          </Link>
        ) : empty === 'None' ? (
          <span className="flex items-center gap-2 text-[13px] font-semibold text-[#9f2d2d]">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-[#d9a9a3] text-[#b33a3a]">
              <UserX size={13} />
            </span>
            None
          </span>
        ) : (
          <span className="text-[13px] text-[#9a9187]">{empty ?? personName(id)}</span>
        )}
      </dd>
    </div>
  );
}

function Chip({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'warn' | 'risk' }) {
  const styles = {
    muted: 'bg-[#f3efe6] text-[#6f6a62]',
    warn: 'bg-[#f8ecd4] text-[#7a4e08]',
    risk: 'bg-[#f6dedb] text-[#9f2d2d]'
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>{children}</span>;
}

function HandoffForm({ duty, onDone }: { duty: Responsibility; onDone: () => void }) {
  const { user } = useSession();
  const { delegate, sops, acks } = useDemo();
  const [ownerId, setOwnerId] = useState(duty.ownerId);
  const [backupId, setBackupId] = useState(duty.backupId ?? '');
  const [approverId, setApproverId] = useState(duty.approverId ?? '');
  const [coverUntil, setCoverUntil] = useState(duty.coverUntil ?? '');
  const [error, setError] = useState<string | null>(null);
  const sop = sops.find((item) => item.id === duty.sopId);
  const newOwnerState = sop ? ackState(ownerId, sop, acks) : undefined;
  const people = employees.filter((person) => person.role !== 'contractor');

  const warnings: string[] = [];
  if (ownerId === backupId && backupId) warnings.push('Owner and backup are the same person.');
  if (ownerId === approverId && approverId) warnings.push('The owner would be approving their own work.');
  if (!sop && ownerId !== duty.ownerId) warnings.push('There is no written SOP for this function yet. The new owner will be working from memory.');
  if (sop && ownerId !== duty.ownerId && newOwnerState !== 'current') warnings.push(`${personName(ownerId)} has not signed off on the current version of ${sop.title}.`);
  if (coverUntil && !backupId) warnings.push('Cover needs a backup.');

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (coverUntil && !backupId) {
          setError('Name a backup before setting cover.');
          return;
        }
        const ok = delegate(
          duty.id,
          {
            ...(duty.delegable ? { ownerId } : {}),
            backupId: backupId || undefined,
            approverId: approverId || undefined,
            coverUntil: coverUntil || undefined
          },
          user!.role,
          user!.name
        );
        if (ok) onDone();
        else setError('Nothing changed.');
      }}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <PersonSelect label="Owner" value={ownerId} onChange={setOwnerId} people={people} disabled={!duty.delegable} />
        <PersonSelect label="Backup" value={backupId} onChange={setBackupId} people={people} allowNone />
        <PersonSelect label="Approver" value={approverId} onChange={setApproverId} people={people} allowNone />
        <label className="grid gap-1">
          <span className="pl-1 text-[12px] font-medium text-[#8a8278]">Backup covers until</span>
          <input type="date" value={coverUntil} min={TODAY} onChange={(event) => setCoverUntil(event.target.value)} className="h-10 rounded-full bg-white px-4 text-sm outline-none ring-copper/30 focus:ring-2" />
        </label>
      </div>
      {!duty.delegable ? <p className="text-xs font-semibold text-ink">{duty.functionName} stays with the owner. Backup and approver can still change.</p> : null}
      {warnings.length > 0 ? (
        <ul className="list-disc rounded-xl border border-[#ecd9b4] bg-[#fbf3e3] py-2 pl-8 pr-3 text-xs leading-5">
          {warnings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-xs font-semibold text-[#9f2d2d]">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="h-10 rounded-xl border border-[#ece6dc] bg-white px-4 text-sm font-semibold text-ink hover:border-ink">
          Cancel
        </button>
        <button type="submit" className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-black">
          Save handoff
        </button>
      </div>
    </form>
  );
}

function PersonSelect({
  label,
  value,
  onChange,
  people,
  allowNone,
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  people: typeof employees;
  allowNone?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1">
      <span className="pl-1 text-[12px] font-medium text-[#8a8278]">{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-10 appearance-none rounded-full bg-white px-4 text-sm outline-none ring-copper/30 focus:ring-2 disabled:opacity-60">
        {allowNone ? <option value="">None</option> : null}
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name} · {ROLE_LABEL[person.role]}
          </option>
        ))}
      </select>
    </label>
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
  value: number;
  note: string;
  warn?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-white p-4 text-left transition ${active ? 'border-ink ring-1 ring-ink' : 'border-[#ece6dc] hover:border-[#d9cfc0] hover:shadow-sm'}`}
    >
      <p className="text-[13px] font-medium text-[#6f6a62]">{label}</p>
      <p className={`mt-2 font-display text-3xl leading-none tabular ${warn ? 'text-[#9a6700]' : 'text-ink'}`}>{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </button>
  );
}
