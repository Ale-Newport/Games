/**
 * The island, drawn in SVG from the engine's geometry: hexes with their terrain glyph and number
 * token (dots for the odds, red for 6 and 8), harbours on the coast, paths, huts and towns in the
 * players' colours, the storm, and — while the player chooses — highlighted corners, edges or
 * hexes that can be clicked, tapped or reached with Tab and chosen with Enter.
 */
import type { KeyboardEvent } from 'react';
import type { Translator } from '../../core/i18n';
import { GEO, HARBOUR_EDGES, pips, RESOURCES, type IsleGame } from './engine';
import styles from './HexIsles.module.css';

export type TargetKind = 'corner' | 'edge' | 'hex';
export interface Targets {
  kind: TargetKind;
  ids: number[];
  /** A suggested target (the hint), drawn brighter. */
  hint?: number | null;
}

const S = 52;
const X = (x: number) => x * S;

function Glyph({ terrain }: { terrain: string }) {
  switch (terrain) {
    case 'grove':
      return (
        <g className={styles.glyph}>
          <path d="M-14 6 L-8 -8 L-2 6 Z M-4 4 L3 -12 L10 4 Z M6 7 L11 -4 L16 7 Z" />
        </g>
      );
    case 'reef':
      return (
        <g className={styles.glyphLine}>
          <path d="M0 8 V-6 M0 0 L-8 -8 M0 -2 L7 -11 M-5 -4 L-10 -2 M4 -6 L10 -4 M-8 -8 V-12" />
        </g>
      );
    case 'saltpan':
      return (
        <g className={styles.glyph}>
          <path d="M-10 0 L-6 -5 L-2 0 L-6 5 Z M2 -6 L6 -11 L10 -6 L6 -1 Z M2 6 L6 1 L10 6 L6 11 Z" />
        </g>
      );
    case 'lagoon':
      return (
        <g className={styles.glyph}>
          <path d="M-12 0 Q-2 -9 8 0 Q-2 9 -12 0 Z M8 0 L15 -6 L15 6 Z" />
          <circle cx={-6} cy={-1} r={1.4} className={styles.eye} />
        </g>
      );
    case 'cliffs':
      return (
        <g className={styles.glyph}>
          <path d="M-15 8 L-7 -8 L-2 0 L4 -12 L15 8 Z" />
        </g>
      );
    default:
      return (
        <g className={styles.glyphLine}>
          <path d="M-14 -4 Q-8 -9 -2 -4 T10 -4 M-12 4 Q-6 -1 0 4 T12 4" />
        </g>
      );
  }
}

function Token({ n }: { n: number }) {
  const red = pips(n) === 5;
  return (
    <g className={styles.token} data-red={red}>
      <circle r={15} />
      <text y={2}>{n}</text>
      <g className={styles.dots}>
        {Array.from({ length: pips(n) }, (_, i) => (
          <circle key={i} cx={(i - (pips(n) - 1) / 2) * 3.4} cy={9.5} r={1.15} />
        ))}
      </g>
    </g>
  );
}

const Hut = () => <path d="M-8 6 V-2 L0 -9 L8 -2 V6 Z" />;
const Town = () => <path d="M-11 8 V-3 L-4 -10 L3 -3 V-1 H11 V8 Z" />;

