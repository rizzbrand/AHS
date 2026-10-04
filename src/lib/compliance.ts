import { TODAY } from './format';
import { CONTRACTOR_STATUS_LABEL } from './labels';
import { Contractor, ContractorStatus, JobDocument, RoleId } from './types';

export type DocState = 'expired' | 'expiring' | 'current' | 'no_expiry';

export const EXPIRY_WINDOW_DAYS = 30;

export const ONBOARDING: ContractorStatus[] = ['application', 'review', 'document_verification', 'approved', 'active'];

const REQUIRED: { category: JobDocument['category']; label: string }[] = [
  { category: 'license', label: 'Contractor license' },
  { category: 'insurance', label: 'General liability insurance' }
];

const STAGE_ROLES: RoleId[] = ['owner', 'operations'];

function daysBetween(fromIso: string, toIso: string) {
  const [fy, fm, fd] = fromIso.slice(0, 10).split('-').map(Number);
  const [ty, tm, td] = toIso.slice(0, 10).split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function daysUntil(iso: string) {
  return daysBetween(TODAY, iso);
}

export function docState(document: JobDocument): DocState {
  if (!document.expiresAt) return 'no_expiry';
  const days = daysUntil(document.expiresAt);
  if (days < 0) return 'expired';
  if (days <= EXPIRY_WINDOW_DAYS) return 'expiring';
  return 'current';
}

export function docStateLabel(document: JobDocument) {
  const state = docState(document);
  if (state === 'no_expiry') return 'No expiry';
  const days = daysUntil(document.expiresAt!);
  if (state === 'expired') return `Expired ${Math.abs(days)} days ago`;
  if (state === 'expiring') return `Expires in ${days} days`;
  return 'Current';
}

export const DOC_STATE_TONE: Record<DocState, string> = {
  expired: 'bg-[#f6dedb] text-[#9f2d2d]',
  expiring: 'bg-[#f8ecd4] text-[#7a4e08]',
  current: 'bg-[#e5f0e4] text-[#1d5a32]',
  no_expiry: 'bg-[#ece7df] text-[#5e574e]'
};

export function documentsFor(relatedId: string, documents: JobDocument[]) {
  return documents.filter((document) => document.relatedId === relatedId);
}

/** Missing or lapsed required paperwork. Expiring files are warnings, not gaps. */
export function complianceGaps(contractorId: string, documents: JobDocument[]) {
  const files = documentsFor(contractorId, documents);
  const gaps: string[] = [];
  REQUIRED.forEach((required) => {
    const matches = files.filter((file) => file.category === required.category);
    if (matches.length === 0) gaps.push(`${required.label} is not on file`);
    else if (matches.every((file) => docState(file) === 'expired')) gaps.push(`${required.label} has expired`);
  });
  return gaps;
}

export function complianceWarnings(contractorId: string, documents: JobDocument[]) {
  return documentsFor(contractorId, documents)
    .filter((file) => docState(file) === 'expiring')
    .map((file) => `${file.name} ${docStateLabel(file).toLowerCase()}`);
}

export function worstDocState(relatedId: string, documents: JobDocument[]): DocState | 'missing' {
  const files = documentsFor(relatedId, documents);
  if (files.length === 0) return 'missing';
  const states = files.map(docState);
  if (states.includes('expired')) return 'expired';
  if (states.includes('expiring')) return 'expiring';
  return 'current';
}

export function eligibleForWork(contractor: Contractor, documents: JobDocument[]) {
  return contractor.status === 'active' && complianceGaps(contractor.id, documents).length === 0;
}

export function nextStage(status: ContractorStatus): ContractorStatus | undefined {
  const index = ONBOARDING.indexOf(status);
  if (index < 0 || index === ONBOARDING.length - 1) return undefined;
  return ONBOARDING[index + 1];
}

/** What stops a contractor moving to the next onboarding stage. */
export function stageBlockers(contractor: Contractor, documents: JobDocument[]) {
  const next = nextStage(contractor.status);
  if (!next) return [];
  if (next === 'approved' || next === 'active') {
    const blockers = [...complianceGaps(contractor.id, documents)];
    const expiring = complianceWarnings(contractor.id, documents);
    if (expiring.length > 0) blockers.push(...expiring.map((item) => `${item}. Renew before approval`));
    return blockers;
  }
  return [];
}

export function canManageOnboarding(role: RoleId) {
  return STAGE_ROLES.includes(role);
}

export function stageMoveLabel(status: ContractorStatus) {
  const next = nextStage(status);
  if (!next) return undefined;
  if (next === 'review') return 'Start review';
  if (next === 'document_verification') return 'Request documents';
  if (next === 'approved') return 'Approve contractor';
  return 'Activate for assignments';
}

export function stageDetail(from: ContractorStatus, to: ContractorStatus) {
  return `${CONTRACTOR_STATUS_LABEL[from]} → ${CONTRACTOR_STATUS_LABEL[to]}`;
}
