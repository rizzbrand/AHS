'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { rememberedApplicant, rememberApplicant } from '../../lib/applicant';
import { useDemo } from '../../lib/demo-store';
import { SERVICE_LABEL } from '../../lib/labels';
import { company } from '../../lib/seed';
import { ServiceType } from '../../lib/types';

const TRADES = Object.keys(SERVICE_LABEL) as ServiceType[];

export default function ApplyPage() {
  const router = useRouter();
  const { applyContractor, contractors } = useDemo();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [notes, setNotes] = useState('');
  const [trades, setTrades] = useState<ServiceType[]>([]);
  const [lookup, setLookup] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  useEffect(() => {
    const saved = rememberedApplicant();
    if (saved && contractors.some((item) => item.id === saved)) setResumeId(saved);
  }, [contractors]);

  function toggleTrade(trade: ServiceType) {
    setTrades((current) => (current.includes(trade) ? current.filter((item) => item !== trade) : [...current, trade]));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = applyContractor({
      company: companyName,
      contactName,
      phone,
      email,
      trades,
      serviceArea,
      notes
    });
    if (!result.ok || !result.contractorId) {
      setError(result.ok ? 'Could not save the application' : result.reason);
      return;
    }
    rememberApplicant(result.contractorId);
    router.push(`/apply/${result.contractorId}`);
  }

  function resume(event: FormEvent) {
    event.preventDefault();
    const match = contractors.find((item) => item.email.toLowerCase() === lookup.trim().toLowerCase());
    if (!match) {
      setError('No application is on file for that email.');
      return;
    }
    rememberApplicant(match.id);
    router.push(`/apply/${match.id}`);
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <section className="relative h-[22vh] overflow-hidden bg-[#111] lg:h-auto">
        <img src="/ahs.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/25" />
        <div className="absolute left-6 top-6 flex items-center gap-2.5 text-white sm:left-8 sm:top-8">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[10px] font-bold text-ink">AH</span>
          <span className="max-w-[70%] text-[11px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.22em]">Assign Home Solutions</span>
        </div>
        <div className="absolute bottom-5 left-5 max-w-[calc(100%-2.5rem)] text-white sm:bottom-8 sm:left-8 sm:max-w-sm">
          <p className="font-display text-2xl tracking-tight">Join the contractor roster</p>
          <p className="mt-1 text-sm text-white/70">License and insurance come next. Dispatch opens after operations approves you.</p>
        </div>
      </section>

      <section className="flex flex-col justify-between overflow-y-auto px-6 py-8 sm:px-12 lg:px-16 lg:py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-ink">{company.name}</p>
            <p className="mt-0.5 text-[12px] text-[#9a9187]">Contractor application</p>
          </div>
          <Link href="/" className="text-[13px] text-[#9a9187] hover:text-ink">
            Back
          </Link>
        </header>

        {resumeId ? (
          <Link
            href={`/apply/${resumeId}`}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-ink px-5 text-sm font-semibold text-white"
          >
            Continue your application
            <ArrowRight size={14} />
          </Link>
        ) : null}

        <form onSubmit={submit} className="mt-8 space-y-5">
          <h1 className="font-display text-[2rem] font-medium leading-none tracking-tight text-ink">Apply to take work</h1>
          <p className="max-w-md text-sm leading-6 text-[#8a8278]">
            This is a demo application. Nothing is emailed, and Assign Home still has to review you before jobs are offered.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" value={companyName} onChange={setCompanyName} placeholder="Ortega Building Co." required />
            <Field label="Primary contact" value={contactName} onChange={setContactName} placeholder="Luis Ortega" required />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="(571) 555-0142" required />
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@company.example" type="email" required />
            <div className="sm:col-span-2">
              <Field label="Service area" value={serviceArea} onChange={setServiceArea} placeholder="Arlington, Falls Church, DC" required />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">Trades</legend>
            <div className="flex flex-wrap gap-2">
              {TRADES.map((trade) => {
                const on = trades.includes(trade);
                return (
                  <button
                    key={trade}
                    type="button"
                    onClick={() => toggleTrade(trade)}
                    className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                      on ? 'bg-ink text-white' : 'bg-[#f4f0ea] text-[#5e574e] hover:bg-[#ece6dc]'
                    }`}
                  >
                    {SERVICE_LABEL[trade]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Certifications, crew size, or the work you want first."
              className="rounded-xl border border-[#ece6dc] bg-[#fbf9f5] px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
            />
          </label>

          {error ? <p className="text-sm font-medium text-[#9f2d2d]">{error}</p> : null}

          <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white">
            Submit application
            <ArrowRight size={14} />
          </button>
        </form>

        <form onSubmit={resume} className="mt-10 border-t border-[#f0ebe3] pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">Already applied</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
              type="email"
              placeholder="Email on the application"
              className="h-11 min-w-[220px] flex-1 rounded-full border border-[#ece6dc] bg-[#fbf9f5] px-4 text-sm outline-none focus:border-ink"
            />
            <button type="submit" className="h-11 rounded-full border border-ink px-4 text-sm font-semibold text-ink">
              Open status
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        className="h-11 rounded-xl border border-[#ece6dc] bg-[#fbf9f5] px-3 text-sm text-ink outline-none focus:border-ink"
      />
    </label>
  );
}
