'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Send, Wallet } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { Avatar, FilterField, PillSearch, PillSelect } from '../../../components/ui/DataTable';
import { HandoffNote } from '../../../components/ui/PageHeader';
import { useDemo } from '../../../lib/demo-store';
import { money } from '../../../lib/format';
import { SERVICE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { customerName, propertyById } from '../../../lib/records';
import { estimates } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { EstimateRecord } from '../../../lib/types';

const STATUS: Record<EstimateRecord['status'], { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'bg-[#efece6] text-[#6f6a62]' },
  internal_review: { label: 'Internal review', tone: 'bg-[#f8ecd4] text-[#7a4e08]' },
  sent_to_jobtread: { label: 'Sent toward JobTread', tone: 'bg-[#e4ecf4] text-[#1e3a5f]' },
  approved: { label: 'Approved', tone: 'bg-[#e5f0e4] text-[#1d5a32]' }
};

type ViewId = 'all' | EstimateRecord['status'];
type SortId = 'amount' | 'status' | 'number';

export default function EstimatesPage() {
  const { orders } = useDemo();
  const { user } = useSession();
  const router = useRouter();
  const showCustomer = user ? can(user.role, 'customers.read') : false;
  const [view, setView] = useState<ViewId>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('status');

  const rows = useMemo(
    () =>
      estimates.map((estimate) => {
        const order = orders.find((item) => item.id === estimate.workOrderId);
        const property = order ? propertyById(order.propertyId) : undefined;
        return { estimate, order, property };
      }),
    [orders]
  );

  const views: { id: ViewId; label: string }[] = [
    { id: 'all', label: 'All estimates' },
    { id: 'internal_review', label: 'In review' },
    { id: 'sent_to_jobtread', label: 'Sent toward JobTread' },
    { id: 'approved', label: 'Approved' }
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank = { draft: 0, internal_review: 1, sent_to_jobtread: 2, approved: 3 };
    return rows
      .filter(({ estimate }) => view === 'all' || estimate.status === view)
      .filter(({ estimate, order, property }) => {
        if (!q) return true;
        return `${estimate.number} ${estimate.preparedBy} ${order?.number ?? ''} ${property?.name ?? ''} ${showCustomer && order ? customerName(order.customerId) : ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === 'amount') return b.estimate.amount - a.estimate.amount;
        if (sort === 'number') return a.estimate.number.localeCompare(b.estimate.number);
        return rank[a.estimate.status] - rank[b.estimate.status] || b.estimate.amount - a.estimate.amount;
      });
  }, [rows, view, query, sort, showCustomer]);

  const pipeline = estimates.reduce((sum, item) => sum + item.amount, 0);
  const review = estimates.filter((item) => item.status === 'internal_review');
  const sent = estimates.filter((item) => item.status === 'sent_to_jobtread');
  const approved = estimates.filter((item) => item.status === 'approved');

  return (
    <Gate permission="estimates.read" title="Estimates are limited" body="Pricing stays with the owner, the estimator, and operations. Field roles do not see it.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">JobTread handoff</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Quotes & estimates</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">Prepared here so the estimator can work the job. JobTread remains the system of record until a connection exists.</p>
        </header>

        <HandoffNote>These records are ready to sync. Nothing on this screen is a live JobTread connection.</HandoffNote>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Wallet size={16} />} label="In the pipeline" value={money(pipeline)} note={`${estimates.length} estimates`} />
          <Stat icon={<FileSpreadsheet size={16} />} label="In review" value={String(review.length)} note={review.length ? money(review.reduce((sum, item) => sum + item.amount, 0)) : 'Nothing waiting'} onClick={() => setView('internal_review')} />
          <Stat icon={<Send size={16} />} label="Sent toward JobTread" value={String(sent.length)} note={sent.length ? money(sent.reduce((sum, item) => sum + item.amount, 0)) : 'None queued'} onClick={() => setView('sent_to_jobtread')} />
          <Stat icon={<CheckCircle2 size={16} />} label="Approved" value={String(approved.length)} note={approved.length ? money(approved.reduce((sum, item) => sum + item.amount, 0)) : 'None approved'} onClick={() => setView('approved')} />
        </section>

        <nav aria-label="Estimate views" className="flex flex-wrap gap-1.5">
          {views.map((item) => {
            const active = item.id === view;
            const count = item.id === 'all' ? estimates.length : estimates.filter((estimate) => estimate.status === item.id).length;
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
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${active ? 'bg-white/15 text-white' : 'bg-[#f3efe6] text-muted'}`}>{count}</span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder={showCustomer ? 'Estimate, job, customer…' : 'Estimate, job, property…'} width="w-64" />
            </FilterField>
            {query || view !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setView('all');
                }}
                className="h-10 px-2 text-sm font-medium text-copper hover:underline"
              >
                Clear
              </button>
            ) : null}
            <div className="ml-auto">
              <FilterField label="Sort by">
                <PillSelect value={sort} onChange={(value) => setSort(value as SortId)} width="w-40">
                  <option value="status">Workflow</option>
                  <option value="amount">Highest amount</option>
                  <option value="number">Number</option>
                </PillSelect>
              </FilterField>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-[#f0ebe3]">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-[12px] text-[#8a8278]">
                  <th className="px-5 py-3 font-medium">Estimate</th>
                  <th className="px-3 py-3 font-medium">Job</th>
                  {showCustomer ? <th className="px-3 py-3 font-medium">Customer</th> : null}
                  <th className="px-3 py-3 font-medium">Prepared by</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {list.map(({ estimate, order, property }) => (
                  <tr
                    key={estimate.id}
                    onClick={() => order && router.push(`/work-orders/${order.id}`)}
                    className={order ? 'cursor-pointer border-t border-[#f3efe8] transition hover:bg-[#faf8f5]' : 'border-t border-[#f3efe8]'}
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink">{estimate.number}</div>
                      <div className="text-xs text-muted">{order ? SERVICE_LABEL[order.service] : '—'}</div>
                    </td>
                    <td className="px-3 py-3">
                      {order ? (
                        <Link href={`/work-orders/${order.id}`} className="font-medium text-ink hover:text-copper" onClick={(event) => event.stopPropagation()}>
                          {order.number}
                        </Link>
                      ) : (
                        estimate.workOrderId
                      )}
                      <div className="text-xs text-muted">{property?.name}</div>
                    </td>
                    {showCustomer ? <td className="px-3 py-3 text-[#4a443d]">{order ? customerName(order.customerId) : '—'}</td> : null}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={estimate.preparedBy} tone="person" size="sm" />
                        <span className="text-[#4a443d]">{estimate.preparedBy}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={estimate.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular text-ink">{money(estimate.amount)}</td>
                  </tr>
                ))}
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={showCustomer ? 6 : 5} className="px-5 py-12 text-center text-sm text-muted">
                      No estimates match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Gate>
  );
}

function StatusChip({ status }: { status: EstimateRecord['status'] }) {
  const tone = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {tone.label}
    </span>
  );
}

function Stat({ icon, label, value, note, onClick }: { icon: React.ReactNode; label: string; value: string; note: string; onClick?: () => void }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f3efe8] text-[#6f6a62]">{icon}</span>
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
