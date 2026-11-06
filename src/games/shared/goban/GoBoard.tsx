import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { moveCursor } from '../../../core/game-engine/grid';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import styles from './GoBoard.module.css';

export type Stone = 0 | 1 | 2;
export type PointMark = 'forbidden' | 'capture' | 'territory-black' | 'territory-white';

const U = 40;
const M = 1;

/** Go-style column letters (no I) and row numbers counted from the bottom. */
export const columnLetter = (c: number) => 'ABCDEFGHJKLMNOPQRSTUVWXYZ'[c] ?? '?';
export const pointName = (i: number, size: number) =>
  `${columnLetter(i % size)}${size - Math.floor(i / size)}`;

export function starPoints(size: number): number[] {
  const edge = size >= 13 ? 3 : 2;
  const far = size - 1 - edge;
  const mid = Math.floor(size / 2);
  const coords = size >= 15 ? [edge, mid, far] : size >= 9 ? [edge, far] : [];
  const pts: number[] = [];
  for (const r of coords) for (const c of coords) pts.push(r * size + c);
  if (size % 2 === 1 && size >= 9 && !pts.includes(mid * size + mid)) pts.push(mid * size + mid);
  return pts;
}

export interface GoBoardProps {
  size: number;
  stones: readonly Stone[];
  lastMove: number | null;
  winLine?: readonly number[] | null;
  hint?: number | null;
  /** Stone color previewed under the pointer; null when the human cannot move. */
  ghost: Stone | null;
  marks?: ReadonlyMap<number, PointMark>;
  animate: boolean;
  label: string;
  pointLabel: (index: number, stone: Stone) => string;
  /** Shown on touch devices after the first tap: "Tap again to place". */
  confirmText: string;
  onPoint: (index: number) => void;
  /** Called for points the board refuses before onPoint (e.g. occupied) — for feedback sounds. */
  isPlayable?: (index: number) => boolean;
}

