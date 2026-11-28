/**
 * The interactive chart: the visible part of the series, the hidden zone where the forecast is
 * drawn (pointer: freehand, any number of strokes; keyboard: pick a year and raise/lower it), and
 * after scoring the animated reveal of the real line, the gap between both and the computer's
 * forecast.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import type { Translator } from '../../core/i18n';
import { formatValue, niceTicks, type Series } from '../shared/stats/stats';
import {
  clampTo,
  completeDraft,
  drawSegment,
  hiddenCount,
  type Challenge,
  type Draft,
} from './engine';
import styles from './GraphForecast.module.css';

/** Chart geometry in CSS pixels for a container width, so text keeps its real size. */
function layout(width: number) {
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const H = Math.round(Math.min(440, W < 520 ? W * 0.78 : W * 0.6));
  const M = { left: W < 420 ? 52 : 62, right: 14, top: 16, bottom: 32 };
  return { W, H, M, PW: W - M.left - M.right, PH: H - M.top - M.bottom };
}

interface Props {
  series: Series;
  c: Challenge;
  draft: Draft;
  onDraft: (d: Draft) => void;
  /** Scored forecast and the computer's, once the round is revealed. */
  pred: number[] | null;
  cpu: number[] | null;
  locale: string;
  reducedMotion: boolean;
  t: Translator;
  onSubmit: () => void;
  onStroke?: () => void;
  /** An optional reference curve over the whole window (e.g. the world's), drawn dashed. */
  guide?: (number | null)[];
}

const path = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

