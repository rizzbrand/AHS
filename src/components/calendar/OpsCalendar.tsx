'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PillSelect } from '../ui/DataTable';
import { useDemo } from '../../lib/demo-store';
import { TODAY, clockTime, longDate, weekdayLabel } from '../../lib/format';
import { SERVICE_LABEL, STATUS_LABEL } from '../../lib/labels';
import { assigneeLabel, propertyById } from '../../lib/records';
import { employees } from '../../lib/seed';
import { JobStatus, ServiceType, WorkOrder } from '../../lib/types';

type View = 'day' | 'week' | 'month';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 12 }, (_, index) => index + 7);

function isoFor(day: number) {
  return `2026-10-${String(day).padStart(2, '0')}`;
}

function dayFromIso(iso: string) {
  return Number(iso.slice(8, 10));
}

function hourFromIso(iso?: string) {
  if (!iso?.includes('T')) return 9;
  return Number(iso.split('T')[1].slice(0, 2));
}

function durationHours(order: WorkOrder) {
  if (!order.scheduledStart || !order.scheduledEnd) return 2;
  const start = hourFromIso(order.scheduledStart) * 60 + Number(order.scheduledStart.split(':')[1] ?? 0);
  const end = hourFromIso(order.scheduledEnd) * 60 + Number(order.scheduledEnd.split(':')[1] ?? 0);
  return Math.max(1, Math.round((end - start) / 60));
}

function byStart(a: WorkOrder, b: WorkOrder) {
  return (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? '');
}

function timeRange(order: WorkOrder) {
  if (!order.scheduledStart) return '';
  if (!order.scheduledEnd) return clockTime(order.scheduledStart);
  return `${clockTime(order.scheduledStart)}–${clockTime(order.scheduledEnd)}`;
}

