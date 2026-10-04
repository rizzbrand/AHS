'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Award, BadgeCheck, Briefcase, CheckCircle2, ClipboardCheck, FileText, History, Home, Lock, Paperclip, ShieldCheck, X } from 'lucide-react';
import { DocChip } from '../workforce/Compliance';
import { AttachmentIcon, formatBytes } from './FileDropzone';
import { docState, docStateLabel } from '../../lib/compliance';
import { useDemo } from '../../lib/demo-store';
import { DOC_CATEGORY_LABEL, RELATED_KIND_LABEL, canOpenDocument, canViewRelated, relatedHref, relatedKind } from '../../lib/documents';
import { longDate, shortDate } from '../../lib/format';
import { useSession } from '../../lib/session';
import { FileAttachment, JobDocument } from '../../lib/types';

export const CATEGORY_ICON: Record<JobDocument['category'], typeof FileText> = {
  job: Briefcase,
  license: BadgeCheck,
  insurance: ShieldCheck,
  certification: Award,
  inspection: ClipboardCheck,
  completion: CheckCircle2,
  customer: FileText,
  property: Home
};

export const CATEGORY_TONE: Record<JobDocument['category'], string> = {
  job: 'bg-[#f3efe8] text-[#6f6a62]',
  license: 'bg-[#e4ecf4] text-[#1e3a5f]',
  insurance: 'bg-[#e8f0ea] text-[#2f5d3d]',
  certification: 'bg-[#f6ecd9] text-[#7a4e08]',
  inspection: 'bg-[#ede7f6] text-[#4b3a78]',
  completion: 'bg-[#e5f0e4] text-[#1d5a32]',
  customer: 'bg-[#f6e7d8] text-[#8c4520]',
  property: 'bg-[#efe9e1] text-[#5e574e]'
};

export function FileIcon({ category, locked = false, size = 'md' }: { category: JobDocument['category']; locked?: boolean; size?: 'md' | 'lg' }) {
  const Icon = locked ? Lock : CATEGORY_ICON[category];
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-9 w-9 rounded-xl';
  return (
    <span className={`grid shrink-0 place-items-center ${box} ${locked ? 'bg-[#f1eee9] text-[#a59d92]' : CATEGORY_TONE[category]}`}>
      <Icon size={size === 'lg' ? 20 : 16} />
    </span>
  );
}

