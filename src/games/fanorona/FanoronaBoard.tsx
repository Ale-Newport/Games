import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import {
  COLS,
  DIRS,
  ROWS,
  legalFanoronaActions,
  step,
  victims,
  type FanoronaState,
} from './engine';
import styles from './FanoronaBoard.module.css';

const GAP = 10;
const PAD = 6;
const W = PAD * 2 + GAP * (COLS - 1);
const H = PAD * 2 + GAP * (ROWS - 1);
const xy = (p: number) => ({ x: PAD + (p % COLS) * GAP, y: PAD + Math.floor(p / COLS) * GAP });

export const pointName = (p: number) => `${'abcdefghi'[p % COLS]}${ROWS - Math.floor(p / COLS)}`;

/** Every drawn line segment once. */
const SEGMENTS: [number, number][] = [];
for (let p = 0; p < ROWS * COLS; p++)
  for (const d of [1, 3, 6, 7]) {
    const q = step(p, d);
    if (q >= 0) SEGMENTS.push([p, q]);
  }

export function FanoronaBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<FanoronaState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [choice, setChoice] = useState<{ to: number; options: string[] } | null>(null);
  const [cursor, setCursor] = useState(22);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(state.chain ? state.chain.at : null);
    setChoice(null);
  }
  const legal = interactive ? legalFanoronaActions(state) : [];
  const parsed = legal
    .filter((a) => a !== 'stop')
    .map((a) => {
      const [f, rest] = a.split('-') as [string, string];
      return { a, f: Number(f), t: Number(rest.replace(/[AW]$/, '')) };
    });
  const movable = new Set(parsed.map((m) => m.f));
  const from = state.chain ? state.chain.at : selected;
  const targets = new Map<number, string[]>();
  for (const m of parsed) if (m.f === from) targets.set(m.t, [...(targets.get(m.t) ?? []), m.a]);
  const preview = new Set<number>();
  if (choice)
    for (const a of choice.options) {
      const d = DIRS.findIndex((_, i) => step(from!, i) === choice.to);
      for (const p of victims(state.board, from!, choice.to, d, a.endsWith('A') ? 'A' : 'W'))
        preview.add(p);
    }
  const last = state.history[state.history.length - 1];
  const lastPts = last && last !== 'stop' ? last.replace(/[AW]$/, '').split('-').map(Number) : [];
  const hintPts = hint && hint !== 'stop' ? hint.replace(/[AW]$/, '').split('-').map(Number) : [];

  const click = (p: number) => {
    if (!interactive) return;
    const opts = targets.get(p);
    if (from !== null && opts) {
      if (opts.length === 1) {
        setChoice(null);
        return onAction(opts[0]!);
      }
      return setChoice({ to: p, options: opts });
    }
    setChoice(null);
    if (!state.chain) setSelected(movable.has(p) && p !== selected ? p : null);
  };
  useKeyboard((e) => {
    const move: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLS,
      ArrowDown: COLS,
    };
    if (move[e.key] !== undefined) {
      setCursor((c) => {
        const n = c + move[e.key]!;
        if (n < 0 || n >= ROWS * COLS) return c;
        if (Math.abs(move[e.key]!) === 1 && Math.floor(n / COLS) !== Math.floor(c / COLS)) return c;
        return n;
      });
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      click(cursor);
      return true;
    }
    if (e.key === 'Escape') {
      setChoice(null);
      if (!state.chain) setSelected(null);
      return true;
    }
    return false;
  });

  return (
    <div
      className={`${styles.wrap} ${animate ? styles.animated : ''}`}
      data-testid="fanorona-board"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="grid"
        aria-label={t('board.label')}
      >
        <rect x="1" y="1" width={W - 2} height={H - 2} rx="3" className={styles.wood} />
        {SEGMENTS.map(([p, q]) => (
          <line
            key={`${p}-${q}`}
            x1={xy(p).x}
            y1={xy(p).y}
            x2={xy(q).x}
            y2={xy(q).y}
            className={styles.line}
          />
        ))}
        {state.board.map((v, p) => {
          const { x, y } = xy(p);
          const isTarget = targets.has(p);
          return (
            <g key={p}>
              {isTarget && <circle cx={x} cy={y} r={2.6} className={styles.target} />}
              {v !== 0 && (
                <circle
                  key={`${p}-${v}`}
                  cx={x}
                  cy={y}
                  r={3.4}
                  className={[
                    styles.piece,
                    v === 1 ? styles.white : styles.black,
                    from === p && styles.selected,
                    preview.has(p) && styles.doomed,
                    lastPts[1] === p && styles.moved,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              )}
              {(lastPts.includes(p) || hintPts.includes(p)) && (
                <circle
                  cx={x}
                  cy={y}
                  r={4.4}
                  className={hintPts.includes(p) ? styles.hint : styles.last}
                />
              )}
              {cursor === p && <circle cx={x} cy={y} r={4.6} className={styles.cursor} />}
              <circle
                cx={x}
                cy={y}
                r={4.6}
                className={styles.hit}
                data-point={p}
                role="gridcell"
                aria-label={`${pointName(p)}, ${t(v === 0 ? 'point.empty' : v === 1 ? 'point.white' : 'point.black')}${isTarget ? `, ${t('point.target')}` : ''}`}
                onClick={() => {
                  setCursor(p);
                  click(p);
                }}
              />
            </g>
          );
        })}
      </svg>
      <div className={styles.bar}>
        {choice &&
          choice.options.map((a) => (
            <button
              key={a}
              type="button"
              className="btn btn-primary"
              data-testid={a.endsWith('A') ? 'by-approach' : 'by-withdrawal'}
              onClick={() => {
                setChoice(null);
                onAction(a);
              }}
            >
              {t(a.endsWith('A') ? 'action.approach' : 'action.withdrawal')}
            </button>
          ))}
        {interactive && state.chain && (
          <button type="button" className="btn" data-testid="stop" onClick={() => onAction('stop')}>
            {t('action.stop')}
          </button>
        )}
        <span className={styles.count} data-testid="counts">
          {t('info.counts', {
            a: state.board.filter((v) => v === 1).length,
            b: state.board.filter((v) => v === 2).length,
          })}
        </span>
      </div>
    </div>
  );
}
