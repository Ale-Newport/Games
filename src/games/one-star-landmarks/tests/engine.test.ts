import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, consistent, DATA, env, observe } from '../ai-adapter';
import {
  bearing,
  closeness,
  compassOf,
  current,
  DAILY_ROUNDS,
  distanceKm,
  finish,
  fold,
  giveUp,
  guess,
  hintFor,
  isSession,
  linesShown,
  MAX_GUESSES,
  newDaily,
  newEndless,
  next,
  placeAt,
  pool,
  POINTS,
  REGIONS,
  search,
  shareText,
  type Session,
} from '../engine';
import { REVIEWS } from '../reviews';

const idx = (en: string) => DATA.findIndex((r) => r[1] === en);
const place = (en: string) => placeAt(DATA, idx(en));

describe('data and reviews', () => {
  it('every reviewed place has Wikidata coordinates and names, and every place has a review', () => {
    expect(DATA.length).toBe(Object.keys(REVIEWS).length);
    expect(DATA.length).toBeGreaterThanOrEqual(130);
    for (const [qid, en, es, lat, lon, region, fame] of DATA) {
      expect(qid).toMatch(/^Q\d+$/);
      expect(en.length).toBeGreaterThan(2);
      expect(es.length).toBeGreaterThan(2);
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(lon)).toBeLessThanOrEqual(180);
      expect(REGIONS).toContain(region);
      expect(fame).toBeGreaterThan(20);
    }
    expect(new Set(DATA.map((r) => r[0])).size).toBe(DATA.length);
  });

  it('each review has three lines per language and never names its place or country', () => {
    for (const [qid, en, es] of DATA) {
      const r = REVIEWS[qid]!;
      expect(r.en).toHaveLength(3);
      expect(r.es).toHaveLength(3);
      const text = fold([...r.en, ...r.es].join(' '));
      // The distinctive words of the name (not “tower”, “palace”…) must not appear.
      const common = new Set(
        'the of and de la el del los las great mount monte tower torre palace palacio bridge puente castle castillo national park parque nacional museum museo cathedral catedral square plaza falls cataratas lake lago lakes lagos island isla gate puerta wall muro gran valley valle kings reyes st san sea mar dead muerto building edificio city ciudad temple templo museu sign chapel capilla basilica basilica stadium estadio de arc arco gallery galeria fountain fontana house opera abbey abadia new little sirenita glacier glaciar strip lines lineas giant gigante causeway calzada mountain montana table mesa tunnel cliffs acantilados monasterio arch towers torres harbour bahia'.split(
          ' ',
        ),
      );
      for (const name of [en, es])
        for (const w of fold(name).split(' '))
          if (w.length > 3 && !common.has(w))
            expect(text, `${en}: “${w}”`).not.toMatch(new RegExp(`\\b${w}\\b`));
      for (const c of r.country.flatMap((x) => x.split('/')))
        expect(text, `${en}: country`).not.toMatch(new RegExp(`\\b${fold(c)}\\b`));
    }
  });

  it('places sit where they should', () => {
    const near = (en: string, lat: number, lon: number) => {
      const p = place(en);
      expect(Math.abs(p.lat - lat), en).toBeLessThan(0.5);
      expect(Math.abs(p.lon - lon), en).toBeLessThan(0.5);
    };
    near('Eiffel Tower', 48.858, 2.294);
    near('Statue of Liberty', 40.689, -74.045);
    near('Sydney Opera House', -33.857, 151.215);
    near('Machu Picchu', -13.163, -72.545);
    near('Alhambra', 37.176, -3.588);
  });
});

describe('distance and direction', () => {
  it('measures great-circle distance, bearing and closeness', () => {
    const paris = place('Eiffel Tower');
    const london = place('Big Ben');
    expect(distanceKm(paris, london)).toBeGreaterThan(330);
    expect(distanceKm(paris, london)).toBeLessThan(350);
    expect(compassOf(bearing(paris, london))).toBe('NW');
    expect(compassOf(bearing(london, paris))).toBe('SE');
    expect(compassOf(bearing(place('Statue of Liberty'), place('Christ the Redeemer')))).toBe('SE');
    expect(compassOf(0)).toBe('N');
    expect(compassOf(359)).toBe('N');
    expect(compassOf(91)).toBe('E');
    expect(closeness(0)).toBe(100);
    expect(closeness(20_015)).toBe(0);
    expect(closeness(10_007)).toBe(50);
    const h = hintFor(DATA, idx('Eiffel Tower'), idx('Big Ben'));
    expect(h).toMatchObject({ compass: 'NW', closeness: 98 });
  });
});

