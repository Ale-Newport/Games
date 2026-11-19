import { describe, expect, it } from 'vitest';
import { paint, PH, PW } from '../painter';
import { SCENES, YEAR_MAX, YEAR_MIN, type Scene } from '../scenes';

/** The flag images the panorama can draw (the same set `flagUrl` loads). */
const FLAG_FILES = new Set(
  Object.keys(import.meta.glob('../../../../node_modules/flag-icons/flags/4x3/*.svg')).map((k) =>
    k.slice(-6, -4).toUpperCase(),
  ),
);

/** The year each country's present flag (as drawn from `flag-icons`) was first flown. */
const FLAG_SINCE: Record<string, number> = {
  AE: 1971,
  AR: 1861,
  AU: 1908,
  BD: 1972,
  BO: 1851,
  BR: 1992,
  CA: 1965,
  CL: 1817,
  CN: 1949,
  CO: 1861,
  CU: 1902,
  CZ: 1920,
  DE: 1949,
  EC: 1900,
  ES: 1981,
  ET: 1996,
  FJ: 1970,
  FR: 1830,
  GB: 1801,
  GE: 2004,
  GR: 1978,
  GT: 1871,
  ID: 1945,
  IN: 1947,
  IS: 1944,
  IT: 1946,
  JP: 1870,
  KE: 1963,
  KH: 1993,
  KR: 1949,
  LB: 1943,
  MA: 1915,
  ML: 1961,
  MM: 2010,
  MN: 1992,
  MX: 1968,
  MY: 1963,
  NE: 1959,
  NG: 1960,
  NL: 1937,
  NO: 1821,
  NP: 1962,
  NZ: 1902,
  PE: 1950,
  PH: 1898,
  PL: 1919,
  PT: 1911,
  SN: 1960,
  TH: 1917,
  TN: 1831,
  TR: 1844,
  TZ: 1964,
  US: 1960,
  UY: 1830,
  VN: 1976,
  ZA: 1994,
};

/** Silhouettes of buildings that did not exist before a given year. */
const LANDMARK_SINCE: Partial<Record<Scene['landmark'], number>> = {
  'lattice-tower': 1889,
  supertall: 1931,
  'needle-tower': 1956,
  'stepped-spire': 1928,
  'arch-bridge': 1932,
  'twin-towers': 1998,
  'shell-roofs': 1973,
  wall: 1961,
};

const SCRIPT_RE: Record<Scene['script'], RegExp> = {
  latin: /^[\p{Script=Latin}0-9 &'.-]+$/u,
  cyrillic: /^[\p{Script=Cyrillic} ]+$/u,
  arabic: /^[\p{Script=Arabic} ]+$/u,
  han: /^\p{Script=Han}+$/u,
  japanese: /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u,
  korean: /^\p{Script=Hangul}+$/u,
  thai: /^\p{Script=Thai}+$/u,
  devanagari: /^[\p{Script=Devanagari} ]+$/u,
  greek: /^\p{Script=Greek}+$/u,
  hebrew: /^\p{Script=Hebrew}+$/u,
  georgian: /^\p{Script=Georgian}+$/u,
  armenian: /^\p{Script=Armenian}+$/u,
  ethiopic: /^[\p{Script=Ethiopic} ]+$/u,
  bengali: /^\p{Script=Bengali}+$/u,
  tamil: /^\p{Script=Tamil}+$/u,
  khmer: /^\p{Script=Khmer}+$/u,
  burmese: /^\p{Script=Myanmar}+$/u,
};

/** A 2D context that records nothing but checks every coordinate it is given. */
function checkingContext(bad: string[]): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => undefined };
  const state: Record<string, unknown> = {};
  let calls = 0;
  const ctx = new Proxy(state, {
    get(target, key: string) {
      if (key === 'calls') return calls;
      if (key in target) return target[key];
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      if (key === 'measureText') return (t: string) => ({ width: t.length * 9 });
      return (...args: unknown[]) => {
        calls++;
        for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) bad.push(key);
      };
    },
    set(target, key: string, value) {
      target[key] = value;
      return true;
    },
  });
  return ctx as unknown as CanvasRenderingContext2D;
}

