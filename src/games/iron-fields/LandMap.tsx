/**
 * The land in SVG: hex spaces tinted by terrain (the Foundry in the middle, homes edged in their
 * faction's colour, lakes), encounter tokens, structures, and for every faction on a space a
 * badge: its character (a ring), mechs (a triangle with a count) and workers (a square with a
 * count). Spaces are buttons; highlighted ones are where the current step can happen.
 */
import type { KeyboardEvent } from 'react';
import type { Translator } from '../../core/i18n';
import { homePlayer, type Iron } from './engine';
import styles from './IronFields.module.css';
import { hexXY, POS } from './world';

const S = 44;
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

export function LandMap({
  g,
  t,
  spaceName,
  targets,
  selected,
  hinted,
  onPick,
}: {
  g: Iron;
  t: Translator;
  spaceName: (s: number) => string;
  targets: Set<number>;
  selected: number | null;
  hinted: number | null;
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
      data-testid="if-map"
    >
      {POS.map((_, s) => {
        const [cx, cy] = CENTRES[s]!;
        const terr = g.terrain[s]!;
        const home = homePlayer(g, s);
        const owners = [...new Set(g.units.filter((u) => u.at === s).map((u) => u.owner))].sort();
        const st = g.structures.find((x) => x.hex === s);
        return (
          <g
            key={s}
            className={styles.space}
            data-terrain={terr}
            data-target={targets.has(s)}
            data-selected={selected === s}
            data-hint={hinted === s}
            style={home >= 0 ? { ['--pc' as string]: `var(--player-${home + 1})` } : undefined}
            role="button"
            tabIndex={0}
            aria-label={spaceName(s)}
            onClick={() => onPick(s)}
            onKeyDown={key(s)}
            data-testid={`if-space-${s}`}
          >
            <title>{spaceName(s)}</title>
            <polygon className={styles.hex} points={corners(cx, cy, S * 0.96)} />
            {terr === 'foundry' && (
              <path
                className={styles.foundry}
                d={`M${cx - 12} ${cy + 8}V${cy - 4}L${cx - 4} ${cy - 10}V${cy - 4}L${cx + 4} ${cy - 10}V${cy - 4}L${cx + 12} ${cy - 10}V${cy + 8}Z`}
                pointerEvents="none"
              />
            )}
            {g.tokens[s] && (
              <g pointerEvents="none">
                <circle className={styles.token} cx={cx} cy={cy - S * 0.5} r={S * 0.16} />
                <text className={styles.tokenText} x={cx} y={cy - S * 0.5 + 1}>
                  ?
                </text>
              </g>
            )}
            {st && (
              <rect
                className={styles.structure}
                data-kind={st.kind}
                style={{ ['--pc' as string]: `var(--player-${st.owner + 1})` }}
                x={cx + S * 0.38}
                y={cy - S * 0.28}
                width={S * 0.22}
                height={S * 0.22}
                pointerEvents="none"
              />
            )}
            {owners.map((o, k) => {
              const here = g.units.filter((u) => u.at === s && u.owner === o);
              const ch = here.some((u) => u.kind === 'char');
              const mechs = here.filter((u) => u.kind === 'mech').length;
              const ws = here.filter((u) => u.kind === 'worker').length;
              const x = cx + (k - (owners.length - 1) / 2) * S * 0.7;
              const y = cy + S * 0.22;
              return (
                <g
                  key={o}
                  className={styles.units}
                  style={{ ['--pc' as string]: `var(--player-${o + 1})` }}
                  pointerEvents="none"
                >
                  {ch && <circle className={styles.char} cx={x} cy={y - S * 0.36} r={S * 0.19} />}
                  {mechs > 0 && (
                    <>
                      <polygon
                        className={styles.mech}
                        points={`${x - S * 0.3},${y + S * 0.2} ${x - S * 0.1},${y - S * 0.16} ${x + S * 0.1},${y + S * 0.2}`}
                      />
                      {mechs > 1 && (
                        <text className={styles.count} x={x - S * 0.1} y={y + S * 0.08}>
                          {mechs}
                        </text>
                      )}
                    </>
                  )}
                  {ws > 0 && (
                    <>
                      <rect
                        className={styles.worker}
                        x={x + S * 0.08}
                        y={y - S * 0.12}
                        width={S * 0.32}
                        height={S * 0.32}
                        rx={3}
                      />
                      <text className={styles.count} x={x + S * 0.24} y={y + S * 0.05}>
                        {ws}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
