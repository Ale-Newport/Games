/**
 * The progress gauge: a vertical ocean (dive) or sky (climb) drawn in SVG, with real landmarks on a
 * square-root scale so the shallow end stays readable, and the diver or balloon at the run's depth
 * or altitude. Pure presentation; all values come from props.
 */
import type { Translator } from '../../../core/i18n';
import type { Polarity } from './engine';
import { LANDMARKS } from './i18n';
import styles from './SurveyGame.module.css';

const H = 600;
const W = 200;
const MAX: Record<Polarity, number> = { rare: 7000, common: 700 };

/** Vertical position (0 = top) of a depth/altitude value. */
export function gaugeY(polarity: Polarity, value: number): number {
  const f = Math.sqrt(Math.max(0, Math.min(value, MAX[polarity])) / MAX[polarity]);
  const pad = 26;
  return polarity === 'rare' ? pad + f * (H - 2 * pad) : H - pad - f * (H - 2 * pad);
}

function Diver({ y }: { y: number }) {
  return (
    <g transform={`translate(${W * 0.62} ${y})`} className={styles.mover}>
      {/* bubbles */}
      <circle cx={-6} cy={-26} r={3} className={styles.bubble} />
      <circle cx={2} cy={-38} r={2} className={styles.bubble} />
      <circle cx={-3} cy={-50} r={1.6} className={styles.bubble} />
      {/* tank */}
      <rect
        x={-13}
        y={-11}
        width={8}
        height={18}
        rx={3}
        fill="#f2b84b"
        stroke="#1a0f2e"
        strokeWidth={2}
      />
      {/* body */}
      <rect
        x={-6}
        y={-12}
        width={14}
        height={22}
        rx={6}
        fill="#ff6f61"
        stroke="#1a0f2e"
        strokeWidth={2}
      />
      {/* head + mask */}
      <circle cx={1} cy={-17} r={7} fill="#ffd9b0" stroke="#1a0f2e" strokeWidth={2} />
      <rect
        x={-1}
        y={-21}
        width={10}
        height={6}
        rx={2}
        fill="#7fe3ff"
        stroke="#1a0f2e"
        strokeWidth={1.5}
      />
      {/* fins */}
      <path
        d="M-4 10 l-6 12 h8 z M5 10 l6 12 h-8 z"
        fill="#2fd1a8"
        stroke="#1a0f2e"
        strokeWidth={2}
      />
      {/* lamp beam */}
      <path d="M9 -2 L40 -14 L40 12 Z" fill="#fff6c8" opacity={0.18} />
    </g>
  );
}

function Balloon({ y }: { y: number }) {
  return (
    <g transform={`translate(${W * 0.62} ${y})`} className={styles.mover}>
      <path
        d="M0 -40 C 22 -40 24 -12 6 2 L -6 2 C -24 -12 -22 -40 0 -40 Z"
        fill="#ff6f61"
        stroke="#1a0f2e"
        strokeWidth={2}
      />
      <path
        d="M0 -40 C 8 -32 8 -10 3 2 M0 -40 C -8 -32 -8 -10 -3 2"
        stroke="#ffd166"
        strokeWidth={4}
        fill="none"
      />
      <path d="M-5 2 L-6 10 M5 2 L6 10" stroke="#1a0f2e" strokeWidth={1.5} />
      <rect
        x={-8}
        y={10}
        width={16}
        height={10}
        rx={2}
        fill="#b07a3b"
        stroke="#1a0f2e"
        strokeWidth={2}
      />
    </g>
  );
}

export function Scene({
  polarity,
  value,
  t,
}: {
  polarity: Polarity;
  value: number;
  t: Translator;
}) {
  const dive = polarity === 'rare';
  const y = gaugeY(polarity, value);
  const units = (v: number) => t(`${polarity}.units`, { value: v.toLocaleString() });
  return (
    <svg
      className={styles.scene}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${t('scene.label')}: ${units(value)}`}
      data-testid="sv-scene"
    >
      <defs>
        <linearGradient id={`sv-grad-${polarity}`} x1="0" y1="0" x2="0" y2="1">
          {dive ? (
            <>
              <stop offset="0" stopColor="#5fd4f4" />
              <stop offset="0.12" stopColor="#1d8fd1" />
              <stop offset="0.35" stopColor="#14508f" />
              <stop offset="0.65" stopColor="#0b2552" />
              <stop offset="1" stopColor="#03061a" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#02030f" />
              <stop offset="0.4" stopColor="#0d1b4a" />
              <stop offset="0.7" stopColor="#2a5fb0" />
              <stop offset="0.92" stopColor="#7fc8f4" />
              <stop offset="1" stopColor="#b8ecff" />
            </>
          )}
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#sv-grad-${polarity})`} />
      {dive ? (
        <>
          {/* waves and boat on the surface */}
          <path
            d={`M0 18 ${Array.from({ length: 11 }, (_, i) => `Q ${i * 20 + 10} ${i % 2 ? 12 : 24} ${(i + 1) * 20} 18`).join(' ')} V0 H0 Z`}
            fill="#bfeeff"
            opacity={0.6}
          />
          <g transform="translate(36 6)">
            <path d="M0 10 h40 l-8 10 h-26 z" fill="#ffd166" stroke="#1a0f2e" strokeWidth={2} />
            <rect x={14} y={-2} width={4} height={12} fill="#1a0f2e" />
            <path d="M18 -2 l14 9 h-14 z" fill="#fff" stroke="#1a0f2e" strokeWidth={1.5} />
          </g>
          {/* trench walls near the bottom */}
          <path d={`M0 ${H} V${H - 70} L30 ${H - 40} L22 ${H} Z`} fill="#02040f" />
          <path d={`M${W} ${H} V${H - 90} L${W - 36} ${H - 50} L${W - 20} ${H} Z`} fill="#02040f" />
        </>
      ) : (
        <>
          {/* stars in space, mountains on the ground */}
          {Array.from({ length: 28 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 73) % W}
              cy={((i * 131) % (H * 0.45)) + 4}
              r={i % 3 === 0 ? 1.4 : 0.8}
              fill="#fff"
              opacity={0.8}
            />
          ))}
          <path
            d={`M0 ${H} L40 ${H - 34} L70 ${H - 16} L110 ${H - 46} L150 ${H - 12} L${W} ${H - 28} V${H} Z`}
            fill="#3c7d4a"
            stroke="#1a0f2e"
            strokeWidth={2}
          />
          <path d={`M110 ${H - 46} l-10 12 l10 -4 l10 4 z`} fill="#fff" />
        </>
      )}
      {LANDMARKS[polarity].map((m) => {
        const my = gaugeY(polarity, m);
        const reached = value >= m;
        return (
          <g key={m} className={reached ? styles.markReached : styles.mark}>
            <line x1={0} x2={W} y1={my} y2={my} strokeDasharray="4 4" />
            <text x={4} y={my - 3}>
              {units(m)} · {t(`${polarity}.mark.${m}`)}
            </text>
          </g>
        );
      })}
      {dive ? <Diver y={y} /> : <Balloon y={y} />}
      <text x={W - 6} y={dive ? H - 10 : 16} textAnchor="end" className={styles.readout}>
        {units(value)}
      </text>
    </svg>
  );
}
