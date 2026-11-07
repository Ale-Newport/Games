/**
 * The contract of a real-time arcade game for the shared shell (`ArcadeShell.tsx`) and the shared
 * AI environment (`environment.ts`). The simulation is pure and deterministic: a state, a fixed
 * time step and a discrete action per step; every random draw comes from a generator kept in the
 * state. Rendering only reads the state.
 */
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { GameResult } from '../../../core/profiles/profile-store';
import type { Dictionary, Locale } from '../../../core/i18n';

/** Held controls, from keys, touch buttons or a pointer. */
export type Control = 'left' | 'right' | 'up' | 'down' | 'fire' | 'alt';

export interface ArcadeOption {
  id: string;
  /** Label key in the game's strings. */
  label: string;
  values: string[];
  initial: string;
}

export interface ArcadeDef<S, A extends string> {
  id: string;
  /** Test-id prefix. */
  prefix: string;
  /** Simulation steps per second. */
  hz: number;
  /** Logical canvas size (the simulation's coordinates). */
  width: number;
  height: number;
  /** Every action, `idle` included. */
  actions: readonly A[];
  idle: A;
  /** Menu choices (e.g. difficulty); value labels are `${option.id}.${value}` string keys. */
  options: ArcadeOption[];
  init(seed: number, options: Record<string, string>): S;
  step(state: S, action: A): S;
  over(state: S): boolean;
  /** The score shown and recorded (higher is better). */
  score(state: S): number;
  /** Values shown above the canvas: [string key, value]. */
  hud(state: S): [string, string | number][];
  draw(ctx: CanvasRenderingContext2D, state: S, options: { reducedMotion: boolean }): void;
  /** The action for the controls held now (and, for pointer games, the pointer position). */
  control(state: S, held: ReadonlySet<Control>, pointer: { x: number; y: number } | null): A;
  /** On-screen buttons for touch play. */
  touch: Control[];
  /** Whether a pointer held on the canvas steers (e.g. a paddle following the finger). */
  pointer: boolean;
  /** Computer players, by level id (the first is the strongest, used by watch mode). */
  policies: Record<string, (state: S) => A>;
  /** Sound keys for what changed between two states. */
  sounds(prev: S, next: S): string[];
  soundBank: Record<string, SoundSpec>;
  /** How the run is recorded. */
  result(state: S, options: Record<string, string>): GameResult;
  /** Achievements earned by a finished run (seat 0 is the player). */
  achievements(state: S, options: Record<string, string>, unlock: (id: string) => void): void;
  /** The end-of-run message key and its parameters. */
  ending(state: S): [string, Record<string, string | number>];
  validate(data: unknown): data is S;
  /** The game's strings: `title`, `menu.subtitle`, HUD labels, option labels, endings. */
  strings: Record<Locale, Dictionary>;
}
