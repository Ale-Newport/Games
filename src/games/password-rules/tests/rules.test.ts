import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env, solverAction } from '../ai-adapter';
import {
  BUG,
  charOf,
  CHICKEN,
  confirm,
  edit,
  EGG,
  elementsIn,
  FIRE,
  graphemes,
  moonPhase,
  newCaptcha,
  newColour,
  newPw,
  passing,
  plain,
  RULE_INDEX,
  RULES,
  romans,
  romanValue,
  tick,
  type Clock,
  type Pw,
} from '../rules';
import { solution, styled } from '../solver';

const CLOCK: Clock = { y: 2026, mo: 3, d: 14, h: 15, mi: 9 };
const text = (p: Pw, s: string) => edit(p, styled(s));

describe('Password Rules helpers', () => {
  it('reads roman numerals, element symbols and moon phases', () => {
    expect(romanValue('VII')).toBe(7);
    expect(romanValue('XIV')).toBe(14);
    expect(romans('aVbVIIc')).toEqual([5, 7]);
    expect(elementsIn('HeNaCo')).toEqual(['He', 'Na', 'Co']);
    expect(elementsIn('Hz')).toEqual(['H']);
    expect(moonPhase({ y: 2024, mo: 1, d: 11, h: 12, mi: 0 })).toBe(0);
    expect(moonPhase({ y: 2024, mo: 1, d: 25, h: 18, mi: 0 })).toBe(4);
    expect(graphemes('a💪🏽b')).toHaveLength(3);
  });
});

describe('Password Rules progression', () => {
  it('reveals rules one at a time as they pass', () => {
    let p = newPw(1, CLOCK);
    expect(p.shown).toBe(1);
    p = text(p, 'abc');
    expect(p.shown).toBe(1);
    p = text(p, 'abcde');
    expect(p.shown).toBe(2);
    p = text(p, 'abcde1');
    expect(p.shown).toBe(3);
    p = text(p, 'Abcde1');
    expect(p.shown).toBe(4);
    p = text(p, 'Abcde1!');
    expect(p.shown).toBe(5);
    expect(passing(p)).toEqual([true, true, true, true, false]);
  });

  it('every deal tried can be solved, through the fire and the hatching, to the final retype', () => {
    let solved = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let p = newPw(seed, CLOCK);
      // Like a player, refresh the captcha and the colour until the digits can add up.
      for (let r = 0; r < 60 && !solution(p, EGG); r++) p = r % 2 ? newCaptcha(p) : newColour(p);
      const withEgg = solution(p, EGG);
      if (!withEgg) continue;
      p = text(p, withEgg);
      // The fire broke out on reaching its rule: put it out.
      expect(p.shown).toBeGreaterThan(RULE_INDEX.fire!);
      expect(p.fire).toBe('burning');
      expect(plain(p)).toContain(FIRE);
      p = text(p, withEgg);
      expect(p.fire).toBe('out');
      // Paul hatched when the feeding rule appeared.
      expect(p.paul).toBe('chicken');
      expect(plain(p)).toContain(CHICKEN);
      p = text(p, solution(p, CHICKEN)!);
      expect(p.shown).toBe(RULES.length);
      expect(passing(p).every(Boolean)).toBe(true);
      expect(p.final).toBe(true);
      expect(confirm(p, 'nope').won).toBe(false);
      expect(confirm(p, plain(p)).won).toBe(true);
      solved++;
    }
    expect(solved).toBeGreaterThanOrEqual(20);
  });
});

describe('Password Rules events', () => {
  const ready = (): Pw => {
    let p = newPw(3, CLOCK);
    for (let r = 0; !solution(p, EGG); r++) p = r % 2 ? newCaptcha(p) : newColour(p);
    return text(p, solution(p, EGG)!);
  };

  it('the fire spreads every second and burning Paul loses the game', () => {
    let p = ready();
    const before = graphemes(plain(p)).filter((c) => c === FIRE).length;
    for (let i = 0; i < 10 && !p.lost; i++) p = tick(p, CLOCK);
    const after = graphemes(plain(p)).filter((c) => c === FIRE).length;
    expect(after > before || p.lost === 'burned').toBe(true);
    // Fire right next to Paul.
    let q = ready();
    q = edit(q, [charOf(FIRE), charOf(EGG), ...q.chars.filter((c) => c.c !== FIRE && c.c !== EGG)]);
    for (let i = 0; i < 40 && !q.lost; i++) q = tick(q, CLOCK);
    expect(q.lost).toBe('burned');
  });

  it('removing Paul loses; Paul eats a bug every 20 s, starves without, and overeats beyond six', () => {
    const p = ready();
    expect(
      edit(
        p,
        p.chars.filter((c) => c.c !== EGG),
      ).lost,
    ).toBe('gone');
    let fed = text(p, solution(p, EGG)!);
    fed = text(fed, solution(fed, CHICKEN)!);
    expect(fed.paul).toBe('chicken');
    const bugs = (x: Pw) => graphemes(plain(x)).filter((c) => c === BUG).length;
    expect(bugs(fed)).toBe(1);
    for (let i = 0; i < 20; i++) fed = tick(fed, CLOCK);
    expect(bugs(fed)).toBe(0);
    for (let i = 0; i < 21 && !fed.lost; i++) fed = tick(fed, CLOCK);
    expect(fed.lost).toBe('starved');
    let many = text(p, solution(p, EGG)!);
    many = text(many, solution(many, CHICKEN)!);
    many = edit(many, [...many.chars, ...Array.from({ length: 7 }, () => charOf(BUG))]);
    expect(many.lost).toBe('overfed');
  });
});

describe('Password Rules environment', () => {
  it('the constructive solver wins episodes, putting out the fire and feeding nobody too much', () => {
    for (const seed of [1, 2, 3]) {
      let s = env.createInitialState({}, seed);
      while (!env.isTerminal(s)) s = env.applyAction(s, solverAction(s));
      expect(s.pw.won, `seed ${seed}: ${s.pw.lost ?? ''} shown ${s.pw.shown}`).toBe(true);
      expect(env.getOutcome(s)!.returns[0]).toBe(RULES.length + 1);
    }
  });
});

describeAdapterContract(env, { configs: [{}], playouts: 2, maxSteps: 2001 });
