/**
 * The Nurikabe table: a menu (size, new or daily puzzle, resume, watch the AI), the grid where a tap
 * shades a cell as sea, dots it as land or clears it, rule breaks shown live, undo/redo, explained hints, a timer with
 * pause, and the technique solver in watch mode.
 */
import { Bot, Lightbulb, Pause, Play, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { SUDOKU_SOUNDS } from '../shared/sudoku/sounds';
import {
  SEA as BLACK,
  DIFFICULTIES,
  LAND as WHITE,
  countSolutions,
  cycleMark,
  isValidNuriState,
  newNurikabe,
  nextStep,
  redoMove,
  ruleBreaks,
  setMarks,
  undoMove,
  wrongCells,
  type NuriState,
  type Mark,
  type Step,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Nurikabe.module.css';

interface Saved {
  state: NuriState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';
type Tap = 'cycle' | 'shade' | 'keep';
const LEVELS = Object.keys(DIFFICULTIES);
const SPEED_MS = 5 * 60 * 1000;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function NurikabeGame({ services }: GameProps) {
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
          isValidNuriState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<NuriState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [tap, setTap] = useState<Tap>('cycle');
  const [showMistakes, setShowMistakes] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<{
    cell: number;
    mark: 1 | 2;
    cells: number[];
    set: { cell: number; mark: 1 | 2 }[];
  } | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const watchSteps = useRef(0);
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

  const begin = (m: Mode, level: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newNurikabe(level, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  const start = (s: NuriState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setDifficulty(s.difficulty);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setSelected(null);
    setHint(null);
    setFlagged([]);
    setPaused(false);
    setMessage(m === 'play' ? t('select.cell') : '');
    watchSteps.current = 0;
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
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

  const save = (s: NuriState) => {
    if (mode === 'play' && !s.solved)
      void slot.save({ state: { ...s, elapsedMs: elapsedRef.current }, daily });
  };

  const solvedNow = (s: NuriState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SUDOKU_SOUNDS.solved);
    setMessage(t('solved', { time: formatTime(time), mistakes: s.mistakes, hints: s.hints }));
    setSelected(null);
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.difficulty });
    svc.unlockAchievement('first');
    if (!s.mistakes && !s.hints) svc.unlockAchievement('clean');
    if (s.difficulty === 'expert') svc.unlockAchievement('hardest');
    if (s.difficulty === 'hard' && time <= SPEED_MS && !s.hints) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: NuriState, sound: keyof typeof SUDOKU_SOUNDS) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    setFlagged([]);
    const newWrong = next.mistakes > before.mistakes;
    servicesRef.current.playSound(SUDOKU_SOUNDS[newWrong && showMistakes ? 'wrong' : sound]);
    setState(next);
    setMessage(ruleBreaks(next).pools.size ? t('break.pool') : '');
    if (next.solved && !before.solved) solvedNow(next);
    else save(next);
  };

  const myTurn = mode === 'play' && !!state && !state.solved && !paused;
  const n = state?.puzzle.rows ?? 5;
  const cellName = (c: number) => t('cell', { r: Math.floor(c / n) + 1, c: (c % n) + 1 });

  const mark = (cell: number, m: Mark) => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    commit(
      setMarks(s, [{ cell, mark: m }]),
      m === BLACK ? 'place' : m === WHITE ? 'note' : 'erase',
    );
  };

  const tapCell = (cell: number) => {
    const s = stateRef.current;
    if (!s || !myTurn || s.puzzle.numbers[cell]) return;
    setSelected(cell);
    const now = s.marks[cell]!;
    const next: Mark =
      tap === 'cycle'
        ? cycleMark(now)
        : tap === 'shade'
          ? now === BLACK
            ? 0
            : BLACK
          : now === WHITE
            ? 0
            : WHITE;
    mark(cell, next);
  };

  const explain = (s: NuriState, step: Step) => {
    const { cell } = step.set[0]!;
    const n = step.cells.map((c) => s.puzzle.numbers[c]!).find((x) => x > 0) ?? 0;
    return t(`hint.${step.technique}`, { cell: cellName(cell), n });
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    servicesRef.current.playSound(SUDOKU_SOUNDS.hint);
    const wrong = wrongCells(s);
    if (wrong.length) {
      setFlagged(wrong);
      setHint(null);
      setSelected(wrong[0]!);
      setMessage(
        wrong.length === 1 ? t('hint.wrongMark') : t('hint.wrongMarks', { n: wrong.length }),
      );
      return;
    }
    const step = nextStep(s.puzzle, s.marks);
    if (step) {
      const { cell, mark: m } = step.set[0]!;
      setHint({
        cell,
        mark: m,
        cells: [...step.cells, ...step.set.map((x) => x.cell)],
        set: step.set,
      });
      setSelected(cell);
      setMessage(explain(s, step));
    } else {
      const cell = s.marks.findIndex((x) => !x);
      const m = s.puzzle.solution[cell] ? BLACK : WHITE;
      setHint({ cell, mark: m, cells: [cell], set: [{ cell, mark: m }] });
      setSelected(cell);
      setMessage(t(m === BLACK ? 'hint.shade' : 'hint.keep', { cell: cellName(cell) }));
    }
  };

  const fillHint = () => {
    const s = stateRef.current;
    if (!s || !hint) return;
    commit(setMarks(s, hint.set, { hint: true }), 'place');
  };

  // Watch mode: the technique solver decides one cell at a time and says why.
  useEffect(() => {
    if (mode !== 'watch' || !state || paused || state.solved) return;
    const id = window.setTimeout(() => {
      const step = nextStep(state.puzzle, state.marks);
      let next: NuriState;
      if (step) {
        const { cell, mark: m } = step.set[0]!;
        next = setMarks(state, step.set);
        setMessage(t('watch.step', { text: explain(state, step) }));
        setHint({ cell, mark: m, cells: step.cells, set: step.set });
        setSelected(cell);
      } else {
        const cell = state.marks.findIndex((x) => !x);
        const truth = countSolutions(state.puzzle, 1).first ?? state.puzzle.solution;
        const m = truth[cell] ? BLACK : WHITE;
        next = setMarks(state, [{ cell, mark: m }]);
        setMessage(
          t('watch.step', {
            text: t(m === BLACK ? 'hint.shade' : 'hint.keep', { cell: cellName(cell) }),
          }),
        );
        setSelected(cell);
      }
      watchSteps.current++;
      servicesRef.current.playSound(SUDOKU_SOUNDS.place);
      if (next.solved) {
        setHint(null);
        setSelected(null);
        setMessage(t('watch.done', { steps: watchSteps.current }));
        servicesRef.current.playSound(SUDOKU_SOUNDS.solved);
      }
      setState(next);
    }, 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state, paused]);

  const togglePause = () => {
    setPaused((p) => !p);
    const s = stateRef.current;
    if (s) save(s);
  };

  const move = (dr: number, dc: number) => {
    const c = selected ?? 0;
    const r = Math.min(n - 1, Math.max(0, Math.floor(c / n) + dr));
    const k = Math.min(n - 1, Math.max(0, (c % n) + dc));
    setSelected(r * n + k);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key;
    const lower = k.toLowerCase();
    if (lower === 'p') {
      if (!state.solved) togglePause();
      return true;
    }
    if (!myTurn) return false;
    if (k === 'ArrowUp') move(-1, 0);
    else if (k === 'ArrowDown') move(1, 0);
    else if (k === 'ArrowLeft') move(0, -1);
    else if (k === 'ArrowRight') move(0, 1);
    else if ((k === ' ' || k === 'Enter') && hint && lower === 'enter') fillHint();
    else if (k === ' ' && selected !== null)
      mark(selected, state.marks[selected] === BLACK ? 0 : BLACK);
    else if (lower === 'k' && selected !== null)
      mark(selected, state.marks[selected] === WHITE ? 0 : WHITE);
    else if ((k === 'Backspace' || k === 'Delete') && selected !== null) mark(selected, 0);
    else if (lower === 'u' || (lower === 'z' && (e.ctrlKey || e.metaKey)))
      commit(undoMove(state), 'erase');
    else if (lower === 'r' || (lower === 'y' && (e.ctrlKey || e.metaKey)))
      commit(redoMove(state), 'place');
    else if (lower === 'h') showHint();
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
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={shared.menu} data-testid="nuri-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="nuri-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.difficulty}`),
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.marks.filter((x) => x).length) / saved.state.marks.length,
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
                  aria-pressed={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  data-testid={`nuri-difficulty-${d}`}
                >
                  {t(`difficulty.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`difficulty.${difficulty}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', {
                    difficulty: t(`difficulty.${difficulty}`),
                    solved: stats.completions,
                    time: formatTime(stats.bestTimeMs ?? 0),
                  })
                : t('menu.unsolved', { difficulty: t(`difficulty.${difficulty}`) })}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => begin('play', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="nuri-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                begin('play', difficulty, today() * 10 + LEVELS.indexOf(difficulty), true)
              }
              data-testid="nuri-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="nuri-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
          {busy && (
            <p className={shared.hintText} role="status">
              {t('generating')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const s = state;
  const breaks = ruleBreaks(s);
  const wrong = new Set(showMistakes || mode === 'watch' ? wrongCells(s) : []);
  const flaggedSet = new Set(flagged);
  const pointed = new Set(hint?.cells ?? []);
  const hidden = paused && mode === 'play';

  return (
    <div className={shared.play} data-testid="nuri">
      <div className={shared.bar}>
        <span data-testid="nuri-difficulty">{t(`difficulty.${s.difficulty}`)}</span>
        {mode === 'play' && (
          <>
            <span data-testid="nuri-time">{t('time', { time: formatTime(elapsed) })}</span>
            <span>{t('mistakes', { n: s.mistakes })}</span>
            <span>{t('hints', { n: s.hints })}</span>
          </>
        )}
      </div>
      <div
        className={`${styles.board} ${hidden ? styles.hidden : ''}`}
        style={{ ['--n' as string]: n }}
        role="grid"
        aria-label={t('title')}
        data-testid="nuri-board"
      >
        {s.puzzle.numbers.map((num, c) => {
          const m = s.marks[c]!;
          const classes = [
            styles.cell,
            m === BLACK ? styles.black : '',
            pointed.has(c) ? styles.pointed : '',
            selected === c ? styles.selected : '',
            breaks.pools.has(c) || breaks.islands.has(c) ? styles.broken : '',
            wrong.has(c) || flaggedSet.has(c) ? styles.wrong : '',
          ];
          return (
            <button
              key={c}
              type="button"
              role="gridcell"
              className={classes.join(' ')}
              onClick={() => tapCell(c)}
              aria-label={t('cell.hitori', {
                cell: cellName(c),
                num: hidden ? '?' : num || '',
                state: t(`cell.state.${m}`),
              })}
              data-cell={c}
              data-mark={m}
            >
              {!hidden && num > 0 && <span className={styles.num}>{num}</span>}
              {!hidden && !num && m === WHITE && <span className={styles.dot} />}
            </button>
          );
        })}
        {hidden && (
          <button type="button" className={shared.pausedCover} onClick={togglePause}>
            <Play size={28} /> {t('paused')}
          </button>
        )}
      </div>
      <p className={shared.message} data-testid="nuri-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={fillHint}
          data-testid="nuri-fill"
        >
          {t('hint.fill')}
        </button>
      )}
      {mode === 'play' && !s.solved && (
        <div className={shared.tools}>
          <div className={shared.segmented}>
            {(['cycle', 'shade', 'keep'] as const).map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={tap === x}
                onClick={() => setTap(x)}
                data-testid={`nuri-tap-${x}`}
              >
                {t(`mode.${x}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            disabled={!myTurn || !s.undo.length}
            onClick={() => commit(undoMove(s), 'erase')}
            data-testid="nuri-undo"
          >
            <Undo2 size={16} /> {t('undo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn || !s.redo.length}
            onClick={() => commit(redoMove(s), 'place')}
            data-testid="nuri-redo"
          >
            <Redo2 size={16} /> {t('redo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn}
            onClick={showHint}
            data-testid="nuri-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
          <label className={shared.toggle}>
            <input
              type="checkbox"
              checked={showMistakes}
              onChange={(e) => setShowMistakes(e.target.checked)}
            />
            {t('show.mistakes')}
          </label>
        </div>
      )}
      <div className={shared.controls}>
        {mode === 'play' && !s.solved && (
          <button type="button" className="btn" onClick={togglePause} data-testid="nuri-pause">
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        {mode === 'watch' && !s.solved && (
          <button type="button" className="btn" onClick={() => setPaused((x) => !x)}>
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        {s.solved && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              begin(mode === 'watch' ? 'watch' : 'play', s.difficulty, randomSeed() >>> 0, false)
            }
            data-testid="nuri-again"
          >
            {t('new.puzzle')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toMenu}
          data-testid="nuri-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.keys}>{t('keys')}</p>}
    </div>
  );
}
