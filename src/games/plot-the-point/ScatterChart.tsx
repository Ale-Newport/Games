/**
 * The scatter chart: every visible country as a dot (names on hover, the most populous labelled),
 * the mystery countries as coloured markers the player drags into place (or nudges with the
 * keyboard), and after submitting the true positions, the gap lines and the computer's
 * placements.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { formatValue, niceTicks } from '../shared/stats/stats';
import { indicatorOf, type Axis, type Layout } from './engine';
import styles from './PlotThePoint.module.css';

interface Props {
  l: Layout;
  xCode: string;
  yCode: string;
  names: (ent: number) => string;
  labelled: Set<number>;
  targets: number[];
  placed: ([number, number] | null)[];
  active: number;
  onActive: (i: number) => void;
  onPlace: (i: number, p: [number, number]) => void;
  truth: [number, number][] | null;
  computer: [number, number][] | null;
  locale: string;
  label: string;
  onSubmit: () => void;
}

/** Axis ticks in data units: nice linear ticks, or 1-2-5 × 10^k on log axes. */
function axisTicks(a: Axis): number[] {
  if (!a.log) return niceTicks(a.lo, a.hi, 5);
  const out: number[] = [];
  for (let e = Math.floor(a.lo); e <= Math.ceil(a.hi); e++)
    for (const m of [1, 2, 5]) {
      const t = Math.log10(m) + e;
      if (t >= a.lo && t <= a.hi) out.push(Math.pow(10, t));
    }
  return out.length > 7 ? out.filter((v) => Math.abs(Math.log10(v) % 1) < 1e-9) : out;
}

