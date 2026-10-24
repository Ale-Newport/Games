import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { N, cellName, loaTargets, parseMove, type LoaState } from './engine';
import styles from './LoaBoard.module.css';

export function LoaPiece({ seat }: { seat: 0 | 1 }) {
  return (
    <g>
      <circle r="0.38" className={seat === 0 ? styles.black : styles.white} />
      <circle r="0.24" className={seat === 0 ? styles.ringB : styles.ringW} />
    </g>
  );
}

export function LoaBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
  perspective,
}: BoardProps<LoaState, string>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(1);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSelected(null);
  }
  const me = state.toMove + 1;
  const movable = new Set<number>();
  if (interactive)
    state.board.forEach((x, c) => {
      if (x === me && loaTargets(state.board, c).length) movable.add(c);
    });
  const targets = new Set(
    interactive && selected !== null ? loaTargets(state.board, selected) : [],
  );
  const last = state.history.length ? parseMove(state.history[state.history.length - 1]!) : null;
  const hinted = hint ? parseMove(hint) : null;
  const flip = perspective === 1;
  const click = (c: number) => {
    if (!interactive) return;
    if (selected !== null && targets.has(c)) {
      setSelected(null);
      return onAction(`${selected}-${c}`);
    }
    setSelected(movable.has(c) && c !== selected ? c : null);
  };
  useKeyboard((e) => {
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const d = delta[e.key];
    if (d) {
      const [dx, dy] = flip ? [-d[0], -d[1]] : d;
      setCursor((c) => {
        const x = (c % N) + dx;
        const y = Math.floor(c / N) + dy;
        return x < 0 || y < 0 || x >= N || y >= N ? c : y * N + x;
      });
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      click(cursor);
      return true;
    }
    if (e.key === 'Escape' && selected !== null) {
      setSelected(null);
      return true;
    }
    return false;
  });
  const label = (c: number) => {
    const x = state.board[c]!;
    const what = x === 0 ? t('cell.empty') : t(`seat.${x - 1}`);
    const extra = targets.has(c) ? `, ${t(x ? 'cell.capture' : 'cell.move')}` : '';
    return `${cellName(c)}, ${what}${extra}`;
  };
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="loa-board">
      <svg
        viewBox="-0.1 -0.1 8.2 8.2"
        className={styles.svg}
        role="grid"
        aria-label={t('board.label')}
      >
        <g transform={flip ? 'rotate(180 4 4)' : undefined}>
          {state.board.map((_x, c) => (
            <rect
              key={c}
              x={c % N}
              y={Math.floor(c / N)}
              width="1"
              height="1"
              className={`${((c % N) + Math.floor(c / N)) % 2 ? styles.dark : styles.light} ${last?.includes(c) ? styles.last : ''}`}
            />
          ))}
          {last && (
            <line
              x1={(last[0] % N) + 0.5}
              y1={Math.floor(last[0] / N) + 0.5}
              x2={(last[1] % N) + 0.5}
              y2={Math.floor(last[1] / N) + 0.5}
              className={styles.trail}
            />
          )}
          {state.board.map((x, c) => {
            const px = c % N;
            const py = Math.floor(c / N);
            return (
              <g key={c} transform={`translate(${px} ${py})`}>
                {hinted?.includes(c) && (
                  <rect x="0.06" y="0.06" width="0.88" height="0.88" className={styles.hint} />
                )}
                {x !== 0 && (
                  <g
                    key={`${c}-${x}`}
                    transform="translate(0.5 0.5)"
                    className={[
                      styles.piece,
                      movable.has(c) && styles.movable,
                      selected === c && styles.selected,
                      last?.[1] === c && styles.moved,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <LoaPiece seat={(x - 1) as 0 | 1} />
                  </g>
                )}
                {targets.has(c) && (
                  <circle
                    cx="0.5"
                    cy="0.5"
                    r={x ? 0.44 : 0.14}
                    className={x ? styles.capture : styles.dot}
                  />
                )}
                {cursor === c && (
                  <rect x="0.04" y="0.04" width="0.92" height="0.92" className={styles.cursor} />
                )}
                <rect
                  width="1"
                  height="1"
                  className={styles.hit}
                  data-cell={c}
                  role="gridcell"
                  aria-label={label(c)}
                  onClick={() => {
                    setCursor(c);
                    click(c);
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
