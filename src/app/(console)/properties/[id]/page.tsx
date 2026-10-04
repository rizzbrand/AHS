'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Gate } from '../../../../components/auth/Gate';
import { DocumentTable } from '../../../../components/documents/DocumentTable';
import { PageHeader, Panel } from '../../../../components/ui/PageHeader';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { useDemo } from '../../../../lib/demo-store';
import { documentsForProperty } from '../../../../lib/documents';
import { shortDate, timeLabel } from '../../../../lib/format';
import { PROPERTY_TYPE_LABEL, SERVICE_LABEL } from '../../../../lib/labels';
import { can } from '../../../../lib/permissions';
import { assigneeLabel, customerName, isOpen, photoCount } from '../../../../lib/records';
import { properties } from '../../../../lib/seed';
import { useSession } from '../../../../lib/session';
import { ServiceType } from '../../../../lib/types';

export default function PropertyProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const { orders, documents } = useDemo();
  const property = properties.find((item) => item.id === params.id);

  if (!user) return null;
  if (!property) {
    return (
      <Gate permission="properties.read" title="Properties are limited" body="Location records are not part of this role.">
        <div className="mx-auto max-w-[1200px]">
          <PageHeader kicker="Properties" title="Property not found" lede="That address is not on file." />
        </div>
      </Gate>
    );
  }

  const showCustomer = can(user.role, 'customers.read');
  const showSiteContact = can(user.role, 'customers.contact') || can(user.role, 'dispatch.read');
  const jobs = orders.filter((order) => order.propertyId === property.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = jobs.filter(isOpen);
  const visits = jobs.map((order) => order.checkedOutAt ?? order.checkedInAt).filter(Boolean) as string[];
  const lastVisit = visits.sort().at(-1);
  const files = documentsForProperty(property.id, orders, documents);
  const byService = jobs.reduce<Partial<Record<ServiceType, number>>>((counts, order) => {
    counts[order.service] = (counts[order.service] ?? 0) + 1;
    return counts;
  }, {});
  const repeats = (Object.entries(byService) as [ServiceType, number][]).filter(([, count]) => count > 1);
  const photographed = jobs.filter((order) => order.photos.some((photo) => photo.done));

  return (
    <Gate permission="properties.read" title="Properties are limited" body="Location records are not part of this role.">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="text-sm">
          <Link href="/properties" className="text-muted hover:text-ink">
            ← Properties
          </Link>
        </div>
        <PageHeader
          kicker={`${PROPERTY_TYPE_LABEL[property.type]} · ${property.state}`}
          title={property.name}
          lede={`${property.address}, ${property.city}, ${property.state} ${property.zip}`}
          actions={
            showCustomer ? (
              <Link href={`/customers/${property.customerId}`} className="border border-line bg-surface px-3 py-1.5 text-sm hover:border-copper/50">
                {customerName(property.customerId)}
              </Link>
            ) : (
              <span className="border border-line bg-surface px-3 py-1.5 text-sm">{customerName(property.customerId)}</span>
            )
          }
        />

        <section className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {[
            { label: 'Open jobs', value: String(open.length) },
            { label: 'All jobs', value: String(jobs.length) },
            { label: 'Last visit', value: lastVisit ? shortDate(lastVisit) : '—' },
            { label: 'Files', value: String(files.length) }
          ].map((item) => (
            <div key={item.label} className="bg-surface px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{item.label}</p>
              <p className="mt-1 font-display text-2xl tabular">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Panel title="Getting on site" lede="Shown to the assigned crew in the field app.">
            <div className="space-y-4 p-4 text-sm">
              <p className="leading-6">{property.accessNotes}</p>
              {property.hazards.length > 0 ? (
                <div className="border border-[#e9c9c3] bg-[#fbefed] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9f2d2d]">Site hazards</p>
                  <ul className="mt-1 list-disc pl-5">
                    {property.hazards.map((hazard) => (
                      <li key={hazard}>{hazard}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted">No hazards on file.</p>
              )}
            </div>
          </Panel>

          <Panel title="Building">
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 p-4 text-sm">
              <dt className="text-muted">Size</dt>
              <dd>{property.size}</dd>
              <dt className="text-muted">Built</dt>
              <dd className="tabular">{property.yearBuilt}</dd>
              <dt className="text-muted">On-site contact</dt>
              <dd>
                {showSiteContact ? (
                  <>
                    {property.siteContact.name}
                    <span className="text-muted"> · {property.siteContact.role}</span>
                    {property.siteContact.phone ? <div className="tabular">{property.siteContact.phone}</div> : null}
                  </>
                ) : (
                  <span className="text-muted">Limited to dispatch and operations</span>
                )}
              </dd>
            </dl>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Panel title="Service history" lede="Every job at this address, newest first.">
            <ol className="divide-y divide-line text-sm">
              {jobs.map((order) => (
                <li key={order.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <Link href={`/work-orders/${order.id}`} className="font-semibold hover:text-copper">
                      {order.number}
                    </Link>
                    <span className="text-muted"> · {SERVICE_LABEL[order.service]}</span>
                    <p className="text-xs text-muted">
                      Opened {shortDate(order.createdAt)} · {assigneeLabel(order)}
                      {order.checkedOutAt ? ` · on site ${timeLabel(order.checkedOutAt)}` : ''}
                    </p>
                    <p className="mt-1 max-w-xl text-xs leading-5">{order.verifiedScope ?? order.scope}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </li>
              ))}
              {jobs.length === 0 ? <li className="px-4 py-6 text-center text-muted">No work orders at this address yet.</li> : null}
            </ol>
          </Panel>

          <div className="space-y-6">
            <Panel title="Repeat issues" lede="The same trade called back more than once.">
              {repeats.length > 0 ? (
                <ul className="divide-y divide-line text-sm">
                  {repeats.map(([service, count]) => (
                    <li key={service} className="flex items-center justify-between px-4 py-2.5">
                      <span>{SERVICE_LABEL[service]}</span>
                      <span className="tabular font-semibold text-copper">{count} jobs</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-4 text-sm text-muted">No repeat calls yet.</p>
              )}
            </Panel>

            <Panel title="Photo record" lede="Photos filed against jobs here.">
              <ul className="divide-y divide-line text-sm">
                {photographed.map((order) => {
                  const count = photoCount(order);
                  return (
                    <li key={order.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <Link href={`/work-orders/${order.id}`} className="font-medium hover:text-copper">
                          {order.number}
                        </Link>
                        <span className="tabular text-muted">
                          {count.done} / {count.total}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {order.photos
                          .filter((photo) => photo.done)
                          .map((photo) => photo.category)
                          .join(' · ')}
                      </p>
                    </li>
                  );
                })}
                {photographed.length === 0 ? <li className="px-4 py-4 text-muted">No photos filed yet.</li> : null}
              </ul>
            </Panel>
          </div>
        </div>

        <Panel title="Documents" lede="Plans, surveys, and inspection or completion files from jobs at this address.">
          <DocumentTable documents={files} />
        </Panel>
      </div>
    </Gate>
  );
}
