import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { Translator } from '../../../core/i18n';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { parseFen, squareName } from './fen';
import { moveAction, type ChessState, type ChessVariant } from './game';
import { PieceGlyph } from './ChessPieces';
import {
  EMPTY,
  FLAG_CASTLE,
  KING,
  PAWN,
  QUEEN,
  ROOK,
  BISHOP,
  KNIGHT,
  pieceColor,
  pieceType,
  type Color,
  type Move,
  type Position,
} from './position';
import styles from './ChessBoard.module.css';

const PROMO_ORDER = [QUEEN, ROOK, BISHOP, KNIGHT, KING];
const LETTER: Record<number, string> = { 1: 'p', 2: 'n', 3: 'b', 4: 'r', 5: 'q', 6: 'k' };
const POINTS = [0, 1, 3, 3, 5, 9, 0];

/** SAN with localized piece letters (e.g. Spanish C/A/T/D/R). */
export function localizeSan(san: string, t: Translator): string {
  return san.replace(/[KQRBN]/g, (ch) => t(`san.${ch}`));
}

/** Piece counts per color and type from a FEN placement. */
function countPieces(fen: string): number[][] {
  const counts = [new Array<number>(7).fill(0), new Array<number>(7).fill(0)];
  for (const ch of fen.split(' ')[0]!) {
    const type = Object.values(LETTER).indexOf(ch.toLowerCase()) + 1;
    if (type > 0) counts[ch === ch.toUpperCase() ? 0 : 1]![type]!++;
  }
  return counts;
}

/** Squares touched by an action string in `pos` (the position after it was played). */
function actionSquares(pos: Position, action: string | undefined, mover: Color): number[] {
  if (!action) return [];
  if (action === 'O-O' || action === 'O-O-O') {
    const { kingTo, rookTo } = pos.castleTargets(mover, action === 'O-O' ? 0 : 1);
    return [kingTo, rookTo];
  }
  const m = /^([a-z]\d+)([a-z]\d+)/.exec(action);
  if (!m) return [];
  const sq = (name: string) => pos.sq(name.charCodeAt(0) - 97, Number(name.slice(1)) - 1);
  return [sq(m[1]!), sq(m[2]!)];
}

