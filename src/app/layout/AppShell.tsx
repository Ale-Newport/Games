import {
  Bot,
  Gamepad2,
  House,
  LibraryBig,
  Map as MapIcon,
  Settings,
  UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Toasts } from '../../components/Toasts';
import { useT } from '../platform';
import { href, type Route } from '../router';
import styles from './AppShell.module.css';

const NAV = [
  { path: '/', key: 'nav.home', icon: House },
  { path: '/library', key: 'nav.library', icon: LibraryBig },
  { path: '/ai-lab', key: 'nav.aiLab', icon: Bot },
  { path: '/profile', key: 'nav.profile', icon: UserRound },
  { path: '/roadmap', key: 'nav.roadmap', icon: MapIcon },
] as const;

function isActive(route: Route, path: string): boolean {
  if (path === '/') return route.path === '/';
  return route.path === path || route.path.startsWith(`${path}/`);
}

export function AppShell({
  route,
  children,
  immersive,
}: {
  route: Route;
  children: ReactNode;
  immersive?: boolean;
}) {
  const t = useT();
  return (
    <div className={`${styles.shell} ${immersive ? styles.immersive : ''}`}>
      <a
        href="#main"
        className={styles.skip}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        {t('nav.skip')}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href={href('/')} className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">
              <Gamepad2 size={20} />
            </span>
            <span className={styles.brandText}>{t('brand.name')}</span>
          </a>
          <nav className={styles.nav} aria-label="Primary">
            {NAV.map(({ path, key, icon: Icon }) => (
              <a
                key={path}
                href={href(path)}
                className={styles.navLink}
                aria-current={isActive(route, path) ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{t(key)}</span>
              </a>
            ))}
          </nav>
          <a
            href={href('/settings')}
            className="btn btn-ghost btn-icon"
            aria-label={t('nav.settings')}
            aria-current={isActive(route, '/settings') ? 'page' : undefined}
          >
            <Settings size={20} />
          </a>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <nav className={styles.tabbar} aria-label="Primary mobile">
        {NAV.map(({ path, key, icon: Icon }) => (
          <a
            key={path}
            href={href(path)}
            className={styles.tab}
            aria-current={isActive(route, path) ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{t(key)}</span>
          </a>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}
