'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDemo } from '../../lib/demo-store';
import { longDate, timeLabel } from '../../lib/format';
import { ACK_LABEL, ACK_TONE, AckState, ackState, audienceFor, bumpVersion, canEditPlaybook, isDraft, latestAck, personKey, personName } from '../../lib/playbook';
import { useSession } from '../../lib/session';
import { Sop } from '../../lib/types';

export function AckChip({ state }: { state: AckState }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ACK_TONE[state]}`}>{ACK_LABEL[state]}</span>;
}

export function DraftChip() {
  return <span className="inline-block rounded-full bg-[#ece7df] px-2.5 py-0.5 text-[11px] font-semibold text-[#5e574e]">Draft</span>;
}

export function SopBody({ sop, compact = false }: { sop: Sop; compact?: boolean }) {
  return (
    <div className="space-y-6 text-sm">
      <p className={`leading-6 text-ink ${compact ? '' : 'max-w-3xl text-[15px]'}`}>{sop.purpose}</p>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">Procedure</h3>
        <ol className="mt-3 space-y-2">
          {sop.steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl bg-[#faf8f5] px-3 py-2.5 leading-6">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white tabular">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {sop.safety.length > 0 ? (
        <section className="rounded-xl border border-[#e9c9c3] bg-[#fbefed] px-3 py-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9f2d2d]">Safety</h3>
          <ul className="mt-1 list-disc pl-5 leading-6">
            {sop.safety.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={`grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
        <section className="rounded-xl border border-[#f0ebe3] px-3 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">Quality standard</h3>
          <p className="mt-2 leading-6 text-[#4a443d]">{sop.quality}</p>
        </section>
        <section className="rounded-xl border border-[#f0ebe3] px-3 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">When to escalate</h3>
          <p className="mt-2 leading-6 text-[#4a443d]">{sop.escalation}</p>
        </section>
        <section className="rounded-xl border border-[#f0ebe3] px-3 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">Tools</h3>
          <p className="mt-2 text-[#4a443d]">{sop.tools.join(' · ')}</p>
        </section>
        <section className="rounded-xl border border-[#f0ebe3] px-3 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9187]">Common issues</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[#4a443d]">
            {sop.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function SignOffBar({ sop }: { sop: Sop }) {
  const { user } = useSession();
  const { acks, acknowledge } = useDemo();
  if (!user) return null;
  const me = personKey(user);
  if (!me || !sop.audience.includes(user.role)) {
    return <p className="rounded-2xl border border-[#ece6dc] bg-white px-4 py-3 text-sm text-[#6f6a62]">Your role is not asked to sign off on this procedure.</p>;
  }
  const state = ackState(me, sop, acks);
  const last = latestAck(me, sop.id, acks);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 ${state === 'current' ? 'border-[#cfe3d3] bg-[#f2f8f3]' : 'border-amber/50 bg-[#fbf3e8]'}`}>
      <div className="min-w-0 text-sm">
        <AckChip state={state} />
        <p className="mt-1.5 leading-6 text-[#4a443d]">
          {state === 'current'
            ? `You signed off on version ${sop.version} ${timeLabel(last!.at)}.`
            : state === 'outdated'
              ? `You signed version ${last!.version}. Version ${sop.version} changed: ${sop.changelog[0]?.note ?? 'see the change log'}.`
              : `Read the procedure, then confirm you will follow version ${sop.version}.`}
        </p>
      </div>
      {state !== 'current' ? (
        <button type="button" onClick={() => acknowledge(me, sop.id)} className="h-11 shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-black">
          I have read version {sop.version}
        </button>
      ) : null}
    </div>
  );
}

export function SignOffRoster({ sop }: { sop: Sop }) {
  const { acks, contractors } = useDemo();
  const people = audienceFor(sop, contractors);
  const signed = people.filter((person) => ackState(person.id, sop, acks) === 'current').length;

  return (
    <div>
      <p className="border-b border-[#f0ebe3] px-4 py-2.5 text-[12px] text-[#9a9187] tabular">
        {signed} of {people.length} signed off on v{sop.version}
      </p>
      <ul className="divide-y divide-[#f0ebe3] text-sm">
        {people.map((person) => {
          const state = ackState(person.id, sop, acks);
          const last = latestAck(person.id, sop.id, acks);
          return (
            <li key={person.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link href={person.href} className="font-medium text-ink hover:text-copper">
                  {person.name}
                </Link>
                <p className="text-xs text-[#9a9187]">
                  {person.label}
                  {last ? ` · v${last.version} on ${timeLabel(last.at)}` : ''}
                </p>
              </div>
              <AckChip state={state} />
            </li>
          );
        })}
        {people.length === 0 ? <li className="px-4 py-4 text-sm text-[#9a9187]">Nobody is in the audience yet.</li> : null}
      </ul>
    </div>
  );
}

export function Changelog({ sop }: { sop: Sop }) {
  return (
    <ol className="divide-y divide-[#f0ebe3] text-sm">
      {sop.changelog.map((entry) => (
        <li key={`${entry.version}-${entry.at}`} className="px-4 py-3">
          <p>
            <span className="font-semibold text-ink">v{entry.version}</span>
            <span className="text-[#9a9187]">
              {' '}
              · {longDate(entry.at)} · {entry.by}
            </span>
          </p>
          <p className="mt-0.5 text-[13px] leading-5 text-[#6f6a62]">{entry.note}</p>
        </li>
      ))}
    </ol>
  );
}

export function RevisionForm({ sop }: { sop: Sop }) {
  const { user } = useSession();
  const { publishRevision } = useDemo();
  const [note, setNote] = useState('');
  const [step, setStep] = useState('');
  const [done, setDone] = useState<string | null>(null);
  if (!user || !canEditPlaybook(user.role)) return null;
  const next = bumpVersion(sop.version);

  return (
    <form
      className="space-y-3 p-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (publishRevision(sop.id, { note, step }, user.role, user.name)) {
          setDone(`Published v${next}. Everyone who signed an earlier version now needs to re-sign.`);
          setNote('');
          setStep('');
        }
      }}
    >
      <label className="grid gap-1">
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted">What changed</span>
        <input value={note} onChange={(event) => setNote(event.target.value)} required placeholder="Added a step after the Riverbend callback" className="h-10 rounded-full bg-[#f6f3ee] px-4 text-sm outline-none ring-copper/30 focus:ring-2" />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted">New step (optional)</span>
        <input value={step} onChange={(event) => setStep(event.target.value)} placeholder="Appended to the end of the procedure" className="h-10 rounded-full bg-[#f6f3ee] px-4 text-sm outline-none ring-copper/30 focus:ring-2" />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted">
          Publishes v{next}
          {isDraft(sop) && next.startsWith('1.') ? ', taking it out of draft' : ''}. Sign-offs on older versions become outdated.
        </span>
        <button type="submit" className="h-10 rounded-xl bg-ink px-4 font-semibold text-white hover:bg-black">
          Publish revision
        </button>
      </div>
      {done ? <p className="text-xs font-medium text-[#1d5a32]">{done}</p> : null}
    </form>
  );
}

export function SopMeta({ sop }: { sop: Sop }) {
  return (
    <p className="text-xs text-muted">
      {sop.category} · v{sop.version} · updated {longDate(sop.updatedAt)} · maintained by {personName(sop.ownerId)}
    </p>
  );
}
