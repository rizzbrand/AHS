'use client';

import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Search, UserX } from 'lucide-react';
import { contractorName, employeeName, photoCount } from '../../lib/records';
import { WorkOrder } from '../../lib/types';

export function Avatar({ name, tone, size = 'md' }: { name: string; tone: 'person' | 'contractor' | 'system'; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const palette =
    tone === 'system' ? 'bg-[#ece7df] text-[#5e574e]' : tone === 'contractor' ? 'bg-[#e4ebf2] text-[#1e3a5f]' : 'bg-[#f3e2cc] text-[#7a4a14]';
  return (
    <span
      className={`relative z-10 grid shrink-0 place-items-center font-semibold ring-2 ring-white ${palette} ${
        tone === 'contractor' ? 'rounded-lg' : 'rounded-full'
      } ${size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-[11px]'}`}
    >
      {tone === 'system' ? 'AH' : initials}
    </span>
  );
}

export function AssigneeCell({ order }: { order: WorkOrder }) {
  const person = employeeName(order.assigneeId);
  const company = contractorName(order.contractorId);
  if (!person && !company) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-[#d9a9a3] text-[#b33a3a]">
          <UserX size={14} />
        </span>
        <span className="font-medium text-[#b33a3a]">Unassigned</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={person ?? company ?? ''} tone={company ? 'contractor' : 'person'} />
      <div className="min-w-0">
        <div className="truncate font-medium text-ink">{person ?? company}</div>
        <div className="text-xs text-muted">{company ? 'Contractor' : 'Field team'}</div>
      </div>
    </div>
  );
}

export function PhotoProgress({ order }: { order: WorkOrder }) {
  const photos = photoCount(order);
  if (!photos.total) return <span className="text-xs text-muted">Not required yet</span>;
  const pct = Math.round((photos.done / photos.total) * 100);
  return (
    <div className="w-24">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold tabular ${pct === 100 ? 'text-[#2f7a4a]' : pct >= 50 ? 'text-[#9a6700]' : 'text-ink'}`}>
          {photos.done}/{photos.total}
        </span>
        <span className="tabular text-muted">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f0ebe3]">
        <div className={`h-full rounded-full ${pct === 100 ? 'bg-[#2f7a4a]' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block w-full min-w-0 sm:w-auto">
      <span className="mb-1.5 block pl-1 text-[12px] font-medium text-[#8a8278]">{label}</span>
      {children}
    </label>
  );
}

export function PillSearch({ value, onChange, placeholder, width = 'w-full sm:w-56' }: { value: string; onChange: (value: string) => void; placeholder: string; width?: string }) {
  return (
    <div className="relative w-full min-w-0 sm:w-auto">
      <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9187]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-10 ${width} rounded-full bg-[#f6f3ee] pl-9 pr-4 text-sm text-ink outline-none ring-copper/30 placeholder:text-[#a59d92] focus:ring-2`}
      />
    </div>
  );
}

export function PillSelect({ value, onChange, children, width = 'w-full sm:w-44' }: { value: string; onChange: (value: string) => void; children: React.ReactNode; width?: string }) {
  return (
    <div className="relative w-full min-w-0 sm:w-auto">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 ${width} appearance-none rounded-full bg-[#f6f3ee] pl-4 pr-9 text-sm text-ink outline-none ring-copper/30 focus:ring-2`}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a8278]" />
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  const base = 'grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm tabular transition';
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page" className={`${base} text-ink hover:bg-[#f3efe6] disabled:opacity-30`}>
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
          className={`${base} ${number === page ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-ink hover:border-[#cfc6b8]'}`}
        >
          {number}
        </button>
      ))}
      <button type="button" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page" className={`${base} text-ink hover:bg-[#f3efe6] disabled:opacity-30`}>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export function RowMenu({
  label,
  open,
  onToggle,
  onClose,
  items
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="relative inline-block" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        className={`grid h-8 w-8 place-items-center rounded-lg text-[#8a8278] transition hover:bg-[#f0ebe3] hover:text-ink ${open ? 'bg-[#f0ebe3] text-ink' : ''}`}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Close actions" className="fixed inset-0 z-30 cursor-default" onClick={onClose} />
          <div className="absolute right-0 top-9 z-40 w-52 overflow-hidden rounded-xl border border-[#ece6dc] bg-white py-1 text-left shadow-sheet">
            {items.map((item) => (
              <Link key={item.label} href={item.href} className="block px-3.5 py-2 text-sm text-ink hover:bg-[#f7f4ef]">
                {item.label}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
