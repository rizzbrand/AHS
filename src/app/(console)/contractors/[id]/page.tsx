'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Gate } from '../../../../components/auth/Gate';
import { PageHeader, Panel } from '../../../../components/ui/PageHeader';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { DocChip, OnboardingStepper } from '../../../../components/workforce/Compliance';
import {
  canManageOnboarding,
  complianceGaps,
  complianceWarnings,
  docState,
  docStateLabel,
  documentsFor,
  eligibleForWork,
  nextStage,
  stageBlockers,
  stageMoveLabel
} from '../../../../lib/compliance';
import { useDemo } from '../../../../lib/demo-store';
import { TODAY, shortDate, timeLabel } from '../../../../lib/format';
import { CONTRACTOR_STATUS_LABEL, SERVICE_LABEL } from '../../../../lib/labels';
import { isOpen, propertyById } from '../../../../lib/records';
import { useSession } from '../../../../lib/session';
import { JobDocument } from '../../../../lib/types';

const CATEGORY_LABEL: Partial<Record<JobDocument['category'], string>> = {
  license: 'License',
  insurance: 'Insurance',
  certification: 'Certification'
};

export default function ContractorProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const { contractors, documents, orders, advanceContractor, recordDocument } = useDemo();
  const [message, setMessage] = useState<{ tone: 'ok' | 'risk'; text: string } | null>(null);
  const [category, setCategory] = useState<JobDocument['category']>('insurance');
  const [name, setName] = useState('');
  const [expires, setExpires] = useState('2027-10-20');

  const contractor = contractors.find((item) => item.id === params.id);

  if (!user) return null;

  if (!contractor) {
    return (
      <Gate permission="contractors.read" title="Contractors are limited" body="The contractor directory is for dispatch and operations.">
        <div className="mx-auto max-w-[1200px]">
          <PageHeader kicker="Contractors" title="Contractor not found" lede="That record is not in the directory." />
        </div>
      </Gate>
    );
  }

  const files = documentsFor(contractor.id, documents);
  const gaps = complianceGaps(contractor.id, documents);
  const warnings = complianceWarnings(contractor.id, documents);
  const blockers = stageBlockers(contractor, documents);
  const next = nextStage(contractor.status);
  const manage = canManageOnboarding(user.role);
  const eligible = eligibleForWork(contractor, documents);
  const jobs = orders.filter((order) => order.contractorId === contractor.id);
  const open = jobs.filter(isOpen);
  const done = jobs.filter((order) => !isOpen(order));
  const waiting = open.filter((order) => !order.acceptedAt);

  function move() {
    const result = advanceContractor(contractor!.id, user!.role, user!.name);
    setMessage(result.ok ? { tone: 'ok', text: `Moved to ${CONTRACTOR_STATUS_LABEL[next!]}.` } : { tone: 'risk', text: result.reason });
  }

  function record(event: React.FormEvent) {
    event.preventDefault();
    recordDocument({ relatedId: contractor!.id, related: contractor!.company, category, name, expiresAt: expires }, user!.name);
    setName('');
    setMessage({ tone: 'ok', text: `${CATEGORY_LABEL[category]} recorded. Expires ${shortDate(expires)}.` });
  }

  return (
    <Gate permission="contractors.read" title="Contractors are limited" body="The contractor directory is for dispatch and operations.">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="text-sm">
          <Link href="/contractors" className="text-muted hover:text-ink">
            ← All contractors
          </Link>
        </div>
        <PageHeader
          kicker={contractor.trades.map((trade) => SERVICE_LABEL[trade]).join(' · ')}
          title={contractor.company}
          lede={`${contractor.contactName} · ${contractor.serviceArea}`}
          actions={
            <span className={`px-2.5 py-1 text-xs font-semibold ${eligible ? 'bg-[#e5f0e4] text-[#1d5a32]' : 'bg-[#ece7df] text-[#5e574e]'}`}>
              {eligible ? 'Eligible for dispatch' : 'Not eligible for dispatch'}
            </span>
          }
        />

        <Panel
          title="Onboarding"
          lede="Application, review, document verification, approval, then active. A contractor cannot be approved while required paperwork is missing, expired, or inside 30 days of expiry."
          action={
            next && manage ? (
              <button
                type="button"
                onClick={move}
                disabled={blockers.length > 0}
                className="whitespace-nowrap bg-forest px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                {stageMoveLabel(contractor.status)}
              </button>
            ) : null
          }
        >
          <div className="space-y-4 p-4">
            <OnboardingStepper status={contractor.status} />
            {next && blockers.length > 0 ? (
              <div className="border border-[#e9c9c3] bg-[#fbefed] px-3 py-2 text-sm">
                <p className="font-semibold text-[#9f2d2d]">Blocked from {CONTRACTOR_STATUS_LABEL[next]}</p>
                <ul className="mt-1 list-disc pl-5 text-ink">
                  {blockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!next && warnings.length > 0 ? (
              <p className="border border-[#ecd9b4] bg-[#fbf3e3] px-3 py-2 text-sm">{warnings.join('. ')}. Renew before it lapses or dispatch will stop.</p>
            ) : null}
            {next && !manage ? <p className="text-xs text-muted">Stage changes are made by the owner or operations.</p> : null}
            {message ? (
              <p className={`text-sm font-medium ${message.tone === 'ok' ? 'text-[#1d5a32]' : 'text-[#9f2d2d]'}`}>{message.text}</p>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Panel title="Contact and internal notes" lede="Internal to Assign Home. Not shared with customers.">
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 p-4 text-sm">
              <dt className="text-muted">Contact</dt>
              <dd>{contractor.contactName}</dd>
              <dt className="text-muted">Phone</dt>
              <dd className="tabular">{contractor.phone}</dd>
              <dt className="text-muted">Email</dt>
              <dd className="break-all">{contractor.email}</dd>
              <dt className="text-muted">Service area</dt>
              <dd>{contractor.serviceArea}</dd>
              <dt className="text-muted">Availability</dt>
              <dd>{contractor.availability}</dd>
              <dt className="text-muted">Verification</dt>
              <dd className="capitalize">{contractor.verification.replace('_', ' ')}</dd>
              <dt className="text-muted">Notes</dt>
              <dd className="leading-6">{contractor.notes}</dd>
            </dl>
          </Panel>

          <Panel title="Performance" lede="Internal rating. Contractors do not see this.">
            <div className="grid grid-cols-2 gap-px bg-line">
              {[
                { label: 'Jobs completed', value: String(contractor.jobsCompleted) },
                { label: 'Internal rating', value: contractor.rating ? `${contractor.rating.toFixed(1)} / 5` : '—' },
                { label: 'On-time arrival', value: contractor.onTimeRate ? `${contractor.onTimeRate}%` : '—' },
                { label: 'Photo compliance', value: contractor.docCompliance ? `${contractor.docCompliance}%` : '—' },
                { label: 'Open jobs', value: String(open.length) },
                { label: 'Awaiting acceptance', value: String(waiting.length) }
              ].map((item) => (
                <div key={item.label} className="bg-surface px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{item.label}</p>
                  <p className="mt-1 font-display text-2xl tabular">{item.value}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Licenses, insurance, and certifications" lede={gaps.length > 0 ? gaps.join('. ') : 'Required license and insurance are on file.'}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f3efe6] text-[11px] uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-2 font-semibold">Document</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold">Expires</th>
                  <th className="px-4 py-2 font-semibold">State</th>
                  <th className="px-4 py-2 font-semibold">Version</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-medium">{file.name}</td>
                    <td className="px-4 py-2.5 capitalize">{file.category}</td>
                    <td className="px-4 py-2.5 tabular">{file.expiresAt ? shortDate(file.expiresAt) : '—'}</td>
                    <td className="px-4 py-2.5">
                      <DocChip state={docState(file)} label={docStateLabel(file)} />
                    </td>
                    <td className="px-4 py-2.5 tabular text-muted">
                      v{file.version} · {shortDate(file.updatedAt)}
                    </td>
                  </tr>
                ))}
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      Nothing on file yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {manage ? (
            <form onSubmit={record} className="flex flex-wrap items-end gap-3 border-t border-line bg-[#f7f3ec] px-4 py-3 text-sm">
              <label className="grid gap-1">
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Type</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as JobDocument['category'])} className="border border-line bg-surface px-2 py-1.5">
                  <option value="insurance">Insurance</option>
                  <option value="license">License</option>
                  <option value="certification">Certification</option>
                </select>
              </label>
              <label className="grid min-w-[220px] flex-1 gap-1">
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Certificate of insurance, 2026–27" className="border border-line bg-surface px-2 py-1.5" />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Expires</span>
                <input type="date" value={expires} min={TODAY} onChange={(event) => setExpires(event.target.value)} className="border border-line bg-surface px-2 py-1.5" />
              </label>
              <button type="submit" className="bg-forest px-3 py-1.5 font-semibold text-white">
                Record document
              </button>
              <p className="w-full text-xs text-muted">Recording replaces the current file of that type and bumps its version. Demo only: no file is uploaded.</p>
            </form>
          ) : null}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Panel title="Job history" lede="Jobs assigned through this platform.">
            <ul className="divide-y divide-line text-sm">
              {[...open, ...done].map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div>
                    <Link href={`/work-orders/${order.id}`} className="font-semibold hover:text-copper">
                      {order.number}
                    </Link>
                    <span className="text-muted"> · {propertyById(order.propertyId)?.name}</span>
                    {order.contractorId && !order.acceptedAt && isOpen(order) ? (
                      <span className="ml-2 bg-[#f8ecd4] px-1.5 py-0.5 text-[11px] font-semibold text-[#7a4e08]">Not accepted</span>
                    ) : null}
                  </div>
                  <StatusBadge status={order.status} />
                </li>
              ))}
              {jobs.length === 0 ? <li className="px-4 py-6 text-center text-muted">No platform jobs yet. Earlier work predates this system.</li> : null}
            </ul>
          </Panel>

          <Panel title="Activity" lede="Stage changes, paperwork, and job responses.">
            <ol className="divide-y divide-line text-sm">
              {[...contractor.history].reverse().map((entry) => (
                <li key={entry.id} className="px-4 py-2.5">
                  <p>
                    <span className="font-semibold">{entry.action}</span>
                    <span className="text-muted"> · {entry.detail}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {entry.actor} · {timeLabel(entry.at)}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </Gate>
  );
}
