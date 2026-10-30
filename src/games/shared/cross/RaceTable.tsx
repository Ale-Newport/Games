/**
 * The cross-board race table shared by Ludo, Parchís and Pachisi: a menu (number of players,
 * opponents' level or all human, new game, resume, watch the AI), the board, the die, tokens that
 * can move marked after a throw (tap one to move it), bonus moves, hints from the heuristic player,
 * and computer turns played with short pauses.
 */
import { Bot, Dices, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import shared from '../sudoku/SudokuGame.module.css';
import { COLOURS, CrossBoard } from './CrossBoard';
import { CROSS_STRINGS } from './i18n';
import { CROSS_SOUNDS } from './sounds';
import styles from './RaceTable.module.css';
import {
  act,
  currentMoves,
  isValidRace,
  newRace,
  partnerOf,
  type RaceGame,
  type RaceMove,
  type RaceState,
} from './race';

type Level = 'easy' | 'hard' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard', 'humans'];
const COUNTS = [2, 3, 4];

/** Colours in play for a number of players: opposite arms for two. */
export const seatsFor = (n: number) => (n === 2 ? [0, 2] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3]);

interface Saved {
  state: RaceState;
  level: Level;
}

export interface RaceTableProps {
  services: GameServices;
  game: RaceGame;
  /** Test id prefix. */
  prefix: string;
  /** Title, menu.subtitle and any game-specific overrides. */
  strings: Record<Locale, Dictionary>;
  /** The strong player's choice and the easy one's. */
  hardMove: (game: RaceGame, s: RaceState, moves: RaceMove[]) => RaceMove | null;
  easyMove: (moves: RaceMove[]) => RaceMove | null;
  /** Shows the throw (a die face, or something else such as cowries). */
  renderThrow?: (s: RaceState) => ReactNode;
}

