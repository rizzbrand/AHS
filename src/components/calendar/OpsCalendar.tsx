'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader } from '../ui/PageHeader';
import { useDemo } from '../../lib/demo-store';
import { TODAY, clockTime, weekdayLabel } from '../../lib/format';
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

  const monthCells = useMemo(() => {
    const first = new Date(2026, 9, 1).getDay();
    return [...Array.from({ length: first }, () => 0), ...Array.from({ length: 31 }, (_, index) => index + 1)];
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        kicker="October 2026"
        title="Calendar"
        lede="Day, week, and month for jobs that already have a start time. Assign on the dispatch board, then find the crew here."
        actions={
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month'] as View[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`h-9 px-3 text-sm capitalize ${view === item ? 'bg-ink text-paper' : 'border border-line bg-surface'}`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <select value={person} onChange={(event) => setPerson(event.target.value)} className="h-9 border border-line bg-surface px-2 text-sm">
          <option value="all">All people</option>
          <optgroup label="Field">
            {field.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </optgroup>
          <optgroup label="Contractors">
            {activeContractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>{contractor.company}</option>
            ))}
          </optgroup>
        </select>
        <select value={service} onChange={(event) => setService(event.target.value as ServiceType | 'all')} className="h-9 border border-line bg-surface px-2 text-sm">
          <option value="all">All services</option>
          {Object.entries(SERVICE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={state} onChange={(event) => setState(event.target.value as typeof state)} className="h-9 border border-line bg-surface px-2 text-sm">
          <option value="all">All locations</option>
          <option value="DC">Washington, DC</option>
          <option value="MD">Maryland</option>
          <option value="VA">Virginia</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as JobStatus | 'all')} className="h-9 border border-line bg-surface px-2 text-sm">
          <option value="all">All statuses</option>
          {(['SCHEDULED', 'IN_PROGRESS', 'AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW', 'ASSIGNED'] as JobStatus[]).map((item) => (
            <option key={item} value={item}>{STATUS_LABEL[item]}</option>
          ))}
        </select>
        {view !== 'month' ? (
          <div className="flex items-center gap-1">
            <button type="button" className="h-9 border border-line bg-surface px-3 text-sm" onClick={() => setDay((current) => Math.max(1, current - (view === 'week' ? 7 : 1)))}>
              Prev
            </button>
            <button type="button" className="h-9 border border-line bg-surface px-3 text-sm" onClick={() => setDay(dayFromIso(TODAY))}>
              Today
            </button>
            <button type="button" className="h-9 border border-line bg-surface px-3 text-sm" onClick={() => setDay((current) => Math.min(31, current + (view === 'week' ? 7 : 1)))}>
              Next
            </button>
          </div>
        ) : null}
      </div>

      {view === 'month' ? (
        <div className="border border-line bg-surface">
          <div className="grid grid-cols-7 border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted">
            {WEEKDAYS.map((label) => (
              <div key={label} className="px-2 py-2">{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((cell, index) => {
              const iso = cell ? isoFor(cell) : '';
              const jobs = cell ? filtered.filter((order) => order.scheduledStart?.startsWith(iso)) : [];
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
                  className={`min-h-[112px] border-b border-r border-line p-2 text-left ${isToday ? 'bg-copper-soft' : ''} ${cell ? 'hover:bg-paper' : ''}`}
                >
                  {cell ? <p className={`text-xs tabular ${isToday ? 'font-semibold text-copper' : 'text-muted'}`}>{cell}</p> : null}
                  <ul className="mt-1 space-y-1">
                    {jobs.slice(0, 3).map((order) => (
                      <li key={order.id} className="bg-forest px-1.5 py-1 text-[11px] leading-4 text-[#f6f1e8]">
                        <span className="block font-semibold">{clockTime(order.scheduledStart!)} {order.number}</span>
                        <span className="block text-[#c5d0c9]">{assigneeLabel(order)}</span>
                      </li>
                    ))}
                    {jobs.length > 3 ? <li className="text-[11px] text-muted">+{jobs.length - 3} more</li> : null}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === 'week' ? (
        <div className="overflow-x-auto border border-line bg-surface">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-line">
              <div />
              {weekDays.map((value) => (
                <button key={value} type="button" onClick={() => { setDay(value); setView('day'); }} className={`border-l border-line px-2 py-2 text-left ${isoFor(value) === TODAY ? 'bg-copper-soft' : ''}`}>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{WEEKDAYS[new Date(2026, 9, value).getDay()]}</p>
                  <p className="text-sm font-semibold">{value}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
              {HOURS.map((hour) => (
                <div key={hour} className="contents">
                  <div className="border-b border-line px-2 py-3 text-right text-[11px] tabular text-muted">{hour}:00</div>
                  {weekDays.map((value) => {
                    const jobs = filtered.filter((order) => order.scheduledStart?.startsWith(isoFor(value)) && hourFromIso(order.scheduledStart) === hour);
                    return (
                      <div key={`${value}-${hour}`} className="min-h-[72px] border-b border-l border-line p-1">
                        {jobs.map((order) => (
                          <JobBlock key={order.id} order={order} compact />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {view === 'day' ? (
        <div className="border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-copper">{weekdayLabel(isoFor(day))}</p>
              <h2 className="text-sm font-semibold">{filtered.filter((order) => order.scheduledStart?.startsWith(isoFor(day))).length} jobs on the board</h2>
            </div>
            <Link href="/dispatch" className="text-sm font-semibold text-copper">Open dispatch</Link>
          </div>
          <div className="grid grid-cols-[72px_minmax(0,1fr)]">
            {HOURS.map((hour) => {
              const jobs = filtered.filter((order) => order.scheduledStart?.startsWith(isoFor(day)) && hourFromIso(order.scheduledStart) === hour);
              return (
                <div key={hour} className="contents">
                  <div className="border-b border-line px-2 py-4 text-right text-[11px] tabular text-muted">{hour}:00</div>
                  <div className="min-h-[88px] border-b border-l border-line p-2">
                    {jobs.length === 0 ? null : (
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {jobs.map((order) => (
                          <JobBlock key={order.id} order={order} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted">{filtered.length} scheduled jobs match these filters · duration shown where an end time exists</p>
    </div>
  );
}

function JobBlock({ order, compact }: { order: WorkOrder; compact?: boolean }) {
  const property = propertyById(order.propertyId);
  const hours = durationHours(order);
  return (
    <Link
      href={`/work-orders/${order.id}`}
      className={`block bg-forest text-[#f6f1e8] ${compact ? 'px-1.5 py-1 text-[11px] leading-4' : 'px-3 py-2 text-sm'}`}
      style={compact ? undefined : { minHeight: `${Math.max(56, hours * 28)}px` }}
    >
      <span className="block font-semibold">
        {order.scheduledStart ? clockTime(order.scheduledStart) : ''}
        {order.scheduledEnd ? `–${clockTime(order.scheduledEnd)}` : ''} {order.number}
      </span>
      <span className={`block ${compact ? 'text-[#c5d0c9]' : 'mt-1 text-[#d5ddd8]'}`}>
        {SERVICE_LABEL[order.service]} · {assigneeLabel(order)}
      </span>
      {!compact ? <span className="mt-1 block text-xs text-[#b7c2bb]">{property?.city}, {property?.state}</span> : null}
    </Link>
  );
}
