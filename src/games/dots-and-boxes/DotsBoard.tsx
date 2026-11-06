import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { BOXES, COLS, H_LINES, LINES, ROWS, sidesDrawn, type DotsState } from './engine';
import styles from './DotsBoard.module.css';

const GAP = 20;
const PAD = 10;
const SIZE = PAD * 2 + GAP * COLS;
const HIT = 8;

/** Endpoints of a line in board units. */
export function lineEnds(l: number): [number, number, number, number] {
  if (l < H_LINES) {
    const r = Math.floor(l / COLS);
    const c = l % COLS;
    return [PAD + c * GAP, PAD + r * GAP, PAD + (c + 1) * GAP, PAD + r * GAP];
  }
  const v = l - H_LINES;
  const r = Math.floor(v / (COLS + 1));
  const c = v % (COLS + 1);
  return [PAD + c * GAP, PAD + r * GAP, PAD + c * GAP, PAD + (r + 1) * GAP];
}

/** "b3–c3" style name of a line from its two dots (files a–e from the left, ranks 5–1 from the top). */
export function lineName(l: number): string {
  const [x1, y1, x2, y2] = lineEnds(l);
  const dot = (x: number, y: number) => `${'abcde'[(x - PAD) / GAP]}${ROWS + 1 - (y - PAD) / GAP}`;
  return `${dot(x1, y1)}–${dot(x2, y2)}`;
}

export function DotsBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<DotsState, number>) {
  const [cursor, setCursor] = useState<number | null>(null);
  const last = state.history[state.history.length - 1];
  // The cursor is a keyboard aid only; pointer input never shows it.
  const click = (l: number) => {
    if (interactive && !state.lines[l]) onAction(l);
  };
  useKeyboard((e) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (step) {
      // Walk through the lines still free, in index order.
      const free = state.lines.flatMap((v, l) => (v ? [] : [l]));
      if (free.length === 0) return true;
      const at = cursor === null ? -1 : free.indexOf(cursor);
      const next =
        at === -1 ? (step > 0 ? 0 : free.length - 1) : (at + step + free.length) % free.length;
      setCursor(free[next]!);
      return true;
    }
    if ((e.key === 'Enter' || e.key === ' ') && cursor !== null) {
      click(cursor);
      return true;
    }
    return false;
  });
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="dots-board">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.svg}
        role="group"
        aria-label={t('board.label')}
      >
        <rect x="0" y="0" width={SIZE} height={SIZE} rx="4" className={styles.paper} />
        {Array.from({ length: BOXES }, (_, b) => {
          const r = Math.floor(b / COLS);
          const c = b % COLS;
          const owner = state.boxes[b]!;
          const x = PAD + c * GAP;
          const y = PAD + r * GAP;
          return (
            <g key={b}>
              {owner >= 0 && (
                <g key={`own-${owner}`} className={styles.claim}>
                  <rect
                    x={x + 1.5}
                    y={y + 1.5}
                    width={GAP - 3}
                    height={GAP - 3}
                    rx="2"
                    className={owner === 0 ? styles.box0 : styles.box1}
                  />
                  <text
                    x={x + GAP / 2}
                    y={y + GAP / 2 + 3.5}
                    textAnchor="middle"
                    className={styles.initial}
                  >
                    {t(`initial.${owner}`)}
                  </text>
                </g>
              )}
              {owner < 0 && sidesDrawn(state.lines, b) === 3 && (
                <rect
                  x={x + 4}
                  y={y + 4}
                  width={GAP - 8}
                  height={GAP - 8}
                  rx="2"
                  className={styles.open}
                />
              )}
            </g>
          );
        })}
        {Array.from({ length: LINES }, (_, l) => {
          const [x1, y1, x2, y2] = lineEnds(l);
          const drawn = state.lines[l]!;
          const classes = [
            styles.line,
            drawn ? (drawn === 1 ? styles.line0 : styles.line1) : styles.free,
            l === last && styles.last,
            l === hint && styles.hint,
            l === cursor && !drawn && styles.cursor,
          ];
          return (
            <g key={l}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={classes.filter(Boolean).join(' ')} />
              <rect
                // A generous touch target between the two dots, stopping short of them.
                x={Math.min(x1, x2) + (x1 === x2 ? -HIT / 2 : 3)}
                y={Math.min(y1, y2) + (y1 === y2 ? -HIT / 2 : 3)}
                width={x1 === x2 ? HIT : GAP - 6}
                height={y1 === y2 ? HIT : GAP - 6}
                rx="2"
                className={styles.hit}
                data-line={l}
                role="button"
                tabIndex={drawn || !interactive ? -1 : 0}
                aria-label={`${lineName(l)}, ${t(drawn ? `line.drawn${drawn - 1}` : 'line.free')}`}
                aria-disabled={Boolean(drawn) || !interactive}
                onClick={() => click(l)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    click(l);
                  }
                }}
              />
            </g>
          );
        })}
        {Array.from({ length: (ROWS + 1) * (COLS + 1) }, (_, d) => (
          <circle
            key={d}
            cx={PAD + (d % (COLS + 1)) * GAP}
            cy={PAD + Math.floor(d / (COLS + 1)) * GAP}
            r="1.8"
            className={styles.dot}
          />
        ))}
      </svg>
      <div className={styles.bar} data-testid="scores">
        {t('info.scores', { a: state.scores[0], b: state.scores[1] })}
      </div>
    </div>
  );
}
