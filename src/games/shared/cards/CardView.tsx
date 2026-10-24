/** Original card artwork drawn in SVG: corner indices, pip layouts, framed court cards, a back. */
import type { Suit } from './cards';
import { rankLabel, rankOf, suitOf } from './cards';
import styles from './CardView.module.css';

/** Suit shapes in a 100 × 100 box. */
const SUIT_PATHS: Record<Suit, string> = {
  0: 'M50 4 C78 28 94 44 94 60 C94 74 83 82 71 82 C63 82 57 78 53 72 C54 82 58 90 66 96 L34 96 C42 90 46 82 47 72 C43 78 37 82 29 82 C17 82 6 74 6 60 C6 44 22 28 50 4 Z',
  1: 'M50 92 C20 68 6 52 6 34 C6 20 17 10 30 10 C39 10 46 15 50 24 C54 15 61 10 70 10 C83 10 94 20 94 34 C94 52 80 68 50 92 Z',
  2: 'M50 4 L88 50 L50 96 L12 50 Z',
  3: 'M50 8 A19 19 0 1 1 49.9 8 Z M26 40 A19 19 0 1 1 25.9 40 Z M74 40 A19 19 0 1 1 73.9 40 Z M46 58 C46 76 41 88 33 96 L67 96 C59 88 54 76 54 58 Z',
};

export function SuitShape({
  suit,
  x,
  y,
  size,
  flip = false,
}: {
  suit: Suit;
  x: number;
  y: number;
  size: number;
  flip?: boolean;
}) {
  const s = size / 100;
  return (
    <path
      d={SUIT_PATHS[suit]}
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})${flip ? ' rotate(180 50 50)' : ''}`}
    />
  );
}

/** Pip positions (x, y, flipped) on the 100 × 140 card face for ranks 2–10. */
const L = 30;
const C = 50;
const R = 70;
const PIPS: Record<number, [number, number, boolean?][]> = {
  2: [
    [C, 32],
    [C, 108, true],
  ],
  3: [
    [C, 32],
    [C, 70],
    [C, 108, true],
  ],
  4: [
    [L, 32],
    [R, 32],
    [L, 108, true],
    [R, 108, true],
  ],
  5: [
    [L, 32],
    [R, 32],
    [C, 70],
    [L, 108, true],
    [R, 108, true],
  ],
  6: [
    [L, 32],
    [R, 32],
    [L, 70],
    [R, 70],
    [L, 108, true],
    [R, 108, true],
  ],
  7: [
    [L, 32],
    [R, 32],
    [C, 51],
    [L, 70],
    [R, 70],
    [L, 108, true],
    [R, 108, true],
  ],
  8: [
    [L, 32],
    [R, 32],
    [C, 51],
    [L, 70],
    [R, 70],
    [C, 89, true],
    [L, 108, true],
    [R, 108, true],
  ],
  9: [
    [L, 30],
    [R, 30],
    [L, 56],
    [R, 56],
    [C, 70],
    [L, 84, true],
    [R, 84, true],
    [L, 110, true],
    [R, 110, true],
  ],
  10: [
    [L, 30],
    [R, 30],
    [C, 44],
    [L, 56],
    [R, 56],
    [L, 84, true],
    [R, 84, true],
    [C, 96, true],
    [L, 110, true],
    [R, 110, true],
  ],
};

/** Simple original emblems for the court cards: a feather (J), a tiara (Q), a crown (K). */
const COURT: Record<number, string> = {
  11: 'M38 92 C44 70 54 54 66 44 C60 58 56 66 54 74 C60 66 64 62 68 60 C62 74 52 84 38 92 Z',
  12: 'M30 76 L34 58 L42 68 L50 52 L58 68 L66 58 L70 76 Z M30 80 L70 80 L70 86 L30 86 Z',
  13: 'M28 80 L32 52 L42 64 L50 46 L58 64 L68 52 L72 80 Z M28 84 L72 84 L72 92 L28 92 Z',
};

export interface CardViewProps {
  card: number;
  faceUp: boolean;
  /** Four-color suits for colorblind mode: diamonds blue, clubs green. */
  fourColor?: boolean;
}

export function CardView({ card, faceUp, fourColor = false }: CardViewProps) {
  if (!faceUp)
    return (
      <svg viewBox="0 0 100 140" className={styles.card} aria-hidden="true">
        <rect x="1" y="1" width="98" height="138" rx="9" className={styles.backEdge} />
        <rect x="7" y="7" width="86" height="126" rx="5" className={styles.back} />
        <path
          d="M7 33 L50 7 L93 33 M7 63 L50 37 L93 63 M7 93 L50 67 L93 93 M7 123 L50 97 L93 123"
          className={styles.backPattern}
        />
        <circle cx="50" cy="70" r="13" className={styles.backBadge} />
      </svg>
    );
  const suit = suitOf(card);
  const rank = rankOf(card);
  const tone = fourColor
    ? (['black', 'red', 'blue', 'green'] as const)[suit]
    : suit === 1 || suit === 2
      ? 'red'
      : 'black';
  const label = rankLabel(card);
  return (
    <svg viewBox="0 0 100 140" className={`${styles.card} ${styles[tone]}`} aria-hidden="true">
      <rect x="1" y="1" width="98" height="138" rx="9" className={styles.face} />
      <text x="13" y="27" className={styles.index} textAnchor="middle">
        {label}
      </text>
      <g className={styles.ink}>
        <SuitShape suit={suit} x={13} y={41} size={15} />
      </g>
      <g transform="rotate(180 50 70)">
        <text x="13" y="27" className={styles.index} textAnchor="middle">
          {label}
        </text>
        <g className={styles.ink}>
          <SuitShape suit={suit} x={13} y={41} size={15} />
        </g>
      </g>
      <g className={styles.ink}>
        {rank === 1 && <SuitShape suit={suit} x={50} y={70} size={44} />}
        {rank >= 2 &&
          rank <= 10 &&
          PIPS[rank]!.map(([x, y, flip], i) => (
            <SuitShape key={i} suit={suit} x={x} y={y} size={18} flip={flip} />
          ))}
      </g>
      {rank > 10 && (
        <g>
          <rect x="25" y="24" width="50" height="92" rx="4" className={styles.court} />
          <path d={COURT[rank]} className={styles.emblem} />
          <g className={styles.ink}>
            <SuitShape suit={suit} x={50} y={36} size={14} />
            <SuitShape suit={suit} x={50} y={104} size={14} flip />
          </g>
        </g>
      )}
    </svg>
  );
}
