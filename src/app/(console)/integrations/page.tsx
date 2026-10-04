'use client';

import { ArrowLeftRight, Plug } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { HandoffNote } from '../../../components/ui/PageHeader';
import { estimates, integrations, invoices } from '../../../lib/seed';

export default function IntegrationsPage() {
  const connector = integrations[0];
  const ready = estimates.length + invoices.length;

  return (
    <Gate permission="integrations.read" title="Integrations are limited" body="Connection settings are owner-only. No credentials are stored in this demo.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Connections</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Integrations</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            JobTread is the only connector in this demo. It is not connected, and no credentials are stored.
          </p>
        </header>

        <HandoffNote>JobTread is listed so money documents have a destination. Nothing here is a live API connection.</HandoffNote>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Connectors" value={integrations.length} note="JobTread only" />
          <Stat label="Not connected" value={1} note="Waiting on credentials" />
          <Stat label="Last sync" value="—" note="Never" />
          <Stat label="Ready to hand off" value={ready} note={`${estimates.length} estimates · ${invoices.length} invoices`} />
        </section>

        {connector ? (
          <article className="max-w-xl rounded-2xl border border-[#ece6dc] bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[12px] font-bold text-[#6f6a62]">JT</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[15px] font-semibold text-ink">{connector.name}</h2>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#efece6] px-2.5 py-1 text-[11px] font-semibold text-[#6f6a62]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b5ada2]" />
                    Not connected
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-[#6f6a62]">{connector.purpose}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[#faf8f5] px-2 py-2">
                <dt className="text-[11px] text-[#9a9187]">Direction</dt>
                <dd className="mt-0.5 flex items-center justify-center gap-1 text-[12px] font-semibold text-ink">
                  <ArrowLeftRight size={12} />
                  Two-way
                </dd>
              </div>
              <div className="rounded-xl bg-[#faf8f5] px-2 py-2">
                <dt className="text-[11px] text-[#9a9187]">Last sync</dt>
                <dd className="mt-0.5 text-[12px] font-semibold text-[#8a8278]">Never</dd>
              </div>
              <div className="rounded-xl bg-[#faf8f5] px-2 py-2">
                <dt className="text-[11px] text-[#9a9187]">Imported</dt>
                <dd className="mt-0.5 text-[12px] font-semibold text-[#8a8278] tabular">0</dd>
              </div>
            </dl>
            <p className="mt-3 text-[13px] leading-5 text-[#6f6a62]">{connector.note}</p>
            <button type="button" disabled className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#f3efe8] text-sm font-semibold text-[#9a9187]">
              <Plug size={15} />
              Waiting on credentials
            </button>
          </article>
        ) : null}
      </div>
    </Gate>
  );
}

function Stat({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
      <p className="text-[13px] font-medium text-[#6f6a62]">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </div>
  );
}
