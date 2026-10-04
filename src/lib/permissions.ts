import { Permission, RoleId } from './types';

/**
 * Demo UI permissions. Hiding a nav item is not authorization.
 * Server-side enforcement arrives with authentication in a later phase.
 */
const grants: Record<RoleId, Permission[]> = {
  owner: [
    'overview.read',
    'jobs.read',
    'jobs.financial',
    'dispatch.read',
    'calendar.read',
    'customers.read',
    'customers.contact',
    'properties.read',
    'workforce.read',
    'contractors.read',
    'documents.read',
    'playbook.read',
    'estimates.read',
    'invoices.read',
    'reports.read',
    'reports.financial',
    'automations.read',
    'integrations.read',
    'audit.read',
    'settings.read',
    'field.access'
  ],
  operations: [
    'overview.read',
    'jobs.read',
    'dispatch.read',
    'calendar.read',
    'customers.read',
    'customers.contact',
    'properties.read',
    'workforce.read',
    'contractors.read',
    'documents.read',
    'playbook.read',
    'estimates.read',
    'reports.read',
    'automations.read',
    'audit.read',
    'field.access'
  ],
  estimator: [
    'overview.read',
    'jobs.read',
    'jobs.financial',
    'calendar.read',
    'customers.read',
    'customers.contact',
    'properties.read',
    'documents.read',
    'playbook.read',
    'estimates.read',
    'reports.read'
  ],
  dispatcher: [
    'overview.read',
    'jobs.read',
    'dispatch.read',
    'calendar.read',
    'properties.read',
    'workforce.read',
    'contractors.read',
    'documents.read',
    'playbook.read',
    'reports.read',
    'field.access'
  ],
  field: ['playbook.read', 'field.access'],
  contractor: ['playbook.read', 'field.access']
};

export function can(role: RoleId, permission: Permission) {
  return grants[role].includes(permission);
}

export function isFieldRole(role: RoleId) {
  return role === 'field' || role === 'contractor';
}

export function fieldHome(pathname: string) {
  if (pathname.startsWith('/field/playbook')) return pathname;
  if (pathname.startsWith('/playbook')) return `/field${pathname}`;
  return '/field';
}
