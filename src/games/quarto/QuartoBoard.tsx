import { useState } from 'react';
import type { Translator } from '../../core/i18n';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { available, legalQuartoActions, parseAction, type QuartoState } from './engine';
import { QuartoPiece, traitsOf } from './QuartoPiece';
import styles from './QuartoBoard.module.css';

export function pieceLabel(p: number, t: Translator) {
  const x = traitsOf(p);
  return [
    x.tall ? t('trait.tall') : t('trait.short'),
    x.dark ? t('trait.dark') : t('trait.light'),
    x.square ? t('trait.square') : t('trait.round'),
    x.hollow ? t('trait.hollow') : t('trait.solid'),
  ].join(', ');
}

export function QuartoBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<QuartoState, string>) {
  const [cell, setCell] = useState<number | null>(null);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setCell(null);
  }
  const legal = interactive ? legalQuartoActions(state) : [];
  const pool = available(state);
  const hinted = hint ? parseAction(hint) : null;
  const win = state.result?.kind === 'win' ? new Set(state.result.line) : new Set<number>();
  const placing = state.inHand >= 0 && !state.result;
  const choosing = interactive && (state.inHand < 0 || cell !== null);

  const clickCell = (c: number) => {
    if (!interactive || state.inHand < 0) return;
    if (state.board[c]! >= 0) return onAction('');
    if (legal.includes(String(c))) return onAction(String(c)); // a winning or final placement
    setCell(cell === c ? null : c);
  };
  const clickPiece = (p: number) => {
    if (!interactive) return;
    const action = state.inHand < 0 ? `give:${p}` : cell !== null ? `${cell}:give:${p}` : null;
    if (action && legal.includes(action)) onAction(action);
  };

  const board = state.board.slice();
  if (cell !== null) board[cell] = state.inHand;

  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="quarto-board">
      <div className={styles.handRow}>
        <span className={styles.handLabel}>{t('hand.label')}</span>
        <span
          className={styles.hand}
          data-testid="in-hand"
          aria-label={state.inHand >= 0 ? pieceLabel(state.inHand, t) : t('hand.none')}
        >
          {state.inHand >= 0 && cell === null ? <QuartoPiece piece={state.inHand} /> : null}
        </span>
        <span className={styles.prompt} role="status">
          {state.result
            ? ''
            : !interactive
              ? ''
              : state.inHand < 0
                ? t('prompt.giveFirst')
                : cell === null
                  ? t('prompt.place')
                  : t('prompt.give')}
        </span>
      </div>
      <div className={styles.board} role="grid" aria-label={t('board.label')}>
        {board.map((p, c) => (
          <button
            key={c}
            type="button"
            role="gridcell"
            className={`${styles.cell} ${win.has(c) ? styles.win : ''} ${hinted?.cell === c ? styles.hint : ''} ${cell === c ? styles.pending : ''}`}
            data-cell={c}
            aria-label={`${t('cell.name', { n: c + 1 })}, ${p >= 0 ? pieceLabel(p, t) : t('cell.empty')}`}
            aria-disabled={!placing || !interactive || p >= 0}
            onClick={() => clickCell(c)}
          >
            {p >= 0 && <QuartoPiece piece={p} />}
          </button>
        ))}
      </div>
      <div className={styles.pool} role="group" aria-label={t('pool.label')}>
        {Array.from({ length: 16 }, (_, p) => {
          const free = pool.includes(p);
          return (
            <button
              key={p}
              type="button"
              className={`${styles.poolPiece} ${hinted?.give === p ? styles.hint : ''}`}
              data-piece={p}
              disabled={!free || !choosing}
              aria-label={pieceLabel(p, t)}
              onClick={() => clickPiece(p)}
            >
              {free && <QuartoPiece piece={p} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
