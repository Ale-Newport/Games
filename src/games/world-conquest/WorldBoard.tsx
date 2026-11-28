/**
 * The world map in SVG, drawn from the same hex grid the rules use: land cells tinted with their
 * owner's colour over the landmass tone, coastlines, landmass borders and territory borders, dashed
 * sea lanes, and an army badge per territory. Territories that can be chosen are buttons (click,
 * tap, or Tab and Enter) and are highlighted; the chosen one is ringed.
 */
import type { KeyboardEvent } from 'react';
import type { Locale, Translator } from '../../core/i18n';
import type { WarGame } from './engine';
import { cellXY, COLS, MAP, ROWS } from './map';
import styles from './WorldConquest.module.css';

const S = 20;
const R = 1.02;
const corner = (x: number, y: number, i: number): [number, number] => {
  const a = (Math.PI / 180) * (60 * i - 90);
  return [(x + R * Math.cos(a)) * S, (y + R * Math.sin(a)) * S];
};

interface Geometry {
  cells: { t: number; points: string }[];
  borders: { d: string; kind: 'coast' | 'region' | 'inner' }[];
  labels: [number, number][];
  width: number;
  height: number;
}

function geometry(): Geometry {
  const cells: Geometry['cells'] = [];
  const coast: string[] = [];
  const region: string[] = [];
  const inner: string[] = [];
  const at = (x: number, y: number) => {
    // The cell whose centre is nearest (x, y), or −1 for the sea.
    const r = Math.round(y / 1.5);
    const c = Math.round(x / Math.sqrt(3) - (r & 1 ? 0.5 : 0));
    return MAP.grid[r]?.[c] ?? -1;
  };
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const t = MAP.grid[r]![c]!;
      if (t < 0) continue;
      const [x, y] = cellXY(c, r);
      const pts = Array.from({ length: 6 }, (_, i) => corner(x, y, i));
      cells.push({ t, points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ') });
      for (let i = 0; i < 6; i++) {
        const [ax, ay] = pts[i]!;
        const [bx, by] = pts[(i + 1) % 6]!;
        // The neighbour across this edge: the centre mirrored through the edge's midpoint.
        const mx = (ax + bx) / 2 / S;
        const my = (ay + by) / 2 / S;
        const o = at(2 * mx - x, 2 * my - y);
        const seg = `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
        if (o < 0) coast.push(seg);
        else if (o > t) {
          if (MAP.territories[o]!.region !== MAP.territories[t]!.region) region.push(seg);
          else inner.push(seg);
        }
      }
    }
  const labels = MAP.territories.map((tr) => {
    const [x, y] = cellXY(tr.label[0], tr.label[1]);
    return [x * S, y * S] as [number, number];
  });
  return {
    cells,
    borders: [
      { d: inner.join(''), kind: 'inner' },
      { d: region.join(''), kind: 'region' },
      { d: coast.join(''), kind: 'coast' },
    ],
    labels,
    width: (COLS + 0.6) * Math.sqrt(3) * S,
    height: (ROWS * 1.5 + 0.6) * S,
  };
}
const GEOM = geometry();
export const LABELS = GEOM.labels;

export function WorldBoard({
  g,
  t,
  locale,
  name,
  targets,
  selected,
  onPick,
}: {
  g: WarGame;
  t: Translator;
  locale: Locale;
  name: (p: number) => string;
  targets: Set<number>;
  selected: number | null;
  onPick: (i: number) => void;
}) {
  const key = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(i);
    }
  };
  const last = [...g.log].reverse().find((e) => e.k === 'battle');
  return (
    <svg
      className={styles.map}
      viewBox={`${-1.2 * S} ${-1.4 * S} ${GEOM.width + 0.8 * S} ${GEOM.height + 1.2 * S}`}
      role="group"
      aria-label={t('aria.map')}
      data-testid="wc-map"
    >
      <rect
        className={styles.sea}
        x={-1.2 * S}
        y={-1.4 * S}
        width={GEOM.width + 0.8 * S}
        height={GEOM.height + 1.2 * S}
        rx={14}
      />
      {MAP.lanes.map(([a, b], k) => (
        <line
          key={k}
          className={styles.lane}
          x1={GEOM.labels[a]![0]}
          y1={GEOM.labels[a]![1]}
          x2={GEOM.labels[b]![0]}
          y2={GEOM.labels[b]![1]}
        />
      ))}
      {MAP.territories.map((tr, i) => {
        const owner = g.owner[i]!;
        const can = targets.has(i);
        const n = g.armies[i]!;
        return (
          <g
            key={i}
            className={styles.terr}
            data-region={tr.region}
            data-target={can}
            data-selected={selected === i}
            data-fought={!!last && last.k === 'battle' && (last.from === i || last.to === i)}
            style={{ ['--pc' as string]: `var(--player-${owner + 1})` }}
            role={can ? 'button' : 'img'}
            tabIndex={can ? 0 : undefined}
            aria-label={t(n === 1 ? 'aria.terr.one' : 'aria.terr', {
              name: tr.name[locale],
              who: name(owner),
              n,
            })}
            onClick={can ? () => onPick(i) : undefined}
            onKeyDown={can ? key(i) : undefined}
            data-testid={`wc-terr-${i}`}
            data-owner={owner}
            data-armies={n}
          >
            <title>{tr.name[locale]}</title>
            {GEOM.cells
              .filter((c) => c.t === i)
              .map((c, k) => (
                <g key={k}>
                  <polygon className={styles.land} points={c.points} />
                  <polygon className={styles.cell} points={c.points} />
                </g>
              ))}
          </g>
        );
      })}
      {GEOM.borders.map((b) => (
        <path key={b.kind} className={styles[`b_${b.kind}`]} d={b.d} />
      ))}
      {MAP.territories.map((_, i) => {
        const [x, y] = GEOM.labels[i]!;
        const owner = g.owner[i]!;
        return (
          <g
            key={i}
            className={styles.badge}
            data-target={targets.has(i)}
            data-selected={selected === i}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
            style={{ ['--pc' as string]: `var(--player-${owner + 1})` }}
            pointerEvents="none"
          >
            <circle r={13} />
            <text y={1}>{g.armies[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
