'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, ChevronRight, ClipboardCheck, LayoutGrid, List, MapPin, ShieldCheck, Star, UserCheck, Waypoints } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { Avatar, FilterField, PillSearch, PillSelect, RowMenu } from '../../../components/ui/DataTable';
import { DocChip } from '../../../components/workforce/Compliance';
import {
  ONBOARDING,
  complianceGaps,
  complianceWarnings,
  docState,
  docStateLabel,
  eligibleForWork,
  worstDocState
} from '../../../lib/compliance';
import { useDemo } from '../../../lib/demo-store';
import { CONTRACTOR_STATUS_LABEL, SERVICE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { isOpen } from '../../../lib/records';
import { useSession } from '../../../lib/session';
import { Contractor, ContractorStatus, JobDocument, ServiceType, WorkOrder } from '../../../lib/types';

type ViewId = 'all' | 'eligible' | 'onboarding' | 'attention';
type SortId = 'ready' | 'rating' | 'jobs' | 'name';

type Row = {
  contractor: Contractor;
  open: WorkOrder[];
  eligible: boolean;
  papers: ReturnType<typeof worstDocState>;
  gaps: string[];
  warnings: string[];
  files: JobDocument[];
};

const STAGE_TONE: Record<ContractorStatus, { label: string; tone: string; dot: string }> = {
  application: { label: 'Application', tone: 'bg-[#efece6] text-[#6f6a62]', dot: 'bg-[#b5ada2]' },
  review: { label: 'In review', tone: 'bg-[#e4ecf4] text-[#1e3a5f]', dot: 'bg-[#3b6ea5]' },
  document_verification: { label: 'Docs in review', tone: 'bg-[#f8ecd4] text-[#7a4e08]', dot: 'bg-amber' },
  approved: { label: 'Approved', tone: 'bg-[#ede7f6] text-[#4b3a78]', dot: 'bg-[#6b4fa0]' },
  active: { label: 'Active', tone: 'bg-[#e5f0e4] text-[#1d5a32]', dot: 'bg-[#2f7a4a]' },
  suspended: { label: 'Suspended', tone: 'bg-[#f6dedb] text-[#9f2d2d]', dot: 'bg-[#9f2d2d]' }
};

function needsAttention(row: Row) {
  return row.contractor.status === 'suspended' || row.gaps.length > 0 || row.warnings.length > 0 || row.papers === 'expired' || row.papers === 'expiring';
}

function inOnboarding(status: ContractorStatus) {
  return status !== 'active' && status !== 'suspended';
}

const VIEWS: { id: ViewId; label: string; test: (row: Row) => boolean }[] = [
  { id: 'all', label: 'All companies', test: () => true },
  { id: 'eligible', label: 'Ready to dispatch', test: (row) => row.eligible },
  { id: 'onboarding', label: 'In onboarding', test: (row) => inOnboarding(row.contractor.status) },
  { id: 'attention', label: 'Needs attention', test: needsAttention }
];

export default function ContractorsPage() {
  const { orders, contractors, documents } = useDemo();
  const { user } = useSession();
  const router = useRouter();
  const canDispatch = user ? can(user.role, 'dispatch.read') : false;

  const [view, setView] = useState<ViewId>('all');
  const [query, setQuery] = useState('');
  const [trade, setTrade] = useState<ServiceType | 'all'>('all');
  const [stage, setStage] = useState<ContractorStatus | 'all'>('all');
  const [sort, setSort] = useState<SortId>('ready');
  const [layout, setLayout] = useState<'grid' | 'table'>('grid');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      contractors.map((contractor) => {
        const files = documents.filter((file) => file.relatedId === contractor.id);
        return {
          contractor,
          open: orders.filter((order) => order.contractorId === contractor.id && isOpen(order)),
          eligible: eligibleForWork(contractor, documents),
          papers: worstDocState(contractor.id, documents),
          gaps: complianceGaps(contractor.id, documents),
          warnings: complianceWarnings(contractor.id, documents),
          files
        };
      }),
    [contractors, documents, orders]
  );

  const trades = useMemo(() => Array.from(new Set(contractors.flatMap((item) => item.trades))), [contractors]);
  const renewals = documents
    .filter((file) => file.relatedId.startsWith('c-') && ['expired', 'expiring'].includes(docState(file)))
    .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''));

  const list = useMemo(() => {
    const test = VIEWS.find((item) => item.id === view)?.test ?? (() => true);
    const q = query.trim().toLowerCase();
    return rows
      .filter(test)
      .filter((row) => trade === 'all' || row.contractor.trades.includes(trade))
      .filter((row) => stage === 'all' || row.contractor.status === stage)
      .filter((row) => {
        if (!q) return true;
        const { contractor } = row;
        return `${contractor.company} ${contractor.contactName} ${contractor.serviceArea} ${contractor.trades.map((item) => SERVICE_LABEL[item]).join(' ')}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === 'name') return a.contractor.company.localeCompare(b.contractor.company);
        if (sort === 'rating') return (b.contractor.rating || 0) - (a.contractor.rating || 0);
        if (sort === 'jobs') return b.contractor.jobsCompleted - a.contractor.jobsCompleted;
        return Number(b.eligible) - Number(a.eligible) || Number(needsAttention(a)) - Number(needsAttention(b)) || a.contractor.company.localeCompare(b.contractor.company);
      });
  }, [rows, view, trade, stage, query, sort]);

  const eligible = rows.filter((row) => row.eligible).length;
  const onboarding = rows.filter((row) => inOnboarding(row.contractor.status)).length;
  const alerts = rows.filter(needsAttention).length;
  const filtersOn = Boolean(query) || trade !== 'all' || stage !== 'all';

  return (
    <Gate permission="contractors.read" title="Contractors are limited" body="The contractor directory is for dispatch and operations.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Directory</p>
            <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Contractors</h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Trades, coverage, and whether paperwork is current enough to take work. Only active companies with a license and insurance on file can be dispatched.
            </p>
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
          <Stat icon={<ClipboardCheck size={16} />} label="On the roster" value={rows.length} note={`${eligible} active and eligible · ${onboarding} still in pipeline`} />
          <Stat icon={<UserCheck size={16} />} label="Ready to dispatch" value={eligible} note={`${eligible} of ${rows.length} can take work today`} onClick={() => setView('eligible')} />
          <Stat icon={<ShieldCheck size={16} />} label="Still onboarding" value={onboarding} note="Application through approval" onClick={() => setView('onboarding')} />
          <Stat icon={<AlertTriangle size={16} />} label="Needs attention" value={alerts} note="Holds, missing papers, or renewals" warn onClick={() => setView('attention')} />
        </section>

        {renewals.length > 0 && view === 'all' ? (
          <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#f0dcb4] bg-[#fdf7ec] px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f8ecd4] text-[#7a4e08]">
              <AlertTriangle size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {renewals.length} {renewals.length === 1 ? 'file needs' : 'files need'} renewal
              </p>
              <p className="truncate text-[13px] text-[#7a6a52]">
                {renewals.map((file) => `${file.related} · ${file.name} (${docStateLabel(file).toLowerCase()})`).join(' · ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView('attention')}
              className="h-9 shrink-0 rounded-full border border-[#e9d3a8] bg-white px-4 text-[13px] font-semibold text-[#7a4e08] transition hover:border-[#d9b779]"
            >
              Review paperwork
            </button>
          </section>
        ) : null}

        <nav aria-label="Saved views" className="flex flex-wrap gap-1.5">
          {VIEWS.map((item) => {
            const active = item.id === view;
            const count = rows.filter(item.test).length;
            const alert = item.id === 'attention' && count > 0;
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

        <nav aria-label="Onboarding stages" className="flex flex-wrap gap-1.5">
          {(['all', ...ONBOARDING, 'suspended'] as const).map((item) => {
            const active = stage === item;
            const count = item === 'all' ? rows.length : rows.filter((row) => row.contractor.status === item).length;
            if (item !== 'all' && count === 0) return null;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setStage(item)}
                aria-pressed={active}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition ${
                  active ? 'bg-white font-semibold text-ink ring-1 ring-ink' : 'bg-[#f6f3ee] text-[#6f6a62] hover:text-ink'
                }`}
              >
                {item === 'all' ? 'Any stage' : CONTRACTOR_STATUS_LABEL[item]}
                <span className="tabular text-[11px] text-[#9a9187]">{count}</span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder="Company, contact, trade, area…" width="w-64" />
            </FilterField>
            <FilterField label="Trade">
              <PillSelect value={trade} onChange={(value) => setTrade(value as ServiceType | 'all')} width="w-44">
                <option value="all">All trades</option>
                {trades.map((item) => (
                  <option key={item} value={item}>
                    {SERVICE_LABEL[item]}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            {filtersOn ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setTrade('all');
                  setStage('all');
                }}
                className="h-10 px-2 text-sm font-medium text-copper hover:underline"
              >
                Clear
              </button>
            ) : null}
            <div className="ml-auto flex items-end gap-3">
              <FilterField label="Sort by">
                <PillSelect value={sort} onChange={(value) => setSort(value as SortId)} width="w-44">
                  <option value="ready">Dispatch ready</option>
                  <option value="rating">Highest rating</option>
                  <option value="jobs">Most jobs</option>
                  <option value="name">Name A–Z</option>
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
            Showing <span className="font-semibold text-ink tabular">{list.length}</span> of {rows.length} companies
          </div>

          {list.length === 0 ? (
            <div className="border-t border-[#f0ebe3] px-5 py-14 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
                <ClipboardCheck size={18} />
              </span>
              <p className="mt-3 font-medium text-ink">No contractors match</p>
              <p className="mt-1 text-sm text-muted">Try another stage, trade, or search term.</p>
            </div>
          ) : layout === 'grid' ? (
            <div className="grid gap-4 border-t border-[#f0ebe3] bg-[#faf8f5] p-5 md:grid-cols-2">
              {list.map((row) => (
                <ContractorCard key={row.contractor.id} row={row} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-[#f0ebe3]">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="text-left text-[12px] text-[#8a8278]">
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-3 py-3 font-medium">Trades</th>
                    <th className="px-3 py-3 font-medium">Stage</th>
                    <th className="px-3 py-3 font-medium">Paperwork</th>
                    <th className="px-3 py-3 text-right font-medium">Open</th>
                    <th className="px-3 py-3 text-right font-medium">Jobs</th>
                    <th className="px-3 py-3 text-right font-medium">On time</th>
                    <th className="px-3 py-3 text-right font-medium">Rating</th>
                    <th className="px-3 py-3 font-medium">Dispatch</th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => {
                    const { contractor } = row;
                    return (
                      <tr key={contractor.id} onClick={() => router.push(`/contractors/${contractor.id}`)} className="cursor-pointer border-t border-[#f3efe8] transition hover:bg-[#faf8f5]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={contractor.company} tone="contractor" />
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-ink">{contractor.company}</div>
                              <div className="truncate text-xs text-muted">{contractor.contactName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-[#4a443d]">{contractor.trades.map((item) => SERVICE_LABEL[item]).join(' · ')}</div>
                          <div className="text-xs text-muted">{contractor.serviceArea}</div>
                        </td>
                        <td className="px-3 py-3">
                          <StagePill status={contractor.status} />
                        </td>
                        <td className="px-3 py-3">
                          <DocChip state={row.papers} />
                        </td>
                        <td className="px-3 py-3 text-right tabular">{row.open.length}</td>
                        <td className="px-3 py-3 text-right tabular">{contractor.jobsCompleted || '—'}</td>
                        <td className="px-3 py-3 text-right tabular">{contractor.onTimeRate ? `${contractor.onTimeRate}%` : '—'}</td>
                        <td className="px-3 py-3 text-right tabular">{contractor.rating ? contractor.rating.toFixed(1) : '—'}</td>
                        <td className="px-3 py-3">
                          <DispatchMark eligible={row.eligible} />
                          <div className="max-w-[160px] truncate text-xs text-muted">{contractor.availability}</div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <RowMenu
                            label={`Actions for ${contractor.company}`}
                            open={menuFor === contractor.id}
                            onToggle={() => setMenuFor((current) => (current === contractor.id ? null : contractor.id))}
                            onClose={() => setMenuFor(null)}
                            items={[
                              { href: `/contractors/${contractor.id}`, label: 'Open profile' },
                              ...(canDispatch ? [{ href: '/dispatch', label: 'Open dispatch board' }] : []),
                              ...(row.open[0] ? [{ href: `/work-orders/${row.open[0].id}`, label: `Open ${row.open[0].number}` }] : [])
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

function Stat({
  icon,
  label,
  value,
  note,
  warn = false,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
  warn?: boolean;
  onClick?: () => void;
}) {
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

function StagePill({ status }: { status: ContractorStatus }) {
  const tone = STAGE_TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}

function DispatchMark({ eligible }: { eligible: boolean }) {
  return eligible ? (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1d5a32]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2f7a4a]" />
      Eligible
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8a8278]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#c9c1b5]" />
      Not eligible
    </span>
  );
}

function ContractorCard({ row }: { row: Row }) {
  const { contractor } = row;
  const alert = needsAttention(row);
  const reason = row.gaps[0] ?? row.warnings[0] ?? (contractor.status === 'suspended' ? 'Suspended. No new assignments.' : '');

  return (
    <Link
      href={`/contractors/${contractor.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#ece6dc] bg-white transition hover:-translate-y-0.5 hover:border-[#d9cfc0] hover:shadow-[0_10px_30px_-18px_rgba(28,25,21,0.35)]"
    >
      <div className="flex items-start gap-3 p-4">
        <Avatar name={contractor.company} tone="contractor" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-[15px] font-semibold text-ink">{contractor.company}</h2>
            <StagePill status={contractor.status} />
          </div>
          <p className="truncate text-[13px] text-muted">{contractor.contactName}</p>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-[#8a8278]">
            <MapPin size={12} />
            <span className="truncate">{contractor.serviceArea}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {contractor.trades.map((item) => (
          <span key={item} className="rounded-full bg-[#f3efe8] px-2.5 py-1 text-[11px] font-medium text-[#5e574e]">
            {SERVICE_LABEL[item]}
          </span>
        ))}
      </div>

      <div className="mx-4 rounded-xl bg-[#faf8f5] px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <DispatchMark eligible={row.eligible} />
          <span className="truncate text-[12px] text-[#8a8278]">{contractor.availability}</span>
        </div>
      </div>

      <dl className="grid grid-cols-4 divide-x divide-[#f0ebe3] px-1 py-3 text-center">
        <div>
          <dt className="text-[11px] text-[#9a9187]">Open</dt>
          <dd className={`mt-0.5 text-[15px] font-semibold tabular ${row.open.length ? 'text-ink' : 'text-[#c9c1b5]'}`}>{row.open.length}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#9a9187]">Jobs</dt>
          <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular">{contractor.jobsCompleted || '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#9a9187]">On time</dt>
          <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular">{contractor.onTimeRate ? `${contractor.onTimeRate}%` : '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#9a9187]">Rating</dt>
          <dd className="mt-0.5 inline-flex items-center justify-center gap-1 text-[15px] font-semibold text-ink tabular">
            {contractor.rating ? (
              <>
                <Star size={12} className="fill-amber text-amber" />
                {contractor.rating.toFixed(1)}
              </>
            ) : (
              <span className="text-[#c9c1b5]">—</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#f0ebe3] px-4 py-3">
        <span className="text-[12px] text-[#8a8278]">Paperwork</span>
        <span className="flex items-center gap-1.5">
          <DocChip state={row.papers} />
          <ChevronRight size={14} className="text-[#c9c1b5] transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </span>
      </div>
      {alert && reason ? (
        <div className="flex items-center gap-2 border-t border-[#f3e4c4] bg-[#fdf7ec] px-4 py-2 text-[12px] font-medium text-[#7a4e08]">
          <AlertTriangle size={13} className="shrink-0" />
          <span className="truncate">{reason}</span>
        </div>
      ) : null}
    </Link>
  );
}
