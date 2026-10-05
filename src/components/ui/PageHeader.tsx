export function PageHeader({
  kicker,
  title,
  lede,
  actions
}: {
  kicker: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9187]">{kicker}</p>
        <h1 className="mt-2 font-display text-[2.1rem] font-medium leading-none tracking-tight text-ink">{title}</h1>
        {lede ? <p className="mt-3 text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  lede,
  children,
  action
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {lede ? <p className="mt-0.5 text-xs leading-5 text-muted">{lede}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AccessDenied({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-line bg-surface px-6 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">Restricted</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

export function HandoffNote({ title = 'Not a live connection.', children }: { title?: string; children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm leading-6 text-[#5e4a2c]">
      <span className="font-semibold text-ink">{title} </span>
      {children}
    </p>
  );
}