export function OpsCalendar() {
  const { orders, contractors } = useDemo();
  const [view, setView] = useState<View>('week');
  const [day, setDay] = useState(dayFromIso(TODAY));
  const [person, setPerson] = useState('all');
  const [service, setService] = useState<ServiceType | 'all'>('all');
  const [state, setState] = useState<'all' | 'DC' | 'MD' | 'VA'>('all');
  const [status, setStatus] = useState<JobStatus | 'all'>('all');

  const field = employees.filter((employee) => employee.role === 'field');
  const activeContractors = contractors.filter((contractor) => contractor.status === 'active');

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (!order.scheduledStart) return false;
      if (person !== 'all' && order.assigneeId !== person && order.contractorId !== person) return false;
      if (service !== 'all' && order.service !== service) return false;
      if (status !== 'all' && order.status !== status) return false;
      const property = propertyById(order.propertyId);
      if (state !== 'all' && property?.state !== state) return false;
      return true;
    });
  }, [orders, person, service, state, status]);

  const weekStart = Math.max(1, day - ((new Date(2026, 9, day).getDay() + 7) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => Math.min(31, weekStart + index)).filter((value, index, arr) => arr.indexOf(value) === index);
  const weekJobs = filtered.filter((order) => {
    const value = order.scheduledStart ? dayFromIso(order.scheduledStart) : 0;
    return value >= weekDays[0] && value <= weekDays[weekDays.length - 1];
  });
  const dayJobs = filtered.filter((order) => order.scheduledStart?.startsWith(isoFor(day)));

  const monthCells = useMemo(() => {
    const first = new Date(2026, 9, 1).getDay();
    return [...Array.from({ length: first }, () => 0), ...Array.from({ length: 31 }, (_, index) => index + 1)];
  }, []);

  const rangeLabel =
    view === 'month'
      ? 'October 2026'
      : view === 'week'
        ? `October ${weekDays[0]}–${weekDays[weekDays.length - 1]}, 2026`
        : longDate(isoFor(day));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Schedule</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Calendar</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Jobs that already have a start time. Assign on the dispatch board, then find the crew here.
          </p>
        </div>
        <div className="flex rounded-full bg-[#f6f3ee] p-1">
          {(['day', 'week', 'month'] as View[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`h-9 rounded-full px-4 text-sm capitalize ${view === item ? 'bg-ink font-semibold text-white' : 'text-[#6f6a62] hover:text-ink'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PillSelect value={person} onChange={setPerson} width="w-48">
            <option value="all">All people</option>
            {field.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
            {activeContractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.company}
              </option>
            ))}
          </PillSelect>
          <PillSelect value={service} onChange={(value) => setService(value as ServiceType | 'all')} width="w-44">
            <option value="all">All services</option>
            {Object.entries(SERVICE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PillSelect>
          <PillSelect value={state} onChange={(value) => setState(value as typeof state)} width="w-40">
            <option value="all">All locations</option>
            <option value="DC">Washington, DC</option>
            <option value="MD">Maryland</option>
            <option value="VA">Virginia</option>
          </PillSelect>
          <PillSelect value={status} onChange={(value) => setStatus(value as JobStatus | 'all')} width="w-44">
            <option value="all">All statuses</option>
            {(['SCHEDULED', 'IN_PROGRESS', 'AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW', 'ASSIGNED'] as JobStatus[]).map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </PillSelect>
        </div>

        {view !== 'month' ? (
          <div className="flex items-center gap-2">
            <p className="mr-1 text-sm font-medium text-ink">{rangeLabel}</p>
            <div className="flex items-center rounded-full border border-[#ece6dc] bg-white p-0.5">
              <button type="button" aria-label="Previous" className="grid h-8 w-8 place-items-center rounded-full text-ink hover:bg-[#f6f3ee]" onClick={() => setDay((current) => Math.max(1, current - (view === 'week' ? 7 : 1)))}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="h-8 rounded-full px-3 text-sm text-[#6f6a62] hover:bg-[#f6f3ee] hover:text-ink" onClick={() => setDay(dayFromIso(TODAY))}>
                Today
              </button>
              <button type="button" aria-label="Next" className="grid h-8 w-8 place-items-center rounded-full text-ink hover:bg-[#f6f3ee]" onClick={() => setDay((current) => Math.min(31, current + (view === 'week' ? 7 : 1)))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-ink">{rangeLabel}</p>
        )}
      </div>

      {view === 'month' ? (
        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
          <div className="grid grid-cols-7 border-b border-[#ece6dc] bg-[#faf8f5] text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a9187]">
            {WEEKDAYS.map((label) => (
              <div key={label} className="px-3 py-2.5">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((cell, index) => {
              const iso = cell ? isoFor(cell) : '';
              const jobs = cell ? filtered.filter((order) => order.scheduledStart?.startsWith(iso)).sort(byStart) : [];
              const isToday = iso === TODAY;
              return (
                <button
                  key={`${cell}-${index}`}
                  type="button"
                  disabled={!cell}
                  onClick={() => {
                    if (!cell) return;
                    setDay(cell);
                    setView('day');
                  }}
                  className={`min-h-[124px] border-b border-r border-[#ece6dc] p-2 text-left last:border-r-0 ${cell ? 'hover:bg-[#faf8f5]' : 'bg-[#fcfbf9]'}`}
                >
                  {cell ? (
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-[13px] tabular ${isToday ? 'bg-ink font-semibold text-white' : 'text-[#6f6a62]'}`}>
                      {cell}
                    </span>
                  ) : null}
                  <ul className="mt-2 space-y-1">
                    {jobs.slice(0, 3).map((order) => (
                      <li key={order.id}>
                        <span className="block truncate rounded-lg bg-[#f6f3ee] px-2 py-1 text-[11px] text-ink">
                          <span className="font-semibold tabular">{order.scheduledStart ? clockTime(order.scheduledStart) : ''}</span>
                          <span className="ml-1 text-[#6f6a62]">{order.number}</span>
                        </span>
                      </li>
                    ))}
                    {jobs.length > 3 ? <li className="px-1 text-[11px] text-[#9a9187]">+{jobs.length - 3} more</li> : null}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {view === 'week' ? (
        <section className="overflow-x-auto rounded-2xl border border-[#ece6dc] bg-white">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-[#ece6dc]">
              <div />
              {weekDays.map((value) => {
                const today = isoFor(value) === TODAY;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setDay(value);
                      setView('day');
                    }}
                    className="border-l border-[#ece6dc] px-3 py-3 text-left hover:bg-[#faf8f5]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9a9187]">{WEEKDAYS[new Date(2026, 9, value).getDay()]}</p>
                    <p className={`mt-1 grid h-8 w-8 place-items-center rounded-full text-sm tabular ${today ? 'bg-ink font-semibold text-white' : 'font-semibold text-ink'}`}>
                      {value}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
              {HOURS.map((hour) => (
                <div key={hour} className="contents">
                  <div className="border-b border-[#ece6dc] px-3 py-3 text-right text-[11px] tabular text-[#9a9187]">{hour}:00</div>
                  {weekDays.map((value) => {
                    const jobs = filtered.filter((order) => order.scheduledStart?.startsWith(isoFor(value)) && hourFromIso(order.scheduledStart) === hour).sort(byStart);
                    const today = isoFor(value) === TODAY;
                    return (
                      <div key={`${value}-${hour}`} className={`min-h-[76px] space-y-1.5 border-b border-l border-[#ece6dc] p-1.5 ${today ? 'bg-[#faf8f5]' : ''}`}>
                        {jobs.map((order) => (
                          <JobChip key={order.id} order={order} compact />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {view === 'day' ? (
        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece6dc] px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#9a9187]">{weekdayLabel(isoFor(day))}</p>
              <h2 className="mt-1 text-sm font-semibold text-ink">
                {dayJobs.length} job{dayJobs.length === 1 ? '' : 's'} on the board
              </h2>
            </div>
            <Link href="/dispatch" className="text-sm font-medium text-ink underline-offset-4 hover:underline">
              Open dispatch
            </Link>
          </div>
          <div className="grid grid-cols-[72px_minmax(0,1fr)]">
            {HOURS.map((hour) => {
              const jobs = dayJobs.filter((order) => hourFromIso(order.scheduledStart) === hour).sort(byStart);
              return (
                <div key={hour} className="contents">
                  <div className="border-b border-[#ece6dc] px-3 py-4 text-right text-[11px] tabular text-[#9a9187]">{hour}:00</div>
                  <div className="min-h-[92px] space-y-2 border-b border-l border-[#ece6dc] p-2.5">
                    {jobs.map((order) => (
                      <JobChip key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <p className="text-[12px] text-[#9a9187]">
        {view === 'week' ? `${weekJobs.length} jobs this week` : view === 'day' ? `${dayJobs.length} jobs on this day` : `${filtered.length} scheduled jobs`}
        {' · '}
        {filtered.length} match the filters
      </p>
    </div>
  );
}

function JobChip({ order, compact = false }: { order: WorkOrder; compact?: boolean }) {
  const property = propertyById(order.propertyId);
  const hours = durationHours(order);

  if (compact) {
    return (
      <Link href={`/work-orders/${order.id}`} className="block rounded-xl border border-[#ece6dc] bg-white px-2 py-1.5 hover:border-[#cfc6b8]">
        <span className="block text-[11px] font-semibold tabular text-ink">{timeRange(order)}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[#4a443d]">{order.number}</span>
        <span className="block truncate text-[11px] text-[#9a9187]">{assigneeLabel(order)}</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/work-orders/${order.id}`}
      className="block rounded-2xl border border-[#ece6dc] bg-[#faf8f5] px-4 py-3 hover:border-[#cfc6b8] hover:bg-white"
      style={{ minHeight: `${Math.max(72, hours * 22)}px` }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold tabular text-ink">{timeRange(order)}</p>
        <p className="text-[12px] font-medium text-[#6f6a62]">{order.number}</p>
      </div>
      <p className="mt-1 text-sm text-[#4a443d]">
        {SERVICE_LABEL[order.service]}
        <span className="text-[#9a9187]"> · {assigneeLabel(order)}</span>
      </p>
      <p className="mt-1 text-[12px] text-[#9a9187]">
        {property?.name}
        {property ? ` · ${property.city}, ${property.state}` : ''}
      </p>
    </Link>
  );
}
