'use client';

import { AlertTriangle, Briefcase, CircleDollarSign, Inbox, UserX } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { useDemo } from '../../../lib/demo-store';
import { money } from '../../../lib/format';
import { SERVICE_LABEL, SOURCE_LABEL, STATUS_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { isOpen, isOverdue, propertyById } from '../../../lib/records';
import { STAGES, stageOf } from '../../../lib/stages';
import { useSession } from '../../../lib/session';
import { WorkOrder } from '../../../lib/types';

export default function ReportsPage() {
  const { user } = useSession();
  const { orders } = useDemo();
  const financial = user ? can(user.role, 'reports.financial') : false;

  const open = orders.filter(isOpen);
  const late = orders.filter(isOverdue);
  const unassigned = open.filter((order) => !order.assigneeId && !order.contractorId);
  const review = open.filter((order) => ['AWAITING_APPROVAL', 'AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW'].includes(order.status));

  const by = (pick: (order: WorkOrder) => string) => {
    const counts = new Map<string, number>();
    orders.forEach((order) => counts.set(pick(order), (counts.get(pick(order)) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const stages = STAGES.map((stage) => ({
    label: stage.label,
    count: orders.filter((order) => stageOf(order.status)?.id === stage.id).length,
    color: stage.color
  }));
  const stageMax = Math.max(1, ...stages.map((item) => item.count));

  const priced = orders.filter((order) => order.approvedAmount);
  const revenue = priced.reduce((sum, order) => sum + (order.approvedAmount ?? 0), 0);
  const cost = priced.reduce((sum, order) => sum + (order.contractorCost ?? 0), 0);
  const spread = revenue - cost;
  const margin = revenue ? Math.round((spread / revenue) * 100) : 0;

  return (
    <Gate permission="reports.read" title="Reports are limited" body="Operating reports are not part of the field board.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Book of work</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Reports</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">Counts from the jobs currently in the platform. Financial totals stay with the owner.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Briefcase size={16} />} label="Open jobs" value={open.length} note={`${orders.length} in the book`} />
          <Stat icon={<UserX size={16} />} label="Unassigned" value={unassigned.length} note="Waiting on dispatch" warn={unassigned.length > 0} />
          <Stat icon={<Inbox size={16} />} label="In review" value={review.length} note="Approvals and closeout" />
          <Stat icon={<AlertTriangle size={16} />} label="Past due" value={late.length} note="Still open and late" warn={late.length > 0} />
        </section>

        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Pipeline</h2>
              <p className="text-[12px] text-[#8a8278]">Where the book of work sits today</p>
            </div>
            <p className="text-[12px] text-[#8a8278] tabular">{orders.length} jobs</p>
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#f0ebe3]">
            {stages.filter((item) => item.count).map((item) => (
              <div key={item.label} title={`${item.label}: ${item.count}`} style={{ width: `${(item.count / orders.length) * 100}%`, background: item.color }} />
            ))}
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-5">
            {stages.map((item) => (
              <li key={item.label}>
                <p className="flex items-center gap-1.5 text-[12px] text-[#8a8278]">
                  <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  {item.label}
                </p>
                <p className="mt-1 font-display text-2xl tabular text-ink">{item.count}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0ebe3]">
                  <div className="h-full rounded-full" style={{ width: `${(item.count / stageMax) * 100}%`, background: item.color }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <CountList title="By source" rows={by((order) => SOURCE_LABEL[order.source])} />
          <CountList title="By service" rows={by((order) => SERVICE_LABEL[order.service])} />
          <CountList title="By state" rows={by((order) => propertyById(order.propertyId)?.state ?? '—')} />
        </div>

        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">Open statuses</h2>
          <p className="text-[12px] text-[#8a8278]">The statuses still moving through the engine</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {by((order) => (isOpen(order) ? STATUS_LABEL[order.status] : ''))
              .filter(([label]) => label)
              .map(([label, count]) => (
                <li key={label} className="flex items-center justify-between rounded-xl bg-[#faf8f5] px-3 py-2.5 text-sm">
                  <span className="text-[#4a443d]">{label}</span>
                  <span className="font-semibold tabular text-ink">{count}</span>
                </li>
              ))}
          </ul>
        </section>

        {financial ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyTile icon={<CircleDollarSign size={16} />} label="Approved work" value={money(revenue)} note={`${priced.length} priced jobs`} />
            <MoneyTile icon={<CircleDollarSign size={16} />} label="Contractor cost" value={money(cost)} note="Recorded against those jobs" />
            <MoneyTile icon={<CircleDollarSign size={16} />} label="Spread" value={money(spread)} note="Approved minus contractor cost" />
            <MoneyTile icon={<CircleDollarSign size={16} />} label="Margin" value={`${margin}%`} note="Not a general ledger" />
          </section>
        ) : (
          <p className="rounded-2xl border border-[#ece6dc] bg-white px-4 py-3 text-sm text-[#8a8278]">Financial totals are hidden for this role.</p>
        )}
      </div>
    </Gate>
  );
}

function Stat({ icon, label, value, note, warn = false }: { icon: React.ReactNode; label: string; value: number; note: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${warn && value > 0 ? 'bg-[#fbefed] text-[#b33a3a]' : 'bg-[#f3efe8] text-[#6f6a62]'}`}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </div>
  );
}

function MoneyTile({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f3efe8] text-[#6f6a62]">{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </div>
  );
}

function CountList({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((row) => row[1]));
  return (
    <section className="rounded-2xl border border-[#ece6dc] bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-4 space-y-3">
        {rows.map(([label, count]) => (
          <li key={label}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[#4a443d]">{label}</span>
              <span className="font-semibold tabular text-ink">{count}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0ebe3]">
              <div className="h-full rounded-full bg-amber" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
