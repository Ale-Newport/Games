import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { AudioEngine } from '../core/audio/audio-engine';
import { createTranslator, type Locale, type Translator } from '../core/i18n';
import type { KeyValueStore } from '../core/persistence/kv-store';
import type { ProfileData, ProfileStore } from '../core/profiles/profile-store';
import type { Settings, SettingsStore } from '../core/settings/settings';
import { PLATFORM_STRINGS } from './i18n/strings';

export interface Platform {
  settings: SettingsStore;
  profiles: ProfileStore;
  audio: AudioEngine;
  kv: KeyValueStore;
  toasts: ToastBus;
}

export interface Toast {
  id: number;
  title: string;
  body: string;
  kind: 'achievement' | 'info';
}

export class ToastBus {
  private items: Toast[] = [];
  private next = 1;
  private readonly listeners = new Set<() => void>();

  get = (): Toast[] => this.items;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  push(toast: Omit<Toast, 'id'>, durationMs = 4500): void {
    const id = this.next++;
    this.items = [...this.items, { ...toast, id }];
    this.emit();
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.items = this.items.filter((t) => t.id !== id);
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}

const PlatformContext = createContext<Platform | null>(null);

export function PlatformProvider({
  platform,
  children,
}: {
  platform: Platform;
  children: ReactNode;
}) {
  const settings = useSyncExternalStore(platform.settings.subscribe, platform.settings.get);
  useEffect(() => {
    platform.audio.configure(settings.sound, settings.volume);
  }, [platform.audio, settings.sound, settings.volume]);
  useDocumentPreferences(settings);
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): Platform {
  const platform = useContext(PlatformContext);
  if (!platform) throw new Error('usePlatform outside PlatformProvider');
  return platform;
}

export function useSettings(): Settings {
  const { settings } = usePlatform();
  return useSyncExternalStore(settings.subscribe, settings.get);
}

export function useProfile(): ProfileData {
  const { profiles } = usePlatform();
  return useSyncExternalStore(profiles.subscribe, profiles.getProfile);
}

export function useLocale(): Locale {
  return useSettings().locale;
}

export function useT(): Translator {
  const locale = useLocale();
  return useMemo(() => createTranslator(PLATFORM_STRINGS, locale), [locale]);
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (listener) => {
      const mql = window.matchMedia?.(query);
      mql?.addEventListener('change', listener);
      return () => mql?.removeEventListener('change', listener);
    },
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  );
}

export function useReducedMotion(): boolean {
  const { motion } = useSettings();
  const systemReduce = useMediaQuery('(prefers-reduced-motion: reduce)');
  return motion === 'reduce' || (motion === 'system' && systemReduce);
}

/** Mirrors theme, language and motion preferences onto <html> for CSS and assistive tech. */
function useDocumentPreferences(settings: Settings) {
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const systemReduce = useMediaQuery('(prefers-reduced-motion: reduce)');
  const theme = settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : settings.theme;
  const reduce = settings.motion === 'reduce' || (settings.motion === 'system' && systemReduce);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.motion = reduce ? 'reduce' : 'full';
    root.dataset.colorblind = settings.colorblind ? 'on' : 'off';
    root.lang = settings.locale;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0616' : '#f3e9d2');
  }, [theme, reduce, settings.colorblind, settings.locale]);
}
