/**
 * The timeline: 3000 BC to 2025, compressed with age (see `positionOf`). One handle marks the
 * guess — drag it or tap anywhere; as a keyboard slider, ← → move a year (Shift ten), Page Up /
 * Down a hundred, Home / End to the ends. After locking in, the answer appears as a star with
 * the stretch between guess and answer shaded. In recap mode it shows every round of a session.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { astro, fromAstro, MAX_YEAR, MIN_YEAR, positionOf, yearAt } from './engine';
import styles from './YearGuess.module.css';

const TICKS = [
  -3000, -2000, -1000, -500, 1, 500, 1000, 1300, 1500, 1600, 1700, 1800, 1850, 1900, 1925, 1950,
  1975, 2000, 2025,
];
const step = (y: number, n: number) => {
  const a = Math.min(astro(MAX_YEAR), Math.max(astro(MIN_YEAR), astro(y) + n));
  return fromAstro(a);
};

interface Marker {
  guess: number;
  answer: number;
  label: string;
}

interface Props {
  value: number;
  onChange?: (y: number) => void;
  /** Year of the answer once revealed. */
  answer: number | null;
  disabled: boolean;
  label: string;
  format: (y: number) => string;
  /** Recap of a whole session instead of a single guess. */
  markers?: Marker[];
}

export function Timeline({ value, onChange, answer, disabled, label, format, markers }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const focusEl = useRef<HTMLDivElement>(null);
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
  const PAD = 26;
  const H = markers ? 46 + markers.length * 22 : 112;
  const y = markers ? 30 : 58;
  const x = (yr: number) => PAD + positionOf(yr) * (W - 2 * PAD);
  const valueRef = useLatest(value);
  const dragging = useRef(false);

  const set = (yr: number) => {
    valueRef.current = yr;
    onChange?.(yr);
  };
  const pointerYear = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return null;
    const px = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x;
    return yearAt((px - PAD) / (W - 2 * PAD));
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled || markers || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const yr = pointerYear(e);
    if (yr === null) return;
    e.preventDefault();
    svg.current?.setPointerCapture(e.pointerId);
    focusEl.current?.focus({ preventScroll: true });
    dragging.current = true;
    set(yr);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || disabled) return;
    const yr = pointerYear(e);
    if (yr !== null) set(yr);
  };
  const up = () => {
    dragging.current = false;
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const v = valueRef.current;
    let n: number;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = step(v, e.shiftKey ? -10 : -1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = step(v, e.shiftKey ? 10 : 1);
    else if (e.key === 'PageDown') n = step(v, -100);
    else if (e.key === 'PageUp') n = step(v, 100);
    else if (e.key === 'Home') n = MIN_YEAR;
    else if (e.key === 'End') n = MAX_YEAR;
    else return;
    e.preventDefault();
    set(n);
  };

  // Ticks at least ~56 px apart, always keeping the last one.
  const ticks: number[] = [];
  for (const t of TICKS)
    if (!ticks.length || x(t) - x(ticks[ticks.length - 1]!) >= 56) ticks.push(t);
  if (ticks[ticks.length - 1] !== MAX_YEAR) {
    if (x(MAX_YEAR) - x(ticks[ticks.length - 1]!) < 56) ticks.pop();
    ticks.push(MAX_YEAR);
  }

  const star = (cx: number, cy: number, cls: string) => (
    <path
      d={`M${cx} ${cy - 11}l3.4 7 7.6 1-5.5 5.3 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.5-5.3 7.6-1z`}
      className={cls}
    />
  );

  return (
    <div ref={box} className={styles.timelineBox}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.timeline}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        data-disabled={disabled}
        aria-hidden={markers ? undefined : true}
        role={markers ? 'img' : undefined}
        aria-label={markers ? label : undefined}
      >
        <rect width={W} height={H} rx={8} className={styles.timelineBg} />
        <line x1={PAD} x2={W - PAD} y1={y} y2={y} className={styles.axis} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={y - 6} y2={y + 6} className={styles.tickLine} />
            <text
              x={x(t) + (t === MIN_YEAR ? -PAD + 6 : t === MAX_YEAR ? PAD - 6 : 0)}
              y={y - 12}
              className={styles.tick}
              // The end labels hug the edges so they are never cut off.
              textAnchor={t === MIN_YEAR ? 'start' : t === MAX_YEAR ? 'end' : 'middle'}
            >
              {format(t)}
            </text>
          </g>
        ))}
        {markers ? (
          markers.map((m, i) => {
            const ry = y + 24 + i * 22;
            return (
              <g key={i} data-testid={`yg-recap-${i}`}>
                <line x1={x(m.guess)} x2={x(m.answer)} y1={ry} y2={ry} className={styles.gap} />
                <circle cx={x(m.guess)} cy={ry} r={6} className={styles.guessDot} />
                {star(x(m.answer), ry, styles.star!)}
                <text
                  x={Math.min(W - 8, Math.max(x(m.guess), x(m.answer)) + 20)}
                  y={ry + 4}
                  className={styles.recapLabel}
                >
                  {m.label}
                </text>
              </g>
            );
          })
        ) : (
          <>
            {answer !== null && (
              <rect
                x={Math.min(x(value), x(answer))}
                y={y - 10}
                width={Math.max(2, Math.abs(x(answer) - x(value)))}
                height={20}
                className={styles.gapBand}
              />
            )}
            <g className={styles.handle}>
              <line x1={x(value)} x2={x(value)} y1={y - 22} y2={y + 22} />
              <circle cx={x(value)} cy={y} r={11} />
            </g>
            <text
              x={Math.min(W - 40, Math.max(40, x(value)))}
              y={y + 44}
              className={styles.handleLabel}
            >
              {format(value)}
            </text>
            {answer !== null && (
              <g data-testid="yg-answer-star">{star(x(answer), y, styles.star!)}</g>
            )}
          </>
        )}
      </svg>
      {!markers && (
        // The accessible slider sits over the drawing, so focus and keys work on every device.
        <div
          ref={focusEl}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={MIN_YEAR}
          aria-valuemax={MAX_YEAR}
          aria-valuenow={value}
          aria-valuetext={format(value)}
          aria-disabled={disabled}
          className={styles.sliderFocus}
          onKeyDown={key}
          data-testid="yg-slider"
        />
      )}
    </div>
  );
}
