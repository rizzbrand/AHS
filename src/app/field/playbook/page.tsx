'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import { ProgressBar } from '../../../components/field/FieldUI';
import { AckChip } from '../../../components/playbook/Sop';
import { useDemo } from '../../../lib/demo-store';
import { ackState, personKey, requiredSops } from '../../../lib/playbook';
import { useSession } from '../../../lib/session';

export default function FieldPlaybookPage() {
  const { user } = useSession();
  const { sops, acks } = useDemo();
  if (!user) return null;
  const me = personKey(user);
  const mine = requiredSops(user.role, sops);
  const pending = me ? mine.filter((sop) => ackState(me, sop, acks) !== 'current') : [];
  const done = mine.filter((sop) => !pending.includes(sop));

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <div className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9187]">Playbook</p>
        <h1 className="mt-1 font-display text-[30px] leading-tight text-ink">How we work</h1>
        <p className="mt-1 text-sm leading-6 text-[#6f6a62]">The procedures that apply to your jobs. When one changes, you will be asked to read it again.</p>
      </div>

      {mine.length > 0 ? (
        <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-ink">
              {done.length} of {mine.length} signed off
            </p>
            <p className={`text-[12px] font-semibold ${pending.length ? 'text-copper' : 'text-[#2f7a4a]'}`}>
              {pending.length ? `${pending.length} to read` : 'All current'}
            </p>
          </div>
          <div className="mt-2.5">
            <ProgressBar done={done.length} total={mine.length} />
          </div>
        </div>
      ) : null}

      <Group title="Needs your sign-off" list={pending} me={me} empty="You are signed off on everything current." />
      <Group title="Signed off" list={done} me={me} empty="Nothing signed yet." />
    </div>
  );

  function Group({ title, list, me, empty }: { title: string; list: typeof sops; me?: string; empty: string }) {
    return (
      <section className="space-y-2.5">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9187]">{title}</h2>
        {list.length === 0 ? <p className="rounded-2xl border border-dashed border-[#ddd5c8] px-4 py-5 text-center text-sm text-[#8a847b]">{empty}</p> : null}
        <ul className="space-y-2.5">
          {list.map((sop) => (
            <li key={sop.id}>
              <Link href={`/field/playbook/${sop.id}`} className="group flex items-center gap-3.5 rounded-2xl border border-[#ece6dc] bg-white p-3.5 transition hover:border-[#ddd3c4] hover:shadow-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3efe8] text-[#6f6a62]">
                  <BookOpen size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-medium text-[#9a9187]">
                      {sop.category} · v{sop.version}
                    </p>
                    {me ? <AckChip state={ackState(me, sop, acks)} /> : null}
                  </div>
                  <h3 className="mt-0.5 text-[15px] font-semibold leading-5 text-ink">{sop.title}</h3>
                  <p className="mt-0.5 text-[12px] text-[#8a847b]">{sop.steps.length} steps</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[#c9c1b5] transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }
}
