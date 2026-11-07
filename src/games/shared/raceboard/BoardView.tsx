/**
 * The race-board table shared by Backgammon and Narde: 24 points in four quarters around a bar,
 * the two trays for borne-off checkers, stacked checkers (a count past five), the dice, and the
 * points the selected checker can reach. Points are physical, numbered 1–24 from the bottom
 * player's point of view: 1–6 bottom right, 7–12 bottom left, 13–18 top left, 19–24 top right.
 */
import type { KeyboardEvent } from 'react';
import styles from './Board.module.css';

export interface PointView {
  count: number;
  owner: 0 | 1;
}

export interface BoardViewProps {
  /** Index 1..24 (0 unused): checkers on each physical point. */
  points: PointView[];
  bar: [number, number];
  off: [number, number];
  /** The dice of the turn and which of them are still to play. */
  dice: number[] | null;
  diceLeft: number[];
  /** Whose dice they are (colors the dice). */
  diceSide: 0 | 1;
  /** Selected point (1..24, 25 for the bar), or null. */
  selected: number | null;
  /** Where the selected checker can go (physical points, 0 for off). */
  targets: number[];
  /** Points with a checker that can move now. */
  movable: number[];
  /** Points touched by the last play, for a light highlight. */
  recent: number[];
  onPoint: (p: number) => void;
  label: (p: number) => string;
  ariaLabel: string;
}

const VW = 600;
const VH = 440;
const PW = 40;
const R = 17;

/** Left edge of a physical point's column. */
function columnX(p: number): number {
  // Bottom: 1..6 right half (right to left), 7..12 left half. Top: 13..18 left half, 19..24 right.
  const c = p <= 12 ? 12 - p : p - 13; // 0..11 from the left
  return 20 + c * PW + (c >= 6 ? 40 : 0);
}
const isTop = (p: number) => p >= 13;

function Checker({ cx, cy, owner, n }: { cx: number; cy: number; owner: 0 | 1; n?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} className={owner === 0 ? styles.light : styles.dark} />
      <circle cx={cx} cy={cy} r={R - 6} className={styles.ring} />
      {n !== undefined && (
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          className={owner === 0 ? styles.countDark : styles.countLight}
        >
          {n}
        </text>
      )}
    </g>
  );
}

function Die({
  x,
  y,
  value,
  side,
  used,
}: {
  x: number;
  y: number;
  value: number;
  side: 0 | 1;
  used: boolean;
}) {
  const pips: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [
      [-1, -1],
      [1, 1],
    ],
    3: [
      [-1, -1],
      [0, 0],
      [1, 1],
    ],
    4: [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ],
    5: [
      [-1, -1],
      [1, -1],
      [0, 0],
      [-1, 1],
      [1, 1],
    ],
    6: [
      [-1, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [1, 1],
    ],
  };
  return (
    <g className={used ? styles.used : ''} data-die={value}>
      <rect
        x={x - 15}
        y={y - 15}
        width={30}
        height={30}
        rx={6}
        className={side === 0 ? styles.dieLight : styles.dieDark}
      />
      {pips[value]!.map(([dx, dy], i) => (
        <circle
          key={i}
          cx={x + dx * 8}
          cy={y + dy * 8}
          r={3}
          className={side === 0 ? styles.pipDark : styles.pipLight}
        />
      ))}
    </g>
  );
}

