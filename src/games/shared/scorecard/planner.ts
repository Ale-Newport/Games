/**
 * The scorecard dice planner: for the player to move it plans the whole turn exactly (which dice to
 * keep after each roll, when to stand) for the game's hand value, then scores the best box. A
 * simpler player keeps the most common face and scores the box that pays most now.
 */
import { countsOf, planTurn, type Counts, type TurnPlan } from './turn';
import { handOf, legalActions, maskFor, type Card, type DiceGame, type ScoreRules } from './game';

export interface Planning {
  /** The value of standing with a hand in the best box, with `rerollsLeft` rerolls unused. */
  handValue: (card: Card, hand: Counts, rerollsLeft: number) => number;
  /** The box to score a hand in. */
  bestBox: (card: Card, hand: Counts, firstRoll: boolean) => string;
}

const plans = new Map<string, TurnPlan>();
function planFor(planning: Planning, card: Card): TurnPlan {
  const key = JSON.stringify(card);
  let plan = plans.get(key);
  if (!plan) {
    if (plans.size > 64) plans.clear();
    plan = planTurn((hand, rerollsLeft) => planning.handValue(card, hand, rerollsLeft));
    plans.set(key, plan);
  }
  return plan;
}

/** The planner's action for the player to move. */
export function plannedAction(rules: ScoreRules, planning: Planning, g: DiceGame): string {
  if (g.rolls === 0) return 'roll:00000';
  const card = g.cards[g.turn]!;
  const hand = handOf(g)!;
  const rerolls = 3 - g.rolls;
  const plan = planFor(planning, card);
  if (rerolls > 0 && !plan.shouldStand(hand, rerolls))
    return `roll:${maskFor(g.dice!, plan.bestKeep(hand, rerolls))}`;
  const box = planning.bestBox(card, hand, g.rolls === 1);
  const legal = legalActions(rules, g);
  return legal.includes(`score:${box}`)
    ? `score:${box}`
    : legal.find((a) => a.startsWith('score:'))!;
}

/** The simple player: keeps the most common face (the highest on ties) and scores the best box now. */
export function simpleAction(rules: ScoreRules, g: DiceGame): string {
  if (g.rolls === 0) return 'roll:00000';
  const hand = handOf(g)!;
  const card = g.cards[g.turn]!;
  const firstRoll = g.rolls === 1;
  const boxes = rules.openBoxes(card, hand);
  const best = boxes.reduce((a, b) =>
    rules.scoreFor(card, b, hand, firstRoll) > rules.scoreFor(card, a, hand, firstRoll) ? b : a,
  );
  if (g.rolls < 3 && rules.scoreFor(card, best, hand, firstRoll) < 25) {
    let face = 5;
    for (let f = 5; f >= 0; f--) if (hand[f]! > hand[face]!) face = f;
    const keep = [0, 0, 0, 0, 0, 0] as Counts;
    keep[face] = hand[face]!;
    return `roll:${maskFor(g.dice!, keep)}`;
  }
  return `score:${best}`;
}

export { countsOf };
