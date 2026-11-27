/**
 * The magnitude ruler: a log scale from 10^0 to 10^16 with the range still possible after the
 * feedback shaded, numbered guess markers colored by how close they were, the guess being
 * prepared and, after the round, the answer.
 */
import { useEffect, useRef, useState } from 'react';
import { EXP_RANGE, feasible, type Band, type Feedback } from './engine';
import styles from './OrderOfMagnitude.module.css';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n: number) =>
  String(n)
    .split('')
    .map((d) => (d === '-' ? '⁻' : SUP[Number(d)]))
    .join('');

export function Ruler({
  guesses,
  draft,
  answer,
  label,
}: {
  guesses: { value: number; feedback: Feedback }[];
  draft: number | null;
  answer: number | null;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const w = e?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = Math.max(280, Math.round(width));
  const H = 96;
  const PAD = 18;
  const top = EXP_RANGE[1] + 1;
  const x = (log: number) => PAD + (Math.max(0, Math.min(top, log)) / top) * (W - 2 * PAD);
  const axisY = 58;
  const [lo, hi] = feasible(guesses);
  const every = W < 420 ? 4 : W < 640 ? 2 : 1;
  const bandClass = (b: Band) => styles[`band_${b}`];
  return (
    <div ref={ref} className={styles.rulerBox}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.ruler} role="img" aria-label={label}>
        <rect width={W} height={H} rx="6" className={styles.rulerBg} />
        {answer === null && (
          <rect
            x={x(lo)}
            y={axisY - 22}
            width={Math.max(3, x(hi) - x(lo))}
            height={30}
            rx="4"
            className={styles.feasible}
            data-testid="om-feasible"
          />
        )}
        <line x1={PAD} x2={W - PAD} y1={axisY} y2={axisY} className={styles.axis} />
        {Array.from({ length: top + 1 }, (_, e) => (
          <g key={e}>
            <line x1={x(e)} x2={x(e)} y1={axisY - 5} y2={axisY + 5} className={styles.axis} />
            {e % every === 0 && (
              <text x={x(e)} y={axisY + 22} className={styles.tick}>
                10{sup(e)}
              </text>
            )}
          </g>
        ))}
        {draft !== null && answer === null && (
          <path
            d={`M${x(Math.log10(draft))} ${axisY - 6}l-7 -12h14z`}
            className={styles.draft}
            data-testid="om-draft-marker"
          />
        )}
        {guesses.map((g, i) => {
          const cx = x(Math.log10(g.value));
          return (
            <g key={i} className={bandClass(g.feedback.band)}>
              <circle cx={cx} cy={axisY - 30} r={10} className={styles.marker} />
              <text x={cx} y={axisY - 26} className={styles.markerText}>
                {i + 1}
              </text>
              <line x1={cx} x2={cx} y1={axisY - 20} y2={axisY} className={styles.markerStem} />
            </g>
          );
        })}
        {answer !== null && (
          <g data-testid="om-answer-marker">
            <path
              d={`M${x(Math.log10(answer))} ${axisY - 44}l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z`}
              className={styles.star}
            />
            <line
              x1={x(Math.log10(answer))}
              x2={x(Math.log10(answer))}
              y1={axisY - 22}
              y2={axisY}
              className={styles.starStem}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
