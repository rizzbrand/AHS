import { can } from './permissions';
import { properties } from './seed';
import { JobDocument, Permission, RoleId, WorkOrder } from './types';

export const DOC_CATEGORY_LABEL: Record<JobDocument['category'], string> = {
  job: 'Job',
  license: 'License',
  insurance: 'Insurance',
  certification: 'Certification',
  inspection: 'Inspection',
  completion: 'Completion',
  customer: 'Customer',
  property: 'Property'
};

export type RelatedKind = 'contractor' | 'employee' | 'work_order' | 'property' | 'customer';

export const RELATED_KIND_LABEL: Record<RelatedKind, string> = {
  contractor: 'Contractor',
  employee: 'Employee',
  work_order: 'Work order',
  property: 'Property',
  customer: 'Customer'
};

export function relatedKind(id: string): RelatedKind {
  if (id.startsWith('c-')) return 'contractor';
  if (id.startsWith('p-')) return 'employee';
  if (id.startsWith('wo-')) return 'work_order';
  if (id.startsWith('pr-')) return 'property';
  return 'customer';
}

export function relatedHref(id: string) {
  const kind = relatedKind(id);
  if (kind === 'contractor') return `/contractors/${id}`;
  if (kind === 'employee') return `/workforce/${id}`;
  if (kind === 'work_order') return `/work-orders/${id}`;
  if (kind === 'property') return `/properties/${id}`;
  return `/customers/${id}`;
}

const RELATED_PERMISSION: Record<RelatedKind, Permission> = {
  contractor: 'contractors.read',
  employee: 'workforce.read',
  work_order: 'jobs.read',
  property: 'properties.read',
  customer: 'customers.read'
};

export function canViewRelated(role: RoleId, id: string) {
  return can(role, RELATED_PERMISSION[relatedKind(id)]);
}

/** Restricted files hold contracts, rates, and compliance paperwork. Demo UI rule only. */
export function canOpenDocument(role: RoleId, document: JobDocument) {
  if (!document.restricted) return true;
  if (role === 'owner' || role === 'operations') return true;
  if (role === 'estimator') return document.category === 'customer' || document.category === 'property';
  return false;
}

export function documentsForProperty(propertyId: string, orders: WorkOrder[], documents: JobDocument[]) {
  const jobIds = new Set(orders.filter((order) => order.propertyId === propertyId).map((order) => order.id));
  return documents.filter((document) => document.relatedId === propertyId || jobIds.has(document.relatedId));
}

export function documentsForCustomer(customerId: string, orders: WorkOrder[], documents: JobDocument[]) {
  const propertyIds = new Set(properties.filter((property) => property.customerId === customerId).map((property) => property.id));
  const jobIds = new Set(orders.filter((order) => order.customerId === customerId).map((order) => order.id));
  return documents.filter(
    (document) => document.relatedId === customerId || propertyIds.has(document.relatedId) || jobIds.has(document.relatedId)
  );
}
