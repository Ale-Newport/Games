/**
 * The Traffic Jam table: a menu (level, new or daily puzzle, resume, watch the AI), the 6×6 lot
 * with its exit, vehicles dragged along their length (or selected and moved with the arrow keys),
 * moves against the fewest possible, undo, hints that name the vehicle and the slide, pause, and
 * the solver in watch mode.
 */
import { Bot, Lightbulb, Pause, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { solverMove } from './ai';
import {
  EXIT_ROW,
  LEVELS,
  SIZE,
  isValidJamState,
  move,
  newJam,
  range,
  undo,
  type JamState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Jam.module.css';
import { JAM_SOUNDS } from './sounds';

interface Saved {
  state: JamState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

const SPEED_MS = 60_000;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function JamGame({ services }: { services: GameServices }) {
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
          typeof (d as Saved).daily === 'boolean' &&
          isValidJamState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<string>('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<JamState | null>(null);
  const [daily, setDaily] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(0);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ i: number; at: number } | null>(null);
  const grab = useRef<{
    i: number;
    x: number;
    y: number;
    from: number;
    lo: number;
    hi: number;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
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

  const start = (s: JamState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setHint(null);
    setSelected(0);
    setPaused(false);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };

  const fresh = (m: Mode, lv: string, seed: number, isDaily: boolean) =>
    start(newJam(lv, seed), m, isDaily);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'medium', fixedSeed ?? randomSeed() >>> 0, false),
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

  const name = (s: JamState, i: number) =>
    i === 0
      ? t('vehicle.red')
      : t(s.puzzle.vehicles[i]!.length === 3 ? 'vehicle.truck' : 'vehicle.car', {
          color: t(`color.${(i - 1) % 10}`),
        });

  const describe = (s: JamState, i: number, to: number) => {
    const v = s.puzzle.vehicles[i]!;
    const d = to - s.pos[i]!;
    const dir = v.horizontal ? (d > 0 ? 'right' : 'left') : d > 0 ? 'down' : 'up';
    return t(`slide.${dir}`, { vehicle: name(s, i), n: Math.abs(d) });
  };

  const solvedNow = (s: JamState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(JAM_SOUNDS.win);
    const best = s.moves === s.puzzle.optimal && !s.hints;
    setMessage(t(best ? 'solved.optimal' : 'solved', { moves: s.moves, time: formatTime(time) }));
    svc.recordResult({ outcome: 'complete', score: s.moves, timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (best) svc.unlockAchievement('optimal');
    if (s.level === 'hard' && !s.hints) svc.unlockAchievement('hard');
    if (s.level === 'medium' && time <= SPEED_MS && !s.hints) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: JamState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    servicesRef.current.playSound(JAM_SOUNDS.slide);
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play' && !next.solved)
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
  };

  const active = mode === 'play' && !!state && !state.solved && !paused;

  const onDown = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    setSelected(i);
    e.currentTarget.setPointerCapture(e.pointerId);
    const [lo, hi] = range(s.puzzle.vehicles, s.pos, i);
    grab.current = { i, x: e.clientX, y: e.clientY, from: s.pos[i]!, lo, hi };
    setDrag({ i, at: s.pos[i]! });
  };

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    const s = stateRef.current;
    if (!g || !s || !boardRef.current) return;
    const u = boardRef.current.clientWidth / SIZE;
    const v = s.puzzle.vehicles[g.i]!;
    const delta = Math.round((v.horizontal ? e.clientX - g.x : e.clientY - g.y) / u);
    setDrag({ i: g.i, at: Math.min(g.hi, Math.max(g.lo, g.from + delta)) });
  };

  const onUp = () => {
    const g = grab.current;
    const s = stateRef.current;
    grab.current = null;
    const d = drag;
    setDrag(null);
    if (!g || !s || !d || d.at === g.from) return;
    commit(move(s, g.i, d.at));
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(JAM_SOUNDS.hint);
    const [i, to] = solverMove(s).split(':').map(Number) as [number, number];
    setHint([i, to]);
    setSelected(i);
    setMessage(describe(s, i, to));
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !hint || !active) return;
    commit(move(s, hint[0], hint[1], { hint: true }));
  };

  // Watch mode: the solver slides one vehicle every 0.6 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved || paused) return;
    const id = window.setTimeout(() => {
      const [i, to] = solverMove(state).split(':').map(Number) as [number, number];
      const next = move(state, i, to);
      servicesRef.current.playSound(next.solved ? JAM_SOUNDS.win : JAM_SOUNDS.slide);
      setMessage(next.solved ? t('watch.done', { moves: next.moves }) : describe(state, i, to));
      setState(next);
    }, 600);
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
    const v = state.puzzle.vehicles[selected]!;
    const [lo, hi] = range(state.puzzle.vehicles, state.pos, selected);
    const at = state.pos[selected]!;
    const step = (d: number) => {
      const to = at + d;
      if (to >= lo && to <= hi) commit(move(state, selected, to));
    };
    if (k === 'tab')
      setSelected((selected + (e.shiftKey ? -1 : 1) + state.pos.length) % state.pos.length);
    else if (k === 'arrowleft' && v.horizontal) step(-1);
    else if (k === 'arrowright' && v.horizontal) step(1);
    else if (k === 'arrowup' && !v.horizontal) step(-1);
    else if (k === 'arrowdown' && !v.horizontal) step(1);
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

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[level];
    return (
      <div className={shared.menu} data-testid="tj-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="tj-resume"
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
              {LEVELS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={level === d}
                  onClick={() => setLevel(d)}
                  data-testid={`tj-level-${d}`}
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
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="tj-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                fresh('play', level, today() * 10 + LEVELS.indexOf(level as never), true)
              }
              data-testid="tj-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="tj-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const hidden = paused && mode === 'play';

  return (
    <div className={shared.play} data-testid="traffic-jam">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="tj-moves">
          {t('moves', { n: s.moves })}
        </span>
        <span className={styles.counter}>{t('best', { n: s.puzzle.optimal })}</span>
        <span className={styles.counter}>{formatTime(elapsed)}</span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${hidden ? styles.hidden : ''} ${s.solved ? styles.done : ''}`}
          ref={boardRef}
          role="group"
          aria-label={t('title')}
          data-testid="tj-board"
        >
          <span
            className={styles.exit}
            style={{ ['--row' as string]: EXIT_ROW }}
            aria-hidden="true"
          >
            ›
          </span>
          {s.puzzle.vehicles.map((v, i) => {
            const at = drag?.i === i ? drag.at : s.pos[i]!;
            const row = v.horizontal ? v.line : at;
            const col = v.horizontal ? at : v.line;
            return (
              <button
                key={i}
                type="button"
                className={[
                  styles.vehicle,
                  i === 0 ? styles.red : '',
                  v.length === 3 ? styles.truck : '',
                  selected === i && mode === 'play' ? styles.selected : '',
                  hint?.[0] === i ? styles.pointed : '',
                  drag?.i === i ? styles.dragging : '',
                ].join(' ')}
                style={{
                  ['--row' as string]: row,
                  ['--col' as string]: col,
                  ['--w' as string]: v.horizontal ? v.length : 1,
                  ['--h' as string]: v.horizontal ? 1 : v.length,
                  ['--hue' as string]: 30 + ((i - 1) % 10) * 29,
                }}
                data-vehicle={i}
                data-at={s.pos[i]}
                aria-label={t('vehicle.label', {
                  vehicle: name(s, i),
                  dir: t(v.horizontal ? 'dir.horizontal' : 'dir.vertical'),
                })}
                onPointerDown={(e) => onDown(e, i)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onFocus={() => setSelected(i)}
              />
            );
          })}
          {hidden && (
            <button type="button" className={shared.pausedCover} onClick={() => setPaused(false)}>
              <Play size={28} /> {t('paused')}
            </button>
          )}
        </div>
      </div>
      <p className={shared.message} data-testid="tj-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && !s.solved && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={applyHint}
          data-testid="tj-apply"
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
              data-testid="tj-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="tj-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setPaused((x) => !x)}
              aria-pressed={paused}
              data-testid="tj-pause"
            >
              <Pause size={16} /> {t(paused ? 'resume' : 'pause')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="tj-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="tj-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
