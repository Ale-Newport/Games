/**
 * How Draw Telephone bots play: they write sentences from templates around a drawable subject,
 * describe drawings with the doodle recognizer's best guess, and draw a sentence by picking the
 * drawable subject closest in meaning to its words (shared word vectors) and replaying a real
 * human doodle of it (Quick Draw, CC BY 4.0).
 */
import type { Rng } from '../../core/game-engine/random';
import { CLASSES, classify, type Model, type Stroke } from '../shared/doodle/doodle';
import { CLASS_NAMES } from '../shared/doodle/words';
import { lookup, similarity, type Vectors } from '../shared/semantic/semantic';

const name = (cls: string, lang: 'en' | 'es') => {
  const [en = '', es = ''] = CLASS_NAMES[cls]!.split('|');
  return (lang === 'en' ? en : es).split('/')[0]!;
};

const TEMPLATES: Record<'en' | 'es', string[]> = {
  en: [
    'a {x} on holiday',
    'a giant {x}',
    'a tiny {x} in the rain',
    'a {x} at night',
    'a {x} having lunch',
    'a {x} in space',
    'a happy {x}',
    'a {x} on fire',
  ],
  // Spanish: no article and only adjectives that do not change with gender.
  es: [
    '{x} de vacaciones',
    '{x} gigante',
    '{x} bajo la lluvia',
    '{x} de noche',
    '{x} en el espacio',
    '{x} feliz',
    '{x} en la playa',
    '{x} con sombrero',
  ],
};

export function botSentence(lang: 'en' | 'es', rng: Rng): { text: string; subject: string } {
  const subject = rng.pick(CLASSES);
  const t = rng.pick(TEMPLATES[lang]).replace('{x}', name(subject, lang));
  return { text: t.charAt(0).toUpperCase() + t.slice(1), subject };
}

export function botDescribe(
  model: Model,
  strokes: readonly Stroke[],
  lang: 'en' | 'es',
  rng: Rng,
): string {
  if (!strokes.length) return lang === 'en' ? 'an empty page' : 'una página en blanco';
  const [top, second] = classify(model, strokes, 2);
  const pick = second && top!.p < 0.4 && rng.chance(0.3) ? second : top!;
  const n = name(pick.label, lang);
  return lang === 'en' ? `a ${n}` : n.charAt(0).toUpperCase() + n.slice(1);
}

/** The drawable subject a sentence is most about: a named class, else the nearest by meaning. */
export function subjectOf(text: string, vectors: Vectors | null, rng: Rng): string {
  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .split(/[^a-z]+/)
    .filter((w) => w.length > 1);
  const joined = ` ${words.join(' ')} `;
  for (const cls of CLASSES) {
    const all = CLASS_NAMES[cls]!.split(/[|/]/);
    for (const n of all) {
      const k = n
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
      if (joined.includes(` ${k} `) || joined.includes(` ${k}s `)) return cls;
    }
  }
  if (vectors) {
    let best = '';
    let score = -1;
    const rows = words.map((w) => lookup(vectors, w)).filter((x): x is number => x !== null);
    for (const cls of CLASSES) {
      const r = lookup(vectors, cls.split(' ').at(-1)!);
      if (r === null) continue;
      for (const w of rows) {
        const s = similarity(vectors, w, r);
        if (s > score) {
          score = s;
          best = cls;
        }
      }
    }
    if (best) return best;
  }
  return rng.pick(CLASSES);
}

export function botDraw(
  text: string,
  doodles: Record<string, Stroke[][]>,
  vectors: Vectors | null,
  rng: Rng,
): Stroke[] {
  const cls = subjectOf(text, vectors, rng);
  const list = doodles[cls] ?? [];
  return list.length ? rng.pick(list) : [];
}
