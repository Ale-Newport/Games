/**
 * The Lights Out table: a menu (grid, new or daily puzzle, resume, watch the AI), the grid of
 * lights (tap or keyboard), presses against the fewest possible, undo and restart, hints from the
 * exact solver, and the solver in watch mode.
 */
import { Bot, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  SPECS,
  isValidLightsState,
  newLights,
  pressCell,
  solveLights,
  specOf,
  toggled,
  undoPress,
  type LightsState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Lights.module.css';
import { LIGHTS_SOUNDS } from './sounds';

interface Saved {
  state: LightsState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

const LEVELS = Object.keys(SPECS);

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function LightsGame({ services }: { services: GameServices }) {
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
          isValidLightsState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState('classic');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<LightsState | null>(null);
  const [daily, setDaily] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
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

  const start = (s: LightsState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setHint(null);
    setCursor(0);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };
  const fresh = (m: Mode, lv: string, seed: number, isDaily: boolean) =>
    start(newLights(lv, seed), m, isDaily);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'classic', fixedSeed ?? randomSeed() >>> 0, false),
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

  const solvedNow = (s: LightsState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    const n = s.presses.length;
    svc.playSound(LIGHTS_SOUNDS.win);
    const best = n === s.optimal && !s.hints;
    setMessage(t(best ? 'solved.optimal' : 'solved', { n, time: formatTime(time) }));
    svc.recordResult({ outcome: 'complete', score: n, timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (best) svc.unlockAchievement('optimal');
    if (s.level === 'large' && !s.hints) svc.unlockAchievement('large');
    if (s.level === 'diagonal' && !s.hints) svc.unlockAchievement('diagonal');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: LightsState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    servicesRef.current.playSound(LIGHTS_SOUNDS.click);
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play' && !next.solved)
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
  };

  const active = mode === 'play' && !!state && !state.solved;

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(LIGHTS_SOUNDS.hint);
    const spec = specOf(s);
    const plan = solveLights(s.lights, spec.size, spec.pattern) ?? [];
    setHint(plan[0] ?? null);
    setMessage(t('hint.press', { n: plan.length }));
  };

  // Watch mode: the solver presses one light every 0.6 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved) return;
    const id = window.setTimeout(() => {
      const spec = specOf(state);
      const c = (solveLights(state.lights, spec.size, spec.pattern) ?? [0])[0]!;
      const next = pressCell(state, c);
      servicesRef.current.playSound(next.solved ? LIGHTS_SOUNDS.win : LIGHTS_SOUNDS.click);
      setHint(c);
      if (next.solved) setMessage(t('watch.done', { n: next.presses.length }));
      setState(next);
    }, 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (!active) return false;
    const n = specOf(state).size;
    const r = Math.floor(cursor / n);
    const c = cursor % n;
    const moveTo = (rr: number, cc: number) =>
      setCursor(Math.min(n - 1, Math.max(0, rr)) * n + Math.min(n - 1, Math.max(0, cc)));
    if (k === 'arrowup') moveTo(r - 1, c);
    else if (k === 'arrowdown') moveTo(r + 1, c);
    else if (k === 'arrowleft') moveTo(r, c - 1);
    else if (k === 'arrowright') moveTo(r, c + 1);
    else if (k === ' ' || k === 'enter') commit(pressCell(state, cursor));
    else if (k === 'u') commit(undoPress(state));
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
      <div className={shared.menu} data-testid="lo-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="lo-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.state.level}`),
                    n: saved.state.lights.filter(Boolean).length,
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
                  data-testid={`lo-level-${d}`}
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
              data-testid="lo-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('play', level, today() * 10 + LEVELS.indexOf(level), true)}
              data-testid="lo-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="lo-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const spec = specOf(s);
  const n = spec.size;
  const affected = new Set(preview === null ? [] : toggled(n, spec.pattern, preview));

  return (
    <div className={shared.play} data-testid="lights-out">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="lo-presses">
          {t('presses', { n: s.presses.length })}
        </span>
        <span className={styles.counter}>{t('best', { n: s.optimal })}</span>
        <span className={styles.counter} data-testid="lo-on">
          {t('on', { n: s.lights.filter(Boolean).length })}
        </span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${s.solved ? styles.done : ''}`}
          style={{ ['--n' as string]: n }}
          role="grid"
          aria-label={t('title')}
          data-testid="lo-board"
          onPointerLeave={() => setPreview(null)}
        >
          {s.lights.map((on, c) => (
            <button
              key={c}
              type="button"
              role="gridcell"
              className={[
                styles.light,
                on ? styles.on : '',
                hint === c ? styles.pointed : '',
                affected.has(c) ? styles.affected : '',
                cursor === c && active ? styles.cursor : '',
              ].join(' ')}
              onClick={() => {
                setCursor(c);
                if (active) commit(pressCell(s, c));
              }}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setPreview(c)}
              aria-label={t(on ? 'cell.on' : 'cell.off', {
                r: Math.floor(c / n) + 1,
                c: (c % n) + 1,
              })}
              aria-pressed={on}
              data-cell={c}
              data-on={on || undefined}
            />
          ))}
        </div>
      </div>
      <p className={shared.message} data-testid="lo-message" aria-live="polite">
        {message}
      </p>
      {hint !== null && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => commit(pressCell(s, hint, { hint: true }))}
          data-testid="lo-apply"
        >
          {t('hint.apply')}
        </button>
      )}
      <div className={shared.controls}>
        {active && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => commit(undoPress(s))}
              disabled={!s.presses.length}
              data-testid="lo-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                start({ ...s, lights: [...s.start], presses: [], solved: false }, 'play', daily)
              }
              data-testid="lo-restart"
            >
              <RotateCcw size={16} /> {t('restart')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="lo-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="lo-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="lo-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
