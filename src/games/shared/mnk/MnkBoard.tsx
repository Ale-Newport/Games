import { useEffect, useRef, type CSSProperties } from 'react';
import type { Cell } from './engine';
import styles from './MnkBoard.module.css';

export interface MnkBoardProps {
  rows: number;
  cols: number;
  board: readonly Cell[];
  winLine: readonly number[] | null;
  /** Mark of the winning line (for its color). */
  winMark?: Cell;
  lastMove: number | null;
  cursor: number;
  /** Move keyboard focus to the cursor cell when this changes. */
  focusToken?: number;
  hint: number | null;
  /** Mark to preview on hover; null disables interaction. */
  ghost: Cell | null;
  animate: boolean;
  label: string;
  cellLabel: (index: number, cell: Cell) => string;
  onCell: (index: number) => void;
  onFocusCell: (index: number) => void;
}

function Mark({ cell, className }: { cell: Cell; className?: string }) {
  if (cell === 1) {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`${styles.mark} ${styles.x} ${className ?? ''}`}
        aria-hidden="true"
      >
        <path d="M28 28 L72 72" pathLength={1} />
        <path d="M72 28 L28 72" pathLength={1} className={styles.second} />
      </svg>
    );
  }
  if (cell === 2) {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`${styles.mark} ${styles.o} ${className ?? ''}`}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="23" pathLength={1} transform="rotate(-90 50 50)" />
      </svg>
    );
  }
  return null;
}

/** Accessible, animated board for m,n,k games (one button per cell, roving tabindex). */
export function MnkBoard(props: MnkBoardProps) {
  const {
    rows,
    cols,
    board,
    winLine,
    winMark,
    lastMove,
    cursor,
    focusToken,
    hint,
    ghost,
    animate,
    label,
    cellLabel,
    onCell,
    onFocusCell,
  } = props;
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (focusToken !== undefined && focusToken > 0) cellRefs.current[cursor]?.focus();
  }, [focusToken, cursor]);

  const unit = 100;
  const center = (i: number) =>
    [(i % cols) * unit + unit / 2, Math.floor(i / cols) * unit + unit / 2] as const;
  let winSegment: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (winLine && winLine.length >= 2) {
    const [ax, ay] = center(winLine[0]!);
    const [bx, by] = center(winLine[winLine.length - 1]!);
    const len = Math.hypot(bx - ax, by - ay);
    const ext = unit * 0.32;
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    winSegment = { x1: ax - ux * ext, y1: ay - uy * ext, x2: bx + ux * ext, y2: by + uy * ext };
  }

  return (
    <div
      className={`${styles.board} ${animate ? styles.animated : ''}`}
      style={{ '--rows': rows, '--cols': cols } as CSSProperties}
      role="grid"
      aria-label={label}
      data-testid="mnk-board"
    >
      <svg
        className={styles.grid}
        viewBox={`0 0 ${cols * unit} ${rows * unit}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={(i + 1) * unit}
            y1={unit * 0.12}
            x2={(i + 1) * unit}
            y2={rows * unit - unit * 0.12}
          />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={unit * 0.12}
            y1={(i + 1) * unit}
            x2={cols * unit - unit * 0.12}
            y2={(i + 1) * unit}
          />
        ))}
      </svg>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} role="row" className={styles.row}>
          {Array.from({ length: cols }, (_, c) => {
            const i = r * cols + c;
            const cell = board[i] ?? 0;
            const inWin = winLine?.includes(i) ?? false;
            return (
              <button
                key={i}
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                type="button"
                role="gridcell"
                className={`${styles.cell} ${inWin ? styles.win : ''} ${winLine && !inWin && cell ? styles.dim : ''} ${hint === i ? styles.hint : ''} ${lastMove === i ? styles.last : ''}`}
                tabIndex={i === cursor ? 0 : -1}
                aria-label={cellLabel(i, cell)}
                aria-disabled={cell !== 0 || ghost === null}
                data-cell={i}
                onClick={() => onCell(i)}
                onFocus={() => onFocusCell(i)}
              >
                {cell !== 0 ? (
                  <Mark
                    cell={cell}
                    className={animate && lastMove === i ? styles.draw : undefined}
                  />
                ) : (
                  ghost !== null && <Mark cell={ghost} className={styles.ghost} />
                )}
              </button>
            );
          })}
        </div>
      ))}
      {winSegment && (
        <svg
          className={styles.winOverlay}
          viewBox={`0 0 ${cols * unit} ${rows * unit}`}
          aria-hidden="true"
        >
          <line
            {...winSegment}
            pathLength={1}
            className={`${styles.winLine} ${winMark === 2 ? styles.o : styles.x}`}
          />
        </svg>
      )}
    </div>
  );
}
