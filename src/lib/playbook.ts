import { ROLE_LABEL } from './labels';
import { contractors as seededContractors, employees } from './seed';
import { Acknowledgement, Contractor, RoleId, SessionUser, Sop } from './types';

export type AckState = 'current' | 'outdated' | 'missing';

export const ACK_LABEL: Record<AckState, string> = {
  current: 'Signed off',
  outdated: 'Needs re-sign',
  missing: 'Not signed'
};

export const ACK_TONE: Record<AckState, string> = {
  current: 'bg-[#e5f0e4] text-[#1d5a32]',
  outdated: 'bg-[#f8ecd4] text-[#7a4e08]',
  missing: 'bg-[#f6dedb] text-[#9f2d2d]'
};

export function personKey(user: SessionUser) {
  return user.personId ?? user.contractorId;
}

export function personName(id?: string, crew: Contractor[] = seededContractors) {
  if (!id) return '—';
  return employees.find((item) => item.id === id)?.name ?? crew.find((item) => item.id === id)?.company ?? 'Unknown';
}

export function latestAck(personId: string, sopId: string, acks: Acknowledgement[]) {
  return acks.filter((ack) => ack.personId === personId && ack.sopId === sopId).sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function ackState(personId: string, sop: Sop, acks: Acknowledgement[]): AckState {
  const ack = latestAck(personId, sop.id, acks);
  if (!ack) return 'missing';
  return ack.version === sop.version ? 'current' : 'outdated';
}

export function isDraft(sop: Sop) {
  return sop.version.startsWith('0.');
}

export function bumpVersion(version: string) {
  const [major, minor = 0] = version.split('.').map(Number);
  return minor >= 9 ? `${major + 1}.0` : `${major}.${minor + 1}`;
}

/** Everyone expected to sign off on this SOP. Contractors count only once active. */
export function audienceFor(sop: Sop, crew: Contractor[]) {
  const people = employees
    .filter((employee) => sop.audience.includes(employee.role))
    .map((employee) => ({ id: employee.id, name: employee.name, label: ROLE_LABEL[employee.role], href: `/workforce/${employee.id}` }));
  if (sop.audience.includes('contractor')) {
    crew
      .filter((contractor) => contractor.status === 'active')
      .forEach((contractor) => people.push({ id: contractor.id, name: contractor.company, label: 'Contractor', href: `/contractors/${contractor.id}` }));
  }
  return people;
}

export function requiredSops(role: RoleId, sops: Sop[]) {
  return sops.filter((sop) => sop.audience.includes(role));
}

export function canEditPlaybook(role: RoleId) {
  return role === 'owner' || role === 'operations';
}

export function canDelegate(role: RoleId) {
  return role === 'owner';
}
