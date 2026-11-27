/**
 * The target: concentric rings for ×1.02, ×1.05, ×1.1, ×1.25, ×1.5, ×2 and ×10 from the answer.
 * After a round each contestant's arrow lands at the distance matching their error — on the right
 * half when they overshot, on the left when they undershot — in their colour.
 */
import { RINGS } from './engine';
import styles from './ClosestCall.module.css';

const R = 120;
const BAND = R / RINGS.length;

/** Radius for a ratio: inside ring i, interpolated by log ratio; beyond ×10 on the outer edge. */
export function radiusFor(ratio: number): number {
  const l = Math.log10(ratio);
  let inner = 0;
  for (let i = 0; i < RINGS.length; i++) {
    const outer = Math.log10(RINGS[i]!.ratio);
    if (l <= outer + 1e-12) return BAND * i + BAND * ((l - inner) / (outer - inner || 1));
    inner = outer;
  }
  return R + 10;
}

export function Target({
  arrows,
  label,
}: {
  /** One per contestant with an answer, once the round is settled. */
  arrows: { seat: number; ratio: number; over: boolean; name: string }[];
  label: string;
}) {
  return (
    <svg
      viewBox="-150 -150 300 300"
      className={styles.target}
      role="img"
      aria-label={label}
      data-testid="cc-target"
    >
      {RINGS.map((ring, i) => (
        <circle
          key={ring.ratio}
          r={BAND * (RINGS.length - i)}
          className={styles.ring}
          data-ring={RINGS.length - 1 - i}
        />
      ))}
      {RINGS.map((ring, i) => (
        <text key={`t${ring.ratio}`} x={0} y={-BAND * (i + 1) + 11} className={styles.ringLabel}>
          {i === 0 ? '' : `${ring.points}`}
        </text>
      ))}
      <text x={0} y={4} className={styles.bull}>
        10
      </text>
      <line x1={0} x2={0} y1={-R - 8} y2={R + 8} className={styles.divider} />
      {arrows.map((a) => {
        const r = radiusFor(a.ratio);
        const base = a.over ? 0 : 180;
        const angle = ((base + (a.seat - 1.5) * 24 * (a.over ? 1 : -1)) * Math.PI) / 180;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        return (
          <g
            key={a.seat}
            className={`${styles.arrow} ${styles[`seat${a.seat}`]}`}
            style={{ ['--x' as string]: `${x}px`, ['--y' as string]: `${y}px` }}
            data-seat={a.seat}
            data-testid={`cc-arrow-${a.seat}`}
          >
            <line x1={x} y1={y} x2={x * 1.18 + 14} y2={y * 1.18 - 14} className={styles.shaft} />
            <circle cx={x} cy={y} r={6} className={styles.tip} />
            <title>{a.name}</title>
          </g>
        );
      })}
    </svg>
  );
}
