/**
 * The chart with gaps: a line of years or eight bars, with three values hidden. Each gap is a
 * handle that slides vertically — dragged with the pointer (anywhere in its column) or, focused,
 * moved with ↑ ↓ (Shift: 5 % steps, otherwise 1 %), Home / End. After locking, each real value
 * appears in green next to the guess.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { niceTicks } from '../shared/stats/stats';
import type { Chart } from './engine';
import styles from './GapGraph.module.css';

interface Props {
  c: Chart;
  /** Values in chart order (null at the gaps while playing). */
  shown: (number | null)[];
  labels: string[];
  guesses: (number | null)[];
  real: number[] | null;
  onSet: (i: number, v: number) => void;
  format: (v: number) => string;
  label: string;
  gapLabel: (i: number) => string;
}

export function GapChart({
  c,
  shown,
  labels,
  guesses,
  real,
  onSet,
  format,
  label,
  gapLabel,
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
  const W = Math.max(300, Math.round(width));
  const H = Math.round(Math.min(380, Math.max(260, W * 0.55)));
  const narrow = W < 520;
  const M = {
    left: narrow ? 50 : 62,
    right: 12,
    top: 14,
    bottom: c.kind === 'bars' ? (narrow ? 58 : 40) : 30,
  };
  const PW = W - M.left - M.right;
  const PH = H - M.top - M.bottom;
  const n = shown.length;
  const x = (k: number) =>
    M.left + (c.kind === 'bars' ? ((k + 0.5) / n) * PW : (k / Math.max(1, n - 1)) * PW);
  const y = (v: number) => M.top + (1 - (v - c.lo) / (c.hi - c.lo)) * PH;
  const vAt = (py: number) => c.lo + (1 - (py - M.top) / PH) * (c.hi - c.lo);
  const locked = real !== null;
  const guessesRef = useLatest(guesses);
  const drag = useRef<number | null>(null);

  const point = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svg.current?.getScreenCTM();
    return ctm ? new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()) : null;
  };
  const nearestGap = (px: number) => {
    let best = -1;
    let dist = c.kind === 'bars' ? PW / n / 2 + 4 : Math.max(18, PW / Math.max(1, n - 1) / 1.5);
    c.gaps.forEach((g, i) => {
      const d = Math.abs(x(g) - px);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = point(e);
    if (!p) return;
    const i = nearestGap(p.x);
    if (i < 0) return;
    e.preventDefault();
    svg.current?.setPointerCapture(e.pointerId);
    drag.current = i;
    onSet(i, vAt(p.y));
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (drag.current === null || locked) return;
    const p = point(e);
    if (p) onSet(drag.current, vAt(p.y));
  };
  const up = () => {
    drag.current = null;
  };
  const keyFor = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    if (locked) return;
    const span = c.hi - c.lo;
    const cur = guessesRef.current[i] ?? c.lo + span / 2;
    const step = span * (e.shiftKey ? 0.05 : 0.01);
    let v: number;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') v = cur + step;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') v = cur - step;
    else if (e.key === 'Home') v = c.lo;
    else if (e.key === 'End') v = c.hi;
    else return;
    e.preventDefault();
    onSet(i, v);
  };

  const ticks = niceTicks(c.lo, c.hi, 5).filter((v) => v >= c.lo - 1e-9 && v <= c.hi + 1e-9);
  const zero = c.lo < 0 && c.hi > 0 ? 0 : c.lo;
  // Line: the visible stretches as paths (broken at the gaps).
  const segments: [number, number][][] = [];
  if (c.kind === 'line') {
    let cur: [number, number][] = [];
    shown.forEach((v, k) => {
      if (v === null) {
        if (cur.length) segments.push(cur);
        cur = [];
      } else cur.push([x(k), y(v)]);
    });
    if (cur.length) segments.push(cur);
  }
  const step = c.kind === 'line' ? (n / (PW / 50) > 2 ? 5 : n / (PW / 50) > 1 ? 2 : 1) : 1;
  const path = (pts: [number, number][]) =>
    pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join('');

  return (
    <div ref={box} className={styles.chartBox}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.chart}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="group"
        aria-label={label}
        data-locked={locked}
        data-testid="gg-chart"
      >
        <rect x={M.left} y={M.top} width={PW} height={PH} className={styles.plotBg} />
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + PW} y1={y(v)} y2={y(v)} className={styles.grid} />
            <text x={M.left - 6} y={y(v) + 4} className={styles.tickY}>
              {format(v)}
            </text>
          </g>
        ))}
        {labels.map((l, k) =>
          c.kind === 'bars' || k % step === 0 || k === n - 1 ? (
            <text
              key={k}
              x={x(k)}
              y={c.kind === 'bars' && narrow ? H - M.bottom + 12 : H - M.bottom + 18}
              className={styles.tickX}
              transform={
                c.kind === 'bars' && narrow ? `rotate(-40 ${x(k)} ${H - M.bottom + 12})` : undefined
              }
              textAnchor={c.kind === 'bars' && narrow ? 'end' : 'middle'}
            >
              {c.kind === 'bars' && narrow && l.length > 12 ? `${l.slice(0, 11)}…` : l}
            </text>
          ) : null,
        )}
        {c.kind === 'bars'
          ? shown.map((v, k) =>
              v === null ? null : (
                <rect
                  key={k}
                  x={x(k) - (PW / n) * 0.32}
                  width={(PW / n) * 0.64}
                  y={Math.min(y(v), y(zero))}
                  height={Math.abs(y(v) - y(zero))}
                  className={styles.bar}
                />
              ),
            )
          : segments.map((seg, i) => (
              <g key={i}>
                <path d={path(seg)} className={styles.line} />
                {seg.map(([a, b], k) => (
                  <circle key={k} cx={a} cy={b} r={2.6} className={styles.dot} />
                ))}
              </g>
            ))}
        {c.gaps.map((g, i) => {
          const gx = x(g);
          const v = guesses[i];
          const r = real?.[i];
          return (
            <g key={`g${i}`} data-testid={`gg-gap-${i}`}>
              <rect
                x={gx - (c.kind === 'bars' ? (PW / n) * 0.34 : 12)}
                width={c.kind === 'bars' ? (PW / n) * 0.68 : 24}
                y={M.top}
                height={PH}
                className={styles.gapZone}
              />
              {v !== null && v !== undefined && c.kind === 'bars' && (
                <rect
                  x={gx - (PW / n) * 0.32}
                  width={(PW / n) * 0.64}
                  y={Math.min(y(v), y(zero))}
                  height={Math.abs(y(v) - y(zero))}
                  className={styles.guessBar}
                />
              )}
              {r !== undefined && (
                <>
                  {c.kind === 'bars' ? (
                    <rect
                      x={gx - (PW / n) * 0.16}
                      width={(PW / n) * 0.32}
                      y={Math.min(y(r), y(zero))}
                      height={Math.abs(y(r) - y(zero))}
                      className={styles.realBar}
                    />
                  ) : (
                    <circle cx={gx} cy={y(r)} r={5} className={styles.realDot} />
                  )}
                  {v !== null && v !== undefined && (
                    <line x1={gx} x2={gx} y1={y(v)} y2={y(r)} className={styles.miss} />
                  )}
                </>
              )}
              <g
                role="slider"
                tabIndex={locked ? -1 : 0}
                aria-label={gapLabel(i)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  v === null || v === undefined
                    ? undefined
                    : Math.round(((v - c.lo) / (c.hi - c.lo)) * 100)
                }
                aria-valuetext={v === null || v === undefined ? undefined : format(v)}
                onKeyDown={keyFor(i)}
                className={styles.handle}
                data-set={v !== null && v !== undefined}
                data-testid={`gg-handle-${i}`}
              >
                <circle cx={gx} cy={v === null || v === undefined ? M.top + PH / 2 : y(v)} r={10} />
                <text x={gx} y={(v === null || v === undefined ? M.top + PH / 2 : y(v)) + 4}>
                  {i + 1}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
