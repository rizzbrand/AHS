'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, ArrowRight, ArrowUpRight, Camera, CalendarDays, Inbox, Eye } from 'lucide-react';
import { DirectionsLink, JobCard, StatePill, isSubmitted } from '../../components/field/FieldUI';
import { RespondToJob } from '../../components/field/RespondToJob';
import { useDemo } from '../../lib/demo-store';
import { TODAY, clockTime, longDate } from '../../lib/format';
import { SERVICE_LABEL } from '../../lib/labels';
import { isFieldRole } from '../../lib/permissions';
import { isOpen, propertyById } from '../../lib/records';
import { useSession } from '../../lib/session';
import { SessionUser, WorkOrder } from '../../lib/types';
import { photoProgress } from '../../lib/workflow';

type Tab = 'today' | 'upcoming' | 'done';

export default function FieldHomePage() {
  const { user } = useSession();
  const { orders } = useDemo();
  const [tab, setTab] = useState<Tab>('today');
  if (!user) return null;

  const mine = orders.filter((order) => {
    if (user.role === 'contractor') return order.contractorId === user.contractorId;
    if (user.role === 'field') return order.assigneeId === user.personId;
    return Boolean(order.assigneeId || order.contractorId);
  });
  const open = mine.filter(isOpen);
  const offers = user.role === 'contractor' ? open.filter((order) => !order.acceptedAt) : [];
  const working = open.filter((order) => !offers.includes(order));
  const byTime = (a: WorkOrder, b: WorkOrder) => (a.scheduledStart ?? a.dueAt).localeCompare(b.scheduledStart ?? b.dueAt);
  const today = working.filter((order) => order.scheduledStart?.startsWith(TODAY) || order.status === 'IN_PROGRESS').sort(byTime);
  const upcoming = working.filter((order) => !today.includes(order)).sort(byTime);
  const done = mine.filter((order) => !isOpen(order));
  const photosNeeded = working.reduce((sum, order) => {
    const photos = photoProgress(order);
    return sum + (photos.total - photos.done);
  }, 0);
  const next = today.find((order) => order.checkedInAt && !order.checkedOutAt) ?? today.find((order) => !isSubmitted(order) && !order.checkedOutAt);
  const preview = !isFieldRole(user.role);
  const lists: Record<Tab, WorkOrder[]> = { today: today.filter((order) => order !== next), upcoming, done };
  const empty: Record<Tab, string> = {
    today: next ? 'That is everything for today.' : 'Nothing is on your board for today.',
    upcoming: 'No other open assignments.',
    done: 'No completed jobs on this platform yet.'
  };

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <div className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9187]">{longDate(TODAY)}</p>
        <h1 className="mt-1 font-display text-[30px] leading-tight text-ink">Good morning, {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-[#6f6a62]">
          {today.length === 0 ? 'No visits scheduled today.' : `${today.length} visit${today.length === 1 ? '' : 's'} today`}
          {photosNeeded > 0 ? ` · ${photosNeeded} photo${photosNeeded === 1 ? '' : 's'} still needed` : ''}
        </p>
      </div>

      {preview ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber/50 bg-amber/10 p-3.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber/30 text-[#7a4e08]">
            <Eye size={15} />
          </span>
          <div className="min-w-0 flex-1 text-[13px] leading-5 text-[#5e4a2c]">
            <p className="font-semibold text-ink">Office preview</p>
            <p>This is what crews see, showing every assigned job. Pricing and client contacts stay hidden here.</p>
            <Link href="/overview" className="mt-1.5 inline-flex items-center gap-1 font-semibold text-copper hover:underline">
              Back to operations <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2.5">
        <Stat icon={<CalendarDays size={15} />} label="Today" value={today.length} />
        <Stat icon={<Inbox size={15} />} label={user.role === 'contractor' ? 'Offers' : 'Upcoming'} value={user.role === 'contractor' ? offers.length : upcoming.length} />
        <Stat icon={<Camera size={15} />} label="Photos due" value={photosNeeded} warn={photosNeeded > 0} />
      </div>

      {offers.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle title="Offered to you" count={offers.length} />
          {offers.map((order) => (
            <div key={order.id} className="space-y-2">
              <JobCard order={order} user={user} />
              <RespondToJob order={order} user={user} />
            </div>
          ))}
        </section>
      ) : null}

      {next ? <UpNext order={next} user={user} /> : null}

      <section className="space-y-3">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-[#ece7df] p-1">
          {(['today', 'upcoming', 'done'] as Tab[]).map((item) => {
            const count = item === 'today' ? today.length : lists[item].length;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold capitalize transition ${
                  tab === item ? 'bg-white text-ink shadow-sm' : 'text-[#7a746b] hover:text-ink'
                }`}
              >
                {item}
                <span className={`rounded-full px-1.5 text-[11px] tabular ${tab === item ? 'bg-ink text-white' : 'bg-white/70 text-[#7a746b]'}`}>{count}</span>
              </button>
            );
          })}
        </div>
        {lists[tab].length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#ddd5c8] px-4 py-6 text-center text-sm text-[#8a847b]">{empty[tab]}</p>
        ) : (
          <ul className="space-y-2.5">
            {lists[tab].map((order) => (
              <li key={order.id}>
                <JobCard order={order} user={user} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value, warn = false }: { icon: React.ReactNode; label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white px-3 py-3">
      <span className={`grid h-7 w-7 place-items-center rounded-full ${warn ? 'bg-copper-soft text-copper' : 'bg-[#f3efe8] text-[#6f6a62]'}`}>{icon}</span>
      <p className="mt-2 text-[22px] font-semibold leading-none text-ink tabular">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-[#8a847b]">{label}</p>
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9187]">
      {title}
      <span className="rounded-full bg-copper px-1.5 text-[10px] tracking-normal text-white">{count}</span>
    </h2>
  );
}

function UpNext({ order, user }: { order: WorkOrder; user: SessionUser }) {
  const property = propertyById(order.propertyId);
  const photos = photoProgress(order);
  const onSite = Boolean(order.checkedInAt && !order.checkedOutAt);
  if (!property) return null;

  return (
    <section className="overflow-hidden rounded-2xl bg-shell text-shell-text">
      <div className="p-4">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber">
          {onSite ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" /> : null}
          {onSite ? 'On site now' : 'Up next'}
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-shell-ink">{SERVICE_LABEL[order.service]}</h2>
            <p className="mt-0.5 truncate text-sm">{property.address}</p>
            <p className="truncate text-[13px] text-shell-muted">
              {property.city}, {property.state} · {order.number}
            </p>
          </div>
          {order.scheduledStart ? (
            <p className="shrink-0 text-right text-2xl font-semibold leading-none text-shell-ink tabular">{clockTime(order.scheduledStart)}</p>
          ) : null}
        </div>
        {property.hazards.length > 0 ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#3a2420] px-3 py-2 text-[12px] leading-5 text-[#f2c4b5]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {property.hazards.join(' · ')}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-2.5 text-[12px] text-shell-muted">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-shell-tile">
            <div className="h-full rounded-full bg-amber" style={{ width: `${photos.total ? (photos.done / photos.total) * 100 : 100}%` }} />
          </div>
          {photos.done}/{photos.total} photos
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-shell-line p-3">
        <DirectionsLink property={property} dark />
        <Link href={`/field/${order.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber text-sm font-semibold text-ink transition hover:bg-amber-deep">
          Open job <ArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  );
}
