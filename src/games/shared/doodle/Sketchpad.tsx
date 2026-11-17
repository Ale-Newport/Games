/**
 * A drawing surface shared by the doodle games. In draw mode it records strokes with mouse, pen or
 * touch (coordinates 0–255, like the Quick Draw data); in show mode it renders given strokes,
 * optionally only a fraction of their points (for doodles being "drawn" by a bot).
 */
import { useEffect, useRef } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import type { Stroke } from './doodle';
import styles from './Sketchpad.module.css';

const SIZE = 512;

/** Points drawn when showing a fraction of a doodle, stroke by stroke. */
export function partialStrokes(strokes: readonly Stroke[], fraction: number): Stroke[] {
  const total = strokes.reduce((n, s) => n + s[0].length, 0);
  let budget = Math.floor(total * Math.max(0, Math.min(1, fraction)));
  const out: Stroke[] = [];
  for (const [xs, ys] of strokes) {
    if (budget <= 0) break;
    const k = Math.min(xs.length, budget);
    out.push([xs.slice(0, k), ys.slice(0, k)]);
    budget -= k;
  }
  return out;
}

/** Fit 0–255 doodle coordinates (Quick Draw style) into the canvas with a margin. */
function fit(strokes: readonly Stroke[]): { scale: number; ox: number; oy: number } {
  let x1 = 0;
  let y1 = 0;
  for (const [xs, ys] of strokes) {
    for (const x of xs) x1 = Math.max(x1, x);
    for (const y of ys) y1 = Math.max(y1, y);
  }
  const span = Math.max(255, x1, y1);
  const scale = (SIZE * 0.86) / span;
  return { scale, ox: (SIZE - x1 * scale) / 2, oy: (SIZE - y1 * scale) / 2 };
}

export function Sketchpad({
  strokes,
  onStrokes,
  drawing,
  label,
  autoFit = false,
  testId = 'sketchpad',
}: {
  strokes: readonly Stroke[];
  onStrokes?: (s: Stroke[]) => void;
  drawing: boolean;
  label: string;
  /** Center and scale shown doodles (bots' drawings); the player's own drawing is shown 1:1. */
  autoFit?: boolean;
  testId?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = useRef<Stroke | null>(null);
  const strokesRef = useLatest(strokes);

  const paint = (list: readonly Stroke[]) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    const f = autoFit ? fit(list) : { scale: SIZE / 256, ox: 0, oy: 0 };
    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [xs, ys] of list) {
      if (!xs.length) continue;
      ctx.beginPath();
      ctx.moveTo(xs[0]! * f.scale + f.ox, ys[0]! * f.scale + f.oy);
      if (xs.length === 1) ctx.lineTo(xs[0]! * f.scale + f.ox + 0.1, ys[0]! * f.scale + f.oy);
      for (let i = 1; i < xs.length; i++)
        ctx.lineTo(xs[i]! * f.scale + f.ox, ys[i]! * f.scale + f.oy);
      ctx.stroke();
    }
  };

  useEffect(() => {
    paint(current.current ? [...strokes, current.current] : strokes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, autoFit]);

  const point = (e: React.PointerEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [
      Math.round(Math.max(0, Math.min(255, ((e.clientX - r.left) / r.width) * 256))),
      Math.round(Math.max(0, Math.min(255, ((e.clientY - r.top) / r.height) * 256))),
    ];
  };

  const down = (e: React.PointerEvent) => {
    if (!drawing) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const [x, y] = point(e);
    current.current = [[x], [y]];
    paint([...strokesRef.current, current.current]);
  };
  const move = (e: React.PointerEvent) => {
    const c = current.current;
    if (!drawing || !c) return;
    const [x, y] = point(e);
    const lx = c[0][c[0].length - 1]!;
    const ly = c[1][c[1].length - 1]!;
    if (Math.hypot(x - lx, y - ly) < 2) return;
    c[0].push(x);
    c[1].push(y);
    paint([...strokesRef.current, c]);
  };
  const up = () => {
    const c = current.current;
    current.current = null;
    if (c && onStrokes) onStrokes([...strokesRef.current, c]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      className={styles.pad}
      data-drawing={drawing}
      role="img"
      aria-label={label}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      data-testid={testId}
      data-strokes={strokes.length}
    />
  );
}
