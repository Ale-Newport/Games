/**
 * The Number Trail table: a menu (grid size, new or daily puzzle, resume, watch the AI), the grid
 * with numbers and walls and the trail drawn over it (drag from its end, drag back to undo, tap a
 * trail cell to cut back), explained hints, pause, and the solver drawing the trail in watch mode.
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
import { SUDOKU_SOUNDS } from '../shared/sudoku/sounds';
import { solverMove } from './ai';
import {
  SPECS,
  agreed,
  backTo,
  canExtend,
  extend,
  forcedCell,
  isValidTrailState,
  lastNumber,
  neighbours,
  newTrail,
  nextNumber,
  undoStep,
  wallKey,
  type TrailState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Trail.module.css';

interface Saved {
  state: TrailState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

const LEVELS = Object.keys(SPECS);
const SPEED_MS = 45_000;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function TrailGame({ services }: { services: GameServices }) {
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
          isValidTrailState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<TrailState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<{ cell: number; back: boolean } | null>(null);
  const dragging = useRef(false);
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

  const start = (s: TrailState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setHint(null);
    setPaused(false);
    setMessage(m === 'play' ? t('select.cell') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };

  const begin = (m: Mode, lv: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newTrail(lv, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => begin('watch', 'medium', fixedSeed ?? randomSeed() >>> 0, false),
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

  const n = state?.puzzle.size ?? 5;
  const cellName = (c: number) => t('cell', { r: Math.floor(c / n) + 1, c: (c % n) + 1 });

  const solvedNow = (s: TrailState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SUDOKU_SOUNDS.solved);
    setMessage(t('solved', { time: formatTime(time), hints: s.hints }));
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (!s.hints) svc.unlockAchievement('clean');
    if (s.level === 'expert' && !s.hints) svc.unlockAchievement('expert');
    if (s.level === 'hard' && time <= SPEED_MS && !s.hints) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: TrailState, sound: keyof typeof SUDOKU_SOUNDS) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    servicesRef.current.playSound(SUDOKU_SOUNDS[sound]);
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play' && !next.solved)
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
  };

  const active = mode === 'play' && !!state && !state.solved && !paused;

  /** Explains why the trail cannot step onto `cell`. */
  const refuse = (s: TrailState, cell: number) => {
    const num = s.puzzle.numbers[cell]!;
    if (num && num !== nextNumber(s) && !s.path.includes(cell))
      setMessage(
        num === lastNumber(s.puzzle) && nextNumber(s) === num
          ? t('blocked.last')
          : num > nextNumber(s)
            ? t('blocked.number', { n: nextNumber(s) })
            : t('blocked'),
      );
    else if (num === lastNumber(s.puzzle)) setMessage(t('blocked.last'));
  };

  /** Moves the trail toward `cell`: back along it, or one step forward. */
  const reach = (cell: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    const end = s.path[s.path.length - 1]!;
    if (cell === end) return;
    if (s.path.includes(cell)) return commit(backTo(s, cell), 'erase');
    if (canExtend(s, cell)) return commit(extend(s, cell), 'place');
    if (neighbours(n, end).includes(cell)) refuse(s, cell);
  };

  const cellAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const c = el instanceof HTMLElement ? el.closest<HTMLElement>('[data-cell]') : null;
    return c ? Number(c.dataset.cell) : null;
  };

  const onDown = (e: PointerEvent, cell: number) => {
    if (!active) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    dragging.current = true;
    reach(cell);
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging.current || !active) return;
    const c = cellAt(e);
    const s = stateRef.current;
    if (c === null || !s) return;
    const end = s.path[s.path.length - 1]!;
    if (c === end) return;
    // Back over the trail: cut it back to that cell.
    if (s.path.includes(c)) return commit(backTo(s, c), 'erase');
    // Forward: fast drags skip cells, so walk one step at a time toward the pointer.
    let next = s;
    for (let guard = 0; guard < n * 2; guard++) {
      const at = next.path[next.path.length - 1]!;
      if (at === c) break;
      const dr = Math.floor(c / n) - Math.floor(at / n);
      const dc = (c % n) - (at % n);
      const vertical = at + Math.sign(dr) * n;
      const horizontal = at + Math.sign(dc);
      const order = Math.abs(dr) >= Math.abs(dc) ? [vertical, horizontal] : [horizontal, vertical];
      const step = order.find(
        (x, i) => (i === 0 ? true : dr && dc) && x !== at && canExtend(next, x),
      );
      if (step === undefined) break;
      next = extend(next, step);
    }
    commit(next, 'place');
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(SUDOKU_SOUNDS.hint);
    const ok = agreed(s);
    if (ok < s.path.length) {
      const cell = s.puzzle.solution[ok - 1]!;
      setHint({ cell, back: true });
      setMessage(t('hint.off', { cell: cellName(cell) }));
      return;
    }
    const cell = s.puzzle.solution[s.path.length]!;
    const num = s.puzzle.numbers[cell]!;
    setHint({ cell, back: false });
    setMessage(
      forcedCell(s) === cell
        ? t('hint.forced', { cell: cellName(cell) })
        : num
          ? t('hint.number', { n: num, cell: cellName(cell) })
          : t('hint.step', { cell: cellName(cell) }),
    );
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !hint || !active) return;
    if (hint.back) commit({ ...backTo(s, hint.cell), hints: s.hints + 1 }, 'erase');
    else commit(extend(s, hint.cell, { hint: true }), 'place');
  };

  // Watch mode: the solver draws one cell every 0.25 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved || paused) return;
    const id = window.setTimeout(() => {
      const next = extend(state, Number(solverMove(state).slice(2)));
      servicesRef.current.playSound(SUDOKU_SOUNDS[next.solved ? 'solved' : 'note']);
      if (next.solved) setMessage(t('watch.done', { steps: next.path.length - 1 }));
      setState(next);
    }, 250);
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
    const end = state.path[state.path.length - 1]!;
    const r = Math.floor(end / n);
    const c = end % n;
    const step = (rr: number, cc: number) => {
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) reach(rr * n + cc);
    };
    if (k === 'arrowup') step(r - 1, c);
    else if (k === 'arrowdown') step(r + 1, c);
    else if (k === 'arrowleft') step(r, c - 1);
    else if (k === 'arrowright') step(r, c + 1);
    else if (k === 'backspace' || k === 'u') commit(undoStep(state), 'erase');
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
      <div className={shared.menu} data-testid="zp-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="zp-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.level}`),
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.path.length) / saved.state.puzzle.size ** 2,
                    ),
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.difficulty')}</legend>
            <div className={shared.segmented}>
              {LEVELS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={level === d}
                  onClick={() => setLevel(d)}
                  data-testid={`zp-level-${d}`}
                >
                  {t(`difficulty.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`difficulty.${level}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', {
                    difficulty: t(`difficulty.${level}`),
                    solved: stats.completions,
                    time: formatTime(stats.bestTimeMs ?? 0),
                  })
                : t('menu.unsolved', { difficulty: t(`difficulty.${level}`) })}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => begin('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="zp-start"
            >
              <Play size={16} /> {busy ? t('generating') : t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('play', level, today() * 10 + LEVELS.indexOf(level), true)}
              data-testid="zp-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="zp-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const p = s.puzzle;
  const on = new Set(s.path);
  const end = s.path[s.path.length - 1]!;
  const walls = new Set(p.walls);
  const hidden = paused && mode === 'play';
  const centre = (c: number) => [(c % n) + 0.5, Math.floor(c / n) + 0.5] as const;
  const points = s.path.map((c) => centre(c).join(',')).join(' ');

  return (
    <div className={shared.play} data-testid="number-trail">
      <div className={styles.bar}>
        <span className={styles.counter}>{t('time', { time: formatTime(elapsed) })}</span>
        <span className={styles.counter} data-testid="zp-covered">
          {t('covered', { n: s.path.length, total: n * n })}
        </span>
        <span className={styles.counter}>{s.solved ? '★' : t('next', { n: nextNumber(s) })}</span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${hidden ? styles.hidden : ''} ${s.solved ? styles.done : ''}`}
          style={{ ['--n' as string]: n }}
          role="grid"
          aria-label={t('title')}
          data-testid="zp-board"
          onPointerMove={onMove}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
        >
          {Array.from({ length: n * n }, (_, c) => {
            const num = p.numbers[c]!;
            const right = c % n < n - 1 && walls.has(wallKey(c, c + 1));
            const down = c + n < n * n && walls.has(wallKey(c, c + n));
            return (
              <button
                key={c}
                type="button"
                role="gridcell"
                className={[
                  styles.cell,
                  on.has(c) ? styles.on : '',
                  c === end && !s.solved ? styles.end : '',
                  hint?.cell === c ? styles.pointed : '',
                  right ? styles.wallRight : '',
                  down ? styles.wallDown : '',
                ].join(' ')}
                data-cell={c}
                data-on={on.has(c) || undefined}
                aria-label={t('cell.label', {
                  cell: cellName(c),
                  number: num ? t('cell.number', { n: num }) : '',
                  state: c === end ? t('cell.end') : on.has(c) ? t('cell.on') : '',
                })}
                onPointerDown={(e) => onDown(e, c)}
              >
                {num && !hidden ? <span className={styles.number}>{num}</span> : null}
              </button>
            );
          })}
          {!hidden && (
            <svg className={styles.trail} viewBox={`0 0 ${n} ${n}`} aria-hidden="true">
              <polyline points={points} />
            </svg>
          )}
          {hidden && (
            <button type="button" className={shared.pausedCover} onClick={() => setPaused(false)}>
              <Play size={28} /> {t('paused')}
            </button>
          )}
        </div>
      </div>
      <p className={shared.message} data-testid="zp-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && !s.solved && (
        <button type="button" className="btn btn-primary" onClick={applyHint} data-testid="zp-fill">
          {t(hint.back ? 'hint.back' : 'hint.fill')}
        </button>
      )}
      <div className={shared.controls}>
        {mode === 'play' && !s.solved && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => commit(undoStep(s), 'erase')}
              disabled={s.path.length < 2}
              data-testid="zp-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="zp-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setPaused((x) => !x)}
              aria-pressed={paused}
              data-testid="zp-pause"
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
            data-testid="zp-again"
          >
            <Play size={16} /> {t('new.puzzle')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="zp-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
