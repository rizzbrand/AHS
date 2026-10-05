'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, PlayCircle, Workflow } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { HandoffNote } from '../../../components/ui/PageHeader';
import { automations } from '../../../lib/seed';
import { AutomationRule } from '../../../lib/types';

type ViewId = 'all' | AutomationRule['state'];

const STATE: Record<AutomationRule['state'], { label: string; tone: string }> = {
  active_in_demo: { label: 'Visible in the demo', tone: 'bg-[#e5f0e4] text-[#1d5a32]' },
  designed: { label: 'Designed, not running', tone: 'bg-[#f8ecd4] text-[#7a4e08]' }
};

export default function AutomationsPage() {
  const [view, setView] = useState<ViewId>('all');
  const live = automations.filter((rule) => rule.state === 'active_in_demo');
  const designed = automations.filter((rule) => rule.state === 'designed');
  const list = useMemo(() => automations.filter((rule) => view === 'all' || rule.state === view), [view]);

  return (
    <Gate permission="automations.read" title="Automations are limited" body="Workflow rules are managed by operations and the owner.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Rules</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Automations</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">The operating rules the company wants the platform to enforce. They are designed here before they run on their own.</p>
        </header>

        <HandoffNote>The photo rule is reflected in the work-order record. The other rules are specified, not executing.</HandoffNote>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={<Workflow size={16} />} label="Rules on file" value={automations.length} note="Specified for this company" active={view === 'all'} onClick={() => setView('all')} />
          <Stat icon={<PlayCircle size={16} />} label="Visible in the demo" value={live.length} note="You can see this rule on jobs" active={view === 'active_in_demo'} onClick={() => setView('active_in_demo')} />
          <Stat icon={<Workflow size={16} />} label="Designed only" value={designed.length} note="Not executing yet" active={view === 'designed'} onClick={() => setView('designed')} />
        </section>

        <nav aria-label="Rule views" className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'All rules', count: automations.length },
              { id: 'active_in_demo', label: 'Visible in the demo', count: live.length },
              { id: 'designed', label: 'Designed', count: designed.length }
            ] as const
          ).map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-pressed={active}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm transition ${
                  active ? 'bg-ink font-semibold text-white' : 'border border-[#ece6dc] bg-white text-[#4a443d] hover:border-[#cfc6b8] hover:text-ink'
                }`}
              >
                {item.label}
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular leading-none ${active ? 'bg-white/15 text-white' : 'bg-[#f3efe6] text-muted'}`}>{item.count}</span>
              </button>
            );
          })}
        </nav>

        <div className="grid gap-4">
          {list.map((rule) => (
            <article key={rule.id} className="rounded-2xl border border-[#ece6dc] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">{rule.name}</h2>
                  <p className="mt-1 text-sm text-[#6f6a62]">
                    <span className="font-semibold text-ink">When </span>
                    {rule.when}
                  </p>
                </div>
                <StateChip state={rule.state} />
              </div>
              <ol className="mt-4 space-y-2">
                {rule.then.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-xl bg-[#faf8f5] px-3 py-2.5 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[11px] font-semibold text-ink ring-1 ring-[#ece6dc]">{index + 1}</span>
                    <span className="pt-0.5 text-[#4a443d]">
                      <span className="font-semibold text-ink">Then </span>
                      {step}
                    </span>
                    {index < rule.then.length - 1 ? <ArrowRight size={14} className="mt-1.5 hidden shrink-0 text-[#c9c1b5] sm:block" /> : null}
                  </li>
                ))}
              </ol>
              {rule.state === 'designed' ? <p className="mt-3 text-[12px] text-[#8a8278]">This rule is specified for the operating model. It is not firing in the demo.</p> : <p className="mt-3 text-[12px] text-[#2f7a4a]">You can see this on a job: submission stays locked until the required photos are in file.</p>}
            </article>
          ))}
        </div>
      </div>
    </Gate>
  );
}

function StateChip({ state }: { state: AutomationRule['state'] }) {
  const tone = STATE[state];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {tone.label}
    </span>
  );
}

function Stat({ icon, label, value, note, active, onClick }: { icon: React.ReactNode; label: string; value: number; note: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-white p-4 text-left transition ${active ? 'border-ink ring-1 ring-ink' : 'border-[#ece6dc] hover:border-[#d9cfc0] hover:shadow-sm'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6f6a62]">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f3efe8] text-[#6f6a62]">{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 text-[12px] text-[#9a9187]">{note}</p>
    </button>
  );
}
