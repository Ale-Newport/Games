/**
 * Bridge computer players: bidding from `bidding.ts`, and card play.
 *
 * - Easy bids with points only and plays its lowest card unless it can win the trick at once.
 * - Medium leads partner's suit or the top of an honour sequence, draws trumps as declarer, cashes
 *   master cards, plays second hand low and third hand high (winning as cheaply as it can), never
 *   overtakes a partner whose card is the master, ruffs when void, and discards from its weakest
 *   suit.
 * - Hard plays each legal card out over sampled deals of the hidden hands (dummy and the cards
 *   played are known; suits players showed out of are respected), with Medium for every seat, and
 *   keeps the card that takes the most tricks for its side on average.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { suitOf } from '../shared/cards/cards';
import { highRank, trickWinner } from '../shared/tricks/cards';
import { chooseCall, trumpSuit } from './bidding';
import { applyBridgeAction, partnerOf, playableCards, sideOf, type BridgeState } from './engine';

/** Cards played so far this deal (rebuilt from the history). */
export function playedCards(s: BridgeState): number[] {
  const first = s.history.lastIndexOf('next') + 1;
  return s.history
    .slice(first)
    .filter((a) => a.startsWith('play:'))
    .map((a) => Number(a.slice(5)));
}

const lowest = (cards: readonly number[], trump: number | null) =>
  cards.reduce((a, b) => {
    const ka = (suitOf(a) === trump ? 100 : 0) + highRank(a);
    const kb = (suitOf(b) === trump ? 100 : 0) + highRank(b);
    return kb < ka ? b : a;
  });
const highest = (cards: readonly number[]) =>
  cards.reduce((a, b) => (highRank(b) > highRank(a) ? b : a));

/** Whether a card is the highest of its suit still outside `known` (cards we can see). */
function isMaster(card: number, gone: ReadonlySet<number>, known: ReadonlySet<number>): boolean {
  const suit = suitOf(card);
  for (let c = 0; c < 52; c++)
    if (suitOf(c) === suit && highRank(c) > highRank(card) && !gone.has(c) && !known.has(c))
      return false;
  return true;
}

/** The cards the seat to act can see in its partnership's hands (its own, plus dummy). */
function visible(s: BridgeState, seat: number): Set<number> {
  const out = new Set(s.hands[seat]);
  const c = s.contract!;
  const dummy = partnerOf(c.declarer);
  // The declarer plays both its hands; everyone sees dummy once it is down.
  if (seat === c.declarer || seat === dummy)
    for (const x of [...s.hands[c.declarer]!, ...s.hands[dummy]!]) out.add(x);
  else if (s.dummyShown) for (const x of s.hands[dummy]!) out.add(x);
  return out;
}

export function easyPlay(s: BridgeState): number {
  const legal = playableCards(s);
  const trump = trumpSuit(s.contract!.strain);
  if (s.trick.length) {
    const seat = s.toAct;
    const winners = legal.filter(
      (c) => trickWinner([...s.trick, { seat, card: c }], trump).seat === seat,
    );
    if (winners.length) return lowest(winners, trump);
  }
  return lowest(legal, trump);
}

export function mediumPlay(s: BridgeState): number {
  const legal = playableCards(s);
  if (legal.length === 1) return legal[0]!;
  const seat = s.toAct;
  const c = s.contract!;
  const trump = trumpSuit(c.strain);
  const gone = new Set([...playedCards(s), ...s.trick.map((p) => p.card)]);
  const known = visible(s, seat);
  const declaring = sideOf(seat) === sideOf(c.declarer);
  const partner = partnerOf(seat);

  if (s.trick.length === 0) {
    // Opening lead and later leads.
    if (!declaring) {
      // Partner's bid suit, else the top of an honour sequence, else fourth best of the longest.
      const partnerSuits = s.auction
        .map((call, k) => ({ call, who: (s.dealer + k) % 4 }))
        .filter((x) => x.who === partner && x.call.startsWith('bid:') && !x.call.endsWith('N'))
        .map((x) => 'CDHS'.indexOf(x.call.slice(-1)));
      for (const st of partnerSuits) {
        const suit = trumpSuitOf(st);
        const cards = legal.filter((x) => suitOf(x) === suit);
        if (cards.length) return cards.length <= 2 ? highest(cards) : lowest(cards, trump);
      }
      const masters = legal.filter((x) => suitOf(x) !== trump && isMaster(x, gone, known));
      if (masters.length) return masters[0]!;
      for (const x of legal) {
        const next = legal.find((y) => suitOf(y) === suitOf(x) && highRank(y) === highRank(x) - 1);
        if (highRank(x) >= 12 && next !== undefined && suitOf(x) !== trump) return x;
      }
      const side = legal.filter((x) => suitOf(x) !== trump);
      const pool = side.length ? side : legal;
      const length = (x: number) => pool.filter((y) => suitOf(y) === suitOf(x)).length;
      const longest = pool.reduce((a, b) => (length(b) > length(a) ? b : a));
      const suitCards = pool
        .filter((y) => suitOf(y) === suitOf(longest))
        .sort((a, b) => highRank(b) - highRank(a));
      return suitCards[Math.min(3, suitCards.length - 1)]!;
    }
    // Declarer: draw trumps while the defenders may hold some, then cash masters.
    if (trump !== null) {
      const ourTrumps = [...known].filter((x) => suitOf(x) === trump).length;
      const goneTrumps = [...gone].filter((x) => suitOf(x) === trump).length;
      const theirs = 13 - ourTrumps - goneTrumps;
      const myTrumps = legal.filter((x) => suitOf(x) === trump);
      if (theirs > 0 && myTrumps.length) return highest(myTrumps);
    }
    const masters = legal.filter((x) => isMaster(x, gone, known));
    if (masters.length) return masters[0]!;
    return lowest(legal, trump);
  }

  const current = trickWinner(s.trick, trump);
  const partnerWinning = current.seat === partner;
  const last = s.trick.length === 3;
  const winners = legal.filter(
    (x) => trickWinner([...s.trick, { seat, card: x }], trump).seat === seat,
  );
  if (partnerWinning && (last || isMaster(current.card, gone, known))) return lowest(legal, trump);
  // Second hand low (unless we can take it with a master card).
  if (s.trick.length === 1 && winners.length) {
    const sure = winners.filter((x) => isMaster(x, gone, known) && suitOf(x) !== trump);
    if (sure.length) return lowest(sure, trump);
    return lowest(legal, trump);
  }
  if (winners.length) return lowest(winners, trump);
  return lowest(legal, trump);
}

