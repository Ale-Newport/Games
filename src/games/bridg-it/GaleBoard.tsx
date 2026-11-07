import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { S, SLOTS, bridgeEnds, isDot, type GaleState } from './engine';
import styles from './GaleBoard.module.css';

const xy = (p: number) => ({ x: p % S, y: Math.floor(p / S) });

/** Slot names: column letter and row number of the lattice point, from the top-left. */
export const slotName = (p: number) => `${'abcdefghijk'[p % S]}${Math.floor(p / S) + 1}`;

export function GaleBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<GaleState, string>) {
  const [cursor, setCursor] = useState(5 * S + 5);
  const me = state.toMove;
  const free = new Set(interactive ? SLOTS.filter((p) => state.bridges[p] === 0) : []);
  const last = state.history.length ? Number(state.history[state.history.length - 1]) : -1;
  const hinted = hint ? Number(hint) : -1;
  const place = (p: number) => {
    if (free.has(p)) onAction(String(p));
  };
  useKeyboard((e) => {
    const r = Math.floor(cursor / S);
    const c = cursor % S;
    let next: [number, number] | null = null;
    if (e.key === 'ArrowLeft') next = [r, c - 2];
    if (e.key === 'ArrowRight') next = [r, c + 2];
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const nr = r + (e.key === 'ArrowUp' ? -1 : 1);
      next = [nr, c + 1 <= S - 2 ? c + 1 : c - 1];
    }
    if (next) {
      const [nr, nc] = next;
      if (nr >= 1 && nc >= 1 && nr <= S - 2 && nc <= S - 2) setCursor(nr * S + nc);
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      place(cursor);
      return true;
    }
    return false;
  });
  const dots: { p: number; seat: 0 | 1 }[] = [];
  for (let p = 0; p < S * S; p++)
    for (const seat of [0, 1] as const)
      if (isDot(seat, Math.floor(p / S), p % S)) dots.push({ p, seat });
  const bridgeLine = (seat: 0 | 1, p: number, className: string | undefined, key?: string) => {
    const [a, b] = bridgeEnds(seat, p);
    return (
      <line key={key} x1={xy(a).x} y1={xy(a).y} x2={xy(b).x} y2={xy(b).y} className={className} />
    );
  };
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="gale-board">
      <svg viewBox="-1 -1 12 12" className={styles.svg} role="grid" aria-label={t('board.label')}>
        <rect x="-0.9" y="-0.9" width="11.8" height="11.8" rx="0.4" className={styles.ground} />
        <rect x="0.4" y="-0.75" width="9.2" height="0.35" rx="0.15" className={styles.edge0} />
        <rect x="0.4" y="10.4" width="9.2" height="0.35" rx="0.15" className={styles.edge0} />
        <rect x="-0.75" y="0.4" width="0.35" height="9.2" rx="0.15" className={styles.edge1} />
        <rect x="10.4" y="0.4" width="0.35" height="9.2" rx="0.15" className={styles.edge1} />
        {SLOTS.map((p) => {
          const owner = state.bridges[p]!;
          if (owner === 0) return null;
          const seat = (owner - 1) as 0 | 1;
          return bridgeLine(
            seat,
            p,
            `${seat === 0 ? styles.bridge0 : styles.bridge1} ${p === last ? styles.newest : ''}`,
            `b${p}`,
          );
        })}
        {hinted >= 0 && bridgeLine(me, hinted, styles.hint)}
        {interactive && free.has(cursor) && bridgeLine(me, cursor, styles.preview)}
        {dots.map(({ p, seat }) => (
          <circle
            key={p}
            cx={xy(p).x}
            cy={xy(p).y}
            r={0.3}
            className={seat === 0 ? styles.dot0 : styles.dot1}
          />
        ))}
        {(() => {
          const { x, y } = xy(cursor);
          return (
            <polygon
              points={`${x},${y - 0.9} ${x + 0.9},${y} ${x},${y + 0.9} ${x - 0.9},${y}`}
              className={styles.cursor}
            />
          );
        })()}
        {SLOTS.map((p) => {
          const { x, y } = xy(p);
          const owner = state.bridges[p]!;
          return (
            <polygon
              key={`hit${p}`}
              points={`${x},${y - 0.95} ${x + 0.95},${y} ${x},${y + 0.95} ${x - 0.95},${y}`}
              className={`${styles.hit} ${free.has(p) ? styles.free : ''}`}
              data-slot={p}
              role="gridcell"
              aria-label={`${slotName(p)}, ${owner === 0 ? t('slot.free') : t(`slot.taken.${owner - 1}`)}`}
              onClick={() => {
                setCursor(p);
                place(p);
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
