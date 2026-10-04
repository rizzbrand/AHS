'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronRight, Navigation } from 'lucide-react';
import { clockTime, shortDate } from '../../lib/format';
import { SERVICE_LABEL, STATUS_LABEL } from '../../lib/labels';
import { isOpen, propertyById } from '../../lib/records';
import { Property, SessionUser, WorkOrder } from '../../lib/types';
import { photoProgress } from '../../lib/workflow';

const SUBMITTED = ['SUBMITTED_FOR_REVIEW', 'COMPLETED', 'INVOICED', 'CLOSED'];

export function isSubmitted(order: WorkOrder) {
  return SUBMITTED.includes(order.status);
}

export function fieldState(order: WorkOrder, user: SessionUser): { label: string; tone: string } {
  if (!isOpen(order)) return { label: STATUS_LABEL[order.status], tone: 'bg-[#efece6] text-[#6f6a62]' };
  if (isSubmitted(order)) return { label: 'Submitted', tone: 'bg-[#e5f0e4] text-[#1d5a32]' };
  if (user.role === 'contractor' && !order.acceptedAt) return { label: 'Needs your answer', tone: 'bg-copper-soft text-copper' };
  if (order.contractorId && !order.acceptedAt) return { label: 'Awaiting contractor', tone: 'bg-[#f8ecd4] text-[#7a4e08]' };
  if (order.checkedInAt && !order.checkedOutAt) return { label: 'On site', tone: 'bg-amber/25 text-[#7a4e08]' };
  if (order.checkedOutAt) return { label: 'Checked out', tone: 'bg-[#e6edf5] text-[#2f4f73]' };
  if (order.scheduledStart) return { label: 'Scheduled', tone: 'bg-[#efece6] text-[#5e574e]' };
  return { label: 'Not scheduled', tone: 'bg-[#efece6] text-[#8a847b]' };
}

export function StatePill({ order, user }: { order: WorkOrder; user: SessionUser }) {
  const state = fieldState(order, user);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${state.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {state.label}
    </span>
  );
}

export function directionsUrl(property: Property) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}, ${property.state} ${property.zip}`)}`;
}

export function DirectionsLink({ property, dark = false }: { property: Property; dark?: boolean }) {
  return (
    <a
      href={directionsUrl(property)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
        dark ? 'border border-shell-line text-shell-ink hover:bg-shell-hover' : 'border border-[#e2dbd0] bg-white text-ink hover:bg-[#f6f3ee]'
      }`}
    >
      <Navigation size={15} />
      Directions
    </a>
  );
}

export function ProgressBar({ done, total, tone = 'bg-amber' }: { done: number; total: number; tone?: string }) {
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eee9e1]">
      <div className={`h-full rounded-full ${pct === 100 ? 'bg-[#2f7a4a]' : tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TimeBlock({ order }: { order: WorkOrder }) {
  if (!order.scheduledStart) {
    return (
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f6f3ee] py-2 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9a9187]">Due</span>
        <span className="text-[13px] font-semibold text-ink">{shortDate(order.dueAt)}</span>
      </div>
    );
  }
  const clock = clockTime(order.scheduledStart);
  const [time, suffix] = clock.split(' ');
  return (
    <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f6f3ee] py-2 text-center">
      {clock ? (
        <>
          <span className="text-[15px] font-semibold leading-none text-ink tabular">{time}</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#9a9187]">{suffix}</span>
        </>
      ) : null}
      <span className={`text-[10px] text-[#9a9187] ${clock ? 'mt-0.5' : 'font-semibold'}`}>{shortDate(order.scheduledStart)}</span>
    </div>
  );
}

export function JobCard({ order, user }: { order: WorkOrder; user: SessionUser }) {
  const property = propertyById(order.propertyId);
  const photos = photoProgress(order);
  const closed = !isOpen(order);

  return (
    <Link
      href={`/field/${order.id}`}
      className={`group flex gap-3.5 rounded-2xl border border-[#ece6dc] p-3.5 transition hover:border-[#ddd3c4] hover:shadow-sm ${closed ? 'bg-[#faf8f5]' : 'bg-white'}`}
    >
      <TimeBlock order={order} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-[#9a9187] tabular">{order.number}</span>
          <StatePill order={order} user={user} />
        </div>
        <h3 className={`mt-1 truncate text-[15px] font-semibold ${closed ? 'text-[#6f6a62]' : 'text-ink'}`}>{SERVICE_LABEL[order.service]}</h3>
        <p className="truncate text-[13px] text-[#6f6a62]">
          {property?.address} · {property?.city}, {property?.state}
        </p>
        {closed ? null : (
          <div className="mt-2.5 flex items-center gap-2.5">
            <ProgressBar done={photos.done} total={photos.total} />
            <span className="shrink-0 text-[11px] font-medium text-[#6f6a62] tabular">
              {photos.done}/{photos.total} photos
            </span>
            {property && property.hazards.length > 0 ? (
              <span title="Site hazards" className="shrink-0 text-[#b4542f]">
                <AlertTriangle size={13} />
              </span>
            ) : null}
          </div>
        )}
      </div>
      <ChevronRight size={16} className="mt-1 shrink-0 self-center text-[#c9c1b5] transition group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}

export function SectionCard({ title, aside, children, className = '' }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#ece6dc] bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9187]">{title}</h2>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
