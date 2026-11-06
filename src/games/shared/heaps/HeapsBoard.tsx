import { useState, type ComponentType } from 'react';
import { useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { legalHeapsActions, type HeapsState, type HeapsVariant } from './engine';
import styles from './HeapsBoard.module.css';

export const heapLetter = (h: number) => 'ABCDE'[h]!;

interface Pick {
  heap: number;
  amount: number;
}

/** Board for one heap variant: rows of counters; tap to choose how many to take, then confirm. */
export function createHeapsBoard(v: HeapsVariant): ComponentType<BoardProps<HeapsState, string>> {
  return function HeapsBoard({ state, interactive, hint, animate, t, onAction }) {
    const [pick, setPick] = useState<Pick | null>(null);
    const [both, setBoth] = useState(false);
    const [cursor, setCursor] = useState({ heap: 0, index: 0 });
    const [turn, setTurn] = useState(state.history.length);
    if (turn !== state.history.length) {
      setTurn(state.history.length);
      setPick(null);
      setBoth(false);
    }
    const legal = new Set(interactive ? legalHeapsActions(v, state) : []);
    const actionOf = (p: Pick) => (both ? `b:${p.amount}` : `${p.heap}:${p.amount}`);
    const pickFor = (heap: number, index: number): Pick => ({
      heap,
      amount: state.heaps[heap]! - index,
    });
    const allowed = (p: Pick) => legal.has(actionOf(p));
    const chosen = (heap: number, index: number) => {
      if (!pick) return false;
      const fromEnd = state.heaps[heap]! - index;
      return (both || heap === pick.heap) && fromEnd <= pick.amount;
    };
    const hinted = (heap: number, index: number) => {
      if (!hint) return false;
      const [where, amount] = hint.split(':');
      const fromEnd = state.heaps[heap]! - index;
      return (where === 'b' || Number(where) === heap) && fromEnd <= Number(amount);
    };
    const last = state.history[state.history.length - 1];

    const choose = (heap: number, index: number) => {
      if (!interactive) return;
      const p = pickFor(heap, index);
      if (!allowed(p)) return;
      if (pick && pick.amount === p.amount && (both || pick.heap === p.heap)) {
        setPick(null);
        return onAction(actionOf(p));
      }
      setPick(p);
    };
    useKeyboard((e) => {
      const rows = state.heaps.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setCursor((c) => {
          const heap = (c.heap + (e.key === 'ArrowDown' ? 1 : -1) + rows) % rows;
          return { heap, index: Math.min(c.index, Math.max(0, state.heaps[heap]! - 1)) };
        });
        return true;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setCursor((c) => {
          const n = Math.max(1, state.heaps[c.heap]!);
          return { ...c, index: (c.index + (e.key === 'ArrowRight' ? 1 : -1) + n) % n };
        });
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (cursor.index < state.heaps[cursor.heap]!) choose(cursor.heap, cursor.index);
        return true;
      }
      if ((e.key === 'b' || e.key === 'B') && v.both) {
        setBoth((x) => !x);
        setPick(null);
        return true;
      }
      if (e.key === 'Escape' && pick) {
        setPick(null);
        return true;
      }
      return false;
    });

    const lastLabel = (h: number) => {
      if (!last) return null;
      const [where, amount] = last.split(':');
      return where === 'b' || Number(where) === h ? `−${amount}` : null;
    };
    return (
      <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="heaps-board">
        <div className={styles.heaps} role="group" aria-label={t('board.label')}>
          {state.heaps.map((n, h) => (
            <div
              key={h}
              className={styles.heap}
              data-testid={`heap-${h}`}
              role="group"
              aria-label={`${t('heap.name', { letter: heapLetter(h) })}: ${n}`}
            >
              <span className={styles.name} aria-hidden="true">
                <span className={styles.letter}>{heapLetter(h)}</span>
                <span className={styles.count}>{n}</span>
                {lastLabel(h) && (
                  <span key={state.history.length} className={styles.taken}>
                    {lastLabel(h)}
                  </span>
                )}
              </span>
              <div className={styles.counters}>
                {n === 0 && <span className={styles.empty}>{t('heap.empty')}</span>}
                {Array.from({ length: n }, (_, i) => {
                  const p = pickFor(h, i);
                  const can = interactive && allowed(p);
                  const classes = [
                    styles.counter,
                    can && styles.can,
                    chosen(h, i) && styles.chosen,
                    hinted(h, i) && styles.hint,
                    cursor.heap === h && cursor.index === i && styles.cursor,
                  ];
                  return (
                    <button
                      key={i}
                      type="button"
                      className={classes.filter(Boolean).join(' ')}
                      data-counter={`${h}-${i}`}
                      aria-label={t('counter.label', {
                        letter: heapLetter(h),
                        index: i + 1,
                        amount: p.amount,
                      })}
                      aria-disabled={!can}
                      onClick={() => {
                        setCursor({ heap: h, index: i });
                        choose(h, i);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.bar}>
          {v.both && (
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={both}
                disabled={!interactive}
                onChange={(e) => {
                  setBoth(e.target.checked);
                  setPick(null);
                }}
                data-testid="both"
              />
              {t('action.both')}
            </label>
          )}
          {pick && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPick(null);
                onAction(actionOf(pick));
              }}
              data-testid="take"
            >
              {both
                ? t('action.takeBoth', { amount: pick.amount })
                : t('action.take', { amount: pick.amount, letter: heapLetter(pick.heap) })}
            </button>
          )}
        </div>
      </div>
    );
  };
}
