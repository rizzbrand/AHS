'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, Camera, Check, ChevronLeft, Clock, KeyRound, Lock, LogIn, LogOut, MapPin, Send } from 'lucide-react';
import { DirectionsLink, ProgressBar, SectionCard, StatePill, isSubmitted } from '../../../components/field/FieldUI';
import { RespondToJob } from '../../../components/field/RespondToJob';
import { useDemo } from '../../../lib/demo-store';
import { clockTime, timeLabel } from '../../../lib/format';
import { SERVICE_LABEL } from '../../../lib/labels';
import { propertyById } from '../../../lib/records';
import { useSession } from '../../../lib/session';
import { checklistFor, documentationGaps, documentationReady, photoProgress } from '../../../lib/workflow';

export default function FieldJobPage() {
  const params = useParams<{ id: string }>();
  const { orders, checkIn, checkOut, toggleCheck, addPhoto, addNote, advance } = useDemo();
  const { user } = useSession();
  const router = useRouter();
  const [note, setNote] = useState('');
  const order = orders.find((item) => item.id === params.id);
  const property = order ? propertyById(order.propertyId) : undefined;

  if (!user) return null;
  if (!order || !property) {
    return <Blocked title="Job not found" body="That job is not on the field board." />;
  }

  const allowed =
    user.role === 'owner' ||
    user.role === 'operations' ||
    user.role === 'dispatcher' ||
    (user.role === 'field' && order.assigneeId === user.personId) ||
    (user.role === 'contractor' && order.contractorId === user.contractorId);

  if (!allowed) {
    return <Blocked title="Not your assignment" body="This job is assigned to someone else." />;
  }

  const photos = photoProgress(order);
  const checklist = checklistFor(order);
  const checksDone = checklist.filter((item) => item.done).length;
  const gaps = documentationGaps(order);
  const ready = documentationReady(order);
  const submitted = isSubmitted(order);
  const canWork =
    user.role === 'owner' ||
    user.role === 'operations' ||
    (user.role === 'field' && order.assigneeId === user.personId) ||
    (user.role === 'contractor' && order.contractorId === user.contractorId);
  const awaitingAnswer = Boolean(order.contractorId && !order.acceptedAt);
  const working = Boolean(order.checkedInAt) && canWork;

  const steps = [
    ...(order.contractorId ? [{ label: 'Accept', done: !awaitingAnswer }] : []),
    { label: 'Check in', done: Boolean(order.checkedInAt) },
    { label: 'Checklist', done: checksDone === checklist.length },
    { label: 'Photos', done: photos.done === photos.total },
    { label: 'Submit', done: submitted }
  ];
  const current = steps.findIndex((step) => !step.done);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-3.5 px-4 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <Link href="/field" className="inline-flex items-center gap-1 rounded-full py-1 pr-2 text-[13px] font-semibold text-[#6f6a62] hover:text-ink">
            <ChevronLeft size={16} /> Today
          </Link>
          <span className="text-[12px] font-medium text-[#9a9187] tabular">{order.number}</span>
        </div>

        <div className="px-1">
          <StatePill order={order} user={user} />
          <h1 className="mt-2 font-display text-[30px] leading-tight text-ink">{SERVICE_LABEL[order.service]}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#6f6a62]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />
              {order.scheduledStart ? timeLabel(order.scheduledStart) : 'Not scheduled yet'}
            </span>
            {order.checkedInAt ? <span>Checked in {clockTime(order.checkedInAt)}</span> : null}
            {order.checkedOutAt ? <span>Out {clockTime(order.checkedOutAt)}</span> : null}
          </p>
        </div>

        <ol className="flex gap-1.5 px-1">
          {steps.map((step, index) => (
            <li key={step.label} className="min-w-0 flex-1">
              <div className={`h-1.5 rounded-full ${step.done ? 'bg-[#2f7a4a]' : index === current ? 'bg-amber' : 'bg-[#e6e0d6]'}`} />
              <p className={`mt-1.5 flex items-center gap-1 truncate text-[11px] font-semibold ${step.done ? 'text-[#2f7a4a]' : index === current ? 'text-ink' : 'text-[#a59d92]'}`}>
                {step.done ? <Check size={11} strokeWidth={3} /> : null}
                {step.label}
              </p>
            </li>
          ))}
        </ol>

        <RespondToJob order={order} user={user} onDeclined={() => router.push('/field')} />

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex items-start gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f3efe8] text-[#6f6a62]">
              <MapPin size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-5 text-ink">{property.name}</p>
              <p className="mt-0.5 text-[13px] text-[#6f6a62]">
                {property.address}, {property.city}, {property.state} {property.zip}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-[#f0ebe3] px-4 py-3 text-[13px] leading-5 text-[#4a453e]">
            <KeyRound size={15} className="mt-0.5 shrink-0 text-[#9a9187]" />
            <p>{property.accessNotes}</p>
          </div>
          {property.hazards.length > 0 ? (
            <div className="mx-4 mb-3 rounded-xl bg-[#fbefed] px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9f2d2d]">
                <AlertTriangle size={13} /> Site hazards
              </p>
              <ul className="mt-1 space-y-0.5 text-[13px] leading-5 text-[#6b2a22]">
                {property.hazards.map((hazard) => (
                  <li key={hazard}>{hazard}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="border-t border-[#f0ebe3] p-3">
            <div className="grid">
              <DirectionsLink property={property} />
            </div>
          </div>
        </section>

        <SectionCard title="Scope of work">
          <p className="text-[14px] leading-6 text-[#2d2924]">{order.verifiedScope ?? order.scope}</p>
        </SectionCard>

        {working ? (
          <>
            <SectionCard
              title="Checklist"
              aside={<span className="text-[12px] font-semibold text-[#6f6a62] tabular">{checksDone}/{checklist.length}</span>}
            >
              <ProgressBar done={checksDone} total={checklist.length} />
              <ul className="mt-3 space-y-2">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleCheck(order.id, item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[14px] transition ${
                        item.done ? 'border-[#cfe3d3] bg-[#f2f8f3] text-[#4a5d4f]' : 'border-[#ece6dc] bg-white text-ink hover:border-[#d9cfc0]'
                      }`}
                    >
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${item.done ? 'border-[#2f7a4a] bg-[#2f7a4a] text-white' : 'border-[#d4cbbd]'}`}>
                        {item.done ? <Check size={13} strokeWidth={3} /> : null}
                      </span>
                      <span className={item.done ? 'line-through decoration-[#9fbfa7]' : ''}>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Required photos" aside={<span className="text-[12px] font-semibold text-[#6f6a62] tabular">{photos.done}/{photos.total}</span>}>
              <div className="grid grid-cols-2 gap-2.5">
                {order.photos.map((photo) =>
                  photo.done ? (
                    <div key={photo.category} className="flex aspect-[4/3] flex-col justify-between rounded-xl bg-gradient-to-br from-[#e3ece4] to-[#cfdfd2] p-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2f7a4a] text-white">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span>
                        <span className="block text-[13px] font-semibold leading-4 text-[#23402b]">{photo.category}</span>
                        <span className="text-[11px] text-[#4f6b56]">In file</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      key={photo.category}
                      type="button"
                      onClick={() => addPhoto(order.id, photo.category, user.name)}
                      className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#ddd3c4] bg-[#faf8f5] p-3 text-center transition hover:border-amber hover:bg-amber/10"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#6f6a62] shadow-sm">
                        <Camera size={16} />
                      </span>
                      <span className="text-[13px] font-semibold leading-4 text-ink">{photo.category}</span>
                      <span className="text-[11px] text-[#9a9187]">Tap to add</span>
                    </button>
                  )
                )}
              </div>
            </SectionCard>

            <SectionCard title="Site notes">
              {order.notes && order.notes.length > 0 ? (
                <ul className="mb-3 space-y-2">
                  {order.notes.map((item) => (
                    <li key={item.id} className="rounded-xl bg-[#f6f3ee] px-3 py-2.5">
                      <p className="text-[11px] text-[#9a9187]">
                        <span className="font-semibold text-[#6f6a62]">{item.author}</span> · {timeLabel(item.at)}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-5 text-ink">{item.body}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              <form
                className="flex items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!note.trim()) return;
                  addNote(order.id, note, user.name);
                  setNote('');
                }}
              >
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="min-w-0 flex-1 resize-none rounded-xl border border-[#e6dfd4] bg-[#faf8f5] px-3 py-2 text-[14px] outline-none focus:border-amber focus:bg-white"
                  placeholder="What you found on site"
                />
                <button type="submit" disabled={!note.trim()} aria-label="Save note" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink text-white disabled:opacity-30">
                  <Send size={16} />
                </button>
              </form>
            </SectionCard>
          </>
        ) : canWork && !awaitingAnswer && !submitted ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#ddd5c8] px-4 py-4 text-[13px] leading-5 text-[#7a746b]">
            <Lock size={16} className="shrink-0" />
            Check in when you arrive to open the checklist ({checklist.length} items) and photos ({photos.total} required).
          </div>
        ) : null}
      </div>

      <ActionBar>
        {awaitingAnswer ? (
          <Hint icon={<Lock size={14} />}>
            {user.role === 'contractor' ? 'Check-in opens once you accept the job.' : 'Waiting on the contractor to accept. Check-in is locked until then.'}
          </Hint>
        ) : !canWork ? (
          <Hint icon={<Lock size={14} />}>View only. Check-in is for the person assigned to this job.</Hint>
        ) : !order.checkedInAt ? (
          <button type="button" onClick={() => checkIn(order.id, user.name)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white">
            <LogIn size={16} /> Check in on site
          </button>
        ) : submitted ? (
          <div className="space-y-2">
            <p className="flex items-center gap-2 rounded-xl bg-[#e5f0e4] px-3 py-2.5 text-[13px] font-medium text-[#1d5a32]">
              <Check size={15} strokeWidth={3} /> Submitted. Operations will review the package.
            </p>
            {!order.checkedOutAt ? (
              <button type="button" onClick={() => checkOut(order.id, user.name)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white">
                <LogOut size={16} /> Check out
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            {!ready ? <p className="text-center text-[12px] text-[#8a847b]">{gaps.join(' · ')}</p> : null}
            <div className={`grid gap-2 ${order.checkedOutAt ? '' : 'grid-cols-[auto_1fr]'}`}>
              {!order.checkedOutAt ? (
                <button type="button" onClick={() => checkOut(order.id, user.name)} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#e2dbd0] bg-white px-4 text-sm font-semibold text-ink">
                  <LogOut size={15} /> Check out
                </button>
              ) : null}
              <button
                type="button"
                disabled={!ready}
                onClick={() => advance(order.id, 'SUBMITTED_FOR_REVIEW', user.role, user.name)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:bg-[#ece7df] disabled:text-[#a59d92]"
              >
                {ready ? <Send size={15} /> : <Lock size={15} />} Submit for review
              </button>
            </div>
          </div>
        )}
      </ActionBar>
    </div>
  );
}

function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="sticky bottom-0 z-10 border-t border-[#ece6dc] bg-white/95 px-4 py-3 backdrop-blur">{children}</div>;
}

function Hint({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-2 py-1.5 text-center text-[13px] text-[#7a746b]">
      {icon}
      {children}
    </p>
  );
}

function Blocked({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ece7df] text-[#6f6a62]">
        <Lock size={18} />
      </span>
      <h1 className="mt-4 font-display text-2xl text-ink">{title}</h1>
      <p className="mt-1 text-sm text-[#7a746b]">{body}</p>
      <Link href="/field" className="mt-5 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white">
        Back to today
      </Link>
    </div>
  );
}
