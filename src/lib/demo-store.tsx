'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { canManageOnboarding, eligibleForWork, nextStage, stageBlockers, stageDetail } from './compliance';
import { addHours, longDate, TODAY } from './format';
import { contractorName, employeeName } from './records';
import { bumpVersion, canDelegate, canEditPlaybook, personName } from './playbook';
import {
  acknowledgements as seededAcks,
  contractors as seededContractors,
  documents as seededDocuments,
  responsibilities as seededResponsibilities,
  sops as seededSops,
  workOrders as seededOrders
} from './seed';
import { Acknowledgement, Contractor, ContractorApplication, FileAttachment, JobDocument, JobEvent, JobStatus, Responsibility, RoleId, Sop, WorkOrder } from './types';
import { arrivedAt, canAssign, canTake, checklistFor, departedAt, statusMoveDetail } from './workflow';

function stamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function nextVersion(version: string) {
  const number = Number(version.replace(/\D/g, ''));
  return Number.isFinite(number) && number > 0 ? String(number + 1) : '2';
}

function event(actor: string, action: string, detail: string): JobEvent {
  return { id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: stamp(), actor, action, detail };
}

function hydrate(order: WorkOrder): WorkOrder {
  const who = order.assigneeId ? employeeName(order.assigneeId) : order.contractorId ? contractorName(order.contractorId) : undefined;
  return {
    ...order,
    acceptedAt: order.acceptedAt ?? (order.contractorId && order.status !== 'ASSIGNED' ? `${order.createdAt}T10:00` : undefined),
    verifiedScope: order.verifiedScope ?? order.scope,
    checklist: checklistFor(order),
    notes: order.notes ?? [],
    events: order.events ?? [],
    checkedInAt: arrivedAt(order),
    checkedOutAt: departedAt(order),
    assignments:
      order.assignments ??
      (who
        ? [{ id: `${order.id}-assign-0`, at: `${order.createdAt}T09:00`, actor: 'Dispatch', who }]
        : [])
  };
}

export type DocumentInput = {
  relatedId: string;
  related: string;
  category: JobDocument['category'];
  name: string;
  expiresAt?: string;
  attachments?: FileAttachment[];
};

export type Outcome = { ok: true } | { ok: false; reason: string };

type DemoValue = {
  orders: WorkOrder[];
  contractors: Contractor[];
  documents: JobDocument[];
  assignEmployee: (workOrderId: string, employeeId: string, actor: string) => boolean;
  assignContractor: (workOrderId: string, contractorId: string, actor: string) => boolean;
  advance: (workOrderId: string, to: JobStatus, role: RoleId, actor: string) => boolean;
  schedule: (workOrderId: string, start: string, actor: string, hours?: number) => boolean;
  assignAndSchedule: (workOrderId: string, personId: string, start: string, actor: string, hours?: number) => boolean;
  respondToAssignment: (workOrderId: string, contractorId: string, accept: boolean, actor: string, reason?: string) => boolean;
  checkIn: (workOrderId: string, actor: string) => void;
  checkOut: (workOrderId: string, actor: string) => void;
  toggleCheck: (workOrderId: string, itemId: string) => void;
  addPhoto: (workOrderId: string, category: string, actor: string) => void;
  addNote: (workOrderId: string, body: string, actor: string) => void;
  saveScope: (workOrderId: string, scope: string, actor: string) => void;
  applyContractor: (input: ContractorApplication) => Outcome & { contractorId?: string };
  advanceContractor: (contractorId: string, role: RoleId, actor: string) => Outcome;
  recordDocument: (input: DocumentInput, actor: string) => void;
  addDocument: (input: DocumentInput, actor: string, restricted: boolean) => string;
  reviseDocument: (id: string, patch: { name?: string; expiresAt?: string; note?: string }, actor: string) => void;
  eligibleContractors: Contractor[];
  sops: Sop[];
  acks: Acknowledgement[];
  responsibilities: Responsibility[];
  delegationLog: JobEvent[];
  acknowledge: (personId: string, sopId: string) => void;
  publishRevision: (sopId: string, input: { note: string; step?: string }, role: RoleId, actor: string) => boolean;
  delegate: (responsibilityId: string, patch: DelegationPatch, role: RoleId, actor: string) => boolean;
};

