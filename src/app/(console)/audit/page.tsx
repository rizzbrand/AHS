'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { Gate } from '../../../components/auth/Gate';
import { Avatar, FilterField, PillSearch, PillSelect } from '../../../components/ui/DataTable';
import { longDate, timeLabel } from '../../../lib/format';
import { auditEvents } from '../../../lib/seed';

function entityHref(entity: string, id: string) {
  if (id.startsWith('wo-')) return `/work-orders/${id}`;
  if (id.startsWith('est-')) return '/estimates';
  if (id.startsWith('doc-')) return '/documents';
  if (entity === 'Work order') return `/work-orders/${id}`;
  return undefined;
}

export default function AuditPage() {
  const [query, setQuery] = useState('');
  const [actor, setActor] = useState('all');
  const [entity, setEntity] = useState('all');

  const actors = Array.from(new Set(auditEvents.map((item) => item.actor)));
  const entities = Array.from(new Set(auditEvents.map((item) => item.entity)));
  const today = auditEvents.filter((item) => item.at.startsWith('2026-10-02')).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...auditEvents]
      .filter((item) => actor === 'all' || item.actor === actor)
      .filter((item) => entity === 'all' || item.entity === entity)
      .filter((item) => !q || `${item.actor} ${item.action} ${item.entity} ${item.detail} ${item.entityId}`.toLowerCase().includes(q))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [query, actor, entity]);

  const days = list.reduce<Record<string, typeof list>>((groups, item) => {
    const day = item.at.slice(0, 10);
    groups[day] = groups[day] ?? [];
    groups[day].push(item);
    return groups;
  }, {});

  return (
    <Gate permission="audit.read" title="The audit log is limited" body="The event history is for the owner and operations.">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">History</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-none tracking-tight text-ink">Audit log</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">Who did what, on which record. This demo log is seeded. A durable trail is a later phase.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Events on file" value={auditEvents.length} note="Seeded for the demo" />
          <Stat label="Today" value={today} note="October 2, 2026" />
          <Stat label="People and systems" value={actors.length} note="Including System imports" />
          <Stat label="Record types" value={entities.length} note={entities.join(' · ')} />
        </section>

        <section className="rounded-2xl border border-[#ece6dc] bg-white">
          <div className="flex flex-wrap items-end gap-3 px-5 pb-4 pt-5">
            <FilterField label="Search">
              <PillSearch value={query} onChange={setQuery} placeholder="Actor, action, or record…" width="w-64" />
            </FilterField>
            <FilterField label="Actor">
              <PillSelect value={actor} onChange={setActor} width="w-44">
                <option value="all">Anyone</option>
                {actors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            <FilterField label="Record">
              <PillSelect value={entity} onChange={setEntity} width="w-40">
                <option value="all">Any record</option>
                {entities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </PillSelect>
            </FilterField>
            {query || actor !== 'all' || entity !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActor('all');
                  setEntity('all');
                }}
                className="h-10 px-2 text-sm font-medium text-copper hover:underline"
              >
                Clear
              </button>
            ) : null}
            <p className="ml-auto pb-2 text-[12px] text-[#8a8278]">
              Showing <span className="font-semibold text-ink tabular">{list.length}</span> of {auditEvents.length}
            </p>
          </div>

          {list.length === 0 ? (
            <div className="border-t border-[#f0ebe3] px-5 py-14 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3efe6] text-[#8a8278]">
                <ScrollText size={18} />
              </span>
              <p className="mt-3 font-medium text-ink">No events match</p>
              <p className="mt-1 text-sm text-muted">Try another actor, record type, or search term.</p>
            </div>
          ) : (
            <div className="space-y-6 border-t border-[#f0ebe3] px-5 py-5">
              {Object.entries(days).map(([day, events]) => (
                <section key={day}>
                  <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9187]">{longDate(day)}</h2>
                  <ol className="space-y-2">
                    {events.map((event) => {
                      const href = entityHref(event.entity, event.entityId);
                      const system = event.actor === 'System';
                      return (
                        <li key={event.id} className="flex items-start gap-3 rounded-2xl border border-[#ece6dc] bg-[#fcfbf9] px-3.5 py-3">
                          <Avatar name={event.actor} tone={system ? 'system' : 'person'} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm text-ink">
                                <span className="font-semibold">{event.actor}</span>
                                <span className="text-[#6f6a62]"> {event.action.toLowerCase()}</span>
                              </p>
                              <p className="text-[12px] tabular text-[#8a8278]">{timeLabel(event.at)}</p>
                            </div>
                            <p className="mt-0.5 text-[13px] text-[#6f6a62]">{event.detail}</p>
                            <div className="mt-2">
                              {href ? (
                                <Link href={href} className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink ring-1 ring-[#ece6dc] hover:text-copper">
                                  {event.entity} · {event.entityId}
                                </Link>
                              ) : (
                                <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#8a8278] ring-1 ring-[#ece6dc]">
                                  {event.entity} · {event.entityId}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </Gate>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-4">
      <p className="text-[13px] font-medium text-[#6f6a62]">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none text-ink tabular">{value}</p>
      <p className="mt-2 truncate text-[12px] text-[#9a9187]">{note}</p>
    </div>
  );
}