describe('rounds and sessions', () => {
  it('a hit scores by guess number; misses reveal lines; five misses lose', () => {
    let s = newEndless(DATA, 3, 'hard', 'all', new Set(), 3);
    const target = current(s).target;
    const others = DATA.map((_, i) => i).filter((i) => i !== target);
    expect(linesShown(0)).toBe(1);
    s = guess(s, DATA, others[0]!);
    expect(observe(s).lines.en).toHaveLength(2);
    expect(() => guess(s, DATA, others[0]!)).toThrow('Already');
    s = guess(s, DATA, target);
    expect(current(s)).toMatchObject({ status: 'won', score: POINTS[1] });
    expect(s.total).toBe(75);
    s = next(s, DATA);
    const t2 = current(s).target;
    for (const g of DATA.map((_, i) => i)
      .filter((i) => i !== t2)
      .slice(0, MAX_GUESSES))
      s = guess(s, DATA, g);
    expect(current(s)).toMatchObject({ status: 'lost', score: 0 });
    expect(
      observe({ ...s, rounds: [...s.rounds.slice(0, -1), { ...current(s), status: 'playing' }] })
        .lines.en,
    ).toHaveLength(3);
    s = next(s, DATA);
    s = giveUp(s);
    expect(current(s)).toMatchObject({ status: 'lost', score: 0 });
    expect(s.status).toBe('done');
    expect(s.count).toBe(3);
    expect(() => guess(s, DATA, 0)).toThrow();
  });

  it('the daily is five places, the same for everyone, never two in a row from one region', () => {
    const a = newDaily(DATA, 300);
    expect(a).toEqual(newDaily(DATA, 300));
    let s: Session = a;
    const regions: string[] = [];
    for (let i = 0; i < DAILY_ROUNDS; i++) {
      regions.push(DATA[current(s).target]![5]);
      s = guess(s, DATA, current(s).target);
      if (i < DAILY_ROUNDS - 1) s = next(s, DATA);
    }
    for (let i = 1; i < regions.length; i++) expect(regions[i]).not.toBe(regions[i - 1]);
    expect(s.total).toBe(500);
    expect(shareText(s, 'One-Star')).toBe('One-Star #301 — 500/500\n🟩\n🟩\n🟩\n🟩\n🟩');
  });

  it('pools follow difficulty and region; endless runs avoid repeats, validate and end', () => {
    expect(pool(DATA, 'easy', 'all').length).toBeLessThan(pool(DATA, 'normal', 'all').length);
    expect(pool(DATA, 'hard', 'all')).toHaveLength(DATA.length);
    expect(pool(DATA, 'easy', 'all')).toContain(idx('Eiffel Tower'));
    for (const r of REGIONS) {
      const p = pool(DATA, 'normal', r);
      expect(p.length, r).toBeGreaterThan(5);
      for (const i of p) expect(DATA[i]![5]).toBe(r);
    }
    let s = newEndless(DATA, 8, 'normal', 'europe');
    const seen = new Set<number>();
    for (let i = 0; i < 10; i++) {
      expect(seen.has(current(s).target)).toBe(false);
      seen.add(current(s).target);
      s = giveUp(s);
      s = next(s, DATA);
    }
    expect(isSession(JSON.parse(JSON.stringify(s)), DATA)).toBe(true);
    expect(isSession({ ...s, region: 'mars' })).toBe(false);
    expect(
      isSession(
        { ...s, rounds: [{ target: 999, guesses: [], status: 'playing', score: null }] },
        DATA,
      ),
    ).toBe(false);
    s = finish(s);
    expect(s.count).toBe(10);
  });

  it('search matches either language, ignoring accents and case', () => {
    expect(search(DATA, 'eiffel').map((i) => DATA[i]![1])).toEqual(['Eiffel Tower']);
    expect(search(DATA, 'torre eiff').map((i) => DATA[i]![1])).toEqual(['Eiffel Tower']);
    expect(search(DATA, 'iguazu').map((i) => DATA[i]![1])).toEqual(['Iguaçu Falls']);
    expect(search(DATA, 'TAJ')[0]).toBe(idx('Taj Mahal'));
    expect(search(DATA, 'tower', new Set([idx('Eiffel Tower')]))).not.toContain(
      idx('Eiffel Tower'),
    );
    expect(search(DATA, 'zzzz')).toEqual([]);
    expect(search(DATA, '   ')).toEqual([]);
  });
});

describe('AI', () => {
  it('the consistent set always holds the answer', () => {
    for (let seed = 1; seed <= 30; seed++) {
      let s = newEndless(DATA, seed, 'hard', 'all', new Set(), 1);
      const target = current(s).target;
      const rng = new Rng(seed);
      while (s.status === 'playing') {
        const c = consistent(observe(s));
        expect(c).toContain(target);
        const options = DATA.map((_, i) => i).filter(
          (i) => !current(s).guesses.includes(i) && i !== target,
        );
        s = guess(s, DATA, rng.pick(options));
        if (current(s).status !== 'playing') break;
      }
    }
  });

  it('the review reader beats the triangulator, which beats random', () => {
    const avg = (id: string) => {
      let sum = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState(undefined, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(s)) s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / 40;
    };
    const tri = avg('triangulate');
    expect(tri).toBeGreaterThan(avg('random') + 200);
    expect(avg('reader')).toBeGreaterThan(tri);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', region: 'americas', rounds: 2 }],
  playouts: 3,
  maxSteps: 30,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual(['guessed', 'hints', 'lines', 'round', 'total']);
    expect(JSON.stringify(o)).not.toContain(DATA[current(s).target]![0]);
  },
});
