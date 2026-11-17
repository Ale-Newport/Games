import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env, reasonerAction } from '../ai-adapter';
import {
  answer,
  judge,
  learn,
  newSession,
  probabilities,
  undo,
  type Answer,
  type Session,
} from '../engine';
import { DOMAIN_IDS, DOMAINS } from '../knowledge';

/** Play a whole game answering honestly for `target`. */
function play(domain: (typeof DOMAIN_IDS)[number], target: string, noise = 0) {
  const e = DOMAINS[domain].entities.find((x) => x.id === target)!;
  let s: Session = newSession(domain);
  let k = 0;
  while (s.phase === 'asking' || s.phase === 'guessing') {
    if (s.phase === 'guessing') s = judge(s, s.guess === target);
    else {
      let a: Answer = e.tags.includes(s.question!) ? 'yes' : 'no';
      if (noise && k++ % noise === noise - 1) a = 'unknown';
      s = answer(s, a);
    }
  }
  return s;
}

describe('Mind Reader knowledge', () => {
  it('every tag used is a question, and no two entities share the same answers', () => {
    for (const id of DOMAIN_IDS) {
      const d = DOMAINS[id];
      const qs = new Set(d.questions.map((q) => q.id));
      const seen = new Map<string, string>();
      for (const e of d.entities) {
        for (const t of e.tags) expect(qs.has(t), `${e.id}: ${t}`).toBe(true);
        const key = [...e.tags].sort().join(',');
        expect(seen.get(key), `${e.id} = ${seen.get(key)}`).toBeUndefined();
        seen.set(key, e.id);
      }
      expect(d.entities.length).toBeGreaterThan(45);
    }
  });
});

describe('Mind Reader reasoning', () => {
  it('guesses every entity when answered honestly', () => {
    const lengths: number[] = [];
    for (const id of DOMAIN_IDS)
      for (const e of DOMAINS[id].entities) {
        const s = play(id, e.id);
        expect(s.phase, `${id}/${e.id}`).toBe('won');
        lengths.push(s.answers.length);
      }
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    expect(avg).toBeLessThan(16);
  });

  it('copes with some unknown answers', () => {
    let won = 0;
    const all = DOMAINS.animals.entities;
    for (const e of all) if (play('animals', e.id, 4).phase === 'won') won++;
    expect(won / all.length).toBeGreaterThan(0.8);
  });

  it('undo returns to the previous question; learning shifts the odds', () => {
    let s = newSession('objects');
    const first = s.question;
    s = answer(s, 'yes');
    s = undo(s);
    expect(s.question).toBe(first);
    expect(s.answers).toHaveLength(0);
    // Someone keeps saying "yes, it is a pet" about a fox: the fox becomes more likely for that answer.
    const base = newSession('animals');
    const asked = { ...base, answers: [{ q: 'pet', a: 'yes' as Answer }] };
    let learned = {};
    for (let i = 0; i < 5; i++) learned = learn(learned, asked, 'fox');
    expect(probabilities(asked, learned).get('fox')!).toBeGreaterThan(
      probabilities(asked).get('fox')! * 3,
    );
  });
});

describe('Mind Reader environment', () => {
  it('the reasoner finds the secret quickly', () => {
    let total = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let h = env.createInitialState({}, seed);
      while (!env.isTerminal(h)) h = env.applyAction(h, reasonerAction(h));
      expect(h.won).toBe(true);
      total += env.getOutcome(h)!.returns[0]!;
    }
    expect(total / 30).toBeGreaterThan(0.7);
  });
});

describeAdapterContract(env, { configs: [{ domain: 'animals' }, {}], playouts: 2, maxSteps: 60 });
