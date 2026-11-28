/**
 * The world of Meridian in SVG, from the same hex grid the rules use: land tinted by its holder,
 * open sea, borders and coasts, victory cities (stars), capitals (crowns) and factories (a
 * chimney), and a small stack per power present showing its unit count. Places are buttons;
 * highlighted ones are where the chosen units can go.
 */
import type { KeyboardEvent } from 'react';
import type { Locale, Translator } from '../../core/i18n';
import type { Front } from './engine';
import styles from './GlobalFront.module.css';
import { cellXY, COLS, GRID, LOCS, ROWS } from './world';

const S = 18;
const R = 1.02;

function geometry() {
  const cells: { l: number; points: string }[] = [];
  const inner: string[] = [];
  const coast: string[] = [];
  const at = (x: number, y: number) => {
    const row = Math.round(y / 1.5);
    const col = Math.round(x / Math.sqrt(3) - (row & 1 ? 0.5 : 0));
    return GRID[row]?.[col] ?? -1;
  };
  for (let row = 0; row < ROWS; row++)
    for (let c = 0; c < COLS; c++) {
      const l = GRID[row]![c]!;
      const [x, y] = cellXY(c, row);
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 90);
        return [(x + R * Math.cos(a)) * S, (y + R * Math.sin(a)) * S] as [number, number];
      });
      cells.push({ l, points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ') });
      for (let i = 0; i < 6; i++) {
        const [ax, ay] = pts[i]!;
        const [bx, by] = pts[(i + 1) % 6]!;
        const o = at((ax + bx) / S - x, (ay + by) / S - y);
        if (o < 0 || o <= l) continue;
        const seg = `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
        if (LOCS[o]!.kind !== LOCS[l]!.kind) coast.push(seg);
        else inner.push(seg);
      }
    }
  const labels = LOCS.map((l) => {
    const [x, y] = cellXY(l.label[0], l.label[1]);
    return [x * S, y * S] as [number, number];
  });
  return {
    cells,
    inner: inner.join(''),
    coast: coast.join(''),
    labels,
    w: (COLS + 0.6) * Math.sqrt(3) * S,
    h: (ROWS * 1.5 + 0.6) * S,
  };
}
const G = geometry();

export function WorldMap({
  g,
  t,
  locale,
  targets,
  selected,
  battle,
  onPick,
}: {
  g: Front;
  t: Translator;
  locale: Locale;
  targets: Set<number>;
  selected: number | null;
  battle: number | null;
  onPick: (loc: number) => void;
}) {
  const key = (loc: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(loc);
    }
  };
  return (
    <svg
      className={styles.map}
      viewBox={`${-S} ${-S * 1.2} ${G.w + S * 0.6} ${G.h + S}`}
      role="group"
      aria-label={t('aria.map')}
      data-testid="gf-map"
    >
      {LOCS.map((l, i) => {
        const owner = g.owner[i]!;
        const n = g.units.filter((u) => u.loc === i).length;
        return (
          <g
            key={i}
            className={styles.loc}
            data-kind={l.kind}
            data-owner={owner}
            data-target={targets.has(i)}
            data-selected={selected === i}
            data-battle={battle === i}
            style={owner >= 0 ? { ['--pc' as string]: `var(--player-${owner + 1})` } : undefined}
            role="button"
            tabIndex={0}
            aria-label={`${l.name[locale]}${owner >= 0 ? `, ${t(`power.${owner}`)}` : ''}, ${n}`}
            onClick={() => onPick(i)}
            onKeyDown={key(i)}
            data-testid={`gf-loc-${i}`}
          >
            <title>{l.name[locale]}</title>
            {G.cells
              .filter((c) => c.l === i)
              .map((c, k) => (
                <polygon key={k} className={styles.cell} points={c.points} />
              ))}
          </g>
        );
      })}
      <path className={styles.inner} d={G.inner} />
      <path className={styles.coast} d={G.coast} />
      {LOCS.map((l, i) => {
        const [x, y] = G.labels[i]!;
        const owners = [...new Set(g.units.filter((u) => u.loc === i).map((u) => u.owner))].sort();
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} pointerEvents="none">
            {l.city && (
              <path
                className={styles.star}
                transform="translate(-14 -14) scale(0.55)"
                d="M0 -10L2.9 -3.1L10 -3.1L4.3 1.2L6.5 8.1L0 3.9L-6.5 8.1L-4.3 1.2L-10 -3.1L-2.9 -3.1Z"
              />
            )}
            {l.capital && (
              <path
                className={styles.crown}
                transform="translate(12 -14)"
                d="M-6 3H6L7 -5L3 -1L0 -6L-3 -1L-7 -5Z"
              />
            )}
            {l.factory && !l.capital && (
              <path
                className={styles.factory}
                transform="translate(12 -14)"
                d="M-6 4V-2L-2 0V-2L2 0V-6H5V4Z"
              />
            )}
            {owners.map((o, k) => {
              const n = g.units.filter((u) => u.loc === i && u.owner === o).length;
              return (
                <g
                  key={o}
                  transform={`translate(${(k - (owners.length - 1) / 2) * 20} 4)`}
                  className={styles.stack}
                  style={{ ['--pc' as string]: `var(--player-${o + 1})` }}
                >
                  <rect x={-9} y={-8} width={18} height={16} rx={4} />
                  <text y={1}>{n}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
