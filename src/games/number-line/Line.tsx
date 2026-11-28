/**
 * The number line: nice ticks (powers of ten on a log line), the three reference countries as
 * diamonds with their values, and one pin per mystery country. Pins are dragged, or placed by
 * tapping the line while their country is selected; each pin is also a keyboard slider (← → move
 * 0.5 % of the line, Shift 5 %, Home / End). After locking, each true position appears as a star
 * joined to the pin.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { niceTicks } from '../shared/stats/stats';
import type { Axis } from './engine';
import styles from './NumberLine.module.css';

export interface LineRef {
  position: number;
  label: string;
  value: string;
}
export interface LinePin {
  position: number | null;
  label: string;
  letter: string;
  truth: number | null;
  truthLabel: string;
}

interface Props {
  axis: Axis;
  format: (v: number) => string;
  refs: LineRef[];
  pins: LinePin[];
  selected: number;
  onSelect: (i: number) => void;
  onPlace: (i: number, p: number) => void;
  locked: boolean;
  label: string;
  pinLabel: (i: number) => string;
}

export function Line({
  axis,
  format,
  refs,
  pins,
  selected,
  onSelect,
  onPlace,
  locked,
  label,
  pinLabel,
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
  const PAD = 28;
  const H = 214;
  const Y = 112;
  const x = (p: number) => PAD + p * (W - 2 * PAD);
  const pinsRef = useLatest(pins);
  const drag = useRef<number | null>(null);

  const posFromEvent = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return null;
    const px = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x;
    return Math.min(1, Math.max(0, (px - PAD) / (W - 2 * PAD)));
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = posFromEvent(e);
    if (p === null) return;
    // Grab the nearest placed pin within 18 px, else place the selected one here.
    let grab = -1;
    let best = 18;
    pinsRef.current.forEach((pin, i) => {
      if (pin.position === null) return;
      const d = Math.abs(x(pin.position) - x(p));
      if (d < best) {
        best = d;
        grab = i;
      }
    });
    const i = grab >= 0 ? grab : selected;
    e.preventDefault();
    svg.current?.setPointerCapture(e.pointerId);
    drag.current = i;
    onSelect(i);
    onPlace(i, p);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (drag.current === null || locked) return;
    const p = posFromEvent(e);
    if (p !== null) onPlace(drag.current, p);
  };
  const up = () => {
    drag.current = null;
  };
  const keyFor = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    if (locked) return;
    const cur = pinsRef.current[i]!.position ?? 0.5;
    const step = e.shiftKey ? 0.05 : 0.005;
    let p: number;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') p = cur - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') p = cur + step;
    else if (e.key === 'Home') p = 0;
    else if (e.key === 'End') p = 1;
    else return;
    e.preventDefault();
    onSelect(i);
    onPlace(i, Math.min(1, Math.max(0, p)));
  };

  // Ticks: powers of ten on a log line (thinned to fit), nice steps otherwise; ≥ 70 px apart.
  let tickPos: number[];
  if (axis.log) {
    const all: number[] = [];
    // Powers of ten, plus 2× and 5× when the line spans only a few of them.
    const mults = axis.hi - axis.lo <= 3 ? [1, 2, 5] : [1];
    for (let k = axis.lo; k <= axis.hi; k++)
      for (const m of mults) {
        const p = (k + Math.log10(m) - axis.lo) / (axis.hi - axis.lo);
        if (p <= 1 + 1e-9) all.push(p);
      }
    tickPos = all;
  } else tickPos = niceTicks(axis.lo, axis.hi, 6).map((v) => (v - axis.lo) / (axis.hi - axis.lo));
  const ticks: number[] = [];
  for (const p of tickPos)
    if (p >= -1e-9 && p <= 1 + 1e-9 && (!ticks.length || x(p) - x(ticks[ticks.length - 1]!) >= 70))
      ticks.push(p);
  const valueAtP = (p: number) =>
    axis.log ? Math.pow(10, axis.lo + p * (axis.hi - axis.lo)) : axis.lo + p * (axis.hi - axis.lo);

  // Reference labels above the line, alternating rows when they would collide.
  const refRows: number[] = [];
  const sortedRefs = refs.map((r, i) => [i, r.position] as const).sort((a, b) => a[1] - b[1]);
  let lastX = -Infinity;
  let row = 0;
  for (const [i, p] of sortedRefs) {
    row = x(p) - lastX < 110 ? 1 - row : 0;
    refRows[i] = row;
    lastX = x(p);
  }
  const anchor = (p: number) => (x(p) < 70 ? 'start' : x(p) > W - 70 ? 'end' : 'middle');

  return (
    <div ref={box} className={styles.lineBox}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.line}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="group"
        aria-label={label}
        data-locked={locked}
        data-testid="nl-line"
      >
        <rect width={W} height={H} rx={8} className={styles.lineBg} />
        <line x1={PAD} x2={W - PAD} y1={Y} y2={Y} className={styles.axis} />
        {ticks.map((p) => (
          <g key={p}>
            <line x1={x(p)} x2={x(p)} y1={Y - 6} y2={Y + 6} className={styles.tickLine} />
            <text x={x(p)} y={Y + 22} className={styles.tick} textAnchor={anchor(p)}>
              {format(valueAtP(p))}
            </text>
          </g>
        ))}
        {refs.map((r, i) => {
          const ly = refRows[i] ? 34 : 58;
          return (
            <g key={`r${i}`} data-testid={`nl-ref-${i}`}>
              <line
                x1={x(r.position)}
                x2={x(r.position)}
                y1={ly + 6}
                y2={Y - 8}
                className={styles.refStem}
              />
              <path d={`M${x(r.position)} ${Y - 8}l7 8-7 8-7-8z`} className={styles.refMark} />
              <text
                x={x(r.position)}
                y={ly - 10}
                className={styles.refName}
                textAnchor={anchor(r.position)}
              >
                {r.label}
              </text>
              <text
                x={x(r.position)}
                y={ly + 3}
                className={styles.refValue}
                textAnchor={anchor(r.position)}
              >
                {r.value}
              </text>
            </g>
          );
        })}
        {pins.map((pin, i) =>
          pin.truth !== null && pin.position !== null ? (
            <g key={`t${i}`} data-testid={`nl-truth-${i}`}>
              <line
                x1={x(pin.position)}
                x2={x(pin.truth)}
                y1={Y + 44}
                y2={Y}
                className={styles.gap}
                data-pin={i}
              />
              <path
                d={`M${x(pin.truth)} ${Y - 12}l3.5 7.2 7.9 1.1-5.7 5.6 1.4 7.9-7.1-3.7-7.1 3.7 1.4-7.9-5.7-5.6 7.9-1.1z`}
                className={styles.truth}
              />
              <text
                x={x(pin.truth)}
                y={Y + 78}
                className={styles.truthLabel}
                textAnchor={anchor(pin.truth)}
              >
                {pin.truthLabel}
              </text>
            </g>
          ) : null,
        )}
        {pins.map((pin, i) =>
          pin.position === null ? null : (
            <g
              key={`p${i}`}
              role="slider"
              tabIndex={locked ? -1 : 0}
              aria-label={pinLabel(i)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pin.position * 100)}
              aria-valuetext={format(valueAtP(pin.position))}
              onKeyDown={keyFor(i)}
              onFocus={() => onSelect(i)}
              className={styles.pin}
              data-pin={i}
              data-selected={selected === i}
              data-testid={`nl-pin-${i}`}
            >
              <line x1={x(pin.position)} x2={x(pin.position)} y1={Y} y2={Y + 30} />
              <circle cx={x(pin.position)} cy={Y + 44} r={13} />
              <text x={x(pin.position)} y={Y + 49} className={styles.pinLetter}>
                {pin.letter}
              </text>
            </g>
          ),
        )}
      </svg>
    </div>
  );
}
