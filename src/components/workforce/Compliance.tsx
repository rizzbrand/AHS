import { DOC_STATE_TONE, DocState, ONBOARDING } from '../../lib/compliance';
import { CONTRACTOR_STATUS_LABEL } from '../../lib/labels';
import { ContractorStatus } from '../../lib/types';

const STATE_TEXT: Record<DocState | 'missing', string> = {
  expired: 'Expired',
  expiring: 'Expiring',
  current: 'Current',
  no_expiry: 'No expiry',
  missing: 'Nothing on file'
};

export function DocChip({ state, label }: { state: DocState | 'missing'; label?: string }) {
  const tone = state === 'missing' ? 'bg-[#f6dedb] text-[#9f2d2d]' : DOC_STATE_TONE[state];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? STATE_TEXT[state]}
    </span>
  );
}

export function OnboardingStepper({ status }: { status: ContractorStatus }) {
  if (status === 'suspended') {
    return <p className="bg-[#f6dedb] px-3 py-2 text-sm font-semibold text-[#9f2d2d]">Suspended. No new assignments.</p>;
  }
  const current = ONBOARDING.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1">
      {ONBOARDING.map((stage, index) => {
        const done = index < current;
        const here = index === current;
        return (
          <li key={stage} className="min-w-0">
            <div className={`h-1.5 ${done ? 'bg-forest' : here ? 'bg-copper' : 'bg-line'}`} />
            <p className={`mt-2 truncate text-[11px] uppercase tracking-[0.08em] ${here ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-muted'}`}>
              {CONTRACTOR_STATUS_LABEL[stage]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
