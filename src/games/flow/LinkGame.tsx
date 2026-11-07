/**
 * The Color Links table: a menu (grid size, new or daily puzzle, resume, watch the AI), the grid
 * of lettered dots with paths drawn by dragging (from a dot, or from a path to continue it; back
 * over a path cuts it; crossing another color cuts that one), pairs joined and cells filled, hints
 * that reveal a path, and the solver drawing the reference paths in watch mode.
 */
import { Bot, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { solverMove } from './ai';
import {
  SPECS,
  dots,
  extendStroke,
  hintColor,
  isValidLinkState,
  joined,
  neighbours,
  newLinks,
  owners,
  revealPath,
  startStroke,
  type LinkState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Links.module.css';
import { LINK_SOUNDS } from './sounds';

interface Saved {
  state: LinkState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

const LEVELS = Object.keys(SPECS);
export const COLORS = [
  '#e5484d',
  '#3e63dd',
  '#30a46c',
  '#f5d90a',
  '#f76b15',
  '#12a5c4',
  '#d6409f',
  '#8e4ec6',
  '#a18072',
];
const LETTERS = 'ABCDEFGHI';

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function LinkGame({ services }: { services: GameServices }) {
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
          isValidLinkState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<LinkState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const drawing = useRef<number>(-1);
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

  const start = (s: LinkState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };

  const begin = (m: Mode, lv: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newLinks(lv, seed);
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
    if (mode !== 'play' || !state || state.solved) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state]);

  const solvedNow = (s: LinkState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(LINK_SOUNDS.win);
    setMessage(t('solved', { time: formatTime(time), hints: s.hints }));
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (!s.hints && s.strokes <= s.puzzle.pairs.length) svc.unlockAchievement('perfect');
    if (s.level === 'hard' && !s.hints) svc.unlockAchievement('hard');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: LinkState, sound: keyof typeof LINK_SOUNDS) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setState(next);
    const linkedBefore = before.puzzle.pairs.filter((_, k) =>
      joined(before.puzzle, k, before.paths[k]!),
    ).length;
    const linked = next.puzzle.pairs.filter((_, k) =>
      joined(next.puzzle, k, next.paths[k]!),
    ).length;
    servicesRef.current.playSound(LINK_SOUNDS[linked > linkedBefore ? 'link' : sound]);
    if (next.solved && !before.solved) solvedNow(next);
    else {
      const empty = owners(next.puzzle, next.paths).filter((o) => o < 0).length;
      setMessage(linked === next.puzzle.pairs.length && empty ? t('fill', { n: empty }) : '');
      if (mode === 'play')
        void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
    }
  };

  const active = mode === 'play' && !!state && !state.solved;

  const cellAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const c = el instanceof HTMLElement ? el.closest<HTMLElement>('[data-cell]') : null;
    return c ? Number(c.dataset.cell) : null;
  };

  const onDown = (e: PointerEvent, c: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    const r = startStroke(s, c);
    drawing.current = r.color;
    if (r.color >= 0) commit(r.state, 'draw');
  };

  const onMove = (e: PointerEvent) => {
    const k = drawing.current;
    const s = stateRef.current;
    if (k < 0 || !s || !active) return;
    const c = cellAt(e);
    if (c === null) return;
    // Fast drags skip cells: walk toward the pointer one side-step at a time.
    const n = s.puzzle.size;
    let next = s;
    for (let guard = 0; guard < 2 * n; guard++) {
      const path = next.paths[k]!;
      const end = path[path.length - 1];
      if (end === undefined || end === c) break;
      if (path.includes(c)) {
        // Back over its own path: cut it there.
        const cut = path.slice(0, path.indexOf(c) + 1);
        next = { ...next, paths: next.paths.map((x, j) => (j === k ? cut : x)), solved: false };
        break;
      }
      const dr = Math.floor(c / n) - Math.floor(end / n);
      const dc = (c % n) - (end % n);
      const step = Math.abs(dr) >= Math.abs(dc) ? end + Math.sign(dr) * n : end + Math.sign(dc);
      if (!neighbours(n, end).includes(step)) break;
      const after = extendStroke(next, k, step);
      if (after === next) break;
      next = after;
    }
    commit(next, 'draw');
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(LINK_SOUNDS.hint);
    const k = hintColor(s);
    const next = revealPath(s, k);
    commit(next, 'draw');
    if (!next.solved) setMessage(t('hint.reveal', { color: t(`color.${k}`), letter: LETTERS[k]! }));
  };

  // Watch mode: the solver extends a path every 0.15 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved) return;
    const id = window.setTimeout(() => {
      const [k, c] = solverMove(state).split(':').map(Number) as [number, number];
      const first = state.puzzle.pairs[k]![0];
      const started = state.paths[k]!.length ? state : startStroke(state, first).state;
      const next = extendStroke(started, k, c);
      servicesRef.current.playSound(next.solved ? LINK_SOUNDS.win : LINK_SOUNDS.draw);
      if (next.solved) setMessage(t('watch.done'));
      setState(next);
    }, 150);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

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
      <div className={shared.menu} data-testid="fl-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="fl-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.state.level}`),
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
                  data-testid={`fl-level-${d}`}
                >
                  {t(`level.${d}`)}
                </button>
              ))}
            </div>
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
              disabled={busy}
              onClick={() => begin('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="fl-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('play', level, today() * 10 + LEVELS.indexOf(level), true)}
              data-testid="fl-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="fl-watch"
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
  const n = p.size;
  const own = owners(p, s.paths);
  const dotOf = dots(p);
  const linked = p.pairs.filter((_, k) => joined(p, k, s.paths[k]!)).length;
  const filled = new Set(s.paths.flat()).size;
  const centre = (c: number) => `${(c % n) + 0.5},${Math.floor(c / n) + 0.5}`;

  return (
    <div className={shared.play} data-testid="color-links">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="fl-linked">
          {t('linked', { n: linked, total: p.pairs.length })}
        </span>
        <span className={styles.counter} data-testid="fl-filled">
          {t('filled', { n: Math.round((100 * filled) / (n * n)) })}
        </span>
        <span className={styles.counter}>{formatTime(elapsed)}</span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${s.solved ? styles.done : ''}`}
          style={{ ['--n' as string]: n }}
          role="grid"
          aria-label={t('title')}
          data-testid="fl-board"
          onPointerMove={onMove}
          onPointerUp={() => (drawing.current = -1)}
          onPointerLeave={() => (drawing.current = -1)}
        >
          {own.map((o, c) => (
            <button
              key={c}
              type="button"
              role="gridcell"
              className={styles.cell}
              style={o >= 0 ? { ['--tint' as string]: COLORS[o] } : undefined}
              data-cell={c}
              data-owner={o >= 0 ? o : undefined}
              aria-label={
                dotOf[c]! >= 0
                  ? t('cell.dot', { letter: LETTERS[dotOf[c]!]!, color: t(`color.${dotOf[c]}`) })
                  : o >= 0
                    ? t('cell.path', { color: t(`color.${o}`) })
                    : t('cell.empty')
              }
              onPointerDown={(e) => onDown(e, c)}
            >
              {dotOf[c]! >= 0 && (
                <span className={styles.dot} style={{ background: COLORS[dotOf[c]!] }}>
                  {LETTERS[dotOf[c]!]}
                </span>
              )}
            </button>
          ))}
          <svg className={styles.paths} viewBox={`0 0 ${n} ${n}`} aria-hidden="true">
            {s.paths.map((path, k) =>
              path.length > 1 ? (
                <polyline key={k} points={path.map(centre).join(' ')} stroke={COLORS[k]} />
              ) : null,
            )}
          </svg>
        </div>
      </div>
      <p className={shared.message} data-testid="fl-message" aria-live="polite">
        {message}
      </p>
      <div className={shared.controls}>
        {active && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => commit({ ...s, paths: s.paths.map(() => []) }, 'draw')}
              data-testid="fl-clear"
            >
              <RotateCcw size={16} /> {t('clear')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="fl-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => begin(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="fl-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="fl-menu-btn">
          {t('menu')}
        </button>
      </div>
    </div>
  );
}
