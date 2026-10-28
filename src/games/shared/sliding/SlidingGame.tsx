/**
 * The sliding-puzzle table shared by the 8-Puzzle and the 15-Puzzle: a menu (scramble level, new
 * or daily puzzle, resume, watch the AI), the board (tap a tile in the gap's row or column to push
 * the line; arrow keys; numbers or picture tiles), moves against the best possible, undo, hints
 * from the solver, pause, and the solver in watch mode.
 */
import { Bot, Lightbulb, Pause, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { formatTime } from '../sudoku/SudokuGame';
import shared from '../sudoku/SudokuGame.module.css';
import { lineTo, movable } from './engine';
import { SLIDE_STRINGS } from './i18n';
import { PICTURE } from './picture';
import {
  isValidSlideState,
  newSlide,
  nextMove,
  push,
  undo,
  type SlideSpec,
  type SlideState,
} from './play';
import styles from './SlidingGame.module.css';
import { SLIDE_SOUNDS } from './sounds';

interface Saved {
  state: SlideState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';
type Face = 'numbers' | 'picture';

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export interface SlidingGameProps {
  services: GameServices;
  specs: Record<string, SlideSpec>;
  /** Title, menu.subtitle and level.<id> / level.<id>.hint. */
  strings: Record<Locale, Dictionary>;
  /** Time limit for the speed achievement on the hardest level. */
  speedMs: number;
}

export function SlidingGame({ services, specs, strings, speedMs }: SlidingGameProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        { en: { ...SLIDE_STRINGS.en, ...strings.en }, es: { ...SLIDE_STRINGS.es, ...strings.es } },
        locale,
      ),
    [locale, strings],
  );
  const servicesRef = useLatest(services);
  const levels = Object.keys(specs);
  const hardest = levels[levels.length - 1]!;
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          typeof (d as Saved).daily === 'boolean' &&
          isValidSlideState((d as Saved).state, specs),
      }),
    [services, specs],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState(levels[0]!);
  const [face, setFace] = useState<Face>('numbers');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SlideState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<number | null>(null);
  const stateRef = useLatest(state);
  const elapsedRef = useLatest(elapsed);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && !d.state.solved) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (s: SlideState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setHint(null);
    setPaused(false);
    setMessage(m === 'play' ? t('select.tile') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };

  const begin = (m: Mode, lv: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newSlide(specs, lv, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => begin('watch', levels[1] ?? levels[0]!, fixedSeed ?? randomSeed() >>> 0, false),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'play' || !state || state.solved || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state, paused]);

  const solvedNow = (s: SlideState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SLIDE_SOUNDS.win);
    const best = s.optimal !== null && s.moves === s.optimal && !s.hints;
    setMessage(t(best ? 'solved.optimal' : 'solved', { moves: s.moves, time: formatTime(time) }));
    svc.recordResult({ outcome: 'complete', score: s.moves, timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (best) svc.unlockAchievement('optimal');
    if (s.level === hardest && !s.hints) svc.unlockAchievement('hardest');
    if (s.level === hardest && time <= speedMs && !s.hints) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: SlideState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    servicesRef.current.playSound(SLIDE_SOUNDS.slide);
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play' && !next.solved)
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
  };

  const active = mode === 'play' && !!state && !state.solved && !paused;

  const tap = (tile: number) => {
    const s = stateRef.current;
    if (!s || !active || !tile) return;
    if (!lineTo(s.board, tile).length) {
      servicesRef.current.playSound(SLIDE_SOUNDS.blocked);
      return;
    }
    commit(push(s, tile));
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(SLIDE_SOUNDS.hint);
    const m = nextMove(s.board);
    setHint(m.tile);
    setMessage(t(m.optimal ? 'hint.moveOptimal' : 'hint.move', { tile: m.tile, left: m.left }));
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || hint === null || !active) return;
    commit(push(s, hint, { hint: true }));
  };

  // Watch mode: the solver slides one tile every 0.3 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved || paused) return;
    const id = window.setTimeout(() => {
      const m = nextMove(state.board);
      const next = push(state, m.tile);
      servicesRef.current.playSound(next.solved ? SLIDE_SOUNDS.win : SLIDE_SOUNDS.slide);
      setHint(null);
      setMessage(
        next.solved
          ? t('watch.done', { moves: next.moves })
          : t('watch.step', { left: m.left - 1 }),
      );
      setState(next);
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state, paused]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (k === 'p') {
      setPaused((p) => !p);
      return true;
    }
    if (!active) return false;
    const n = state.size;
    const gap = state.board.indexOf(0);
    const r = Math.floor(gap / n);
    const c = gap % n;
    // An arrow slides the tile on the opposite side of the gap in that direction.
    const from = (rr: number, cc: number) =>
      rr >= 0 && rr < n && cc >= 0 && cc < n ? state.board[rr * n + cc]! : 0;
    if (k === 'arrowup') tap(from(r + 1, c));
    else if (k === 'arrowdown') tap(from(r - 1, c));
    else if (k === 'arrowleft') tap(from(r, c + 1));
    else if (k === 'arrowright') tap(from(r, c - 1));
    else if (k === 'u') commit(undo(state));
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && !s.solved) {
      const kept = { state: { ...s, elapsedMs: elapsedRef.current }, daily };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  const faceToggle = (
    <div className={shared.segmented}>
      {(['numbers', 'picture'] as const).map((f) => (
        <button
          key={f}
          type="button"
          aria-pressed={face === f}
          onClick={() => setFace(f)}
          data-testid={`sl-face-${f}`}
        >
          {t(`face.${f}`)}
        </button>
      ))}
    </div>
  );

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[level];
    return (
      <div className={shared.menu} data-testid="sl-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="sl-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.state.level}`),
                    moves: saved.state.moves,
                    time: formatTime(saved.state.elapsedMs),
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {levels.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={level === d}
                  onClick={() => setLevel(d)}
                  data-testid={`sl-level-${d}`}
                >
                  {t(`level.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', {
                    solved: stats.completions,
                    time: formatTime(stats.bestTimeMs ?? 0),
                  })
                : t('menu.unsolved')}
            </p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.face')}</legend>
            {faceToggle}
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => begin('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="sl-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('play', level, today() * 10 + levels.indexOf(level), true)}
              data-testid="sl-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="sl-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const n = s.size;
  const canMove = new Set(movable(s.board));
  const hidden = paused && mode === 'play';

  return (
    <div className={shared.play} data-testid="sliding">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="sl-moves">
          {t('moves', { n: s.moves })}
        </span>
        <span className={styles.counter}>
          {s.optimal !== null ? t('best', { n: s.optimal }) : ''}
        </span>
        <span className={styles.counter}>{t('time', { time: formatTime(elapsed) })}</span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${hidden ? styles.hidden : ''} ${s.solved ? styles.done : ''}`}
          style={{ ['--n' as string]: n }}
          role="grid"
          aria-label={t('title')}
          data-testid="sl-board"
        >
          {Array.from({ length: n * n - 1 }, (_, i) => {
            const tile = i + 1;
            const at = s.board.indexOf(tile);
            const home = tile - 1;
            return (
              <button
                key={tile}
                type="button"
                role="gridcell"
                className={[
                  styles.tile,
                  face === 'picture' ? styles.picture : '',
                  at === home ? styles.home : '',
                  hint === tile ? styles.pointed : '',
                ].join(' ')}
                style={{
                  ['--r' as string]: Math.floor(at / n),
                  ['--c' as string]: at % n,
                  ...(face === 'picture'
                    ? {
                        backgroundImage: PICTURE,
                        backgroundPosition: `${((home % n) / (n - 1)) * 100}% ${(Math.floor(home / n) / (n - 1)) * 100}%`,
                      }
                    : {}),
                }}
                onClick={() => tap(tile)}
                aria-label={t('tile.label', {
                  tile,
                  where: canMove.has(tile) ? t('tile.movable') : '',
                })}
                data-tile={tile}
                data-at={at}
              >
                {hidden ? null : <span className={styles.label}>{tile}</span>}
              </button>
            );
          })}
          {hidden && (
            <button type="button" className={shared.pausedCover} onClick={() => setPaused(false)}>
              <Play size={28} /> {t('paused')}
            </button>
          )}
        </div>
      </div>
      <p className={shared.message} data-testid="sl-message" aria-live="polite">
        {message}
      </p>
      {hint !== null && mode === 'play' && !s.solved && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={applyHint}
          data-testid="sl-apply"
        >
          {t('hint.apply')}
        </button>
      )}
      <div className={shared.controls}>
        {mode === 'play' && !s.solved && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => commit(undo(s))}
              disabled={!s.history.length}
              data-testid="sl-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="sl-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setPaused((x) => !x)}
              aria-pressed={paused}
              data-testid="sl-pause"
            >
              <Pause size={16} /> {t(paused ? 'resume' : 'pause')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => begin(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="sl-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="sl-menu-btn">
          {t('menu')}
        </button>
      </div>
      {faceToggle}
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
