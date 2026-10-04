'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, Building, Building2, CalendarClock, ChevronRight, Home, Landmark, LayoutGrid, List, MapPin, ShieldCheck, Store, Wrench } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { Avatar, FilterField, PillSearch, PillSelect, RowMenu } from '../../../components/ui/DataTable';
import { useDemo } from '../../../lib/demo-store';
import { TODAY, shortDate, timeLabel } from '../../../lib/format';
import { PROPERTY_TYPE_LABEL } from '../../../lib/labels';
import { can } from '../../../lib/permissions';
import { customerName, isOpen } from '../../../lib/records';
import { properties } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { Property, PropertyType } from '../../../lib/types';

type StateId = 'all' | Property['state'];
type ViewId = 'all' | 'open' | 'hazards' | 'quiet';
type SortId = 'open' | 'name' | 'recent' | 'next';

const TYPE_ICON: Record<PropertyType, typeof Building> = {
  retail: Store,
  multifamily: Building2,
  office: Building,
  single_family: Home,
  mixed_use: Building2,
  institutional: Landmark
};

const STATE_TONE: Record<Property['state'], string> = {
  DC: 'bg-[#ede7f6] text-[#4b3a78]',
  MD: 'bg-[#f6e7d8] text-[#8c4520]',
  VA: 'bg-[#e4ecf4] text-[#1e3a5f]'
};

type Row = {
  property: Property;
  open: number;
  total: number;
  lastVisit?: string;
  nextVisit?: string;
};

const VIEWS: { id: ViewId; label: string; test: (row: Row) => boolean }[] = [
  { id: 'all', label: 'All properties', test: () => true },
  { id: 'open', label: 'Open work', test: (row) => row.open > 0 },
  { id: 'hazards', label: 'Hazards on file', test: (row) => row.property.hazards.length > 0 },
  { id: 'quiet', label: 'No open work', test: (row) => row.open === 0 }
];

