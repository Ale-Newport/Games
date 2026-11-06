import { useState } from 'react';
import { useKeyboard } from '../../core/input/keyboard';
import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { legalKaylesActions, type KaylesState } from './engine';
import styles from './KaylesBoard.module.css';

/** Original pin art: a slim skittle with two stripes. */
function Pin({ down }: { down: boolean }) {
  return (
    <svg viewBox="0 0 20 60" className={styles.pinSvg} aria-hidden="true">
      <g className={down ? styles.fallen : undefined}>
        <path
          d="M10 2 C13.5 2 14.5 6 13.2 10 C12.5 12.5 12 14 13.5 18 C17 27 17 40 14.5 52 C14 55 12 57 10 57 C8 57 6 55 5.5 52 C3 40 3 27 6.5 18 C8 14 7.5 12.5 6.8 10 C5.5 6 6.5 2 10 2 Z"
          fill="#f7f3ea"
          stroke="#9b8f7a"
          strokeWidth="1"
        />
        <rect x="6.2" y="14" width="7.6" height="2.2" fill="#d6453a" />
        <rect x="6.6" y="17.6" width="6.8" height="1.6" fill="#d6453a" />
      </g>
    </svg>
  );
}

export function KaylesBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<KaylesState, string>) {
  const n = state.pins.length;
  const [pick, setPick] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [turn, setTurn] = useState(state.history.length);
  if (turn !== state.history.length) {
    setTurn(state.history.length);
    setPick([]);
  }
  const legal = new Set(interactive ? legalKaylesActions(state) : []);
  const actionOf = (p: number[]) => p.join('-');
  const hinted = hint ? hint.split('-').map(Number) : [];
  const last = state.history[state.history.length - 1]?.split('-').map(Number) ?? [];

  const click = (i: number) => {
    if (!interactive || !state.pins[i]) return;
    if (pick.includes(i)) {
      setPick([]);
      return onAction(actionOf(pick));
    }
    if (pick.length === 1 && Math.abs(pick[0]! - i) === 1) {
      const pair = [Math.min(i, pick[0]!), Math.max(i, pick[0]!)];
      if (legal.has(actionOf(pair))) return setPick(pair);
    }
    setPick([i]);
  };
  useKeyboard((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setCursor((c) => (c + (e.key === 'ArrowRight' ? 1 : -1) + n) % n);
      return true;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      click(cursor);
      return true;
    }
    if (e.key === 'Escape' && pick.length) {
      setPick([]);
      return true;
    }
    return false;
  });
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="kayles-board">
      <div
        className={styles.lane}
        role="group"
        aria-label={t('board.label')}
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      >
        {state.pins.map((up, i) => {
          const classes = [
            styles.slot,
            up && interactive && styles.can,
            pick.includes(i) && styles.picked,
            hinted.includes(i) && styles.hint,
            cursor === i && styles.cursor,
            !up && last.includes(i) && styles.justDown,
          ];
          return (
            <button
              key={i}
              type="button"
              className={classes.filter(Boolean).join(' ')}
              data-pin={i}
              aria-label={t(up ? 'pin.up' : 'pin.down', { n: i + 1 })}
              aria-pressed={pick.includes(i)}
              aria-disabled={!up || !interactive}
              onClick={() => {
                setCursor(i);
                click(i);
              }}
            >
              <Pin down={!up} />
            </button>
          );
        })}
      </div>
      <div className={styles.actions}>
        {pick.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            data-testid="knock"
            onClick={() => {
              setPick([]);
              onAction(actionOf(pick));
            }}
          >
            {t(pick.length === 1 ? 'action.knock1' : 'action.knock2')}
          </button>
        )}
        {pick.length === 1 && <span className={styles.tip}>{t('info.pair')}</span>}
      </div>
    </div>
  );
}
