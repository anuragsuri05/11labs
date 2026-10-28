import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar, NAV } from './Sidebar';
import { PlayerBar } from './PlayerBar';
import { LogoMark } from './Logo';
import { useDocumentTitle } from '../lib/hooks';

const EXTRA_TITLES: Record<string, string> = { '/api': 'API' };

function titleFor(path: string): string {
  if (EXTRA_TITLES[path]) return EXTRA_TITLES[path];
  for (const g of NAV) for (const it of g.items) if (it.end ? path === it.to : path.startsWith(it.to)) return it.label;
  return '';
}

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const title = titleFor(pathname);
  useDocumentTitle(title === 'Home' ? '' : title);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  return (
    <div className="h-full flex overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-2 focus:left-2 btn-primary">
        Skip to content
      </a>
      <aside className="hidden md:block w-[240px] shrink-0">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setDrawer(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-[272px] max-w-[85vw] animate-slide-in shadow-pop">
            <Sidebar onNavigate={() => setDrawer(false)} onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 flex items-center gap-2 px-4 sm:px-6 border-b border-line bg-bg">
          <button className="icon-btn md:hidden -ml-1.5" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <Menu size={18} />
          </button>
          <span className="md:hidden">
            <LogoMark size={22} />
          </span>
          <h1 className="text-[15px] font-semibold tracking-tight truncate">{title}</h1>
        </header>
        <main id="main" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" tabIndex={-1}>
          <Outlet />
        </main>
        <PlayerBar />
      </div>
    </div>
  );
}