export function DocumentTable({ documents, empty = 'No documents on file.', showRelated = true }: { documents: JobDocument[]; empty?: string; showRelated?: boolean }) {
  const { user } = useSession();
  const [openId, setOpenId] = useState<string | null>(null);
  const { documents: all } = useDemo();
  const open = all.find((file) => file.id === openId);
  if (!user) return null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-[12px] text-[#8a8278]">
              <th className="px-5 py-3 font-medium">File</th>
              <th className="px-3 py-3 font-medium">Category</th>
              {showRelated ? <th className="px-3 py-3 font-medium">Attached to</th> : null}
              <th className="px-3 py-3 font-medium">Version</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const allowed = canOpenDocument(user.role, document);
              return (
                <tr
                  key={document.id}
                  onClick={allowed ? () => setOpenId(document.id) : undefined}
                  className={`border-t border-[#f3efe8] transition ${allowed ? 'cursor-pointer hover:bg-[#faf8f5]' : ''}`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon category={document.category} locked={!allowed} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`truncate font-medium ${allowed ? 'text-ink' : 'text-[#8a8278]'}`}>{document.name}</span>
                          {allowed && document.attachments?.length ? (
                            <span title={`${document.attachments.length} attached`} className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#8a8278]">
                              <Paperclip size={12} />
                              {document.attachments.length}
                            </span>
                          ) : null}
                          {document.restricted ? (
                            <span
                              title={allowed ? 'Restricted file. You have access.' : 'Restricted file. Your role cannot open it.'}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-copper-soft px-2 py-0.5 text-[10px] font-semibold text-copper"
                            >
                              <Lock size={10} />
                              Restricted
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {allowed ? (document.uploadedBy ? `Uploaded by ${document.uploadedBy}` : 'Added to the library') : 'Listed only. Your role cannot open this file.'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[#4a443d]">{DOC_CATEGORY_LABEL[document.category]}</td>
                  {showRelated ? (
                    <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      {canViewRelated(user.role, document.relatedId) ? (
                        <Link href={relatedHref(document.relatedId)} className="font-medium text-ink hover:text-copper">
                          {document.related}
                        </Link>
                      ) : (
                        <span className="text-[#4a443d]">{document.related}</span>
                      )}
                      <div className="text-xs text-muted">{RELATED_KIND_LABEL[relatedKind(document.relatedId)]}</div>
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="rounded-md bg-[#f3efe8] px-1.5 py-0.5 text-[11px] font-semibold text-[#5e574e] tabular">v{document.version}</span>
                    <span className="ml-2 text-xs text-muted">{shortDate(document.updatedAt)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <DocChip state={docState(document)} label={docStateLabel(document)} />
                  </td>
                </tr>
              );
            })}
            {documents.length === 0 ? (
              <tr>
                <td colSpan={showRelated ? 5 : 4} className="px-5 py-12 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
                    <FileText size={18} />
                  </span>
                  <p className="mt-3 text-sm text-muted">{empty}</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {open ? <DocumentDrawer document={open} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}

function DocumentDrawer({ document, onClose }: { document: JobDocument; onClose: () => void }) {
  const { user } = useSession();
  const { reviseDocument } = useDemo();
  const [expires, setExpires] = useState(document.expiresAt ?? '');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const manage = user?.role === 'owner' || user?.role === 'operations';
  const state = docState(document);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const access = document.restricted
    ? document.category === 'customer' || document.category === 'property'
      ? 'Owner, operations, and estimating'
      : 'Owner and operations only'
    : 'Any role with document access';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-label={document.name}
        className="m-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-sheet md:m-3 md:h-[calc(100%-1.5rem)] md:rounded-[22px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-[#f0ebe3] px-5 py-4">
          <FileIcon category={document.category} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9187]">{DOC_CATEGORY_LABEL[document.category]}</p>
            <h2 className="mt-1 font-display text-[1.45rem] leading-tight text-ink">{document.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DocChip state={state} label={docStateLabel(document)} />
              {document.restricted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-copper-soft px-2.5 py-1 text-[11px] font-semibold text-copper">
                  <Lock size={11} /> Restricted
                </span>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-[#f3efe8] hover:text-ink">
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm">
          {document.attachments?.length ? (
            <AttachmentList files={document.attachments} />
          ) : (
            <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#e6dfd4] bg-[#faf8f5] text-center">
              <FileText size={22} className="text-[#b5ada2]" />
              <p className="text-xs leading-5 text-muted">
                No file attached to this record.
                <br />
                No file storage is connected.
              </p>
            </div>
          )}

          <dl className="divide-y divide-[#f3efe8] rounded-2xl border border-[#ece6dc]">
            {[
              {
                label: 'Attached to',
                value:
                  user && canViewRelated(user.role, document.relatedId) ? (
                    <Link href={relatedHref(document.relatedId)} className="font-medium text-ink hover:text-copper" onClick={onClose}>
                      {document.related}
                    </Link>
                  ) : (
                    document.related
                  )
              },
              { label: 'Version', value: `v${document.version}` },
              { label: 'Updated', value: `${longDate(document.updatedAt)}${document.uploadedBy ? ` · ${document.uploadedBy}` : ''}` },
              { label: 'Expires', value: document.expiresAt ? longDate(document.expiresAt) : 'Does not expire' },
              { label: 'Who can open', value: access }
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                <dt className="shrink-0 text-muted">{row.label}</dt>
                <dd className="text-right text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9187]">
              <History size={12} /> Version history
            </h3>
            <ol className="mt-3 space-y-0">
              {[{ version: document.version, updatedAt: document.updatedAt, by: document.uploadedBy ?? '', note: 'Current version', current: true }, ...(document.history ?? []).map((entry) => ({ ...entry, current: false }))].map(
                (entry, index, list) => (
                  <li key={`${entry.version}-${entry.updatedAt}`} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < list.length - 1 ? <span className="absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px bg-[#ece6dc]" /> : null}
                    <span className={`relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${entry.current ? 'bg-amber/30' : 'bg-[#f3efe8]'}`}>
                      <span className={`h-2 w-2 rounded-full ${entry.current ? 'bg-amber-deep' : 'bg-[#c9c1b5]'}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px]">
                        <span className="font-semibold text-ink">v{entry.version}</span>
                        <span className="text-muted">
                          {' '}
                          · {longDate(entry.updatedAt)}
                          {entry.by ? ` · ${entry.by}` : ''}
                        </span>
                      </p>
                      <p className="text-xs text-muted">{entry.note}</p>
                    </div>
                  </li>
                )
              )}
            </ol>
          </section>

          {manage ? (
            <form
              className="space-y-3 rounded-2xl bg-[#faf8f5] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                reviseDocument(document.id, { expiresAt: expires, note }, user!.name);
                setNote('');
                setSaved(true);
              }}
            >
              <div>
                <h3 className="text-sm font-semibold text-ink">Record a new version</h3>
                <p className="text-xs text-muted">The current version moves into history.</p>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#8a8278]">New expiry date (leave blank if none)</span>
                <input type="date" value={expires} onChange={(event) => setExpires(event.target.value)} className="h-10 w-full rounded-xl border border-[#e6dfd4] bg-white px-3 text-sm outline-none focus:border-amber" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#8a8278]">Why is it being replaced?</span>
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Superseded by renewal" className="h-10 w-full rounded-xl border border-[#e6dfd4] bg-white px-3 text-sm outline-none focus:border-amber" />
              </label>
              <div className="flex items-center justify-between gap-3">
                {saved ? <p className="text-xs font-medium text-[#1d5a32]">Saved. The previous version moved to history.</p> : <span />}
                <button type="submit" className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black">
                  Save version
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function AttachmentList({ files }: { files: FileAttachment[] }) {
  const images = files.filter((file) => file.preview);
  const [selected, setSelected] = useState(images[0]?.id);
  const shown = images.find((file) => file.id === selected) ?? images[0];

  return (
    <div className="space-y-2.5">
      {shown ? (
        <figure className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-[#f6f3ee]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown.preview} alt={shown.name} className="max-h-64 w-full object-contain" />
          <figcaption className="flex items-center justify-between gap-2 border-t border-[#ece6dc] bg-white px-3 py-2 text-[11px] text-[#8a8278]">
            <span className="truncate">{shown.name}</span>
            <span className="shrink-0 tabular">{formatBytes(shown.size)}</span>
          </figcaption>
        </figure>
      ) : null}
      <ul className="space-y-1.5">
        {files.map((file) => {
          const active = file.id === shown?.id;
          return (
            <li key={file.id}>
              <button
                type="button"
                disabled={!file.preview}
                onClick={() => setSelected(file.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition ${
                  active ? 'border-amber bg-amber/10' : 'border-[#ece6dc] bg-white enabled:hover:border-[#d9cfc0]'
                } disabled:cursor-default`}
              >
                {file.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.preview} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f3efe8] text-[#6f6a62]">
                    <AttachmentIcon type={file.type} name={file.name} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{file.name}</span>
                  <span className="text-[11px] text-[#9a9187]">
                    {formatBytes(file.size)}
                    {file.preview ? '' : ' · preview not available'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] leading-4 text-[#9a9187]">Stored in this browser session only. No file storage is connected.</p>
    </div>
  );
}
