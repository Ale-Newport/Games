/**
 * Words that count toward hints in #210 Theme Strands (uppercase, accents removed, Ñ kept).
 * English: the 30,000-word vocabulary of the shared semantic module plus the five-letter words of
 * the word-guess game (Webster's Second International, public domain). Spanish: the Spanish lists
 * already in the project (five-letter words, survey answers, category answers). Simplification: the
 * Spanish list is smaller, so fewer Spanish non-theme words earn hints.
 */
import { EXTRA_CATEGORIES } from '../category-letters/categories';
import { loadWordList } from '../shared/semantic/semantic';
import { SHEETS } from '../shared/survey/sheets';
import { validWords } from '../word-guess/words';

export const fold = (w: string) =>
  w
    .toUpperCase()
    .split('')
    .map((ch) => (ch === 'Ñ' ? ch : ch.normalize('NFD').replace(/\p{Diacritic}/gu, '')))
    .join('');

const usable = (w: string) => /^[A-ZÑ]{4,}$/.test(w);

function spanishWords(): Set<string> {
  const out = new Set<string>();
  for (const w of validWords('es')) out.add(fold(w));
  for (const s of SHEETS)
    for (const band of ['a', 'b', 'c', 'd', 'e', 'f'] as const)
      for (const item of s[band].split(';')) {
        const es = item.split('|')[1] ?? '';
        for (const name of es.split('/')) for (const word of name.split(/\s+/)) out.add(fold(word));
      }
  for (const c of EXTRA_CATEGORIES)
    for (const name of c.es.split(';')) for (const word of name.split(/\s+/)) out.add(fold(word));
  return new Set([...out].filter(usable));
}

const cache = new Map<'en' | 'es', Promise<Set<string>>>();

export function loadDictionary(lang: 'en' | 'es'): Promise<Set<string>> {
  let d = cache.get(lang);
  if (!d) {
    d =
      lang === 'es'
        ? Promise.resolve(spanishWords())
        : loadWordList().then(
            (words) =>
              new Set([...words.map(fold), ...[...validWords('en')].map(fold)].filter(usable)),
          );
    cache.set(lang, d);
  }
  return d;
}
