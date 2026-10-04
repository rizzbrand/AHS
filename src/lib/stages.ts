import { TODAY } from './format';
import { JobStatus } from './types';

export type StageId = 'intake' | 'scoping' | 'dispatch' | 'field' | 'closeout';

export const STAGES: { id: StageId; label: string; statuses: JobStatus[]; color: string }[] = [
  { id: 'intake', label: 'Intake', statuses: ['NEW', 'REVIEW'], color: '#cfc6b8' },
  { id: 'scoping', label: 'Scoping', statuses: ['INSPECTION_REQUIRED', 'INSPECTION_COMPLETE', 'ESTIMATE_PREPARING', 'AWAITING_APPROVAL', 'APPROVED'], color: '#d9a05b' },
  { id: 'dispatch', label: 'Dispatch', statuses: ['READY_FOR_DISPATCH', 'ASSIGNED', 'SCHEDULED'], color: '#5b7fa6' },
  { id: 'field', label: 'In the field', statuses: ['IN_PROGRESS', 'AWAITING_DOCUMENTATION'], color: '#8c4520' },
  { id: 'closeout', label: 'Closeout', statuses: ['SUBMITTED_FOR_REVIEW', 'COMPLETED', 'INVOICED', 'CLOSED'], color: '#2f6b47' }
];

export function stageOf(status: JobStatus) {
  return STAGES.find((stage) => stage.statuses.includes(status));
}

export function dueInfo(dueAt: string) {
  const diff = Math.round((Date.parse(dueAt.slice(0, 10)) - Date.parse(TODAY)) / 86400000);
  if (diff < 0) return { text: `${-diff} day${diff === -1 ? '' : 's'} late`, tone: 'text-[#b33a3a]', late: true };
  if (diff === 0) return { text: 'Due today', tone: 'text-[#9a6700]', late: false };
  if (diff === 1) return { text: 'Tomorrow', tone: 'text-[#9a6700]', late: false };
  return { text: `In ${diff} days`, tone: 'text-ink', late: false };
}