export function createChessBoard(v: ChessVariant) {
  const W = v.rules.width;
  const H = v.rules.height;
  // King of the Hill: mark the four central goal squares.
  const hill = v.goal === 'king-of-the-hill';
  return function ChessBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
    perspective,
  }: BoardProps<ChessState, string>) {
    const pos = useMemo(() => parseFen(v.rules, state.fen), [state.fen]);
    const moves = useMemo(() => (interactive ? pos.legalMoves() : []), [pos, interactive]);
    const turn = state.history.length;
    const [selected, setSelected] = useState<number | null>(null);
    const [promotion, setPromotion] = useState<Move[] | null>(null);
    const [cursor, setCursor] = useState(() => (H - 2) * W + Math.floor(W / 2));
    const [focusToken, setFocusToken] = useState(0);
    const [drag, setDrag] = useState<{ from: number; x: number; y: number } | null>(null);
    const [lastTurn, setLastTurn] = useState(turn);
    const boardRef = useRef<HTMLDivElement>(null);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const pending = useRef<{ from: number; x: number; y: number; id: number } | null>(null);
    const suppressClick = useRef(false);
    const droppedTurn = useRef(-1);
    const listRef = useRef<HTMLOListElement>(null);
    if (lastTurn !== turn) {
      setLastTurn(turn);
      setSelected(null);
      setPromotion(null);
    }

    // UI cell u = row * W + col, row 0 at the top; the perspective seat sits at the bottom.
    const sqAt = (u: number) => {
      const col = u % W;
      const row = Math.floor(u / W);
      return pos.sq(perspective === 0 ? col : W - 1 - col, perspective === 0 ? H - 1 - row : row);
    };
    const uiOf = (sq: number) => {
      const f = pos.fileOf(sq);
      const r = pos.rankOf(sq);
      return (perspective === 0 ? H - 1 - r : r) * W + (perspective === 0 ? f : W - 1 - f);
    };

    /** Destination square → moves; castling is entered on the rook (or the king's target). */
    const targetsFrom = (from: number | null) => {
      const map = new Map<number, Move[]>();
      if (from === null) return map;
      const add = (sq: number, m: Move) => map.set(sq, [...(map.get(sq) ?? []), m]);
      const own = moves.filter((m) => m.from === from);
      for (const m of own) if (!(m.flags & FLAG_CASTLE)) add(m.to, m);
      for (const m of own) {
        if (!(m.flags & FLAG_CASTLE)) continue;
        const rook = pos.castle[pos.side * 2 + m.castleSide!]!;
        add(rook, m);
        if (m.to !== from && m.to !== rook && !map.has(m.to)) add(m.to, m);
      }
      return map;
    };
    const targets = targetsFrom(selected);
    const movable = new Set(moves.map((m) => m.from));

    const choose = (list: Move[], dropped = false) => {
      if (list.length > 1) {
        setPromotion(list);
        return;
      }
      if (dropped) droppedTurn.current = turn + 1;
      setSelected(null);
      onAction(moveAction(pos, list[0]!));
    };

    const click = (sq: number) => {
      if (suppressClick.current) return;
      setCursor(uiOf(sq));
      if (!interactive || promotion) return;
      const list = targets.get(sq);
      if (list) return choose(list);
      if (movable.has(sq)) return setSelected(sq === selected ? null : sq);
      if (selected !== null) return setSelected(null);
      const p = pos.board[sq]!;
      if (p > 0 && pieceColor(p) === pos.side) onAction(''); // a piece without moves: invalid
    };

    // Drag and drop (mouse, pen and touch). A press only becomes a drag after a few pixels.
    const cellAt = (x: number, y: number) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const col = Math.floor(((x - rect.left) / rect.width) * W);
      const row = Math.floor(((y - rect.top) / rect.height) * H);
      if (col < 0 || col >= W || row < 0 || row >= H) return null;
      return sqAt(row * W + col);
    };
    const latest = useRef({ targetsFrom, choose, cellAt });
    useEffect(() => {
      latest.current = { targetsFrom, choose, cellAt };
    });
    useEffect(() => {
      const move = (e: PointerEvent) => {
        const p = pending.current;
        if (!p || e.pointerId !== p.id) return;
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6 && !drag) return;
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;
        setSelected(p.from);
        setDrag({ from: p.from, x: e.clientX - rect.left, y: e.clientY - rect.top });
      };
      const up = (e: PointerEvent) => {
        const p = pending.current;
        if (!p || e.pointerId !== p.id) return;
        pending.current = null;
        if (!drag) return;
        setDrag(null);
        suppressClick.current = true;
        window.setTimeout(() => (suppressClick.current = false), 0);
        const { targetsFrom: tf, choose: ch, cellAt: at } = latest.current;
        const sq = at(e.clientX, e.clientY);
        const list = sq === null ? undefined : tf(p.from).get(sq);
        if (list) ch(list, true);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      return () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
    }, [drag]);

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
        setCursor((c) => moveCursor(c, dir, { rows: H, cols: W }));
        setFocusToken((k) => k + 1);
        return true;
      }
      if (e.key === 'Escape' && (promotion || selected !== null)) {
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

    const mover = (1 - pos.side) as Color;
    const lastAction = state.history[state.history.length - 1];
    const last = actionSquares(pos, lastAction, mover);
    const hinted = actionSquares(pos, hint ?? undefined, pos.side);
    const checked = !v.rules.antichess && pos.inCheck() ? pos.kings[pos.side] : -1;
    const slideFrom =
      animate && last.length === 2 && droppedTurn.current !== turn && !lastAction?.startsWith('O')
        ? last[0]!
        : -1;

    const start = countPieces(state.startFen);
    const now = countPieces(state.fen);
    const material = (c: Color) => now[c]!.reduce((sum, n, type) => sum + n * POINTS[type]!, 0);
    const lead = material(0) - material(1);
    const strip = (seat: Color) => {
      const victim = (1 - seat) as Color;
      const captured = [QUEEN, ROOK, BISHOP, KNIGHT, PAWN].flatMap((type) =>
        Array.from<number>({
          length: Math.max(0, start[victim]![type]! - now[victim]![type]!),
        }).fill(type),
      );
      const diff = seat === 0 ? lead : -lead;
      return (
        <div className={styles.strip} data-testid={`captured-${seat}`}>
          <span className="visually-hidden">
            {t('captured.label', { seat: t(`seat.${seat}`) })}
          </span>
          {captured.map((type, i) => (
            <PieceGlyph key={i} type={type} color={victim} className={styles.capturedPiece} />
          ))}
          {diff > 0 && <span className={styles.lead}>+{diff}</span>}
        </div>
      );
    };

    const pieceLabel = (p: number) => t(`pc.${pieceColor(p)}.${pieceType(p)}`);
    const startBlack = state.startFen.split(' ')[1] === 'b';
    const startNumber = Number(state.startFen.split(' ')[5] ?? 1) || 1;

    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        style={{ '--w': W, '--h': H } as CSSProperties}
        data-testid="chess-board"
      >
        {strip((1 - perspective) as Color)}
        <div className={styles.frame}>
          <div
            ref={boardRef}
            className={styles.board}
            role="grid"
            aria-label={t('board.label')}
            data-perspective={perspective}
          >
            {Array.from({ length: H }, (_, row) => (
              <div key={row} role="row" className={styles.row}>
                {Array.from({ length: W }, (_, col) => {
                  const u = row * W + col;
                  const sq = sqAt(u);
                  const p = pos.board[sq]!;
                  const file = pos.fileOf(sq);
                  const rank = pos.rankOf(sq);
                  const name = squareName(pos, sq);
                  const target = targets.get(sq);
                  const isCapture =
                    !!target &&
                    target.some((m) => m.captured !== EMPTY && !(m.flags & FLAG_CASTLE));
                  const dragging = drag?.from === sq;
                  const label = [
                    name,
                    p > 0 ? pieceLabel(p) : t('sq.empty'),
                    selected === sq ? t('sq.selected') : '',
                    target ? t(isCapture ? 'sq.capture' : 'sq.target') : '',
                    checked === sq ? t('sq.check') : '',
                  ]
                    .filter(Boolean)
                    .join(', ');
                  const slide = sq === last[1] && slideFrom >= 0;
                  const dx = slide ? (uiOf(slideFrom) % W) - col : 0;
                  const dy = slide ? Math.floor(uiOf(slideFrom) / W) - row : 0;
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
                        (file + rank) % 2 === 0 ? styles.dark : styles.light,
                        selected === sq ? styles.selected : '',
                        last.includes(sq) ? styles.last : '',
                        hinted.includes(sq) ? styles.hint : '',
                        checked === sq ? styles.check : '',
                        hill && (file === 3 || file === 4) && (rank === 3 || rank === 4)
                          ? styles.hill
                          : '',
                      ].join(' ')}
                      data-square={name}
                      tabIndex={u === cursor ? 0 : -1}
                      aria-label={label}
                      aria-disabled={!interactive || (!movable.has(sq) && !target)}
                      onClick={() => click(sq)}
                      onFocus={() => setCursor(u)}
                      onPointerDown={(e) => {
                        if (!interactive || !movable.has(sq) || promotion || e.button !== 0) return;
                        pending.current = { from: sq, x: e.clientX, y: e.clientY, id: e.pointerId };
                      }}
                    >
                      {col === 0 && <span className={styles.rankLabel}>{rank + 1}</span>}
                      {row === H - 1 && (
                        <span className={styles.fileLabel}>{'abcdefgh'[file]}</span>
                      )}
                      {p > 0 && (
                        <span
                          key={slide ? `slide-${turn}` : 'still'}
                          className={`${styles.piece} ${slide ? styles.slide : ''} ${dragging ? styles.lifted : ''}`}
                          style={slide ? ({ '--dx': dx, '--dy': dy } as CSSProperties) : undefined}
                        >
                          <PieceGlyph type={pieceType(p)} color={pieceColor(p)} />
                        </span>
                      )}
                      {target && <span className={isCapture ? styles.ring : styles.dot} />}
                    </button>
                  );
                })}
              </div>
            ))}
            {drag && pos.board[drag.from]! > 0 && (
              <span
                className={styles.ghost}
                style={{ left: drag.x, top: drag.y } as CSSProperties}
                aria-hidden="true"
              >
                <PieceGlyph
                  type={pieceType(pos.board[drag.from]!)}
                  color={pieceColor(pos.board[drag.from]!)}
                />
              </span>
            )}
            {promotion && (
              <div className={styles.promotion} role="dialog" aria-label={t('promo.title')}>
                <p>{t('promo.title')}</p>
                <div className={styles.promoChoices}>
                  {PROMO_ORDER.filter((type) => promotion.some((m) => m.promo === type)).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        className={styles.promoButton}
                        data-testid={`promo-${LETTER[type]}`}
                        aria-label={t(`pc.${pos.side}.${type}`)}
                        onClick={() => {
                          const m = promotion.find((x) => x.promo === type)!;
                          setPromotion(null);
                          choose([m]);
                        }}
                      >
                        <PieceGlyph type={type} color={pos.side} />
                      </button>
                    ),
                  )}
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => setPromotion(null)}>
                  {t('promo.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
        {strip(perspective)}
        <ol
          ref={listRef}
          className={styles.moves}
          aria-label={t('moves.label')}
          data-testid="move-list"
        >
          {state.san.length === 0 && <li className={styles.empty}>{t('moves.none')}</li>}
          {state.san.map((san, i) => {
            const ply = i + (startBlack ? 1 : 0);
            const number = startNumber + Math.floor(ply / 2);
            const white = ply % 2 === 0;
            return (
              <li key={i} data-current={i === state.san.length - 1}>
                {(white || i === 0) && (
                  <span className={styles.moveNo}>
                    {number}
                    {white ? '.' : '…'}
                  </span>
                )}
                {localizeSan(san, t)}
              </li>
            );
          })}
        </ol>
      </div>
    );
  };
}

/** Seat icon for menus and scoreboards: a king in each side's color. */
export function ChessSeatIcon({ seat, size }: { seat: 0 | 1; size: number }) {
  return (
    <span className={styles.seatIcon} data-seat={seat}>
      <PieceGlyph type={KING} color={seat} size={size + 4} />
    </span>
  );
}
