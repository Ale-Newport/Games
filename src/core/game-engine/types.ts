import type { ComponentType } from 'react';
import type { AchievementDef } from '../achievements/types';
import type { SoundSpec } from '../audio/audio-engine';
import type { Locale, LocalizedText } from '../i18n';
import type { GameResult, GameStats } from '../profiles/profile-store';
import type { CategoryId } from '../../data/roadmap';

export type { CategoryId };

export type InputMethod = 'keyboard' | 'mouse' | 'touch';

/** Static, eagerly-loaded metadata. Must stay tiny: no rules, no React components. */
export interface GameManifest {
  id: string;
  /** Catalog number 1..200 (matches src/data/roadmap.ts). */
  number: number;
  title: LocalizedText;
  /** One-line pitch shown on cards. */
  tagline: LocalizedText;
  description: LocalizedText;
  category: CategoryId;
  /** Genre label such as 'Abstract strategy' or 'Solitaire'. */
  genre: LocalizedText;
  players: { min: number; max: number };
  /** True when the game offers a computer opponent. */
  vsComputer: boolean;
  /** Rules complexity, 1 (trivial) .. 5 (expert). */
  complexity: 1 | 2 | 3 | 4 | 5;
  /** Typical session length in minutes. */
  sessionMinutes: number;
  inputs: InputMethod[];
  /** URL of the card preview image (imported with ?url so Vite fingerprints it). */
  preview: string;
  /** Semantic version of the game implementation. */
  version: string;
  rulesetId: string;
  achievements: AchievementDef[];
  /** Score semantics for personal bests. */
  scoring?: { label: LocalizedText; lowerIsBetter?: boolean } | null;
  /** Show the fullscreen control (arcade games). */
  fullscreen?: boolean;
  tags?: string[];
}

export interface SaveSlot<T> {
  load(): Promise<T | null>;
  save(data: T): Promise<void>;
  clear(): Promise<void>;
}

/** Platform services injected into every game component. */
export interface GameServices {
  locale: Locale;
  reducedMotion: boolean;
  colorblind: boolean;
  playSound(sound: SoundSpec): void;
  recordResult(result: GameResult): GameStats;
  getStats(): GameStats | undefined;
  unlockAchievement(id: string): void;
  isAchievementUnlocked(id: string): boolean;
  /** Versioned save slot for this game and the active profile. */
  saveSlot<T>(spec: {
    schema: number;
    validate: (data: unknown) => data is T;
    migrations?: Record<number, (d: unknown) => unknown>;
  }): SaveSlot<T>;
  /** Display name of the active profile, used as the default player name. */
  profileName: string;
  /** Query parameters from the game URL (e.g. { mode: 'watch' } from the AI Lab). */
  launchParams: Readonly<Record<string, string>>;
}

export interface GameProps {
  services: GameServices;
}

/** The lazily-loaded part of a game. */
export interface GameModule {
  Game: ComponentType<GameProps>;
  /** Rules & how-to-play content rendered by the platform help dialog. */
  Rules: ComponentType<{ locale: Locale }>;
}

export interface GameRegistration {
  manifest: GameManifest;
  load: () => Promise<GameModule>;
}
