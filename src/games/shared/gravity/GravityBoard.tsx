import { useState, type CSSProperties } from 'react';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import type { Seat } from '../two-player/match';
import { lastDropIndex, landingIndex, type GravityRules, type GravityState } from './engine';
import styles from './GravityBoard.module.css';

const UNIT = 100;

/** Disc glyph used on the board and as the shell's seat icon. */
export function DiscIcon({ seat, size }: { seat: Seat; size: number }) {
  return (
    <svg width={size + 4} height={size + 4} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" className={seat === 0 ? styles.disc0 : styles.disc1} />
      <circle cx="50" cy="50" r="27" className={seat === 0 ? styles.inner0 : styles.inner1} />
    </svg>
  );
}

/** Creates the board component for a gravity ruleset (columns are the actions). */
export function createGravityBoard(rules: GravityRules) {
  const { rows, cols } = rules;
  const width = cols * UNIT;
  const height = rows * UNIT;
  return function GravityBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
  }: BoardProps<GravityState, number>) {
    const [cursor, setCursor] = useState(Math.floor(cols / 2));
    const [hover, setHover] = useState<number | null>(null);
    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir === 'left' || dir === 'right') {
        setCursor((c) => Math.min(cols - 1, Math.max(0, c + (dir === 'left' ? -1 : 1))));
        setHover(null);
        return true;
      }
      if (
        dir === 'down' ||
        ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement))
      ) {
        onAction(cursor);
        return true;
      }
      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= cols) {
        setCursor(digit - 1);
        onAction(digit - 1);
        return true;
      }
      return false;
    });

    const result = state.result;
    const winSet = new Set(result?.kind === 'win' ? result.line : []);
    const last = lastDropIndex(rules, state);
    const previewCol = hover ?? cursor;
    const previewSeat = state.toMove;
    const previewTarget = interactive ? landingIndex(rules, state, previewCol) : -1;

    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        style={{ '--cols': cols, '--rows': rows } as CSSProperties}
        data-testid="gravity-board"
      >
        <div className={styles.previewRow} aria-hidden="true">
          {interactive && previewTarget >= 0 && (
            <span
              className={styles.preview}
              style={{ left: `${((previewCol + 0.5) / cols) * 100}%` }}
            >
              <DiscIcon seat={previewSeat} size={40} />
            </span>
          )}
        </div>
        <div className={styles.frameBox}>
          <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <defs>
              <linearGradient id={`frame-${cols}x${rows}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className={styles.frameTop} />
                <stop offset="1" className={styles.frameBottom} />
              </linearGradient>
              <mask id={`holes-${cols}x${rows}`}>
                <rect width={width} height={height} fill="white" />
                {Array.from({ length: rows * cols }, (_, i) => (
                  <circle
                    key={i}
                    cx={(i % cols) * UNIT + UNIT / 2}
                    cy={Math.floor(i / cols) * UNIT + UNIT / 2}
                    r={UNIT * 0.4}
                    fill="black"
                  />
                ))}
              </mask>
            </defs>
            <rect width={width} height={height} className={styles.well} />
            {state.board.map((cell, i) => {
              if (!cell) return null;
              const row = Math.floor(i / cols);
              const col = i % cols;
              const seat = (cell - 1) as Seat;
              const isLast = i === last;
              return (
                <g
                  key={`${i}-${cell}`}
                  className={`${styles.discGroup} ${isLast && animate ? styles.falling : ''} ${result?.kind === 'win' && !winSet.has(i) ? styles.dim : ''}`}
                  style={{ '--fall': `${(row + 1) * UNIT + 40}px` } as CSSProperties}
                >
                  <circle
                    cx={col * UNIT + UNIT / 2}
                    cy={row * UNIT + UNIT / 2}
                    r={UNIT * 0.42}
                    className={seat === 0 ? styles.disc0 : styles.disc1}
                  />
                  <circle
                    cx={col * UNIT + UNIT / 2}
                    cy={row * UNIT + UNIT / 2}
                    r={UNIT * 0.26}
                    className={seat === 0 ? styles.inner0 : styles.inner1}
                  />
                  {winSet.has(i) && (
                    <circle
                      cx={col * UNIT + UNIT / 2}
                      cy={row * UNIT + UNIT / 2}
                      r={UNIT * 0.46}
                      className={styles.winRing}
                    />
                  )}
                  {isLast && !winSet.has(i) && (
                    <circle
                      cx={col * UNIT + UNIT / 2}
                      cy={row * UNIT + UNIT / 2}
                      r={UNIT * 0.08}
                      className={styles.lastDot}
                    />
                  )}
                </g>
              );
            })}
            {previewTarget >= 0 && (
              <circle
                cx={(previewTarget % cols) * UNIT + UNIT / 2}
                cy={Math.floor(previewTarget / cols) * UNIT + UNIT / 2}
                r={UNIT * 0.4}
                className={`${styles.target} ${previewSeat === 0 ? styles.target0 : styles.target1}`}
              />
            )}
            {hint !== null && landingIndex(rules, state, hint) >= 0 && (
              <circle
                cx={hint * UNIT + UNIT / 2}
                cy={Math.floor(landingIndex(rules, state, hint) / cols) * UNIT + UNIT / 2}
                r={UNIT * 0.36}
                className={styles.hint}
              />
            )}
            <rect
              width={width}
              height={height}
              rx={UNIT * 0.18}
              className={styles.frame}
              fill={`url(#frame-${cols}x${rows})`}
              mask={`url(#holes-${cols}x${rows})`}
            />
          </svg>
          <div className={styles.columns} role="group" aria-label={t('board.label')}>
            {Array.from({ length: cols }, (_, col) => {
              const free = rows - state.heights[col]!;
              return (
                <button
                  key={col}
                  type="button"
                  className={`${styles.column} ${col === cursor ? styles.cursor : ''}`}
                  data-column={col}
                  aria-label={t(free ? 'column.label' : 'column.full', { n: col + 1, free })}
                  aria-disabled={!interactive || free === 0}
                  tabIndex={col === cursor ? 0 : -1}
                  onClick={() => {
                    setCursor(col);
                    onAction(col);
                  }}
                  onMouseEnter={() => setHover(col)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setCursor(col)}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };
}