export function RaceTable({
  services,
  game,
  prefix,
  strings,
  hardMove,
  easyMove,
  renderThrow,
}: RaceTableProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        { en: { ...CROSS_STRINGS.en, ...strings.en }, es: { ...CROSS_STRINGS.es, ...strings.es } },
        locale,
      ),
    [locale, strings],
  );
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          LEVELS.includes((d as Saved).level) &&
          isValidRace(game, (d as Saved).state, (seats) =>
            COUNTS.some((n) => JSON.stringify(seatsFor(n)) === JSON.stringify(seats)),
          ),
      }),
    [services, game],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('easy');
  const [count, setCount] = useState(4);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<RaceState | null>(null);
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

  const colourName = (seat: number, s: RaceState) => t(`colour.${s.seats[seat]}`);
  const human = (seat: number) => mode === 'play' && (level === 'humans' || seat === 0);
  const isYou = (seat: number) => mode === 'play' && level !== 'humans' && seat === 0;
  const say = (
    key: string,
    seat: number,
    s: RaceState,
    params: Record<string, string | number> = {},
  ) => t(isYou(seat) ? `${key}.you` : key, { side: colourName(seat, s), ...params });

  const start = (s: RaceState, m: Mode, lv: Level) => {
    setState(s);
    setMode(m);
    setLevel(lv);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: s, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) =>
    start(newRace(game, seatsFor(n), seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'hard', 4, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: RaceState, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setState(next);
    if (action === 'roll') {
      svc.playSound(CROSS_SOUNDS.roll);
      setMessage(
        next.phase === 'roll' && next.turn !== before.turn
          ? say('threeSixes', before.turn, before)
          : '',
      );
    } else if (action.startsWith('move:') || action.startsWith('bonus:')) {
      const m = currentMoves(game, before).find((x) => x.token === Number(action.split(':')[1]))!;
      svc.playSound(
        m.captured.length
          ? CROSS_SOUNDS.capture
          : m.to === game.last
            ? CROSS_SOUNDS.home
            : CROSS_SOUNDS.move,
      );
      setMessage(
        m.captured.length
          ? say('captured', before.turn, before, { other: colourName(m.captured[0]![0], before) })
          : m.to === game.last
            ? say('home', before.turn, before)
            : next.phase === 'bonus'
              ? say('bonus', before.turn, before, { n: next.bonus })
              : '',
      );
      if (next.phase === 'bonus' && m.captured.length)
        setMessage(
          say('capturedBonus', before.turn, before, {
            other: colourName(m.captured[0]![0], before),
            n: next.bonus,
          }),
        );
    } else if (action === 'pass') setMessage(say('noMove', before.turn, before));
    if (next.phase === 'over' && next.winner !== null) {
      const partner = partnerOf(game, next, next.winner);
      if (partner === null) setMessage(say('won', next.winner, next));
      else if (isYou(next.winner) || isYou(partner))
        setMessage(
          t('wonTeam.you', {
            partner: colourName(next.winner === 0 ? partner : next.winner, next),
          }),
        );
      else
        setMessage(
          t('wonTeam', { side: colourName(next.winner, next), partner: colourName(partner, next) }),
        );
      if (mode === 'play') {
        if (level !== 'humans') {
          const won = next.winner === 0 || partner === 0;
          svc.playSound(won ? CROSS_SOUNDS.win : CROSS_SOUNDS.lose);
          const home = next.tokens[0]!.filter((x) => x === game.last).length;
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score: home,
            mode: `${level}-${next.seats.length}`,
          });
          if (won) {
            svc.unlockAchievement('first');
            if (level === 'hard') svc.unlockAchievement('hard');
            if (next.seats.length === 4) svc.unlockAchievement('four');
            if (next.captures[0]! >= 3) svc.unlockAchievement('hunter');
          }
        } else svc.playSound(CROSS_SOUNDS.win);
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
  };

  const doAction = (a: string) => {
    const s = stateRef.current;
    if (s) commit(act(game, s, a), a);
  };

  const choose = (s: RaceState, strong: boolean): string => {
    if (s.phase === 'roll') return 'roll';
    const moves = currentMoves(game, s);
    const m = strong ? hardMove(game, s, moves) : easyMove(moves);
    return m ? `${s.phase === 'bonus' ? 'bonus' : 'move'}:${m.token}` : 'pass';
  };

  // Computer seats (all of them in watch mode) act after a pause; a throw with no move passes by itself.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over') return;
    if (human(state.turn)) {
      if (
        (state.phase === 'move' || state.phase === 'bonus') &&
        !currentMoves(game, state).length
      ) {
        const id = window.setTimeout(() => doAction('pass'), 1000);
        return () => window.clearTimeout(id);
      }
      return;
    }
    const id = window.setTimeout(
      () => {
        const s = stateRef.current;
        if (s) doAction(choose(s, mode === 'watch' ? s.turn % 2 === 0 : level === 'hard'));
      },
      state.phase === 'roll' ? 450 : 650,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const s = state;
  const myTurn = !!s && human(s.turn) && s.phase !== 'over';
  const moves = s && myTurn ? currentMoves(game, s) : [];

  const showHint = () => {
    if (!s || !myTurn || !moves.length) return;
    servicesRef.current.playSound(CROSS_SOUNDS.hint);
    const m = hardMove(game, s, moves)!;
    setHint(m.token);
    setMessage(t(m.from < 0 ? 'hint.out' : 'hint.move', { n: m.token + 1 }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !s || !myTurn) return false;
    const k = e.key.toLowerCase();
    if ((k === 'r' || k === ' ') && s.phase === 'roll') doAction('roll');
    else if (k === 'h') showHint();
    else if (/^[1-4]$/.test(k) && moves.some((m) => m.token === Number(k) - 1))
      doAction(`${s.phase === 'bonus' ? 'bonus' : 'move'}:${Number(k) - 1}`);
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'over') {
      const kept = { state: cur, level };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !s) {
    return (
      <div className={shared.menu} data-testid={`${prefix}-menu`}>
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid={`${prefix}-resume`}
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.level}`),
                    n: saved.state.seats.length,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.players')}</legend>
            <div className={shared.segmented}>
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                  data-testid={`${prefix}-count-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  aria-pressed={level === lv}
                  onClick={() => setLevel(lv)}
                  data-testid={`${prefix}-level-${lv}`}
                >
                  {t(`level.${lv}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', level, count, fixedSeed ?? randomSeed() >>> 0)}
              data-testid={`${prefix}-start`}
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 4, fixedSeed ?? randomSeed() >>> 0)}
              data-testid={`${prefix}-watch`}
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const movable = moves.map((m) => m.token);
  const colour = s.seats[s.turn]!;
  return (
    <div className={shared.play} data-testid={prefix}>
      <div className={styles.bar}>
        {s.seats.map((c, seat) => (
          <span
            key={c}
            className={[
              styles.chip,
              seat === s.turn && s.phase !== 'over' ? styles.current : '',
            ].join(' ')}
            style={{ ['--c' as string]: COLOURS[c] }}
            data-testid={`${prefix}-seat-${seat}`}
          >
            {colourName(seat, s)}
            {isYou(seat) ? ` (${t('you')})` : ''} ·{' '}
            {s.tokens[seat]!.filter((x) => x === game.last).length}/{game.rules.tokens}
          </span>
        ))}
      </div>
      <CrossBoard
        game={game}
        state={s}
        movable={movable}
        hint={hint}
        onToken={(token) => doAction(`${s.phase === 'bonus' ? 'bonus' : 'move'}:${token}`)}
        tokenLabel={(seat, token) => t('label.token', { side: colourName(seat, s), n: token + 1 })}
        ariaLabel={t('board')}
      />
      <div className={styles.dieRow} style={{ ['--c' as string]: COLOURS[colour] }}>
        {renderThrow ? (
          renderThrow(s)
        ) : (
          <span
            className={[styles.die, s.die ? '' : styles.idle].join(' ')}
            data-testid={`${prefix}-die`}
          >
            {s.phase === 'bonus' ? `+${s.bonus}` : (s.die ?? '·')}
          </span>
        )}
      </div>
      <p className={shared.message} data-testid={`${prefix}-message`} aria-live="polite">
        {message ||
          (s.phase === 'roll'
            ? myTurn
              ? say('toRoll', s.turn, s)
              : t('thinking', { side: colourName(s.turn, s) })
            : s.phase === 'move' || s.phase === 'bonus'
              ? myTurn
                ? moves.length
                  ? t(s.phase === 'bonus' ? 'pickBonus' : 'pick', { n: s.bonus })
                  : say('noMove', s.turn, s)
                : t('thinking', { side: colourName(s.turn, s) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn && s.phase === 'roll' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('roll')}
            data-testid={`${prefix}-roll`}
          >
            <Dices size={16} /> {t('roll')}
          </button>
        )}
        {myTurn && moves.length > 0 && (
          <button type="button" className="btn" onClick={showHint} data-testid={`${prefix}-hint`}>
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(s.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, s.seats.length, randomSeed() >>> 0)}
            data-testid={`${prefix}-again`}
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid={`${prefix}-menu-btn`}>
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
