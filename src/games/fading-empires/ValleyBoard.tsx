/**
 * The valley in SVG, drawn from the same hex grid the rules use: terrain colours, region borders,
 * owners' tints (declined peoples striped), feature marks (spring, mine, cave), wild tribes and a
 * badge per region with its bands. Regions that can be chosen are buttons with their cost.
 */
import type { KeyboardEvent } from 'react';
import type { Locale, Translator } from '../../core/i18n';
import type { Fading } from './engine';
import styles from './FadingEmpires.module.css';
import { cellXY, COLS, GRID, REGIONS, ROWS } from './world';

const S = 20;
const R = 1.02;

function geometry() {
  const cells: { r: number; points: string }[] = [];
  const inner: string[] = [];
  const at = (x: number, y: number) => {
    const row = Math.round(y / 1.5);
    const col = Math.round(x / Math.sqrt(3) - (row & 1 ? 0.5 : 0));
    return GRID[row]?.[col] ?? -1;
  };
  for (let row = 0; row < ROWS; row++)
    for (let c = 0; c < COLS; c++) {
      const reg = GRID[row]![c]!;
      const [x, y] = cellXY(c, row);
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 90);
        return [(x + R * Math.cos(a)) * S, (y + R * Math.sin(a)) * S] as [number, number];
      });
      cells.push({
        r: reg,
        points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '),
      });
      for (let i = 0; i < 6; i++) {
        const [ax, ay] = pts[i]!;
        const [bx, by] = pts[(i + 1) % 6]!;
        const o = at((ax + bx) / S - x, (ay + by) / S - y);
        if (o >= 0 && o > reg)
          inner.push(`M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`);
      }
    }
  const labels = REGIONS.map((reg) => {
    const [x, y] = cellXY(reg.label[0], reg.label[1]);
    return [x * S, y * S] as [number, number];
  });
  return {
    cells,
    border: inner.join(''),
    labels,
    w: (COLS + 0.6) * Math.sqrt(3) * S,
    h: (ROWS * 1.5 + 0.6) * S,
  };
}
const G = geometry();

export function ValleyBoard({
  g,
  t,
  locale,
  name,
  targets,
  costs,
  selected,
  onPick,
}: {
  g: Fading;
  t: Translator;
  locale: Locale;
  name: (p: number) => string;
  targets: Set<number>;
  costs: Map<number, number>;
  selected: number | null;
  onPick: (r: number) => void;
}) {
  const key = (r: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(r);
    }
  };
  return (
    <svg
      className={styles.map}
      viewBox={`${-S} ${-S * 1.2} ${G.w + S * 0.6} ${G.h + S}`}
      role="group"
      aria-label={t('aria.map')}
      data-testid="fe-map"
    >
      {REGIONS.map((reg, r) => {
        const h = g.holds[r];
        const can = targets.has(r);
        const label = [
          reg.name[locale],
          t(`terrain.${reg.terrain}`),
          reg.feature ? t(`feature.${reg.feature}`) : '',
          h
            ? `${name(h.p)}${h.declined ? ` (${t('declined')})` : ''}`
            : g.tribes[r]
              ? t('tribe')
              : '',
          t('bands', { n: g.bands[r]! }),
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <g
            key={r}
            className={styles.region}
            data-terrain={reg.terrain}
            data-owner={h ? h.p : -1}
            data-declined={h?.declined ?? false}
            data-target={can}
            data-selected={selected === r}
            style={h ? { ['--pc' as string]: `var(--player-${h.p + 1})` } : undefined}
            role={can ? 'button' : 'img'}
            tabIndex={can ? 0 : undefined}
            aria-label={label}
            onClick={can ? () => onPick(r) : undefined}
            onKeyDown={can ? key(r) : undefined}
            data-testid={`fe-region-${r}`}
          >
            <title>{label}</title>
            {G.cells
              .filter((c) => c.r === r)
              .map((c, k) => (
                <g key={k}>
                  <polygon className={styles.land} points={c.points} />
                  {h && <polygon className={styles.tint} points={c.points} />}
                </g>
              ))}
          </g>
        );
      })}
      <path className={styles.borders} d={G.border} />
      {REGIONS.map((reg, r) => {
        const [x, y] = G.labels[r]!;
        const h = g.holds[r];
        return (
          <g key={r} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} pointerEvents="none">
            {reg.feature && (
              <g
                className={styles.feature}
                data-feature={reg.feature}
                transform="translate(-16 -14)"
              >
                {reg.feature === 'spring' && <path d="M0 -6Q5 0 0 5Q-5 0 0 -6Z" />}
                {reg.feature === 'mine' && <path d="M-5 5L5 -5M-5 -5L5 5" />}
                {reg.feature === 'cave' && <path d="M-6 5V0A6 6 0 0 1 6 0V5Z" />}
              </g>
            )}
            {reg.terrain !== 'lake' && (h || g.tribes[r]) && (
              <g
                className={styles.badge}
                data-declined={h?.declined ?? false}
                style={h ? { ['--pc' as string]: `var(--player-${h.p + 1})` } : undefined}
                data-tribe={!h && g.tribes[r]}
              >
                <circle r={11} />
                <text y={1}>{g.bands[r]}</text>
              </g>
            )}
            {costs.has(r) && (
              <g className={styles.cost} transform="translate(14 12)">
                <rect x={-9} y={-8} width={18} height={16} rx={4} />
                <text y={1}>{costs.get(r)}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
