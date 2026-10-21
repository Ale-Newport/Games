import { useState } from 'react';
import type { Translator } from '../../core/i18n';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { legalGobbleActions, ownerOf, sizeOf, type GobbleState, type Piece } from './engine';
import styles from './GobbleBoard.module.css';

type Source = { kind: 'reserve'; size: number } | { kind: 'cell'; cell: number } | null;

const COLORS = { 0: { fill: '#f08a24', rim: '#9a4f0a' }, 1: { fill: '#3a7bd5', rim: '#1d4689' } };

/** Original nesting-cup art seen from above: a rimmed disk whose size shows the piece size. */
export function Cup({ piece }: { piece: Piece }) {
  const c = COLORS[ownerOf(piece) as 0 | 1];
  const r = [0, 22, 32, 44][sizeOf(piece)]!;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="52" r={r} fill="rgba(0,0,0,0.25)" />
      <circle cx="50" cy="50" r={r} fill={c.fill} stroke={c.rim} strokeWidth="4" />
      <circle
        cx="50"
        cy="50"
        r={r * 0.62}
        fill="none"
        stroke={c.rim}
        strokeWidth="2.5"
        opacity="0.6"
      />
      <circle cx={50 - r * 0.3} cy={50 - r * 0.32} r={r * 0.14} fill="#fff" opacity="0.5" />
    </svg>
  );
}

export const pieceText = (p: Piece, t: Translator) =>
  t('piece.of', { seat: t(`seat.${ownerOf(p)}`), size: t(`size.${sizeOf(p)}`) });

export function GobbleBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<GobbleState, string>) {
  const [source, setSource] = useState<Source>(null);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setSource(null);
  }
  const legal = interactive ? legalGobbleActions(state) : [];
  const prefix = source
    ? source.kind === 'reserve'
      ? `R${source.size}>`
      : `${source.cell}>`
    : null;
  const targets = new Set(
    prefix ? legal.filter((a) => a.startsWith(prefix)).map((a) => Number(a.split('>')[1])) : [],
  );
  const win = new Set(state.result?.kind === 'win' ? state.result.line : []);
  const [hintFrom, hintTo] = hint ? hint.split('>') : [];
  const last = state.history[state.history.length - 1];
  const lastTo = last ? Number(last.split('>')[1]) : -1;

  const clickCell = (c: number) => {
    if (!interactive) return;
    if (prefix && targets.has(c)) {
      setSource(null);
      return onAction(`${prefix}${c}`);
    }
    const top = state.board[c]![state.board[c]!.length - 1];
    if (
      top !== undefined &&
      ownerOf(top) === state.toMove &&
      legal.some((a) => a.startsWith(`${c}>`))
    )
      return setSource(
        source?.kind === 'cell' && source.cell === c ? null : { kind: 'cell', cell: c },
      );
    setSource(null);
  };

  const reserve = (seat: 0 | 1) => (
    <div
      className={styles.reserve}
      role="group"
      aria-label={t('reserve.label', { seat: t(`seat.${seat}`) })}
      data-testid={`reserve-${seat}`}
    >
      {[3, 2, 1].map((size) => {
        const n = state.reserve[seat][size]!;
        const active = source?.kind === 'reserve' && source.size === size && seat === state.toMove;
        const usable = interactive && seat === state.toMove && n > 0;
        return (
          <button
            key={size}
            type="button"
            className={`${styles.reserveSlot} ${active ? styles.active : ''} ${hintFrom === `R${size}` && seat === state.toMove ? styles.hint : ''}`}
            disabled={!usable}
            aria-pressed={active}
            aria-label={`${t('piece.of', { seat: t(`seat.${seat}`), size: t(`size.${size}`) })} × ${n}`}
            data-testid={`reserve-${seat}-${size}`}
            onClick={() => setSource(active ? null : { kind: 'reserve', size })}
          >
            {n > 0 && <Cup piece={seat * 4 + size} />}
            {n > 1 && <span className={styles.count}>{n}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="gobble-board">
      {reserve(1)}
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {state.board.map((stack, c) => {
          const top = stack[stack.length - 1];
          const covered = stack.slice(0, -1);
          const label = [
            t('cell.name', { n: c + 1 }),
            top === undefined ? t('cell.empty') : pieceText(top, t),
            covered.length ? t('cell.covers', { n: covered.length }) : '',
            targets.has(c) ? t('cell.target') : '',
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <button
              key={c}
              type="button"
              role="gridcell"
              className={`${styles.cell} ${targets.has(c) ? styles.target : ''} ${win.has(c) ? styles.win : ''} ${source?.kind === 'cell' && source.cell === c ? styles.active : ''} ${Number(hintTo) === c && hint ? styles.hint : ''}`}
              data-cell={c}
              aria-label={label}
              onClick={() => clickCell(c)}
            >
              {top !== undefined && (
                <span
                  key={lastTo === c ? `placed-${turn}` : 'still'}
                  className={`${styles.piece} ${lastTo === c ? styles.placed : ''}`}
                >
                  <Cup piece={top} />
                </span>
              )}
              {covered.length > 0 && (
                <span className={styles.under} aria-hidden="true">
                  {covered.map((p, i) => (
                    <span
                      key={i}
                      className={styles.underDot}
                      style={{ background: COLORS[ownerOf(p) as 0 | 1].fill }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {reserve(0)}
    </div>
  );
}