export default function PropertiesPage() {
  const { orders } = useDemo();
  const { user } = useSession();
  const router = useRouter();
  const canSeeCustomer = user ? can(user.role, 'customers.read') : false;
  const canSeeJobs = user ? can(user.role, 'jobs.read') : false;

  const [view, setView] = useState<ViewId>('all');
  const [state, setState] = useState<StateId>('all');
  const [type, setType] = useState<PropertyType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('open');
  const [layout, setLayout] = useState<'grid' | 'table'>('grid');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      properties.map((property) => {
        const here = orders.filter((order) => order.propertyId === property.id);
        const visits = here.map((order) => order.checkedOutAt ?? order.checkedInAt).filter(Boolean) as string[];
        const upcoming = here
          .filter((order) => isOpen(order) && order.scheduledStart && order.scheduledStart.slice(0, 10) >= TODAY)
          .map((order) => order.scheduledStart as string)
          .sort();
        return { property, open: here.filter(isOpen).length, total: here.length, lastVisit: visits.sort().at(-1), nextVisit: upcoming[0] };
      }),
    [orders]
  );

  const list = useMemo(() => {
    const test = VIEWS.find((item) => item.id === view)?.test ?? (() => true);
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const { property } = row;
      if (!test(row)) return false;
      if (state !== 'all' && property.state !== state) return false;
      if (type !== 'all' && property.type !== type) return false;
      const haystack = `${property.name} ${property.address} ${property.city} ${property.zip} ${canSeeCustomer ? customerName(property.customerId) : ''}`.toLowerCase();
      return !q || haystack.includes(q);
    });
    return filtered.sort((a, b) => {
      if (sort === 'name') return a.property.name.localeCompare(b.property.name);
      if (sort === 'recent') return (b.lastVisit ?? '').localeCompare(a.lastVisit ?? '');
      if (sort === 'next') return (a.nextVisit ?? '9999').localeCompare(b.nextVisit ?? '9999');
      return b.open - a.open || a.property.name.localeCompare(b.property.name);
    });
  }, [rows, view, state, type, query, sort, canSeeCustomer]);

  const stats = {
    total: rows.length,
    open: rows.filter((row) => row.open > 0).length,
    hazards: rows.filter((row) => row.property.hazards.length > 0).length,
    scheduled: rows.filter((row) => row.nextVisit).length
  };
  const stateCount = (id: StateId) => (id === 'all' ? rows.length : rows.filter((row) => row.property.state === id).length);
  const filtersOn = Boolean(query) || state !== 'all' || type !== 'all';

  return (
    <Gate permission="properties.read" title="Properties are limited" body="Location records are not part of this role.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Directory</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Properties</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">Addresses across DC, Maryland, and Virginia. A customer can own many of these, and each keeps its own service history.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<MapPin size={16} />} label="Properties on file" value={stats.total} note={`${stateCount('DC')} DC · ${stateCount('MD')} MD · ${stateCount('VA')} VA`} />
          <Stat icon={<Wrench size={16} />} label="With open work" value={stats.open} note="Active jobs at the address" onClick={() => setView('open')} />
          <Stat icon={<CalendarClock size={16} />} label="Visits scheduled" value={stats.scheduled} note="Crew booked from today on" />
          <Stat icon={<AlertTriangle size={16} />} label="Hazards on file" value={stats.hazards} note="Shown to crews before arrival" warn onClick={() => setView('hazards')} />
        </section>

        <nav aria-label="Saved views" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {VIEWS.map((item) => {
            const active = item.id === view;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-pressed={active}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition ${
                  active ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-[#4a443d] hover:border-[#cfc6b8] hover:text-ink'
                }`}
              >
                {item.label}
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${active ? 'bg-white/15 text-white' : 'bg-[#f3efe6] text-muted'}`}>
                  {rows.filter(item.test).length}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder={canSeeCustomer ? 'Name, street, ZIP, customer…' : 'Name, street, city, ZIP…'} width="w-64" />
            </FilterField>
            <FilterField label="State">
              <div className="flex h-10 items-center gap-0.5 rounded-full bg-[#f6f3ee] p-1">
                {(['all', 'DC', 'MD', 'VA'] as StateId[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setState(item)}
                    className={`h-8 rounded-full px-3 text-[13px] transition ${state === item ? 'bg-white font-semibold text-ink shadow-sm' : 'text-[#7a746b] hover:text-ink'}`}
                  >
                    {item === 'all' ? 'All' : item}
                    <span className="ml-1 text-[11px] text-[#a59d92] tabular">{stateCount(item)}</span>
                  </button>
                ))}
              </div>
            </FilterField>
            <FilterField label="Type">
              <PillSelect value={type} onChange={(value) => setType(value as PropertyType | 'all')} width="w-40">
                <option value="all">All types</option>
                {Object.entries(PROPERTY_TYPE_LABEL).map(([id, label]) => (
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
                  setState('all');
                  setType('all');
                }}
                className="h-10 px-2 text-sm font-medium text-copper hover:underline"
              >
                Clear
              </button>
            ) : null}
            <div className="ml-auto flex items-end gap-3">
              <FilterField label="Sort by">
                <PillSelect value={sort} onChange={(value) => setSort(value as SortId)} width="w-40">
                  <option value="open">Most open work</option>
                  <option value="next">Next visit</option>
                  <option value="recent">Last visited</option>
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
            Showing <span className="font-semibold text-ink tabular">{list.length}</span> of {rows.length} properties
          </div>

          {list.length === 0 ? (
            <div className="border-t border-[#f0ebe3] px-5 py-14 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
                <MapPin size={18} />
              </span>
              <p className="mt-3 font-medium text-ink">No properties match</p>
              <p className="mt-1 text-sm text-muted">Try another state, type, or search term.</p>
            </div>
          ) : layout === 'grid' ? (
            <div className="grid gap-4 border-t border-[#f0ebe3] bg-[#faf8f5] p-5 md:grid-cols-2 xl:grid-cols-3">
              {list.map((row) => (
                <PropertyCard key={row.property.id} row={row} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-[#f0ebe3]">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="text-left text-[12px] font-medium text-[#8a8278]">
                    <th className="px-5 py-3 font-medium">Property</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 text-right font-medium">Open</th>
                    <th className="px-3 py-3 text-right font-medium">All jobs</th>
                    <th className="px-3 py-3 font-medium">Last visit</th>
                    <th className="px-3 py-3 font-medium">Next visit</th>
                    <th className="px-3 py-3 font-medium">Site</th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map(({ property, open, total, lastVisit, nextVisit }) => {
                    const Icon = TYPE_ICON[property.type];
                    const items = [
                      { href: `/properties/${property.id}`, label: 'Open property' },
                      ...(canSeeCustomer ? [{ href: `/customers/${property.customerId}`, label: 'Open customer' }] : []),
                      ...(canSeeJobs ? [{ href: '/work-orders', label: 'Work orders' }] : [])
                    ];
                    return (
                      <tr key={property.id} onClick={() => router.push(`/properties/${property.id}`)} className="cursor-pointer border-t border-[#f3efe8] transition hover:bg-[#faf8f5]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[#6f6a62]">
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-semibold text-ink">{property.name}</span>
                                <StateChip state={property.state} />
                              </div>
                              <div className="truncate text-xs text-muted">
                                {property.address}, {property.city} {property.zip}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[#4a443d]">{customerName(property.customerId)}</td>
                        <td className="px-3 py-3 text-[#4a443d]">{PROPERTY_TYPE_LABEL[property.type]}</td>
                        <td className="px-3 py-3 text-right tabular">
                          <span className={open > 0 ? 'font-semibold text-ink' : 'text-[#a59d92]'}>{open}</span>
                        </td>
                        <td className="px-3 py-3 text-right tabular text-[#4a443d]">{total}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-[#4a443d]">{lastVisit ? shortDate(lastVisit) : <span className="text-[#a59d92]">Never</span>}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-[#4a443d]">{nextVisit ? timeLabel(nextVisit) : <span className="text-[#a59d92]">Not booked</span>}</td>
                        <td className="px-3 py-3">
                          <HazardChip count={property.hazards.length} />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <RowMenu
                            label={`Actions for ${property.name}`}
                            open={menuFor === property.id}
                            onToggle={() => setMenuFor((current) => (current === property.id ? null : property.id))}
                            onClose={() => setMenuFor(null)}
                            items={items}
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

function Stat({ icon, label, value, note, warn = false, onClick }: { icon: React.ReactNode; label: string; value: number; note: string; warn?: boolean; onClick?: () => void }) {
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
  const base = 'rounded-2xl border border-[#ece6dc] bg-white p-4 text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} transition hover:border-[#d9cfc0] hover:shadow-sm`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}

function StateChip({ state }: { state: Property['state'] }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATE_TONE[state]}`}>{state}</span>;
}

function HazardChip({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#6b8a72]">
        <ShieldCheck size={13} /> No hazards
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fbefed] px-2.5 py-1 text-[11px] font-semibold text-[#9f2d2d]">
      <AlertTriangle size={12} />
      {count} {count === 1 ? 'hazard' : 'hazards'}
    </span>
  );
}

function PropertyCard({ row }: { row: Row }) {
  const { property, open, total, lastVisit, nextVisit } = row;
  const Icon = TYPE_ICON[property.type];
  const customer = customerName(property.customerId);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#ece6dc] bg-white transition hover:-translate-y-0.5 hover:border-[#d9cfc0] hover:shadow-[0_10px_30px_-18px_rgba(28,25,21,0.35)]"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[#6f6a62] transition group-hover:bg-amber/25 group-hover:text-[#7a4e08]">
          <Icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-[15px] font-semibold text-ink">{property.name}</h2>
            <StateChip state={property.state} />
          </div>
          <p className="truncate text-[13px] text-muted">{property.address}</p>
          <p className="truncate text-[13px] text-muted">
            {property.city}, {property.state} {property.zip}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-4">
        <Avatar name={customer ?? ''} tone="contractor" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{customer}</p>
          <p className="text-[11px] text-[#9a9187]">{PROPERTY_TYPE_LABEL[property.type]}</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-[#f0ebe3] border-t border-[#f0ebe3] text-center">
        <div className="px-2 py-3">
          <dt className="text-[11px] text-[#9a9187]">Open</dt>
          <dd className={`mt-0.5 flex items-center justify-center gap-1.5 text-[15px] font-semibold tabular ${open > 0 ? 'text-ink' : 'text-[#b5ada2]'}`}>
            {open > 0 ? <span className="h-1.5 w-1.5 rounded-full bg-amber" /> : null}
            {open}
          </dd>
        </div>
        <div className="px-2 py-3">
          <dt className="text-[11px] text-[#9a9187]">All jobs</dt>
          <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular">{total}</dd>
        </div>
        <div className="px-2 py-3">
          <dt className="text-[11px] text-[#9a9187]">Last visit</dt>
          <dd className={`mt-0.5 text-[15px] font-semibold ${lastVisit ? 'text-ink' : 'text-[#b5ada2]'}`}>{lastVisit ? shortDate(lastVisit) : 'Never'}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#f0ebe3] bg-[#fcfbf9] px-4 py-2.5">
        <HazardChip count={property.hazards.length} />
        <span className="inline-flex items-center gap-1 truncate text-[12px] text-[#6f6a62]">
          {nextVisit ? (
            <>
              <CalendarClock size={13} className="shrink-0 text-[#9a9187]" />
              Next {timeLabel(nextVisit)}
            </>
          ) : (
            <span className="text-[#a59d92]">No visit booked</span>
          )}
          <ChevronRight size={14} className="shrink-0 text-[#c9c1b5] transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </span>
      </div>
    </Link>
  );
}