export function BoardView(props: BoardViewProps) {
  const {
    points,
    bar,
    off,
    dice,
    diceLeft,
    diceSide,
    selected,
    targets,
    movable,
    recent,
    onPoint,
    label,
  } = props;
  const key = (p: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPoint(p);
    }
  };
  const left = [...diceLeft];
  const diceShown = (dice ?? []).map((v) => {
    const i = left.indexOf(v);
    if (i >= 0) left.splice(i, 1);
    return { v, used: i < 0 };
  });
  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className={styles.board}
      role="group"
      aria-label={props.ariaLabel}
      data-testid="rb-board"
    >
      <rect x={0} y={0} width={VW} height={VH} rx={14} className={styles.frame} />
      <rect x={20} y={20} width={240} height={400} className={styles.felt} />
      <rect x={300} y={20} width={240} height={400} className={styles.felt} />
      <rect x={260} y={20} width={40} height={400} className={styles.bar} />
      <rect x={548} y={20} width={40} height={400} rx={6} className={styles.tray} />
      {Array.from({ length: 24 }, (_, i) => i + 1).map((p) => {
        const x = columnX(p);
        const top = isTop(p);
        const tip = top ? 200 : 240;
        const base = top ? 20 : 420;
        const pv = points[p]!;
        const shown = Math.min(pv.count, 5);
        const isTarget = targets.includes(p);
        const isMovable = movable.includes(p);
        return (
          <g
            key={p}
            role="button"
            tabIndex={isTarget || isMovable ? 0 : -1}
            aria-label={label(p)}
            data-point={p}
            data-movable={isMovable || undefined}
            data-target={isTarget || undefined}
            className={[
              styles.point,
              isTarget ? styles.target : '',
              selected === p ? styles.selected : '',
            ].join(' ')}
            onClick={() => onPoint(p)}
            onKeyDown={key(p)}
          >
            <rect x={x} y={top ? 20 : 220} width={PW} height={200} className={styles.hit} />
            <polygon
              points={`${x + 2},${base} ${x + PW - 2},${base} ${x + PW / 2},${tip}`}
              className={[
                p % 2 ? styles.pointA : styles.pointB,
                recent.includes(p) ? styles.recent : '',
              ].join(' ')}
            />
            {Array.from({ length: shown }, (_, k) => (
              <Checker
                key={k}
                cx={x + PW / 2}
                cy={top ? 20 + R + k * (2 * R) : 420 - R - k * (2 * R)}
                owner={pv.owner}
                n={k === shown - 1 && pv.count > 5 ? pv.count : undefined}
              />
            ))}
            {isMovable && selected !== p && (
              <circle cx={x + PW / 2} cy={top ? 14 : 426} r={3} className={styles.movable} />
            )}
            {isTarget && (
              <circle
                cx={x + PW / 2}
                cy={top ? 20 + R + shown * 2 * R : 420 - R - shown * 2 * R}
                r={10}
                className={styles.dot}
              />
            )}
            <text x={x + PW / 2} y={top ? 14 : 434} textAnchor="middle" className={styles.num}>
              {p}
            </text>
          </g>
        );
      })}
      {/* The bar: the bottom player's checkers below the middle, the top player's above. */}
      <g
        role="button"
        tabIndex={movable.includes(25) ? 0 : -1}
        aria-label={label(25)}
        data-point={25}
        data-movable={movable.includes(25) || undefined}
        className={[styles.point, selected === 25 ? styles.selected : ''].join(' ')}
        onClick={() => onPoint(25)}
        onKeyDown={key(25)}
      >
        <rect x={260} y={20} width={40} height={400} className={styles.hit} />
        {Array.from({ length: Math.min(bar[0], 4) }, (_, k) => (
          <Checker
            key={`b0${k}`}
            cx={280}
            cy={260 + k * 2 * R}
            owner={0}
            n={k === Math.min(bar[0], 4) - 1 && bar[0] > 4 ? bar[0] : undefined}
          />
        ))}
        {Array.from({ length: Math.min(bar[1], 4) }, (_, k) => (
          <Checker
            key={`b1${k}`}
            cx={280}
            cy={180 - k * 2 * R}
            owner={1}
            n={k === Math.min(bar[1], 4) - 1 && bar[1] > 4 ? bar[1] : undefined}
          />
        ))}
      </g>
      {/* The trays: the bottom player bears off into the lower one. */}
      <g
        role="button"
        tabIndex={targets.includes(0) ? 0 : -1}
        aria-label={label(0)}
        data-point={0}
        data-target={targets.includes(0) || undefined}
        className={[styles.point, targets.includes(0) ? styles.target : ''].join(' ')}
        onClick={() => onPoint(0)}
        onKeyDown={key(0)}
      >
        <rect x={548} y={20} width={40} height={400} className={styles.hit} />
        {Array.from({ length: off[0] }, (_, k) => (
          <rect
            key={`o0${k}`}
            x={552}
            y={412 - k * 11}
            width={32}
            height={9}
            rx={2}
            className={styles.light}
          />
        ))}
        {Array.from({ length: off[1] }, (_, k) => (
          <rect
            key={`o1${k}`}
            x={552}
            y={20 + k * 11}
            width={32}
            height={9}
            rx={2}
            className={styles.dark}
          />
        ))}
        {targets.includes(0) && <circle cx={568} cy={220} r={10} className={styles.dot} />}
      </g>
      {diceShown.map((d, i) => (
        <Die
          key={i}
          x={diceSide === 0 ? 390 + i * 38 : 110 + i * 38}
          y={220}
          value={d.v}
          side={diceSide}
          used={d.used}
        />
      ))}
    </svg>
  );
}
