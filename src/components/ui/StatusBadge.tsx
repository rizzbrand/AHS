import { JobStatus } from '../../lib/types';
import { STATUS_LABEL, STATUS_TONE } from '../../lib/labels';

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${STATUS_TONE[status]}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityMark({ priority }: { priority: string }) {
  const tone =
    priority === 'urgent'
      ? 'text-[#9f2d2d]'
      : priority === 'high'
        ? 'text-copper'
        : 'text-muted';
  return <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${tone}`}>{priority}</span>;
}
