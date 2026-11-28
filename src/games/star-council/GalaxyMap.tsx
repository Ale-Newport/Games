/**
 * The galaxy in SVG: one pointy hex per system (empty space, nebula, rift, asteroid field, the
 * Nexus, home systems edged in their faction's colour), planets as discs tinted by their holder
 * with resources/influence, docks, infantry and exhausted state, a badge per player with ships
 * there, and command tokens along the top. Systems are buttons.
 */
import type { KeyboardEvent } from 'react';
import type { Translator } from '../../core/i18n';
import { combatShips, homePlayer, kindAt, planetsIn, type Star } from './engine';
import styles from './StarCouncil.module.css';
import { hexXY, PLANETS, POS } from './world';

const S = 46;
const corners = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
const CENTRES = POS.map((_, i) => {
  const [x, y] = hexXY(i);
  return [x * S, y * S] as [number, number];
});
const minX = Math.min(...CENTRES.map((c) => c[0])) - S;
const maxX = Math.max(...CENTRES.map((c) => c[0])) + S;
const minY = Math.min(...CENTRES.map((c) => c[1])) - S * 1.1;
const maxY = Math.max(...CENTRES.map((c) => c[1])) + S * 1.1;
const SPOTS: Record<number, [number, number][]> = {
  0: [],
  1: [[0, -0.12]],
  2: [
    [-0.33, -0.12],
    [0.33, -0.12],
  ],
  3: [
    [-0.36, 0.02],
    [0.36, 0.02],
    [0, -0.4],
  ],
};

export function GalaxyMap({
  g,
  t,
  sysName,
  targets,
  selected,
  active,
  onPick,
}: {
  g: Star;
  t: Translator;
  sysName: (s: number) => string;
  targets: Set<number>;
  selected: number | null;
  active: number | null;
  onPick: (s: number) => void;
}) {
  const key = (s: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(s);
    }
  };
  return (
    <svg
      className={styles.map}
      viewBox={`${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}`}
      role="group"
      aria-label={t('aria.map')}
      data-testid="sc-map"
    >
      {POS.map((_, s) => {
        const [cx, cy] = CENTRES[s]!;
        const kind = kindAt(g, s);
        const home = homePlayer(g, s);
        const pls = planetsIn(g, s);
        const fleets = g.ps
          .map((_, p) => ({ p, n: combatShips(g.space[s]![p]!), inf: g.space[s]![p]!.infantry }))
          .filter((x) => x.n > 0);
        const toks = g.ps.map((_, p) => p).filter((p) => g.tokens[s]![p]);
        return (
          <g
            key={s}
            className={styles.sys}
            data-kind={kind}
            data-target={targets.has(s)}
            data-selected={selected === s}
            data-active={active === s}
            style={home >= 0 ? { ['--pc' as string]: `var(--player-${home + 1})` } : undefined}
            role="button"
            tabIndex={0}
            aria-label={sysName(s)}
            onClick={() => onPick(s)}
            onKeyDown={key(s)}
            data-testid={`sc-sys-${s}`}
          >
            <title>{sysName(s)}</title>
            <polygon className={styles.hex} points={corners(cx, cy, S * 0.97)} />
            {kind === 'nebula' && (
              <g className={styles.nebula} pointerEvents="none">
                <circle cx={cx - S * 0.25} cy={cy - S * 0.1} r={S * 0.35} />
                <circle cx={cx + S * 0.2} cy={cy + S * 0.15} r={S * 0.3} />
              </g>
            )}
            {kind === 'rift' && (
              <g className={styles.rift} pointerEvents="none">
                <circle cx={cx} cy={cy} r={S * 0.42} />
                <circle cx={cx} cy={cy} r={S * 0.24} />
                <circle cx={cx} cy={cy} r={S * 0.08} />
              </g>
            )}
            {kind === 'field' && (
              <g className={styles.rocks} pointerEvents="none">
                {(
                  [
                    [-0.35, -0.2, 0.16],
                    [0.25, -0.3, 0.12],
                    [0.05, 0.15, 0.2],
                    [-0.3, 0.35, 0.1],
                    [0.4, 0.25, 0.11],
                  ] as const
                ).map(([dx, dy, r], k) => (
                  <polygon key={k} points={corners(cx + dx * S, cy + dy * S, r * S)} />
                ))}
              </g>
            )}
            {kind === 'nexus' && (
              <circle className={styles.halo} cx={cx} cy={cy - S * 0.12} r={S * 0.34} />
            )}
            {pls.map((pl, k) => {
              const [dx, dy] = SPOTS[pls.length]![k]!;
              const x = cx + dx * S;
              const y = cy + dy * S;
              const def = PLANETS[pl.id]!;
              return (
                <g
                  key={pl.id}
                  className={styles.planet}
                  data-owner={pl.owner}
                  data-ready={pl.ready}
                  style={
                    pl.owner >= 0
                      ? { ['--pc' as string]: `var(--player-${pl.owner + 1})` }
                      : undefined
                  }
                  pointerEvents="none"
                >
                  <circle cx={x} cy={y} r={S * 0.24} />
                  <text x={x} y={y + 1}>
                    {def.r}/{def.i}
                  </text>
                  {pl.dock && (
                    <rect
                      className={styles.dock}
                      x={x + S * 0.12}
                      y={y - S * 0.3}
                      width={S * 0.16}
                      height={S * 0.16}
                    />
                  )}
                  {pl.inf > 0 && (
                    <text className={styles.inf} x={x - S * 0.2} y={y - S * 0.22}>
                      {pl.inf}
                    </text>
                  )}
                </g>
              );
            })}
            {fleets.map((f, k) => {
              const x = cx + (k - (fleets.length - 1) / 2) * S * 0.46;
              const y = cy + S * 0.5;
              return (
                <g
                  key={f.p}
                  className={styles.fleet}
                  style={{ ['--pc' as string]: `var(--player-${f.p + 1})` }}
                  pointerEvents="none"
                >
                  <rect x={x - S * 0.2} y={y - S * 0.15} width={S * 0.4} height={S * 0.3} rx={4} />
                  <text x={x} y={y + 1}>
                    {f.n}
                    {f.inf > 0 ? `+${f.inf}` : ''}
                  </text>
                </g>
              );
            })}
            {toks.map((p, k) => (
              <polygon
                key={p}
                className={styles.token}
                style={{ ['--pc' as string]: `var(--player-${p + 1})` }}
                points={corners(
                  cx + (k - (toks.length - 1) / 2) * S * 0.22,
                  cy - S * 0.72,
                  S * 0.1,
                )}
                pointerEvents="none"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
