import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { ARROW, EMPTY, N, cellName, parseMove, queenTargets, type AmazonsState } from './engine';
import styles from './AmazonsBoard.module.css';

/** Original piece art: a round shield with a three-pointed crown. */
export function AmazonPiece({ seat }: { seat: 0 | 1 }) {
  return (
    <g>
      <circle r="0.4" className={seat === 0 ? styles.white : styles.black} />
      <path
        d="M-0.22 0.12 L-0.24 -0.16 L-0.11 -0.03 L0 -0.22 L0.11 -0.03 L0.24 -0.16 L0.22 0.12 Z"
        className={seat === 0 ? styles.crownW : styles.crownB}
      />
    </g>
  );
}

export function AmazonsBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
  perspective,
}: BoardProps<AmazonsState, string>) {
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [cursor, setCursor] = useState(55);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setFrom(null);
    setTo(null);
  }
  const me = state.toMove + 1;
  // The board as the player sees it mid-turn: the chosen amazon already standing on its new square.
  const board = state.board.slice();
  if (from !== null && to !== null) {
    board[from] = EMPTY;
    board[to] = me;
  }
  const movable = new Set<number>();
  if (interactive)
    state.board.forEach((x, c) => {
      if (x === me && queenTargets(state.board, c).length) movable.add(c);
    });
  const moves = new Set(
    interactive && from !== null && to === null ? queenTargets(board, from) : [],
  );
  const shots = new Set(interactive && to !== null ? queenTargets(board, to) : []);
  const last = state.history.length ? parseMove(state.history[state.history.length - 1]!) : null;
  const hinted = hint ? parseMove(hint) : null;
  const phase = !interactive ? null : to !== null ? 'shoot' : from !== null ? 'move' : 'pick';

  const reset = () => {
    setFrom(null);
    setTo(null);
  };
  const click = (c: number) => {
    if (!interactive) return;
    if (to !== null && from !== null) {
      if (shots.has(c)) {
        reset();
        return onAction(`${from}-${to}-${c}`);
      }
      if (c === to) return setTo(null);
      return movable.has(c) && c !== from ? (setFrom(c), setTo(null)) : undefined;
    }
    if (from !== null && moves.has(c)) return setTo(c);
    setFrom(movable.has(c) && c !== from ? c : null);
  };
  const flip = perspective === 1;
  useKeyboard((e) => {
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const d = delta[e.key];
    if (d) {
      const [dx, dy] = flip ? [-d[0], -d[1]] : d;
      setCursor((c) => {
        const x = (c % N) + dx;
        const y = Math.floor(c / N) + dy;
        return x < 0 || y < 0 || x >= N || y >= N ? c : y * N + x;
      });
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      click(cursor);
      return true;
    }
    if (e.key === 'Escape' && from !== null) {
      if (to !== null) setTo(null);
      else setFrom(null);
      return true;
    }
    return false;
  });
  const label = (c: number) => {
    const x = board[c]!;
    const what = x === EMPTY ? t('cell.empty') : x === ARROW ? t('cell.arrow') : t(`seat.${x - 1}`);
    const extra = moves.has(c) ? t('cell.move') : shots.has(c) ? t('cell.shoot') : '';
    return `${cellName(c)}, ${what}${extra ? `, ${extra}` : ''}`;
  };
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="amazons-board">
      <svg
        viewBox="-0.1 -0.1 10.2 10.2"
        className={styles.svg}
        role="grid"
        aria-label={t('board.label')}
      >
        <g transform={flip ? 'rotate(180 5 5)' : undefined}>
          {board.map((x, c) => {
            const px = c % N;
            const py = Math.floor(c / N);
            const lastHere = last && (last[0] === c || last[1] === c);
            return (
              <g key={c} transform={`translate(${px} ${py})`}>
                <rect
                  width="1"
                  height="1"
                  className={`${(px + py) % 2 ? styles.dark : styles.light} ${lastHere ? styles.last : ''}`}
                />
                {x === ARROW && (
                  <g className={last?.[2] === c ? styles.newArrow : undefined}>
                    <rect
                      x="0.08"
                      y="0.08"
                      width="0.84"
                      height="0.84"
                      rx="0.12"
                      className={styles.burn}
                    />
                    <path
                      d="M0.3 0.7 L0.7 0.3 M0.56 0.3 L0.7 0.3 L0.7 0.44"
                      className={styles.arrow}
                    />
                  </g>
                )}
                {hinted && hinted.includes(c) && (
                  <rect x="0.06" y="0.06" width="0.88" height="0.88" className={styles.hint} />
                )}
                {moves.has(c) && <circle cx="0.5" cy="0.5" r="0.14" className={styles.dot} />}
                {shots.has(c) && <circle cx="0.5" cy="0.5" r="0.14" className={styles.shot} />}
                {(x === 1 || x === 2) && (
                  <g
                    transform="translate(0.5 0.5)"
                    className={[
                      styles.piece,
                      movable.has(c) && to === null && styles.movable,
                      (from === c || to === c) && styles.selected,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <g transform={flip ? 'rotate(180)' : undefined}>
                      <AmazonPiece seat={(x - 1) as 0 | 1} />
                    </g>
                  </g>
                )}
                {from === c && to !== null && (
                  <circle cx="0.5" cy="0.5" r="0.3" className={styles.ghost} />
                )}
                {cursor === c && (
                  <rect x="0.04" y="0.04" width="0.92" height="0.92" className={styles.cursor} />
                )}
                <rect
                  width="1"
                  height="1"
                  className={styles.hit}
                  data-cell={c}
                  role="gridcell"
                  aria-label={label(c)}
                  onClick={() => {
                    setCursor(c);
                    click(c);
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      <div className={styles.bar}>
        {phase && (
          <span data-testid="amazons-phase" className={styles.phase}>
            {t(`phase.${phase}`)}
          </span>
        )}
        {from !== null && (
          <button type="button" className="btn" onClick={reset}>
            {t('action.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
