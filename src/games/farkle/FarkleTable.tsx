/**
 * The Farkle table: a menu (players, opponents' level or all human, solo, new game, resume, watch
 * the AI), the dice of the roll (tap scoring dice to set them aside), the dice already aside, the
 * points at stake with roll-on and bank buttons, the scores, hints from the planner, and computer
 * turns played with short pauses.
 */
import { Bot, Dices, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { plannedAction, simpleAction } from './ai';
import { TARGET, countsOf, scoreSet } from './engine';
import { STRINGS } from './i18n';
import { act, canBank, isValidFarkle, newFarkle, type FarkleGame } from './match';
import { FARKLE_SOUNDS } from './sounds';
import styles from './Farkle.module.css';

type Level = 'easy' | 'hard' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard', 'humans'];
const COUNTS = [1, 2, 3, 4];
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
  state: FarkleGame;
  level: Level;
}

function Face({ value }: { value: number }) {
  return (
    <svg viewBox="-12 -12 24 24" className={styles.face}>
      {PIPS[value]!.map(([x, y], k) => (
        <circle key={k} cx={x * 6} cy={y * 6} r={2.2} />
      ))}
    </svg>
  );
}

export function FarkleTable({ services }: { services: GameServices }) {
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
          LEVELS.includes((d as Saved).level) &&
          isValidFarkle((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<FarkleGame | null>(null);
  const [picked, setPicked] = useState<boolean[]>([]);
  const [hint, setHint] = useState<string | null>(null);
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

  const human = (p: number) => mode === 'play' && (level === 'humans' || p === 0);
  const isYou = (p: number, g: FarkleGame) =>
    mode === 'play' && (level !== 'humans' || g.players === 1) && p === 0;
  const name = (p: number, g: FarkleGame) =>
    isYou(p, g)
      ? t('you')
      : t(level === 'humans' || mode === 'watch' ? 'player' : 'cpu', { n: p + 1 });
  const say = (
    key: string,
    p: number,
    g: FarkleGame,
    params: Record<string, string | number> = {},
  ) => t(isYou(p, g) ? `${key}.you` : key, { side: name(p, g), ...params });

  const start = (g: FarkleGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setPicked([]);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) => start(newFarkle(n, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: FarkleGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setPicked(next.dice ? next.dice.map(() => false) : []);
    setState(next);
    const ev = next.event;
    if (action === 'roll')
      svc.playSound(ev?.kind === 'farkle' ? FARKLE_SOUNDS.farkle : FARKLE_SOUNDS.roll);
    else if (action.endsWith(':bank')) svc.playSound(FARKLE_SOUNDS.bank);
    else svc.playSound(FARKLE_SOUNDS.keep);
    setMessage(
      ev?.kind === 'farkle'
        ? say('farkle', ev.player, before, { n: ev.points })
        : ev?.kind === 'hot'
          ? say('hot', ev.player, before, { n: ev.points })
          : ev?.kind === 'bank'
            ? say('banked', ev.player, before, { n: ev.points })
            : '',
    );
    if (next.phase !== 'over' && next.finalFrom !== null && before.finalFrom === null)
      setMessage(say('final', next.finalFrom, next, { n: next.scores[next.finalFrom]! }));
    if (next.phase === 'over' && next.winner !== null) {
      setMessage(
        next.players === 1
          ? t('over.solo', { n: next.turns[0]! })
          : say('won', next.winner, next, { n: next.scores[next.winner]! }),
      );
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(won ? FARKLE_SOUNDS.win : FARKLE_SOUNDS.lose);
        if (level !== 'humans' || next.players === 1) {
          svc.recordResult({
            outcome: next.players === 1 ? 'complete' : won ? 'win' : 'loss',
            score: next.players === 1 ? next.turns[0]! : next.scores[0]!,
            mode: next.players === 1 ? 'solo' : `${level}-${next.players}`,
          });
          svc.unlockAchievement('first');
          if (next.players === 1 && next.turns[0]! <= 20) svc.unlockAchievement('fast');
          if (won && next.players > 1) svc.unlockAchievement('beat');
          if (won && next.farkles[0] === 0) svc.unlockAchievement('clean');
        }
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // Computer players (all of them in watch mode) act after a pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over' || human(state.turn)) return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (!g) return;
        const strong = mode === 'watch' ? g.turn === 0 : level === 'hard';
        doAction(strong ? plannedAction(g) : simpleAction(g));
      },
      state.phase === 'roll' ? 600 : 1000,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && human(g.turn) && g.phase !== 'over';
  const pickedDice = g?.dice ? g.dice.filter((_, i) => picked[i]) : [];
  const pickPoints = pickedDice.length ? scoreSet(countsOf(pickedDice)) : 0;
  const pickValid = pickPoints > 0;
  const keepCode = countsOf(pickedDice).join('');

  const showHint = () => {
    if (!g || !myTurn || g.phase !== 'choose') return;
    servicesRef.current.playSound(FARKLE_SOUNDS.hint);
    const a = plannedAction(g);
    const [, code, then] = a.split(':');
    const want = code!.split('').map(Number);
    setPicked(
      g.dice!.map((d) => {
        if (want[d - 1]! > 0) {
          want[d - 1]!--;
          return true;
        }
        return false;
      }),
    );
    setHint(then!);
    setMessage(t(then === 'bank' ? 'hint.bank' : 'hint.roll'));
  };

  const keepAnd = (then: 'roll' | 'bank') => {
    if (!g || !myTurn || g.phase !== 'choose' || !pickValid) return;
    doAction(`keep:${keepCode}:${then}`);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if (k === 'r' || k === ' ') {
      if (g.phase === 'roll') doAction('roll');
      else keepAnd('roll');
    } else if (k === 'b') keepAnd('bank');
    else if (/^[1-6]$/.test(k) && g.phase === 'choose' && Number(k) <= g.dice!.length)
      setPicked((p) => p.map((x, i) => (i === Number(k) - 1 ? !x : x)));
    else if (k === 'h') showHint();
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

  if (mode === 'menu' || !g) {
    return (
      <div className={shared.menu} data-testid="fk-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid="fk-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', { n: saved.state.players, score: saved.state.scores[0]! })}
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
                  data-testid={`fk-count-${n}`}
                >
                  {n === 1 ? t('solo') : n}
                </button>
              ))}
            </div>
          </fieldset>
          {count > 1 && (
            <fieldset className={shared.group}>
              <legend>{t('menu.level')}</legend>
              <div className={shared.segmented}>
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    aria-pressed={level === lv}
                    onClick={() => setLevel(lv)}
                    data-testid={`fk-level-${lv}`}
                  >
                    {t(`level.${lv}`)}
                  </button>
                ))}
              </div>
              <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
            </fieldset>
          )}
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                fresh(
                  'play',
                  count === 1 ? 'humans' : level,
                  count,
                  fixedSeed ?? randomSeed() >>> 0,
                )
              }
              data-testid="fk-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="fk-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shared.play} data-testid="farkle">
      <div className={styles.scores}>
        {g.scores.map((s, p) => (
          <span
            key={p}
            className={[styles.chip, p === g.turn && g.phase !== 'over' ? styles.current : ''].join(
              ' ',
            )}
            data-testid={`fk-score-${p}`}
          >
            {name(p, g)} · {s}
            <span className={styles.bar}>
              <span style={{ width: `${Math.min(100, (s / TARGET) * 100)}%` }} />
            </span>
          </span>
        ))}
      </div>
      <div className={styles.aside} aria-label={t('aside', { n: g.aside.length })}>
        {g.aside.map((d, i) => (
          <span key={i} className={styles.small}>
            <Face value={d} />
          </span>
        ))}
      </div>
      <div className={styles.diceRow} data-testid="fk-dice">
        {(g.dice ?? []).map((d, i) => (
          <button
            key={i}
            type="button"
            className={[styles.die, picked[i] ? styles.picked : ''].join(' ')}
            disabled={!myTurn || g.phase !== 'choose'}
            onClick={() => setPicked((p) => p.map((x, j) => (j === i ? !x : x)))}
            aria-pressed={!!picked[i]}
            aria-label={t('die', { n: d })}
            data-testid={`fk-die-${i}`}
          >
            <Face value={d} />
          </button>
        ))}
        {!g.dice && (
          <span className={styles.placeholder}>{t(g.aside.length ? 'noDice.more' : 'noDice')}</span>
        )}
      </div>
      <p className={styles.stake} data-testid="fk-stake">
        {t('stake', { n: g.stake + (pickValid ? pickPoints : 0) })}
        {pickedDice.length > 0 && !pickValid ? ` · ${t('notScoring')}` : ''}
      </p>
      <p className={shared.message} data-testid="fk-message" aria-live="polite">
        {message ||
          (myTurn
            ? g.phase === 'roll'
              ? t(g.aside.length >= 6 ? 'rollHot' : 'roll.prompt', {
                  n: g.aside.length >= 6 ? 6 : 6 - g.aside.length,
                })
              : t('pick')
            : t('thinking', { side: name(g.turn, g) }))}
      </p>
      <div className={shared.controls}>
        {myTurn && g.phase === 'roll' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('roll')}
            data-testid="fk-roll"
          >
            <Dices size={16} /> {t('roll', { n: g.aside.length >= 6 ? 6 : 6 - g.aside.length })}
          </button>
        )}
        {myTurn && g.phase === 'choose' && (
          <>
            <button
              type="button"
              className={['btn', hint === 'roll' ? 'btn-primary' : ''].join(' ')}
              disabled={!pickValid}
              onClick={() => keepAnd('roll')}
              data-testid="fk-keep-roll"
            >
              {t('keepRoll')}
            </button>
            <button
              type="button"
              className={['btn', hint === 'bank' ? 'btn-primary' : ''].join(' ')}
              disabled={!pickValid || !canBank(g, g.stake + pickPoints)}
              onClick={() => keepAnd('bank')}
              data-testid="fk-bank"
            >
              {t('bank', { n: g.stake + pickPoints })}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="fk-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.players, randomSeed() >>> 0)}
            data-testid="fk-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="fk-menu-btn">
          {t('menu')}
        </button>
      </div>
      {!g.opened[g.turn] && g.phase !== 'over' && <p className={shared.hintText}>{t('opening')}</p>}
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
