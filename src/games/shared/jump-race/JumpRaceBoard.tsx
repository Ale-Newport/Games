import { useState, type ComponentType } from 'react';
import { useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import {
  destinations,
  jumpPath,
  parseMove,
  targetCamp,
  type JumpRaceState,
  type JumpRaceVariant,
} from './engine';
import styles from './JumpRaceBoard.module.css';

/** Original piece art: a glossy marble in the seat's color. */
export function JumpRacePiece({ seat, r }: { seat: 0 | 1; r: number }) {
  return (
    <g>
      <circle r={r} className={seat === 0 ? styles.p0 : styles.p1} />
      <circle cx={-r * 0.3} cy={-r * 0.35} r={r * 0.32} className={styles.gloss} />
    </g>
  );
}

/** The path the last move took, recovered by undoing it on a copy of the board. */
function lastPath(v: JumpRaceVariant, s: JumpRaceState): number[] {
  const last = s.history[s.history.length - 1];
  if (!last) return [];
  const [f, t] = parseMove(last);
  const before = s.board.slice();
  before[f] = before[t]!;
  before[t] = 0;
  return jumpPath(v, before, f, t);
}

export function createJumpRaceBoard(
  v: JumpRaceVariant,
): ComponentType<BoardProps<JumpRaceState, string>> {
  const g = v.geometry;
  const square = v.shape === 'square';
  // Square cells are drawn from their corner; star holes are centered on their coordinates.
  const pos = g.xy.map((c) => (square ? { x: c.x + 0.5, y: c.y + 0.5 } : c));
  const minX = Math.min(...pos.map((p) => p.x)) - (square ? 0.5 : 0.85);
  const maxX = Math.max(...pos.map((p) => p.x)) + (square ? 0.5 : 0.85);
  const minY = Math.min(...pos.map((p) => p.y)) - (square ? 0.5 : 0.85);
  const maxY = Math.max(...pos.map((p) => p.y)) + (square ? 0.5 : 0.85);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const pieceR = square ? 0.36 : 0.36;
  const camps = [new Set(g.camps[0]), new Set(g.camps[1])];
  // The star's outline: the two big triangles' corners (hex tips at distance 8 rows from center).
  const tri = (sign: number) =>
    [0, 1, 2]
      .map((k) => {
        const a = ((sign > 0 ? 90 : -90) + k * 120) * (Math.PI / 180);
        return `${(Math.cos(a) * 9.9).toFixed(2)},${(Math.sin(a) * 9.9).toFixed(2)}`;
      })
      .join(' ');

  return function JumpRaceBoard({ state, interactive, hint, animate, t, onAction, perspective }) {
    const [selected, setSelected] = useState<number | null>(null);
    const [cursor, setCursor] = useState(g.camps[0][0]!);
    const [turn, setTurn] = useState(state.history.length);
    if (turn !== state.history.length) {
      setTurn(state.history.length);
      setSelected(null);
    }
    const flip = perspective === 1;
    const me = state.toMove;
    const movable = new Set<number>();
    if (interactive)
      state.board.forEach((x, c) => {
        if (x === me + 1 && destinations(v, state, c).length) movable.add(c);
      });
    const targets = new Set(
      interactive && selected !== null ? destinations(v, state, selected) : [],
    );
    const path = lastPath(v, state);
    const hintMove = hint ? parseMove(hint) : null;
    const click = (c: number) => {
      if (!interactive) return;
      if (selected !== null && targets.has(c)) {
        setSelected(null);
        return onAction(`${selected}-${c}`);
      }
      setSelected(movable.has(c) && c !== selected ? c : null);
    };
    useKeyboard((e) => {
      const vec: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const d = vec[e.key];
      if (d) {
        const [dx, dy] = flip ? [-d[0], -d[1]] : d;
        setCursor((c) => {
          const from = pos[c]!;
          let best = c;
          let bestScore = Infinity;
          pos.forEach((p, i) => {
            const ox = p.x - from.x;
            const oy = p.y - from.y;
            const along = ox * dx + oy * dy;
            if (along < 0.3) return;
            const across = Math.abs(ox * dy - oy * dx);
            const score = along + 2 * across;
            if (score < bestScore) {
              bestScore = score;
              best = i;
            }
          });
          return best;
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
      return `${g.names[c]}, ${what}${targets.has(c) ? `, ${t('cell.target')}` : ''}`;
    };
    const mine = targetCamp(v, me);
    return (
      <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="jump-board">
        <svg
          viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
          className={styles.svg}
          role="grid"
          aria-label={t('board.label')}
        >
          <g transform={flip ? `rotate(180 ${cx} ${cy})` : undefined}>
            {square ? (
              pos.map((p, c) => (
                <rect
                  key={c}
                  x={p.x - 0.5}
                  y={p.y - 0.5}
                  width={1}
                  height={1}
                  className={[
                    (g.xy[c]!.x + g.xy[c]!.y) % 2 ? styles.dark : styles.light,
                    camps[0]!.has(c) && styles.camp0,
                    camps[1]!.has(c) && styles.camp1,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              ))
            ) : (
              <>
                <polygon points={tri(1)} className={styles.star} />
                <polygon points={tri(-1)} className={styles.star} />
                {pos.map((p, c) => (
                  <circle
                    key={c}
                    cx={p.x}
                    cy={p.y}
                    r={0.3}
                    className={
                      camps[0]!.has(c)
                        ? styles.hole0
                        : camps[1]!.has(c)
                          ? styles.hole1
                          : styles.hole
                    }
                  />
                ))}
              </>
            )}
            {path.length > 1 && (
              <polyline
                points={path.map((c) => `${pos[c]!.x},${pos[c]!.y}`).join(' ')}
                className={styles.path}
              />
            )}
            {hintMove && (
              <line
                x1={pos[hintMove[0]]!.x}
                y1={pos[hintMove[0]]!.y}
                x2={pos[hintMove[1]]!.x}
                y2={pos[hintMove[1]]!.y}
                className={styles.hint}
              />
            )}
            {pos.map((p, c) => {
              const x = state.board[c]!;
              return (
                <g key={c}>
                  {targets.has(c) && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={0.17}
                      className={mine.includes(c) ? styles.targetHome : styles.target}
                    />
                  )}
                  {x !== 0 && (
                    <g
                      key={`${c}-${state.history.length}`}
                      transform={`translate(${p.x} ${p.y})`}
                      className={[
                        styles.piece,
                        movable.has(c) && styles.movable,
                        selected === c && styles.selected,
                        path[path.length - 1] === c && styles.moved,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <JumpRacePiece seat={(x - 1) as 0 | 1} r={pieceR} />
                    </g>
                  )}
                  {cursor === c && <circle cx={p.x} cy={p.y} r={0.46} className={styles.cursor} />}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={0.5}
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
  };
}
