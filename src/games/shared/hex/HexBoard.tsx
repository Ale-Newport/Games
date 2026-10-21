import { useEffect, useRef, useState } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { SWAP, canSwap, type HexState } from './engine';
import styles from './HexBoard.module.css';

const R = 20;
const W = Math.sqrt(3) * R;

/** Cell name: column letter from the left, row number from the top ("a1" top-left). */
export const cellName = (i: number, size: number) =>
  `${String.fromCharCode(97 + (i % size))}${Math.floor(i / size) + 1}`;

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

export function createHexBoard(size: number) {
  const center = (i: number) => {
    const r = Math.floor(i / size);
    const c = i % size;
    return { x: W + c * W + r * (W / 2), y: R * 1.6 + r * R * 1.5 };
  };
  const width = W * (1.5 * size + 1.5);
  const height = R * (1.5 * (size - 1) + 3.2);
  // Outer edges: Red owns top and bottom, Blue left and right.
  const edge = (cells: number[], dx: number, dy: number) =>
    cells.map((i) => {
      const { x, y } = center(i);
      return `${(x + dx).toFixed(1)},${(y + dy).toFixed(1)}`;
    });
  const top = edge(
    Array.from({ length: size }, (_, c) => c),
    0,
    -R * 1.25,
  );
  const bottom = edge(
    Array.from({ length: size }, (_, c) => (size - 1) * size + c),
    0,
    R * 1.25,
  );
  const left = edge(
    Array.from({ length: size }, (_, r) => r * size),
    -W * 0.75,
    0,
  );
  const right = edge(
    Array.from({ length: size }, (_, r) => r * size + size - 1),
    W * 0.75,
    0,
  );

  return function HexBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
  }: BoardProps<HexState, number>) {
    const [cursor, setCursor] = useState(Math.floor((size * size) / 2));
    const [focusToken, setFocusToken] = useState(0);
    const refs = useRef<(SVGPolygonElement | null)[]>([]);
    const last = state.history[state.history.length - 1];
    const path = new Set(state.result?.path ?? []);
    useEffect(() => {
      if (focusToken > 0) refs.current[cursor]?.focus();
    }, [focusToken, cursor]);
    const play = (i: number) => {
      setCursor(i);
      if (!interactive) return;
      onAction(i); // occupied cells are refused by the shell (with a sound)
    };
    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir) {
        setCursor((c) => moveCursor(c, dir, { rows: size, cols: size }));
        setFocusToken((k) => k + 1);
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        play(cursor);
        return true;
      }
      return false;
    });
    return (
      <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="hex-board">
        <svg
          viewBox={`0 0 ${width.toFixed(1)} ${height.toFixed(1)}`}
          className={styles.svg}
          role="grid"
          aria-label={t('board.label')}
        >
          <polyline points={top.join(' ')} className={styles.edgeRed} />
          <polyline points={bottom.join(' ')} className={styles.edgeRed} />
          <polyline points={left.join(' ')} className={styles.edgeBlue} />
          <polyline points={right.join(' ')} className={styles.edgeBlue} />
          {state.board.map((v, i) => {
            const { x, y } = center(i);
            const label = `${cellName(i, size)}, ${t(v === 0 ? 'cell.empty' : v === 1 ? 'cell.red' : 'cell.blue')}`;
            return (
              <g key={i}>
                <polygon
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  points={hexPoints(x, y, R * 0.98)}
                  className={`${styles.cell} ${interactive && v === 0 ? styles.open : ''} ${hint === i ? styles.hint : ''}`}
                  data-cell={i}
                  role="gridcell"
                  tabIndex={i === cursor ? 0 : -1}
                  aria-label={label}
                  onClick={() => play(i)}
                  onFocus={() => setCursor(i)}
                />
                {v !== 0 && (
                  <circle
                    key={last === i ? `placed-${state.history.length}` : 'still'}
                    cx={x}
                    cy={y}
                    r={R * 0.68}
                    className={`${v === 1 ? styles.red : styles.blue} ${last === i ? styles.placed : ''} ${path.has(i) ? styles.path : ''}`}
                    pointerEvents="none"
                  />
                )}
                {last === i && (
                  <circle
                    cx={x}
                    cy={y}
                    r={R * 0.22}
                    className={styles.lastDot}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>
        {canSwap(state) && interactive && (
          <button
            type="button"
            className={`btn ${hint === SWAP ? styles.hintButton : ''}`}
            onClick={() => onAction(SWAP)}
            data-testid="swap"
          >
            {t('action.swap')}
          </button>
        )}
      </div>
    );
  };
}
