'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SignOffBar, SopBody } from '../../../../components/playbook/Sop';
import { useDemo } from '../../../../lib/demo-store';
import { longDate } from '../../../../lib/format';

export default function FieldSopPage() {
  const params = useParams<{ id: string }>();
  const { sops } = useDemo();
  const sop = sops.find((item) => item.id === params.id);

  if (!sop) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-[#7a746b]">That procedure is not in the playbook.</p>
        <Link href="/field/playbook" className="mt-4 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white">
          Back to playbook
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-4 px-4 pb-6 pt-4">
        <Link href="/field/playbook" className="inline-flex items-center gap-1 py-1 pr-2 text-[13px] font-semibold text-[#6f6a62] hover:text-ink">
          <ChevronLeft size={16} /> Playbook
        </Link>
        <div className="px-1">
          <p className="text-[11px] font-medium text-[#9a9187]">
            {sop.category} · v{sop.version} · updated {longDate(sop.updatedAt)}
          </p>
          <h1 className="mt-1 font-display text-[28px] leading-tight text-ink">{sop.title}</h1>
        </div>
        <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
          <SopBody sop={sop} compact />
        </div>
        {sop.changelog[0] ? (
          <p className="rounded-xl bg-[#f3efe8] px-3 py-2.5 text-[12px] leading-5 text-[#6f6a62]">
            <span className="font-semibold text-ink">Latest change:</span> {sop.changelog[0].note}
          </p>
        ) : null}
      </div>
      <div className="sticky bottom-0 z-10 border-t border-[#ece6dc] bg-white/95 p-3 backdrop-blur">
        <SignOffBar sop={sop} />
      </div>
    </div>
  );
}