export function IslesBoard({
  g,
  t,
  targets,
  onPick,
}: {
  g: IsleGame;
  t: Translator;
  targets: Targets | null;
  onPick: (id: number) => void;
}) {
  const sum = g.dice ? g.dice[0] + g.dice[1] : null;
  const pick = (id: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(id);
    }
  };
  const on = (k: TargetKind) => (targets?.kind === k ? new Set(targets.ids) : null);
  const corners = on('corner');
  const edges = on('edge');
  const hexes = on('hex');
  const label = (i: number) => {
    const terr = t(`terrain.${g.board.terrain[i]}`);
    const n = g.board.numbers[i] ?? '—';
    return t(i === g.storm ? 'aria.hexStorm' : 'aria.hex', { terrain: terr, n });
  };
  return (
    <svg
      className={styles.board}
      viewBox={`${-5.35 * S} ${-5.05 * S} ${10.7 * S} ${10.1 * S}`}
      role="group"
      aria-label={t('aria.board')}
      data-testid="hi-board"
    >
      <ellipse className={styles.sea} rx={5.2 * S} ry={4.95 * S} />
      {HARBOUR_EDGES.map((e, k) => {
        const ed = GEO.edges[e]!;
        const a = GEO.verts[ed.a]!;
        const b = GEO.verts[ed.b]!;
        const h = GEO.hexes[ed.hexes[0]!]!;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = mx - h.x;
        const dy = my - h.y;
        const len = Math.hypot(dx, dy);
        const px = mx + (dx / len) * 0.52;
        const py = my + (dy / len) * 0.52;
        const kind = g.board.harbours[k]!;
        const name =
          kind === 'any'
            ? t('harbour.any')
            : t('harbour.res', { res: t(`res.${RESOURCES.indexOf(kind)}`) });
        return (
          <g key={e} className={styles.harbour} data-kind={kind}>
            <title>{name}</title>
            <line x1={X(a.x)} y1={X(a.y)} x2={X(px)} y2={X(py)} />
            <line x1={X(b.x)} y1={X(b.y)} x2={X(px)} y2={X(py)} />
            <circle cx={X(px)} cy={X(py)} r={13} />
            <text x={X(px)} y={X(py) + 1}>
              {kind === 'any' ? '3:1' : '2:1'}
            </text>
            {kind !== 'any' && (
              <circle
                cx={X(px) + 10}
                cy={X(py) - 10}
                r={4.5}
                className={styles.resDot}
                data-res={RESOURCES.indexOf(kind)}
              />
            )}
          </g>
        );
      })}
      {GEO.hexes.map((h, i) => {
        const pts = h.verts.map((v) => `${X(GEO.verts[v]!.x)},${X(GEO.verts[v]!.y)}`).join(' ');
        const n = g.board.numbers[i];
        return (
          <g
            key={i}
            className={styles.hex}
            data-terrain={g.board.terrain[i]}
            data-hot={sum !== null && n === sum && i !== g.storm}
            aria-label={label(i)}
            role="img"
          >
            <polygon points={pts} />
            {i !== g.storm && (
              <g transform={`translate(${X(h.x)} ${X(h.y) - 19})`}>
                <Glyph terrain={g.board.terrain[i]!} />
              </g>
            )}
            {n !== null && n !== undefined && (
              <g transform={`translate(${X(h.x)} ${X(h.y) + 9})`}>
                <Token n={n} />
              </g>
            )}
          </g>
        );
      })}
      {/* The storm */}
      <g
        className={styles.storm}
        transform={`translate(${X(GEO.hexes[g.storm]!.x)} ${X(GEO.hexes[g.storm]!.y) - 21})`}
        data-testid="hi-storm"
        data-hex={g.storm}
      >
        <title>{t('storm')}</title>
        <path d="M-14 4 Q-16 -6 -6 -6 Q-3 -14 6 -11 Q14 -12 14 -3 Q19 0 14 5 Z" />
        <path className={styles.bolt} d="M0 5 L-4 13 L1 12 L-2 19 L6 9 L1 10 L4 5 Z" />
      </g>
      {GEO.edges.map((e, i) => {
        const p = g.paths[i];
        if (p === null || p === undefined) return null;
        const a = GEO.verts[e.a]!;
        const b = GEO.verts[e.b]!;
        const sx = a.x + (b.x - a.x) * 0.16;
        const sy = a.y + (b.y - a.y) * 0.16;
        const ex = a.x + (b.x - a.x) * 0.84;
        const ey = a.y + (b.y - a.y) * 0.84;
        return (
          <line
            key={i}
            className={styles.path}
            style={{ ['--pc' as string]: `var(--player-${p + 1})` }}
            x1={X(sx)}
            y1={X(sy)}
            x2={X(ex)}
            y2={X(ey)}
            data-testid={`hi-path-${i}`}
          />
        );
      })}
      {GEO.verts.map((v, i) => {
        const s = g.sites[i];
        if (!s) return null;
        return (
          <g
            key={i}
            className={styles.site}
            style={{ ['--pc' as string]: `var(--player-${s.p + 1})` }}
            transform={`translate(${X(v.x)} ${X(v.y)})`}
            data-testid={`hi-site-${i}`}
            data-town={s.town}
          >
            {s.town ? <Town /> : <Hut />}
          </g>
        );
      })}
      {hexes &&
        GEO.hexes.map((h, i) =>
          hexes.has(i) ? (
            <polygon
              key={`t${i}`}
              className={styles.targetHex}
              data-hint={targets?.hint === i}
              points={h.verts.map((v) => `${X(GEO.verts[v]!.x)},${X(GEO.verts[v]!.y)}`).join(' ')}
              role="button"
              tabIndex={0}
              aria-label={label(i)}
              onClick={() => onPick(i)}
              onKeyDown={pick(i)}
              data-testid={`hi-hex-${i}`}
            />
          ) : null,
        )}
      {edges &&
        GEO.edges.map((e, i) => {
          if (!edges.has(i)) return null;
          const a = GEO.verts[e.a]!;
          const b = GEO.verts[e.b]!;
          return (
            <g
              key={`e${i}`}
              className={styles.targetEdge}
              data-hint={targets?.hint === i}
              role="button"
              tabIndex={0}
              aria-label={t('aria.edge', { n: i + 1 })}
              onClick={() => onPick(i)}
              onKeyDown={pick(i)}
              data-testid={`hi-edge-${i}`}
            >
              <line x1={X(a.x)} y1={X(a.y)} x2={X(b.x)} y2={X(b.y)} className={styles.hit} />
              <line
                x1={X(a.x + (b.x - a.x) * 0.2)}
                y1={X(a.y + (b.y - a.y) * 0.2)}
                x2={X(a.x + (b.x - a.x) * 0.8)}
                y2={X(a.y + (b.y - a.y) * 0.8)}
                className={styles.mark}
              />
            </g>
          );
        })}
      {corners &&
        GEO.verts.map((v, i) =>
          corners.has(i) ? (
            <g
              key={`c${i}`}
              className={styles.targetCorner}
              data-hint={targets?.hint === i}
              transform={`translate(${X(v.x)} ${X(v.y)})`}
              role="button"
              tabIndex={0}
              aria-label={t('aria.corner', { n: i + 1 })}
              onClick={() => onPick(i)}
              onKeyDown={pick(i)}
              data-testid={`hi-corner-${i}`}
            >
              <circle r={14} className={styles.hit} />
              <circle r={7} className={styles.mark} />
            </g>
          ) : null,
        )}
    </svg>
  );
}
