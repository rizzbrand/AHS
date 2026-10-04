'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, Building2, Landmark, Layers, LayoutGrid, List, Search, User, Users } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { Avatar, FilterField, PillSearch, PillSelect, RowMenu } from '../../../components/ui/DataTable';
import { useDemo } from '../../../lib/demo-store';
import { CUSTOMER_KIND_LABEL, SOURCE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { isOpen, isOverdue } from '../../../lib/records';
import { customers, properties } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { Customer, CustomerKind } from '../../../lib/types';

type ViewId = 'all' | 'open' | 'late';
type SortId = 'open' | 'name' | 'jobs' | 'sites';

const KIND_ICON: Record<CustomerKind, typeof Building2> = {
  property_manager: Building2,
  portfolio: Layers,
  institutional: Landmark,
  direct: User
};

const KIND_TONE: Record<CustomerKind, string> = {
  property_manager: 'bg-[#e4ecf4] text-[#1e3a5f]',
  portfolio: 'bg-[#ede7f6] text-[#4b3a78]',
  institutional: 'bg-[#e8f0ea] text-[#2f5d3d]',
  direct: 'bg-[#f6ecd9] text-[#7a4e08]'
};

type Row = {
  customer: Customer;
  sites: number;
  open: number;
  late: number;
  total: number;
};

export default function CustomersPage() {
  const { user } = useSession();
  const { orders } = useDemo();
  const router = useRouter();
  const showContact = user ? can(user.role, 'customers.contact') : false;
  const canSeeJobs = user ? can(user.role, 'jobs.read') : false;
  const canSeeInvoices = user ? can(user.role, 'invoices.read') : false;

  const [view, setView] = useState<ViewId>('all');
  const [kind, setKind] = useState<CustomerKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('open');
  const [layout, setLayout] = useState<'grid' | 'table'>('grid');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      customers.map((customer) => {
        const jobs = orders.filter((order) => order.customerId === customer.id);
        const open = jobs.filter(isOpen);
        return {
          customer,
          sites: properties.filter((property) => property.customerId === customer.id).length,
          open: open.length,
          late: open.filter(isOverdue).length,
          total: jobs.length
        };
      }),
    [orders]
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (view === 'open' && row.open === 0) return false;
        if (view === 'late' && row.late === 0) return false;
        if (kind !== 'all' && row.customer.kind !== kind) return false;
        const haystack = `${row.customer.name} ${row.customer.region} ${CUSTOMER_KIND_LABEL[row.customer.kind]} ${row.customer.contactName} ${row.customer.sources.join(' ')}`.toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort((a, b) => {
        if (sort === 'name') return a.customer.name.localeCompare(b.customer.name);
        if (sort === 'jobs') return b.total - a.total || a.customer.name.localeCompare(b.customer.name);
        if (sort === 'sites') return b.sites - a.sites || a.customer.name.localeCompare(b.customer.name);
        return b.open - a.open || b.late - a.late || a.customer.name.localeCompare(b.customer.name);
      });
  }, [rows, view, kind, query, sort]);

  const views: { id: ViewId; label: string }[] = [
    { id: 'all', label: 'All customers' },
    { id: 'open', label: 'Open work' },
    { id: 'late', label: 'Past due' }
  ];
  const viewCount = (id: ViewId) => (id === 'all' ? rows.length : id === 'open' ? rows.filter((row) => row.open > 0).length : rows.filter((row) => row.late > 0).length);
  const filtersOn = Boolean(query) || kind !== 'all' || view !== 'all';

  return (
    <Gate permission="customers.read" title="Customer records are limited" body="Client contact details are not part of dispatch or field work.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Directory</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Customers</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Organizations and direct clients. Properties and work orders hang off these records — they are not the same thing.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Users size={16} />} label="Customers" value={rows.length} note={`${new Set(customers.map((item) => item.kind)).size} kinds of account`} active={view === 'all'} onClick={() => setView('all')} />
          <Stat icon={<Building2 size={16} />} label="Properties" value={properties.length} note="Sites under these accounts" />
          <Stat icon={<Layers size={16} />} label="With open work" value={viewCount('open')} note="Active jobs on the account" active={view === 'open'} onClick={() => setView('open')} />
          <Stat icon={<AlertTriangle size={16} />} label="Past due" value={viewCount('late')} note={viewCount('late') ? 'Jobs behind deadline' : 'Nothing late'} warn active={view === 'late'} onClick={() => setView('late')} />
        </section>

        <nav aria-label="Customer views" className="flex flex-wrap gap-1.5">
          {views.map((item) => {
            const active = view === item.id;
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
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${active ? 'bg-white/15 text-white' : 'bg-[#f3efe6] text-muted'}`}>
                  {viewCount(item.id)}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder={showContact ? 'Name, region, contact, source…' : 'Name, region, or source…'} width="w-64" />
            </FilterField>
            <FilterField label="Kind">
              <PillSelect value={kind} onChange={(value) => setKind(value as CustomerKind | 'all')} width="w-48">
                <option value="all">All kinds</option>
                {Object.entries(CUSTOMER_KIND_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
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
                  setKind('all');
                  setView('all');
                }}
                className="h-10 px-2 text-sm font-medium text-copper hover:underline"
              >
                Clear
              </button>
            ) : null}
            <div className="ml-auto flex items-end gap-3">
              <FilterField label="Sort by">
                <PillSelect value={sort} onChange={(value) => setSort(value as SortId)} width="w-44">
                  <option value="open">Most open work</option>
                  <option value="sites">Most properties</option>
                  <option value="jobs">Most jobs</option>
                  <option value="name">Name A–Z</option>
                </PillSelect>
              </FilterField>
              <div className="flex h-10 items-center gap-0.5 rounded-full bg-[#f6f3ee] p-1" role="group" aria-label="Layout">
                {(['grid', 'table'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLayout(item)}
                    aria-label={item === 'grid' ? 'Card view' : 'Table view'}
                    aria-pressed={layout === item}
                    className={`grid h-8 w-9 place-items-center rounded-full transition ${layout === item ? 'bg-white text-ink shadow-sm' : 'text-[#8a8278] hover:text-ink'}`}
                  >
                    {item === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#f0ebe3] px-5 py-2.5 text-[12px] text-[#8a8278]">
            Showing <span className="font-semibold text-ink tabular">{list.length}</span> of {rows.length} customers
          </div>

          {list.length === 0 ? (
            <div className="border-t border-[#f0ebe3] px-5 py-14 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
                <Search size={18} />
              </span>
              <p className="mt-3 font-medium text-ink">No customers match</p>
              <p className="mt-1 text-sm text-muted">Try another kind or search term.</p>
            </div>
          ) : layout === 'grid' ? (
            <ul className="grid gap-4 border-t border-[#f0ebe3] bg-[#faf8f5] p-5 md:grid-cols-2">
              {list.map((row) => (
                <CustomerCard key={row.customer.id} row={row} showContact={showContact} />
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto border-t border-[#f0ebe3]">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="text-left text-[12px] font-medium text-[#8a8278]">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Kind</th>
                    <th className="px-3 py-3 font-medium">Primary contact</th>
                    <th className="px-3 py-3 font-medium">Work arrives through</th>
                    <th className="px-3 py-3 text-right font-medium">Properties</th>
                    <th className="px-3 py-3 text-right font-medium">Open</th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => {
                    const { customer } = row;
                    const Icon = KIND_ICON[customer.kind];
                    return (
                      <tr key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer border-t border-[#f3efe8] transition hover:bg-[#faf8f5]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[#6f6a62]">
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-ink">{customer.name}</div>
                              <div className="truncate text-xs text-muted">{customer.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <KindChip kind={customer.kind} />
                        </td>
                        <td className="px-3 py-3">
                          {showContact ? (
                            <>
                              <div className="font-medium text-ink">{customer.contactName}</div>
                              <div className="text-xs text-muted">
                                {customer.contactRole} · {customer.phone}
                              </div>
                            </>
                          ) : (
                            <span className="text-[#9a9187]">Hidden for this role</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[13px] text-[#4a443d]">{customer.sources.map((source) => SOURCE_LABEL[source]).join(' · ')}</td>
                        <td className="px-3 py-3 text-right tabular text-[#4a443d]">{row.sites}</td>
                        <td className="px-3 py-3 text-right">
                          <span className={`tabular ${row.open > 0 ? 'font-semibold text-ink' : 'text-[#a59d92]'}`}>{row.open}</span>
                          {row.late > 0 ? <div className="text-[11px] font-semibold text-[#9f2d2d]">{row.late} past due</div> : null}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <RowMenu
                            label={`Actions for ${customer.name}`}
                            open={menuFor === customer.id}
                            onToggle={() => setMenuFor((current) => (current === customer.id ? null : customer.id))}
                            onClose={() => setMenuFor(null)}
                            items={[
                              { href: `/customers/${customer.id}`, label: 'Open customer' },
                              { href: '/properties', label: 'Properties' },
                              ...(canSeeJobs ? [{ href: '/work-orders', label: 'Work orders' }] : []),
                              ...(canSeeInvoices ? [{ href: '/invoices', label: 'Invoices' }] : [])
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Gate>
  );
}

function CustomerCard({ row, showContact }: { row: Row; showContact: boolean }) {
  const { customer, sites, open, late, total } = row;
  const Icon = KIND_ICON[customer.kind];

  return (
    <li>
      <Link
        href={`/customers/${customer.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#ece6dc] bg-white transition hover:-translate-y-0.5 hover:border-[#d9cfc0] hover:shadow-[0_10px_30px_-18px_rgba(28,25,21,0.35)]"
      >
        <div className="flex items-start gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[#6f6a62] transition group-hover:bg-amber/25 group-hover:text-[#7a4e08]">
            <Icon size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold text-ink">{customer.name}</h2>
              <KindChip kind={customer.kind} />
            </div>
            <p className="mt-0.5 truncate text-[13px] text-muted">{customer.region}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 pb-4">
          {showContact ? (
            <>
              <Avatar name={customer.contactName} tone="person" size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{customer.contactName}</p>
                <p className="truncate text-[11px] text-[#9a9187]">
                  {customer.contactRole} · {customer.phone}
                </p>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#9a9187]">Contact details are hidden for this role.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {customer.sources.map((source) => (
            <span key={source} className="rounded-full bg-[#f3efe6] px-2 py-0.5 text-[11px] font-semibold text-[#6f6a62]">
              {SOURCE_LABEL[source]}
            </span>
          ))}
        </div>

        <dl className="mt-auto grid grid-cols-3 divide-x divide-[#f0ebe3] border-t border-[#f0ebe3] text-center">
          <div className="px-2 py-3">
            <dt className="text-[11px] text-[#9a9187]">Properties</dt>
            <dd className="mt-0.5 text-[15px] font-semibold tabular text-ink">{sites}</dd>
          </div>
          <div className="px-2 py-3">
            <dt className="text-[11px] text-[#9a9187]">Open</dt>
            <dd className={`mt-0.5 text-[15px] font-semibold tabular ${open > 0 ? 'text-ink' : 'text-[#b5ada2]'}`}>{open}</dd>
          </div>
          <div className="px-2 py-3">
            <dt className="text-[11px] text-[#9a9187]">{late > 0 ? 'Past due' : 'All jobs'}</dt>
            <dd className={`mt-0.5 text-[15px] font-semibold tabular ${late > 0 ? 'text-[#9f2d2d]' : 'text-ink'}`}>{late > 0 ? late : total}</dd>
          </div>
        </dl>
      </Link>
    </li>
  );
}

function KindChip({ kind }: { kind: CustomerKind }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${KIND_TONE[kind]}`}>{CUSTOMER_KIND_LABEL[kind]}</span>;
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
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${warn && value > 0 ? 'bg-[#fbefed] text-[#b33a3a]' : 'bg-[#f3efe8] text-[#6f6a62]'}`}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </>
  );
  const base = `rounded-2xl border bg-white p-4 text-left ${active ? 'border-ink ring-1 ring-ink' : 'border-[#ece6dc]'}`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${base} transition hover:border-[#d9cfc0] hover:shadow-sm`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}
