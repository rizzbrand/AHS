import { ContractorStatus, CustomerKind, JobStatus, Priority, PropertyType, ServiceType, SourceId } from './types';

export const STATUS_LABEL: Record<JobStatus, string> = {
  NEW: 'New',
  REVIEW: 'Review',
  INSPECTION_REQUIRED: 'Inspection required',
  INSPECTION_COMPLETE: 'Inspection complete',
  ESTIMATE_PREPARING: 'Estimate preparing',
  AWAITING_APPROVAL: 'Awaiting approval',
  APPROVED: 'Approved',
  READY_FOR_DISPATCH: 'Ready for dispatch',
  ASSIGNED: 'Assigned',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  AWAITING_DOCUMENTATION: 'Awaiting documentation',
  SUBMITTED_FOR_REVIEW: 'Submitted for review',
  COMPLETED: 'Completed',
  INVOICED: 'Invoiced',
  CLOSED: 'Closed'
};

export const STATUS_ORDER: JobStatus[] = [
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
  'AWAITING_DOCUMENTATION',
  'SUBMITTED_FOR_REVIEW',
  'COMPLETED',
  'INVOICED',
  'CLOSED'
];

export const STATUS_TONE: Record<JobStatus, string> = {
  NEW: 'bg-[#ece7df] text-[#3f3a34]',
  REVIEW: 'bg-[#e4ebf2] text-[#1e3a5f]',
  INSPECTION_REQUIRED: 'bg-[#f8ecd4] text-[#7a4e08]',
  INSPECTION_COMPLETE: 'bg-[#e5f0e4] text-[#1d5a32]',
  ESTIMATE_PREPARING: 'bg-[#e7eef6] text-[#1e3a5f]',
  AWAITING_APPROVAL: 'bg-[#f8ecd4] text-[#7a4e08]',
  APPROVED: 'bg-[#e5f0e4] text-[#1d5a32]',
  READY_FOR_DISPATCH: 'bg-[#e3f1ef] text-[#0f5c56]',
  ASSIGNED: 'bg-[#e3f1ef] text-[#0f5c56]',
  SCHEDULED: 'bg-[#e4ebf2] text-[#1e3a5f]',
  IN_PROGRESS: 'bg-[#f3e6dc] text-[#8c4520]',
  AWAITING_DOCUMENTATION: 'bg-[#f8e4d4] text-[#8a3d12]',
  SUBMITTED_FOR_REVIEW: 'bg-[#e4ebf2] text-[#1e3a5f]',
  COMPLETED: 'bg-[#e5f0e4] text-[#1d5a32]',
  INVOICED: 'bg-[#e7eee9] text-[#1b2823]',
  CLOSED: 'bg-[#ece7df] text-[#5e574e]'
};

export const SOURCE_LABEL: Record<SourceId, string> = {
  dmg: 'DMG',
  asset24: '24 Asset',
  reamsview: 'REAMSView',
  pruvan: 'Pruvan',
  guardian: 'Guardian',
  aspen: 'Aspen Grove',
  lula: 'Lula',
  direct: 'Direct'
};

export const SERVICE_LABEL: Record<ServiceType, string> = {
  door_repair: 'Door repair',
  property_preservation: 'Property preservation',
  landscaping: 'Landscaping',
  roofing: 'Roofing',
  handyman: 'Handyman',
  remediation: 'Remediation',
  facility: 'Facility services'
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent'
};

export const CUSTOMER_KIND_LABEL: Record<CustomerKind, string> = {
  property_manager: 'Property manager',
  portfolio: 'Portfolio owner',
  institutional: 'Institutional',
  direct: 'Direct client'
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  retail: 'Retail',
  multifamily: 'Multifamily',
  office: 'Office',
  single_family: 'Single family',
  mixed_use: 'Mixed use',
  institutional: 'Institutional'
};

export const CONTRACTOR_STATUS_LABEL: Record<ContractorStatus, string> = {
  application: 'Application',
  review: 'Review',
  document_verification: 'Document verification',
  approved: 'Approved',
  active: 'Active',
  suspended: 'Suspended'
};

export const ROLE_LABEL: Record<string, string> = {
  owner: 'Super admin / owner',
  operations: 'Operations manager',
  estimator: 'Estimator',
  dispatcher: 'Dispatcher',
  field: 'Field employee',
  contractor: 'Contractor'
};

export const CLOSED_STATUSES: JobStatus[] = ['COMPLETED', 'INVOICED', 'CLOSED'];
