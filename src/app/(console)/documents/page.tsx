'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlarmClock, AlertOctagon, Files, Lock, Plus, UploadCloud, X } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { CATEGORY_ICON, DocumentTable } from '../../../components/documents/DocumentTable';
import { FileDropzone, formatBytes } from '../../../components/documents/FileDropzone';
import { FilterField, PillSearch, PillSelect } from '../../../components/ui/DataTable';
import { docState, docStateLabel } from '../../../lib/compliance';
import { useDemo } from '../../../lib/demo-store';
import { DOC_CATEGORY_LABEL, RELATED_KIND_LABEL, RelatedKind, canOpenDocument, relatedKind } from '../../../lib/documents';
import { contractors, customers, employees, properties } from '../../../lib/seed';
import { useSession } from '../../../lib/session';
import { FileAttachment, JobDocument } from '../../../lib/types';

const RANK = { expired: 0, expiring: 1, current: 2, no_expiry: 3 };

type Status = 'all' | 'expired' | 'expiring' | 'restricted';
type Category = JobDocument['category'];
type SortId = 'attention' | 'updated' | 'name' | 'expiry';

function matchesStatus(file: JobDocument, value: Status) {
  if (value === 'all') return true;
  if (value === 'restricted') return file.restricted;
  return docState(file) === value;
}

