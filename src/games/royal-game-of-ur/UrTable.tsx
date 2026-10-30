/**
 * The Royal Game of Ur table: a menu (opponent, new game, resume, watch the AI), the 20-square
 * board in its historical shape (rosettes marked), the four pyramid dice, pieces waiting and borne
 * off for both sides, pieces that can move marked after a throw (tap one to move it), hints from
 * the search, and computer turns played with short pauses.
 */
import { Bot, Dices, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { chooseAction, type Strength } from './ai';
import { END, PIECES, type Side } from './engine';
import { act, isValidUr, movesOf, newUr, rollOf, type UrGame } from './match';
import { STRINGS } from './i18n';
import { bestMove } from './search';
import { UR_SOUNDS } from './sounds';
import styles from './Ur.module.css';

type Opponent = 'easy' | 'hard' | 'two';
type Mode = 'menu' | 'play' | 'watch';
const OPPONENTS: Opponent[] = ['easy', 'hard', 'two'];

interface Saved {
  state: UrGame;
  opponent: Opponent;
}

/** Grid cell (column 0–7, row 0 top / 1 middle / 2 bottom) of a side's square 1–14. */
export function cellOf(side: Side, sq: number): [number, number] {
  const row = side === 0 ? 2 : 0;
  if (sq <= 4) return [4 - sq, row];
  if (sq <= 12) return [sq - 5, 1];
  return [sq === 13 ? 7 : 6, row];
}

const U = 60;

export function UrTable({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          OPPONENTS.includes((d as Saved).opponent) &&
          isValidUr((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [opponent, setOpponent] = useState<Opponent>('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<UrGame | null>(null);
  const [hint, setHint] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const stateRef = useLatest(state);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.phase !== 'over') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const human = (side: Side) => mode === 'play' && (opponent === 'two' || side === 0);
  const strengthOf = (side: Side): Strength =>
    mode === 'watch'
      ? side === 0
        ? 'search'
        : 'greedy'
      : opponent === 'hard'
        ? 'search'
        : 'greedy';
  const isYou = (side: Side) => mode === 'play' && opponent !== 'two' && side === 0;
  /** A message about `side`: the player's own wording when it is the person against the computer. */
  const say = (key: string, side: Side, params: Record<string, string | number> = {}) =>
    t(isYou(side) ? `${key}.you` : key, { side: name(side), ...params });
  const name = (side: Side) =>
    opponent === 'two' || mode === 'watch'
      ? t(side === 0 ? 'side.light' : 'side.dark')
      : t(side === 0 ? 'side.you' : 'side.cpu');

  const start = (g: UrGame, m: Mode, o: Opponent) => {
    setState(g);
    setMode(m);
    setOpponent(o);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, opponent: o });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => start(newUr(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard'),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: UrGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setState(next);
    if (action === 'throw') {
      svc.playSound(UR_SOUNDS.throw);
      setMessage('');
    } else if (action.startsWith('move:')) {
      const m = movesOf(before).find((x) => `move:${x.from}` === action)!;
      svc.playSound(m.capture ? UR_SOUNDS.capture : m.rosette ? UR_SOUNDS.rosette : UR_SOUNDS.move);
      setMessage(
        m.capture
          ? say('captured', before.turn)
          : m.rosette && next.phase !== 'over'
            ? say('rosette', before.turn)
            : '',
      );
    } else if (action === 'pass') setMessage(say(rollOf(before) ? 'blocked' : 'zero', before.turn));
    if (next.phase === 'over' && next.winner !== null) {
      setMessage(say('won', next.winner));
      if (mode === 'play') {
        if (opponent !== 'two') {
          const won = next.winner === 0;
          svc.playSound(won ? UR_SOUNDS.win : UR_SOUNDS.lose);
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score: next.pos.off[0] - next.pos.off[1],
            mode: opponent,
          });
          if (won) {
            svc.unlockAchievement('first');
            if (opponent === 'hard') svc.unlockAchievement('hard');
            if (next.pos.off[1] === 0) svc.unlockAchievement('shutout');
            if (next.captures[0] >= 3) svc.unlockAchievement('raider');
          }
        } else svc.playSound(UR_SOUNDS.win);
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, opponent });
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // Computer seats (both in watch mode) act after a pause; a throw with no move passes by itself.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over') return;
    if (human(state.turn)) {
      if (state.phase === 'move' && !movesOf(state).length) {
        const id = window.setTimeout(() => doAction('pass'), 1100);
        return () => window.clearTimeout(id);
      }
      return;
    }
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (g) doAction(chooseAction(g, strengthOf(g.turn)));
      },
      state.phase === 'throw' ? 500 : 800,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && human(g.turn) && g.phase !== 'over';
  const moves = g && myTurn ? movesOf(g) : [];

  const showHint = () => {
    if (!g || !myTurn || g.phase !== 'move' || !moves.length) return;
    servicesRef.current.playSound(UR_SOUNDS.hint);
    const m = bestMove(g.pos, g.turn, rollOf(g), 3)!;
    setHint(m.from);
    setMessage(
      m.from === 0
        ? t('hint.enter', { to: m.to })
        : t(m.to === END ? 'hint.off' : 'hint.move', { from: m.from, to: m.to }),
    );
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if ((k === 't' || k === ' ') && g.phase === 'throw') doAction('throw');
    else if (k === 'h') showHint();
    else if (k === 'e' && moves.some((m) => m.from === 0)) doAction('move:0');
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'over') {
      const kept = { state: cur, opponent };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g) {
    return (
      <div className={shared.menu} data-testid="ur-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.opponent)}
              data-testid="ur-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    opponent: t(`opponent.${saved.opponent}`),
                    a: saved.state.pos.off[0],
                    b: saved.state.pos.off[1],
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.opponent')}</legend>
            <div className={shared.segmented}>
              {OPPONENTS.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={opponent === o}
                  onClick={() => setOpponent(o)}
                  data-testid={`ur-opp-${o}`}
                >
                  {t(`opponent.${o}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`opponent.${opponent}.hint`)}</p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(newUr(fixedSeed ?? randomSeed() >>> 0), 'play', opponent)}
              data-testid="ur-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newUr(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard')}
              data-testid="ur-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canMove = (from: number) => moves.some((m) => m.from === from);
  const onKey = (from: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (canMove(from)) doAction(`move:${from}`);
    }
  };
  const piece = (side: Side, sq: number) => {
    const [c, r] = cellOf(side, sq);
    const movable = side === g.turn && canMove(sq);
    return (
      <g
        key={`${side}-${sq}`}
        role={movable ? 'button' : undefined}
        tabIndex={movable ? 0 : undefined}
        aria-label={t(`label.piece.${side}`, { sq })}
        data-piece={`${side}:${sq}`}
        data-movable={movable || undefined}
        className={[
          styles.piece,
          movable ? styles.movable : '',
          hint === sq && side === g.turn ? styles.pointed : '',
        ].join(' ')}
        onClick={() => movable && doAction(`move:${sq}`)}
        onKeyDown={onKey(sq)}
      >
        <circle
          cx={c * U + U / 2}
          cy={r * U + U / 2}
          r={U * 0.34}
          className={side === 0 ? styles.light : styles.dark}
        />
        <circle cx={c * U + U / 2} cy={r * U + U / 2} r={U * 0.16} className={styles.pip} />
      </g>
    );
  };
  const squares: [number, number, boolean][] = [];
  for (let c = 0; c < 8; c++) {
    squares.push([c, 1, c === 3]);
    if (c < 4 || c > 5) {
      squares.push([c, 0, c === 0 || c === 6]);
      squares.push([c, 2, c === 0 || c === 6]);
    }
  }
  const tray = (side: Side, kind: 'waiting' | 'off') => {
    const n = kind === 'waiting' ? g.pos.waiting[side] : g.pos.off[side];
    const enter = kind === 'waiting' && side === g.turn && canMove(0);
    return (
      <div
        className={[styles.tray, enter ? styles.enter : ''].join(' ')}
        role={enter ? 'button' : undefined}
        tabIndex={enter ? 0 : undefined}
        aria-label={t(kind === 'waiting' ? 'label.waiting' : 'label.off', { side: name(side), n })}
        data-tray={`${side}:${kind}`}
        data-movable={enter || undefined}
        onClick={() => enter && doAction('move:0')}
        onKeyDown={onKey(0)}
      >
        <span className={styles.trayLabel}>{t(kind)}</span>
        <span className={styles.trayDots}>
          {Array.from({ length: PIECES }, (_, i) => (
            <span
              key={i}
              className={[
                styles.dot,
                i < n ? (side === 0 ? styles.light : styles.dark) : styles.empty,
              ].join(' ')}
            />
          ))}
        </span>
      </div>
    );
  };

  return (
    <div className={shared.play} data-testid="ur">
      <div className={styles.side}>
        {tray(1, 'waiting')}
        {tray(1, 'off')}
      </div>
      <svg
        viewBox={`0 0 ${8 * U} ${3 * U}`}
        className={styles.board}
        role="group"
        aria-label={t('board')}
        data-testid="ur-board"
      >
        {squares.map(([c, r, rosette]) => (
          <g key={`${c}-${r}`}>
            <rect
              x={c * U + 2}
              y={r * U + 2}
              width={U - 4}
              height={U - 4}
              rx={6}
              className={styles.square}
            />
            {rosette && (
              <g className={styles.rosette}>
                {[0, 45, 90, 135].map((a) => (
                  <ellipse
                    key={a}
                    cx={c * U + U / 2}
                    cy={r * U + U / 2}
                    rx={U * 0.36}
                    ry={U * 0.12}
                    transform={`rotate(${a} ${c * U + U / 2} ${r * U + U / 2})`}
                  />
                ))}
              </g>
            )}
            {!rosette && (
              <circle cx={c * U + U / 2} cy={r * U + U / 2} r={U * 0.08} className={styles.eye} />
            )}
          </g>
        ))}
        {([0, 1] as Side[]).flatMap((side) =>
          Array.from({ length: 14 }, (_, i) => i + 1)
            .filter((sq) => g.pos.board[side][sq])
            .map((sq) => piece(side, sq)),
        )}
      </svg>
      <div className={styles.side}>
        {tray(0, 'waiting')}
        {tray(0, 'off')}
      </div>
      <div
        className={styles.diceRow}
        data-testid="ur-dice"
        aria-label={t('dice', { n: rollOf(g) })}
      >
        {(g.dice ?? [false, false, false, false]).map((up, i) => (
          <svg
            key={i}
            viewBox="0 0 40 36"
            className={[styles.die, g.dice ? '' : styles.idle].join(' ')}
          >
            <polygon
              points="20,2 38,34 2,34"
              className={g.turn === 0 ? styles.dieLight : styles.dieDark}
            />
            {up && <circle cx={20} cy={8} r={4} className={styles.tip} />}
          </svg>
        ))}
        <span className={styles.rollValue} data-testid="ur-roll">
          {g.dice ? rollOf(g) : ''}
        </span>
      </div>
      <p className={shared.message} data-testid="ur-message" aria-live="polite">
        {message ||
          (g.phase === 'throw'
            ? t(myTurn && opponent !== 'two' ? 'toThrow.you' : 'toThrow', { side: name(g.turn) })
            : g.phase === 'move'
              ? myTurn
                ? moves.length
                  ? t('pick')
                  : say(rollOf(g) ? 'blocked' : 'zero', g.turn)
                : t('thinking', { side: name(g.turn) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn && g.phase === 'throw' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('throw')}
            data-testid="ur-throw"
          >
            <Dices size={16} /> {t('throw')}
          </button>
        )}
        {myTurn && g.phase === 'move' && moves.length > 0 && (
          <button type="button" className="btn" onClick={showHint} data-testid="ur-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(newUr(randomSeed() >>> 0), mode, opponent)}
            data-testid="ur-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="ur-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
