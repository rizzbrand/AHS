import { docState, docStateLabel } from './compliance';
import { CLOSED_STATUSES } from './labels';
import { shortDate, TODAY } from './format';
import { contractors, customers, documents, employees, properties } from './seed';
import { JobDocument, WorkOrder } from './types';

export function customerName(id: string) {
  return customers.find((customer) => customer.id === id)?.name ?? 'Unknown customer';
}

export function propertyById(id: string) {
  return properties.find((property) => property.id === id);
}

export function employeeName(id?: string) {
  if (!id) return undefined;
  return employees.find((employee) => employee.id === id)?.name;
}

export function contractorName(id?: string) {
  if (!id) return undefined;
  return contractors.find((contractor) => contractor.id === id)?.company;
}

export function assigneeLabel(order: WorkOrder) {
  return employeeName(order.assigneeId) ?? contractorName(order.contractorId) ?? 'Unassigned';
}

export function photoCount(order: WorkOrder) {
  const done = order.photos.filter((photo) => photo.done).length;
  return { done, total: order.photos.length };
}

export function isOpen(order: WorkOrder) {
  return !CLOSED_STATUSES.includes(order.status);
}

export function isOverdue(order: WorkOrder) {
  return isOpen(order) && order.dueAt < TODAY;
}

export function attentionFor(orders: WorkOrder[], files: JobDocument[] = documents) {
  const items: { id: string; tone: 'risk' | 'wait'; title: string; detail: string; href: string }[] = [];

  orders.filter((order) => isOpen(order) && !order.assigneeId && !order.contractorId).forEach((order) => {
    items.push({
      id: `unassigned-${order.id}`,
      tone: 'risk',
      title: `${order.number} is unassigned`,
      detail: `${propertyById(order.propertyId)?.name ?? 'Property'} · due ${shortDate(order.dueAt)}`,
      href: `/work-orders/${order.id}`
    });
  });

  orders.filter(isOverdue).forEach((order) => {
    items.push({
      id: `overdue-${order.id}`,
      tone: 'risk',
      title: `${order.number} is past due`,
      detail: propertyById(order.propertyId)?.city ?? '',
      href: `/work-orders/${order.id}`
    });
  });

  orders
    .filter((order) => ['IN_PROGRESS', 'AWAITING_DOCUMENTATION', 'SCHEDULED'].includes(order.status))
    .forEach((order) => {
      const photos = photoCount(order);
      if (photos.done < photos.total) {
        items.push({
          id: `photos-${order.id}`,
          tone: 'wait',
          title: `${order.number} is short on photos`,
          detail: `${photos.done} / ${photos.total} required`,
          href: `/work-orders/${order.id}`
        });
      }
    });

  files
    .filter((document) => {
      const state = docState(document);
      return state === 'expired' || state === 'expiring';
    })
    .forEach((document) => {
      items.push({
        id: document.id,
        tone: 'risk',
        title: document.name,
        detail: docStateLabel(document),
        href: document.relatedId.startsWith('c-') ? `/contractors/${document.relatedId}` : '/documents'
      });
    });

  orders
    .filter((order) => order.status === 'AWAITING_APPROVAL')
    .forEach((order) => {
      items.push({
        id: `approval-${order.id}`,
        tone: 'wait',
        title: `${order.number} is waiting on approval`,
        detail: customerName(order.customerId),
        href: `/work-orders/${order.id}`
      });
    });

  orders
    .filter((order) => order.paymentStatus === 'overdue')
    .forEach((order) => {
      items.push({
        id: `pay-${order.id}`,
        tone: 'risk',
        title: `${order.number} payment is overdue`,
        detail: 'Follow up from the invoice register',
        href: '/invoices'
      });
    });

  return items;
}
