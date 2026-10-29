/**
 * The sliding-merge table shared by Merge to 2048 and Fibonacci Merge: a menu (board size, new or
 * daily game, resume, watch the AI), the board (arrow keys, WASD or swipes), score and best tile,
 * one-step undo, hints from the expectimax search, keep going past the goal, and the search playing
 * on its own in watch mode.
 */
import { Bot, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { bestMove, type Dir, type MergeRules } from './engine';
import { MERGE_STRINGS } from './i18n';
import styles from './MergeGame.module.css';
import { isValidMergeState, newMerge, play, undo, type MergeGameState } from './play';
import { MERGE_SOUNDS } from './sounds';
import shared from '../sudoku/SudokuGame.module.css';

interface Saved {
  state: MergeGameState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export interface MergeGameProps {
  services: GameServices;
  levels: Record<string, MergeRules>;
  /** The tile's color step (0 for the smallest tile upward). */
  rank: (value: number) => number;
  /** Title, menu.subtitle, level.<id>, level.<id>.hint. */
  strings: Record<Locale, Dictionary>;
}

export function MergeGame({ services, levels, rank, strings }: MergeGameProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        { en: { ...MERGE_STRINGS.en, ...strings.en }, es: { ...MERGE_STRINGS.es, ...strings.es } },
        locale,
      ),
    [locale, strings],
  );
  const servicesRef = useLatest(services);
  const ids = Object.keys(levels);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          typeof (d as Saved).daily === 'boolean' &&
          isValidMergeState((d as Saved).state, levels),
      }),
    [services, levels],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState(ids[0]!);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<MergeGameState | null>(null);
  const [daily, setDaily] = useState(false);
  const [hint, setHint] = useState<Dir | null>(null);
  const [message, setMessage] = useState('');
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const stateRef = useLatest(state);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && !d.state.over) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (s: MergeGameState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setHint(null);
    setFresh(new Set());
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };
  const begin = (m: Mode, lv: string, seed: number, isDaily: boolean) =>
    start(newMerge(levels, lv, seed), m, isDaily);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => begin('watch', ids[0]!, fixedSeed ?? randomSeed() >>> 0, false),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const ended = (s: MergeGameState) => {
    const svc = servicesRef.current;
    svc.playSound(MERGE_SOUNDS.over);
    setMessage(t('over', { score: s.score, best: s.best }));
    svc.recordResult({
      outcome: s.won ? 'win' : 'loss',
      score: s.score,
      mode: s.level,
    });
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: MergeGameState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    const changed = new Set<number>();
    next.board.forEach((v, c) => v && v !== before.board[c] && changed.add(c));
    setFresh(changed);
    const merged = next.score > before.score;
    servicesRef.current.playSound(merged ? MERGE_SOUNDS.merge : MERGE_SOUNDS.slide);
    setState(next);
    setMessage('');
    const rules = levels[next.level]!;
    const svc = servicesRef.current;
    if (mode === 'play') {
      if (next.best >= rules.goal && before.best < rules.goal) {
        svc.playSound(MERGE_SOUNDS.goal);
        svc.unlockAchievement('goal');
        if (!next.undos && !next.hints) svc.unlockAchievement('clean');
        if (next.level === ids[0] && daily) svc.unlockAchievement('daily');
        setMessage(t('goal', { goal: rules.goal }));
      }
      if (next.best >= rules.goal * 2 && before.best < rules.goal * 2)
        svc.unlockAchievement('beyond');
      if (next.over) ended(next);
      else void slot.save({ state: next, daily });
    } else if (next.over) setMessage(t('watch.over', { score: next.score, best: next.best }));
  };

  const active = mode === 'play' && !!state && !state.over && (!state.won || state.continued);
  const reachedGoal = mode === 'play' && !!state && state.won && !state.continued && !state.over;

  const go = (d: Dir, options: { hint?: boolean } = {}) => {
    const s = stateRef.current;
    if (!s || !active) return;
    commit(play(s, levels, d, options));
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(MERGE_SOUNDS.hint);
    const d = bestMove(s.board, levels[s.level]!, 2);
    if (!d) return;
    setHint(d);
    setMessage(t('hint.move', { dir: t(`dir.${d}`) }));
  };

  // Watch mode: the search plays a move every 0.25 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.over) return;
    const id = window.setTimeout(() => {
      const d = bestMove(state.board, levels[state.level]!, 2);
      if (!d) return;
      commit(play(state, levels, d));
    }, 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    const dir: Record<string, Dir> = {
      arrowup: 'up',
      arrowdown: 'down',
      arrowleft: 'left',
      arrowright: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
    };
    if (dir[k]) go(dir[k]);
    else if (k === 'u') commit(undo(state));
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const onDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: PointerEvent) => {
    const sw = swipe.current;
    swipe.current = null;
    if (!sw) return;
    const dx = e.clientX - sw.x;
    const dy = e.clientY - sw.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  };

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && !s.over) {
      const kept = { state: s, daily };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[level];
    return (
      <div className={shared.menu} data-testid="mg-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="mg-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.state.level}`),
                    score: saved.state.score,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {ids.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={level === d}
                  onClick={() => setLevel(d)}
                  data-testid={`mg-level-${d}`}
                >
                  {t(`level.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.played
                ? t('menu.record', { played: stats.played, best: stats.bestScore ?? 0 })
                : t('menu.unplayed')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => begin('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="mg-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => begin('play', level, today() * 10 + ids.indexOf(level), true)}
              data-testid="mg-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => begin('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="mg-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const rules = levels[s.level]!;
  const n = rules.size;

  return (
    <div className={shared.play} data-testid="merge">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="mg-score">
          {t('score', { n: s.score })}
        </span>
        <span className={styles.counter} data-testid="mg-best">
          {t('bestTile', { n: s.best })}
        </span>
        <span className={styles.counter}>{t('moves', { n: s.moves })}</span>
      </div>
      <div
        className={`${styles.board} ${s.over ? styles.over : ''}`}
        style={{ ['--n' as string]: n }}
        role="grid"
        aria-label={t('title')}
        data-testid="mg-board"
        onPointerDown={onDown}
        onPointerUp={onUp}
      >
        {s.board.map((v, c) => (
          <div
            key={c}
            role="gridcell"
            className={`${styles.cell} ${v ? styles.tile : ''} ${fresh.has(c) ? styles.pop : ''}`}
            style={v ? { ['--rank' as string]: rank(v) } : undefined}
            data-value={v || undefined}
            aria-label={v ? String(v) : t('empty')}
          >
            {v ? <span className={v >= 1000 ? styles.small : ''}>{v}</span> : null}
          </div>
        ))}
      </div>
      <p className={shared.message} data-testid="mg-message" aria-live="polite">
        {message}
      </p>
      {reachedGoal && (
        <div className={shared.controls}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const next = { ...s, continued: true };
              setState(next);
              setMessage('');
              void slot.save({ state: next, daily });
            }}
            data-testid="mg-continue"
          >
            {t('continue')}
          </button>
        </div>
      )}
      {hint && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => go(hint, { hint: true })}
          data-testid="mg-apply"
        >
          {t('hint.apply', { dir: t(`dir.${hint}`) })}
        </button>
      )}
      <div className={shared.controls}>
        {active && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => commit(undo(s))}
              disabled={!s.previous}
              data-testid="mg-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="mg-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(s.over || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => begin(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="mg-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="mg-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
