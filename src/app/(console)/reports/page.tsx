'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Briefcase, Inbox, UserX } from 'lucide-react';
import { ChartCard, Donut, HBars, Legend, Slice } from '../../../components/reports/Charts';
import { Gate } from '../../../components/auth/Gate';
import { useDemo } from '../../../lib/demo-store';
import { money } from '../../../lib/format';
import { SERVICE_LABEL, SOURCE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { isOpen, isOverdue } from '../../../lib/records';
import { estimates, invoices } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { STAGES, stageOf } from '../../../lib/stages';
import { WorkOrder } from '../../../lib/types';

function tally(orders: WorkOrder[], pick: (order: WorkOrder) => string) {
  const counts = new Map<string, number>();
  orders.forEach((order) => counts.set(pick(order), (counts.get(pick(order)) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export default function ReportsPage() {
  const { user } = useSession();
  const { orders } = useDemo();
  const searchParams = useSearchParams();
  const financial = user ? can(user.role, 'reports.financial') : false;
  const view = searchParams.get('view') === 'money' && financial ? 'money' : 'work';

  const open = orders.filter(isOpen);
  const late = orders.filter(isOverdue);
  const unassigned = open.filter((order) => !order.assigneeId && !order.contractorId);
  const review = open.filter((order) => ['AWAITING_APPROVAL', 'AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW'].includes(order.status));
  const crew: Slice[] = [
    { label: 'Field team', value: open.filter((order) => order.assigneeId).length, color: '#1c1915' },
    { label: 'Contractor', value: open.filter((order) => order.contractorId && !order.assigneeId).length, color: '#5b7fa6' },
    { label: 'Unassigned', value: unassigned.length, color: '#b33a3a' }
  ];

  const stages: Slice[] = STAGES.map((stage) => ({
    label: stage.label,
    value: orders.filter((order) => stageOf(order.status)?.id === stage.id).length,
    color: stage.color
  }));

  const sources: Slice[] = tally(orders, (order) => SOURCE_LABEL[order.source]).map(([label, value]) => ({
    label,
    value,
    color: '#1c1915'
  }));
  const services: Slice[] = tally(orders, (order) => SERVICE_LABEL[order.service]).map(([label, value]) => ({
    label,
    value,
    color: '#1c1915'
  }));
  const priced = orders.filter((order) => order.approvedAmount);
  const revenue = priced.reduce((sum, order) => sum + (order.approvedAmount ?? 0), 0);
  const cost = priced.reduce((sum, order) => sum + (order.contractorCost ?? 0), 0);
  const spread = revenue - cost;
  const margin = revenue ? Math.round((spread / revenue) * 100) : 0;
  const moneyMix: Slice[] = [
    { label: 'Contractor cost', value: cost, color: '#8c4520' },
    { label: 'Spread', value: spread, color: '#2f6b47' }
  ];
  const invoiceMix: Slice[] = [
    { label: 'Overdue', value: invoices.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + item.amount, 0), color: '#b33a3a' },
    { label: 'Ready for JobTread', value: invoices.filter((item) => item.status === 'ready_for_jobtread').reduce((sum, item) => sum + item.amount, 0), color: '#d9a05b' },
    { label: 'Paid', value: invoices.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0), color: '#2f6b47' }
  ];
  const estimateMix: Slice[] = [
    { label: 'In review', value: estimates.filter((item) => item.status === 'internal_review').reduce((sum, item) => sum + item.amount, 0), color: '#c48a45' },
    { label: 'Sent to JobTread', value: estimates.filter((item) => item.status === 'sent_to_jobtread').reduce((sum, item) => sum + item.amount, 0), color: '#5b7fa6' },
    { label: 'Approved', value: estimates.filter((item) => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0), color: '#2f6b47' }
  ];

  return (
    <Gate permission="reports.read" title="Reports are limited" body="Operating reports are not part of the field board.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Reports</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">{view === 'money' ? 'Money' : 'Reports'}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            {view === 'money'
              ? 'Approved work versus recorded contractor cost. Not a general ledger. JobTread is not connected.'
              : 'Counts from the jobs currently in the platform.'}
          </p>
        </header>

        {view === 'work' ? (
        <>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Open jobs" value={open.length} note={`${orders.length} in the book`} icon={<Briefcase size={16} />} />
          <Stat label="Unassigned" value={unassigned.length} note="Waiting on dispatch" icon={<UserX size={16} />} warn={unassigned.length > 0} />
          <Stat label="In review" value={review.length} note="Approvals and closeout" icon={<Inbox size={16} />} />
          <Stat label="Past due" value={late.length} note="Still open and late" icon={<AlertTriangle size={16} />} warn={late.length > 0} />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Pipeline" lede="Where the book of work sits today">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <Donut
                slices={stages}
                center={
                  <div>
                    <p className="font-display text-3xl leading-none tabular text-ink">{orders.length}</p>
                    <p className="mt-1 text-[11px] text-[#9a9187]">jobs</p>
                  </div>
                }
              />
              <Legend slices={stages} />
            </div>
          </ChartCard>

          <ChartCard title="Who is on the open work" lede="Assignment mix for jobs still moving">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <Donut
                slices={crew}
                size={168}
                center={
                  <div>
                    <p className="font-display text-2xl leading-none tabular text-ink">{open.length}</p>
                    <p className="mt-1 text-[11px] text-[#9a9187]">open</p>
                  </div>
                }
              />
              <Legend slices={crew} />
            </div>
          </ChartCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="By source" lede={`${sources.length} platforms in the book`}>
            <HBars rows={sources} color="#1c1915" ranked />
          </ChartCard>
          <ChartCard title="By service" lede={`${services.length} trades on the jobs`}>
            <HBars rows={services} color="#1c1915" ranked />
          </ChartCard>
        </div>
        </>
        ) : (
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MoneyTile label="Approved work" value={money(revenue)} note={`${priced.length} priced jobs`} />
              <MoneyTile label="Contractor cost" value={money(cost)} note="Recorded against those jobs" />
              <MoneyTile label="Spread" value={money(spread)} note="Approved minus contractor cost" />
              <MoneyTile label="Margin" value={`${margin}%`} note="On priced jobs only" />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="Cost versus spread" lede="How approved dollars split">
                <div className="flex flex-col items-center gap-4">
                  <Donut
                    slices={moneyMix}
                    size={152}
                    center={
                      <div>
                        <p className="font-display text-2xl leading-none tabular text-ink">{margin}%</p>
                        <p className="mt-1 text-[11px] text-[#9a9187]">margin</p>
                      </div>
                    }
                  />
                  <Legend slices={moneyMix} unit={`${money(revenue)} approved`} format={money} />
                </div>
              </ChartCard>
              <ChartCard title="Invoices" lede="JT references on file">
                <HBars rows={invoiceMix} format={money} />
              </ChartCard>
              <ChartCard title="Estimates" lede="Quote pipeline">
                <HBars rows={estimateMix} format={money} />
              </ChartCard>
            </div>
          </section>
        )}
      </div>
    </Gate>
  );
}

function Stat({ icon, label, value, note, warn = false }: { icon: ReactNode; label: string; value: number; note: string; warn?: boolean }) {
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

function MoneyTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
      <p className="text-[13px] font-medium text-[#6f6a62]">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </div>
  );
}
