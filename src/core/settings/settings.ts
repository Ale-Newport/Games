import { detectLocale, type Locale } from '../i18n';
import { readLocal, writeLocal } from '../persistence/local-storage';
import { isRecord, unwrap, wrap, type VersionedSpec } from '../persistence/versioned';

export type ThemePreference = 'system' | 'dark' | 'light';
export type MotionPreference = 'system' | 'reduce' | 'full';

export interface Settings {
  theme: ThemePreference;
  locale: Locale;
  sound: boolean;
  /** Master volume 0..1. */
  volume: number;
  motion: MotionPreference;
  /** Use colorblind-friendly palettes and shape cues in games that support them. */
  colorblind: boolean;
}

export const SETTINGS_KEY = 'aal.settings';

export function defaultSettings(languages?: readonly string[]): Settings {
  return {
    theme: 'system',
    locale: detectLocale(
      languages ?? (typeof navigator === 'undefined' ? [] : navigator.languages),
    ),
    sound: true,
    volume: 0.7,
    motion: 'system',
    colorblind: false,
  };
}

const oneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

export const settingsSpec: VersionedSpec<Settings> = {
  schema: 1,
  validate: (data): data is Settings =>
    isRecord(data) &&
    oneOf(['system', 'dark', 'light'], data.theme) &&
    oneOf(['en', 'es'], data.locale) &&
    typeof data.sound === 'boolean' &&
    typeof data.volume === 'number' &&
    data.volume >= 0 &&
    data.volume <= 1 &&
    oneOf(['system', 'reduce', 'full'], data.motion) &&
    typeof data.colorblind === 'boolean',
};

export function loadSettings(): Settings {
  const result = unwrap(settingsSpec, readLocal(SETTINGS_KEY));
  return result.ok ? result.data : defaultSettings();
}

export function saveSettings(settings: Settings): void {
  writeLocal(SETTINGS_KEY, wrap(settingsSpec, settings));
}

type Listener = () => void;

/** Observable settings store for useSyncExternalStore. */
export class SettingsStore {
  private value: Settings;
  private readonly listeners = new Set<Listener>();

  constructor(
    initial: Settings = loadSettings(),
    private readonly persist = saveSettings,
  ) {
    this.value = initial;
  }

  get = (): Settings => this.value;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  update(patch: Partial<Settings>): void {
    this.value = { ...this.value, ...patch };
    this.persist(this.value);
    for (const listener of this.listeners) listener();
  }
}
