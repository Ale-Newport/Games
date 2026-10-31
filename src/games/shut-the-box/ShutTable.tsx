/**
 * The Shut the Box table: a menu (players, opponents or all human, solo, new game, resume, watch the
 * AI), the nine wooden tiles (tap open tiles to choose them, then shut them), the dice with one-die
 * throws when allowed, the players' scores, hints from the solved game with the expected score, and
 * computer turns played with short pauses.
 */
import { Bot, Dices, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { chooseAction } from './ai';
import { bestShut, oneDieAllowed, openTiles, solve } from './engine';
import { STRINGS } from './i18n';
import { act, isValidShut, newShut, throwTotal, type ShutGame } from './match';
import styles from './Shut.module.css';
import { SHUT_SOUNDS } from './sounds';

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
  state: ShutGame;
  level: Level;
}

export function ShutTable({ services }: { services: GameServices }) {
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
          isValidShut((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [count, setCount] = useState(1);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<ShutGame | null>(null);
  const [chosen, setChosen] = useState(0);
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

  const human = (p: number) => mode === 'play' && (level === 'humans' || p === 0);
  const isYou = (p: number, g: ShutGame) =>
    mode === 'play' && (level !== 'humans' || g.players === 1) && p === 0;
  const name = (p: number, g: ShutGame) =>
    isYou(p, g)
      ? t('you')
      : t(level === 'humans' || mode === 'watch' ? 'player' : 'cpu', { n: p + 1 });
  const say = (key: string, p: number, g: ShutGame, params: Record<string, string | number> = {}) =>
    t(isYou(p, g) ? `${key}.you` : key, { side: name(p, g), ...params });

  const start = (g: ShutGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setChosen(0);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) => start(newShut(n, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: ShutGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setChosen(0);
    setHint(null);
    setState(next);
    svc.playSound(action.startsWith('roll') ? SHUT_SOUNDS.roll : SHUT_SOUNDS.shut);
    const ended = next.scores[before.turn] !== null && before.scores[before.turn] === null;
    if (ended) {
      const score = next.scores[before.turn]!;
      setMessage(
        score === 0
          ? say('shutBox', before.turn, before)
          : say('stuck', before.turn, before, { n: score }),
      );
      if (score === 0) svc.playSound(SHUT_SOUNDS.win);
    } else setMessage('');
    if (next.phase === 'over') {
      const solo = next.players === 1;
      const score = next.scores[0]!;
      if (!solo) {
        const w = next.winners;
        setMessage(
          w.length > 1
            ? t('over.tie', { n: next.scores[w[0]!]! })
            : say('won', w[0]!, next, { n: next.scores[w[0]!]! }),
        );
      } else setMessage(score === 0 ? t('over.shut') : t('over.solo', { n: score }));
      if (mode === 'play') {
        const won = solo || (next.winners.length === 1 && next.winners[0] === 0);
        if (!solo) svc.playSound(won ? SHUT_SOUNDS.win : SHUT_SOUNDS.lose);
        if (level !== 'humans' || solo) {
          svc.recordResult({
            outcome: solo ? 'complete' : won ? 'win' : next.winners.includes(0) ? 'draw' : 'loss',
            score,
            mode: solo ? 'solo' : `${level}-${next.players}`,
          });
          svc.unlockAchievement('first');
          if (score === 0) svc.unlockAchievement('shut');
          if (score <= 5) svc.unlockAchievement('low');
          if (won && !solo) svc.unlockAchievement('beat');
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
        if (g) doAction(chooseAction(g, mode === 'watch' ? g.turn === 0 : level === 'hard'));
      },
      state.phase === 'roll' ? 600 : 900,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && human(g.turn) && g.phase !== 'over';
  const chosenSum = openTiles(chosen).reduce((a, b) => a + b, 0);

  const showHint = () => {
    if (!g || !myTurn) return;
    servicesRef.current.playSound(SHUT_SOUNDS.hint);
    const { expect, useOne } = solve();
    if (g.phase === 'roll') {
      const one = oneDieAllowed(g.box) && useOne[g.box] === 1;
      setHint(null);
      setMessage(t(one ? 'hint.oneDie' : 'hint.twoDice', { e: expect[g.box]!.toFixed(1) }));
    } else {
      const m = bestShut(g.box, throwTotal(g))!;
      setChosen(m);
      setHint(m);
      setMessage(
        t('hint.shut', { tiles: openTiles(m).join(' + '), e: expect[g.box & ~m]!.toFixed(1) }),
      );
    }
  };

  const shutNow = () => {
    if (!g || !myTurn || g.phase !== 'shut' || chosenSum !== throwTotal(g)) return;
    doAction(`shut:${chosen}`);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if ((k === 'r' || k === ' ') && g.phase === 'roll') doAction('roll:2');
    else if (k === 'o' && g.phase === 'roll' && oneDieAllowed(g.box)) doAction('roll:1');
    else if (/^[1-9]$/.test(k) && g.phase === 'shut' && g.box & (1 << (Number(k) - 1)))
      setChosen((c) => c ^ (1 << (Number(k) - 1)));
    else if (k === 'enter' || k === 's') shutNow();
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
      <div className={shared.menu} data-testid="sb-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid="sb-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>{t('menu.resumeHint', { n: saved.state.players })}</small>
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
                  data-testid={`sb-count-${n}`}
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
                    data-testid={`sb-level-${lv}`}
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
              data-testid="sb-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="sb-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shared.play} data-testid="shut-the-box">
      {g.players > 1 && (
        <div className={styles.scores}>
          {g.scores.map((s, p) => (
            <span
              key={p}
              className={[
                styles.chip,
                p === g.turn && g.phase !== 'over' ? styles.current : '',
              ].join(' ')}
              data-testid={`sb-score-${p}`}
            >
              {name(p, g)} · {s ?? '—'}
            </span>
          ))}
        </div>
      )}
      <div className={styles.box} data-testid="sb-box">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((tile) => {
          const open = (g.box & (1 << (tile - 1))) !== 0;
          const picked = (chosen & (1 << (tile - 1))) !== 0;
          return (
            <button
              key={tile}
              type="button"
              className={[
                styles.tile,
                open ? '' : styles.shut,
                picked ? styles.picked : '',
                hint !== null && hint & (1 << (tile - 1)) ? styles.pointed : '',
              ].join(' ')}
              disabled={!myTurn || g.phase !== 'shut' || !open}
              onClick={() => setChosen((c) => c ^ (1 << (tile - 1)))}
              aria-pressed={picked}
              aria-label={t(open ? 'tile.open' : 'tile.shut', { n: tile })}
              data-testid={`sb-tile-${tile}`}
            >
              {tile}
            </button>
          );
        })}
      </div>
      <div className={styles.diceRow} data-testid="sb-dice">
        {(g.dice ?? []).map((d, i) => (
          <span key={i} className={styles.die} aria-label={t('die', { n: d })}>
            <svg viewBox="-12 -12 24 24">
              {PIPS[d]!.map(([x, y], k) => (
                <circle key={k} cx={x * 6} cy={y * 6} r={2.2} />
              ))}
            </svg>
          </span>
        ))}
        {g.dice && <span className={styles.total}>= {throwTotal(g)}</span>}
      </div>
      <p className={shared.message} data-testid="sb-message" aria-live="polite">
        {message ||
          (myTurn
            ? g.phase === 'roll'
              ? t('toRoll')
              : t('pick', { n: throwTotal(g), sum: chosenSum })
            : g.phase !== 'over'
              ? t('thinking', { side: name(g.turn, g) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn && g.phase === 'roll' && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => doAction('roll:2')}
              data-testid="sb-roll"
            >
              <Dices size={16} /> {t('roll2')}
            </button>
            {oneDieAllowed(g.box) && (
              <button
                type="button"
                className="btn"
                onClick={() => doAction('roll:1')}
                data-testid="sb-roll1"
              >
                {t('roll1')}
              </button>
            )}
          </>
        )}
        {myTurn && g.phase === 'shut' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={shutNow}
            disabled={chosenSum !== throwTotal(g)}
            data-testid="sb-shut"
          >
            {t('shut', { n: throwTotal(g) })}
          </button>
        )}
        {myTurn && (
          <button type="button" className="btn" onClick={showHint} data-testid="sb-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.players, randomSeed() >>> 0)}
            data-testid="sb-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="sb-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
