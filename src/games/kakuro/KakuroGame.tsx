/**
 * The Kakuro table: a menu (difficulty, new or daily puzzle, resume, watch the AI), the board with
 * clue cells and pencil marks, a number pad, the combinations of the selected cell's runs,
 * undo/redo, explained hints, a timer with pause, and the technique solver in watch mode.
 */
import { Bot, Eraser, Lightbulb, Pause, Pencil, Play, Redo2, RotateCcw, Undo2 } from 'lucide-react';
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
  DIFFICULTIES,
  badRuns,
  bit,
  combos,
  digitsOf,
  eraseCell,
  fillNotes,
  isValidKakuroState,
  newKakuro,
  placeDigit,
  redoMove,
  stepsToPlacement,
  toggleNote,
  undoMove,
  wrongCells,
  type KakuroState,
  type Step,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Kakuro.module.css';

interface Saved {
  state: KakuroState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';
const LEVELS = Object.keys(DIFFICULTIES);
const SPEED_MS = 10 * 60 * 1000;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function KakuroGame({ services }: GameProps) {
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
          isValidKakuroState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<KakuroState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [showMistakes, setShowMistakes] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<{ cell: number; digit: number; cells: number[] } | null>(null);
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
      const s = newKakuro(level, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  const start = (s: KakuroState, m: Mode, isDaily: boolean) => {
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

  const save = (s: KakuroState) => {
    if (mode === 'play' && !s.solved)
      void slot.save({ state: { ...s, elapsedMs: elapsedRef.current }, daily });
  };

  const solvedNow = (s: KakuroState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SUDOKU_SOUNDS.solved);
    setMessage(t('solved', { time: formatTime(time), mistakes: s.mistakes, hints: s.hints }));
    setSelected(null);
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.difficulty });
    svc.unlockAchievement('first');
    if (!s.mistakes && !s.hints) svc.unlockAchievement('clean');
    if (s.difficulty === 'hard') svc.unlockAchievement('hardest');
    if (s.difficulty === 'medium' && time <= SPEED_MS && !s.hints) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: KakuroState, sound: keyof typeof SUDOKU_SOUNDS = 'place') => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    setFlagged([]);
    const newWrong = next.mistakes > before.mistakes;
    servicesRef.current.playSound(SUDOKU_SOUNDS[newWrong && showMistakes ? 'wrong' : sound]);
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else save(next);
  };

  const myTurn = mode === 'play' && !!state && !state.solved && !paused;
  const cols = state?.puzzle.cols ?? 1;
  const cellName = (c: number) => t('cell', { r: Math.floor(c / cols), c: c % cols });
  const runsAt = (s: KakuroState, c: number) => s.puzzle.runs.filter((r) => r.cells.includes(c));

  const enter = (digit: number, asNote = notesMode) => {
    const s = stateRef.current;
    if (!s || !myTurn || selected === null || !s.puzzle.white[selected]) return;
    if (s.puzzle.given[selected]) {
      servicesRef.current.playSound(SUDOKU_SOUNDS.invalid);
      setMessage(t('cell.given', { cell: cellName(selected) }));
      return;
    }
    if (asNote) commit(toggleNote(s, selected, digit), 'note');
    else commit(placeDigit(s, selected, digit), 'place');
  };

  const explain = (s: KakuroState, steps: Step[]) => {
    const last = steps.at(-1)!;
    const { cell, digit } = last.place!;
    const runs = runsAt(s, cell);
    const across = runs.find((r) => r.across)?.sum ?? 0;
    const down = runs.find((r) => !r.across)?.sum ?? 0;
    const run = s.puzzle.runs[last.runs[0]!]!;
    const text =
      last.technique === 'single'
        ? t('hint.single', { cell: cellName(cell), digit, across, down })
        : t('hint.hidden', {
            dir: t(run.across ? 'across' : 'down'),
            sum: run.sum,
            digit,
            cell: cellName(cell),
          });
    const before = [...new Set(steps.slice(0, -1).map((x) => t(`tech.${x.technique}`)))];
    return before.length ? `${t('hint.before', { techniques: before.join(', ') })} ${text}` : text;
  };

  const stepCells = (s: KakuroState, steps: Step[]) => [
    ...new Set(steps.slice(-3).flatMap((x) => x.runs.flatMap((r) => s.puzzle.runs[r]!.cells))),
  ];

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    servicesRef.current.playSound(SUDOKU_SOUNDS.hint);
    const wrong = wrongCells(s).filter((c) => !s.puzzle.given[c]);
    if (wrong.length) {
      setFlagged(wrong);
      setHint(null);
      setSelected(wrong[0]!);
      setMessage(
        wrong.length === 1
          ? t('hint.wrong', { digit: s.values[wrong[0]!]! })
          : t('hint.wrongMany', { n: wrong.length }),
      );
      return;
    }
    const steps = stepsToPlacement(s.puzzle, s.values);
    if (steps) {
      const { cell, digit } = steps.at(-1)!.place!;
      setHint({ cell, digit, cells: stepCells(s, steps) });
      setSelected(cell);
      setMessage(explain(s, steps));
    } else {
      const cell = s.puzzle.white.findIndex((w, c) => w && !s.values[c]);
      const digit = s.puzzle.solution[cell]!;
      setHint({ cell, digit, cells: [cell] });
      setSelected(cell);
      setMessage(t('hint.guess', { cell: cellName(cell), digit }));
    }
  };

  const fillHint = () => {
    const s = stateRef.current;
    if (!s || !hint) return;
    commit(placeDigit(s, hint.cell, hint.digit, { hint: true }), 'place');
  };

  useEffect(() => {
    if (mode !== 'watch' || !state || paused || state.solved) return;
    const id = window.setTimeout(() => {
      const steps = stepsToPlacement(state.puzzle, state.values);
      let next: KakuroState;
      if (steps) {
        const { cell, digit } = steps.at(-1)!.place!;
        next = placeDigit(state, cell, digit);
        setMessage(t('watch.step', { text: explain(state, steps) }));
        setHint({ cell, digit, cells: stepCells(state, steps) });
        setSelected(cell);
      } else {
        const cell = state.puzzle.white.findIndex((w, c) => w && !state.values[c]);
        const digit = state.puzzle.solution[cell]!;
        next = placeDigit(state, cell, digit);
        setMessage(t('watch.step', { text: t('hint.guess', { cell: cellName(cell), digit }) }));
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

  /** Moves to the next white cell in a direction (skipping clue cells). */
  const move = (dr: number, dc: number) => {
    const s = stateRef.current;
    if (!s) return;
    const { rows } = s.puzzle;
    let c = selected ?? s.puzzle.white.findIndex(Boolean);
    for (let i = 0; i < Math.max(rows, cols); i++) {
      const r = Math.floor(c / cols) + dr;
      const k = (c % cols) + dc;
      if (r < 0 || k < 0 || r >= rows || k >= cols) return;
      c = r * cols + k;
      if (s.puzzle.white[c]) {
        setSelected(c);
        return;
      }
    }
  };

  const togglePause = () => {
    setPaused((p) => !p);
    const s = stateRef.current;
    if (s) save(s);
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
      const d = /^Digit([1-9])$/.exec(e.code)?.[1] ?? /^Numpad([1-9])$/.exec(e.code)?.[1];
      if (!d) return false;
      enter(Number(d), notesMode !== e.shiftKey);
    }
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
      <div className={shared.menu} data-testid="kakuro-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="kakuro-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.difficulty}`),
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.values.filter((x) => x).length) /
                        saved.state.puzzle.white.filter(Boolean).length,
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
                  data-testid={`kakuro-difficulty-${d}`}
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
              data-testid="kakuro-start"
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
              data-testid="kakuro-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="kakuro-watch"
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
  const p = s.puzzle;
  const bad = badRuns(s);
  const badCells = new Set([...bad].flatMap((i) => p.runs[i]!.cells));
  const badClues = new Set(
    [...bad].map((i) => `${p.runs[i]!.clue}:${p.runs[i]!.across ? 'a' : 'd'}`),
  );
  const wrong = new Set(showMistakes || mode === 'watch' ? wrongCells(s) : []);
  const flaggedSet = new Set(flagged);
  const selectedRuns = selected !== null ? runsAt(s, selected) : [];
  const peers = new Set(selectedRuns.flatMap((r) => r.cells));
  const pointed = new Set(hint?.cells ?? []);
  const hidden = paused && mode === 'play';
  const clueOf = new Map<number, { across?: number; down?: number }>();
  for (const run of p.runs) {
    const entry = clueOf.get(run.clue) ?? {};
    if (run.across) entry.across = run.sum;
    else entry.down = run.sum;
    clueOf.set(run.clue, entry);
  }
  // The combinations still open for the selected cell's runs.
  const comboLines = selectedRuns.map((run) => {
    const placed = run.cells.reduce((m, c) => (s.values[c] ? m | bit(s.values[c]!) : m), 0);
    const sets = combos(run.cells.length, run.sum).filter((m) => (m & placed) === placed);
    return t('combo.line', {
      dir: t(run.across ? 'across' : 'down'),
      sum: run.sum,
      n: run.cells.length,
      sets: sets.length ? sets.map((m) => digitsOf(m).join('')).join(' · ') : t('combo.none'),
    });
  });

  return (
    <div className={shared.play} data-testid="kakuro">
      <div className={shared.bar}>
        <span data-testid="kakuro-difficulty">{t(`difficulty.${s.difficulty}`)}</span>
        {mode === 'play' && (
          <>
            <span data-testid="kakuro-time">{t('time', { time: formatTime(elapsed) })}</span>
            <span>{t('mistakes', { n: s.mistakes })}</span>
            <span>{t('hints', { n: s.hints })}</span>
          </>
        )}
      </div>
      <div
        className={`${styles.board} ${hidden ? styles.hidden : ''}`}
        style={{ ['--rows' as string]: p.rows, ['--cols' as string]: p.cols }}
        role="grid"
        aria-label={t('title')}
        data-testid="kakuro-board"
      >
        {p.white.map((w, c) => {
          if (!w) {
            const clue = clueOf.get(c);
            return (
              <div
                key={c}
                className={styles.clue}
                role="gridcell"
                aria-label={
                  clue
                    ? t('clue.label', {
                        parts: [
                          clue.across !== undefined
                            ? t('run.label', { dir: t('across'), sum: clue.across })
                            : '',
                          clue.down !== undefined
                            ? t('run.label', { dir: t('down'), sum: clue.down })
                            : '',
                        ]
                          .filter(Boolean)
                          .join(', '),
                      })
                    : undefined
                }
              >
                {clue && (
                  <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
                    <line x1="0" y1="0" x2="1" y2="1" />
                    {clue.across !== undefined && (
                      <text
                        x="0.93"
                        y="0.4"
                        textAnchor="end"
                        className={badClues.has(`${c}:a`) ? styles.badSum : ''}
                      >
                        {clue.across}
                      </text>
                    )}
                    {clue.down !== undefined && (
                      <text
                        x="0.07"
                        y="0.9"
                        className={badClues.has(`${c}:d`) ? styles.badSum : ''}
                      >
                        {clue.down}
                      </text>
                    )}
                  </svg>
                )}
              </div>
            );
          }
          const v = s.values[c]!;
          const notes = digitsOf(s.notes[c]!);
          const classes = [
            styles.cell,
            p.given[c] ? styles.given : styles.entered,
            peers.has(c) ? styles.peer : '',
            pointed.has(c) ? styles.pointed : '',
            selected === c ? styles.selected : '',
            wrong.has(c) || flaggedSet.has(c) || (badCells.has(c) && v) ? styles.wrong : '',
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
                    ? String(v)
                    : notes.length
                      ? t('cell.notes', { notes: notes.join(' ') })
                      : t('cell.empty'),
              })}
              data-cell={c}
            >
              {hidden ? null : v ? (
                <span className={styles.digit}>{v}</span>
              ) : notes.length ? (
                <span className={styles.notes}>
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i}>{s.notes[c]! & bit(i + 1) ? i + 1 : ''}</span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
        {hidden && (
          <button type="button" className={shared.pausedCover} onClick={togglePause}>
            <Play size={28} /> {t('paused')}
          </button>
        )}
      </div>
      {mode === 'play' && !s.solved && (
        <p className={styles.combos} data-testid="kakuro-combos">
          {comboLines.join(' — ')}
        </p>
      )}
      <p className={shared.message} data-testid="kakuro-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={fillHint}
          data-testid="kakuro-fill"
        >
          {t('hint.fill')}
        </button>
      )}
      {mode === 'play' && !s.solved && (
        <>
          <div className={shared.pad} style={{ ['--pad' as string]: 9 }} data-testid="kakuro-pad">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                type="button"
                className={shared.key}
                disabled={!myTurn}
                onClick={() => enter(d)}
                aria-label={String(d)}
                data-testid={`kakuro-digit-${d}`}
              >
                <span>{d}</span>
              </button>
            ))}
          </div>
          <div className={shared.tools}>
            <button
              type="button"
              className={`btn ${notesMode ? 'btn-primary' : ''}`}
              aria-pressed={notesMode}
              onClick={() => setNotesMode((x) => !x)}
              data-testid="kakuro-notes"
            >
              <Pencil size={16} /> {t(notesMode ? 'notes.on' : 'notes')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn || selected === null}
              onClick={() => selected !== null && commit(eraseCell(s, selected), 'erase')}
              data-testid="kakuro-erase"
            >
              <Eraser size={16} /> {t('erase')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn || !s.undo.length}
              onClick={() => commit(undoMove(s), 'erase')}
              data-testid="kakuro-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn || !s.redo.length}
              onClick={() => commit(redoMove(s), 'place')}
              data-testid="kakuro-redo"
            >
              <Redo2 size={16} /> {t('redo')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn}
              onClick={showHint}
              data-testid="kakuro-hint"
            >
              <Lightbulb size={16} /> {t('hint')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!myTurn}
              onClick={() => commit(fillNotes(s), 'note')}
              data-testid="kakuro-fill-notes"
            >
              {t('fill.notes')}
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
        </>
      )}
      <div className={shared.controls}>
        {mode === 'play' && !s.solved && (
          <button type="button" className="btn" onClick={togglePause} data-testid="kakuro-pause">
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
            data-testid="kakuro-again"
          >
            {t('new.puzzle')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toMenu}
          data-testid="kakuro-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.keys}>{t('keys')}</p>}
    </div>
  );
}
