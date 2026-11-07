/**
 * The tube-sorting table shared by Water Sort and Ball Sort: a menu (level, new or daily puzzle,
 * resume, watch the AI), the tubes (tap one to lift its top, another to pour or drop), moves,
 * undo and restart, hints from the solver, and the solver in watch mode.
 */
import { Bot, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { formatTime } from '../sudoku/SudokuGame';
import shared from '../sudoku/SudokuGame.module.css';
import { solverStep } from './ai';
import { amount, topRun, type SortRules, type SortSpec } from './engine';
import { SORT_STRINGS } from './i18n';
import { isValidSortState, move, newSort, undo, type SortState } from './play';
import styles from './SortGame.module.css';
import { SORT_SOUNDS } from './sounds';

interface Saved {
  state: SortState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

export const SORT_COLORS = [
  '#e5484d',
  '#3e63dd',
  '#30a46c',
  '#f5d90a',
  '#f76b15',
  '#12a5c4',
  '#d6409f',
  '#8e4ec6',
  '#a18072',
  '#7ce2a8',
  '#f4a3c9',
  '#5b6578',
];

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export interface SortGameProps {
  services: GameServices;
  specs: Record<string, SortSpec>;
  rules: (spec: SortSpec) => SortRules;
  look: 'water' | 'balls';
  /** Title, menu.subtitle and level.<id> / level.<id>.hint. */
  strings: Record<Locale, Dictionary>;
}

export function SortGame({ services, specs, rules, look, strings }: SortGameProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        { en: { ...SORT_STRINGS.en, ...strings.en }, es: { ...SORT_STRINGS.es, ...strings.es } },
        locale,
      ),
    [locale, strings],
  );
  const servicesRef = useLatest(services);
  const levels = Object.keys(specs);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          typeof (d as Saved).daily === 'boolean' &&
          isValidSortState((d as Saved).state, specs, rules),
      }),
    [services, specs, rules],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState(levels[0]!);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SortState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
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

  const start = (s: SortState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setPicked(null);
    setHint(null);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };

  const begin = (m: Mode, lv: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newSort(specs, rules, lv, seed);
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
    if (mode !== 'play' || !state || state.solved) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state]);

  const rulesOf = (s: SortState) => rules(specs[s.level]!);

  const solvedNow = (s: SortState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SORT_SOUNDS.win);
    setMessage(t('solved', { moves: s.history.length, time: formatTime(time) }));
    svc.recordResult({ outcome: 'complete', score: s.history.length, timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (!s.undos && !s.hints) svc.unlockAchievement('clean');
    if (s.level === levels[levels.length - 1] && !s.hints) svc.unlockAchievement('hardest');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: SortState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setPicked(null);
    setHint(null);
    servicesRef.current.playSound(SORT_SOUNDS.pour);
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play' && !next.solved)
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
  };

  const active = mode === 'play' && !!state && !state.solved;

  const tapTube = (i: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    if (picked === null) {
      if (!s.tubes[i]!.length) return;
      setPicked(i);
      servicesRef.current.playSound(SORT_SOUNDS.lift);
      return;
    }
    if (picked === i) {
      setPicked(null);
      return;
    }
    if (!amount(s.tubes, picked, i, rulesOf(s))) {
      servicesRef.current.playSound(SORT_SOUNDS.blocked);
      setMessage(t('blocked'));
      setPicked(s.tubes[i]!.length ? i : null);
      return;
    }
    commit(move(s, rulesOf(s), picked, i));
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(SORT_SOUNDS.hint);
    const step = solverStep(s, rulesOf(s));
    if (!step) {
      setMessage(t('hint.stuck'));
      return;
    }
    setHint(step);
    setPicked(step[0]);
    setMessage(t('hint.move', { from: step[0] + 1, to: step[1] + 1 }));
  };

  // Watch mode: the solver moves every 0.5 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved) return;
    const id = window.setTimeout(() => {
      const step = solverStep(state, rulesOf(state));
      if (!step) return;
      const next = move(state, rulesOf(state), step[0], step[1]);
      servicesRef.current.playSound(next.solved ? SORT_SOUNDS.win : SORT_SOUNDS.pour);
      setHint(step);
      if (next.solved) setMessage(t('watch.done', { moves: next.history.length }));
      setState(next);
    }, 500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    const n = Number(k === '0' ? 10 : k);
    if (Number.isInteger(n) && n >= 1 && n <= state.tubes.length) tapTube(n - 1);
    else if (k === 'u') commit(undo(state, rulesOf(state)));
    else if (k === 'h') showHint();
    else if (k === 'escape') setPicked(null);
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
      <div className={shared.menu} data-testid="so-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="so-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.state.level}`),
                    moves: saved.state.history.length,
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
                  data-testid={`so-level-${d}`}
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
              disabled={busy}
              onClick={() => begin('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="so-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('play', level, today() * 10 + levels.indexOf(level), true)}
              data-testid="so-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="so-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const r = rulesOf(s);

  return (
    <div className={shared.play} data-testid="sorting">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="so-moves">
          {t('moves', { n: s.history.length })}
        </span>
        <span className={styles.counter}>{formatTime(elapsed)}</span>
      </div>
      <div
        className={`${styles.tubes} ${look === 'balls' ? styles.balls : styles.water}`}
        style={{ ['--cap' as string]: r.capacity, ['--count' as string]: s.tubes.length }}
        data-testid="so-tubes"
      >
        {s.tubes.map((tube, i) => {
          const done = tube.length === r.capacity && topRun(tube) === r.capacity;
          const lifted = picked === i ? (r.pourAll ? topRun(tube) : 1) : 0;
          return (
            <button
              key={i}
              type="button"
              className={[
                styles.tube,
                picked === i ? styles.picked : '',
                hint && hint[1] === i ? styles.target : '',
                done ? styles.done : '',
              ].join(' ')}
              onClick={() => tapTube(i)}
              aria-label={t('tube.label', {
                n: i + 1,
                contents: tube.length
                  ? tube.map((c) => t(`color.${c}`)).join(', ')
                  : t('tube.empty'),
              })}
              data-tube={i}
              data-count={tube.length}
            >
              {tube.map((c, j) => (
                <span
                  key={j}
                  className={`${styles.unit} ${j >= tube.length - lifted ? styles.lifted : ''}`}
                  style={{ ['--c' as string]: SORT_COLORS[c], ['--j' as string]: j }}
                />
              ))}
              <span className={styles.number}>{i + 1}</span>
            </button>
          );
        })}
      </div>
      <p className={shared.message} data-testid="so-message" aria-live="polite">
        {message}
      </p>
      {hint && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => commit(move(s, r, hint[0], hint[1], { hint: true }))}
          data-testid="so-apply"
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
              onClick={() => commit(undo(s, r))}
              disabled={!s.history.length}
              data-testid="so-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                start({ ...s, tubes: s.start.map((x) => [...x]), history: [] }, 'play', daily)
              }
              data-testid="so-restart"
            >
              <RotateCcw size={16} /> {t('restart')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="so-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => begin(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="so-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="so-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
