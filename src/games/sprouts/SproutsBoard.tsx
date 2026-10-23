import { useMemo, useRef, useState, type PointerEvent } from 'react';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import {
  H,
  W,
  buildGrid,
  curveProblem,
  joinable,
  neighbors,
  regions,
  type SproutsState,
} from './engine';
import { route } from './route';
import styles from './SproutsBoard.module.css';

const center = (p: number) => ({ x: (p % W) + 0.5, y: Math.floor(p / W) + 0.5 });

type Pt = { x: number; y: number };

/** Ramer–Douglas–Peucker: drop points within `eps` of the line through their neighbors. */
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts;
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let worst = 0;
  let at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const d = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
    if (d > worst) {
      worst = d;
      at = i;
    }
  }
  if (worst <= eps) return [a, b];
  return [...simplify(pts.slice(0, at + 1), eps).slice(0, -1), ...simplify(pts.slice(at), eps)];
}

/** The curve as drawn: cell staircase simplified, then Chaikin-smoothed, end points kept. */
export function smooth(cells: readonly number[], rounds = 3): Pt[] {
  let pts = simplify(cells.map(center), 0.75);
  for (let k = 0; k < rounds && pts.length > 2; k++) {
    const next = [pts[0]!];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      next.push({ x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y });
      next.push({ x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y });
    }
    next.push(pts[pts.length - 1]!);
    pts = next;
  }
  return pts;
}

const toPoints = (pts: { x: number; y: number }[]) =>
  pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

/** 4-connected cells from `a` to `b` (exclusive of `a`), stepping along the larger gap first. */
function stepCells(a: number, b: number): number[] {
  const out: number[] = [];
  let r = Math.floor(a / W);
  let c = a % W;
  const r1 = Math.floor(b / W);
  const c1 = b % W;
  while (r !== r1 || c !== c1) {
    if (Math.abs(r1 - r) >= Math.abs(c1 - c)) r += Math.sign(r1 - r);
    else c += Math.sign(c1 - c);
    out.push(r * W + c);
  }
  return out;
}

export function SproutsBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<SproutsState, string>) {
  const grid = useMemo(() => buildGrid(state), [state]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [path, setPath] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setPath([]);
    setSelected(null);
    setProblem(null);
  }
  const spotAt = (p: number) => (grid.kind[p] === 2 ? grid.owner[p]! : -1);

  const cellFromEvent = (e: PointerEvent<SVGSVGElement>) => {
    const box = svgRef.current!.getBoundingClientRect();
    const x = Math.min(W - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * W)));
    const y = Math.min(H - 1, Math.max(0, Math.floor(((e.clientY - box.top) / box.height) * H)));
    return y * W + x;
  };
  /** A living spot at or right next to the cell (fingers are wider than a cell). */
  const nearSpot = (p: number) => {
    if (spotAt(p) >= 0) return spotAt(p);
    for (const q of neighbors(p))
      if (spotAt(q) >= 0 && state.spots[spotAt(q)]!.lives > 0) return spotAt(q);
    return -1;
  };

  const connect = (a: number, b: number) => {
    const options = joinable(state, grid).filter(
      ([x, y]) => (x === a && y === b) || (x === b && y === a),
    );
    const ids = regions(grid);
    for (const [x, y, region] of options) {
      const cells = route(state, x, y, region, undefined, grid, ids);
      if (cells) return onAction((x === a ? cells : [...cells].reverse()).join('.'));
    }
    setProblem('none');
  };

  const tapSpot = (i: number) => {
    if (!interactive) return;
    setProblem(null);
    if (selected === null) {
      if (state.spots[i]!.lives > 0) setSelected(i);
      else setProblem('lives');
      return;
    }
    const a = selected;
    setSelected(null);
    connect(a, i);
  };

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const spot = nearSpot(cellFromEvent(e));
    if (spot < 0 || state.spots[spot]!.lives < 1) return;
    svgRef.current!.setPointerCapture?.(e.pointerId);
    setDrawing(true);
    setProblem(null);
    setPath([state.spots[spot]!.cell]);
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const p = cellFromEvent(e);
    setPath((prev) => {
      const last = prev[prev.length - 1]!;
      if (p === last) return prev;
      let next = prev;
      for (const q of stepCells(last, p)) {
        const at = next.indexOf(q);
        // Moving back over the curve rubs it out.
        next = at >= 0 ? next.slice(0, at + 1) : [...next, q];
      }
      return next;
    });
  };
  const onUp = () => {
    if (!drawing) return;
    setDrawing(false);
    let cells = path;
    if (cells.length <= 1) {
      // A tap rather than a drag: select or connect spots.
      if (cells.length === 1) tapSpot(spotAt(cells[0]!));
      setPath([]);
      return;
    }
    // Let a curve that stops next to a spot finish on it.
    const last = cells[cells.length - 1]!;
    if (spotAt(last) < 0) {
      const end = neighbors(last).find((q) => spotAt(q) >= 0 && q !== cells[cells.length - 2]);
      if (end !== undefined) cells = [...cells, end];
    }
    const issue = curveProblem(state, grid, cells);
    if (issue) {
      setProblem(issue);
      setPath([]);
      return;
    }
    setPath([]);
    onAction(cells.join('.'));
  };

  const drawingBad =
    path.length > 1 && path.slice(1, -1).some((p) => grid.kind[p] === 1 || grid.kind[p] === 2);
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="sprouts-board">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="group"
        aria-label={t('board.label')}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          setDrawing(false);
          setPath([]);
        }}
      >
        <rect width={W} height={H} className={styles.paper} />
        {state.curves.map((cells, i) => (
          <polyline
            key={i}
            points={toPoints(smooth(cells))}
            className={`${styles.curve} ${(state.first + i) % 2 === 0 ? styles.seat0 : styles.seat1} ${i === state.curves.length - 1 ? styles.last : ''}`}
          />
        ))}
        {hint && (
          <polyline
            points={toPoints(smooth(hint.split('.').map(Number)))}
            className={styles.hint}
          />
        )}
        {path.length > 1 && (
          <polyline
            points={toPoints(path.map(center))}
            className={`${styles.drawing} ${drawingBad ? styles.bad : ''}`}
          />
        )}
        {state.spots.map((spot, i) => {
          const { x, y } = center(spot.cell);
          return (
            <g
              key={i}
              className={`${styles.spot} ${spot.lives ? styles.alive : styles.dead} ${selected === i ? styles.selected : ''}`}
              data-spot={i}
              role="button"
              tabIndex={interactive && spot.lives ? 0 : -1}
              aria-label={t(
                spot.lives === 1 ? 'spot.label1' : spot.lives === 0 ? 'spot.label0' : 'spot.label',
                { n: i + 1, lives: spot.lives },
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  tapSpot(i);
                }
              }}
            >
              <circle cx={x} cy={y} r={0.95} />
              {Array.from({ length: spot.lives }, (_, k) => (
                <circle
                  key={k}
                  cx={x + (k - (spot.lives - 1) / 2) * 0.42}
                  cy={y}
                  r={0.15}
                  className={styles.life}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <p className={styles.message} role="status" data-testid="sprouts-message">
        {problem
          ? t(`problem.${problem}`)
          : selected !== null
            ? t('info.selected', { n: selected + 1 })
            : ' '}
      </p>
    </div>
  );
}
