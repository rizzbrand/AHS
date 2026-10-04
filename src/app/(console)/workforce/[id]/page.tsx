'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Gate } from '../../../../components/auth/Gate';
import { PageHeader, Panel } from '../../../../components/ui/PageHeader';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { DocChip } from '../../../../components/workforce/Compliance';
import { docState, docStateLabel, documentsFor } from '../../../../lib/compliance';
import { useDemo } from '../../../../lib/demo-store';
import { TODAY, clockTime, longDate, shortDate } from '../../../../lib/format';
import { ROLE_LABEL, SERVICE_LABEL } from '../../../../lib/labels';
import { isOpen, isOverdue, propertyById } from '../../../../lib/records';
import { AckChip } from '../../../../components/playbook/Sop';
import { ackState, requiredSops } from '../../../../lib/playbook';
import { employees } from '../../../../lib/seed';

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const { orders, documents, sops, acks } = useDemo();
  const employee = employees.find((item) => item.id === params.id);

  if (!employee) {
    return (
      <Gate permission="workforce.read" title="Workforce is limited" body="Employee records are for dispatch and operations.">
        <div className="mx-auto max-w-[1200px]">
          <PageHeader kicker="Workforce" title="Person not found" lede="That record is not on the payroll list." />
        </div>
      </Gate>
    );
  }

  const mine = orders.filter((order) => order.assigneeId === employee.id);
  const open = mine.filter(isOpen).sort((a, b) => (a.scheduledStart ?? a.dueAt).localeCompare(b.scheduledStart ?? b.dueAt));
  const today = open.filter((order) => order.scheduledStart?.startsWith(TODAY));
  const closed = mine.filter((order) => !isOpen(order));
  const overdue = open.filter(isOverdue).length;
  const certs = documentsFor(employee.id, documents);
  const training = requiredSops(employee.role, sops).map((sop) => ({ sop, state: ackState(employee.id, sop, acks) }));
  const scheduledHours = today.reduce((sum, order) => {
    if (!order.scheduledStart || !order.scheduledEnd) return sum;
    const [sh, sm] = order.scheduledStart.split('T')[1].split(':').map(Number);
    const [eh, em] = order.scheduledEnd.split('T')[1].split(':').map(Number);
    return sum + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);

  return (
    <Gate permission="workforce.read" title="Workforce is limited" body="Employee records are for dispatch and operations.">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="text-sm">
          <Link href="/workforce" className="text-muted hover:text-ink">
            ← Workforce
          </Link>
        </div>
        <PageHeader
          kicker={ROLE_LABEL[employee.role]}
          title={employee.name}
          lede={`${employee.title} · based in ${employee.base} · with Assign Home since ${longDate(employee.startedAt)}`}
          actions={
            <span className="bg-[#ece7df] px-2.5 py-1 text-xs font-semibold text-[#5e574e]">
              {employee.status === 'on_job' ? 'On a job' : employee.status === 'off' ? 'Off today' : 'Available'}
            </span>
          }
        />

        <section className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {[
            { label: 'Jobs today', value: String(today.length) },
            { label: 'Hours booked today', value: scheduledHours ? `${scheduledHours}h` : '0h' },
            { label: 'Open assignments', value: String(open.length) },
            { label: 'Past due', value: String(overdue) }
          ].map((item) => (
            <div key={item.label} className="bg-surface px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{item.label}</p>
              <p className="mt-1 font-display text-2xl tabular">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Panel title="Workload" lede="Open assignments, soonest first.">
            <ul className="divide-y divide-line text-sm">
              {open.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div>
                    <Link href={`/work-orders/${order.id}`} className="font-semibold hover:text-copper">
                      {order.number}
                    </Link>
                    <span className="text-muted">
                      {' '}
                      · {SERVICE_LABEL[order.service]} · {propertyById(order.propertyId)?.city}
                    </span>
                    <p className="text-xs text-muted">
                      {order.scheduledStart ? `${shortDate(order.scheduledStart)} ${clockTime(order.scheduledStart)}` : 'Not scheduled'} · due {shortDate(order.dueAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </li>
              ))}
              {open.length === 0 ? <li className="px-4 py-6 text-center text-muted">No open assignments.</li> : null}
            </ul>
          </Panel>

          <div className="space-y-6">
            <Panel title="Contact" lede="Internal only.">
              <dl className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2 p-4 text-sm">
                <dt className="text-muted">Phone</dt>
                <dd className="tabular">{employee.phone}</dd>
                <dt className="text-muted">Base</dt>
                <dd>{employee.base}</dd>
              </dl>
            </Panel>

            <Panel title="Certifications">
              <ul className="divide-y divide-line text-sm">
                {certs.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <span>{file.name}</span>
                    <DocChip state={docState(file)} label={docStateLabel(file)} />
                  </li>
                ))}
                {certs.length === 0 ? <li className="px-4 py-4 text-muted">No certifications on file.</li> : null}
              </ul>
            </Panel>
          </div>
        </div>

        <Panel title="Required playbook training" lede={`What a ${ROLE_LABEL[employee.role].toLowerCase()} must read and sign off on before working unsupervised.`}>
          <ul className="divide-y divide-line text-sm">
            {training.map(({ sop, state }) => (
              <li key={sop.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <div>
                  <Link href={`/playbook/${sop.id}`} className="font-medium hover:text-copper">
                    {sop.title}
                  </Link>
                  <span className="text-muted"> · v{sop.version}</span>
                </div>
                <AckChip state={state} />
              </li>
            ))}
            {training.length === 0 ? <li className="px-4 py-4 text-muted">No required training for this role.</li> : null}
          </ul>
        </Panel>

        {closed.length > 0 ? (
          <Panel title="Recent completed work">
            <ul className="divide-y divide-line text-sm">
              {closed.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <Link href={`/work-orders/${order.id}`} className="font-semibold hover:text-copper">
                    {order.number} <span className="font-normal text-muted">· {propertyById(order.propertyId)?.name}</span>
                  </Link>
                  <StatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </Gate>
  );
}
