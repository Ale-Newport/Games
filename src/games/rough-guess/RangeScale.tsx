/**
 * The range picker: a log scale with two handles (lower and upper bound) and the band between
 * them. Pointer: drag a handle, or the band to move both; keyboard: each handle is a slider
 * (← → or ↑ ↓, Shift for big steps, Home/End). After locking in, the answer appears as a star and
 * the band turns green (hit) or red (miss).
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import styles from './RoughGuess.module.css';

interface Props {
  /** Scale, log10. */
  domain: [number, number];
  /** Current range, log10. */
  range: [number, number];
  onRange: (r: [number, number]) => void;
  /** log10 of the answer once revealed. */
  answer: number | null;
  hit: boolean | null;
  format: (v: number) => string;
  labels: { low: string; high: string };
  disabled: boolean;
  /** Tick positions (log10) to use instead of the 1-2-5 series. */
  tickValues?: number[];
}

/** Smallest allowed width, log10 (a ×1.01 range). */
const MIN_W = Math.log10(1.01);

/** “Nice” tick values (1, 2, 5 × 10^k) inside the scale, thinned to fit. */
function ticks(d: [number, number], maxTicks: number): number[] {
  const out: number[] = [];
  for (let e = Math.floor(d[0]); e <= Math.ceil(d[1]); e++)
    for (const m of [1, 2, 5]) {
      const v = Math.log10(m) + e;
      if (v >= d[0] && v <= d[1]) out.push(v);
    }
  if (out.length <= maxTicks) return out;
  const decades = out.filter((v) => Math.abs(v - Math.round(v)) < 1e-9);
  const step = Math.ceil(decades.length / maxTicks);
  return decades.filter((_, i) => i % step === 0);
}

export function RangeScale({
  domain: d,
  range,
  onRange,
  answer,
  hit,
  format,
  labels,
  disabled,
  tickValues,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const w = e?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = Math.max(280, Math.round(width));
  const H = 118;
  const PAD = 24;
  const y = 64;
  const x = (v: number) => PAD + ((v - d[0]) / (d[1] - d[0])) * (W - 2 * PAD);
  const toV = (px: number) => d[0] + ((px - PAD) / (W - 2 * PAD)) * (d[1] - d[0]);
  const rangeRef = useLatest(range);
  const drag = useRef<{ part: 'lo' | 'hi' | 'band'; offset: number } | null>(null);

  const clampRange = (lo: number, hi: number): [number, number] => {
    lo = Math.max(d[0], Math.min(d[1] - MIN_W, lo));
    hi = Math.min(d[1], Math.max(lo + MIN_W, hi));
    return [lo, hi];
  };
  const set = (r: [number, number]) => {
    rangeRef.current = r;
    onRange(r);
  };

  const pointerV = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return null;
    return toV(new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x);
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const v = pointerV(e);
    if (v === null) return;
    e.preventDefault();
    svg.current?.setPointerCapture(e.pointerId);
    const [lo, hi] = rangeRef.current;
    const px = x(v);
    const dLo = Math.abs(px - x(lo));
    const dHi = Math.abs(px - x(hi));
    if (v > lo && v < hi && Math.min(dLo, dHi) > 16)
      drag.current = { part: 'band', offset: v - lo };
    else {
      const part = dLo <= dHi ? 'lo' : 'hi';
      drag.current = { part, offset: 0 };
      set(part === 'lo' ? clampRange(v, hi) : clampRange(lo, v));
    }
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const g = drag.current;
    if (!g || disabled) return;
    const v = pointerV(e);
    if (v === null) return;
    const [lo, hi] = rangeRef.current;
    if (g.part === 'lo') set(clampRange(Math.min(v, hi - MIN_W), hi));
    else if (g.part === 'hi') set(clampRange(lo, Math.max(v, lo + MIN_W)));
    else {
      const w = hi - lo;
      const nlo = Math.max(d[0], Math.min(d[1] - w, v - g.offset));
      set([nlo, nlo + w]);
    }
  };
  const up = () => {
    drag.current = null;
  };

  const keyFor = (part: 'lo' | 'hi') => (e: KeyboardEvent<SVGGElement>) => {
    if (disabled) return;
    const step = (e.shiftKey ? 5 : 1) * 0.01 * (d[1] - d[0]) * 2;
    const [lo, hi] = rangeRef.current;
    let v = part === 'lo' ? lo : hi;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step;
    else if (e.key === 'Home') v = part === 'lo' ? d[0] : lo + MIN_W;
    else if (e.key === 'End') v = part === 'lo' ? hi - MIN_W : d[1];
    else return;
    e.preventDefault();
    set(
      part === 'lo'
        ? clampRange(Math.min(v, hi - MIN_W), hi)
        : clampRange(lo, Math.max(v, lo + MIN_W)),
    );
  };

  const [lo, hi] = range;
  const maxTicks = W < 420 ? 4 : W < 640 ? 6 : 9;
  // Keep ticks at least ~64 px apart so their labels never collide.
  const tickVals: number[] = [];
  for (const v of tickValues ?? ticks(d, maxTicks))
    if (!tickVals.length || x(v) - x(tickVals[tickVals.length - 1]!) >= 64) tickVals.push(v);
  const handle = (part: 'lo' | 'hi') => {
    const v = part === 'lo' ? lo : hi;
    return (
      <g
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={part === 'lo' ? labels.low : labels.high}
        aria-valuemin={d[0]}
        aria-valuemax={d[1]}
        aria-valuenow={v}
        aria-valuetext={format(Math.pow(10, v))}
        onKeyDown={keyFor(part)}
        className={styles.handle}
        data-testid={`rg-handle-${part}`}
      >
        <rect x={x(v) - 9} y={y - 24} width={18} height={48} rx={6} />
        <line x1={x(v)} x2={x(v)} y1={y - 14} y2={y + 14} />
      </g>
    );
  };

  return (
    <div ref={box} className={styles.scaleBox}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.scale}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        data-disabled={disabled}
      >
        <rect width={W} height={H} rx={8} className={styles.scaleBg} />
        <line x1={PAD} x2={W - PAD} y1={y} y2={y} className={styles.track} />
        {tickVals.map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={y + 20} y2={y + 26} className={styles.tickLine} />
            <text x={x(v)} y={y + 42} className={styles.tick}>
              {format(Math.pow(10, v))}
            </text>
          </g>
        ))}
        <rect
          x={x(lo)}
          y={y - 16}
          width={Math.max(2, x(hi) - x(lo))}
          height={32}
          rx={4}
          className={styles.band}
          data-hit={hit === null ? undefined : hit}
          data-testid="rg-band"
        />
        {handle('lo')}
        {handle('hi')}
        {answer !== null && (
          <g data-testid="rg-answer-marker">
            <line
              x1={x(answer)}
              x2={x(answer)}
              y1={y - 30}
              y2={y + 18}
              className={styles.answerLine}
            />
            <path
              d={`M${x(answer)} ${y - 44}l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z`}
              className={styles.star}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
