/**
 * The Pig table: a menu (opponent, new game, resume, watch the AI), the two scores racing to 100,
 * the die and the turn total with roll and hold buttons, the chance of winning under best play
 * (from the solved game), hints from the optimal policy, and the computer's turns played with
 * short pauses.
 */
import { Bot, Dices, Hand, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  GOAL,
  act,
  holdAt20,
  isValidPig,
  newPig,
  optimalAction,
  winChance,
  type PigGame,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Pig.module.css';
import { PIG_SOUNDS } from './sounds';

type Opponent = 'easy' | 'hard' | 'human';
type Mode = 'menu' | 'play' | 'watch';
const OPPONENTS: Opponent[] = ['easy', 'hard', 'human'];
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

interface Saved {
  state: PigGame;
  opponent: Opponent;
}

export function PigTable({ services }: { services: GameServices }) {
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
          isValidPig((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [opponent, setOpponent] = useState<Opponent>('hard');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<PigGame | null>(null);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<string | null>(null);
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

  const human = (p: 0 | 1) => mode === 'play' && (opponent === 'human' || p === 0);
  const isYou = (p: 0 | 1) => mode === 'play' && opponent !== 'human' && p === 0;
  const name = (p: 0 | 1) =>
    isYou(p)
      ? t('you')
      : opponent === 'human' || mode === 'watch'
        ? t('player', { n: p + 1 })
        : t('cpu');
  const say = (key: string, p: 0 | 1, params: Record<string, string | number> = {}) =>
    t(isYou(p) ? `${key}.you` : key, { side: name(p), ...params });

  const start = (g: PigGame, m: Mode, o: Opponent) => {
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
      () => start(newPig(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard'),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: PigGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setState(next);
    const ev = next.event;
    if (action === 'roll') svc.playSound(next.last === 1 ? PIG_SOUNDS.pig : PIG_SOUNDS.roll);
    else svc.playSound(PIG_SOUNDS.hold);
    setMessage(
      ev?.kind === 'pig'
        ? say('pig', ev.player, { n: ev.points })
        : ev?.kind === 'hold'
          ? say('held', ev.player, { n: ev.points })
          : '',
    );
    if (next.phase === 'over' && next.winner !== null) {
      setMessage(say('won', next.winner, { n: next.scores[next.winner] }));
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(won ? PIG_SOUNDS.win : PIG_SOUNDS.lose);
        if (opponent !== 'human') {
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score: next.scores[0] - next.scores[1],
            mode: opponent,
          });
          if (won) {
            svc.unlockAchievement('first');
            if (opponent === 'hard') svc.unlockAchievement('hard');
            if (next.scores[1] === 0) svc.unlockAchievement('shutout');
          }
        }
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, opponent });
    if (action === 'hold' && before.turnTotal >= 40 && isYou(before.turn))
      svc.unlockAchievement('greedy');
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // Computer players (both in watch mode) act after a pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over' || human(state.turn)) return;
    const id = window.setTimeout(() => {
      const g = stateRef.current;
      if (!g) return;
      const strong = mode === 'watch' ? g.turn === 0 : opponent === 'hard';
      doAction(strong ? optimalAction(g) : holdAt20(g));
    }, 650);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && human(g.turn) && g.phase !== 'over';

  const showHint = () => {
    if (!g || !myTurn) return;
    servicesRef.current.playSound(PIG_SOUNDS.hint);
    const a = optimalAction(g);
    setHint(a);
    setMessage(t(a === 'hold' ? 'hint.hold' : 'hint.roll', { p: Math.round(winChance(g) * 100) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if (k === 'r' || k === ' ') doAction('roll');
    else if (k === 'b' || k === 'enter') doAction('hold');
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
      <div className={shared.menu} data-testid="pg-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.opponent)}
              data-testid="pg-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', { a: saved.state.scores[0], b: saved.state.scores[1] })}
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
                  data-testid={`pg-opp-${o}`}
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
              onClick={() => start(newPig(fixedSeed ?? randomSeed() >>> 0), 'play', opponent)}
              data-testid="pg-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newPig(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard')}
              data-testid="pg-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shared.play} data-testid="pig">
      <div className={styles.track}>
        {([0, 1] as const).map((p) => (
          <div
            key={p}
            className={[styles.lane, p === g.turn && g.phase !== 'over' ? styles.current : ''].join(
              ' ',
            )}
          >
            <span className={styles.who}>{name(p)}</span>
            <span className={styles.rail}>
              <span className={styles.banked} style={{ width: `${(g.scores[p] / GOAL) * 100}%` }} />
              {p === g.turn && (
                <span
                  className={styles.pending}
                  style={{
                    left: `${(g.scores[p] / GOAL) * 100}%`,
                    width: `${(Math.min(g.turnTotal, GOAL - g.scores[p]) / GOAL) * 100}%`,
                  }}
                />
              )}
            </span>
            <span className={styles.score} data-testid={`pg-score-${p}`}>
              {g.scores[p]}
            </span>
          </div>
        ))}
      </div>
      <div
        className={[styles.die, g.last === 1 ? styles.bust : ''].join(' ')}
        data-testid="pg-die"
        aria-label={g.last ? t('die', { n: g.last }) : t('die.none')}
      >
        {g.last ? (
          <svg viewBox="-12 -12 24 24">
            {PIPS[g.last]!.map(([x, y], k) => (
              <circle key={k} cx={x * 6} cy={y * 6} r={2.2} />
            ))}
          </svg>
        ) : null}
      </div>
      <p className={styles.turnTotal} data-testid="pg-turn">
        {t('turnTotal', { n: g.turnTotal })}
      </p>
      <p className={shared.message} data-testid="pg-message" aria-live="polite">
        {message ||
          (myTurn
            ? t('yourTurn')
            : g.phase !== 'over'
              ? t('thinking', { side: name(g.turn) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn && (
          <>
            <button
              type="button"
              className={['btn', hint === 'roll' ? 'btn-primary' : ''].join(' ')}
              onClick={() => doAction('roll')}
              data-testid="pg-roll"
            >
              <Dices size={16} /> {t('roll')}
            </button>
            <button
              type="button"
              className={['btn', hint === 'hold' ? 'btn-primary' : ''].join(' ')}
              onClick={() => doAction('hold')}
              disabled={g.turnTotal === 0}
              data-testid="pg-hold"
            >
              <Hand size={16} /> {t('hold', { n: g.turnTotal })}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="pg-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(newPig(randomSeed() >>> 0), mode, opponent)}
            data-testid="pg-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="pg-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
