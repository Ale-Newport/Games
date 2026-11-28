/**
 * Kepra in SVG: 37 hex spaces — basins (dashed, where seas go), land with its printed bonus
 * (coloured discs for ore, crystal and flora, a card for a draw), and tiles: seas, groves and
 * settlements edged in their owner's colour. Spaces are buttons; highlighted ones are where the
 * tile being placed may go.
 */
import type { KeyboardEvent } from 'react';
import type { Translator } from '../../core/i18n';
import type { Shapers } from './engine';
import styles from './PlanetShapers.module.css';
import { BASINS, BONUS, CARD_BONUS, hexXY, POS, RES } from './world';

const S = 40;
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

export function PlanetMap({
  g,
  t,
  spaceName,
  targets,
  hinted,
  onPick,
}: {
  g: Shapers;
  t: Translator;
  spaceName: (s: number) => string;
  targets: Set<number>;
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
      data-testid="ps-map"
    >
      <circle className={styles.globe} cx={0} cy={0} r={(maxX - minX) / 2 - 4} />
      {POS.map((_, s) => {
        const [cx, cy] = CENTRES[s]!;
        const tile = g.tiles[s];
        const basin = BASINS.includes(s);
        const bonus = RES.filter((r) => BONUS[s]![r]);
        return (
          <g
            key={s}
            className={styles.space}
            data-basin={basin}
            data-tile={tile?.kind ?? 'none'}
            data-target={targets.has(s)}
            data-hint={hinted === s}
            style={
              tile && tile.owner >= 0
                ? { ['--pc' as string]: `var(--player-${tile.owner + 1})` }
                : undefined
            }
            role="button"
            tabIndex={targets.has(s) ? 0 : -1}
            aria-label={spaceName(s)}
            onClick={() => onPick(s)}
            onKeyDown={key(s)}
            data-testid={`ps-space-${s}`}
          >
            <title>{spaceName(s)}</title>
            <polygon className={styles.hex} points={corners(cx, cy, S * 0.96)} />
            {!tile &&
              bonus.map((r, k) => (
                <g key={r} pointerEvents="none">
                  <circle
                    className={styles.bonus}
                    data-res={r}
                    cx={cx + (k - (bonus.length - 1) / 2) * S * 0.5}
                    cy={cy}
                    r={S * 0.2}
                  />
                  <text
                    className={styles.bonusText}
                    x={cx + (k - (bonus.length - 1) / 2) * S * 0.5}
                    y={cy + 1}
                  >
                    {BONUS[s]![r]}
                  </text>
                </g>
              ))}
            {!tile && CARD_BONUS.has(s) && (
              <rect
                className={styles.cardBonus}
                x={cx - S * 0.14}
                y={cy - S * 0.2}
                width={S * 0.28}
                height={S * 0.4}
                rx={3}
                pointerEvents="none"
              />
            )}
            {tile?.kind === 'sea' && (
              <path
                className={styles.wave}
                d={`M${cx - S * 0.45} ${cy}q${S * 0.15} -${S * 0.15} ${S * 0.3} 0t${S * 0.3} 0t${S * 0.3} 0`}
                pointerEvents="none"
              />
            )}
            {tile?.kind === 'grove' && (
              <g className={styles.grove} pointerEvents="none">
                <circle cx={cx - S * 0.18} cy={cy + S * 0.05} r={S * 0.22} />
                <circle cx={cx + S * 0.18} cy={cy + S * 0.05} r={S * 0.22} />
                <circle cx={cx} cy={cy - S * 0.2} r={S * 0.24} />
              </g>
            )}
            {tile?.kind === 'settlement' && (
              <g className={styles.town} pointerEvents="none">
                <rect x={cx - S * 0.36} y={cy - S * 0.08} width={S * 0.3} height={S * 0.34} />
                <rect x={cx - S * 0.04} y={cy - S * 0.3} width={S * 0.38} height={S * 0.56} />
                <path d={`M${cx - S * 0.5} ${cy + S * 0.3}h${S}`} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
