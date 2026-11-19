/**
 * Code Words bots, reasoning with the shared word vectors of the board's language.
 * Spymaster: among frequent words that are not on the board, find the clue that is closer to the
 * most of its team's words than to any word it must avoid (enemy agents, bystanders, and above all
 * the assassin), by a safety margin. Operative: touch the unrevealed words most similar to the clue,
 * stopping when the similarity drops.
 */
import { lookup, similarity, type Vectors } from '../shared/semantic/semantic';
import { clueProblem, type CodeState, type Team } from './engine';

export interface SpymasterSkill {
  /** Candidate clue words scanned (most frequent first). */
  vocabulary: number;
  /** Required gap between the clue's similarity to its targets and to any word to avoid. */
  margin: number;
  maxNumber: number;
}

export const SKILLS: Record<'easy' | 'normal' | 'hard', SpymasterSkill> = {
  easy: { vocabulary: 3000, margin: 0.1, maxNumber: 2 },
  normal: { vocabulary: 8000, margin: 0.06, maxNumber: 3 },
  hard: { vocabulary: 15000, margin: 0.04, maxNumber: 4 },
};

export function spymasterClue(
  v: Vectors,
  s: CodeState,
  team: Team,
  skill: SpymasterSkill,
): { word: string; number: number; targets: number[] } {
  const open = s.words.map((_, i) => i).filter((i) => !s.revealed[i]);
  const rows = new Map(open.map((i) => [i, lookup(v, s.words[i]!)]));
  const own = open.filter((i) => s.roles[i] === team);
  const avoid = open.filter((i) => s.roles[i] !== team);
  let best = { word: '', number: 0, targets: [] as number[], score: -Infinity };
  const isWord = (w: string) => v.index.has(w);
  for (let c = 0; c < Math.min(skill.vocabulary, v.words.length); c++) {
    const cw = v.words[c]!;
    if (cw.length < 3 || clueProblem(s, cw, 1, isWord)) continue;
    const sim = (i: number) => {
      const r = rows.get(i);
      return r === null || r === undefined ? 0 : similarity(v, c, r);
    };
    // The danger line: the closest word to avoid, with the assassin weighted heavier.
    let danger = -1;
    for (const i of avoid)
      danger = Math.max(
        danger,
        sim(i) + (s.roles[i] === 'assassin' ? 0.08 : s.roles[i] === 'bystander' ? -0.02 : 0),
      );
    const ranked = own.map((i) => [i, sim(i)] as const).sort((a, b) => b[1] - a[1]);
    const targets = ranked.filter(([, x]) => x > danger + skill.margin).slice(0, skill.maxNumber);
    if (!targets.length) continue;
    const weakest = targets.at(-1)![1];
    const score = targets.length * 10 + (weakest - danger) * 5 + weakest;
    if (score > best.score)
      best = { word: cw, number: targets.length, targets: targets.map(([i]) => i), score };
  }
  if (!best.word) {
    // Nothing safe: point at the single closest own word with the best word that is legal.
    return {
      word:
        v.words.find((w) => w.length >= 3 && !clueProblem(s, w, 1, isWord)) ??
        (v.lang === 'es' ? 'cosa' : 'thing'),
      number: 1,
      targets: own.slice(0, 1),
    };
  }
  return { word: best.word, number: best.number, targets: best.targets };
}

/** The operative's next touch for the current clue, or null to stop. */
export function operativeGuess(v: Vectors, s: CodeState, caution: number): number | null {
  if (!s.clue) return null;
  const c = lookup(v, s.clue.word);
  const open = s.words.map((_, i) => i).filter((i) => !s.revealed[i]);
  const scored = open
    .map((i) => {
      const r = lookup(v, s.words[i]!);
      return [i, c === null || r === null ? 0 : similarity(v, c, r)] as const;
    })
    .sort((a, b) => b[1] - a[1]);
  const [best, sim] = scored[0] ?? [null, 0];
  if (best === null) return null;
  // The first touch always happens; later ones only while the link is strong enough and the
  // clue's number has not been used up (the +1 bonus is taken only when confident).
  if (s.guessedThisTurn === 0) return best;
  if (s.guessedThisTurn >= s.clue.number && sim < caution + 0.15) return null;
  return sim >= caution ? best : null;
}
