'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Inbox, Waypoints } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { AssigneeCell, FilterField, Pagination, PhotoProgress, PillSearch, PillSelect, RowMenu } from '../../../components/ui/DataTable';
import { PriorityMark, StatusBadge } from '../../../components/ui/StatusBadge';
import { useDemo } from '../../../lib/demo-store';
import { shortDate, TODAY } from '../../../lib/format';
import { PRIORITY_LABEL, SERVICE_LABEL, SOURCE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { customerName, isOpen, isOverdue, propertyById } from '../../../lib/records';
import { useSession } from '../../../lib/session';
import { dueInfo, stageOf, STAGES, StageId } from '../../../lib/stages';
import { Priority, ServiceType, SourceId, WorkOrder } from '../../../lib/types';

const PAGE_SIZE = 10;

const VIEWS = [
  { id: 'open', label: 'All open', test: (order: WorkOrder) => isOpen(order) },
  { id: 'unassigned', label: 'Needs a person', test: (order: WorkOrder) => isOpen(order) && !order.assigneeId && !order.contractorId },
  { id: 'late', label: 'Past due', test: (order: WorkOrder) => isOverdue(order) },
  { id: 'review', label: 'Waiting on review', test: (order: WorkOrder) => ['AWAITING_APPROVAL', 'AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW'].includes(order.status) },
  { id: 'today', label: 'On today', test: (order: WorkOrder) => Boolean(order.scheduledStart?.startsWith(TODAY)) },
  { id: 'closed', label: 'Closed', test: (order: WorkOrder) => !isOpen(order) },
  { id: 'all', label: 'Everything', test: () => true }
] as const;

type ViewId = (typeof VIEWS)[number]['id'];
type SortId = 'due' | 'priority' | 'newest' | 'number';

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export default function WorkOrdersPage() {
  const { orders } = useDemo();
  const { user } = useSession();
  const router = useRouter();
  const canDispatch = user ? can(user.role, 'dispatch.read') : false;
  const canSeeCustomer = user ? can(user.role, 'customers.read') : false;
  const canSeeProperty = user ? can(user.role, 'properties.read') : false;

  const [view, setView] = useState<ViewId>('open');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<StageId | 'all'>('all');
  const [source, setSource] = useState<SourceId | 'all'>('all');
  const [service, setService] = useState<ServiceType | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [sort, setSort] = useState<SortId>('due');
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('view');
    if (requested && VIEWS.some((item) => item.id === requested)) setView(requested as ViewId);
  }, []);

  function chooseView(next: ViewId) {
    setView(next);
    setPage(1);
    const url = next === 'open' ? '/work-orders' : `/work-orders?view=${next}`;
    window.history.replaceState(null, '', url);
  }

  function resetting<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const counts = useMemo(() => Object.fromEntries(VIEWS.map((item) => [item.id, orders.filter(item.test).length])) as Record<ViewId, number>, [orders]);
  const sources = useMemo(() => Array.from(new Set(orders.map((order) => order.source))), [orders]);
  const services = useMemo(() => Array.from(new Set(orders.map((order) => order.service))), [orders]);

  const filtered = useMemo(() => {
    const test = VIEWS.find((item) => item.id === view)?.test ?? (() => true);
    const needle = query.trim().toLowerCase();
    const list = orders.filter((order) => {
      if (!test(order)) return false;
      const property = propertyById(order.propertyId);
      const haystack = `${order.number} ${order.externalId} ${SERVICE_LABEL[order.service]} ${property?.name} ${property?.city} ${canSeeCustomer ? customerName(order.customerId) : ''}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (stage !== 'all' && stageOf(order.status)?.id !== stage) return false;
      if (source !== 'all' && order.source !== source) return false;
      if (service !== 'all' && order.service !== service) return false;
      if (priority !== 'all' && order.priority !== priority) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.dueAt.localeCompare(b.dueAt);
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sort === 'number') return a.number.localeCompare(b.number);
      return a.dueAt.localeCompare(b.dueAt);
    });
  }, [canSeeCustomer, orders, priority, query, service, sort, source, stage, view]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersOn = Boolean(query) || stage !== 'all' || source !== 'all' || service !== 'all' || priority !== 'all';

  function clearFilters() {
    setQuery('');
    setStage('all');
    setSource('all');
    setService('all');
    setPriority('all');
    setPage(1);
  }

  return (
    <Gate permission="jobs.read" title="Work orders are limited" body="Your role does not open the company work queue. Assigned jobs are on the field board.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Queue</p>
            <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Work orders</h1>
            <p className="mt-3 max-w-xl text-sm text-muted">Every job, whichever platform it came from, in one internal record. Open a row to move it through the status engine.</p>
          </div>
          <div className="flex items-center gap-2">
            {canDispatch ? (
              <>
                <Link href="/calendar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e6dfd4] bg-white px-4 text-sm font-medium text-ink transition hover:border-[#cfc6b8]">
                  <CalendarClock size={15} />
                  Calendar
                </Link>
                <Link href="/dispatch" className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black">
                  <Waypoints size={15} />
                  Dispatch board
                </Link>
              </>
            ) : null}
          </div>
        </header>

        <nav aria-label="Saved views" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {VIEWS.map((item) => {
            const active = item.id === view;
            const alert = (item.id === 'unassigned' || item.id === 'late') && counts[item.id] > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseView(item.id)}
                aria-pressed={active}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition ${
                  active ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-[#4a443d] hover:border-[#cfc6b8] hover:text-ink'
                }`}
              >
                {item.label}
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${
                    active ? 'bg-white/15 text-white' : alert ? 'bg-[#f6dedb] text-[#9f2d2d]' : 'bg-[#f3efe6] text-muted'
                  }`}
                >
                  {counts[item.id]}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={resetting(setQuery)} placeholder={canSeeCustomer ? 'Job, property, customer…' : 'Job, property, city…'} width="w-56" />
            </FilterField>
            <FilterField label="Stage">
              <PillSelect value={stage} onChange={(value) => resetting(setStage)(value as StageId | 'all')} width="w-36">
                <option value="all">All stages</option>
                {STAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            <FilterField label="Source">
              <PillSelect value={source} onChange={(value) => resetting(setSource)(value as SourceId | 'all')} width="w-36">
                <option value="all">All sources</option>
                {sources.map((value) => (
                  <option key={value} value={value}>
                    {SOURCE_LABEL[value]}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            <FilterField label="Service">
              <PillSelect value={service} onChange={(value) => resetting(setService)(value as ServiceType | 'all')} width="w-40">
                <option value="all">All services</option>
                {services.map((value) => (
                  <option key={value} value={value}>
                    {SERVICE_LABEL[value]}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            <FilterField label="Priority">
              <PillSelect value={priority} onChange={(value) => resetting(setPriority)(value as Priority | 'all')} width="w-36">
                <option value="all">Any priority</option>
                {(Object.keys(PRIORITY_RANK) as Priority[]).map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LABEL[value]}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            {filtersOn ? (
              <button type="button" onClick={clearFilters} className="h-10 px-2 text-sm font-medium text-copper hover:underline">
                Clear
              </button>
            ) : null}
            <div className="ml-auto">
              <FilterField label="Sort by">
                <PillSelect value={sort} onChange={(value) => setSort(value as SortId)} width="w-36">
                  <option value="due">Due soonest</option>
                  <option value="priority">Priority</option>
                  <option value="newest">Newest first</option>
                  <option value="number">Job number</option>
                </PillSelect>
              </FilterField>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead>
                <tr className="border-y border-[#f0ebe3] text-[12px] text-[#8a8278]">
                  <th className="py-3 pl-5 pr-3 font-medium">Work order</th>
                  <th className="px-3 py-3 font-medium">Property</th>
                  <th className="px-3 py-3 font-medium">Service</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Due</th>
                  <th className="px-3 py-3 font-medium">Photos</th>
                  <th className="px-3 py-3 font-medium">Assigned</th>
                  <th className="py-3 pl-3 pr-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => {
                  const property = propertyById(order.propertyId);
                  const due = dueInfo(order.dueAt);
                  const open = isOpen(order);
                  const late = open && due.late;
                  const step = stageOf(order.status);
                  const assigned = Boolean(order.assigneeId || order.contractorId);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/work-orders/${order.id}`)}
                      className={`group cursor-pointer border-b border-[#f4f0e9] transition last:border-b-0 hover:bg-[#faf8f4] ${open ? '' : 'text-muted'}`}
                    >
                      <td className={`whitespace-nowrap py-3.5 pl-5 pr-3 ${late ? 'shadow-[inset_3px_0_0_#c0473f]' : ''}`}>
                        <Link href={`/work-orders/${order.id}`} onClick={(event) => event.stopPropagation()} className="font-semibold text-ink group-hover:text-copper">
                          {order.number}
                        </Link>
                        <div className="text-xs text-muted">
                          {SOURCE_LABEL[order.source]} · {order.externalId}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-medium text-ink">{property?.name}</div>
                        <div className="text-xs text-muted">
                          {canSeeCustomer ? `${customerName(order.customerId)} · ` : ''}
                          {property?.city}, {property?.state}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="text-ink">{SERVICE_LABEL[order.service]}</div>
                        <PriorityMark priority={order.priority} />
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={order.status} />
                        {step ? (
                          <div className="mt-1.5 flex items-center gap-1.5 pl-0.5 text-[11px] text-muted">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: step.color }} />
                            {step.label}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className={`font-medium tabular ${open ? due.tone : 'text-muted'}`}>{shortDate(order.dueAt)}</div>
                        <div className={`text-xs ${!open || due.tone === 'text-ink' ? 'text-muted' : due.tone}`}>{open ? due.text : 'Done'}</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <PhotoProgress order={order} />
                      </td>
                      <td className="px-3 py-3.5">
                        <AssigneeCell order={order} />
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        <RowMenu
                          label={`Actions for ${order.number}`}
                          open={menuFor === order.id}
                          onToggle={() => setMenuFor((id) => (id === order.id ? null : order.id))}
                          onClose={() => setMenuFor(null)}
                          items={[
                            { href: `/work-orders/${order.id}`, label: 'Open work order' },
                            ...(canDispatch && open ? [{ href: '/dispatch', label: assigned ? 'See on dispatch board' : 'Assign on dispatch board' }] : []),
                            ...(canDispatch && order.scheduledStart ? [{ href: '/calendar', label: 'See on calendar' }] : []),
                            ...(canSeeProperty && property ? [{ href: `/properties/${property.id}`, label: 'View property' }] : []),
                            ...(canSeeCustomer ? [{ href: `/customers/${order.customerId}`, label: 'View customer' }] : [])
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f6f3ee] text-[#9a9187]">
                  <Inbox size={20} />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">No work orders here</p>
                <p className="mt-1 text-sm text-muted">{filtersOn ? 'Nothing in this view matches those filters.' : 'This view is empty right now.'}</p>
                {filtersOn ? (
                  <button type="button" onClick={clearFilters} className="mt-4 h-9 rounded-full bg-ink px-4 text-sm font-semibold text-white">
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ebe3] px-5 py-4">
            <p className="text-sm text-muted">
              {filtered.length === 0
                ? 'Showing 0 work orders'
                : `Showing ${(current - 1) * PAGE_SIZE + 1} to ${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length} work orders`}
            </p>
            {pages > 1 ? <Pagination page={current} pages={pages} onChange={setPage} /> : null}
          </div>
        </section>
      </div>
    </Gate>
  );
}