export function ScatterChart({
  l,
  xCode,
  yCode,
  names,
  labelled,
  targets,
  placed,
  active,
  onActive,
  onPlace,
  truth,
  computer,
  locale,
  label,
  onSubmit,
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
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const H = Math.round(Math.min(520, W * (W < 520 ? 0.95 : 0.66)));
  const M = { left: W < 420 ? 50 : 62, right: 14, top: 14, bottom: 26 };
  const PW = W - M.left - M.right;
  const PH = H - M.top - M.bottom;
  const px = (n: number) => M.left + n * PW;
  const py = (n: number) => M.top + (1 - n) * PH;
  const toN = (v: number, a: Axis) => ((a.log ? Math.log10(v) : v) - a.lo) / (a.hi - a.lo);
  const xi = indicatorOf(xCode);
  const yi = indicatorOf(yCode);
  const revealed = truth !== null;
  const placedRef = useLatest(placed);
  const activeRef = useLatest(active);
  const dragging = useRef<number | null>(null);

  const pointer = (e: PointerEvent<SVGSVGElement>): [number, number] | null => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [
      Math.min(1, Math.max(0, (p.x - M.left) / PW)),
      Math.min(1, Math.max(0, 1 - (p.y - M.top) / PH)),
    ];
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (revealed || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = pointer(e);
    if (!p) return;
    e.preventDefault();
    svg.current?.setPointerCapture(e.pointerId);
    // Grab a placed marker near the pointer, otherwise place the active one.
    let which = activeRef.current;
    placedRef.current.forEach((q, i) => {
      if (q && Math.hypot(px(q[0]) - px(p[0]), py(q[1]) - py(p[1])) < 16) which = i;
    });
    dragging.current = which;
    onActive(which);
    onPlace(which, p);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current === null || revealed) return;
    const p = pointer(e);
    if (p) onPlace(dragging.current, p);
  };
  const up = () => {
    if (dragging.current === null) return;
    dragging.current = null;
    // Move on to the next mystery country still to place.
    const next = placedRef.current.findIndex((q) => q === null);
    if (next >= 0) onActive(next);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (revealed) return;
    const i = activeRef.current;
    const step = e.shiftKey ? 0.1 : 0.02;
    const cur = placedRef.current[i] ?? [0.5, 0.5];
    let p: [number, number];
    if (e.key === 'ArrowLeft') p = [cur[0] - step, cur[1]];
    else if (e.key === 'ArrowRight') p = [cur[0] + step, cur[1]];
    else if (e.key === 'ArrowUp') p = [cur[0], cur[1] + step];
    else if (e.key === 'ArrowDown') p = [cur[0], cur[1] - step];
    else if (e.key === 'Tab' && !e.shiftKey && i < targets.length - 1) {
      e.preventDefault();
      onActive(i + 1);
      return;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
      return;
    } else return;
    e.preventDefault();
    onPlace(i, [Math.min(1, Math.max(0, p[0])), Math.min(1, Math.max(0, p[1]))]);
  };

  const xt = axisTicks(l.x);
  const yt = axisTicks(l.y);
  const fmtX = (v: number) => formatValue(v, xi, locale, true);
  const fmtY = (v: number) => formatValue(v, yi, locale, true);
  const cur = placed[active];

  return (
    <div
      ref={box}
      className={styles.chartBox}
      tabIndex={revealed ? -1 : 0}
      onKeyDown={key}
      role="application"
      aria-label={label}
      data-testid="pp-chart"
    >
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.chart}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        data-revealed={revealed}
      >
        <rect x={M.left} y={M.top} width={PW} height={PH} className={styles.plotBg} />
        {yt.map((v) => (
          <g key={`y${v}`}>
            <line
              x1={M.left}
              x2={M.left + PW}
              y1={py(toN(v, l.y))}
              y2={py(toN(v, l.y))}
              className={styles.grid}
            />
            <text x={M.left - 6} y={py(toN(v, l.y)) + 4} className={styles.yLabel}>
              {fmtY(v)}
            </text>
          </g>
        ))}
        {xt.map((v) => (
          <g key={`x${v}`}>
            <line
              x1={px(toN(v, l.x))}
              x2={px(toN(v, l.x))}
              y1={M.top}
              y2={M.top + PH}
              className={styles.grid}
            />
            <text x={px(toN(v, l.x))} y={M.top + PH + 16} className={styles.xLabel}>
              {fmtX(v)}
            </text>
          </g>
        ))}
        {l.points
          .filter((p) => !targets.includes(p.ent))
          .map((p) => (
            <g key={p.ent}>
              <circle cx={px(toN(p.x, l.x))} cy={py(toN(p.y, l.y))} r={3.6} className={styles.dot}>
                <title>{names(p.ent)}</title>
              </circle>
              {labelled.has(p.ent) && (
                // Labels on the right half sit left of their dot so they stay inside the plot.
                <text
                  x={px(toN(p.x, l.x)) + (toN(p.x, l.x) > 0.6 ? -5 : 5)}
                  y={py(toN(p.y, l.y)) - 5}
                  textAnchor={toN(p.x, l.x) > 0.6 ? 'end' : 'start'}
                  className={styles.dotLabel}
                >
                  {names(p.ent)}
                </text>
              )}
            </g>
          ))}
        {/* Cross-hair for the active marker (keyboard users) */}
        {!revealed && cur && (
          <g className={styles.cross}>
            <line x1={px(cur[0])} x2={px(cur[0])} y1={M.top} y2={M.top + PH} />
            <line x1={M.left} x2={M.left + PW} y1={py(cur[1])} y2={py(cur[1])} />
          </g>
        )}
        {computer &&
          computer.map((c, i) => (
            <path
              key={`c${i}`}
              d={`M${px(c[0])} ${py(c[1]) - 6}l6 6-6 6-6-6z`}
              className={`${styles.cpu} ${styles[`t${i}`]}`}
              data-testid={`pp-cpu-${i}`}
            />
          ))}
        {truth &&
          truth.map((t, i) => {
            const g = placed[i];
            return (
              <g key={`t${i}`} className={styles[`t${i}`]} data-testid={`pp-truth-${i}`}>
                {g && (
                  <line
                    x1={px(g[0])}
                    y1={py(g[1])}
                    x2={px(t[0])}
                    y2={py(t[1])}
                    className={styles.gapLine}
                  />
                )}
                <circle cx={px(t[0])} cy={py(t[1])} r={7} className={styles.truth} />
                <text x={px(t[0]) + 9} y={py(t[1]) + 4} className={styles.truthLabel}>
                  {names(targets[i]!)}
                </text>
              </g>
            );
          })}
        {placed.map((g, i) =>
          g ? (
            <g
              key={`g${i}`}
              className={styles[`t${i}`]}
              data-active={i === active && !revealed}
              data-testid={`pp-marker-${i}`}
            >
              <circle
                cx={px(g[0])}
                cy={py(g[1])}
                r={9}
                className={revealed ? styles.guessDone : styles.guess}
              />
              <text x={px(g[0])} y={py(g[1]) + 4} className={styles.markerNum}>
                {i + 1}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}
