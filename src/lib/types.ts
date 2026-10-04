export type RoleId = 'owner' | 'operations' | 'estimator' | 'dispatcher' | 'field' | 'contractor';

export type Permission =
  | 'overview.read'
  | 'jobs.read'
  | 'jobs.financial'
  | 'dispatch.read'
  | 'calendar.read'
  | 'customers.read'
  | 'customers.contact'
  | 'properties.read'
  | 'workforce.read'
  | 'contractors.read'
  | 'documents.read'
  | 'playbook.read'
  | 'estimates.read'
  | 'invoices.read'
  | 'reports.read'
  | 'reports.financial'
  | 'automations.read'
  | 'integrations.read'
  | 'audit.read'
  | 'settings.read'
  | 'field.access';

export type JobStatus =
  | 'NEW'
  | 'REVIEW'
  | 'INSPECTION_REQUIRED'
  | 'INSPECTION_COMPLETE'
  | 'ESTIMATE_PREPARING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'READY_FOR_DISPATCH'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'AWAITING_DOCUMENTATION'
  | 'SUBMITTED_FOR_REVIEW'
  | 'COMPLETED'
  | 'INVOICED'
  | 'CLOSED';

export type ServiceType =
  | 'door_repair'
  | 'property_preservation'
  | 'landscaping'
  | 'roofing'
  | 'handyman'
  | 'remediation'
  | 'facility';

export type SourceId = 'dmg' | 'asset24' | 'reamsview' | 'pruvan' | 'guardian' | 'aspen' | 'lula' | 'direct';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type CustomerKind = 'property_manager' | 'portfolio' | 'institutional' | 'direct';

export type PropertyType = 'retail' | 'multifamily' | 'office' | 'single_family' | 'mixed_use' | 'institutional';

export type ContractorStatus = 'application' | 'review' | 'document_verification' | 'approved' | 'active' | 'suspended';

export type SessionUser = {
  id: string;
  name: string;
  title: string;
  role: RoleId;
  initials: string;
  personId?: string;
  contractorId?: string;
};

export type Customer = {
  id: string;
  name: string;
  kind: CustomerKind;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  region: string;
  since: string;
  terms: string;
  sources: SourceId[];
  notes: string;
  contacts: ContactPerson[];
};

export type ContactPerson = {
  name: string;
  role: string;
  email?: string;
  phone?: string;
};

export type Property = {
  id: string;
  name: string;
  customerId: string;
  address: string;
  city: string;
  state: 'DC' | 'MD' | 'VA';
  zip: string;
  type: PropertyType;
  accessNotes: string;
  size: string;
  yearBuilt: number;
  hazards: string[];
  siteContact: ContactPerson;
};

export type Employee = {
  id: string;
  name: string;
  title: string;
  role: RoleId;
  status: 'available' | 'on_job' | 'off';
  base: string;
  phone: string;
  startedAt: string;
};

export type Contractor = {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  trades: ServiceType[];
  serviceArea: string;
  status: ContractorStatus;
  verification: 'unverified' | 'in_review' | 'verified';
  jobsCompleted: number;
  rating: number;
  onTimeRate: number;
  docCompliance: number;
  availability: string;
  notes: string;
  history: JobEvent[];
};

export type ChecklistItem = { id: string; label: string; done: boolean };

export type JobNote = { id: string; at: string; author: string; body: string };

export type AssignmentEntry = { id: string; at: string; actor: string; who: string };

export type JobEvent = { id: string; at: string; actor: string; action: string; detail: string };

export type WorkOrder = {
  id: string;
  number: string;
  source: SourceId;
  externalId: string;
  service: ServiceType;
  priority: Priority;
  status: JobStatus;
  createdAt: string;
  dueAt: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  propertyId: string;
  customerId: string;
  assigneeId?: string;
  contractorId?: string;
  acceptedAt?: string;
  scope: string;
  verifiedScope?: string;
  internalNotes: string;
  inspectionRequired: boolean;
  photos: { category: string; done: boolean }[];
  checklist?: ChecklistItem[];
  notes?: JobNote[];
  assignments?: AssignmentEntry[];
  events?: JobEvent[];
  checkedInAt?: string;
  checkedOutAt?: string;
  estimate?: number;
  approvedAmount?: number;
  contractorCost?: number;
  paymentStatus?: 'unbilled' | 'invoiced' | 'partial' | 'paid' | 'overdue';
};

export type JobDocument = {
  id: string;
  name: string;
  category: 'job' | 'license' | 'insurance' | 'certification' | 'inspection' | 'completion' | 'customer' | 'property';
  related: string;
  relatedId: string;
  expiresAt?: string;
  version: string;
  updatedAt: string;
  restricted: boolean;
  uploadedBy?: string;
  history?: DocumentVersion[];
  attachments?: FileAttachment[];
};

/** A file picked in the browser. Kept in session storage only; nothing is sent to a server. */
export type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
};

export type DocumentVersion = {
  version: string;
  updatedAt: string;
  by: string;
  note: string;
};

export type Sop = {
  id: string;
  title: string;
  category: string;
  purpose: string;
  role: string;
  audience: RoleId[];
  ownerId: string;
  steps: string[];
  tools: string[];
  safety: string[];
  quality: string;
  issues: string[];
  escalation: string;
  version: string;
  updatedAt: string;
  changelog: { version: string; at: string; by: string; note: string }[];
};

export type Acknowledgement = {
  personId: string;
  sopId: string;
  version: string;
  at: string;
};

export type EstimateRecord = {
  id: string;
  number: string;
  workOrderId: string;
  amount: number;
  status: 'draft' | 'internal_review' | 'sent_to_jobtread' | 'approved';
  preparedBy: string;
};

export type InvoiceRecord = {
  id: string;
  number: string;
  workOrderId: string;
  amount: number;
  status: 'ready_for_jobtread' | 'submitted' | 'partial' | 'paid' | 'overdue';
  issuedAt: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  at: string;
  tone: 'info' | 'risk';
};

export type IntegrationConnector = {
  id: string;
  name: string;
  purpose: string;
  direction: string;
  status: 'not_connected';
  note: string;
};

export type AutomationRule = {
  id: string;
  name: string;
  when: string;
  then: string[];
  state: 'designed' | 'active_in_demo';
};

export type Responsibility = {
  id: string;
  functionName: string;
  description: string;
  ownerId: string;
  backupId?: string;
  approverId?: string;
  sopId?: string;
  cadence: string;
  delegable: boolean;
  readiness: string;
  coverUntil?: string;
};