export function GoBoard(props: GoBoardProps) {
  const {
    size,
    stones,
    lastMove,
    winLine,
    hint,
    ghost,
    marks,
    animate,
    label,
    pointLabel,
    confirmText,
    onPoint,
    isPlayable,
  } = props;
  const center = Math.floor(size / 2) * size + Math.floor(size / 2);
  const [cursor, setCursor] = useState(center);
  const [focusToken, setFocusToken] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const touchRef = useRef(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = (size - 1 + 2 * M) * U;
  const pos = (i: number) => [(M + (i % size)) * U, (M + Math.floor(i / size)) * U] as const;

  useEffect(() => {
    if (focusToken > 0) refs.current[cursor]?.focus();
  }, [focusToken, cursor]);

  useKeyboard((e) => {
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => moveCursor(c, dir, { rows: size, cols: size }));
      setFocusToken((n) => n + 1);
      return true;
    }
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
      onPoint(cursor);
      return true;
    }
    return false;
  });

  const press = (i: number) => {
    setCursor(i);
    if (touchRef.current && ghost !== null && (isPlayable?.(i) ?? stones[i] === 0)) {
      if (pending !== i) {
        setPending(i);
        return;
      }
    }
    setPending(null);
    onPoint(i);
  };

  const winSet = new Set(winLine ?? []);
  const shownGhost = ghost !== null && pending !== null && stones[pending] === 0 ? pending : null;
  let winSegment: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (winLine && winLine.length >= 2) {
    const [x1, y1] = pos(winLine[0]!);
    const [x2, y2] = pos(winLine[winLine.length - 1]!);
    winSegment = { x1, y1, x2, y2 };
  }

  return (
    <div
      className={`${styles.wrap} ${animate ? styles.animated : ''}`}
      style={{ '--size': size } as CSSProperties}
      data-testid="go-board"
      onPointerDown={(e) => {
        touchRef.current = e.pointerType === 'touch';
      }}
    >
      <svg className={styles.svg} viewBox={`0 0 ${total} ${total}`} aria-hidden="true">
        <defs>
          <radialGradient id="stone-black" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#5a5f6e" />
            <stop offset="0.55" stopColor="#1b1d24" />
            <stop offset="1" stopColor="#050608" />
          </radialGradient>
          <radialGradient id="stone-white" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.7" stopColor="#e7e9f0" />
            <stop offset="1" stopColor="#b9bdc9" />
          </radialGradient>
        </defs>
        <rect width={total} height={total} rx={U * 0.4} className={styles.wood} />
        <g className={styles.grid}>
          {Array.from({ length: size }, (_, k) => (
            <g key={k}>
              <line x1={M * U} y1={(M + k) * U} x2={(M + size - 1) * U} y2={(M + k) * U} />
              <line x1={(M + k) * U} y1={M * U} x2={(M + k) * U} y2={(M + size - 1) * U} />
            </g>
          ))}
        </g>
        {starPoints(size).map((i) => {
          const [x, y] = pos(i);
          return <circle key={i} cx={x} cy={y} r={U * 0.1} className={styles.star} />;
        })}
        <g className={styles.coords}>
          {Array.from({ length: size }, (_, k) => (
            <g key={k}>
              <text x={(M + k) * U} y={U * 0.45}>
                {columnLetter(k)}
              </text>
              <text x={U * 0.42} y={(M + k) * U + U * 0.14}>
                {size - k}
              </text>
            </g>
          ))}
        </g>
        {marks &&
          [...marks.entries()].map(([i, mark]) => {
            const [x, y] = pos(i);
            if (mark === 'forbidden') {
              return (
                <g key={`m${i}`} className={styles.forbidden}>
                  <line x1={x - U * 0.18} y1={y - U * 0.18} x2={x + U * 0.18} y2={y + U * 0.18} />
                  <line x1={x + U * 0.18} y1={y - U * 0.18} x2={x - U * 0.18} y2={y + U * 0.18} />
                </g>
              );
            }
            if (mark === 'capture')
              return (
                <circle key={`m${i}`} cx={x} cy={y} r={U * 0.44} className={styles.captureMark} />
              );
            return (
              <rect
                key={`m${i}`}
                x={x - U * 0.14}
                y={y - U * 0.14}
                width={U * 0.28}
                height={U * 0.28}
                className={mark === 'territory-black' ? styles.terrBlack : styles.terrWhite}
              />
            );
          })}
        {stones.map((stone, i) => {
          if (!stone) return null;
          const [x, y] = pos(i);
          const dim = winLine && winLine.length > 0 && !winSet.has(i);
          return (
            <g
              key={`${i}-${stone}`}
              className={`${styles.stone} ${i === lastMove && animate ? styles.placed : ''} ${dim ? styles.dim : ''}`}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <circle cx={x + U * 0.04} cy={y + U * 0.06} r={U * 0.46} className={styles.shadow} />
              <circle
                cx={x}
                cy={y}
                r={U * 0.46}
                fill={stone === 1 ? 'url(#stone-black)' : 'url(#stone-white)'}
              />
              {i === lastMove && (
                <circle
                  cx={x}
                  cy={y}
                  r={U * 0.14}
                  className={stone === 1 ? styles.lastOnBlack : styles.lastOnWhite}
                />
              )}
            </g>
          );
        })}
        {shownGhost !== null &&
          (() => {
            const [x, y] = pos(shownGhost);
            return (
              <circle
                cx={x}
                cy={y}
                r={U * 0.44}
                className={ghost === 1 ? styles.ghostBlack : styles.ghostWhite}
              />
            );
          })()}
        {hint !== null &&
          hint !== undefined &&
          (() => {
            const [x, y] = pos(hint);
            return <circle cx={x} cy={y} r={U * 0.38} className={styles.hint} />;
          })()}
        {winSegment && <line {...winSegment} className={styles.winLine} />}
      </svg>
      <div className={styles.points} role="grid" aria-label={label}>
        {Array.from({ length: size }, (_, r) => (
          <div key={r} role="row" className={styles.row}>
            {Array.from({ length: size }, (_, c) => {
              const i = r * size + c;
              const stone = stones[i] ?? 0;
              return (
                <button
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="button"
                  role="gridcell"
                  className={`${styles.point} ${ghost !== null && stone === 0 ? (ghost === 1 ? styles.hoverBlack : styles.hoverWhite) : ''}`}
                  data-point={i}
                  tabIndex={i === cursor ? 0 : -1}
                  aria-label={pointLabel(i, stone)}
                  aria-disabled={ghost === null || stone !== 0}
                  onClick={() => press(i)}
                  onFocus={() => setCursor(i)}
                />
              );
            })}
          </div>
        ))}
      </div>
      {pending !== null && ghost !== null && <p className={styles.confirm}>{confirmText}</p>}
    </div>
  );
}