const trumpSuitOf = (strain: number) => trumpSuit(strain);

/** A deal of the hidden cards consistent with what the seat to act (or its declarer) knows. */
export function sampleWorld(s: BridgeState, rng: Rng): BridgeState {
  const c = s.contract!;
  const seat = s.toAct === partnerOf(c.declarer) ? c.declarer : s.toAct;
  const dummy = partnerOf(c.declarer);
  const knownSeats = new Set([seat, ...(s.dummyShown || seat === c.declarer ? [dummy] : [])]);
  if (seat === c.declarer) knownSeats.add(dummy);
  const hidden = [0, 1, 2, 3].filter((p) => !knownSeats.has(p));
  const pool = hidden.flatMap((p) => s.hands[p]!);
  const capacity = s.hands.map((h) => h.length);
  const eligible = (card: number) =>
    hidden.filter((p) => !s.shownOut[p]!.includes(suitOf(card))).length;
  for (let attempt = 0; attempt <= 20; attempt++) {
    const hands = s.hands.map((h, p) => (knownSeats.has(p) ? [...h] : []));
    const order = rng.shuffle([...pool]).sort((a, b) => eligible(a) - eligible(b));
    let ok = true;
    for (const card of order) {
      const options = hidden.filter(
        (p) =>
          hands[p]!.length < capacity[p]! &&
          (attempt === 20 || !s.shownOut[p]!.includes(suitOf(card))),
      );
      if (!options.length) {
        ok = false;
        break;
      }
      hands[options[rng.int(options.length)]!]!.push(card);
    }
    if (ok) return { ...s, hands };
  }
  return s;
}

export const HARD_SAMPLES = 16;

export function searchPlay(
  s: BridgeState,
  samples: number,
  rng: Rng,
): { card: number; nodes: number } {
  const legal = playableCards(s);
  if (legal.length === 1) return { card: legal[0]!, nodes: 0 };
  const side = sideOf(s.toAct);
  const totals = legal.map(() => 0);
  for (let k = 0; k < samples; k++) {
    const world = sampleWorld(s, rng);
    legal.forEach((card, i) => {
      let x = applyBridgeAction(world, `play:${card}`);
      while (x.phase === 'play') x = applyBridgeAction(x, `play:${mediumPlay(x)}`);
      totals[i]! += x.tricks[side];
    });
  }
  let best = 0;
  totals.forEach((v, i) => {
    if (v > totals[best]!) best = i;
  });
  return { card: legal[best]!, nodes: samples * legal.length };
}

type Level = 'easy' | 'medium' | 'hard';

export function levelAction(s: BridgeState, level: Level, rng: Rng): string {
  if (s.phase === 'done') return 'next';
  if (s.phase === 'auction') return chooseCall(s, level === 'easy' ? 'easy' : 'medium');
  if (level === 'easy') return `play:${easyPlay(s)}`;
  if (level === 'medium') return `play:${mediumPlay(s)}`;
  return `play:${searchPlay(s, HARD_SAMPLES, rng).card}`;
}

export class BridgeAgent implements Agent<BridgeState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<BridgeState, string>,
    s: BridgeState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    return levelAction(s, this.level, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<BridgeState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal call and card.', es: 'Cualquier voz y carta legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Bids its points, rarely competes, and plays its lowest card unless it can win the trick.',
      es: 'Puja sus puntos, apenas compite y juega su carta más baja salvo que pueda ganar la baza.',
    },
    create: () => new BridgeAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'A natural bidding system, standard leads, draws trumps, second hand low, third hand high.',
      es: 'Un sistema de subasta natural, salidas clásicas, arrastra triunfos, segunda baja y tercera alta.',
    },
    create: () => new BridgeAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Bids like Medium; plays by simulating possible layouts of the hidden hands.',
      es: 'Puja como Medio; juega simulando distribuciones posibles de las manos ocultas.',
    },
    create: () => new BridgeAgent('hard', 'Hard', 'hard'),
  },
];