export type DelegationPatch = Partial<Pick<Responsibility, 'ownerId' | 'backupId' | 'approverId' | 'coverUntil'>>;

const DemoContext = createContext<DemoValue | null>(null);

// Bump when seed data changes so sessions saved against the old seed are discarded.
const SEED_VERSION = 'v3';

const KEYS = {
  orders: `ahs-demo-${SEED_VERSION}-orders`,
  contractors: `ahs-demo-${SEED_VERSION}-contractors`,
  documents: `ahs-demo-${SEED_VERSION}-documents`,
  sops: `ahs-demo-${SEED_VERSION}-sops`,
  acks: `ahs-demo-${SEED_VERSION}-acks`,
  responsibilities: `ahs-demo-${SEED_VERSION}-responsibilities`,
  delegation: `ahs-demo-${SEED_VERSION}-delegation`
};

function dropStaleKeys() {
  const current = new Set<string>(Object.values(KEYS));
  Object.keys(window.sessionStorage)
    .filter((key) => key.startsWith('ahs-demo-') && !current.has(key))
    .forEach((key) => window.sessionStorage.removeItem(key));
}

function readStored<T>(key: string): T[] | undefined {
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
  } catch {
    window.sessionStorage.removeItem(key);
    return undefined;
  }
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<WorkOrder[]>(() => seededOrders.map(hydrate));
  const [crew, setCrew] = useState<Contractor[]>(seededContractors);
  const [files, setFiles] = useState<JobDocument[]>(seededDocuments);
  const [sops, setSops] = useState<Sop[]>(seededSops);
  const [acks, setAcks] = useState<Acknowledgement[]>(seededAcks);
  const [duties, setDuties] = useState<Responsibility[]>(seededResponsibilities);
  const [delegationLog, setDelegationLog] = useState<JobEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dropStaleKeys();
    const storedOrders = readStored<WorkOrder>(KEYS.orders);
    const storedCrew = readStored<Contractor>(KEYS.contractors);
    const storedFiles = readStored<JobDocument>(KEYS.documents);
    if (storedOrders) setOrders(storedOrders);
    if (storedCrew) setCrew(storedCrew);
    if (storedFiles) setFiles(storedFiles);
    const storedSops = readStored<Sop>(KEYS.sops);
    const storedAcks = readStored<Acknowledgement>(KEYS.acks);
    const storedDuties = readStored<Responsibility>(KEYS.responsibilities);
    const storedLog = readStored<JobEvent>(KEYS.delegation);
    if (storedSops) setSops(storedSops);
    if (storedAcks) setAcks(storedAcks);
    if (storedDuties) setDuties(storedDuties);
    if (storedLog) setDelegationLog(storedLog);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.sessionStorage.setItem(KEYS.orders, JSON.stringify(orders));
    window.sessionStorage.setItem(KEYS.contractors, JSON.stringify(crew));
    try {
      window.sessionStorage.setItem(KEYS.documents, JSON.stringify(files));
    } catch {
      // Session storage is full: keep the records but drop image previews.
      const slim = files.map((file) => (file.attachments ? { ...file, attachments: file.attachments.map(({ preview: _preview, ...rest }) => rest) } : file));
      window.sessionStorage.setItem(KEYS.documents, JSON.stringify(slim));
    }
    window.sessionStorage.setItem(KEYS.sops, JSON.stringify(sops));
    window.sessionStorage.setItem(KEYS.acks, JSON.stringify(acks));
    window.sessionStorage.setItem(KEYS.responsibilities, JSON.stringify(duties));
    window.sessionStorage.setItem(KEYS.delegation, JSON.stringify(delegationLog));
  }, [hydrated, orders, crew, files, sops, acks, duties, delegationLog]);

  const value = useMemo<DemoValue>(() => {
    const update = (workOrderId: string, recipe: (order: WorkOrder) => WorkOrder) => {
      setOrders((current) => current.map((order) => (order.id === workOrderId ? recipe(order) : order)));
    };
    const logContractor = (contractorId: string, entry: JobEvent, patch: Partial<Contractor> = {}) => {
      setCrew((current) =>
        current.map((item) => (item.id === contractorId ? { ...item, ...patch, history: [...item.history, entry] } : item))
      );
    };
    const isEligible = (contractorId: string) => {
      const contractor = crew.find((item) => item.id === contractorId);
      return Boolean(contractor && eligibleForWork(contractor, files));
    };

    return {
      orders,
      contractors: crew,
      documents: files,
      eligibleContractors: crew.filter((item) => eligibleForWork(item, files)),
      sops,
      acks,
      responsibilities: duties,
      delegationLog,
      acknowledge: (personId, sopId) => {
        const sop = sops.find((item) => item.id === sopId);
        if (!sop) return;
        setAcks((current) => [...current, { personId, sopId, version: sop.version, at: stamp() }]);
      },
      publishRevision: (sopId, input, role, actor) => {
        const note = input.note.trim();
        if (!canEditPlaybook(role) || !note) return false;
        setSops((current) =>
          current.map((sop) => {
            if (sop.id !== sopId) return sop;
            const version = bumpVersion(sop.version);
            const step = input.step?.trim();
            return {
              ...sop,
              version,
              updatedAt: TODAY,
              steps: step ? [...sop.steps, step] : sop.steps,
              changelog: [{ version, at: TODAY, by: actor, note }, ...sop.changelog]
            };
          })
        );
        return true;
      },
      delegate: (responsibilityId, patch, role, actor) => {
        const duty = duties.find((item) => item.id === responsibilityId);
        if (!duty || !canDelegate(role)) return false;
        if (patch.ownerId && !duty.delegable) return false;
        const changes: string[] = [];
        if (patch.ownerId && patch.ownerId !== duty.ownerId) changes.push(`Owner ${personName(duty.ownerId)} → ${personName(patch.ownerId)}`);
        if ('backupId' in patch && patch.backupId !== duty.backupId) changes.push(`Backup ${personName(duty.backupId)} → ${personName(patch.backupId)}`);
        if ('approverId' in patch && patch.approverId !== duty.approverId) changes.push(`Approver ${personName(duty.approverId)} → ${personName(patch.approverId)}`);
        if ('coverUntil' in patch && patch.coverUntil !== duty.coverUntil) {
          changes.push(patch.coverUntil ? `${personName(duty.backupId)} covers until ${patch.coverUntil}` : 'Cover ended');
        }
        if (changes.length === 0) return false;
        const handedOff = patch.ownerId && patch.ownerId !== duty.ownerId;
        setDuties((current) =>
          current.map((item) =>
            item.id === responsibilityId
              ? { ...item, ...patch, readiness: handedOff ? `Handed to ${personName(patch.ownerId)} on ${longDate(TODAY)}` : item.readiness }
              : item
          )
        );
        setDelegationLog((current) => [event(actor, duty.functionName, changes.join('. ')), ...current]);
        return true;
      },
      assignEmployee: (workOrderId, employeeId, actor) => {
        const order = orders.find((item) => item.id === workOrderId);
        if (!order || !canAssign(order.status)) return false;
        const who = employeeName(employeeId) ?? 'Field technician';
        const moving = order.status === 'APPROVED' || order.status === 'READY_FOR_DISPATCH';
        update(workOrderId, (current) => ({
          ...current,
          assigneeId: employeeId,
          contractorId: undefined,
          acceptedAt: undefined,
          status: moving ? 'ASSIGNED' : current.status,
          assignments: [...(current.assignments ?? []), { id: `as-${Date.now()}`, at: stamp(), actor, who }],
          events: [...(current.events ?? []), event(actor, 'Assigned', moving ? `${who}. ${statusMoveDetail(current.status, 'ASSIGNED')}` : who)]
        }));
        return true;
      },
      assignContractor: (workOrderId, contractorId, actor) => {
        const order = orders.find((item) => item.id === workOrderId);
        if (!order || !canAssign(order.status) || !isEligible(contractorId)) return false;
        const who = contractorName(contractorId) ?? 'Contractor';
        const moving = order.status === 'APPROVED' || order.status === 'READY_FOR_DISPATCH';
        update(workOrderId, (current) => ({
          ...current,
          contractorId,
          assigneeId: undefined,
          acceptedAt: undefined,
          status: moving ? 'ASSIGNED' : current.status,
          assignments: [...(current.assignments ?? []), { id: `as-${Date.now()}`, at: stamp(), actor, who }],
          events: [...(current.events ?? []), event(actor, 'Assigned contractor', `${moving ? `${who}. ${statusMoveDetail(current.status, 'ASSIGNED')}` : who}. Waiting on acceptance`)]
        }));
        return true;
      },
      advance: (workOrderId, to, role, actor) => {
        const order = orders.find((item) => item.id === workOrderId);
        if (!order || !canTake(order, role, to)) return false;
        update(workOrderId, (current) => ({
          ...current,
          status: to,
          checkedOutAt: to === 'AWAITING_DOCUMENTATION' ? current.checkedOutAt ?? stamp() : current.checkedOutAt,
          checkedInAt: to === 'IN_PROGRESS' ? current.checkedInAt ?? stamp() : current.checkedInAt,
          events: [...(current.events ?? []), event(actor, 'Moved status', statusMoveDetail(current.status, to))]
        }));
        return true;
      },
      schedule: (workOrderId, start, actor, hours = 3) => {
        const order = orders.find((item) => item.id === workOrderId);
        if (!order || !start) return false;
        if (!order.assigneeId && !order.contractorId) return false;
        if (!['ASSIGNED', 'SCHEDULED'].includes(order.status)) return false;
        const was = order.status;
        update(workOrderId, (current) => ({
          ...current,
          status: 'SCHEDULED',
          scheduledStart: start,
          scheduledEnd: addHours(start, hours),
          events: [
            ...(current.events ?? []),
            event(actor, 'Scheduled', was === 'SCHEDULED' ? `Moved to ${start}` : statusMoveDetail(was, 'SCHEDULED'))
          ]
        }));
        return true;
      },
      assignAndSchedule: (workOrderId, personId, start, actor, hours = 3) => {
        const order = orders.find((item) => item.id === workOrderId);
        if (!order || !canAssign(order.status) || !start) return false;
        const isContractor = personId.startsWith('c-');
        if (isContractor && !isEligible(personId)) return false;
        const who = isContractor ? contractorName(personId) ?? 'Contractor' : employeeName(personId) ?? 'Field technician';
        const sameContractor = isContractor && order.contractorId === personId;
        update(workOrderId, (current) => ({
          ...current,
          assigneeId: isContractor ? undefined : personId,
          contractorId: isContractor ? personId : undefined,
          acceptedAt: sameContractor ? current.acceptedAt : undefined,
          status: 'SCHEDULED',
          scheduledStart: start,
          scheduledEnd: addHours(start, hours),
          assignments: [...(current.assignments ?? []), { id: `as-${Date.now()}`, at: stamp(), actor, who }],
          events: [
            ...(current.events ?? []),
            event(actor, 'Assigned and scheduled', `${who} · ${start}`)
          ]
        }));
        return true;
      },
      respondToAssignment: (workOrderId, contractorId, accept, actor, reason) => {
        const order = orders.find((item) => item.id === workOrderId);
        if (!order || order.contractorId !== contractorId || order.acceptedAt) return false;
        if (accept) {
          update(workOrderId, (current) => ({
            ...current,
            acceptedAt: stamp(),
            events: [...(current.events ?? []), event(actor, 'Accepted assignment', contractorName(contractorId) ?? 'Contractor')]
          }));
          logContractor(contractorId, event(actor, 'Accepted job', order.number));
          return true;
        }
        const why = reason?.trim() || 'No reason given';
        update(workOrderId, (current) => ({
          ...current,
          contractorId: undefined,
          acceptedAt: undefined,
          scheduledStart: undefined,
          scheduledEnd: undefined,
          status: 'READY_FOR_DISPATCH',
          events: [
            ...(current.events ?? []),
            event(actor, 'Declined assignment', `${why}. ${statusMoveDetail(current.status, 'READY_FOR_DISPATCH')}`)
          ]
        }));
        logContractor(contractorId, event(actor, 'Declined job', `${order.number}: ${why}`));
        return true;
      },
      checkIn: (workOrderId, actor) => {
        update(workOrderId, (current) => {
          if (current.checkedInAt) return current;
          if (current.contractorId && !current.acceptedAt) return current;
          const nextStatus = current.status === 'SCHEDULED' || current.status === 'ASSIGNED' ? 'IN_PROGRESS' : current.status;
          return {
            ...current,
            checkedInAt: stamp(),
            status: nextStatus,
            events: [
              ...(current.events ?? []),
              event(actor, 'Checked in', nextStatus === current.status ? 'Arrival recorded' : statusMoveDetail(current.status, nextStatus))
            ]
          };
        });
      },
      checkOut: (workOrderId, actor) => {
        update(workOrderId, (current) => {
          if (!current.checkedInAt || current.checkedOutAt) return current;
          const nextStatus = current.status === 'IN_PROGRESS' ? 'AWAITING_DOCUMENTATION' : current.status;
          return {
            ...current,
            checkedOutAt: stamp(),
            status: nextStatus,
            events: [
              ...(current.events ?? []),
              event(actor, 'Checked out', nextStatus === current.status ? 'Departure recorded' : statusMoveDetail(current.status, nextStatus))
            ]
          };
        });
      },
      toggleCheck: (workOrderId, itemId) => {
        update(workOrderId, (current) => ({
          ...current,
          checklist: checklistFor(current).map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
        }));
      },
      addPhoto: (workOrderId, category, actor) => {
        update(workOrderId, (current) => {
          const already = current.photos.find((photo) => photo.category === category)?.done;
          if (already) return current;
          return {
            ...current,
            photos: current.photos.map((photo) => (photo.category === category ? { ...photo, done: true } : photo)),
            events: [...(current.events ?? []), event(actor, 'Uploaded photo', category)]
          };
        });
      },
      addNote: (workOrderId, body, actor) => {
        const text = body.trim();
        if (!text) return;
        update(workOrderId, (current) => ({
          ...current,
          notes: [...(current.notes ?? []), { id: `note-${Date.now()}`, at: stamp(), author: actor, body: text }],
          events: [...(current.events ?? []), event(actor, 'Added a note', text)]
        }));
      },
      saveScope: (workOrderId, scope, actor) => {
        const text = scope.trim();
        if (!text) return;
        update(workOrderId, (current) => ({
          ...current,
          verifiedScope: text,
          events: [...(current.events ?? []), event(actor, 'Updated scope', 'Verified scope saved')]
        }));
      },
      applyContractor: (input) => {
        const company = input.company.trim();
        const contactName = input.contactName.trim();
        const phone = input.phone.trim();
        const email = input.email.trim().toLowerCase();
        const serviceArea = input.serviceArea.trim();
        const notes = input.notes?.trim();
        const trades = input.trades;
        if (!company || !contactName || !phone || !email || !serviceArea) {
          return { ok: false, reason: 'Company, contact, phone, email, and service area are required' };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return { ok: false, reason: 'Enter a valid email' };
        }
        if (trades.length === 0) {
          return { ok: false, reason: 'Choose at least one trade' };
        }
        const existing = crew.find((item) => item.email.toLowerCase() === email);
        if (existing) return { ok: true, contractorId: existing.id };
        const slug = company
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 24);
        const contractorId = `c-${slug || 'app'}-${Date.now().toString(36)}`;
        const record: Contractor = {
          id: contractorId,
          company,
          contactName,
          phone,
          email,
          trades,
          serviceArea,
          status: 'application',
          verification: 'unverified',
          jobsCompleted: 0,
          rating: 0,
          onTimeRate: 0,
          docCompliance: 0,
          availability: 'Not yet approved',
          notes: notes || 'Submitted through the contractor application.',
          history: [event(contactName, 'Submitted application', `${trades.length} trade${trades.length === 1 ? '' : 's'} · ${serviceArea}`)]
        };
        setCrew((current) => [record, ...current]);
        return { ok: true, contractorId };
      },
      advanceContractor: (contractorId, role, actor) => {
        const contractor = crew.find((item) => item.id === contractorId);
        if (!contractor) return { ok: false, reason: 'Contractor not found' };
        if (!canManageOnboarding(role)) return { ok: false, reason: 'Only the owner or operations can move onboarding stages' };
        const to = nextStage(contractor.status);
        if (!to) return { ok: false, reason: 'Already active' };
        const blockers = stageBlockers(contractor, files);
        if (blockers.length > 0) return { ok: false, reason: blockers[0] };
        const verification: Contractor['verification'] =
          to === 'document_verification' ? 'in_review' : to === 'approved' || to === 'active' ? 'verified' : contractor.verification;
        logContractor(contractorId, event(actor, to === 'active' ? 'Activated contractor' : 'Moved stage', stageDetail(contractor.status, to)), {
          status: to,
          verification,
          availability: to === 'active' ? 'Available for assignment' : contractor.availability
        });
        return { ok: true };
      },
      addDocument: (input, actor, restricted) => {
        const record: JobDocument = {
          id: `doc-${Date.now()}`,
          name: input.name.trim() || `${input.related} ${input.category}`,
          category: input.category,
          related: input.related,
          relatedId: input.relatedId,
          expiresAt: input.expiresAt || undefined,
          version: '1',
          updatedAt: TODAY,
          restricted,
          uploadedBy: actor,
          history: [],
          attachments: input.attachments?.length ? input.attachments : undefined
        };
        setFiles((current) => [record, ...current]);
        return record.id;
      },
      reviseDocument: (id, patch, actor) => {
        setFiles((current) =>
          current.map((file) =>
            file.id === id
              ? {
                  ...file,
                  name: patch.name?.trim() || file.name,
                  expiresAt: patch.expiresAt === undefined ? file.expiresAt : patch.expiresAt || undefined,
                  version: nextVersion(file.version),
                  updatedAt: TODAY,
                  uploadedBy: actor,
                  history: [{ version: file.version, updatedAt: file.updatedAt, by: file.uploadedBy ?? 'Unknown', note: patch.note?.trim() || 'Superseded' }, ...(file.history ?? [])]
                }
              : file
          )
        );
      },
      recordDocument: (input, actor) => {
        const existing = files.find((file) => file.relatedId === input.relatedId && file.category === input.category);
        const record: JobDocument = {
          id: existing?.id ?? `doc-${Date.now()}`,
          name: input.name.trim() || existing?.name || `${input.related} ${input.category}`,
          category: input.category,
          related: input.related,
          relatedId: input.relatedId,
          expiresAt: input.expiresAt || undefined,
          version: existing ? nextVersion(existing.version) : '1',
          updatedAt: TODAY,
          restricted: input.category !== 'certification',
          uploadedBy: actor,
          history: existing
            ? [{ version: existing.version, updatedAt: existing.updatedAt, by: existing.uploadedBy ?? 'Unknown', note: 'Replaced by renewal' }, ...(existing.history ?? [])]
            : []
        };
        setFiles((current) => (existing ? current.map((file) => (file.id === existing.id ? record : file)) : [...current, record]));
        if (input.relatedId.startsWith('c-')) {
          logContractor(
            input.relatedId,
            event(actor, existing ? 'Renewed document' : 'Recorded document', `${record.name}${record.expiresAt ? `, expires ${record.expiresAt}` : ''}`)
          );
        }
      }
    };
  }, [orders, crew, files, sops, acks, duties, delegationLog]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used within DemoStoreProvider');
  return value;
}
