import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { LINES, POINTS, actionOf, maskOf, triangleIn, type SimState } from './engine';
import styles from './SimBoard.module.css';

export const pointName = (p: number) => 'ABCDEF'[p]!;

const XY = Array.from({ length: POINTS }, (_, i) => {
  const angle = (Math.PI / 3) * i - Math.PI / 2;
  return { x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) };
});

/** A touch target around a line: a thin rectangle, as a polygon. */
function hitPolygon(a: number, b: number, width = 4.5): string {
  const p = XY[a]!;
  const q = XY[b]!;
  const len = Math.hypot(q.x - p.x, q.y - p.y);
  const nx = (-(q.y - p.y) / len) * width;
  const ny = ((q.x - p.x) / len) * width;
  // Stop short of the points so neighbouring lines do not overlap there.
  const sx = ((q.x - p.x) / len) * 6;
  const sy = ((q.y - p.y) / len) * 6;
  const pts = [
    [p.x + sx + nx, p.y + sy + ny],
    [q.x - sx + nx, q.y - sy + ny],
    [q.x - sx - nx, q.y - sy - ny],
    [p.x + sx - nx, p.y + sy - ny],
  ];
  return pts.map(([x, y]) => `${x!.toFixed(2)},${y!.toFixed(2)}`).join(' ');
}

export function SimBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<SimState, string>) {
  const [cursor, setCursor] = useState(0);
  const mine = maskOf(state.lines, state.toMove);
  const last = state.history[state.history.length - 1];
  const free = state.lines.flatMap((v, i) => (v ? [] : [i]));
  const click = (i: number) => {
    if (interactive && !state.lines[i]) onAction(actionOf(i));
  };
  useKeyboard((e) => {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
      if (!free.length) return true;
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const at = free.indexOf(cursor);
      setCursor(free[at === -1 ? 0 : (at + step + free.length) % free.length]!);
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      click(cursor);
      return true;
    }
    return false;
  });
  const tri = state.result?.triangle;
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="sim-board">
      <svg viewBox="0 0 100 100" className={styles.svg} role="group" aria-label={t('board.label')}>
        {tri && (
          <polygon
            points={tri.map((p) => `${XY[p]!.x},${XY[p]!.y}`).join(' ')}
            className={state.result!.winner === 0 ? styles.lost1 : styles.lost0}
          />
        )}
        {LINES.map(([a, b], i) => {
          const v = state.lines[i]!;
          const closes = !v && interactive && triangleIn(mine | (1 << i)) !== null;
          const classes = [
            styles.line,
            v === 1 ? styles.seat0 : v === 2 ? styles.seat1 : styles.free,
            actionOf(i) === last && styles.last,
            actionOf(i) === hint && styles.hint,
            cursor === i && !v && styles.cursor,
          ];
          return (
            <g key={i}>
              <line
                x1={XY[a]!.x}
                y1={XY[a]!.y}
                x2={XY[b]!.x}
                y2={XY[b]!.y}
                className={classes.filter(Boolean).join(' ')}
              />
              <polygon
                points={hitPolygon(a, b)}
                className={`${styles.hit} ${closes ? styles.danger : ''}`}
                data-line={actionOf(i)}
                role="button"
                tabIndex={v || !interactive ? -1 : 0}
                aria-label={`${pointName(a)}–${pointName(b)}, ${t(v ? `line.seat${v - 1}` : closes ? 'line.danger' : 'line.free')}`}
                aria-disabled={Boolean(v) || !interactive}
                onClick={() => {
                  setCursor(i);
                  click(i);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    click(i);
                  }
                }}
              />
            </g>
          );
        })}
        {XY.map(({ x, y }, p) => (
          <g key={p} aria-hidden="true">
            <circle cx={x} cy={y} r="3.6" className={styles.point} />
            <text
              x={50 + (x - 50) * 1.2}
              y={50 + (y - 50) * 1.2 + 1.6}
              textAnchor="middle"
              className={styles.label}
            >
              {pointName(p)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
