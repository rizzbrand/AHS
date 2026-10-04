'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Phone } from 'lucide-react';
import { Gate } from '../../../../components/auth/Gate';
import { Avatar } from '../../../../components/ui/DataTable';
import { DocumentTable } from '../../../../components/documents/DocumentTable';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { useDemo } from '../../../../lib/demo-store';
import { documentsForCustomer } from '../../../../lib/documents';
import { longDate, money, shortDate } from '../../../../lib/format';
import { CUSTOMER_KIND_LABEL, PROPERTY_TYPE_LABEL, SERVICE_LABEL, SOURCE_LABEL } from '../../../../lib/labels';
import { can } from '../../../../lib/permissions';
import { assigneeLabel, isOpen, isOverdue, propertyById } from '../../../../lib/records';
import { customers, invoices, properties } from '../../../../lib/seed';
import { useSession } from '../../../../lib/session';
import { CustomerKind } from '../../../../lib/types';

const KIND_TONE: Record<CustomerKind, string> = {
  property_manager: 'bg-[#e4ecf4] text-[#1e3a5f]',
  portfolio: 'bg-[#ede7f6] text-[#4b3a78]',
  institutional: 'bg-[#e8f0ea] text-[#2f5d3d]',
  direct: 'bg-[#f6ecd9] text-[#7a4e08]'
};

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const { orders, documents } = useDemo();
  const customer = customers.find((item) => item.id === params.id);

  if (!user) return null;
  if (!customer) {
    return (
      <Gate permission="customers.read" title="Customer records are limited" body="Client contact details are not part of dispatch or field work.">
        <div className="mx-auto max-w-[1240px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Customers</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none text-ink">Customer not found</h1>
          <p className="mt-3 text-sm text-muted">That record is not in the directory.</p>
          <Link href="/customers" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline">
            <ArrowLeft size={15} /> Back to customers
          </Link>
        </div>
      </Gate>
    );
  }

  const showContact = can(user.role, 'customers.contact');
  const showMoney = can(user.role, 'invoices.read');
  const sites = properties.filter((property) => property.customerId === customer.id);
  const jobs = orders.filter((order) => order.customerId === customer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = jobs.filter(isOpen);
  const late = open.filter(isOverdue).length;
  const files = documentsForCustomer(customer.id, orders, documents);
  const billed = invoices.filter((invoice) => jobs.some((job) => job.id === invoice.workOrderId));
  const outstanding = billed.filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = billed.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <Gate permission="customers.read" title="Customer records are limited" body="Client contact details are not part of dispatch or field work.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6f6a62] hover:text-ink">
          <ArrowLeft size={15} /> Customers
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Account</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[2.1rem] leading-none tracking-tight text-ink">{customer.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${KIND_TONE[customer.kind]}`}>{CUSTOMER_KIND_LABEL[customer.kind]}</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              {customer.region} · customer since {longDate(customer.since)}
            </p>
          </div>
        </header>

        <section className={`grid grid-cols-2 gap-3 ${showMoney ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <Stat label="Properties" value={String(sites.length)} note="Sites on this account" />
          <Stat label="Open jobs" value={String(open.length)} note="Active work" />
          <Stat label="Past due" value={String(late)} note={late ? 'Behind deadline' : 'Nothing late'} warn={late > 0} />
          <Stat label="All-time jobs" value={String(jobs.length)} note="Including closed" />
          {showMoney ? <Stat label="Outstanding" value={money(outstanding)} note={outstanding ? 'Open invoices' : 'Nothing unpaid'} warn={outstanding > 0} /> : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
            <div className="border-b border-[#f0ebe3] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Contacts</h2>
              <p className="mt-0.5 text-[12px] text-[#9a9187]">{showContact ? 'Who to call, and for what.' : 'Hidden for this role.'}</p>
            </div>
            {showContact ? (
              <ul className="divide-y divide-[#f0ebe3]">
                <ContactRow name={customer.contactName} role={customer.contactRole} phone={customer.phone} email={customer.email} primary />
                {customer.contacts.map((contact) => (
                  <ContactRow key={contact.name} name={contact.name} role={contact.role} phone={contact.phone} email={contact.email} />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-[#6f6a62]">Contact details are limited to operations, estimating, and the owner.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
            <div className="border-b border-[#f0ebe3] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Account</h2>
              <p className="mt-0.5 text-[12px] text-[#9a9187]">How work arrives, and how the account is run.</p>
            </div>
            <dl className="space-y-4 px-5 py-4 text-sm">
              <div>
                <dt className="text-[12px] text-[#9a9187]">Work arrives via</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {customer.sources.map((source) => (
                    <span key={source} className="rounded-full bg-[#f3efe6] px-2.5 py-0.5 text-[12px] font-semibold text-[#6f6a62]">
                      {SOURCE_LABEL[source]}
                    </span>
                  ))}
                </dd>
              </div>
              {showMoney ? (
                <>
                  <div>
                    <dt className="text-[12px] text-[#9a9187]">Terms</dt>
                    <dd className="mt-1 text-ink">{customer.terms}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-[#9a9187]">Paid to date</dt>
                    <dd className="mt-1 tabular text-ink">{money(paid)}</dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt className="text-[12px] text-[#9a9187]">Notes</dt>
                <dd className="mt-1 leading-6 text-[#4a443d]">{customer.notes}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
          <div className="border-b border-[#f0ebe3] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Properties</h2>
            <p className="mt-0.5 text-[12px] text-[#9a9187]">Each site keeps its own access notes, hazards, and history.</p>
          </div>
          <ul className="divide-y divide-[#f0ebe3]">
            {sites.map((property) => {
              const count = orders.filter((order) => order.propertyId === property.id && isOpen(order)).length;
              return (
                <li key={property.id}>
                  <Link href={`/properties/${property.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-[#faf8f4]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[#6f6a62]">
                        <Building2 size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{property.name}</p>
                        <p className="truncate text-[13px] text-[#6f6a62]">
                          {property.address}, {property.city}, {property.state} · {PROPERTY_TYPE_LABEL[property.type]}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[12px] font-semibold tabular ${count ? 'text-ink' : 'text-[#9a9187]'}`}>{count} open</span>
                  </Link>
                </li>
              );
            })}
            {sites.length === 0 ? <li className="px-5 py-6 text-sm text-[#9a9187]">No properties on this account.</li> : null}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
          <div className="border-b border-[#f0ebe3] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Work order history</h2>
            <p className="mt-0.5 text-[12px] text-[#9a9187]">Newest first.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#f0ebe3] text-[12px] text-[#8a8278]">
                  <th className="py-3 pl-5 pr-3 font-medium">Job</th>
                  <th className="px-3 py-3 font-medium">Property</th>
                  <th className="px-3 py-3 font-medium">Service</th>
                  <th className="px-3 py-3 font-medium">Assigned</th>
                  <th className="px-3 py-3 font-medium">Due</th>
                  <th className="py-3 pl-3 pr-5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((order) => (
                  <tr key={order.id} className="border-b border-[#f4f0e9] last:border-b-0 hover:bg-[#faf8f4]">
                    <td className="py-3 pl-5 pr-3">
                      <Link href={`/work-orders/${order.id}`} className="font-semibold text-ink hover:text-copper">
                        {order.number}
                      </Link>
                      <div className="text-xs text-muted">{SOURCE_LABEL[order.source]}</div>
                    </td>
                    <td className="px-3 py-3">{propertyById(order.propertyId)?.name}</td>
                    <td className="px-3 py-3">{SERVICE_LABEL[order.service]}</td>
                    <td className="px-3 py-3">{assigneeLabel(order)}</td>
                    <td className={`px-3 py-3 tabular ${isOverdue(order) ? 'font-semibold text-[#9f2d2d]' : ''}`}>{shortDate(order.dueAt)}</td>
                    <td className="py-3 pl-3 pr-5">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-sm text-[#9a9187]">
                      No work orders on this account.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
          <div className="border-b border-[#f0ebe3] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Documents</h2>
            <p className="mt-0.5 text-[12px] text-[#9a9187]">Agreements and requirements for this customer, plus files from its properties and jobs.</p>
          </div>
          <DocumentTable documents={files} />
        </section>
      </div>
    </Gate>
  );
}

function ContactRow({ name, role, phone, email, primary = false }: { name: string; role: string; phone?: string; email?: string; primary?: boolean }) {
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <Avatar name={name} tone="person" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{name}</p>
          {primary ? <span className="rounded-full bg-[#f3efe6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f6a62]">Primary</span> : null}
        </div>
        <p className="text-[13px] text-[#6f6a62]">{role}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#4a443d]">
          {phone ? (
            <span className="inline-flex items-center gap-1.5 tabular">
              <Phone size={13} className="text-[#9a9187]" />
              {phone}
            </span>
          ) : null}
          {email ? (
            <span className="inline-flex items-center gap-1.5 break-all">
              <Mail size={13} className="text-[#9a9187]" />
              {email}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function Stat({ label, value, note, warn = false }: { label: string; value: string; note: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
      <p className="text-[13px] font-medium text-[#6f6a62]">{label}</p>
      <p className={`mt-2 font-display text-3xl leading-none tabular ${warn ? 'text-[#9f2d2d]' : 'text-ink'}`}>{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </div>
  );
}
