/**
 * The comparison stage: the reference and the mystery object drawn at the same true scale (heights
 * side by side on the ground, lengths in two rows, discs side by side), auto-zooming smoothly to
 * fit. The mystery is resized by dragging it (or its handle), the mouse wheel or the keyboard;
 * after locking in, the real size appears over the guess.
 */
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import type { Translator } from '../../core/i18n';
import { axisOf, type Thing } from './engine';
import { formatLength, type Units } from './format';
import { box, Silhouette } from './Silhouettes';
import styles from './SizeSense.module.css';

interface Props {
  reference: Thing;
  target: Thing;
  guess: number;
  range: [number, number];
  onGuess: (m: number) => void;
  onLock: () => void;
  /** The real size, once revealed. */
  actual: number | null;
  units: Units;
  lang: 'en' | 'es';
  locale: string;
  reducedMotion: boolean;
  t: Translator;
}

const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));

export function Stage({
  reference,
  target,
  guess,
  range,
  onGuess,
  onLock,
  actual,
  units,
  lang,
  locale,
  reducedMotion,
  t,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const w = e?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = Math.max(300, Math.min(900, Math.round(width)));
  const H = Math.round(Math.min(460, Math.max(300, W * 0.62)));
  const PAD = 18;
  const LABEL = 40;
  const axis = axisOf(target.family);
  const revealed = actual !== null;
  const shown = revealed ? Math.max(guess, actual) : guess;

  // Pixels per metre that fit everything.
  const [rw, rh] = box(reference.family);
  const [tw, th] = box(target.family);
  let fit: number;
  if (axis === 'horizontal') {
    fit = Math.min(
      (W - 2 * PAD) / Math.max(reference.metres, shown),
      (H - 2 * LABEL - 3 * PAD) / (reference.metres * rh + shown * th),
    );
  } else {
    fit = Math.min(
      (H - LABEL - 2 * PAD) / Math.max(reference.metres * rh, shown * th),
      (W - 3 * PAD) / (reference.metres * rw + shown * tw),
    );
  }
  // The displayed scale eases towards the fitting one (frozen while dragging).
  const [scale, setScale] = useState(fit);
  const [dragging, setDragging] = useState(false);
  // Handlers read the ref: moves can arrive before React re-renders with the new state.
  const dragRef = useRef(false);
  const scaleRef = useLatest(scale);
  const fitRef = useLatest(fit);
  useEffect(() => {
    if (dragging) return;
    if (reducedMotion) {
      const raf = requestAnimationFrame(() => setScale(fitRef.current));
      return () => cancelAnimationFrame(raf);
    }
    let raf = 0;
    const step = () => {
      const cur = scaleRef.current;
      const goal = fitRef.current;
      const k = Math.log(goal / cur);
      if (Math.abs(k) < 0.002) {
        setScale(goal);
        return;
      }
      setScale(cur * Math.exp(k * 0.22));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fit, dragging, reducedMotion, scaleRef, fitRef]);
  // Never draw past the stage while the fit is still easing in.
  const s = dragging ? scale : Math.min(scale, fit * 1.0001) || fit;

  const ground = H - LABEL;
  type Placed = { x: number; y: number; w: number; h: number };
  let ref: Placed;
  let mys: (m: number) => Placed;
  if (axis === 'horizontal') {
    const refH = reference.metres * rh * s;
    // Centre the two rows (with their labels) vertically.
    const block = 2 * LABEL + refH + shown * th * s;
    const top = Math.max(0, (H - block) / 2);
    ref = { x: PAD, y: top + LABEL, w: reference.metres * s, h: refH };
    const rowY = ref.y + refH + LABEL;
    mys = (m) => ({ x: PAD, y: rowY, w: m * s, h: m * th * s });
  } else {
    ref = {
      x: PAD,
      y: ground - reference.metres * rh * s,
      w: reference.metres * rw * s,
      h: reference.metres * rh * s,
    };
    const x0 = ref.x + ref.w + PAD * 1.5;
    mys = (m) => ({ x: x0, y: ground - m * th * s, w: m * tw * s, h: m * th * s });
  }
  const g = mys(guess);
  const a = actual !== null ? mys(actual) : null;

  /* ---------- input ---------- */
  const toMetres = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const m =
      axis === 'horizontal' ? (p.x - g.x) / s : (ground - p.y) / (s * (axis === 'disc' ? 1 : th));
    return clamp(m, range);
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (revealed || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = true;
    setDragging(true);
    const m = toMetres(e);
    if (m) onGuess(m);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || revealed) return;
    const m = toMetres(e);
    if (m) onGuess(m);
  };
  const up = () => {
    // Ending the drag re-runs the easing effect towards the new fit.
    dragRef.current = false;
    setDragging(false);
  };
  const guessRef = useLatest(guess);
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (revealed) return;
    const f = e.shiftKey ? 1.1 : 1.02;
    let m = guessRef.current;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === '+' || e.key === '=') m *= f;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === '-') m /= f;
    else if (e.key === 'Enter') {
      e.preventDefault();
      onLock();
      return;
    } else return;
    e.preventDefault();
    m = clamp(m, range);
    guessRef.current = m;
    onGuess(m);
  };
  const wheel = (e: WheelEvent<HTMLDivElement>) => {
    if (revealed) return;
    onGuess(clamp(guessRef.current * Math.exp(-e.deltaY * 0.0015), range));
  };

  const label = (thing: Thing) => {
    const n = thing.name[lang];
    const max = W < 480 ? 22 : 34;
    return n.length > max ? `${n.slice(0, max - 1)}…` : n;
  };
  // Heights and discs: reference text on the left, mystery text on the right edge.
  const side = axis !== 'horizontal';
  const mx = side ? W - PAD : g.x;
  const anchor = side ? 'end' : 'start';
  const handle =
    axis === 'horizontal' ? { cx: g.x + g.w, cy: g.y + g.h / 2 } : { cx: g.x + g.w / 2, cy: g.y };
  const tiny = (axis === 'horizontal' ? g.w : g.h) < 6;

  return (
    <div
      ref={boxRef}
      className={styles.stageBox}
      tabIndex={revealed ? -1 : 0}
      onKeyDown={key}
      onWheel={wheel}
      role="application"
      aria-label={t('stage.aria')}
      data-testid="ss-stage"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.stage}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        data-revealed={revealed}
        data-axis={axis}
      >
        <rect width={W} height={H} className={styles.sky} />
        {axis !== 'horizontal' && (
          <rect x={0} y={ground} width={W} height={H - ground} className={styles.ground} />
        )}
        {/* Reference */}
        <Silhouette
          family={reference.family}
          x={ref.x}
          y={ref.y}
          width={ref.w}
          height={ref.h}
          className={styles.ref}
          testId="ss-ref-shape"
        />
        <text
          x={ref.x}
          y={axis === 'horizontal' ? ref.y - 24 : ground + 16}
          className={styles.label}
        >
          {label(reference)}
        </text>
        <text x={ref.x} y={axis === 'horizontal' ? ref.y - 8 : ground + 32} className={styles.sub}>
          {formatLength(reference.metres, units, locale)}
        </text>
        <Silhouette
          family={target.family}
          x={g.x}
          y={g.y}
          width={g.w}
          height={g.h}
          className={revealed ? styles.guessDone : styles.guess}
          testId="ss-guess-shape"
        />
        {/* The real size, over the (now translucent) guess */}
        {a && (
          <Silhouette
            family={target.family}
            x={a.x}
            y={a.y}
            width={a.w}
            height={a.h}
            className={styles.actual}
            testId="ss-actual-shape"
          />
        )}
        {a && (
          <rect
            x={a.x}
            y={a.y}
            width={Math.max(1, a.w)}
            height={Math.max(1, a.h)}
            className={styles.actualFrame}
          />
        )}
        {!revealed && (
          <>
            {tiny && (
              <path d={`M${handle.cx - 6} ${handle.cy - 20}h12l-6 10z`} className={styles.marker} />
            )}
            <circle cx={handle.cx} cy={handle.cy} r={9} className={styles.handle} />
          </>
        )}
        <text
          x={mx}
          y={axis === 'horizontal' ? g.y - 24 : ground + 16}
          className={styles.label}
          textAnchor={anchor}
          data-mystery="true"
        >
          {label(target)}
        </text>
        <text
          x={mx}
          y={axis === 'horizontal' ? g.y - 8 : ground + 32}
          className={styles.sub}
          textAnchor={anchor}
        >
          {actual !== null ? formatLength(actual, units, locale) : '?'}
        </text>
      </svg>
      <span hidden data-testid="ss-guess-m">
        {guess}
      </span>
    </div>
  );
}
