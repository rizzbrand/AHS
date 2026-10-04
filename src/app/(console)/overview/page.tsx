'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Camera,
  ChevronRight,
  ClipboardList,
  FileWarning,
  Hourglass,
  Receipt,
  UserX,
  Waypoints,
  type LucideIcon
} from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { AssigneeCell, Avatar, FilterField as Field, Pagination, PhotoProgress, PillSearch, PillSelect as Select, RowMenu } from '../../../components/ui/DataTable';
import { PriorityMark, StatusBadge } from '../../../components/ui/StatusBadge';
import { useDemo } from '../../../lib/demo-store';
import { money, shortDate, timeLabel, TODAY } from '../../../lib/format';
import { SERVICE_LABEL, SOURCE_LABEL, STATUS_LABEL, STATUS_ORDER } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { attentionFor, isOpen, isOverdue, propertyById } from '../../../lib/records';
import { auditEvents } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { dueInfo, STAGES } from '../../../lib/stages';
import { JobStatus, SourceId, WorkOrder } from '../../../lib/types';

const PAGE_SIZE = 6;

type AssigneeFilter = 'all' | 'unassigned' | 'team' | 'contractor';

export default function OverviewPage() {
  const { orders, documents } = useDemo();
  const { user } = useSession();
  const showMoney = user ? can(user.role, 'invoices.read') : false;
  const canDispatch = user ? can(user.role, 'dispatch.read') : false;

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<JobStatus | 'all'>('all');
  const [source, setSource] = useState<SourceId | 'all'>('all');
  const [assignee, setAssignee] = useState<AssigneeFilter>('all');
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const open = orders.filter(isOpen);
  const unassigned = open.filter((order) => !order.assigneeId && !order.contractorId);
  const today = orders.filter((order) => order.scheduledStart?.startsWith(TODAY));
  const inProgress = orders.filter((order) => order.status === 'IN_PROGRESS');
  const waiting = orders.filter((order) => ['AWAITING_APPROVAL', 'AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW'].includes(order.status));
  const overdue = orders.filter(isOverdue);
  const urgent = open.filter((order) => order.priority === 'urgent' || order.priority === 'high');
  const receivable = orders.filter((order) => order.paymentStatus === 'invoiced' || order.paymentStatus === 'overdue' || order.paymentStatus === 'partial');
  const receivableTotal = receivable.reduce((sum, order) => sum + (order.approvedAmount ?? order.estimate ?? 0), 0);
  const overdueInvoices = receivable.filter((order) => order.paymentStatus === 'overdue').length;

  const kpis: Kpi[] = [
    { label: 'Open jobs', value: open.length, icon: ClipboardList, note: `${urgent.length} high priority`, tone: urgent.length ? 'warn' : 'muted', href: '/work-orders' },
    { label: 'Unassigned', value: unassigned.length, icon: UserX, note: unassigned.length ? 'Needs a person' : 'All placed', tone: unassigned.length ? 'risk' : 'good', href: canDispatch ? '/dispatch' : '/work-orders?view=unassigned' },
    { label: 'On today', value: today.length, icon: CalendarClock, note: `${inProgress.length} in progress`, tone: 'good', href: canDispatch ? '/calendar' : '/work-orders?view=today' },
    { label: 'In review', value: waiting.length, icon: Hourglass, note: 'Needs sign-off', tone: waiting.length ? 'warn' : 'muted', href: '/work-orders?view=review' },
    { label: 'Past due', value: overdue.length, icon: AlertTriangle, note: overdue.length ? 'Behind deadline' : 'Nothing late', tone: overdue.length ? 'risk' : 'good', href: '/work-orders?view=late' },
    ...(showMoney
      ? [{ label: 'Receivable', value: money(receivableTotal), icon: Receipt, note: overdueInvoices ? `${overdueInvoices} overdue` : `${receivable.length} open`, tone: overdueInvoices ? 'risk' : 'muted', href: '/invoices' } as Kpi]
      : [])
  ];

  const sources = useMemo(() => Array.from(new Set(orders.map((order) => order.source))), [orders]);
  const statuses = STATUS_ORDER.filter((value) => open.some((order) => order.status === value));

  const filtered = open.filter((order) => {
    const property = propertyById(order.propertyId);
    const haystack = `${order.number} ${order.externalId} ${property?.name ?? ''} ${property?.city ?? ''} ${SERVICE_LABEL[order.service]}`.toLowerCase();
    if (query && !haystack.includes(query.trim().toLowerCase())) return false;
    if (status !== 'all' && order.status !== status) return false;
    if (source !== 'all' && order.source !== source) return false;
    if (assignee === 'unassigned' && (order.assigneeId || order.contractorId)) return false;
    if (assignee === 'team' && !order.assigneeId) return false;
    if (assignee === 'contractor' && !order.contractorId) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersOn = query || status !== 'all' || source !== 'all' || assignee !== 'all';

  const allAttention = attentionFor(orders, documents).filter((item) => showMoney || !item.href.startsWith('/invoices'));
  const attention = allAttention.slice(0, 6);

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <Gate permission="overview.read" title="Overview is limited" body="This command center is for people who run the operation. Field work starts on the field board.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Friday, October 2</p>
            <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Good morning{user ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            <p className="mt-3 text-sm text-muted">
              {open.length} open jobs across DC, Maryland, and Virginia. {allAttention.length ? `${allAttention.length} ${allAttention.length === 1 ? 'thing is' : 'things are'} waiting on a person.` : 'Nothing is waiting on a person.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canDispatch ? (
              <Link href="/dispatch" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e6dfd4] bg-white px-4 text-sm font-medium text-ink transition hover:border-[#cfc6b8]">
                <Waypoints size={15} />
                Dispatch board
              </Link>
            ) : null}
            <Link href="/work-orders" className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black">
              Full queue
              <ArrowRight size={15} />
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className={`grid grid-cols-1 divide-y divide-[#f0ebe3] sm:grid-cols-2 sm:divide-y-0 lg:divide-x ${showMoney ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-5'}`}>
            {kpis.map((kpi) => (
              <KpiTile key={kpi.label} kpi={kpi} />
            ))}
          </div>
          <Pipeline orders={orders} />
        </section>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <Field label="Search">
              <PillSearch value={query} onChange={resetPage(setQuery)} placeholder="Job, property, city…" />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(value) => resetPage(setStatus)(value as JobStatus | 'all')}>
                <option value="all">All statuses</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Source">
              <Select value={source} onChange={(value) => resetPage(setSource)(value as SourceId | 'all')}>
                <option value="all">All sources</option>
                {sources.map((value) => (
                  <option key={value} value={value}>
                    {SOURCE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assigned">
              <Select value={assignee} onChange={(value) => resetPage(setAssignee)(value as AssigneeFilter)}>
                <option value="all">Anyone</option>
                <option value="unassigned">Unassigned</option>
                <option value="team">Our field team</option>
                <option value="contractor">Contractors</option>
              </Select>
            </Field>
            {filtersOn ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatus('all');
                  setSource('all');
                  setAssignee('all');
                  setPage(1);
                }}
                className="h-10 px-2 text-sm font-medium text-copper hover:underline"
              >
                Clear
              </button>
            ) : null}
            <h2 className="ml-auto self-center text-sm font-semibold text-ink">
              Open work <span className="ml-1 rounded-full bg-[#f3efe6] px-2 py-0.5 text-[11px] tabular text-muted">{filtered.length}</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-y border-[#f0ebe3] text-[12px] text-[#8a8278]">
                  <th className="py-3 pl-5 pr-3 font-medium">Work order</th>
                  <th className="px-3 py-3 font-medium">Property</th>
                  <th className="px-3 py-3 font-medium">Service</th>
                  <th className="px-3 py-3 font-medium">Due</th>
                  <th className="px-3 py-3 font-medium">Photos</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Assigned</th>
                  <th className="py-3 pl-3 pr-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <WorkRow
                    key={order.id}
                    order={order}
                    menuOpen={menuFor === order.id}
                    onMenu={() => setMenuFor((currentId) => (currentId === order.id ? null : order.id))}
                    onCloseMenu={() => setMenuFor(null)}
                    canDispatch={canDispatch}
                    canSeeProperty={user ? can(user.role, 'properties.read') : false}
                  />
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted">
                      No open work matches these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ebe3] px-5 py-4">
            <p className="text-sm text-muted">
              {filtered.length === 0
                ? 'Showing 0 jobs'
                : `Showing ${(current - 1) * PAGE_SIZE + 1} to ${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length} open jobs`}
            </p>
            <Pagination page={current} pages={pages} onChange={setPage} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-[#ece6dc] bg-white">
            <CardHead title="Needs attention" lede="Unassigned, overdue, short on photos, or waiting on a decision." />
            <ul className="px-2 pb-2">
              {attention.map((item) => {
                const Icon = attentionIcon(item.id);
                return (
                  <li key={item.id}>
                    <Link href={item.href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#f7f4ef]">
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          item.tone === 'risk' ? 'bg-[#f6dedb] text-[#9f2d2d]' : 'bg-[#f8ecd4] text-[#7a4e08]'
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                        <span className="block truncate text-xs text-muted">{item.detail}</span>
                      </span>
                      <ChevronRight size={16} className="text-[#c4bcb0] transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                );
              })}
              {attention.length === 0 ? <li className="px-3 py-6 text-sm text-muted">Nothing is waiting. Good day to get ahead.</li> : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#ece6dc] bg-white">
            <CardHead title="Activity" lede="What changed in the last few days." />
            <ol className="relative px-5 pb-5">
              <span className="absolute bottom-8 left-[37px] top-2 w-px bg-[#efe9df]" aria-hidden />
              {auditEvents.slice(0, 6).map((event) => (
                <li key={event.id} className="relative flex gap-3 py-2">
                  <Avatar name={event.actor} size="sm" tone={event.actor === 'System' ? 'system' : 'person'} />
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      <span className="font-semibold">{event.actor}</span> {event.action.toLowerCase()}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {event.detail} · {timeLabel(event.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </Gate>
  );
}

type Kpi = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  note: string;
  tone: 'good' | 'warn' | 'risk' | 'muted';
  href: string;
};

const NOTE_TONE: Record<Kpi['tone'], string> = {
  good: 'text-[#2f7a4a]',
  warn: 'text-[#9a6700]',
  risk: 'text-[#b33a3a]',
  muted: 'text-muted'
};

function KpiTile({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <Link href={kpi.href} className="group flex items-start gap-3 px-4 py-5 transition hover:bg-[#faf8f4] first:rounded-tl-2xl">
      <span className="mt-0.5 text-[#8a8278] transition group-hover:text-ink">
        <Icon size={18} strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-[#4a443d]">{kpi.label}</span>
        <span className="mt-1 block font-display text-[1.65rem] leading-none tabular text-ink">{kpi.value}</span>
        <span className={`mt-1.5 flex items-center gap-1 text-xs ${NOTE_TONE[kpi.tone]}`}>
          {kpi.tone !== 'muted' ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
          <span className="truncate">{kpi.note}</span>
        </span>
      </span>
    </Link>
  );
}

function Pipeline({ orders }: { orders: WorkOrder[] }) {
  const counts = STAGES.map((stage) => ({ ...stage, count: orders.filter((order) => stage.statuses.includes(order.status)).length }));
  const total = counts.reduce((sum, stage) => sum + stage.count, 0) || 1;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#f0ebe3] px-5 py-4">
      <p className="text-[12px] font-medium text-[#8a8278]">Book of work by stage</p>
      <div className="flex h-2.5 min-w-[220px] flex-1 overflow-hidden rounded-full bg-[#f3efe6]">
        {counts.map((stage) =>
          stage.count ? (
            <span
              key={stage.label}
              title={`${stage.label}: ${stage.count}`}
              className="h-full border-r-2 border-white last:border-r-0"
              style={{ width: `${(stage.count / total) * 100}%`, background: stage.color }}
            />
          ) : null
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {counts.map((stage) => (
          <li key={stage.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
            {stage.label}
            <span className="font-semibold tabular text-ink">{stage.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkRow({
  order,
  menuOpen,
  onMenu,
  onCloseMenu,
  canDispatch,
  canSeeProperty
}: {
  order: WorkOrder;
  menuOpen: boolean;
  onMenu: () => void;
  onCloseMenu: () => void;
  canDispatch: boolean;
  canSeeProperty: boolean;
}) {
  const property = propertyById(order.propertyId);
  const due = dueInfo(order.dueAt);
  const assigned = Boolean(order.assigneeId || order.contractorId);

  return (
    <tr className="border-b border-[#f4f0e9] transition last:border-b-0 hover:bg-[#faf8f4]">
      <td className="py-3.5 pl-5 pr-3">
        <Link href={`/work-orders/${order.id}`} className="font-semibold text-ink hover:text-copper">
          {order.number}
        </Link>
        <div className="text-xs text-muted">
          {SOURCE_LABEL[order.source]} · {order.externalId}
        </div>
      </td>
      <td className="px-3 py-3.5">
        <div className="font-medium text-ink">{property?.name}</div>
        <div className="text-xs text-muted">
          {property?.city}, {property?.state}
        </div>
      </td>
      <td className="px-3 py-3.5">
        <div className="text-ink">{SERVICE_LABEL[order.service]}</div>
        <PriorityMark priority={order.priority} />
      </td>
      <td className="px-3 py-3.5">
        <div className={`font-medium tabular ${due.tone}`}>{shortDate(order.dueAt)}</div>
        <div className={`text-xs ${due.tone === 'text-ink' ? 'text-muted' : due.tone}`}>{due.text}</div>
      </td>
      <td className="px-3 py-3.5">
        <PhotoProgress order={order} />
      </td>
      <td className="px-3 py-3.5">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-3 py-3.5">
        <AssigneeCell order={order} />
      </td>
      <td className="py-3.5 pl-3 pr-5 text-right">
        <RowMenu
          label={`Actions for ${order.number}`}
          open={menuOpen}
          onToggle={onMenu}
          onClose={onCloseMenu}
          items={[
            { href: `/work-orders/${order.id}`, label: 'Open work order' },
            ...(canDispatch ? [{ href: '/dispatch', label: assigned ? 'See on dispatch board' : 'Assign on dispatch board' }] : []),
            ...(canSeeProperty && property ? [{ href: `/properties/${property.id}`, label: 'View property' }] : [])
          ]}
        />
      </td>
    </tr>
  );
}

function CardHead({ title, lede }: { title: string; lede: string }) {
  return (
    <div className="px-5 pb-3 pt-5">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 text-xs text-muted">{lede}</p>
    </div>
  );
}

function attentionIcon(id: string): LucideIcon {
  if (id.startsWith('unassigned')) return UserX;
  if (id.startsWith('overdue')) return AlertTriangle;
  if (id.startsWith('photos')) return Camera;
  if (id.startsWith('approval')) return Hourglass;
  if (id.startsWith('pay')) return Receipt;
  return FileWarning;
}
