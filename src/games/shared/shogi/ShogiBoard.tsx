import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { positionOf, type ShogiState } from './game';
import { moveAction, parseSquare, squareName, type Owner, type ShogiMove } from './position';
import { KomaDefs, PieceArt } from './ShogiPieces';
import type { ShogiVariant } from './variants';
import styles from './ShogiBoard.module.css';

type Selection = { kind: 'square'; sq: number } | { kind: 'hand'; piece: number } | null;

/** Squares touched by an action ("7g7f", "8h2b+", "P*5e"). */
function actionSquares(v: ShogiVariant, action: string | null | undefined): number[] {
  if (!action) return [];
  const drop = /^[A-Z]\*(\d+[a-z])$/.exec(action);
  if (drop) return [parseSquare(v, drop[1]!)];
  const m = /^(\d+[a-z])(\d+[a-z])/.exec(action);
  return m ? [parseSquare(v, m[1]!), parseSquare(v, m[2]!)] : [];
}

export function createShogiBoard(v: ShogiVariant) {
  const { rows, cols } = v;
  const animal = v.goal === 'capture';
  return function ShogiBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
    perspective,
  }: BoardProps<ShogiState, string>) {
    const pos = useMemo(() => positionOf(v, state), [state]);
    const moves = useMemo(() => (interactive ? pos.legalMoves() : []), [pos, interactive]);
    const turn = state.history.length;
    const [selected, setSelected] = useState<Selection>(null);
    const [promotion, setPromotion] = useState<ShogiMove[] | null>(null);
    const [cursor, setCursor] = useState(() => (rows - 1) * cols + Math.floor(cols / 2));
    const [focusToken, setFocusToken] = useState(0);
    const [lastTurn, setLastTurn] = useState(turn);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const listRef = useRef<HTMLOListElement>(null);
    if (lastTurn !== turn) {
      setLastTurn(turn);
      setSelected(null);
      setPromotion(null);
    }

    // UI cell u = row * cols + col from the top-left as displayed; Gote's view is rotated.
    const sqAt = (u: number) => (perspective === 0 ? u : rows * cols - 1 - u);
    const uiOf = (sq: number) => (perspective === 0 ? sq : rows * cols - 1 - sq);

    const targets = new Map<number, ShogiMove[]>();
    for (const m of moves) {
      const match =
        selected?.kind === 'square'
          ? m.from === selected.sq
          : selected?.kind === 'hand'
            ? m.from < 0 && m.kind === selected.piece
            : false;
      if (match) targets.set(m.to, [...(targets.get(m.to) ?? []), m]);
    }
    const movable = new Set(moves.filter((m) => m.from >= 0).map((m) => m.from));
    const droppable = new Set(moves.filter((m) => m.from < 0).map((m) => m.kind));

    const choose = (list: ShogiMove[]) => {
      if (list.length > 1) return setPromotion(list);
      setSelected(null);
      onAction(moveAction(pos, list[0]!));
    };

    const click = (sq: number) => {
      setCursor(uiOf(sq));
      if (!interactive || promotion) return;
      const list = targets.get(sq);
      if (list) return choose(list);
      if (movable.has(sq))
        return setSelected(
          selected?.kind === 'square' && selected.sq === sq ? null : { kind: 'square', sq },
        );
      if (selected) return setSelected(null);
      const code = pos.board[sq]!;
      if (code !== 0 && (code > 0 ? 0 : 1) === pos.side) onAction(''); // a piece without moves
    };

    const clickHand = (owner: Owner, piece: number) => {
      if (!interactive || promotion || owner !== pos.side) return;
      if (!droppable.has(piece)) return onAction('');
      setSelected(
        selected?.kind === 'hand' && selected.piece === piece ? null : { kind: 'hand', piece },
      );
    };

    useEffect(() => {
      if (focusToken > 0) refs.current[cursor]?.focus();
    }, [focusToken, cursor]);
    useEffect(() => {
      const list = listRef.current;
      if (list) list.scrollLeft = list.scrollWidth;
    }, [turn]);

    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir && !promotion) {
        setCursor((c) => moveCursor(c, dir, { rows, cols }));
        setFocusToken((k) => k + 1);
        return true;
      }
      if (e.key === 'Escape' && (promotion || selected)) {
        setPromotion(null);
        setSelected(null);
        return true;
      }
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        click(sqAt(cursor));
        return true;
      }
      return false;
    });

    const last = actionSquares(v, state.history[state.history.length - 1]);
    const hinted = actionSquares(v, hint);
    const hintDrop = hint && /^([A-Z])\*/.exec(hint)?.[1];
    const checked = v.goal === 'checkmate' && pos.inCheck() ? pos.kings[pos.side] : -1;
    const pieceName = (kind: number, owner: Owner) =>
      t(`pc.${owner}.${v.kinds[kind]!.letter.replace('+', 'p')}`);

    const hand = (owner: Owner) => {
      const kinds = v.kinds
        .map((def, k) => ({ def, k }))
        .filter(({ def, k }) => def && !def.royal && def.base === k);
      return (
        <div
          className={styles.hand}
          data-owner={owner}
          data-testid={`hand-${owner}`}
          aria-label={t('hand.label', { seat: t(`seat.${owner}`) })}
          role="group"
        >
          {kinds.every(({ k }) => !pos.hands[owner][k]) && (
            <span className={styles.handEmpty}>{t('hand.empty')}</span>
          )}
          {kinds.map(({ k }) => {
            const n = pos.hands[owner][k]!;
            if (!n) return null;
            const active = selected?.kind === 'hand' && selected.piece === k && owner === pos.side;
            return (
              <button
                key={k}
                type="button"
                className={`${styles.handPiece} ${active ? styles.selectedHand : ''} ${hintDrop === v.kinds[k]!.letter && owner === pos.side ? styles.hintHand : ''}`}
                data-testid={`hand-${owner}-${v.kinds[k]!.letter}`}
                aria-label={`${pieceName(k, owner)} × ${n}`}
                aria-pressed={active}
                aria-disabled={!interactive || owner !== pos.side || !droppable.has(k)}
                onClick={() => clickHand(owner, k)}
              >
                <PieceArt
                  v={v}
                  kind={k}
                  owner={perspective === 0 ? owner : ((1 - owner) as Owner)}
                />
                {n > 1 && <span className={styles.count}>{n}</span>}
              </button>
            );
          })}
        </div>
      );
    };

    const fileLabels = Array.from({ length: cols }, (_, c) => squareName(v, sqAt(c)).slice(0, -1));
    const rankLabels = Array.from({ length: rows }, (_, r) =>
      squareName(v, sqAt(r * cols)).slice(-1),
    );

    return (
      <div
        className={`${styles.wrap} ${animal ? styles.animal : ''} ${animate ? styles.animated : ''}`}
        style={{ '--cols': cols, '--rows': rows } as CSSProperties}
        data-testid="shogi-board"
      >
        <KomaDefs />
        {hand((1 - perspective) as Owner)}
        <div className={styles.frame}>
          <div className={styles.files} aria-hidden="true">
            {fileLabels.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <div className={styles.boardRow}>
            <div className={styles.board} role="grid" aria-label={t('board.label')}>
              {Array.from({ length: rows }, (_, r) => (
                <div key={r} role="row" className={styles.row}>
                  {Array.from({ length: cols }, (_, c) => {
                    const u = r * cols + c;
                    const sq = sqAt(u);
                    const code = pos.board[sq]!;
                    const owner: Owner = code > 0 ? 0 : 1;
                    const list = targets.get(sq);
                    const zone = pos.inZone(sq, 0)
                      ? 'zone0'
                      : pos.inZone(sq, 1)
                        ? 'zone1'
                        : undefined;
                    const label = [
                      squareName(v, sq),
                      code ? pieceName(Math.abs(code), owner) : t('sq.empty'),
                      selected?.kind === 'square' && selected.sq === sq ? t('sq.selected') : '',
                      list ? t(code ? 'sq.capture' : 'sq.target') : '',
                      checked === sq ? t('sq.check') : '',
                    ]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <button
                        key={u}
                        ref={(el) => {
                          refs.current[u] = el;
                        }}
                        type="button"
                        role="gridcell"
                        className={[
                          styles.square,
                          selected?.kind === 'square' && selected.sq === sq ? styles.selected : '',
                          last.includes(sq) ? styles.last : '',
                          hinted.includes(sq) ? styles.hint : '',
                          checked === sq ? styles.check : '',
                        ].join(' ')}
                        data-square={squareName(v, sq)}
                        data-zone={zone}
                        tabIndex={u === cursor ? 0 : -1}
                        aria-label={label}
                        aria-disabled={!interactive || (!movable.has(sq) && !list)}
                        onClick={() => click(sq)}
                        onFocus={() => setCursor(u)}
                      >
                        {code !== 0 && (
                          <span
                            key={last[last.length - 1] === sq ? `placed-${turn}` : 'still'}
                            className={`${styles.piece} ${last[last.length - 1] === sq ? styles.placed : ''}`}
                          >
                            <PieceArt
                              v={v}
                              kind={Math.abs(code)}
                              owner={perspective === 0 ? owner : ((1 - owner) as Owner)}
                            />
                          </span>
                        )}
                        {list && <span className={code ? styles.ring : styles.dot} />}
                      </button>
                    );
                  })}
                </div>
              ))}
              {promotion && (
                <div className={styles.promotion} role="dialog" aria-label={t('promo.title')}>
                  <p>{t('promo.title')}</p>
                  <div className={styles.promoChoices}>
                    {[true, false].map((promote) => {
                      const m = promotion.find((x) => x.promote === promote)!;
                      const kind = promote ? v.kinds[m.kind]!.promotesTo : m.kind;
                      return (
                        <button
                          key={String(promote)}
                          type="button"
                          className={styles.promoButton}
                          data-testid={promote ? 'promote-yes' : 'promote-no'}
                          onClick={() => {
                            setPromotion(null);
                            choose([m]);
                          }}
                        >
                          <PieceArt v={v} kind={kind} owner={0} />
                          <span>{t(promote ? 'promo.yes' : 'promo.no')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.ranks} aria-hidden="true">
              {rankLabels.map((rk) => (
                <span key={rk}>{rk}</span>
              ))}
            </div>
          </div>
        </div>
        {hand(perspective)}
        <ol
          ref={listRef}
          className={styles.moves}
          aria-label={t('moves.label')}
          data-testid="move-list"
        >
          {state.notation.length === 0 && <li className={styles.empty}>{t('moves.none')}</li>}
          {state.notation.map((n, i) => (
            <li key={i} data-current={i === state.notation.length - 1}>
              <span className={styles.moveNo}>{i + 1}.</span>
              <span className={styles.mark} aria-hidden="true">
                {i % 2 === 0 ? '☗' : '☖'}
              </span>
              {n}
            </li>
          ))}
        </ol>
      </div>
    );
  };
}

/** Seat icon: a filled (Sente) or outlined (Gote) piece wedge. */
export function ShogiSeatIcon({ seat, size }: { seat: 0 | 1; size: number }) {
  return (
    <svg width={size + 2} height={size + 2} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 6 L80 18 L90 96 L10 96 L20 18 Z"
        fill={seat === 0 ? '#2a1d12' : '#f7e9cc'}
        stroke={seat === 0 ? '#f7e9cc' : '#2a1d12'}
        strokeWidth="7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
