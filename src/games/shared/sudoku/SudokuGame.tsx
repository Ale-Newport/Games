/**
 * The sudoku table shared by the sudoku family: a menu (difficulty, new or daily puzzle, resume,
 * watch the AI), the board with pencil marks, a number pad, undo/redo, hints that explain the
 * technique, a timer with pause, and the AI solving step by step in watch mode.
 */
import { Bot, Eraser, Lightbulb, Pause, Pencil, Play, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { bit, conflicts, digitsOf, type Geometry } from './grid';
import { stepsToPlacement, type Step } from './logic';
import {
  eraseCell,
  fillNotes,
  geoFor,
  geoOf,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  redoMove,
  rulesOf,
  toggleNote,
  undoMove,
  wrongCells,
  type SudokuState,
  type SudokuVariant,
} from './play';
import { SUDOKU_STRINGS } from './i18n';
import { regionColours } from './jigsaw';
import { SUDOKU_SOUNDS } from './sounds';
import styles from './SudokuGame.module.css';

interface Saved {
  state: SudokuState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

/** Digit symbol: 1–9, then A, B, … for bigger grids. */
export const symbol = (d: number) => (d <= 9 ? String(d) : String.fromCharCode(55 + d));

export const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

/** Today's date as a number (local time), e.g. 20261107. */
const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export interface SudokuGameProps {
  services: GameServices;
  variant: SudokuVariant;
  /** Title, menu.subtitle, difficulty.<id> and difficulty.<id>.hint. */
  strings: Record<Locale, Dictionary>;
  /** Prefix for test ids. */
  testId: string;
  /** The "speed" achievement: solve this difficulty within this time. */
  speed: { difficulty: string; ms: number };
  /** Extra drawing on the board (diagonals, cages), given the geometry and cell size in %. */
  overlay?: (geo: Geometry, state: SudokuState) => ReactNode;
  /** Extra class per cell (e.g. diagonal shading). */
  cellClass?: (cell: number) => string;
  /** Leave room above the notes for cage sums. */
  roomForSums?: boolean;
}

export function SudokuGame({
  services,
  variant,
  strings,
  testId,
  speed,
  overlay,
  cellClass,
  roomForSums,
}: SudokuGameProps) {
  const { locale } = services;
  const dict = useMemo(
    () => ({
      en: { ...SUDOKU_STRINGS.en, ...strings.en },
      es: { ...SUDOKU_STRINGS.es, ...strings.es },
    }),
    [strings],
  );
  const t = useMemo(() => createTranslator(dict, locale), [dict, locale]);
  const servicesRef = useLatest(services);
  const levels = Object.keys(variant.difficulties);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          typeof (d as Saved).daily === 'boolean' &&
          isValidSudokuState(variant, (d as Saved).state),
      }),
    [services, variant],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState(levels[Math.min(1, levels.length - 1)]!);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SudokuState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [showMistakes, setShowMistakes] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  /** A hint waiting to be filled in: its target and the cells it points at. */
  const [hint, setHint] = useState<{ cell: number; digit: number; cells: number[] } | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const watchSteps = useRef(0);
  const stateRef = useLatest(state);
  const geo = state ? geoFor(variant, state) : geoOf(variant);
  const n = geo.size;
  const colours = useMemo(
    () => (state?.regions ? regionColours(n, state.regions) : null),
    [state?.regions, n],
  );
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

  /** Generates off the click so the "building" message can show first. */
  const begin = (m: Mode, level: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newSudoku(variant, level, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  const start = (s: SudokuState, m: Mode, isDaily: boolean) => {
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
    if (mode === 'watch' && !state && !busy)
      begin('watch', levels.at(-1)!, fixedSeed ?? randomSeed() >>> 0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // The clock runs while a puzzle is being played and the page is visible.
  useEffect(() => {
    if (mode !== 'play' || !state || state.solved || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state, paused]);

  const save = (s: SudokuState) => {
    if (mode === 'play' && !s.solved)
      void slot.save({ state: { ...s, elapsedMs: elapsedRef.current }, daily });
  };

  const solvedNow = (s: SudokuState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SUDOKU_SOUNDS.solved);
    setMessage(t('solved', { time: formatTime(time), mistakes: s.mistakes, hints: s.hints }));
    setSelected(null);
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.difficulty });
    svc.unlockAchievement('first');
    if (!s.mistakes && !s.hints) svc.unlockAchievement('clean');
    if (s.difficulty === levels.at(-1)) svc.unlockAchievement('hardest');
    if (s.difficulty === speed.difficulty && time <= speed.ms && !s.hints)
      svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  /** Applies a state change from the player, with sounds and saving. */
  const commit = (next: SudokuState, sound?: keyof typeof SUDOKU_SOUNDS) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setFlagged([]);
    const newWrong = next.mistakes > before.mistakes;
    const placed = next.values.findIndex((x, c) => x && x !== before.values[c]);
    const unitDone =
      placed >= 0 && geo.unitsOf[placed]!.some((u) => geo.units[u]!.every((c) => next.values[c]));
    svc.playSound(
      SUDOKU_SOUNDS[
        newWrong && showMistakes
          ? 'wrong'
          : unitDone && sound === 'place'
            ? 'unit'
            : (sound ?? 'place')
      ],
    );
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else save(next);
  };

  const myTurn = mode === 'play' && !!state && !state.solved && !paused;

  const enter = (digit: number, asNote = notesMode) => {
    const s = stateRef.current;
    if (!s || !myTurn || selected === null) return;
    if (s.puzzle[selected]) {
      servicesRef.current.playSound(SUDOKU_SOUNDS.invalid);
      setMessage(t('cell.given', { cell: cellName(selected) }));
      return;
    }
    if (asNote) commit(toggleNote(s, selected, digit), 'note');
    else commit(placeDigit(variant, s, selected, digit), 'place');
  };

  const cellName = (c: number) => t('cell', { r: Math.floor(c / n) + 1, c: (c % n) + 1 });
  const unitName = (u: number) => t(`unit.${geo.unitKinds[u]}`);

  /** The text for the step that places a digit, with the techniques it needs first. */
  const explain = (steps: Step[]) => {
    const last = steps.at(-1)!;
    const { cell, digit } = last.place!;
    const text =
      last.technique === 'naked-single'
        ? t(steps.length > 1 ? 'hint.naked-single.after' : 'hint.naked-single', {
            cell: cellName(cell),
            digit: symbol(digit),
          })
        : last.technique === 'innie' || last.technique === 'outie'
          ? t(`hint.${last.technique}`, {
              unit: unitName(last.unit!),
              sum: last.sum ?? 0,
              cell: cellName(cell),
              digit: symbol(digit),
            })
          : t('hint.hidden-single', {
              unit: unitName(last.unit ?? geo.unitsOf[cell]![0]!),
              digit: symbol(digit),
              cell: cellName(cell),
            });
    const before = [...new Set(steps.slice(0, -1).map((s) => t(`tech.${s.technique}`)))];
    return before.length ? `${t('hint.before', { techniques: before.join(', ') })} ${text}` : text;
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    const svc = servicesRef.current;
    svc.playSound(SUDOKU_SOUNDS.hint);
    const wrong = wrongCells(s);
    if (wrong.length) {
      setFlagged(wrong);
      setHint(null);
      setSelected(wrong[0]!);
      setMessage(
        wrong.length === 1
          ? t('hint.wrong', { digit: symbol(s.values[wrong[0]!]!) })
          : t('hint.wrongMany', { n: wrong.length }),
      );
      return;
    }
    const steps = stepsToPlacement(geo, s.values, rulesOf(geo, s).steps);
    if (steps) {
      const { cell, digit } = steps.at(-1)!.place!;
      // The placement and the last couple of steps leading to it (earlier ones would flood the board).
      const cells = [...new Set(steps.slice(-3).flatMap((x) => x.cells))];
      const unit = steps.at(-1)!.unit;
      setHint({ cell, digit, cells: unit !== undefined ? [...cells, ...geo.units[unit]!] : cells });
      setSelected(cell);
      setMessage(explain(steps));
    } else {
      const cell = s.values.findIndex((x) => !x);
      setHint({ cell, digit: s.solution[cell]!, cells: [cell] });
      setSelected(cell);
      setMessage(t('hint.guess', { cell: cellName(cell), digit: symbol(s.solution[cell]!) }));
    }
  };

  const fillHint = () => {
    const s = stateRef.current;
    if (!s || !hint) return;
    commit(placeDigit(variant, s, hint.cell, hint.digit, { hint: true }), 'place');
  };

  // Watch mode: the technique solver places one digit at a time and says why.
  useEffect(() => {
    if (mode !== 'watch' || !state || paused || state.solved) return;
    const id = window.setTimeout(() => {
      const steps = stepsToPlacement(geo, state.values, rulesOf(geo, state).steps);
      let next: SudokuState;
      if (steps) {
        const { cell, digit } = steps.at(-1)!.place!;
        next = placeDigit(variant, state, cell, digit);
        setMessage(t('watch.step', { text: explain(steps) }));
        setHint({ cell, digit, cells: steps.slice(-3).flatMap((x) => x.cells) });
        setSelected(cell);
      } else {
        const cell = state.values.findIndex((x) => !x);
        next = placeDigit(variant, state, cell, state.solution[cell]!);
        setMessage(
          t('watch.step', {
            text: t('hint.guess', { cell: cellName(cell), digit: symbol(state.solution[cell]!) }),
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
    }, 1100);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state, paused]);

  const move = (dr: number, dc: number) => {
    const c = selected ?? 0;
    const r = (Math.floor(c / n) + dr + n) % n;
    const col = ((c % n) + dc + n) % n;
    setSelected(r * n + col);
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
    else if (k === 'Backspace' || k === 'Delete' || k === '0') {
      if (selected !== null) commit(eraseCell(state, selected), 'erase');
    } else if (lower === 'n') setNotesMode((x) => !x);
    else if (lower === 'u' || (lower === 'z' && (e.ctrlKey || e.metaKey)))
      commit(undoMove(state), 'erase');
    else if (lower === 'r' || (lower === 'y' && (e.ctrlKey || e.metaKey)))
      commit(redoMove(state), 'place');
    else if (lower === 'h') showHint();
    else if (lower === 'enter' && hint) fillHint();
    else {
      // Digits by their code so Shift+digit (notes) works on every keyboard layout.
      const fromCode = /^Digit([1-9])$/.exec(e.code)?.[1] ?? /^Numpad([1-9])$/.exec(e.code)?.[1];
      const letter = n > 9 && /^[a-g]$/.test(lower) ? lower.charCodeAt(0) - 87 : null;
      const digit = fromCode ? Number(fromCode) : letter;
      if (digit === null || digit > n) return false;
      enter(digit, notesMode !== e.shiftKey);
    }
    return true;
  });

  const togglePause = () => {
    setPaused((p) => !p);
    const s = stateRef.current;
    if (s) save(s);
  };

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
      <div className={styles.menu} data-testid={`${testId}-menu`}>
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid={`${testId}-resume`}
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.difficulty}`),
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.values.filter((x) => x).length) / geo.cells,
                    ),
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={styles.group}>
            <legend>{t('menu.difficulty')}</legend>
            <div className={styles.segmented}>
              {levels.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  data-testid={`${testId}-difficulty-${d}`}
                >
                  {t(`difficulty.${d}`)}
                </button>
              ))}
            </div>
            <p className={styles.hintText}>{t(`difficulty.${difficulty}.hint`)}</p>
            <p className={styles.hintText}>
              {stats?.completions
                ? t('menu.record', {
                    difficulty: t(`difficulty.${difficulty}`),
                    solved: stats.completions,
                    time: formatTime(stats.bestTimeMs ?? 0),
                  })
                : t('menu.unsolved', { difficulty: t(`difficulty.${difficulty}`) })}
            </p>
          </fieldset>
          <div className={styles.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => begin('play', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid={`${testId}-start`}
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                begin('play', difficulty, today() * 10 + levels.indexOf(difficulty), true)
              }
              data-testid={`${testId}-daily`}
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid={`${testId}-watch`}
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
          {busy && (
            <p className={styles.hintText} role="status">
              {t('generating')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const s = state;
  const clash = conflicts(geo, s.values);
  const wrong = new Set(showMistakes || mode === 'watch' ? wrongCells(s) : []);
  const flaggedSet = new Set(flagged);
  const focus = selected !== null ? s.values[selected]! : 0;
  const peers = new Set(selected !== null ? geo.peers[selected]! : []);
  const pointed = new Set(hint?.cells ?? []);
  const counts = Array<number>(n + 1).fill(0);
  for (const x of s.values) counts[x]!++;
  const noteCols = geo.shape.boxCols;
  const hidden = paused && mode === 'play';

  return (
    <div className={styles.play} data-testid={testId}>
      <div className={styles.bar}>
        <span data-testid={`${testId}-difficulty`}>{t(`difficulty.${s.difficulty}`)}</span>
        {mode === 'play' && (
          <>
            <span data-testid={`${testId}-time`}>{t('time', { time: formatTime(elapsed) })}</span>
            <span>{t('mistakes', { n: s.mistakes })}</span>
            <span>{t('hints', { n: s.hints })}</span>
          </>
        )}
      </div>
      <div
        className={`${styles.board} ${hidden ? styles.hidden : ''} ${roomForSums ? styles.sums : ''}`}
        style={{ ['--n' as string]: n }}
        role="grid"
        aria-label={t('title')}
        data-testid={`${testId}-board`}
      >
        {s.values.map((v, c) => {
          const r = Math.floor(c / n);
          const col = c % n;
          const thickRight = col < n - 1 && geo.region[c] !== geo.region[c + 1];
          const thickBottom = r < n - 1 && geo.region[c] !== geo.region[c + n];
          const notes = digitsOf(s.notes[c]!);
          const classes = [
            styles.cell,
            thickRight ? styles.thickRight : '',
            thickBottom ? styles.thickBottom : '',
            s.puzzle[c] ? styles.given : styles.entered,
            cellClass?.(c) ?? '',
            colours ? styles[`tint${colours[geo.region[c]!]! % 4}`] : '',
            peers.has(c) ? styles.peer : '',
            pointed.has(c) ? styles.pointed : '',
            focus && v === focus ? styles.same : '',
            selected === c ? styles.selected : '',
            clash.has(c) || wrong.has(c) || flaggedSet.has(c) ? styles.wrong : '',
          ];
          return (
            <button
              key={c}
              type="button"
              role="gridcell"
              className={classes.join(' ')}
              onClick={() => mode === 'play' && setSelected(c)}
              aria-selected={selected === c}
              aria-label={t('cell.label', {
                cell: cellName(c),
                content: hidden
                  ? t('paused')
                  : v
                    ? symbol(v)
                    : notes.length
                      ? t('cell.notes', { notes: notes.map(symbol).join(' ') })
                      : t('cell.empty'),
              })}
              data-cell={c}
              tabIndex={selected === c || (selected === null && c === 0) ? 0 : -1}
            >
              {hidden ? null : v ? (
                <span className={styles.digit}>{symbol(v)}</span>
              ) : notes.length ? (
                <span className={styles.notes} style={{ ['--cols' as string]: noteCols }}>
                  {Array.from({ length: n }, (_, i) => (
                    <span key={i} className={focus === i + 1 ? styles.noteFocus : ''}>
                      {s.notes[c]! & bit(i + 1) ? symbol(i + 1) : ''}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
        {overlay && !hidden && <div className={styles.overlay}>{overlay(geo, s)}</div>}
        {hidden && (
          <button type="button" className={styles.pausedCover} onClick={togglePause}>
            <Play size={28} /> {t('paused')}
          </button>
        )}
      </div>
      <p className={styles.message} data-testid={`${testId}-message`} aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={fillHint}
          data-testid={`${testId}-fill`}
        >
          {t('hint.fill')}
        </button>
      )}
      {mode === 'play' && !s.solved && (
        <>
          <div
            className={styles.pad}
            style={{ ['--pad' as string]: n <= 9 ? n : 8 }}
            data-testid={`${testId}-pad`}
          >
            {Array.from({ length: n }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.key} ${counts[d]! >= n ? styles.done : ''}`}
                disabled={!myTurn}
                onClick={() => enter(d)}
                aria-label={symbol(d)}
                data-testid={`${testId}-digit-${d}`}
              >
                <span>{symbol(d)}</span>
                <small>{Math.max(0, n - counts[d]!)}</small>
              </button>
            ))}
          </div>
          <div className={styles.tools}>
            <button
              type="button"
              className={`btn ${notesMode ? 'btn-primary' : ''}`}
              aria-pressed={notesMode}
              onClick={() => setNotesMode((x) => !x)}
              data-testid={`${testId}-notes`}
            >
              <Pencil size={16} /> {t(notesMode ? 'notes.on' : 'notes')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn || selected === null}
              onClick={() => selected !== null && commit(eraseCell(s, selected), 'erase')}
              data-testid={`${testId}-erase`}
            >
              <Eraser size={16} /> {t('erase')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn || !s.undo.length}
              onClick={() => commit(undoMove(s), 'erase')}
              data-testid={`${testId}-undo`}
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn || !s.redo.length}
              onClick={() => commit(redoMove(s), 'place')}
              data-testid={`${testId}-redo`}
            >
              <Redo2 size={16} /> {t('redo')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn}
              onClick={showHint}
              data-testid={`${testId}-hint`}
            >
              <Lightbulb size={16} /> {t('hint')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn}
              onClick={() => commit(fillNotes(variant, s), 'note')}
              data-testid={`${testId}-fill-notes`}
            >
              {t('fill.notes')}
            </button>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={showMistakes}
                onChange={(e) => setShowMistakes(e.target.checked)}
                data-testid={`${testId}-show-mistakes`}
              />
              {t('show.mistakes')}
            </label>
          </div>
        </>
      )}
      <div className={styles.controls}>
        {mode === 'play' && !s.solved && (
          <button
            type="button"
            className="btn"
            onClick={togglePause}
            data-testid={`${testId}-pause`}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        {mode === 'watch' && !s.solved && (
          <button type="button" className="btn" onClick={() => setPaused((p) => !p)}>
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
            data-testid={`${testId}-again`}
          >
            {t('new.puzzle')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toMenu}
          data-testid={`${testId}-menu-button`}
        >
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={styles.keys}>{t('keys')}</p>}
    </div>
  );
}
