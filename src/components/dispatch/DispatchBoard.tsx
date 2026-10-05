'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, Clock, GripVertical, Inbox, MapPin, UserPlus, UserX, X } from 'lucide-react';
import { Avatar, FilterField, PillSearch, PillSelect } from '../ui/DataTable';
import { PriorityMark, StatusBadge } from '../ui/StatusBadge';
import { useDemo } from '../../lib/demo-store';
import { TODAY, clockTime, shortDate } from '../../lib/format';
import { SERVICE_LABEL, SOURCE_LABEL } from '../../lib/labels';
import { assigneeLabel, isOpen, isOverdue, propertyById } from '../../lib/records';
import { employees } from '../../lib/seed';
import { useSession } from '../../lib/session';
import { dueInfo } from '../../lib/stages';
import { ServiceType, WorkOrder } from '../../lib/types';
import { canAssign } from '../../lib/workflow';

type Worker = { id: string; label: string; kind: 'field' | 'contractor'; meta: string; busy: boolean };
type Lane = 'unassigned' | 'needsTime' | 'today' | 'late';

export function DispatchBoard() {
  const { orders, assignAndSchedule, schedule, eligibleContractors: activeContractors } = useDemo();
  const { user } = useSession();
  const [service, setService] = useState<ServiceType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState<Lane | 'all'>('all');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [modal, setModal] = useState<{ orderId: string; personId: string } | null>(null);
  const [when, setWhen] = useState(`${TODAY}T09:00`);
  const [hours, setHours] = useState(3);
  const [selected, setSelected] = useState<string | null>(null);

  const field = employees.filter((employee) => employee.role === 'field');

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (!isOpen(order)) return false;
      if (service !== 'all' && order.service !== service) return false;
      const property = propertyById(order.propertyId);
      const haystack = `${order.number} ${SERVICE_LABEL[order.service]} ${property?.city} ${property?.name} ${SOURCE_LABEL[order.source]} ${assigneeLabel(order)}`.toLowerCase();
      return !query || haystack.includes(query.toLowerCase());
    });
  }, [orders, query, service]);

  const unassigned = filtered.filter((order) => !order.assigneeId && !order.contractorId);
  const assignedOpen = filtered.filter((order) => (order.assigneeId || order.contractorId) && !order.scheduledStart);
  const today = filtered.filter((order) => order.scheduledStart?.startsWith(TODAY)).slice().sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''));
  const overdue = filtered.filter(isOverdue);

  const workers: Worker[] = [
    ...field.map((employee) => ({
      id: employee.id,
      label: employee.name,
      kind: 'field' as const,
      meta: `${employee.base} · ${employee.status === 'on_job' ? 'On a job' : 'Available'}`,
      busy: employee.status === 'on_job' || orders.some((order) => order.assigneeId === employee.id && order.status === 'IN_PROGRESS')
    })),
    ...activeContractors.map((contractor) => ({
      id: contractor.id,
      label: contractor.company,
      kind: 'contractor' as const,
      meta: `${contractor.serviceArea} · ${contractor.availability}`,
      busy: orders.some((order) => order.contractorId === contractor.id && order.status === 'IN_PROGRESS')
    }))
  ];

  function openSchedule(orderId: string, personId: string) {
    const order = orders.find((item) => item.id === orderId);
    setModal({ orderId, personId });
    setWhen(order?.scheduledStart?.slice(0, 16) || `${TODAY}T09:00`);
    setHours(3);
  }

  function confirmSchedule() {
    if (!user || !modal) return;
    const order = orders.find((item) => item.id === modal.orderId);
    if (!order) return;
    if (order.assigneeId === modal.personId || order.contractorId === modal.personId) {
      schedule(modal.orderId, when, user.name, hours);
    } else {
      assignAndSchedule(modal.orderId, modal.personId, when, user.name, hours);
    }
    setModal(null);
    setDragging(null);
    setDropTarget(null);
    setSelected(null);
  }

  function loadFor(personId: string) {
    return orders.filter(
      (order) =>
        isOpen(order) &&
        (order.assigneeId === personId || order.contractorId === personId) &&
        (order.scheduledStart?.startsWith(TODAY) || order.status === 'IN_PROGRESS' || order.status === 'ASSIGNED')
    );
  }

  const focus = orders.find((order) => order.id === selected);
  const selectedAssignable = Boolean(selected && canAssign(orders.find((item) => item.id === selected)?.status ?? 'NEW'));
  const filtersOn = Boolean(query) || service !== 'all';
  const modalOrder = modal ? orders.find((item) => item.id === modal.orderId) : undefined;
  const modalWorker = modal ? workers.find((worker) => worker.id === modal.personId) : undefined;

  useEffect(() => {
    if (!modal) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Operations desk</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Dispatch</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Unassigned work on the left. Drop a job on a person, set the time, and it lands on today&apos;s board and the calendar.
          </p>
        </div>
        <Link href="/calendar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e6dfd4] bg-white px-4 text-sm font-medium text-ink transition hover:border-[#cfc6b8]">
          <CalendarClock size={15} />
          Calendar
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<UserX size={16} />} label="Unassigned" value={unassigned.length} note="Waiting for a person" warn={unassigned.length > 0} active={lane === 'unassigned'} onClick={() => setLane(lane === 'unassigned' ? 'all' : 'unassigned')} />
        <Stat icon={<Clock size={16} />} label="Needs a time" value={assignedOpen.length} note="Assigned, not scheduled" active={lane === 'needsTime'} onClick={() => setLane(lane === 'needsTime' ? 'all' : 'needsTime')} />
        <Stat icon={<CalendarClock size={16} />} label="On today" value={today.length} note="Have a start time" active={lane === 'today'} onClick={() => setLane(lane === 'today' ? 'all' : 'today')} />
        <Stat icon={<AlertTriangle size={16} />} label="Past due" value={overdue.length} note="Still open and late" warn={overdue.length > 0} active={lane === 'late'} onClick={() => setLane(lane === 'late' ? 'all' : 'late')} />
      </section>

      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#ece6dc] bg-white px-5 py-4">
        <FilterField label="Search">
          <PillSearch value={query} onChange={setQuery} placeholder="Job, city, person…" width="w-full sm:w-64" />
        </FilterField>
        <FilterField label="Service">
          <PillSelect value={service} onChange={(value) => setService(value as ServiceType | 'all')} width="w-full sm:w-44">
            <option value="all">All services</option>
            {Object.entries(SERVICE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PillSelect>
        </FilterField>
        {filtersOn ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setService('all');
            }}
            className="h-10 px-2 text-sm font-medium text-copper hover:underline"
          >
            Clear
          </button>
        ) : null}
        <p className="ml-auto max-w-sm text-right text-[12px] leading-5 text-[#8a8278]">
          {dragging
            ? 'Drop the job on a person to assign and schedule it.'
            : selectedAssignable
              ? 'Job selected. Click a person in the middle column to assign it.'
              : 'Click a job on the left or today, then click a person to assign it.'}
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.95fr)_minmax(320px,1.1fr)_minmax(280px,0.95fr)]">
        <Column
          title="Needs a person"
          count={unassigned.length + assignedOpen.length}
          lede={`${unassigned.length} unassigned · ${assignedOpen.length} need a time`}
          active={lane === 'unassigned' || lane === 'needsTime'}
          dim={lane === 'today' || lane === 'late'}
        >
          {unassigned.length === 0 ? <Empty>No open jobs are waiting for assignment.</Empty> : null}
          {unassigned.map((order) => (
            <JobCard
              key={order.id}
              order={order}
              selected={selected === order.id}
              draggable
              dragging={dragging === order.id}
              onSelect={() => setSelected((current) => (current === order.id ? null : order.id))}
              onDragStart={() => setDragging(order.id)}
              onDragEnd={() => {
                setDragging(null);
                setDropTarget(null);
              }}
            />
          ))}
          {assignedOpen.length > 0 ? (
            <div className="mt-1 space-y-2 border-t border-[#f0ebe3] pt-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9187]">Assigned, needs a time</p>
              {assignedOpen.map((order) => (
                <JobCard
                  key={order.id}
                  order={order}
                  selected={selected === order.id}
                  draggable
                  dragging={dragging === order.id}
                  onSelect={() => setSelected((current) => (current === order.id ? null : order.id))}
                  onDragStart={() => setDragging(order.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setDropTarget(null);
                  }}
                  action={
                    user ? (
                      <button
                        type="button"
                        className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#e6dfd4] text-[12px] font-semibold text-ink hover:border-[#cfc6b8]"
                        onClick={(event) => {
                          event.stopPropagation();
                          openSchedule(order.id, order.assigneeId ?? order.contractorId ?? '');
                        }}
                      >
                        Set time
                      </button>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : null}
        </Column>

        <Column title="People" count={workers.length} lede="Field crew and eligible contractors" active={dragging !== null || selectedAssignable} dim={false}>
          {selectedAssignable ? (
            <p className="rounded-xl bg-[#faf8f5] px-3 py-2 text-[12px] text-ink">Click a person to assign {orders.find((item) => item.id === selected)?.number}.</p>
          ) : (
            <p className="rounded-xl bg-[#faf8f5] px-3 py-2 text-[12px] text-[#8a8278]">Select a job first, then click someone here.</p>
          )}
          <ul className="space-y-2.5">
            {workers.map((worker) => {
              const load = loadFor(worker.id);
              const active = dropTarget === worker.id;
              return (
                <li
                  key={worker.id}
                  onClick={() => {
                    if (selectedAssignable && selected) openSchedule(selected, worker.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropTarget(worker.id);
                  }}
                  onDragLeave={() => setDropTarget((current) => (current === worker.id ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault();
                    const orderId = dragging ?? event.dataTransfer.getData('text/work-order');
                    if (!orderId) return;
                    openSchedule(orderId, worker.id);
                  }}
                  className={`rounded-2xl border p-3.5 transition ${
                    active
                      ? 'border-amber bg-amber/10 ring-2 ring-amber/40'
                      : selectedAssignable
                        ? 'cursor-pointer border-[#ece6dc] bg-white hover:border-ink'
                        : dragging
                          ? 'border-dashed border-[#d9cfc0] bg-white'
                          : 'border-[#ece6dc] bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={worker.label} tone={worker.kind === 'contractor' ? 'contractor' : 'person'} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{worker.label}</p>
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            worker.busy ? 'bg-amber/20 text-[#7a4e08]' : 'bg-[#e5f0e4] text-[#1d5a32]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${worker.busy ? 'bg-amber' : 'bg-[#2f7a4a]'}`} />
                          {worker.busy ? 'Busy' : 'Open'}
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-[#8a8278]">{worker.meta}</p>
                    </div>
                  </div>
                  {load.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {load.map((order) => (
                        <li key={order.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#faf8f5] px-2.5 py-1.5 text-[12px]">
                          <span className="min-w-0 truncate font-medium text-ink">
                            {order.number} · {SERVICE_LABEL[order.service]}
                          </span>
                          <span className="shrink-0 tabular text-[#8a8278]">{order.scheduledStart ? clockTime(order.scheduledStart) : 'No time'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[12px] text-[#9a9187]">Nothing on the board yet.</p>
                  )}
                  {selectedAssignable ? (
                    <button
                      type="button"
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-ink text-[12px] font-semibold text-white hover:bg-black"
                      onClick={() => openSchedule(selected!, worker.id)}
                    >
                      <UserPlus size={13} />
                      Assign selected job
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Column>

        <div className="space-y-4">
          <Column title="Today" count={today.length} lede="Jobs with a start time" active={lane === 'today'} dim={lane === 'unassigned' || lane === 'needsTime'}>
            {today.length === 0 ? <Empty>Nothing scheduled for today.</Empty> : null}
            {today.map((order) => (
              <JobCard
                key={order.id}
                order={order}
                selected={selected === order.id}
                draggable
                dragging={dragging === order.id}
                onSelect={() => setSelected((current) => (current === order.id ? null : order.id))}
                onDragStart={() => setDragging(order.id)}
                onDragEnd={() => {
                  setDragging(null);
                  setDropTarget(null);
                }}
                showTime
              />
            ))}
          </Column>
          <Column title="Past due" count={overdue.length} lede="Still open and late" active={lane === 'late'} dim={lane === 'unassigned' || lane === 'needsTime' || lane === 'today'}>
            {overdue.length === 0 ? <Empty>Nothing is past due.</Empty> : null}
            {overdue.map((order) => (
              <JobCard key={order.id} order={order} selected={selected === order.id} onSelect={() => setSelected((current) => (current === order.id ? null : order.id))} risk />
            ))}
          </Column>
        </div>
      </div>

      {focus ? (
        <aside className="rounded-2xl border border-[#ece6dc] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9187]">{SOURCE_LABEL[focus.source]}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">
                {focus.number} · {SERVICE_LABEL[focus.service]}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[#6f6a62]">
                <MapPin size={14} />
                {propertyById(focus.propertyId)?.address}, {propertyById(focus.propertyId)?.city}
              </p>
              <p className="mt-1 text-sm text-[#8a8278]">{assigneeLabel(focus)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={focus.status} />
              <button type="button" onClick={() => setSelected(null)} aria-label="Clear selection" className="grid h-8 w-8 place-items-center rounded-full text-[#8a8278] hover:bg-[#f3efe8] hover:text-ink">
                <X size={16} />
              </button>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4a443d]">{focus.verifiedScope ?? focus.scope}</p>
          <Link href={`/work-orders/${focus.id}`} className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-black">
            Open job workspace
          </Link>
        </aside>
      ) : null}

      {modal && modalOrder && modalWorker ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/30 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4" onMouseDown={() => setModal(null)}>
          <div role="dialog" aria-label="Schedule assignment" className="w-full max-w-md overflow-hidden rounded-t-[22px] bg-white shadow-sheet sm:rounded-[22px]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-[#f0ebe3] px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9187]">Schedule assignment</p>
                <h2 className="mt-1 font-display text-xl text-ink">
                  {modalOrder.number} → {modalWorker.label}
                </h2>
                <p className="mt-1 text-[13px] text-[#8a8278]">{SERVICE_LABEL[modalOrder.service]}</p>
              </div>
              <button type="button" onClick={() => setModal(null)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-[#f3efe8] hover:text-ink">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3 px-5 py-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#8a8278]">Start</span>
                <input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className="h-10 w-full min-w-0 rounded-xl border border-[#e6dfd4] bg-white px-3 text-sm outline-none focus:border-amber" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#8a8278]">Duration (hours)</span>
                <input type="number" min={1} max={10} value={hours} onChange={(event) => setHours(Number(event.target.value) || 3)} className="h-10 w-full rounded-xl border border-[#e6dfd4] bg-white px-3 text-sm outline-none focus:border-amber" />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#f0ebe3] bg-[#faf8f5] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setModal(null)} className="h-10 rounded-xl border border-[#e6dfd4] bg-white px-4 text-sm font-medium text-ink hover:border-[#cfc6b8]">
                Cancel
              </button>
              <button type="button" onClick={confirmSchedule} className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-black">
                Assign and schedule
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  warn = false,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
  warn?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-white p-4 text-left transition ${active ? 'border-ink ring-1 ring-ink' : 'border-[#ece6dc] hover:border-[#d9cfc0] hover:shadow-sm'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${warn && value > 0 ? 'bg-[#fbefed] text-[#b33a3a]' : 'bg-[#f3efe8] text-[#6f6a62]'}`}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </button>
  );
}

function Column({ title, lede, count, children, active, dim }: { title: string; lede: string; count: number; children: React.ReactNode; active: boolean; dim: boolean }) {
  return (
    <section className={`rounded-2xl border bg-white transition ${active ? 'border-ink ring-1 ring-ink' : 'border-[#ece6dc]'} ${dim ? 'opacity-45' : ''}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[#f0ebe3] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="text-[12px] text-[#8a8278]">{lede}</p>
        </div>
        <span className="rounded-full bg-[#f3efe8] px-2 py-0.5 text-[11px] font-semibold tabular text-[#5e574e]">{count}</span>
      </div>
      <div className="space-y-2.5 p-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-dashed border-[#e6dfd4] px-3 py-5 text-sm text-[#8a8278]">
      <Inbox size={15} />
      {children}
    </p>
  );
}

function JobCard({
  order,
  selected,
  draggable,
  dragging,
  onSelect,
  onDragStart,
  onDragEnd,
  showTime,
  risk,
  action
}: {
  order: WorkOrder;
  selected?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  onSelect?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showTime?: boolean;
  risk?: boolean;
  action?: React.ReactNode;
}) {
  const property = propertyById(order.propertyId);
  const due = dueInfo(order.dueAt);
  return (
    <article
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/work-order', order.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`rounded-2xl border px-3 py-3 transition ${
        selected ? 'border-ink bg-[#faf8f5] ring-1 ring-ink' : risk ? 'border-[#e9c9c3] bg-[#fdf6f4]' : 'border-[#ece6dc] bg-[#fcfbf9] hover:border-[#d9cfc0]'
      } ${dragging ? 'opacity-40' : ''} ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      <div className="flex items-start gap-2">
        {draggable ? <GripVertical size={14} className="mt-1 shrink-0 text-[#c9c1b5]" /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/work-orders/${order.id}`} className="text-sm font-semibold text-ink hover:text-copper" onClick={(event) => event.stopPropagation()}>
              {order.number}
            </Link>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-0.5 text-[12px] text-[#8a8278]">
            {SERVICE_LABEL[order.service]} · {SOURCE_LABEL[order.source]}
          </p>
          <p className="mt-2 truncate text-sm font-medium text-ink">{property?.name}</p>
          <p className="flex items-center gap-1 text-[12px] text-[#8a8278]">
            <MapPin size={12} />
            {property?.city}, {property?.state}
          </p>
          {showTime && order.scheduledStart ? (
            <p className="mt-2 text-[12px] font-semibold text-ink">
              {clockTime(order.scheduledStart)}
              {order.scheduledEnd ? `–${clockTime(order.scheduledEnd)}` : ''} · {assigneeLabel(order)}
            </p>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <PriorityMark priority={order.priority} />
              <span className={`text-[11px] font-semibold ${due.tone}`}>
                {due.late ? due.text : `Due ${shortDate(order.dueAt)}`}
              </span>
            </div>
          )}
          {action}
        </div>
      </div>
    </article>
  );
}