export function ForecastChart({
  series,
  c,
  draft,
  onDraft,
  pred,
  cpu,
  locale,
  reducedMotion,
  t,
  onSubmit,
  onStroke,
  guide,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { W, H, M, PW, PH } = layout(width);
  const last = useRef<{ x: number; y: number } | null>(null);
  const draftRef = useLatest(draft);
  const [cursor, setCursor] = useState(0);
  const [drawing, setDrawing] = useState(false);
  // Handlers read the ref: moves can arrive before React re-renders with the new state.
  const drawingRef = useRef(false);

  const L = c.to - c.from + 1;
  const first = c.cut - c.from;
  const n = hiddenCount(c);
  const values = series.values.slice(c.from, c.to + 1);
  const x = (i: number) => M.left + (i / (L - 1)) * PW;
  const y = (v: number) => M.top + ((c.hi - v) / (c.hi - c.lo)) * PH;
  const lastVisible = values[first - 1]!;
  const revealed = pred !== null;

  const toData = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const xi = ((p.x - M.left) / PW) * (L - 1);
    const v = c.hi - ((p.y - M.top) / PH) * (c.hi - c.lo);
    return { x: Math.max(first - 0.5, Math.min(L - 1, xi)), y: clampTo(c, v) };
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (revealed || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const p = toData(e);
    if (!p) return;
    drawingRef.current = true;
    setDrawing(true);
    last.current = p;
    onDraft(drawSegment(c, draftRef.current, null, p));
    onStroke?.();
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current || revealed) return;
    const p = toData(e);
    if (!p) return;
    const d = drawSegment(c, draftRef.current, last.current, p);
    last.current = p;
    onDraft(d);
  };
  const up = () => {
    drawingRef.current = false;
    setDrawing(false);
    last.current = null;
  };

  const cursorRef = useLatest(cursor);
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (revealed) return;
    // Read and write through refs: several keys can arrive before React re-renders.
    const d0 = draftRef.current;
    const at = cursorRef.current;
    const step = ((c.hi - c.lo) / 100) * (e.shiftKey ? 5 : 1);
    const valueAt = (i: number): number => {
      const own = d0[i];
      if (own != null) return own;
      const filled = completeDraft(c, d0, lastVisible);
      if (filled) return filled[i]!;
      return i > 0 ? valueAt(i - 1) : lastVisible;
    };
    const set = (i: number, v: number) => {
      const d = d0.slice();
      d[i] = clampTo(c, v);
      draftRef.current = d;
      onDraft(d);
    };
    const move = (k: number) => {
      const to = Math.max(0, Math.min(n - 1, k));
      cursorRef.current = to;
      setCursor(to);
    };
    switch (e.key) {
      case 'ArrowLeft':
        move(at - 1);
        break;
      case 'ArrowRight':
        move(at + 1);
        break;
      case 'ArrowUp':
        set(at, valueAt(at) + step);
        break;
      case 'ArrowDown':
        set(at, valueAt(at) - step);
        break;
      case ' ':
        // Keep this year (filling it from the year before when empty) and move on.
        if (d0[at] == null) set(at, at > 0 ? valueAt(at - 1) : lastVisible);
        move(at + 1);
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(n - 1);
        break;
      case 'Enter':
        onSubmit();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const ticks = niceTicks(c.lo, c.hi, 5).filter((v) => v >= c.lo - 1e-9 && v <= c.hi + 1e-9);
  const yearStep = L / (PW / 56) > 5 ? 10 : L / (PW / 56) > 2 ? 5 : 2;
  const years: number[] = [];
  for (let i = 0; i < L; i++) if ((series.start + c.from + i) % yearStep === 0) years.push(i);
  const cutX = (x(first - 1) + x(first)) / 2;

  const visiblePts = values.slice(0, first).map((v, i) => [x(i), y(v)] as [number, number]);
  // The drawn forecast: drawn years, joined; a dashed join from the last visible point.
  const complete = completeDraft(c, draft, lastVisible);
  const drawnPts: [number, number][] = [];
  draft.forEach((v, i) => {
    if (v != null) drawnPts.push([x(first + i), y(v)]);
  });
  const shownPred = pred ?? complete;
  const predPts = shownPred?.map((v, i) => [x(first + i), y(v)] as [number, number]);

  const actual = values.slice(first);
  const actualPts: [number, number][] = [[x(first - 1), y(lastVisible)]];
  actual.forEach((v, i) => actualPts.push([x(first + i), y(v)]));
  const gapPoly =
    pred &&
    [
      ...pred.map((v, i) => [x(first + i), y(v)]),
      ...actual.map((v, i) => [x(first + i), y(v)]).reverse(),
    ]
      .map(([a, b]) => `${a!.toFixed(1)},${b!.toFixed(1)}`)
      .join(' ');
  const cpuPts =
    cpu &&
    ([[x(first - 1), y(lastVisible)], ...cpu.map((v, i) => [x(first + i), y(v)])] as [
      number,
      number,
    ][]);

  const yearLabel = (i: number) => String(series.start + c.from + i);
  const cursorValue = draft[cursor] ?? complete?.[cursor] ?? null;

  return (
    <div
      ref={boxRef}
      className={styles.chartBox}
      tabIndex={revealed ? -1 : 0}
      onKeyDown={key}
      role="application"
      aria-label={t('chart.aria', { from: yearLabel(first), to: yearLabel(L - 1) })}
      data-testid="gf-chart"
      data-complete={complete !== null}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.chart}
        data-drawing={drawing}
        data-revealed={revealed}
        data-instant={reducedMotion}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="img"
        aria-label={series.indicator.title[locale === 'es' ? 'es' : 'en']}
      >
        <defs>
          <pattern
            id="gf-hatch"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" className={styles.hatch} />
          </pattern>
          <clipPath id="gf-plot">
            <rect x={M.left} y={M.top - 2} width={PW + 2} height={PH + 4} />
          </clipPath>
        </defs>
        <rect x={M.left} y={M.top} width={PW} height={PH} className={styles.plotBg} />
        {guide && (
          <path
            d={path(
              guide.flatMap((v, i) =>
                v === null ? [] : [[x(i), y(clampTo(c, v))] as [number, number]],
              ),
            )}
            className={styles.lineGuide}
            data-testid="gf-guide"
          />
        )}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + PW} y1={y(v)} y2={y(v)} className={styles.grid} />
            <text x={M.left - 8} y={y(v) + 4} className={styles.yLabel}>
              {formatValue(v, series.indicator, locale, true)}
            </text>
          </g>
        ))}
        {years.map((i) => (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={M.top + PH} y2={M.top + PH + 5} className={styles.axis} />
            <text x={x(i)} y={H - 10} className={styles.xLabel}>
              {yearLabel(i)}
            </text>
          </g>
        ))}
        <line
          x1={M.left}
          x2={M.left + PW}
          y1={M.top + PH}
          y2={M.top + PH}
          className={styles.axis}
        />
        {/* Hidden zone */}
        <rect
          x={cutX}
          y={M.top}
          width={M.left + PW - cutX}
          height={PH}
          fill="url(#gf-hatch)"
          className={styles.hiddenZone}
          data-revealed={revealed}
        />
        <line x1={cutX} x2={cutX} y1={M.top} y2={M.top + PH} className={styles.cut} />
        {!revealed && draft.every((v) => v == null) && (
          <text x={(cutX + M.left + PW) / 2} y={M.top + PH / 2} className={styles.question}>
            ?
          </text>
        )}
        <g clipPath="url(#gf-plot)">
          {/* Keyboard cursor */}
          {!revealed && (
            <rect
              x={x(first + cursor) - PW / (L - 1) / 2}
              y={M.top}
              width={PW / (L - 1)}
              height={PH}
              className={styles.cursor}
              data-focus-only="true"
            />
          )}
          {gapPoly && <polygon points={gapPoly} className={styles.gap} />}
          <path d={path(visiblePts)} className={styles.lineVisible} />
          {predPts && predPts.length > 0 && (
            <path
              d={path([[x(first - 1), y(lastVisible)], ...predPts])}
              className={styles.linePred}
              data-testid="gf-pred-line"
            />
          )}
          {!predPts && drawnPts.length > 0 && (
            <>
              <path
                d={path([[x(first - 1), y(lastVisible)], drawnPts[0]!])}
                className={styles.lineJoin}
              />
              <path d={path(drawnPts)} className={styles.linePred} />
            </>
          )}
          {!revealed &&
            draft.map((v, i) =>
              v == null ? null : (
                <circle key={i} cx={x(first + i)} cy={y(v)} r={2.6} className={styles.predDot} />
              ),
            )}
          {revealed && cpuPts && <path d={path(cpuPts)} className={styles.lineCpu} />}
          {revealed && (
            <path
              d={path(actualPts)}
              className={styles.lineActual}
              pathLength={1}
              data-testid="gf-actual-line"
            />
          )}
          <circle cx={x(first - 1)} cy={y(lastVisible)} r={4} className={styles.anchor} />
          {revealed && (
            <circle
              cx={x(L - 1)}
              cy={y(actual[actual.length - 1]!)}
              r={4}
              className={styles.actualDot}
            />
          )}
        </g>
        {visiblePts.length === 1 && (
          // A single visible point (Trend Draw) is a line of length zero: mark it.
          <circle
            cx={visiblePts[0]![0]}
            cy={visiblePts[0]![1]}
            r={6}
            className={styles.startDot}
            data-testid="gf-start"
          />
        )}
      </svg>
      {!revealed && (
        <p className={styles.cursorReadout} aria-live="polite" data-focus-only="true">
          {yearLabel(first + cursor)}:{' '}
          {cursorValue === null ? '—' : formatValue(cursorValue, series.indicator, locale)}
        </p>
      )}
    </div>
  );
}
