'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Receipt, Send } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { FilterField, PillSearch, PillSelect } from '../../../components/ui/DataTable';
import { HandoffNote } from '../../../components/ui/PageHeader';
import { useDemo } from '../../../lib/demo-store';
import { money, shortDate } from '../../../lib/format';
import { SERVICE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { customerName, propertyById } from '../../../lib/records';
import { invoices } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { InvoiceRecord } from '../../../lib/types';

const STATUS: Record<InvoiceRecord['status'], { label: string; tone: string }> = {
  ready_for_jobtread: { label: 'Ready for JobTread', tone: 'bg-[#e4ecf4] text-[#1e3a5f]' },
  submitted: { label: 'Submitted', tone: 'bg-[#efece6] text-[#6f6a62]' },
  partial: { label: 'Partial', tone: 'bg-[#f8ecd4] text-[#7a4e08]' },
  paid: { label: 'Paid', tone: 'bg-[#e5f0e4] text-[#1d5a32]' },
  overdue: { label: 'Overdue', tone: 'bg-[#f6dedb] text-[#9f2d2d]' }
};

type ViewId = 'all' | InvoiceRecord['status'];
type SortId = 'status' | 'amount' | 'issued';

export default function InvoicesPage() {
  const { orders } = useDemo();
  const { user } = useSession();
  const router = useRouter();
  const showCustomer = user ? can(user.role, 'customers.read') : false;
  const [view, setView] = useState<ViewId>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('status');

  const rows = useMemo(
    () =>
      invoices.map((invoice) => {
        const order = orders.find((item) => item.id === invoice.workOrderId);
        return { invoice, order, property: order ? propertyById(order.propertyId) : undefined };
      }),
    [orders]
  );

  const views: { id: ViewId; label: string }[] = [
    { id: 'all', label: 'All invoices' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'ready_for_jobtread', label: 'Ready for JobTread' },
    { id: 'paid', label: 'Paid' }
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank = { overdue: 0, ready_for_jobtread: 1, submitted: 2, partial: 3, paid: 4 };
    return rows
      .filter(({ invoice }) => view === 'all' || invoice.status === view)
      .filter(({ invoice, order, property }) => {
        if (!q) return true;
        return `${invoice.number} ${order?.number ?? ''} ${property?.name ?? ''} ${showCustomer && order ? customerName(order.customerId) : ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === 'amount') return b.invoice.amount - a.invoice.amount;
        if (sort === 'issued') return b.invoice.issuedAt.localeCompare(a.invoice.issuedAt);
        return rank[a.invoice.status] - rank[b.invoice.status] || b.invoice.issuedAt.localeCompare(a.invoice.issuedAt);
      });
  }, [rows, view, query, sort, showCustomer]);

  const open = invoices.filter((item) => item.status !== 'paid');
  const overdue = invoices.filter((item) => item.status === 'overdue');
  const ready = invoices.filter((item) => item.status === 'ready_for_jobtread');
  const paid = invoices.filter((item) => item.status === 'paid');
  const receivable = open.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Gate permission="invoices.read" title="Invoices are limited" body="Invoice amounts and payment status are visible to the owner. Operations can run the job without this register.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">JobTread handoff</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Invoices</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">Payment follow-up for work that has already been documented. Collection still happens in JobTread.</p>
        </header>

        <HandoffNote>Invoice numbers shown with a JT prefix are references, not a live billing connection.</HandoffNote>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Receipt size={16} />} label="Receivable" value={money(receivable)} note={`${open.length} still open`} />
          <Stat icon={<AlertTriangle size={16} />} label="Overdue" value={String(overdue.length)} note={overdue.length ? money(overdue.reduce((sum, item) => sum + item.amount, 0)) : 'Nothing late'} warn={overdue.length > 0} onClick={() => setView('overdue')} />
          <Stat icon={<Send size={16} />} label="Ready for JobTread" value={String(ready.length)} note={ready.length ? money(ready.reduce((sum, item) => sum + item.amount, 0)) : 'Nothing queued'} onClick={() => setView('ready_for_jobtread')} />
          <Stat icon={<CheckCircle2 size={16} />} label="Paid" value={String(paid.length)} note={paid.length ? money(paid.reduce((sum, item) => sum + item.amount, 0)) : 'None recorded'} onClick={() => setView('paid')} />
        </section>

        <nav aria-label="Invoice views" className="flex flex-wrap gap-1.5">
          {views.map((item) => {
            const active = item.id === view;
            const count = item.id === 'all' ? invoices.length : invoices.filter((invoice) => invoice.status === item.id).length;
            const alert = item.id === 'overdue' && count > 0;
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
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${
                    active ? 'bg-white/15 text-white' : alert ? 'bg-[#f6dedb] text-[#9f2d2d]' : 'bg-[#f3efe6] text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder={showCustomer ? 'Invoice, job, customer…' : 'Invoice or job…'} width="w-64" />
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
                  <option value="status">Needs follow-up</option>
                  <option value="amount">Highest amount</option>
                  <option value="issued">Newest issued</option>
                </PillSelect>
              </FilterField>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-[#f0ebe3]">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-[12px] text-[#8a8278]">
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-3 py-3 font-medium">Job</th>
                  {showCustomer ? <th className="px-3 py-3 font-medium">Customer</th> : null}
                  <th className="px-3 py-3 font-medium">Issued</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {list.map(({ invoice, order, property }) => (
                  <tr
                    key={invoice.id}
                    onClick={() => order && router.push(`/work-orders/${order.id}`)}
                    className={`${order ? 'cursor-pointer hover:bg-[#faf8f5]' : ''} border-t border-[#f3efe8] transition ${invoice.status === 'overdue' ? 'bg-[#fdf8f7]' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink">{invoice.number}</div>
                      <div className="text-xs text-muted">JobTread reference</div>
                    </td>
                    <td className="px-3 py-3">
                      {order ? (
                        <Link href={`/work-orders/${order.id}`} className="font-medium text-ink hover:text-copper" onClick={(event) => event.stopPropagation()}>
                          {order.number}
                        </Link>
                      ) : (
                        invoice.workOrderId
                      )}
                      <div className="text-xs text-muted">
                        {order ? SERVICE_LABEL[order.service] : ''}
                        {property ? ` · ${property.name}` : ''}
                      </div>
                    </td>
                    {showCustomer ? <td className="px-3 py-3 text-[#4a443d]">{order ? customerName(order.customerId) : '—'}</td> : null}
                    <td className="whitespace-nowrap px-3 py-3 text-[#4a443d]">{shortDate(invoice.issuedAt)}</td>
                    <td className="px-3 py-3">
                      <StatusChip status={invoice.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular text-ink">{money(invoice.amount)}</td>
                  </tr>
                ))}
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={showCustomer ? 6 : 5} className="px-5 py-12 text-center text-sm text-muted">
                      No invoices match these filters.
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

function StatusChip({ status }: { status: InvoiceRecord['status'] }) {
  const tone = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {tone.label}
    </span>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  warn = false,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  warn?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${warn ? 'bg-[#fbefed] text-[#b33a3a]' : 'bg-[#f3efe8] text-[#6f6a62]'}`}>{icon}</span>
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
