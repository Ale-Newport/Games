import { useState, type ComponentType } from 'react';
import { useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { legalMancalaActions, type MancalaState, type MancalaVariant } from './engine';
import styles from './MancalaBoard.module.css';

/** Seeds drawn as small pebbles in a loose ring (a number shows the exact count). */
function Seeds({ count }: { count: number }) {
  const shown = Math.min(count, 18);
  return (
    <span className={styles.seeds} aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => {
        const ring = i < 6 ? 0 : i < 12 ? 1 : 2;
        const k = i % 6;
        const angle = (k / 6) * Math.PI * 2 + ring * 0.5;
        const r = [18, 32, 8][ring]!;
        return (
          <span
            key={i}
            className={styles.seed}
            style={{
              left: `${50 + r * Math.cos(angle)}%`,
              top: `${50 + r * Math.sin(angle)}%`,
              filter: `hue-rotate(${(i * 47) % 360}deg)`,
            }}
          />
        );
      })}
    </span>
  );
}

export function createMancalaBoard(
  v: MancalaVariant,
): ComponentType<BoardProps<MancalaState, string>> {
  const n = v.pits;
  return function MancalaBoard({ state, interactive, hint, animate, t, onAction, perspective }) {
    const [cursor, setCursor] = useState(perspective * n);
    const legal = new Set(interactive ? legalMancalaActions(v, state) : []);
    const last = state.history[state.history.length - 1];
    const bottom = perspective;
    const top = (1 - perspective) as 0 | 1;
    // Bottom row left → right is the bottom player's pits in sowing order; the top row runs back.
    const bottomPits = Array.from({ length: n }, (_, i) => bottom * n + i);
    const topPits = Array.from({ length: n }, (_, i) => top * n + (n - 1 - i));
    const play = (p: number) => {
      if (legal.has(String(p))) onAction(String(p));
    };
    useKeyboard((e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const mine = state.toMove * n;
        setCursor((c) => {
          const i = Math.min(Math.max(c - mine, 0), n - 1);
          const step = (e.key === 'ArrowRight') === (state.toMove === bottom) ? 1 : -1;
          return mine + ((i + step + n) % n);
        });
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        play(cursor);
        return true;
      }
      return false;
    });
    const pit = (p: number) => {
      const can = legal.has(String(p));
      const classes = [
        styles.pit,
        can && styles.can,
        last === String(p) && styles.last,
        hint === String(p) && styles.hint,
        cursor === p && styles.cursor,
      ];
      return (
        <button
          key={p}
          type="button"
          className={classes.filter(Boolean).join(' ')}
          data-pit={p}
          aria-label={t('pit.label', {
            n: (p % n) + 1,
            seat: t(`seat.${p < n ? 0 : 1}`),
            seeds: state.pits[p]!,
          })}
          aria-disabled={!can}
          onClick={() => {
            setCursor(p);
            play(p);
          }}
        >
          <Seeds count={state.pits[p]!} />
          <span key={state.pits[p]} className={styles.count}>
            {state.pits[p]}
          </span>
        </button>
      );
    };
    const store = (seat: 0 | 1) => (
      <div
        className={styles.store}
        data-testid={`store-${seat}`}
        aria-label={t('store.label', { seat: t(`seat.${seat}`), seeds: state.stores[seat] })}
      >
        <Seeds count={state.stores[seat]} />
        <span className={styles.storeCount}>{state.stores[seat]}</span>
      </div>
    );
    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        data-testid="mancala-board"
      >
        <div
          className={styles.board}
          role="group"
          aria-label={t('board.label')}
          style={{ gridTemplateColumns: `1fr repeat(${n}, 1.15fr) 1fr` }}
        >
          <div className={styles.storeLeft}>{store(top)}</div>
          {topPits.map((p) => (
            <div key={p} className={styles.topRow}>
              {pit(p)}
            </div>
          ))}
          <div className={styles.storeRight}>{store(bottom)}</div>
          {bottomPits.map((p) => (
            <div key={p} className={styles.bottomRow}>
              {pit(p)}
            </div>
          ))}
        </div>
        {legal.has('swap') && (
          <button
            type="button"
            className="btn btn-primary"
            data-testid="swap"
            onClick={() => onAction('swap')}
          >
            {t('action.swap')}
          </button>
        )}
      </div>
    );
  };
}