describe('When & Where scene deck', () => {
  it('has over 80 distinct scenes, each in range and named after its year', () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(80);
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    for (const s of SCENES) {
      expect(s.id).toMatch(new RegExp(`^[a-z]+-${s.year}$`));
      expect(s.year).toBeGreaterThanOrEqual(YEAR_MIN);
      expect(s.year).toBeLessThanOrEqual(YEAR_MAX);
      expect(Math.abs(s.lat)).toBeLessThan(90);
      expect(Math.abs(s.lon)).toBeLessThanOrEqual(180);
      expect(s.en.length).toBeGreaterThan(0);
      expect(s.es.length).toBeGreaterThan(0);
    }
  });

  it('spreads across every inhabited continent and every era', () => {
    const decades = new Set(SCENES.map((s) => Math.floor(s.year / 10) * 10));
    for (let d = 1850; d <= 2020; d += 10) expect(decades.has(d), `${d}s`).toBe(true);
    const south = SCENES.filter((s) => s.lat < 0).length;
    expect(south).toBeGreaterThanOrEqual(20);
    const oceania = SCENES.filter((s) => s.lon > 110 && s.lat < -10).length;
    expect(oceania).toBeGreaterThanOrEqual(5);
  });

  it('writes every sign in the scene’s script', () => {
    for (const s of SCENES) {
      expect(s.signs.length, s.id).toBeGreaterThan(1);
      for (const sign of s.signs) expect(sign, `${s.id}: ${sign}`).toMatch(SCRIPT_RE[s.script]);
    }
  });

  it('flies a flag only where the present one had been adopted, and has a flag image', () => {
    for (const s of SCENES) {
      expect(FLAG_FILES.has(s.iso2), `${s.id} flag file`).toBe(true);
      if (!s.flag) continue;
      const since = FLAG_SINCE[s.iso2];
      expect(since, `${s.id}: adoption year of the ${s.iso2} flag`).toBeDefined();
      expect(s.year, `${s.id} flag`).toBeGreaterThanOrEqual(since!);
    }
  });

  it('shows no landmark before it was built', () => {
    for (const s of SCENES) {
      const since = LANDMARK_SINCE[s.landmark];
      if (since) expect(s.year, `${s.id} ${s.landmark}`).toBeGreaterThanOrEqual(since);
    }
    expect(SCENES.filter((s) => s.landmark === 'wall').every((s) => s.year <= 1989)).toBe(true);
  });

  it('uses every style, landmark, script and extra the painter can draw', () => {
    const used = (f: (s: Scene) => string[]) => new Set(SCENES.flatMap(f));
    const styles = used((s) => [s.style]);
    const landmarks = used((s) => [s.landmark]);
    const scripts = used((s) => [s.script]);
    const extras = used((s) => s.extras);
    for (const v of ['frontier', 'ironlace', 'towerhouse']) expect(styles.has(v), v).toBe(true);
    for (const v of [
      'snow-peak',
      'mud-mosque',
      'stupa',
      'khmer-towers',
      'gopuram',
      'twin-towers',
      'suspension-bridge',
      'arch-bridge',
      'moai',
      'drum-church',
      'obelisk',
      'stepped-spire',
    ])
      expect(landmarks.has(v), v).toBe(true);
    for (const v of Object.keys(SCRIPT_RE)) expect(scripts.has(v), v).toBe(true);
    for (const v of ['aerial-lift', 'jeepney', 'yurts']) expect(extras.has(v), v).toBe(true);
  });

  it('paints every scene with finite coordinates', () => {
    expect(PW).toBe(3600);
    expect(PH).toBe(640);
    for (const s of SCENES) {
      const bad: string[] = [];
      const ctx = checkingContext(bad);
      expect(() => paint(ctx, s, s.flag ? ({} as HTMLImageElement) : null), s.id).not.toThrow();
      expect(bad, s.id).toEqual([]);
      expect((ctx as unknown as { calls: number }).calls, s.id).toBeGreaterThan(300);
    }
  });
});
