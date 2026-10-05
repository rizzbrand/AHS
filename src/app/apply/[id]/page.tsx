'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { OnboardingStepper } from '../../../components/workforce/Compliance';
import { rememberApplicant } from '../../../lib/applicant';
import { REQUIRED_PAPERS, complianceGaps, documentsFor } from '../../../lib/compliance';
import { useDemo } from '../../../lib/demo-store';
import { TODAY, shortDate } from '../../../lib/format';
import { CONTRACTOR_STATUS_LABEL, SERVICE_LABEL } from '../../../lib/labels';
import { JobDocument } from '../../../lib/types';

export default function ApplicationStatusPage() {
  const params = useParams<{ id: string }>();
  const { contractors, documents, recordDocument } = useDemo();
  const contractor = contractors.find((item) => item.id === params.id);
  const [category, setCategory] = useState<JobDocument['category']>('license');
  const [name, setName] = useState('');
  const [expires, setExpires] = useState('2027-10-20');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (contractor) rememberApplicant(contractor.id);
  }, [contractor]);

  if (!contractor) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9187]">Application</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Not on file</h1>
        <p className="mt-3 text-sm leading-6 text-muted">That application is not in this demo session. Start a new one, or look it up by email.</p>
        <Link href="/apply" className="mt-6 text-sm font-semibold text-ink">
          ← Contractor application
        </Link>
      </main>
    );
  }

  const files = documentsFor(contractor.id, documents);
  const gaps = complianceGaps(contractor.id, documents);
  const papersReady = gaps.length === 0;
  const waiting = contractor.status !== 'active';
  const applicant = contractor;

  function record(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setMessage('Name the document so operations can tell what it is.');
      return;
    }
    recordDocument({ relatedId: applicant.id, related: applicant.company, category, name, expiresAt: expires }, applicant.contactName);
    setName('');
    setMessage(`${category === 'license' ? 'License' : category === 'insurance' ? 'Insurance' : 'Certification'} recorded. Expires ${shortDate(expires)}.`);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/apply" className="text-[13px] text-[#9a9187] hover:text-ink">
            ← Application
          </Link>
          <Link href="/" className="text-[13px] text-[#9a9187] hover:text-ink">
            Home
          </Link>
        </div>

        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Contractor onboarding</p>
        <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">{contractor.company}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {contractor.contactName} · {contractor.serviceArea}. Now {CONTRACTOR_STATUS_LABEL[contractor.status].toLowerCase()}.
          {waiting ? ' You will not see job offers until operations activates the company.' : ' You are eligible for assignment once a dispatcher offers a job.'}
        </p>

        <section className="mt-8 rounded-2xl border border-[#ece6dc] bg-[#fbf9f5] p-5">
          <OnboardingStepper status={contractor.status} />
          <p className="mt-4 text-sm leading-6 text-[#5e574e]">
            {papersReady
              ? 'Required license and insurance are on file. Operations can move you through review.'
              : 'Upload a contractor license and general liability insurance. Operations cannot approve you without both.'}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#ece6dc] p-5">
          <h2 className="text-sm font-semibold text-ink">Required papers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {REQUIRED_PAPERS.map((paper) => {
              const onFile = files.some((file) => file.category === paper.category && file.expiresAt && file.expiresAt >= TODAY);
              return (
                <li key={paper.category} className="flex items-center justify-between gap-3">
                  <span>{paper.label}</span>
                  <span className={onFile ? 'font-semibold text-[#1d5a32]' : 'text-[#9a9187]'}>{onFile ? 'On file' : 'Needed'}</span>
                </li>
              );
            })}
          </ul>
          {files.length > 0 ? (
            <ul className="mt-4 divide-y divide-[#f0ebe3] border-t border-[#f0ebe3] text-sm">
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="shrink-0 text-[12px] text-muted">
                    {file.category} · {file.expiresAt ? shortDate(file.expiresAt) : 'No expiry'}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {waiting ? (
            <form onSubmit={record} className="mt-4 grid gap-3 border-t border-[#f0ebe3] pt-4 sm:grid-cols-[140px_1fr_140px_auto]">
              <label className="grid gap-1">
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Type</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as JobDocument['category'])} className="h-10 rounded-xl border border-[#ece6dc] bg-[#fbf9f5] px-2 text-sm">
                  <option value="license">License</option>
                  <option value="insurance">Insurance</option>
                  <option value="certification">Certification</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="VA Class B, COI 2026–27" className="h-10 rounded-xl border border-[#ece6dc] bg-[#fbf9f5] px-3 text-sm" />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Expires</span>
                <input type="date" value={expires} min={TODAY} onChange={(event) => setExpires(event.target.value)} className="h-10 rounded-xl border border-[#ece6dc] bg-[#fbf9f5] px-2 text-sm" />
              </label>
              <button type="submit" className="h-10 self-end rounded-full bg-ink px-4 text-sm font-semibold text-white">
                Record
              </button>
            </form>
          ) : null}
          {message ? <p className="mt-3 text-sm font-medium text-[#1d5a32]">{message}</p> : null}
          <p className="mt-3 text-xs leading-5 text-muted">Demo only: the name and expiry are stored in this browser session. No file is uploaded to a server.</p>
        </section>

        <p className="mt-8 text-sm text-muted">
          Trades: {contractor.trades.map((trade) => SERVICE_LABEL[trade]).join(' · ')}
        </p>
      </div>
    </main>
  );
}
