'use client';

import { Gate } from '../../../components/auth/Gate';
import { PageHeader } from '../../../components/ui/PageHeader';
import { ROLE_LABEL } from '../../../lib/labels';
import { company, sessionUsers } from '../../../lib/seed';

export default function SettingsPage() {
  return (
    <Gate permission="settings.read" title="Settings are limited" body="Company settings and permissions are owner-only.">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <PageHeader kicker="Company" title="Settings" lede="The operating context for Assign Home Solutions. Permission changes are not saved from this demo." />
        <section className="grid gap-4 border border-line bg-surface p-5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Company</p>
            <p className="mt-1 font-semibold">{company.name}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Territory</p>
            <p className="mt-1">{company.region}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Money documents</p>
            <p className="mt-1">JobTread, until a connection exists</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Authentication</p>
            <p className="mt-1">Demo role switch. Production sign-in is a later phase.</p>
          </div>
        </section>
        <section className="border border-line bg-surface">
          <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">People in this demo</h2>
          <ul>
            {sessionUsers.map((person) => (
              <li key={person.id} className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0">
                <span>
                  <span className="font-medium">{person.name}</span>
                  <span className="text-muted"> · {person.title}</span>
                </span>
                <span className="text-xs uppercase tracking-[0.12em] text-muted">{ROLE_LABEL[person.role]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Gate>
  );
}
