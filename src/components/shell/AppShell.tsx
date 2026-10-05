'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { fieldHome, isFieldRole } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { company, notices } from '../../lib/seed';
import { timeLabel } from '../../lib/format';
import { CRUMB } from './nav';
import { RoleMenu } from './RoleMenu';
import { MenuButton, Sidebar } from './Sidebar';
import { SearchPalette } from './SearchPalette';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('ahs-sidebar');
    if (stored === 'collapsed') setCollapsed(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNoticesOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNoticesOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!ready || !user) return;
    if (isFieldRole(user.role) && !pathname.startsWith('/field')) {
      router.replace(fieldHome(pathname));
    }
  }, [pathname, ready, router, user]);

  if (!ready) return <div className="min-h-screen bg-paper" />;
  if (!user) return null;
  if (isFieldRole(user.role)) return <div className="min-h-screen bg-paper" />;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const label = CRUMB[segment] ?? segment.replace('wo-', 'WO-').toUpperCase();
    return { href, label };
  });

  function toggleCollapsed() {
    setCollapsed((current) => {
      window.localStorage.setItem('ahs-sidebar', current ? 'open' : 'collapsed');
      return !current;
    });
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-shell md:py-3 md:pr-3">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={toggleCollapsed} onCloseMobile={() => setMobileOpen(false)} />
      <div className="console-canvas flex min-w-0 flex-1 flex-col overflow-hidden bg-white md:rounded-[22px] md:shadow-canvas">
        <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-[#f0ebe3] px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-8">
          <MenuButton onClick={() => setMobileOpen(true)} />
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink md:hidden">{crumbs[crumbs.length - 1]?.label ?? 'Assign Home'}</p>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center truncate text-[13px] text-[#9a9187] md:flex">
            <span>{company.name.replace(' Solutions', '')}</span>
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center">
                  <span className="px-2 text-[#d6cec2]">/</span>
                  {last ? (
                    <span className="font-semibold text-ink">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-ink">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the operation"
              className="flex h-9 items-center gap-2 rounded-full border border-[#ece6dc] bg-[#faf8f4] px-3 text-left text-[13px] text-[#9a9187] transition hover:border-line hover:text-ink sm:w-64"
            >
              <Search size={14} />
              <span className="hidden flex-1 sm:inline">Search the operation</span>
              <kbd className="hidden rounded border border-[#e6dfd4] bg-white px-1.5 text-[10px] font-sans text-[#9a9187] sm:inline">⌘K</kbd>
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-full text-[#6d655c] transition hover:bg-[#f5f1ea] hover:text-ink"
                onClick={() => setNoticesOpen((open) => !open)}
              >
                <Bell size={17} strokeWidth={1.75} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber ring-2 ring-white" />
              </button>
              {noticesOpen ? (
                <>
                  <button type="button" aria-label="Close notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setNoticesOpen(false)} />
                  <div className="fixed inset-x-3 top-[4.25rem] z-50 max-h-[min(70dvh,28rem)] overflow-y-auto rounded-xl border border-line bg-surface shadow-sheet sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                    <p className="border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Needs a look</p>
                    <ul>
                      {notices.map((notice) => (
                        <li key={notice.id} className="border-b border-line px-4 py-3 last:border-b-0">
                          <p className="text-sm font-medium text-ink">{notice.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">{notice.body}</p>
                          <p className="mt-1 text-[11px] text-muted">{timeLabel(notice.at)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>
            <RoleMenu variant="avatar" />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 md:px-8 md:py-8">{children}</main>
      </div>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
