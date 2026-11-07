/**
 * Playing cards for the card games: a card is an integer 0–51 (per deck), suit = ⌊c / 13⌋ in the
 * order spades, hearts, diamonds, clubs, rank = c mod 13 + 1 (1 ace … 13 king). Multi-deck games
 * use c + 52·k for the k-th copy; `cardOf` folds them back.
 */
import { Rng } from '../../../core/game-engine/random';
import type { Locale } from '../../../core/i18n';

export type Suit = 0 | 1 | 2 | 3;
export const SPADES: Suit = 0;
export const HEARTS: Suit = 1;
export const DIAMONDS: Suit = 2;
export const CLUBS: Suit = 3;

export const cardOf = (c: number) => c % 52;
export const suitOf = (c: number) => Math.floor(cardOf(c) / 13) as Suit;
export const rankOf = (c: number) => (cardOf(c) % 13) + 1;
export const isRed = (c: number) => suitOf(c) === HEARTS || suitOf(c) === DIAMONDS;
export const makeCard = (suit: Suit, rank: number) => suit * 13 + rank - 1;

/** A shuffled deck (or several) from a seed: Fisher–Yates with the platform's seeded RNG. */
export function shuffledDeck(
  seed: number,
  decks = 1,
  suits: readonly Suit[] = [0, 1, 2, 3],
): number[] {
  const cards: number[] = [];
  // Fewer suits (e.g. one-suit Spider) repeat those suits to keep 52 cards per deck.
  const per = 4 / suits.length;
  for (let d = 0; d < decks; d++)
    for (let rep = 0; rep < per; rep++)
      for (const s of suits)
        for (let r = 1; r <= 13; r++) cards.push(makeCard(s, r) + 52 * (d * per + rep));
  return new Rng(seed).shuffle(cards);
}

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const rankLabel = (c: number) => RANKS[rankOf(c) - 1]!;
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;

const RANK_NAMES: Record<Locale, string[]> = {
  en: [
    'ace',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'jack',
    'queen',
    'king',
  ],
  es: [
    'as',
    'dos',
    'tres',
    'cuatro',
    'cinco',
    'seis',
    'siete',
    'ocho',
    'nueve',
    'diez',
    'jota',
    'reina',
    'rey',
  ],
};
const SUIT_NAMES: Record<Locale, string[]> = {
  en: ['spades', 'hearts', 'diamonds', 'clubs'],
  es: ['picas', 'corazones', 'diamantes', 'tréboles'],
};

/** Spoken name, e.g. "queen of hearts" / "reina de corazones". */
export function cardName(c: number, locale: Locale): string {
  const of = locale === 'es' ? 'de' : 'of';
  return `${RANK_NAMES[locale][rankOf(c) - 1]} ${of} ${SUIT_NAMES[locale][suitOf(c)]}`;
}

/** Short label, e.g. "Q♥". */
export const cardShort = (c: number) => `${rankLabel(c)}${SUIT_SYMBOLS[suitOf(c)]}`;
