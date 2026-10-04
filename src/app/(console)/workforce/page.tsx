'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, BookOpenCheck, CalendarClock, ChevronRight, HardHat, LayoutGrid, List, MapPin, Phone, ShieldCheck, Users, Waypoints } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { Avatar, FilterField, PillSearch, PillSelect, RowMenu } from '../../../components/ui/DataTable';
import { DocChip } from '../../../components/workforce/Compliance';
import { DocState, worstDocState } from '../../../lib/compliance';
import { useDemo } from '../../../lib/demo-store';
import { TODAY, clockTime, longDate, shortDate } from '../../../lib/format';
import { ROLE_LABEL, SERVICE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { ackState, requiredSops } from '../../../lib/playbook';
import { isOpen, propertyById } from '../../../lib/records';
import { employees } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { Employee, WorkOrder } from '../../../lib/types';

type Group = 'all' | 'field' | 'office' | 'attention';
type SortId = 'load' | 'name' | 'tenure';

type Person = {
  employee: Employee;
  field: boolean;
  open: WorkOrder[];
  today: WorkOrder[];
  next?: WorkOrder;
  onSite?: WorkOrder;
  required: number;
  signed: number;
  certs: DocState | 'missing';
  hasCerts: boolean;
};

const STATUS = {
  on_site: { label: 'On site', dot: 'bg-amber', tone: 'bg-amber/20 text-[#7a4e08]' },
  on_job: { label: 'On a job', dot: 'bg-amber', tone: 'bg-amber/20 text-[#7a4e08]' },
  available: { label: 'Available', dot: 'bg-[#2f7a4a]', tone: 'bg-[#e5f0e4] text-[#1d5a32]' },
  off: { label: 'Off today', dot: 'bg-[#b5ada2]', tone: 'bg-[#efece6] text-[#6f6a62]' }
} as const;

function statusOf(person: Person) {
  if (person.onSite) return STATUS.on_site;
  return STATUS[person.employee.status];
}

function needsAttention(person: Person) {
  return person.signed < person.required || person.certs === 'expired' || person.certs === 'expiring';
}

const GROUPS: { id: Group; label: string; test: (person: Person) => boolean }[] = [
  { id: 'all', label: 'Everyone', test: () => true },
  { id: 'field', label: 'Field crew', test: (person) => person.field },
  { id: 'office', label: 'Office', test: (person) => !person.field },
  { id: 'attention', label: 'Needs attention', test: needsAttention }
];

function tenure(startedAt: string) {
  const [y, m] = startedAt.split('-').map(Number);
  const [ty, tm] = TODAY.split('-').map(Number);
  const months = (ty - y) * 12 + (tm - m);
  if (months < 1) return 'New this month';
  if (months < 12) return `${months} mo with us`;
  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? '' : 's'} with us`;
}

export default function WorkforcePage() {
  const { orders, documents, sops, acks } = useDemo();
  const { user } = useSession();
  const router = useRouter();
  const canDispatch = user ? can(user.role, 'dispatch.read') : false;
  const [group, setGroup] = useState<Group>('all');
  const [query, setQuery] = useState('');
  const [base, setBase] = useState('all');
  const [sort, setSort] = useState<SortId>('load');
  const [layout, setLayout] = useState<'grid' | 'table'>('grid');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const people = useMemo<Person[]>(
    () =>
      employees.map((employee) => {
        const open = orders.filter((order) => order.assigneeId === employee.id && isOpen(order));
        const byTime = (a: WorkOrder, b: WorkOrder) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? '');
        const today = open.filter((order) => order.scheduledStart?.startsWith(TODAY)).sort(byTime);
        const onSite = open.find((order) => order.checkedInAt && !order.checkedOutAt);
        const next = open
          .filter((order) => order !== onSite && order.scheduledStart && order.scheduledStart.slice(0, 10) >= TODAY && !order.checkedOutAt)
          .sort(byTime)[0];
        const required = requiredSops(employee.role, sops);
        return {
          employee,
          field: employee.role === 'field',
          open,
          today,
          next,
          onSite,
          required: required.length,
          signed: required.filter((sop) => ackState(employee.id, sop, acks) === 'current').length,
          certs: worstDocState(employee.id, documents),
          hasCerts: documents.some((file) => file.relatedId === employee.id)
        };
      }),
    [orders, documents, sops, acks]
  );

  const bases = Array.from(new Set(employees.map((employee) => employee.base))).sort();

  const list = useMemo(() => {
    const test = GROUPS.find((item) => item.id === group)?.test ?? (() => true);
    const q = query.trim().toLowerCase();
    return people
      .filter(test)
      .filter((person) => base === 'all' || person.employee.base === base)
      .filter((person) => !q || `${person.employee.name} ${person.employee.title} ${person.employee.base}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'name') return a.employee.name.localeCompare(b.employee.name);
        if (sort === 'tenure') return a.employee.startedAt.localeCompare(b.employee.startedAt);
        return Number(b.field) - Number(a.field) || b.open.length - a.open.length || a.employee.name.localeCompare(b.employee.name);
      });
  }, [people, group, base, query, sort]);

  const crew = people.filter((person) => person.field);
  const visitsToday = crew.reduce((sum, person) => sum + person.today.length, 0);
  const busy = crew.filter((person) => person.onSite || person.employee.status === 'on_job').length;
  const trainingGaps = people.filter((person) => person.signed < person.required).length;
  const certAlerts = people.filter((person) => person.certs === 'expired' || person.certs === 'expiring').length;

  return (
    <Gate permission="workforce.read" title="Workforce is limited" body="Employee records are for dispatch and operations.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Directory</p>
            <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Workforce</h1>
            <p className="mt-3 max-w-xl text-sm text-muted">People on the company payroll, how loaded they are today, and whether their training and certifications are current.</p>
          </div>
          {canDispatch ? (
            <div className="flex items-center gap-2">
              <Link href="/calendar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e6dfd4] bg-white px-4 text-sm font-medium text-ink transition hover:border-[#cfc6b8]">
                <CalendarClock size={15} />
                Calendar
              </Link>
              <Link href="/dispatch" className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black">
                <Waypoints size={15} />
                Dispatch board
              </Link>
            </div>
          ) : null}
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Users size={16} />} label="On the payroll" value={people.length} note={`${crew.length} field · ${people.length - crew.length} office`} />
          <Stat icon={<HardHat size={16} />} label="Crew working now" value={busy} note={`${crew.length - busy} of ${crew.length} free · ${visitsToday} visits today`} />
          <Stat
            icon={<BookOpenCheck size={16} />}
            label="Training gaps"
            value={trainingGaps}
            note={trainingGaps ? 'Unsigned playbook procedures' : 'Everyone is signed off'}
            warn
            onClick={() => setGroup('attention')}
          />
          <Stat
            icon={<ShieldCheck size={16} />}
            label="Certification alerts"
            value={certAlerts}
            note={certAlerts ? 'Expired or inside 30 days' : 'All certifications current'}
            warn
            onClick={() => setGroup('attention')}
          />
        </section>

        <nav aria-label="Groups" className="flex flex-wrap gap-1.5">
          {GROUPS.map((item) => {
            const active = item.id === group;
            const count = people.filter(item.test).length;
            const alert = item.id === 'attention' && count > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setGroup(item.id)}
                aria-pressed={active}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm transition ${
                  active ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-[#4a443d] hover:border-[#cfc6b8] hover:text-ink'
                }`}
              >
                {item.label}
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${
                    active ? 'bg-white/15 text-white' : alert ? 'bg-[#f8ecd4] text-[#7a4e08]' : 'bg-[#f3efe6] text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder="Name, title, or base…" width="w-60" />
            </FilterField>
            <FilterField label="Base">
              <PillSelect value={base} onChange={setBase} width="w-44">
                <option value="all">All bases</option>
                {bases.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            {query || base !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setBase('all');
                }}
                className="h-10 px-2 text-sm font-medium text-copper hover:underline"
              >
                Clear
              </button>
            ) : null}
            <div className="ml-auto flex items-end gap-3">
              <FilterField label="Sort by">
                <PillSelect value={sort} onChange={(value) => setSort(value as SortId)} width="w-40">
                  <option value="load">Workload</option>
                  <option value="name">Name A–Z</option>
                  <option value="tenure">Longest tenure</option>
                </PillSelect>
              </FilterField>
              <div className="flex h-10 items-center gap-0.5 rounded-full bg-[#f6f3ee] p-1" role="group" aria-label="Layout">
                {(['grid', 'table'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLayout(item)}
                    aria-label={item === 'grid' ? 'Card view' : 'Table view'}
                    aria-pressed={layout === item}
                    className={`grid h-8 w-9 place-items-center rounded-full transition ${layout === item ? 'bg-white text-ink shadow-sm' : 'text-[#8a8278] hover:text-ink'}`}
                  >
                    {item === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#f0ebe3] px-5 py-2.5 text-[12px] text-[#8a8278]">
            Showing <span className="font-semibold text-ink tabular">{list.length}</span> of {people.length} people
          </div>

          {list.length === 0 ? (
            <div className="border-t border-[#f0ebe3] px-5 py-14 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
                <Users size={18} />
              </span>
              <p className="mt-3 font-medium text-ink">Nobody matches</p>
              <p className="mt-1 text-sm text-muted">Try another group, base, or search term.</p>
            </div>
          ) : layout === 'grid' ? (
            <div className="grid gap-4 border-t border-[#f0ebe3] bg-[#faf8f5] p-5 md:grid-cols-2 xl:grid-cols-3">
              {list.map((person) => (
                <PersonCard key={person.employee.id} person={person} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-[#f0ebe3]">
              <table className="w-full min-w-[940px] text-sm">
                <thead>
                  <tr className="text-left text-[12px] text-[#8a8278]">
                    <th className="px-5 py-3 font-medium">Person</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Base</th>
                    <th className="px-3 py-3 text-right font-medium">Today</th>
                    <th className="px-3 py-3 text-right font-medium">Open</th>
                    <th className="px-3 py-3 font-medium">Next up</th>
                    <th className="px-3 py-3 font-medium">Training</th>
                    <th className="px-3 py-3 font-medium">Certifications</th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((person) => {
                    const { employee } = person;
                    const status = statusOf(person);
                    const upcoming = person.onSite ?? person.next;
                    return (
                      <tr key={employee.id} onClick={() => router.push(`/workforce/${employee.id}`)} className="cursor-pointer border-t border-[#f3efe8] transition hover:bg-[#faf8f5]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={employee.name} tone="person" />
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-ink">{employee.name}</div>
                              <div className="truncate text-xs text-muted">{employee.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill status={status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-[#4a443d]">{employee.base}</td>
                        <td className="px-3 py-3 text-right tabular">{person.field ? person.today.length : <span className="text-[#b5ada2]">—</span>}</td>
                        <td className="px-3 py-3 text-right tabular">{person.field ? person.open.length : <span className="text-[#b5ada2]">—</span>}</td>
                        <td className="px-3 py-3 text-[13px] text-[#4a443d]">
                          {upcoming ? (
                            <span className="whitespace-nowrap">
                              {upcoming.number} · {person.onSite === upcoming ? 'now' : upcoming.scheduledStart ? clockTime(upcoming.scheduledStart) || shortDate(upcoming.scheduledStart) : ''}
                            </span>
                          ) : (
                            <span className="text-[#b5ada2]">{person.field ? 'Nothing booked' : 'Office role'}</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <TrainingMeter signed={person.signed} required={person.required} compact />
                        </td>
                        <td className="px-3 py-3">{person.hasCerts ? <DocChip state={person.certs} /> : <span className="text-[12px] text-[#b5ada2]">None required</span>}</td>
                        <td className="px-3 py-3 text-right">
                          <RowMenu
                            label={`Actions for ${employee.name}`}
                            open={menuFor === employee.id}
                            onToggle={() => setMenuFor((current) => (current === employee.id ? null : employee.id))}
                            onClose={() => setMenuFor(null)}
                            items={[
                              { href: `/workforce/${employee.id}`, label: 'Open profile' },
                              ...(person.field && canDispatch ? [{ href: '/dispatch', label: 'Assign on dispatch board' }] : []),
                              ...(upcoming ? [{ href: `/work-orders/${upcoming.id}`, label: `Open ${upcoming.number}` }] : [])
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Gate>
  );
}

function Stat({ icon, label, value, note, warn = false, onClick }: { icon: React.ReactNode; label: string; value: number; note: string; warn?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${warn && value > 0 ? 'bg-[#f8ecd4] text-[#7a4e08]' : 'bg-[#f3efe8] text-[#6f6a62]'}`}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </>
  );
  const base = 'rounded-2xl border border-[#ece6dc] bg-white p-4 text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} transition hover:border-[#d9cfc0] hover:shadow-sm`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}

function StatusPill({ status }: { status: (typeof STATUS)[keyof typeof STATUS] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}

function TrainingMeter({ signed, required, compact = false }: { signed: number; required: number; compact?: boolean }) {
  if (required === 0) return <span className="text-[12px] text-[#b5ada2]">None required</span>;
  const pct = Math.round((signed / required) * 100);
  const done = signed === required;
  return (
    <div className={compact ? 'w-28' : ''}>
      <div className="flex items-center justify-between text-[12px]">
        <span className={`font-semibold tabular ${done ? 'text-[#2f7a4a]' : 'text-[#7a4e08]'}`}>
          {signed}/{required} signed
        </span>
        {!compact ? <span className="text-[#9a9187]">{done ? 'Up to date' : `${required - signed} to read`}</span> : null}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0ebe3]">
        <div className={`h-full rounded-full ${done ? 'bg-[#2f7a4a]' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PersonCard({ person }: { person: Person }) {
  const { employee } = person;
  const status = statusOf(person);
  const upcoming = person.onSite ?? person.next;
  const place = upcoming ? propertyById(upcoming.propertyId) : undefined;
  const alert = needsAttention(person);

  return (
    <Link
      href={`/workforce/${employee.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#ece6dc] bg-white transition hover:-translate-y-0.5 hover:border-[#d9cfc0] hover:shadow-[0_10px_30px_-18px_rgba(28,25,21,0.35)]"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f3e2cc] text-sm font-semibold text-[#7a4a14]">
            {employee.name
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')}
          </span>
          <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${status.dot}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-[15px] font-semibold text-ink">{employee.name}</h2>
            <StatusPill status={status} />
          </div>
          <p className="truncate text-[13px] text-muted">
            {employee.title}
            {ROLE_LABEL[employee.role].toLowerCase().includes(employee.title.toLowerCase()) ? '' : ` · ${ROLE_LABEL[employee.role]}`}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[#8a8278]">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {employee.base}
            </span>
            <span className="inline-flex items-center gap-1 tabular">
              <Phone size={12} /> {employee.phone}
            </span>
          </p>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-[#faf8f5] px-3 py-2.5">
        {person.field ? (
          upcoming ? (
            <div className="flex items-center gap-2.5">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${person.onSite === upcoming ? 'bg-amber/25 text-[#7a4e08]' : 'bg-white text-[#6f6a62]'}`}>
                <CalendarClock size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a9187]">
                  {person.onSite === upcoming ? 'On site now' : `Next · ${upcoming.scheduledStart ? `${shortDate(upcoming.scheduledStart)} ${clockTime(upcoming.scheduledStart)}` : ''}`}
                </p>
                <p className="truncate text-[13px] font-medium text-ink">
                  {SERVICE_LABEL[upcoming.service]} · {place?.name}
                </p>
              </div>
            </div>
          ) : (
            <p className="py-1.5 text-[13px] text-[#8a8278]">Nothing booked. Free for dispatch.</p>
          )
        ) : (
          <p className="py-1.5 text-[13px] text-[#8a8278]">Office role · not dispatched to jobs</p>
        )}
      </div>

      <dl className="grid grid-cols-3 divide-x divide-[#f0ebe3] px-1 py-3 text-center">
        <div>
          <dt className="text-[11px] text-[#9a9187]">Today</dt>
          <dd className={`mt-0.5 text-[15px] font-semibold tabular ${person.field ? 'text-ink' : 'text-[#c9c1b5]'}`}>{person.field ? person.today.length : '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#9a9187]">Open jobs</dt>
          <dd className={`mt-0.5 text-[15px] font-semibold tabular ${person.field ? 'text-ink' : 'text-[#c9c1b5]'}`}>{person.field ? person.open.length : '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#9a9187]">Joined</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-ink" title={longDate(employee.startedAt)}>
            {tenure(employee.startedAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto space-y-3 border-t border-[#f0ebe3] px-4 py-3">
        <TrainingMeter signed={person.signed} required={person.required} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-[#8a8278]">Certifications</span>
          <span className="flex items-center gap-1.5">
            {person.hasCerts ? <DocChip state={person.certs} /> : <span className="text-[12px] text-[#b5ada2]">None required</span>}
            <ChevronRight size={14} className="text-[#c9c1b5] transition group-hover:translate-x-0.5 group-hover:text-ink" />
          </span>
        </div>
      </div>
      {alert ? (
        <div className="flex items-center gap-2 border-t border-[#f3e4c4] bg-[#fdf7ec] px-4 py-2 text-[12px] font-medium text-[#7a4e08]">
          <AlertTriangle size={13} />
          {person.signed < person.required ? `${person.required - person.signed} procedure${person.required - person.signed === 1 ? '' : 's'} to sign` : ''}
          {person.signed < person.required && (person.certs === 'expired' || person.certs === 'expiring') ? ' · ' : ''}
          {person.certs === 'expired' ? 'Certification expired' : person.certs === 'expiring' ? 'Certification expiring soon' : ''}
        </div>
      ) : null}
    </Link>
  );
}
