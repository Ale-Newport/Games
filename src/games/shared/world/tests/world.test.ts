import { describe, expect, it } from 'vitest';
import {
  COUNTRIES,
  arrowFor,
  bearing,
  borderDistance,
  country,
  flagUrl,
  haversine,
  loadShapes,
  matchCapital,
  matchCountry,
} from '../world';

describe('world data', () => {
  it('lists every country once with names, capital and facts', () => {
    expect(COUNTRIES.length).toBe(199);
    expect(new Set(COUNTRIES.map((c) => c.iso2)).size).toBe(199);
    for (const c of COUNTRIES) {
      expect(c.name.en && c.name.es && c.capital.en && c.capital.es, c.iso2).toBeTruthy();
      expect(c.population, c.iso2).toBeGreaterThan(0);
      expect(c.area, c.iso2).toBeGreaterThan(0);
    }
  });

  it('never gives two countries the same accepted name', () => {
    for (const lang of ['en', 'es'] as const) {
      const owner = new Map<string, string>();
      for (const c of COUNTRIES)
        for (const k of c.keys[lang]) {
          const prev = owner.get(k);
          expect(
            prev === undefined || prev === c.iso2,
            `${lang} "${k}": ${prev} vs ${c.iso2}`,
          ).toBe(true);
          owner.set(k, c.iso2);
        }
    }
  });

  it('matches names, aliases and small typos in both languages', () => {
    for (const c of COUNTRIES) {
      expect(matchCountry(c.name.en, 'en')?.iso2, c.name.en).toBe(c.iso2);
      expect(matchCountry(c.name.es, 'es')?.iso2, c.name.es).toBe(c.iso2);
    }
    expect(matchCountry('usa', 'en')?.iso2).toBe('US');
    expect(matchCountry('EEUU', 'es')?.iso2).toBe('US');
    expect(matchCountry('Congo', 'en')?.iso2).toBe('CG');
    expect(matchCountry('Argentinna', 'en')?.iso2).toBe('AR');
    expect(matchCountry('Ira', 'en')).toBeNull();
    expect(matchCapital('Canberra', 'en', COUNTRIES)?.iso2).toBe('AU');
    expect(matchCapital('Pekín', 'es', COUNTRIES)?.iso2).toBe('CN');
  });

  it('computes distances, bearings and arrows', () => {
    const madrid: [number, number] = [-3.7, 40.4];
    const paris: [number, number] = [2.35, 48.86];
    expect(haversine(madrid, paris)).toBeGreaterThan(1000);
    expect(haversine(madrid, paris)).toBeLessThan(1100);
    expect(arrowFor(bearing(madrid, paris))).toBe('↗️');
    expect(arrowFor(bearing(paris, madrid))).toBe('↙️');
  });

  it('loads shapes with sensible centroids and border distances', async () => {
    const shapes = await loadShapes();
    expect(shapes.features.size).toBe(199);
    const es = shapes.centroid.get('ES')!;
    expect(es[0]).toBeGreaterThan(-6);
    expect(es[0]).toBeLessThan(-1);
    expect(borderDistance(shapes, 'ES', 'FR')).toBe(0);
    expect(borderDistance(shapes, 'ES', 'IT')).toBeGreaterThan(200);
    expect(haversine(shapes.centroid.get('FR')!, [2.5, 46.5])).toBeLessThan(300);
    expect(country('FR').continent).toBe('eu');
  });

  it('has a flag for every country', async () => {
    for (const c of COUNTRIES) await expect(flagUrl(c.iso2)).resolves.toMatch(/svg/);
  });
});

describe('precomputed geography', () => {
  it('knows neighbours, distances and centroids', async () => {
    const { borderKm, centroidKm, centroidOf } = await import('../world');
    expect(borderKm('ES', 'FR')).toBe(0);
    expect(borderKm('ES', 'PT')).toBe(0);
    expect(borderKm('US', 'CA')).toBe(0);
    expect(borderKm('ES', 'IT')).toBeGreaterThan(200);
    expect(borderKm('ES', 'IT')).toBe(borderKm('IT', 'ES'));
    expect(borderKm('AU', 'NZ')).toBeGreaterThan(500); // Macquarie Island to the Auckland Islands
    expect(centroidKm('ES', 'FR')).toBeGreaterThan(500);
    expect(centroidKm('ES', 'FR')).toBeLessThan(1000);
    expect(centroidOf('BR')[1]).toBeLessThan(0);
  });
});