export default function DocumentsPage() {
  const { user } = useSession();
  const { documents, orders, addDocument } = useDemo();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [kind, setKind] = useState<RelatedKind | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [sort, setSort] = useState<SortId>('attention');
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const manage = user?.role === 'owner' || user?.role === 'operations';

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...documents]
      .filter((file) => category === 'all' || file.category === category)
      .filter((file) => kind === 'all' || relatedKind(file.relatedId) === kind)
      .filter((file) => matchesStatus(file, status))
      .filter((file) => !q || `${file.name} ${file.related} ${file.uploadedBy ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'expiry') return (a.expiresAt ?? '9999').localeCompare(b.expiresAt ?? '9999');
        return RANK[docState(a)] - RANK[docState(b)] || b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [documents, category, kind, status, query, sort]);

  const expired = documents.filter((file) => docState(file) === 'expired');
  const expiring = documents.filter((file) => docState(file) === 'expiring');
  const renewals = [...expired, ...expiring].sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''));
  const restricted = documents.filter((file) => file.restricted);
  const locked = user ? restricted.filter((file) => !canOpenDocument(user.role, file)).length : 0;
  const categories = (Object.keys(DOC_CATEGORY_LABEL) as Category[]).filter((id) => documents.some((file) => file.category === id));
  const filtersOn = Boolean(query) || kind !== 'all' || status !== 'all' || category !== 'all';

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function clearFilters() {
    setQuery('');
    setKind('all');
    setStatus('all');
    setCategory('all');
  }

  return (
    <Gate permission="documents.read" title="Documents are limited" body="Files are opened only by roles that are allowed to see them.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Library</p>
            <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Documents</h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Licenses, insurance, contracts, inspections, and completion packages. Each file keeps its version history. Restricted files are listed but locked for roles that cannot open them.
            </p>
          </div>
          {manage ? (
            <button type="button" onClick={() => setAdding(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black">
              <Plus size={15} />
              Add document
            </button>
          ) : null}
        </header>

        {notice ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#cfe3d3] bg-[#f2f8f3] px-4 py-2.5 text-sm text-[#1d5a32]">
            {notice}
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-[#4f6b56] hover:text-ink">
              <X size={15} />
            </button>
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile icon={<Files size={16} />} label="All files" value={documents.length} note={`${categories.length} categories`} active={status === 'all'} onClick={() => setStatus('all')} />
          <StatTile
            icon={<AlertOctagon size={16} />}
            label="Expired"
            value={expired.length}
            note={expired.length ? 'Replace before the next assignment' : 'Nothing has lapsed'}
            tone="red"
            active={status === 'expired'}
            onClick={() => setStatus('expired')}
          />
          <StatTile
            icon={<AlarmClock size={16} />}
            label="Expiring within 30 days"
            value={expiring.length}
            note={expiring.length ? 'Ask for renewals now' : 'No renewals due soon'}
            tone="amber"
            active={status === 'expiring'}
            onClick={() => setStatus('expiring')}
          />
          <StatTile
            icon={<Lock size={16} />}
            label="Restricted"
            value={restricted.length}
            note={locked ? `${locked} locked for your role` : 'You can open all of them'}
            active={status === 'restricted'}
            onClick={() => setStatus('restricted')}
          />
        </section>

        {renewals.length > 0 && status === 'all' ? (
          <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#f0dcb4] bg-[#fdf7ec] px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f8ecd4] text-[#7a4e08]">
              <AlarmClock size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {renewals.length} {renewals.length === 1 ? 'file needs' : 'files need'} renewal
              </p>
              <p className="truncate text-[13px] text-[#7a6a52]">
                {renewals.map((file) => `${file.name} (${docStateLabel(file).toLowerCase()})`).join(' · ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatus(expired.length ? 'expired' : 'expiring')}
              className="h-9 shrink-0 rounded-full border border-[#e9d3a8] bg-white px-4 text-[13px] font-semibold text-[#7a4e08] transition hover:border-[#d9b779]"
            >
              Review renewals
            </button>
          </section>
        ) : null}

        <nav aria-label="Categories" className="flex flex-wrap gap-1.5">
          {(['all', ...categories] as (Category | 'all')[]).map((id) => {
            const active = id === category;
            const Icon = id === 'all' ? Files : CATEGORY_ICON[id];
            const count = id === 'all' ? documents.length : documents.filter((file) => file.category === id).length;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                aria-pressed={active}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm transition ${
                  active ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-[#4a443d] hover:border-[#cfc6b8] hover:text-ink'
                }`}
              >
                <Icon size={14} className={active ? 'text-amber' : 'text-[#9a9187]'} />
                {id === 'all' ? 'All categories' : DOC_CATEGORY_LABEL[id]}
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${active ? 'bg-white/15 text-white' : 'bg-[#f3efe6] text-muted'}`}>{count}</span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder="File, record, or uploader…" width="w-64" />
            </FilterField>
            <FilterField label="Attached to">
              <PillSelect value={kind} onChange={(value) => setKind(value as RelatedKind | 'all')} width="w-44">
                <option value="all">Anything</option>
                {Object.entries(RELATED_KIND_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            <FilterField label="Status">
              <PillSelect value={status} onChange={(value) => setStatus(value as Status)} width="w-40">
                <option value="all">Any status</option>
                <option value="expired">Expired</option>
                <option value="expiring">Expiring soon</option>
                <option value="restricted">Restricted</option>
              </PillSelect>
            </FilterField>
            {filtersOn ? (
              <button type="button" onClick={clearFilters} className="h-10 px-2 text-sm font-medium text-copper hover:underline">
                Clear
              </button>
            ) : null}
            <div className="ml-auto">
              <FilterField label="Sort by">
                <PillSelect value={sort} onChange={(value) => setSort(value as SortId)} width="w-44">
                  <option value="attention">Needs attention</option>
                  <option value="expiry">Expires soonest</option>
                  <option value="updated">Recently updated</option>
                  <option value="name">Name A–Z</option>
                </PillSelect>
              </FilterField>
            </div>
          </div>
          <div className="border-t border-[#f0ebe3] px-5 py-2.5 text-[12px] text-[#8a8278]">
            Showing <span className="font-semibold text-ink tabular">{list.length}</span> of {documents.length} files
            {locked ? <span> · locked rows are visible so you know the file exists, but they will not open</span> : null}
          </div>
          <div className="border-t border-[#f0ebe3]">
            <DocumentTable documents={list} empty="No files match these filters." />
          </div>
        </section>
      </div>

      {adding && manage ? (
        <AddDocumentDialog
          onClose={() => setAdding(false)}
          onDone={(name) => {
            setAdding(false);
            clearFilters();
            setQuery(name);
            setNotice(`Added “${name}” to the library.`);
          }}
          add={(input, isRestricted) => addDocument(input, user!.name, isRestricted)}
          orderOptions={orders.map((order) => ({ id: order.id, label: order.number }))}
        />
      ) : null}
    </Gate>
  );
}

function StatTile({
  icon,
  label,
  value,
  note,
  tone = 'neutral',
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
  tone?: 'neutral' | 'red' | 'amber';
  active: boolean;
  onClick: () => void;
}) {
  const iconTone =
    value > 0 && tone === 'red' ? 'bg-[#fbefed] text-[#b33a3a]' : value > 0 && tone === 'amber' ? 'bg-[#f8ecd4] text-[#7a4e08]' : 'bg-[#f3efe8] text-[#6f6a62]';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-white p-4 text-left transition ${active ? 'border-ink ring-1 ring-ink' : 'border-[#ece6dc] hover:border-[#d9cfc0] hover:shadow-sm'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${iconTone}`}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </button>
  );
}

