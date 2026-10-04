'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Gate } from '../../../../components/auth/Gate';
import { Changelog, DraftChip, RevisionForm, SignOffBar, SignOffRoster, SopBody } from '../../../../components/playbook/Sop';
import { useDemo } from '../../../../lib/demo-store';
import { longDate } from '../../../../lib/format';
import { canEditPlaybook, isDraft, personName } from '../../../../lib/playbook';
import { useSession } from '../../../../lib/session';

export default function SopPage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const { sops, responsibilities } = useDemo();
  const sop = sops.find((item) => item.id === params.id);

  if (!user) return null;
  if (!sop) {
    return (
      <Gate permission="playbook.read" title="Playbook is limited" body="Operating procedures are available after you sign in.">
        <div className="mx-auto max-w-[1240px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">Playbook</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none text-ink">Procedure not found</h1>
          <p className="mt-3 text-sm text-muted">It may have been retired.</p>
          <Link href="/playbook" className="mt-6 inline-flex h-10 items-center gap-2 text-sm font-semibold text-ink hover:underline">
            <ArrowLeft size={15} /> Back to playbook
          </Link>
        </div>
      </Gate>
    );
  }

  const editor = canEditPlaybook(user.role);
  const owners = responsibilities.filter((item) => item.sopId === sop.id);

  return (
    <Gate permission="playbook.read" title="Playbook is limited" body="Operating procedures are available after you sign in.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <Link href="/playbook" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6f6a62] hover:text-ink">
          <ArrowLeft size={15} /> Playbook
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">{sop.category}</p>
            <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">{sop.title}</h1>
            <p className="mt-3 text-sm text-muted">
              v{sop.version} · updated {longDate(sop.updatedAt)} · {personName(sop.ownerId)}
            </p>
          </div>
          {isDraft(sop) ? <DraftChip /> : null}
        </header>

        <SignOffBar sop={sop} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <article className="rounded-2xl border border-[#ece6dc] bg-white p-5 sm:p-6">
            <SopBody sop={sop} />
          </article>

          <aside className="space-y-4">
            {editor ? (
              <SideCard title="Sign-offs" lede={`Everyone this procedure applies to.`}>
                <SignOffRoster sop={sop} />
              </SideCard>
            ) : null}
            {owners.length > 0 ? (
              <SideCard title="Used by" lede="Functions that run on this procedure.">
                <ul className="divide-y divide-[#f0ebe3]">
                  {owners.map((item) => (
                    <li key={item.id} className="px-4 py-3 text-sm font-medium text-ink">
                      {item.functionName}
                    </li>
                  ))}
                </ul>
              </SideCard>
            ) : null}
            <SideCard title="Change log">
              <Changelog sop={sop} />
            </SideCard>
            {editor ? (
              <SideCard title="Publish a revision" lede="Owner and operations only.">
                <RevisionForm sop={sop} />
              </SideCard>
            ) : null}
          </aside>
        </div>
      </div>
    </Gate>
  );
}

function SideCard({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white">
      <div className="border-b border-[#f0ebe3] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {lede ? <p className="mt-0.5 text-[12px] text-[#9a9187]">{lede}</p> : null}
      </div>
      {children}
    </section>
  );
}
