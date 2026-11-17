/**
 * A constructive solver: builds a password that meets every rule for a given game (used by the
 * tests to prove each deal is solvable, and by the AI agent that plays it).
 */
import {
  BUG,
  CHICKEN,
  charOf,
  digits,
  EGG,
  graphemes,
  MOONS,
  moonPhase,
  STRONG,
  timeText,
  type PChar,
  type Pw,
} from './rules';
import { country } from '../shared/world/world';

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false;
  return true;
};

/** Style a plain password so the formatting rules pass. */
export function styled(text: string): PChar[] {
  return graphemes(text).map((c) => {
    const vowel = /^[aeiouáéíóúAEIOUÁÉÍÓÚ]$/.test(c);
    const letter = /^\p{L}$/u.test(c);
    const digit = /^\d$/.test(c);
    return charOf(c, {
      b: vowel,
      i: true,
      f: letter ? 'cursive' : 'sans',
      s: digit ? Number(c) ** 2 : 28,
    });
  });
}

/** The full password for this game with Paul as `paul`, or null if this deal cannot be solved this way. */
export function solution(p: Pw, paul: string = CHICKEN): string | null {
  // Uppercase letters must not be roman numerals except V and VII (product 35); element symbols
  // V(23) + V(23) + I(53) + I(53) + He(2) + Pd(46) = 200.
  const c = country(p.country);
  const name = [c.name.en, c.name.es].map((n) => n.toLowerCase()).find((n) => !/[^a-z ]/.test(n));
  if (!name) return null;
  const fixed = [
    'Zorbo',
    'may',
    'V',
    'He',
    'VII',
    'Pd',
    p.captcha,
    MOONS[moonPhase(p.clock)]!,
    name,
    '0',
    paul,
    STRONG + STRONG + STRONG,
    'i am loved',
    BUG,
    p.hex,
    timeText(p.clock),
    '!',
  ].join('');
  // Captcha/hex letters must not add element symbols or roman numerals (they are lowercase).
  const base = digits(fixed).reduce((a, b) => a + b, 0);
  for (let extra = 0; extra < 12; extra++) {
    for (let L = graphemes(fixed).length; L < 200; L++) {
      if (!isPrime(L)) continue;
      const lenText = String(L);
      const sum = base + digits(lenText).reduce((a, b) => a + b, 0);
      const need = 25 - sum;
      if (need < 0) continue;
      // Make up the rest of the digit sum with 9s and a remainder, then pad with letters.
      let filler = '9'.repeat(Math.floor(need / 9)) + (need % 9 ? String(need % 9) : '');
      if (filler) filler = 'x' + filler;
      const core = fixed + lenText + filler;
      const pad = L - graphemes(core).length;
      if (pad < 0) continue;
      const text = core + 'z'.repeat(pad);
      if (graphemes(text).length === L) return text;
    }
  }
  return null;
}

export const EGG_SOLUTION = (p: Pw) => solution(p, EGG);
