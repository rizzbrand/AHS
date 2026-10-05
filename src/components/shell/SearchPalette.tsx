'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { can } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { useDemo } from '../../lib/demo-store';
import { contractors, customers, employees, properties } from '../../lib/seed';
import { SERVICE_LABEL, SOURCE_LABEL } from '../../lib/labels';
import { propertyById } from '../../lib/records';

type Hit = { href: string; label: string; meta: string; group: string };

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useSession();
  const { orders } = useDemo();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const hits = useMemo(() => {
    if (!user) return [];
    const q = query.trim().toLowerCase();
    const list: Hit[] = [];
    if (can(user.role, 'jobs.read')) {
      orders.forEach((order) => {
        const property = propertyById(order.propertyId);
        list.push({
          href: `/work-orders/${order.id}`,
          label: `${order.number} · ${SERVICE_LABEL[order.service]}`,
          meta: `${SOURCE_LABEL[order.source]} · ${property?.city ?? ''}`,
          group: 'Work orders'
        });
      });
    }
    if (can(user.role, 'customers.read')) {
      customers.forEach((customer) => {
        list.push({ href: `/customers/${customer.id}`, label: customer.name, meta: customer.region, group: 'Customers' });
      });
    }
    if (can(user.role, 'properties.read')) {
      properties.forEach((property) => {
        list.push({
          href: `/properties/${property.id}`,
          label: property.name,
          meta: `${property.city}, ${property.state}`,
          group: 'Properties'
        });
      });
    }
    if (can(user.role, 'contractors.read')) {
      contractors.forEach((contractor) => {
        list.push({ href: `/contractors/${contractor.id}`, label: contractor.company, meta: contractor.serviceArea, group: 'Contractors' });
      });
    }
    if (can(user.role, 'workforce.read')) {
      employees.forEach((employee) => {
        list.push({ href: `/workforce/${employee.id}`, label: employee.name, meta: employee.title, group: 'Workforce' });
      });
    }
    if (!q) return list.slice(0, 8);
    return list.filter((hit) => `${hit.label} ${hit.meta}`.toLowerCase().includes(q)).slice(0, 12);
  }, [orders, query, user]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#1c1915]/40 px-3 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-4 sm:pt-[12vh]" onMouseDown={onClose}>
      <div className="w-full max-w-xl border border-line bg-surface shadow-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search work orders, properties, customers"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <button type="button" onClick={onClose} className="text-xs text-muted">
            Close
          </button>
        </div>
        <ul className="max-h-80 overflow-auto py-1">
          {hits.length === 0 ? <li className="px-4 py-6 text-sm text-muted">Nothing in your access matches that search.</li> : null}
          {hits.map((hit) => (
            <li key={`${hit.group}-${hit.label}`}>
              <Link href={hit.href} onClick={onClose} className="flex items-baseline justify-between gap-4 px-4 py-2.5 hover:bg-paper">
                <span>
                  <span className="block text-sm font-medium text-ink">{hit.label}</span>
                  <span className="text-xs text-muted">{hit.meta}</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">{hit.group}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