function AddDocumentDialog({
  add,
  onDone,
  onClose,
  orderOptions
}: {
  add: (input: { relatedId: string; related: string; category: Category; name: string; expiresAt?: string; attachments?: FileAttachment[] }, restricted: boolean) => string;
  onDone: (name: string) => void;
  onClose: () => void;
  orderOptions: { id: string; label: string }[];
}) {
  const targets = [
    ...customers.map((item) => ({ id: item.id, label: item.name, group: 'Customer' })),
    ...properties.map((item) => ({ id: item.id, label: item.name, group: 'Property' })),
    ...orderOptions.map((item) => ({ ...item, group: 'Work order' })),
    ...contractors.map((item) => ({ id: item.id, label: item.company, group: 'Contractor' })),
    ...employees.map((item) => ({ id: item.id, label: item.name, group: 'Employee' }))
  ];
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('property');
  const [target, setTarget] = useState(targets.find((item) => item.group === 'Property')?.id ?? targets[0].id);
  const [expires, setExpires] = useState('');
  const [restricted, setRestricted] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const groups = Array.from(new Set(targets.map((item) => item.group)));
  const related = targets.find((item) => item.id === target);
  const fromFile = attachments.length === 1 ? attachments[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') : '';
  const suggested = fromFile || (related ? `${related.label} ${DOC_CATEGORY_LABEL[category].toLowerCase()}` : '');
  const totalSize = attachments.reduce((sum, file) => sum + file.size, 0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const field = 'h-10 w-full rounded-xl border border-[#e6dfd4] bg-white px-3 text-sm text-ink outline-none focus:border-amber';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <form
        role="dialog"
        aria-label="Add document"
        className="w-full max-w-lg overflow-hidden rounded-[22px] bg-white shadow-sheet"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!related) return;
          const finalName = name.trim() || suggested;
          add({ relatedId: related.id, related: related.label, category, name: finalName, expiresAt: expires || undefined, attachments }, restricted);
          onDone(finalName);
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#f0ebe3] px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-ink">Add a document</h2>
            <p className="mt-0.5 text-xs text-muted">Attach the file and file it against a record.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-[#f3efe8] hover:text-ink">
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-[#8a8278]">
              Files
              {attachments.length ? (
                <span className="text-[11px] text-[#9a9187] tabular">
                  {attachments.length} attached · {formatBytes(totalSize)}
                </span>
              ) : null}
            </span>
            <FileDropzone files={attachments} onChange={setAttachments} />
            <p className="mt-2 text-[11px] leading-4 text-[#9a9187]">No file storage is connected. Files stay in this browser tab for the demo and are cleared when the session ends.</p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#8a8278]">Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={suggested} className={field} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#8a8278]">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value as Category)} className={field}>
                {Object.entries(DOC_CATEGORY_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#8a8278]">Expires</span>
              <input type="date" value={expires} onChange={(event) => setExpires(event.target.value)} className={field} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#8a8278]">Attach to</span>
            <select value={target} onChange={(event) => setTarget(event.target.value)} className={field}>
              {groups.map((group) => (
                <optgroup key={group} label={group}>
                  {targets
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition ${restricted ? 'border-copper/40 bg-copper-soft' : 'border-[#ece6dc] hover:border-[#d9cfc0]'}`}>
            <input type="checkbox" checked={restricted} onChange={(event) => setRestricted(event.target.checked)} className="mt-0.5 accent-[#8c4520]" />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Lock size={13} /> Restricted file
              </span>
              <span className="text-xs text-muted">Contracts, rates, insurance, or anything with pricing. Field and contractor roles will see it listed but locked.</span>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#f0ebe3] bg-[#faf8f5] px-5 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-[#e6dfd4] bg-white px-4 text-sm font-medium text-ink hover:border-[#cfc6b8]">
            Cancel
          </button>
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-black">
            <UploadCloud size={15} />
            {attachments.length ? `Add document · ${attachments.length} ${attachments.length === 1 ? 'file' : 'files'}` : 'Add document'}
          </button>
        </div>
      </form>
    </div>
  );
}
