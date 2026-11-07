import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { RING, legalBaoActions, type BaoState } from './engine';
import styles from './BaoBoard.module.css';

/** Board index shown at display row r (0 top) and column c, for South at the bottom. */
function boardIndex(r: number, c: number): number {
  if (r === 0) return RING + 8 + c; // North back row
  if (r === 1) return RING + (7 - c); // North front row
  if (r === 2) return c; // South front row
  return 8 + (7 - c); // South back row
}

function Seeds({ count }: { count: number }) {
  return (
    <span className={styles.seeds} aria-hidden="true">
      {Array.from({ length: Math.min(count, 12) }, (_, i) => {
        const a = (i / Math.min(count, 12)) * Math.PI * 2;
        const r = count === 1 ? 0 : i < 6 ? 22 : 34;
        return (
          <span
            key={i}
            className={styles.seed}
            style={{ left: `${50 + r * Math.cos(a)}%`, top: `${50 + r * Math.sin(a)}%` }}
          />
        );
      })}
    </span>
  );
}

export function BaoBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
  perspective,
}: BoardProps<BaoState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(null);
  }
  const me = state.toMove;
  const legal = new Set(interactive ? legalBaoActions(state) : []);
  const startable = new Set([...legal].map((a) => me * RING + Number(a.slice(0, -1))));
  const ring = (p: number) => p % RING;
  const dirTargets = new Map<number, string>();
  if (selected !== null) {
    const i = ring(selected);
    for (const [d, sign] of [
      [1, '+'],
      [-1, '-'],
    ] as const) {
      const a = `${i}${sign}`;
      if (legal.has(a)) dirTargets.set(me * RING + ((i + d + RING) % RING), a);
    }
  }
  const lastStart = state.history.length
    ? (1 - state.toMove) * RING + Number(state.history[state.history.length - 1]!.slice(0, -1))
    : -1;
  const hintStart = hint ? me * RING + Number(hint.slice(0, -1)) : -1;
  const click = (p: number) => {
    if (!interactive) return;
    const viaDir = dirTargets.get(p);
    if (viaDir) {
      setSelected(null);
      return onAction(viaDir);
    }
    setSelected(startable.has(p) && p !== selected ? p : null);
  };
  // Display order: South at the bottom, or turned around for a North player.
  const cells: number[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) cells.push(boardIndex(r, c));
  if (perspective === 1) cells.reverse();
  useKeyboard((e) => {
    const delta: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -8,
      ArrowDown: 8,
    };
    const d = delta[e.key];
    if (d !== undefined) {
      setCursor((c) => {
        const n = c + d;
        if (n < 0 || n >= 32 || (Math.abs(d) === 1 && Math.floor(n / 8) !== Math.floor(c / 8)))
          return c;
        return n;
      });
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      click(cells[cursor]!);
      return true;
    }
    if (e.key === 'Escape' && selected !== null) {
      setSelected(null);
      return true;
    }
    return false;
  });
  const total = (seat: number) =>
    state.pits.slice(seat * RING, (seat + 1) * RING).reduce((a, b) => a + b, 0);
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="bao-board">
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {cells.map((p, i) => {
          const owner = p < RING ? 0 : 1;
          const isFront = ring(p) < 8;
          const classes = [
            styles.pit,
            startable.has(p) && styles.can,
            selected === p && styles.selected,
            dirTargets.has(p) && styles.direction,
            p === lastStart && styles.last,
            p === hintStart && styles.hint,
            cursor === i && styles.cursor,
          ];
          return (
            <button
              key={p}
              type="button"
              role="gridcell"
              className={classes.filter(Boolean).join(' ')}
              data-pit={p}
              // A thin gutter row (track 3) separates the two players' halves.
              style={{ gridRow: Math.floor(i / 8) + (i >= 16 ? 2 : 1) }}
              aria-label={`${t(`seat.${owner}`)} ${t(isFront ? 'row.front' : 'row.back')} ${(ring(p) % 8) + 1}, ${t('pit.seeds', { n: state.pits[p]! })}${dirTargets.has(p) ? `, ${t('pit.direction')}` : ''}`}
              onClick={() => {
                setCursor(i);
                click(p);
              }}
            >
              <Seeds count={state.pits[p]!} />
              <span key={state.pits[p]} className={styles.count}>
                {state.pits[p]}
              </span>
            </button>
          );
        })}
      </div>
      <div className={styles.bar}>
        {selected !== null &&
          [...dirTargets.values()].map((a) => (
            <button
              key={a}
              type="button"
              className="btn btn-primary"
              data-testid={`sow${a.slice(-1)}`}
              onClick={() => onAction(a)}
            >
              {t(a.endsWith('+') ? 'action.clockwise' : 'action.counter')}
            </button>
          ))}
        <span className={styles.count2} data-testid="totals">
          {t('info.totals', { a: total(0), b: total(1) })}
        </span>
      </div>
    </div>
  );
}
