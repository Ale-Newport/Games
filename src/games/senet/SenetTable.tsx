/**
 * The Senet table: a menu (opponent, new game, resume, watch the AI), the 30-square board in three
 * rows travelled in an S with the houses of the last row marked, the four throw sticks, borne-off
 * pieces for both sides, pieces that can move marked after a throw (tap one to move it), hints from
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
import { HAPPINESS, OFF, PIECES, WATER, cellOf, extraThrow, type Side } from './engine';
import { act, isValidSenet, movesOf, newSenet, rollOf, type SenetGame } from './match';
import { STRINGS } from './i18n';
import { bestMove } from './search';
import { SENET_SOUNDS } from './sounds';
import styles from './Senet.module.css';

type Opponent = 'easy' | 'hard' | 'two';
type Mode = 'menu' | 'play' | 'watch';
const OPPONENTS: Opponent[] = ['easy', 'hard', 'two'];

interface Saved {
  state: SenetGame;
  opponent: Opponent;
}

const U = 50;
/** Marks of the last five squares: the houses of Happiness, Water, Three Truths, Re-Atoum and Ra. */
const HOUSES: Record<number, string> = { 26: '☥', 27: '≈', 28: 'III', 29: 'II', 30: 'I' };

export function SenetTable({ services }: { services: GameServices }) {
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
          isValidSenet((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [opponent, setOpponent] = useState<Opponent>('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SenetGame | null>(null);
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

  const start = (g: SenetGame, m: Mode, o: Opponent) => {
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
      () => start(newSenet(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard'),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: SenetGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setState(next);
    if (action === 'throw') {
      svc.playSound(SENET_SOUNDS.throw);
      setMessage('');
    } else if (action.startsWith('move:')) {
      const m = movesOf(before).find((x) => `move:${x.from}` === action)!;
      svc.playSound(
        m.swap ? SENET_SOUNDS.capture : m.landed === WATER ? SENET_SOUNDS.water : SENET_SOUNDS.move,
      );
      setMessage(
        m.landed === WATER
          ? say('water', before.turn, { to: m.to })
          : m.swap
            ? say('swapped', before.turn)
            : extraThrow(rollOf(before)) && next.phase !== 'over'
              ? say('again', before.turn)
              : '',
      );
    } else if (action === 'pass') setMessage(say('blocked', before.turn));
    if (next.phase === 'over' && next.winner !== null) {
      setMessage(say('won', next.winner));
      if (mode === 'play') {
        if (opponent !== 'two') {
          const won = next.winner === 0;
          svc.playSound(won ? SENET_SOUNDS.win : SENET_SOUNDS.lose);
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score: next.pos.off[0] - next.pos.off[1],
            mode: opponent,
          });
          if (won) {
            svc.unlockAchievement('first');
            if (opponent === 'hard') svc.unlockAchievement('hard');
            if (next.pos.off[1] === 0) svc.unlockAchievement('shutout');
            if (next.captures[0] >= 3) svc.unlockAchievement('swapper');
          }
        } else svc.playSound(SENET_SOUNDS.win);
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
    servicesRef.current.playSound(SENET_SOUNDS.hint);
    const m = bestMove(g.pos, g.turn, rollOf(g), 2)!;
    setHint(m.from);
    setMessage(t(m.to === OFF ? 'hint.off' : 'hint.move', { from: m.from, to: m.landed }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if ((k === 't' || k === ' ') && g.phase === 'throw') doAction('throw');
    else if (k === 'h') showHint();
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
      <div className={shared.menu} data-testid="sn-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.opponent)}
              data-testid="sn-resume"
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
                  data-testid={`sn-opp-${o}`}
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
              onClick={() => start(newSenet(fixedSeed ?? randomSeed() >>> 0), 'play', opponent)}
              data-testid="sn-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newSenet(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard')}
              data-testid="sn-watch"
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
  const piece = (sq: number) => {
    const side = (g.pos.board[sq]! - 1) as Side;
    const [c, r] = cellOf(sq);
    const movable = side === g.turn && canMove(sq);
    const cx = c * U + U / 2;
    const cy = r * U + U / 2;
    return (
      <g
        key={`p${sq}`}
        role={movable ? 'button' : undefined}
        tabIndex={movable ? 0 : undefined}
        aria-label={t(`label.piece.${side}`, { sq })}
        data-piece={`${side}:${sq}`}
        data-movable={movable || undefined}
        className={[
          styles.piece,
          movable ? styles.movable : '',
          hint === sq ? styles.pointed : '',
        ].join(' ')}
        onClick={() => movable && doAction(`move:${sq}`)}
        onKeyDown={onKey(sq)}
      >
        {side === 0 ? (
          // Light pieces are cones, dark pieces are spools, as on the old boards.
          <polygon
            points={`${cx},${cy - U * 0.36} ${cx + U * 0.3},${cy + U * 0.32} ${cx - U * 0.3},${cy + U * 0.32}`}
            className={styles.light}
          />
        ) : (
          <path
            d={`M${cx - U * 0.28},${cy - U * 0.32} h${U * 0.56} l${-U * 0.16},${U * 0.32} l${U * 0.16},${U * 0.32} h${-U * 0.56} l${U * 0.16},${-U * 0.32} z`}
            className={styles.dark}
          />
        )}
      </g>
    );
  };
  const tray = (side: Side) => (
    <div
      className={styles.tray}
      aria-label={t('label.off', { side: name(side), n: g.pos.off[side] })}
      data-tray={side}
    >
      <span className={styles.trayLabel}>{t(side === 0 ? 'off.light' : 'off.dark')}</span>
      <span className={styles.trayDots}>
        {Array.from({ length: PIECES }, (_, i) => (
          <span
            key={i}
            className={[
              styles.dot,
              i < g.pos.off[side] ? (side === 0 ? styles.light : styles.dark) : styles.empty,
            ].join(' ')}
          />
        ))}
      </span>
    </div>
  );

  return (
    <div className={shared.play} data-testid="senet">
      <div className={styles.side}>
        {tray(1)}
        {tray(0)}
      </div>
      <svg
        viewBox={`0 0 ${10 * U} ${3 * U}`}
        className={styles.board}
        role="group"
        aria-label={t('board')}
        data-testid="sn-board"
      >
        {Array.from({ length: 30 }, (_, i) => i + 1).map((sq) => {
          const [c, r] = cellOf(sq);
          return (
            <g key={`s${sq}`}>
              <rect
                x={c * U + 2}
                y={r * U + 2}
                width={U - 4}
                height={U - 4}
                rx={5}
                className={[
                  styles.square,
                  sq >= HAPPINESS ? styles.house : '',
                  sq === 15 ? styles.rebirth : '',
                ].join(' ')}
              />
              {HOUSES[sq] && (
                <text
                  x={c * U + U / 2}
                  y={r * U + U / 2 + 6}
                  textAnchor="middle"
                  className={styles.glyph}
                >
                  {HOUSES[sq]}
                </text>
              )}
              <text x={c * U + 6} y={r * U + 13} className={styles.num}>
                {sq}
              </text>
            </g>
          );
        })}
        {Array.from({ length: 30 }, (_, i) => i + 1)
          .filter((sq) => g.pos.board[sq])
          .map((sq) => piece(sq))}
      </svg>
      <div
        className={styles.diceRow}
        data-testid="sn-dice"
        aria-label={t('dice', { n: rollOf(g) })}
      >
        {(g.dice ?? [false, false, false, false]).map((up, i) => (
          <svg
            key={i}
            viewBox="0 0 16 60"
            className={[styles.stick, g.dice ? '' : styles.idle].join(' ')}
          >
            <rect
              x={2}
              y={2}
              width={12}
              height={56}
              rx={6}
              className={up ? styles.stickLight : styles.stickDark}
            />
          </svg>
        ))}
        <span className={styles.rollValue} data-testid="sn-roll">
          {g.dice ? rollOf(g) : ''}
        </span>
      </div>
      <p className={shared.message} data-testid="sn-message" aria-live="polite">
        {message ||
          (g.phase === 'throw'
            ? t(myTurn && opponent !== 'two' ? 'toThrow.you' : 'toThrow', { side: name(g.turn) })
            : g.phase === 'move'
              ? myTurn
                ? moves.length
                  ? t('pick')
                  : say('blocked', g.turn)
                : t('thinking', { side: name(g.turn) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn && g.phase === 'throw' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('throw')}
            data-testid="sn-throw"
          >
            <Dices size={16} /> {t('throw')}
          </button>
        )}
        {myTurn && g.phase === 'move' && moves.length > 0 && (
          <button type="button" className="btn" onClick={showHint} data-testid="sn-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(newSenet(randomSeed() >>> 0), mode, opponent)}
            data-testid="sn-again"
          >
            <Play size={16} /> {t('again2')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="sn-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
