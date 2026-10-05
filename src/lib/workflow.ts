import { STATUS_LABEL } from './labels';
import { JobStatus, RoleId, ServiceType, WorkOrder } from './types';

const FIELD_ROLES: RoleId[] = ['field', 'contractor'];
const DESK_ROLES: RoleId[] = ['owner', 'operations'];
const ESTIMATE_ROLES: RoleId[] = ['owner', 'estimator'];
const DISPATCH_ROLES: RoleId[] = ['owner', 'operations', 'dispatcher'];

export type Transition = {
  to: JobStatus;
  label: string;
  roles: RoleId[];
  gate?: 'documentation';
};

const NEXT: Partial<Record<JobStatus, Transition[]>> = {
  NEW: [{ to: 'REVIEW', label: 'Start review', roles: DESK_ROLES }],
  REVIEW: [
    { to: 'INSPECTION_REQUIRED', label: 'Require inspection', roles: [...DESK_ROLES, 'estimator'] },
    { to: 'ESTIMATE_PREPARING', label: 'Prepare estimate', roles: ESTIMATE_ROLES }
  ],
  INSPECTION_REQUIRED: [{ to: 'INSPECTION_COMPLETE', label: 'Submit inspection', roles: [...DESK_ROLES, ...FIELD_ROLES] }],
  INSPECTION_COMPLETE: [{ to: 'ESTIMATE_PREPARING', label: 'Prepare estimate', roles: [...ESTIMATE_ROLES, 'operations'] }],
  ESTIMATE_PREPARING: [{ to: 'AWAITING_APPROVAL', label: 'Request approval', roles: ESTIMATE_ROLES }],
  AWAITING_APPROVAL: [{ to: 'APPROVED', label: 'Approve', roles: DESK_ROLES }],
  APPROVED: [{ to: 'READY_FOR_DISPATCH', label: 'Release to dispatch', roles: DESK_ROLES }],
  READY_FOR_DISPATCH: [],
  ASSIGNED: [{ to: 'SCHEDULED', label: 'Schedule', roles: DISPATCH_ROLES }],
  SCHEDULED: [{ to: 'IN_PROGRESS', label: 'Start job', roles: [...DISPATCH_ROLES, ...FIELD_ROLES] }],
  IN_PROGRESS: [{ to: 'AWAITING_DOCUMENTATION', label: 'Check out', roles: [...DESK_ROLES, ...FIELD_ROLES] }],
  AWAITING_DOCUMENTATION: [
    { to: 'SUBMITTED_FOR_REVIEW', label: 'Submit for review', roles: [...DESK_ROLES, ...FIELD_ROLES], gate: 'documentation' }
  ],
  SUBMITTED_FOR_REVIEW: [{ to: 'COMPLETED', label: 'Approve completion', roles: DESK_ROLES }],
  COMPLETED: [{ to: 'INVOICED', label: 'Mark invoiced', roles: ['owner'] }],
  INVOICED: [{ to: 'CLOSED', label: 'Close job', roles: ['owner'] }]
};

const ASSIGNABLE: JobStatus[] = [
  'NEW',
  'REVIEW',
  'INSPECTION_REQUIRED',
  'INSPECTION_COMPLETE',
  'ESTIMATE_PREPARING',
  'AWAITING_APPROVAL',
  'APPROVED',
  'READY_FOR_DISPATCH',
  'ASSIGNED',
  'SCHEDULED',
  'IN_PROGRESS',
  'AWAITING_DOCUMENTATION'
];

const CHECKLISTS: Record<ServiceType, string[]> = {
  door_repair: ['Identify the failed part', 'Complete the repair', 'Cycle the door'],
  property_preservation: ['Secure the openings', 'Photograph the yard', 'Confirm the property is left locked'],
  landscaping: ['Clear the debris', 'Finish the cut', 'Leave walks clear'],
  roofing: ['Confirm the leak path', 'Complete the dry-in', 'Photograph the finished section'],
  handyman: ['Confirm the requested repair', 'Complete the work', 'Test the repair'],
  remediation: ['Set containment', 'Record moisture readings', 'Clear the equipment'],
  facility: ['Complete the listed repairs', 'Test the repair', 'Leave the area clear']
};

const DONE_CHECKLIST: JobStatus[] = ['SUBMITTED_FOR_REVIEW', 'COMPLETED', 'INVOICED', 'CLOSED'];
const ON_SITE: JobStatus[] = ['IN_PROGRESS', 'AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW', 'COMPLETED', 'INVOICED', 'CLOSED'];
const LEFT_SITE: JobStatus[] = ['AWAITING_DOCUMENTATION', 'SUBMITTED_FOR_REVIEW', 'COMPLETED', 'INVOICED', 'CLOSED'];

export function checklistFor(order: WorkOrder) {
  if (order.checklist?.length) return order.checklist;
  const done = DONE_CHECKLIST.includes(order.status);
  return CHECKLISTS[order.service].map((label, index) => ({
    id: `${order.id}-check-${index}`,
    label,
    done
  }));
}

export function arrivedAt(order: WorkOrder) {
  if (order.checkedInAt) return order.checkedInAt;
  if (!ON_SITE.includes(order.status)) return undefined;
  return order.scheduledStart ?? `${order.createdAt}T08:00`;
}

export function departedAt(order: WorkOrder) {
  if (order.checkedOutAt) return order.checkedOutAt;
  if (!LEFT_SITE.includes(order.status)) return undefined;
  return order.scheduledEnd ?? order.scheduledStart ?? `${order.dueAt}T16:00`;
}

export function photoProgress(order: WorkOrder) {
  const done = order.photos.filter((photo) => photo.done).length;
  return { done, total: order.photos.length };
}

export function documentationGaps(order: WorkOrder) {
  const photos = photoProgress(order);
  const checklist = checklistFor(order);
  const gaps: string[] = [];
  if (photos.done < photos.total) gaps.push(`${photos.done} / ${photos.total} required photos completed`);
  const openChecks = checklist.filter((item) => !item.done).length;
  if (openChecks > 0) gaps.push(`${openChecks} checklist item${openChecks === 1 ? '' : 's'} still open`);
  if (!departedAt(order) && order.status !== 'AWAITING_DOCUMENTATION') gaps.push('Check out is still open');
  return gaps;
}

export function documentationReady(order: WorkOrder) {
  return documentationGaps(order).length === 0;
}

export function transitionsFor(order: WorkOrder, role: RoleId) {
  return (NEXT[order.status] ?? []).filter((transition) => transition.roles.includes(role));
}

export function canTake(order: WorkOrder, role: RoleId, to: JobStatus) {
  const transition = transitionsFor(order, role).find((item) => item.to === to);
  if (!transition) return false;
  if (transition.gate === 'documentation' && !documentationReady(order)) return false;
  return true;
}

export function canAssign(status: JobStatus) {
  return ASSIGNABLE.includes(status);
}

export function statusMoveDetail(from: JobStatus, to: JobStatus) {
  return `${STATUS_LABEL[from]} → ${STATUS_LABEL[to]}`;
}
