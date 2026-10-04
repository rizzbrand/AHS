'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useDemo } from '../../lib/demo-store';
import { SessionUser, WorkOrder } from '../../lib/types';

const REASONS = ['Crew is booked that day', 'Outside our service area', 'Not our trade', 'Scope needs a site visit first'];

export function RespondToJob({ order, user, onDeclined }: { order: WorkOrder; user: SessionUser; onDeclined?: () => void }) {
  const { respondToAssignment } = useDemo();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  if (!user.contractorId || order.contractorId !== user.contractorId || order.acceptedAt) return null;

  return (
    <div className="rounded-2xl border border-copper/30 bg-copper-soft p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper">Can you take this job?</p>
      <p className="mt-1 text-[13px] leading-5 text-[#5e4a3c]">Accept to unlock check-in, or decline so dispatch can reassign it.</p>
      {declining ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold text-[#7a6a5c]" htmlFor={`reason-${order.id}`}>
            Why are you declining?
          </label>
          <select
            id={`reason-${order.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#e2d3c5] bg-white px-3 text-sm outline-none focus:border-copper"
          >
            {REASONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDeclining(false)} className="h-11 rounded-xl border border-[#e2d3c5] bg-white text-sm font-semibold">
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (respondToAssignment(order.id, user.contractorId!, false, user.name, reason)) onDeclined?.();
              }}
              className="h-11 rounded-xl bg-[#9f2d2d] text-sm font-semibold text-white"
            >
              Decline job
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDeclining(true)} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#e2d3c5] bg-white text-sm font-semibold">
            <X size={15} /> Decline
          </button>
          <button
            type="button"
            onClick={() => respondToAssignment(order.id, user.contractorId!, true, user.name)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-ink text-sm font-semibold text-white"
          >
            <Check size={15} /> Accept job
          </button>
        </div>
      )}
    </div>
  );
}
