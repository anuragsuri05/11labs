import { NavLink } from 'react-router-dom';
import {
  AudioLines,
  Code2,
  FileText,
  History,
  Home,
  LogOut,
  Mic2,
  Moon,
  Music,
  Sparkles,
  Sun,
  Users,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Wordmark } from './Logo';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { cx } from '../lib/utils';
import { api } from '../lib/api';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV: { section?: string; items: NavItem[] }[] = [
  { items: [{ to: '/', label: 'Home', icon: Home, end: true }] },
  {
    section: 'Playground',
    items: [
      { to: '/text-to-speech', label: 'Text to Speech', icon: AudioLines },
      { to: '/voice-changer', label: 'Voice Changer', icon: Mic2 },
      { to: '/sound-effects', label: 'Sound Effects', icon: Sparkles },
      { to: '/music', label: 'Music', icon: Music },
      { to: '/speech-to-text', label: 'Speech to Text', icon: FileText },
      { to: '/voice-isolator', label: 'Voice Isolator', icon: Wand2 },
    ],
  },
  { section: 'Voices', items: [{ to: '/voices', label: 'Voices', icon: Users }] },
  { section: 'Library', items: [{ to: '/history', label: 'History', icon: History }] },
];

export function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const { theme, toggle } = useTheme();
  const { healthOk, health } = useData();

  const waiting = health?.queue?.waiting ?? 0;
  const running = health?.queue?.running ?? 0;
  const busy = !!healthOk && waiting > 0;
  const statusLabel =
    healthOk === null
      ? 'Checking engine…'
      : !healthOk
        ? 'Engine offline'
        : busy
          ? `Busy · ${waiting} waiting`
          : running > 0
            ? `Engine working${health?.device ? ` · ${health.device.toUpperCase()}` : ''}`
            : `Engine online${health?.device ? ` · ${health.device.toUpperCase()}` : ''}`;
  const engines = health?.engines ? Object.entries(health.engines).map(([k, v]) => `${k}: ${v}`).join('\n') : '';

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      /* cookie may already be gone */
    }
    window.location.reload();
  };

  return (
    <nav className="h-full flex flex-col bg-surface border-r border-line" aria-label="Main">
      <div className="h-14 flex items-center justify-between px-4 shrink-0">
        <NavLink to="/" onClick={onNavigate} className="rounded-lg" aria-label="NO LABS home">
          <Wordmark />
        </NavLink>
        {onClose && (
          <button className="icon-btn md:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 pb-4 scrollbar-thin">
        {NAV.map((g, gi) => (
          <div key={gi} className={cx(gi > 0 && 'mt-4')}>
            {g.section && <p className="px-2.5 pb-1 text-2xs font-medium uppercase tracking-wider text-faint">{g.section}</p>}
            <ul className="flex flex-col gap-px">
              {g.items.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-sm transition-colors',
                        isActive ? 'bg-bg text-fg font-medium shadow-card ring-1 ring-line' : 'text-sub hover:text-fg hover:bg-muted',
                      )
                    }
                  >
                    <it.icon size={16} strokeWidth={1.8} />
                    {it.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-line p-2.5 flex flex-col gap-1">
        <div className="flex items-center gap-2 h-8 px-2.5 text-xs text-sub" title={engines || undefined} role="status">
          <span
            className={cx(
              'h-2 w-2 rounded-full shrink-0',
              healthOk === null
                ? 'bg-faint animate-pulse'
                : !healthOk
                  ? 'bg-red-500'
                  : busy || running > 0
                    ? 'bg-amber-500 shadow-[0_0_0_3px_rgb(245_158_11/0.18)] animate-pulse'
                    : 'bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.18)]',
            )}
          />
          <span className="truncate" data-testid="engine-status">
            {statusLabel}
          </span>
        </div>
        {health?.auth && (
          <button
            className="flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-sm text-sub hover:text-fg hover:bg-muted transition-colors"
            onClick={signOut}
          >
            <LogOut size={16} strokeWidth={1.8} />
            Sign out
          </button>
        )}
        <div className="flex items-center gap-1">
          <NavLink
            to="/api"
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex-1 flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-sm transition-colors',
                isActive ? 'bg-bg text-fg font-medium ring-1 ring-line' : 'text-sub hover:text-fg hover:bg-muted',
              )
            }
          >
            <Code2 size={16} strokeWidth={1.8} />
            API
          </NavLink>
          <button className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
