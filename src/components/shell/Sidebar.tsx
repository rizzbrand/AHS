'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowUpRight, ChevronDown, LifeBuoy, Menu, PanelLeftClose, PanelLeftOpen, Smartphone, X, type LucideIcon } from 'lucide-react';
import { useDemo } from '../../lib/demo-store';
import { can } from '../../lib/permissions';
import { ackState, personKey, requiredSops } from '../../lib/playbook';
import { attentionFor } from '../../lib/records';
import { useSession } from '../../lib/session';
import { NAV, type NavItem } from './nav';
import { RoleMenu } from './RoleMenu';

const groups = ['Operate', 'Directory', 'Commercial', 'Control'] as const;
const HIDDEN = new Set(['/settings']);

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const { orders, documents, sops, acks } = useDemo();
  const items = NAV.filter((item) => user && can(user.role, item.permission) && !HIDDEN.has(item.href));

  const me = user ? personKey(user) : undefined;
  const badges: Record<string, number> = {
    '/work-orders': user && can(user.role, 'jobs.read') ? attentionFor(orders, documents).length : 0,
    '/playbook': user && me ? requiredSops(user.role, sops).filter((sop) => ackState(me, sop, acks) !== 'current').length : 0
  };

  return (
    <>
      {mobileOpen ? <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onCloseMobile} /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col bg-shell text-shell-ink transition-[width,transform] duration-200 md:static md:h-full ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-[84px]' : 'w-[264px]'}`}
      >
        <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <Link href={user && can(user.role, 'overview.read') ? '/overview' : '/playbook'} className="flex items-center gap-3" onClick={onCloseMobile}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[11px] font-bold text-ink">AH</span>
            {collapsed ? null : <span className="text-[13px] font-semibold uppercase tracking-[0.28em] text-shell-ink">Assign Home</span>}
          </Link>
          {collapsed ? null : (
            <>
              <button type="button" className="hidden rounded-md p-1 text-shell-faint hover:bg-shell-hover hover:text-shell-ink md:inline" onClick={onToggle} aria-label="Collapse sidebar">
                <PanelLeftClose size={16} />
              </button>
              <button type="button" className="rounded-md p-1 text-shell-faint md:hidden" onClick={onCloseMobile} aria-label="Close sidebar">
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {collapsed ? (
          <button type="button" className="mx-auto mb-2 hidden rounded-md p-1.5 text-shell-faint hover:bg-shell-hover hover:text-shell-ink md:block" onClick={onToggle} aria-label="Expand sidebar">
            <PanelLeftOpen size={16} />
          </button>
        ) : null}

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-2">
          {user && can(user.role, 'field.access') ? (
            <NavLink item={{ href: '/field', label: 'Field board', icon: Smartphone }} active={false} collapsed={collapsed} onClick={onCloseMobile} className="mb-3" />
          ) : null}
          {groups.map((group) => {
            const groupItems = items.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="mb-4">
                {collapsed ? (
                  <div className="mx-auto mb-2 h-px w-6 bg-shell-line" />
                ) : (
                  <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-shell-faint">{group}</p>
                )}
                <ul className="space-y-0.5">
                  {groupItems.map((item) => (
                    <li key={item.href}>
                      <NavItemRow
                        item={item}
                        pathname={pathname}
                        search={searchParams.toString()}
                        badge={badges[item.href]}
                        collapsed={collapsed}
                        onClick={onCloseMobile}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 px-3 pb-3">
          <div className="border-t border-shell-line pt-2">
            {user && can(user.role, 'playbook.read') ? (
              <Link
                href="/playbook"
                onClick={onCloseMobile}
                title="Operations manual"
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-shell-text transition hover:bg-shell-hover ${collapsed ? 'justify-center' : ''}`}
              >
                <LifeBuoy size={16} strokeWidth={1.75} className="shrink-0" />
                {collapsed ? null : (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-shell-ink">Need a hand?</span>
                      <span className="block text-[11px] text-shell-muted">Open the operations manual</span>
                    </span>
                    <ArrowUpRight size={14} className="text-shell-faint" />
                  </>
                )}
              </Link>
            ) : null}
          </div>
          <div className="mt-2 border-t border-shell-line pt-2">
            <RoleMenu variant="sidebar" collapsed={collapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}

function childIsActive(href: string, pathname: string, search: string) {
  const url = new URL(href, 'http://local.invalid');
  if (pathname !== url.pathname) return false;
  const wanted = url.searchParams.get('view');
  const current = new URLSearchParams(search).get('view');
  return (wanted ?? null) === (current ?? null);
}

function NavItemRow({
  item,
  pathname,
  search,
  badge = 0,
  collapsed,
  onClick
}: {
  item: NavItem;
  pathname: string;
  search: string;
  badge?: number;
  collapsed: boolean;
  onClick: () => void;
}) {
  const { user } = useSession();
  const children = (item.children ?? []).filter((child) => !child.permission || (user && can(user.role, child.permission)));
  const sectionActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const [open, setOpen] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  if (collapsed || children.length === 0) {
    return <NavLink item={item} active={sectionActive} badge={badge} collapsed={collapsed} onClick={onClick} />;
  }

  return (
    <div>
      <div
        className={`relative flex items-center rounded-xl text-[13px] transition ${
          sectionActive ? 'bg-white font-semibold text-ink' : 'text-shell-text hover:bg-shell-hover hover:text-shell-ink'
        }`}
      >
        <Link href={item.href} title={item.label} onClick={onClick} aria-current={sectionActive ? 'page' : undefined} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
          <item.icon size={16} strokeWidth={sectionActive ? 2 : 1.75} className="shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
        {badge > 0 ? (
          <span className={`mr-1 grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold tabular ${sectionActive ? 'bg-ink/15 text-ink' : 'bg-white text-ink'}`}>
            {badge}
          </span>
        ) : null}
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${item.label}`}
          onClick={() => setOpen((current) => !current)}
          className={`mr-1 grid h-7 w-7 place-items-center rounded-lg ${sectionActive ? 'text-ink hover:bg-black/5' : 'text-shell-faint hover:bg-shell-hover hover:text-shell-ink'}`}
        >
          <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open ? (
        <ul className="mt-0.5 space-y-0.5 pl-4">
          {children.map((child) => {
            const active = childIsActive(child.href, pathname, search);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onClick}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center rounded-xl px-3 py-1.5 text-[12px] transition ${
                    active ? 'font-semibold text-shell-ink' : 'text-shell-muted hover:bg-shell-hover hover:text-shell-ink'
                  }`}
                >
                  <span className={`mr-2 h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-shell-line'}`} />
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function NavLink({
  item,
  active,
  badge = 0,
  collapsed,
  onClick,
  className = ''
}: {
  item: Pick<NavItem, 'href' | 'label'> & { icon: LucideIcon };
  active: boolean;
  badge?: number;
  collapsed: boolean;
  onClick: () => void;
  className?: string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition ${collapsed ? 'justify-center' : ''} ${
        active ? 'bg-white font-semibold text-ink' : 'text-shell-text hover:bg-shell-hover hover:text-shell-ink'
      } ${className}`}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
      {collapsed ? null : <span className="flex-1 truncate">{item.label}</span>}
      {badge > 0 ? (
        collapsed ? (
          <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-white ring-2 ring-shell" />
        ) : (
          <span
            className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold tabular ${active ? 'bg-ink/15 text-ink' : 'bg-white text-ink'}`}
          >
            {badge}
          </span>
        )
      ) : null}
    </Link>
  );
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface md:hidden" onClick={onClick} aria-label="Open menu">
      <Menu size={16} />
    </button>
  );
}
