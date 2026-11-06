/**
 * Kayles: a row of pins. A move knocks down one standing pin, or two standing pins that are next
 * to each other (gaps from earlier moves split the row into separate groups). Whoever knocks down
 * the last pin wins. Every move removes pins, so the game always ends; there are no draws.
 *
 * Actions: "7" (knock pin 7) or "7-8" (knock pins 7 and 8). Pins keep their position in the row.
 * The row length (10–20) is drawn per round.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const MIN_PINS = 10;
export const MAX_PINS = 20;

export interface KaylesState {
  pins: boolean[];
  first: 0 | 1;
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 } | null;
}

export function createKaylesState(length: number, first: 0 | 1 = 0): KaylesState {
  return {
    pins: new Array<boolean>(length).fill(true),
    first,
    toMove: first,
    history: [],
    result: null,
  };
}

export const lengthFor = (seed: number) => new Rng(seed).range(MIN_PINS, MAX_PINS);

export function legalKaylesActions(s: KaylesState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.pins.forEach((up, i) => {
    if (!up) return;
    out.push(String(i));
    if (s.pins[i + 1]) out.push(`${i}-${i + 1}`);
  });
  return out;
}

/** Lengths of the groups of standing pins. */
export function groups(pins: readonly boolean[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const up of pins) {
    if (up) run++;
    else if (run) {
      out.push(run);
      run = 0;
    }
  }
  if (run) out.push(run);
  return out;
}

export function applyKaylesAction(s: KaylesState, a: string): KaylesState {
  if (s.result || !legalKaylesActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const pins = s.pins.slice();
  for (const i of a.split('-').map(Number)) pins[i] = false;
  const me = s.toMove;
  return {
    ...s,
    pins,
    toMove: (1 - me) as 0 | 1,
    history: [...s.history, a],
    result: pins.some(Boolean) ? null : { winner: me },
  };
}

export function replayKayles(
  length: number,
  first: 0 | 1,
  history: readonly string[],
): KaylesState {
  return history.reduce((s, a) => applyKaylesAction(s, a), createKaylesState(length, first));
}

export function isValidKaylesState(data: unknown): data is KaylesState {
  if (!isRecord(data) || !Array.isArray(data.history) || !Array.isArray(data.pins)) return false;
  const n = data.pins.length;
  if (n < MIN_PINS || n > MAX_PINS) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    const replayed = replayKayles(n, data.first, data.history as string[]);
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}
