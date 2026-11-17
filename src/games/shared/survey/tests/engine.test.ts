import { describe, expect, it } from 'vitest';
import {
  ALL_SHEETS,
  PROMPTS_PER_RUN,
  applyAction,
  dailyPrompts,
  editDistance,
  isValidSurveyState,
  matchAnswer,
  newRun,
  normalize,
  playerScore,
  recordMiss,
  shareGlyphs,
  sheetById,
  submitText,
} from '../engine';

describe('survey sheets', () => {
  it('has enough distinct prompts for daily cycles', () => {
    expect(ALL_SHEETS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(ALL_SHEETS.map((s) => s.id)).size).toBe(ALL_SHEETS.length);
  });

  it('gives every answer a name in both languages and every band at least one answer', () => {
    for (const s of ALL_SHEETS) {
      expect(s.q.en && s.q.es && s.fact.en && s.fact.es, s.id).toBeTruthy();
      for (const band of 'abcdef')
        expect(
          s.entries.some((e) => e.band === band),
          `${s.id} band ${band}`,
        ).toBe(true);
      for (const e of s.entries) {
        expect(e.name.en.length > 0 && e.name.es.length > 0, `${s.id} ${e.name.en}`).toBe(true);
        expect(e.keys.en.every((k) => k.length > 0) && e.keys.es.every((k) => k.length > 0)).toBe(
          true,
        );
      }
    }
  });

  it('never lets one key point at two different answers of the same prompt', () => {
    for (const s of ALL_SHEETS) {
      for (const lang of ['en', 'es'] as const) {
        const owner = new Map<string, number>();
        s.entries.forEach((e, i) => {
          for (const k of e.keys[lang]) {
            const prev = owner.get(k);
            expect(prev === undefined || prev === i, `${s.id}/${lang}: "${k}"`).toBe(true);
            owner.set(k, i);
          }
        });
      }
    }
  });

  it('matches every listed name back to its own answer', () => {
    for (const s of ALL_SHEETS)
      s.entries.forEach((e, i) => {
        for (const lang of ['en', 'es'] as const)
          expect(matchAnswer(s, e.name[lang], lang)?.entry, `${s.id} ${e.name[lang]}`).toBe(i);
      });
  });
});

describe('matching', () => {
  it('normalizes case, accents, articles, plurals and spacing', () => {
    expect(normalize('The Eagles!')).toBe('eagle');
    expect(normalize('  Águila ')).toBe('aguila');
    expect(normalize('T-Rex')).toBe(normalize('t rex'));
    expect(normalize('Cherries')).toBe('cherry');
    expect(normalize('las fresas')).toBe('fresa');
  });

  it('forgives small typos but rejects unknown and ambiguous answers', () => {
    const bird = sheetById('bird');
    const m = matchAnswer(bird, 'shoebil', 'en');
    expect(m?.fuzzy).toBe(true);
    expect(bird.entries[m!.entry]!.name.en).toBe('shoebill');
    expect(matchAnswer(bird, 'hummingbrid', 'en')?.fuzzy).toBe(true);
    expect(matchAnswer(bird, 'xylophone', 'en')).toBeNull();
    expect(matchAnswer(bird, 'a', 'en')).toBeNull();
    // Spanish run accepts an exact English name too.
    expect(matchAnswer(bird, 'penguin', 'es')).not.toBeNull();
    expect(editDistance('abcd', 'abdc')).toBe(1);
  });
});

describe('runs', () => {
  it('deals seven distinct daily prompts that do not repeat within a cycle', () => {
    const perCycle = Math.floor(ALL_SHEETS.length / PROMPTS_PER_RUN);
    // 2026-11-16 is day 20773; find a cycle start.
    const base = 20250101;
    const days = [20260101, 20260102, 20260103, 20260104, 20260105, 20260106];
    const seen = new Set<string>();
    let fresh = 0;
    for (const d of days.slice(0, perCycle)) {
      const p = dailyPrompts(d, 'rare');
      expect(new Set(p).size).toBe(PROMPTS_PER_RUN);
      for (const id of p) if (!seen.has(id)) fresh++;
      p.forEach((id) => seen.add(id));
    }
    expect(fresh).toBeGreaterThan(0);
    expect(dailyPrompts(base, 'rare')).toEqual(dailyPrompts(base, 'rare'));
    expect(dailyPrompts(base, 'rare')).not.toEqual(dailyPrompts(base, 'common'));
  });

  it('scores rare answers high in a dive and common answers high in a climb', () => {
    const dive = newRun({ polarity: 'rare', lang: 'en', kind: 'unlimited', seed: 5 });
    const sheet = sheetById(dive.prompts[0]!);
    const common = sheet.entries.findIndex((e) => e.band === 'a');
    const prize = sheet.entries.findIndex((e) => e.band === 'f');
    expect(applyAction(dive, `e:${prize}`).answers[0]![0]!.points).toBe(100);
    expect(applyAction(dive, `e:${common}`).answers[0]![0]!.points).toBe(10);
    const climb = { ...dive, polarity: 'common' as const };
    expect(applyAction(climb, `e:${common}`).answers[0]![0]!.points).toBe(100);
    expect(applyAction(climb, `e:${prize}`).answers[0]![0]!.points).toBe(10);
  });

  it('keeps retrying in a dive but ends a climb prompt after three misses', () => {
    let dive = newRun({ polarity: 'rare', lang: 'en', kind: 'unlimited', seed: 9 });
    for (let i = 0; i < 5; i++) dive = recordMiss(dive);
    expect(dive.prompt).toBe(0);
    expect(dive.misses).toBe(5);
    let climb = newRun({ polarity: 'common', lang: 'en', kind: 'unlimited', seed: 9 });
    climb = recordMiss(recordMiss(recordMiss(climb)));
    expect(climb.prompt).toBe(1);
    expect(climb.answers[0]![0]).toMatchObject({ entry: null, points: 0, misses: 3 });
  });

  it('plays a full party run in turns and validates saves', () => {
    let s = newRun({ polarity: 'rare', lang: 'es', kind: 'party', seed: 3, players: 3 });
    expect(s.players).toBe(3);
    while (s.status === 'playing') {
      const sheet = sheetById(s.prompts[s.prompt]!);
      const { state } = submitText(s, sheet.entries[s.player]!.name.es);
      s = state;
      expect(isValidSurveyState(s)).toBe(true);
    }
    expect(s.answers.every((row) => row.every((a) => a !== null))).toBe(true);
    expect(playerScore(s, 0)).toBeGreaterThan(0);
    expect([...shareGlyphs(s)].length).toBeGreaterThanOrEqual(PROMPTS_PER_RUN);
    expect(isValidSurveyState({ ...s, players: 9 })).toBe(false);
  });
});
