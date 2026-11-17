/**
 * Pure rules for #216 Caption Battle (ruleset `caption-battle-stars`): every round all players
 * caption the same picture, then everyone rates every other caption from 1 to 5 stars. A caption
 * scores the stars it receives; the round's best caption earns a 3-star bonus. After the last round
 * the highest total wins.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { SCENES } from './scenes';

export type Lang = 'en' | 'es';
export const ROUND_OPTIONS = [3, 5] as const;
export const MAX_CAPTION = 90;

export interface Player {
  name: string;
  bot: boolean;
  /** Bots: how generous their ratings are (−1…+1) and how long they like captions. */
  taste?: { generosity: number; idealLength: number };
}

export interface RoundState {
  scene: string;
  captions: (string | null)[];
  /** ratings[rater][author] = 1..5 (null when not rated / own caption). */
  ratings: (number | null)[][];
}

export interface BattleState {
  lang: Lang;
  players: Player[];
  rounds: number;
  history: RoundState[];
  phase: 'caption' | 'rate' | 'results' | 'over';
  rng: RngState;
}

const BOT_NAMES = ['Giggles', 'Snark', 'Punny', 'Deadpan', 'Chuckles', 'Zinger'];

export function newGame(
  lang: Lang,
  humans: string[],
  bots: number,
  rounds: number,
  seed: number,
): BattleState {
  const rng = new Rng(seed >>> 0);
  const players: Player[] = [
    ...humans.map((name) => ({ name, bot: false })),
    ...Array.from({ length: bots }, (_, i) => ({
      name: BOT_NAMES[i]!,
      bot: true,
      taste: { generosity: rng.float() * 1.4 - 0.7, idealLength: 18 + rng.int(40) },
    })),
  ];
  return startRound({ lang, players, rounds, history: [], phase: 'caption', rng: rng.state });
}

function startRound(s: BattleState): BattleState {
  const rng = Rng.from(s.rng);
  const used = new Set(s.history.map((r) => r.scene));
  const fresh = SCENES.filter((x) => !used.has(x.id));
  const scene = rng.pick(fresh.length ? fresh : SCENES).id;
  const n = s.players.length;
  return {
    ...s,
    rng: rng.state,
    phase: 'caption',
    history: [
      ...s.history,
      {
        scene,
        captions: Array<string | null>(n).fill(null),
        ratings: Array.from({ length: n }, () => Array<number | null>(n).fill(null)),
      },
    ],
  };
}

export const round = (s: BattleState) => s.history[s.history.length - 1]!;
export const sceneOf = (id: string) => SCENES.find((x) => x.id === id)!;

export function cleanCaption(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_CAPTION);
}

export function setCaption(s: BattleState, player: number, text: string): BattleState {
  if (s.phase !== 'caption') return s;
  const r = round(s);
  const captions = r.captions.map((c, i) => (i === player ? cleanCaption(text) || '…' : c));
  const next = { ...s, history: [...s.history.slice(0, -1), { ...r, captions }] };
  return captions.every((c) => c !== null) ? { ...next, phase: 'rate' } : next;
}

export function setRating(
  s: BattleState,
  rater: number,
  author: number,
  stars: number,
): BattleState {
  if (s.phase !== 'rate' || rater === author || stars < 1 || stars > 5) return s;
  const r = round(s);
  const ratings = r.ratings.map((row, i) =>
    i === rater ? row.map((v, j) => (j === author ? Math.round(stars) : v)) : row,
  );
  const next = { ...s, history: [...s.history.slice(0, -1), { ...r, ratings }] };
  const complete = ratings.every((row, i) => row.every((v, j) => i === j || v !== null));
  return complete ? { ...next, phase: 'results' } : next;
}

/** Stars received per player in a round, with the 3-star bonus for the best (shared on ties). */
export function roundScores(r: RoundState): number[] {
  const n = r.captions.length;
  const stars = Array.from({ length: n }, (_, a) =>
    r.ratings.reduce((sum, row, i) => sum + (i === a ? 0 : (row[a] ?? 0)), 0),
  );
  const best = Math.max(...stars);
  return stars.map((x) => (x === best && best > 0 ? x + 3 : x));
}

export const totals = (s: BattleState) =>
  s.players.map((_, i) =>
    s.history
      .filter((r) => r.ratings.every((row, k) => row.every((v, j) => k === j || v !== null)))
      .reduce((sum, r) => sum + roundScores(r)[i]!, 0),
  );

export function nextRound(s: BattleState): BattleState {
  if (s.phase !== 'results') return s;
  return s.history.length >= s.rounds ? { ...s, phase: 'over' } : startRound(s);
}

/** Bot caption: an unused line from the scene's bank in the game's language. */
export function botCaption(s: BattleState, player: number): string {
  const r = round(s);
  const bank = sceneOf(r.scene).captions[s.lang];
  const taken = new Set(r.captions.filter(Boolean));
  const rng = new Rng((player * 7919 + s.history.length * 31 + (s.rng[0] ?? 0)) >>> 0);
  const free = bank.filter((c) => !taken.has(c));
  return free.length ? rng.pick(free) : rng.pick(bank);
}

const RELATABLE = /\b(me|my|i|when|yo|mi|cuando|nobody|nadie|monday|lunes)\b/i;

/**
 * A bot's rating. Bots cannot judge humour; their stated taste rewards captions near their favourite
 * length, relatable phrasing ("me when…"), and penalises empty or one-word captions, plus their own
 * generosity and a little seeded noise.
 */
export function botRating(s: BattleState, rater: number, author: number): number {
  const p = s.players[rater]!;
  const c = round(s).captions[author] ?? '';
  const taste = p.taste ?? { generosity: 0, idealLength: 35 };
  let score = 3 + taste.generosity;
  score -= Math.min(1.5, Math.abs(c.length - taste.idealLength) / 30);
  if (RELATABLE.test(c)) score += 0.6;
  if (c.trim().split(/\s+/).length <= 1) score -= 1.5;
  const rng = new Rng((rater * 104729 + author * 1299709 + s.history.length * 7) >>> 0);
  score += rng.float() - 0.5;
  return Math.max(1, Math.min(5, Math.round(score)));
}

export function isValidState(v: unknown): v is BattleState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as BattleState;
  return (
    (s.lang === 'en' || s.lang === 'es') &&
    Array.isArray(s.players) &&
    Array.isArray(s.history) &&
    ['caption', 'rate', 'results', 'over'].includes(s.phase)
  );
}
