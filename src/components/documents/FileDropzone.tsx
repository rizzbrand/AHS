'use client';

import { useRef, useState } from 'react';
import { FileArchive, FileImage, FileSpreadsheet, FileText, FileVideo, Loader2, UploadCloud, X } from 'lucide-react';
import { FileAttachment } from '../../lib/types';

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES = 8;
const ACCEPT = 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip';

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentIcon({ type, name, size = 16 }: { type: string; name: string; size?: number }) {
  if (type.startsWith('image/')) return <FileImage size={size} />;
  if (type.startsWith('video/')) return <FileVideo size={size} />;
  if (/\.(xlsx?|csv)$/i.test(name)) return <FileSpreadsheet size={size} />;
  if (/\.zip$/i.test(name)) return <FileArchive size={size} />;
  return <FileText size={size} />;
}

/** Downscales images to a small JPEG so the preview fits in session storage. */
function thumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 640 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    image.src = url;
  });
}

export function FileDropzone({ files, onChange }: { files: FileAttachment[]; onChange: (files: FileAttachment[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function take(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const picked = Array.from(list);
    const tooBig = picked.filter((file) => file.size > MAX_FILE_BYTES);
    const room = MAX_FILES - files.length;
    const usable = picked.filter((file) => file.size <= MAX_FILE_BYTES).slice(0, Math.max(room, 0));
    const problems: string[] = [];
    if (tooBig.length) problems.push(`${tooBig.map((file) => file.name).join(', ')} ${tooBig.length === 1 ? 'is' : 'are'} over ${formatBytes(MAX_FILE_BYTES)}`);
    if (picked.length - tooBig.length > usable.length) problems.push(`Only ${MAX_FILES} files per document`);
    if (problems.length) setError(`${problems.join('. ')}.`);
    if (!usable.length) return;

    setBusy(true);
    const added = await Promise.all(
      usable.map(async (file, index) => ({
        id: `att-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        preview: await thumbnail(file)
      }))
    );
    setBusy(false);
    onChange([...files, ...added]);
  }

  return (
    <div className="space-y-2.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-amber ${
          over ? 'border-amber bg-amber/10' : 'border-[#e2dbd0] bg-[#faf8f5] hover:border-[#cfc6b8]'
        }`}
      >
        <span className={`grid h-10 w-10 place-items-center rounded-full ${over ? 'bg-amber text-ink' : 'bg-white text-[#6f6a62] shadow-sm'}`}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
        </span>
        <p className="text-sm text-ink">
          <span className="font-semibold text-copper">Choose files</span> or drag them here
        </p>
        <p className="text-[11px] text-[#9a9187]">
          Photos, videos, PDFs, Word or Excel · up to {formatBytes(MAX_FILE_BYTES)} each · {MAX_FILES} files max
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            take(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {error ? <p className="rounded-xl bg-[#fbefed] px-3 py-2 text-xs text-[#9f2d2d]">{error}</p> : null}

      {files.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-2.5 rounded-xl border border-[#ece6dc] bg-white p-2">
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.preview} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f3efe8] text-[#6f6a62]">
                  <AttachmentIcon type={file.type} name={file.name} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{file.name}</p>
                <p className="text-[11px] text-[#9a9187]">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(files.filter((item) => item.id !== file.id))}
                aria-label={`Remove ${file.name}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#9a9187] transition hover:bg-[#f3efe8] hover:text-ink"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
