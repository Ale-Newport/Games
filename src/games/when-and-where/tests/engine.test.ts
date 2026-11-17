import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { clueAction, env } from '../ai-adapter';
import {
  currentScene,
  finished,
  haversineKm,
  newPlay,
  placeScore,
  ROUNDS,
  submit,
  total,
  yearScore,
} from '../engine';
import { eraOf } from '../era';
import { SCENES, YEAR_MAX, YEAR_MIN } from '../scenes';

describe('When & Where scenes', () => {
  it('every scene is in range, with signs, and unique', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    expect(SCENES.length).toBeGreaterThanOrEqual(30);
    for (const s of SCENES) {
      expect(s.year).toBeGreaterThanOrEqual(YEAR_MIN);
      expect(s.year).toBeLessThanOrEqual(YEAR_MAX);
      expect(Math.abs(s.lat)).toBeLessThan(90);
      expect(Math.abs(s.lon)).toBeLessThanOrEqual(180);
      expect(s.signs.length).toBeGreaterThan(0);
    }
  });

  it('eras follow the year', () => {
    expect(eraOf(1890)).toMatchObject({
      vehicle: 'carriage',
      lamp: 'gas',
      clothing: 'victorian',
      antennas: false,
    });
    expect(eraOf(1960)).toMatchObject({ vehicle: 'rounded', antennas: true, dishes: false });
    expect(eraOf(2015)).toMatchObject({
      vehicle: 'modern',
      phones: true,
      dishes: true,
      lamp: 'led',
    });
  });
});

describe('When & Where scoring', () => {
  it('scores distance and years', () => {
    expect(haversineKm(48.86, 2.35, 51.5, -0.12)).toBeGreaterThan(330);
    expect(haversineKm(48.86, 2.35, 51.5, -0.12)).toBeLessThan(360);
    expect(placeScore(10)).toBe(5000);
    expect(placeScore(1000)).toBeLessThan(placeScore(100));
    expect(placeScore(20000)).toBeLessThan(10);
    expect(yearScore(0)).toBe(5000);
    expect(yearScore(5)).toBeGreaterThan(3000);
    expect(yearScore(-40)).toBeLessThan(200);
  });

  it('plays five rounds; a perfect guess scores 10,000 and no pin scores no place points', () => {
    let p = newPlay(4, 0);
    const s = currentScene(p)!;
    p = submit(p, { lat: s.lat, lon: s.lon, year: s.year });
    expect(p.results[0]).toMatchObject({ place: 5000, when: 5000 });
    p = submit(p, { lat: null, lon: null, year: 3000 });
    expect(p.results[1]!.place).toBe(0);
    expect(p.results[1]!.guess.year).toBe(YEAR_MAX);
    while (!finished(p)) p = submit(p, { lat: 0, lon: 0, year: 1900 });
    expect(p.results).toHaveLength(ROUNDS);
    expect(total(p)).toBeGreaterThanOrEqual(10000);
  });
});

describe('When & Where environment', () => {
  it('the clue reader beats random pins', () => {
    let reader = 0;
    for (let seed = 1; seed <= 10; seed++) {
      let r = env.createInitialState({}, seed);
      while (!env.isTerminal(r)) r = env.applyAction(r, clueAction(r));
      reader += total(r.play);
    }
    expect(reader / 10).toBeGreaterThan(20000);
  });
});

describeAdapterContract(env, { configs: [{}], playouts: 2, maxSteps: 11 });
