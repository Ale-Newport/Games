/**
 * The Nonogram table: a menu (random size or a picture, daily puzzle, resume, watch the AI), the
 * grid with its clues, fill/cross painting by tap or drag (locked to a row or column), finished
 * clues dimmed, undo/redo, explained hints, a timer with pause, and the line solver in watch mode.
 */
import { Bot, Lightbulb, Pause, Play, Redo2, RotateCcw, Undo2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, pickText } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { SUDOKU_SOUNDS } from '../shared/sudoku/sounds';
import {
  DIFFICULTIES,
  EMPTY,
  FILLED,
  UNKNOWN,
  colOf,
  hintStep,
  isValidNonoState,
  lineDone,
  newNonogram,
  nextLineStep,
  redoMove,
  rowOf,
  setCells,
  setValues,
  undoMove,
  wrongCells,
  type Cell,
  type LineStep,
  type NonoState,
} from './engine';
import { STRINGS } from './i18n';
import { PICTURES } from './pictures';
import styles from './Nonogram.module.css';

interface Saved {
  state: NonoState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';
const LEVELS = Object.keys(DIFFICULTIES);
const SPEED_MS = 5 * 60 * 1000;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** A drag in progress: what it paints, where it started, and the cells so far. */
interface Stroke {
  value: Cell;
  start: number;
  axis: 'row' | 'col' | null;
  cells: number[];
}

export function NonogramGame({ services }: GameProps) {
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
          isValidNonoState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [kind, setKind] = useState<'random' | 'pictures'>('random');
  const [difficulty, setDifficulty] = useState('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<NonoState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [tool, setTool] = useState<'fill' | 'cross'>('fill');
  const [showMistakes, setShowMistakes] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<LineStep | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [stroke, setStroke] = useState<Stroke | null>(null);
  const strokeRef = useLatest(stroke);
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

  const begin = (m: Mode, k: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newNonogram(k, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  const start = (s: NonoState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    if (!s.kind.startsWith('picture:')) setDifficulty(s.kind);
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

  const save = (s: NonoState) => {
    if (mode === 'play' && !s.solved)
      void slot.save({ state: { ...s, elapsedMs: elapsedRef.current }, daily });
  };

  const pictureName = (s: NonoState) => {
    const pic = PICTURES.find((p) => p.id === s.puzzle.picture);
    return pic ? pickText(pic.name, locale) : null;
  };

  const solvedNow = (s: NonoState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SUDOKU_SOUNDS.solved);
    const name = pictureName(s);
    setMessage(
      name
        ? t('solved.picture', { name, time: formatTime(time) })
        : t('solved', { time: formatTime(time), mistakes: s.mistakes, hints: s.hints }),
    );
    setSelected(null);
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.kind });
    svc.unlockAchievement('first');
    if (!s.mistakes && !s.hints) svc.unlockAchievement('clean');
    if (s.puzzle.rows >= 15) svc.unlockAchievement('hardest');
    if (s.kind === 'medium' && time <= SPEED_MS && !s.hints) svc.unlockAchievement('speed');
    if (name) {
      svc.unlockAchievement('picture');
      const modes = svc.getStats()?.modes ?? {};
      if (PICTURES.every((p) => (modes[`picture:${p.id}`]?.completions ?? 0) > 0))
        svc.unlockAchievement('gallery');
    }
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: NonoState, sound: keyof typeof SUDOKU_SOUNDS) => {
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
  const rows = state?.puzzle.rows ?? 10;
  const cols = state?.puzzle.cols ?? 10;
  const cellName = (c: number) => t('cell', { r: Math.floor(c / cols) + 1, c: (c % cols) + 1 });

  // ---- painting
  const valueFor = (now: Cell): Cell => {
    const paint = tool === 'fill' ? FILLED : EMPTY;
    return now === paint ? UNKNOWN : paint;
  };
  const cellAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell]');
    return el ? Number(el.getAttribute('data-cell')) : null;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    const c = cellAt(e);
    if (c === null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const value = e.button === 2 ? (s.grid[c] === EMPTY ? UNKNOWN : EMPTY) : valueFor(s.grid[c]!);
    setSelected(c);
    setStroke({ value, start: c, axis: null, cells: [c] });
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const st = strokeRef.current;
    if (!st) return;
    const c = cellAt(e);
    if (c === null || st.cells.includes(c)) return;
    const sr = Math.floor(st.start / cols);
    const sc = st.start % cols;
    const axis = st.axis ?? (Math.floor(c / cols) === sr ? 'row' : c % cols === sc ? 'col' : null);
    if (!axis) return;
    // Keep the stroke on its line, filling every cell between the start and here.
    const target = axis === 'row' ? sr * cols + (c % cols) : Math.floor(c / cols) * cols + sc;
    const a = axis === 'row' ? sc : sr;
    const b = axis === 'row' ? target % cols : Math.floor(target / cols);
    const cells = Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => {
      const k = Math.min(a, b) + i;
      return axis === 'row' ? sr * cols + k : k * cols + sc;
    });
    setStroke({ ...st, axis, cells });
    setSelected(target);
  };
  const onUp = () => {
    const st = strokeRef.current;
    const s = stateRef.current;
    setStroke(null);
    if (!st || !s) return;
    commit(
      setCells(s, st.cells, st.value),
      st.value === FILLED ? 'place' : st.value === EMPTY ? 'note' : 'erase',
    );
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    servicesRef.current.playSound(SUDOKU_SOUNDS.hint);
    const wrong = wrongCells(s);
    if (wrong.length) {
      setFlagged(wrong);
      setHint(null);
      setMessage(
        wrong.length === 1 ? t('hint.wrongCell') : t('hint.wrongCells', { n: wrong.length }),
      );
      return;
    }
    const step = hintStep(s);
    if (!step) return;
    setHint(step);
    setMessage(explain(s, step));
  };

  const explain = (s: NonoState, step: LineStep) => {
    const clue = (step.row ? s.puzzle.rowClues : s.puzzle.colClues)[step.index]!;
    return t('hint.line', {
      line: t(step.row ? 'hint.row' : 'hint.col', { n: step.index + 1 }),
      clue: clue.length ? clue.join(' ') : '0',
      n: step.set.length,
    });
  };

  const fillHint = () => {
    const s = stateRef.current;
    if (!s || !hint) return;
    commit(setValues(s, hint.set, { hint: true }), 'place');
  };

  useEffect(() => {
    if (mode !== 'watch' || !state || paused || state.solved) return;
    const id = window.setTimeout(() => {
      const step = nextLineStep(state.puzzle, state.grid);
      if (!step) return;
      const next = setValues(state, step.set);
      setHint(step);
      setMessage(t('watch.step', { text: explain(state, step) }));
      watchSteps.current++;
      servicesRef.current.playSound(SUDOKU_SOUNDS.place);
      if (next.solved) {
        setHint(null);
        setMessage(t('watch.done', { steps: watchSteps.current }));
        servicesRef.current.playSound(SUDOKU_SOUNDS.solved);
      }
      setState(next);
    }, 800);
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
    const r = Math.min(rows - 1, Math.max(0, Math.floor(c / cols) + dr));
    const k = Math.min(cols - 1, Math.max(0, (c % cols) + dc));
    setSelected(r * cols + k);
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
    else if (k === 'Enter' && hint) fillHint();
    else if (k === ' ' && selected !== null)
      commit(
        setCells(state, [selected], state.grid[selected] === FILLED ? UNKNOWN : FILLED),
        'place',
      );
    else if (lower === 'x' && selected !== null)
      commit(setCells(state, [selected], state.grid[selected] === EMPTY ? UNKNOWN : EMPTY), 'note');
    else if ((k === 'Backspace' || k === 'Delete') && selected !== null)
      commit(setCells(state, [selected], UNKNOWN), 'erase');
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
    const modes = services.getStats()?.modes ?? {};
    const stats = modes[difficulty];
    return (
      <div className={shared.menu} data-testid="nono-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="nono-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: `${saved.state.puzzle.rows}×${saved.state.puzzle.cols}`,
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.grid.filter((x) => x).length) / saved.state.grid.length,
                    ),
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.kind')}</legend>
            <div className={shared.segmented}>
              {(['random', 'pictures'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  data-testid={`nono-kind-${k}`}
                >
                  {t(`menu.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>
          {kind === 'random' ? (
            <>
              <fieldset className={shared.group}>
                <legend>{t('menu.size')}</legend>
                <div className={shared.segmented}>
                  {LEVELS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={difficulty === d}
                      onClick={() => setDifficulty(d)}
                      data-testid={`nono-difficulty-${d}`}
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
                  data-testid="nono-start"
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
                  data-testid="nono-daily"
                >
                  {t('menu.daily')}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => begin('watch', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
                  data-testid="nono-watch"
                >
                  <Bot size={16} /> {t('menu.watch')}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.gallery} data-testid="nono-gallery">
              {PICTURES.map((pic) => {
                const size = `${pic.art.length}×${pic.art[0]!.length}`;
                const done = (modes[`picture:${pic.id}`]?.completions ?? 0) > 0;
                return (
                  <button
                    key={pic.id}
                    type="button"
                    className={styles.thumb}
                    onClick={() => begin('play', `picture:${pic.id}`, 1, false)}
                    data-testid={`nono-picture-${pic.id}`}
                  >
                    <span className={styles.mini} style={{ ['--c' as string]: pic.art[0]!.length }}>
                      {pic.art
                        .join('')
                        .split('')
                        .map((ch, i) => (
                          <i key={i} className={done && ch === '#' ? styles.on : ''} />
                        ))}
                    </span>
                    <small>
                      {done
                        ? t('menu.picture', { name: pickText(pic.name, locale), size })
                        : t('menu.unknown', { size })}
                    </small>
                  </button>
                );
              })}
            </div>
          )}
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
  const shown = [...s.grid];
  if (stroke) for (const c of stroke.cells) shown[c] = stroke.value;
  const wrong = new Set(showMistakes || mode === 'watch' ? wrongCells(s) : []);
  const flaggedSet = new Set(flagged);
  const hintCells = new Set(hint?.set.map((x) => x.cell) ?? []);
  const hintLine = hint ? `${hint.row ? 'r' : 'c'}${hint.index}` : '';
  const leftWidth = Math.max(1, ...p.rowClues.map((c) => c.length)) * 0.62 + 0.3;
  const topHeight = Math.max(1, ...p.colClues.map((c) => c.length)) * 0.62 + 0.3;
  const hidden = paused && mode === 'play';
  const selRow = selected !== null ? Math.floor(selected / cols) : -1;
  const selCol = selected !== null ? selected % cols : -1;

  return (
    <div className={shared.play} data-testid="nono">
      <div className={shared.bar}>
        <span data-testid="nono-size">{`${p.rows}×${p.cols}`}</span>
        {mode === 'play' && (
          <>
            <span data-testid="nono-time">{t('time', { time: formatTime(elapsed) })}</span>
            <span>{t('mistakes', { n: s.mistakes })}</span>
            <span>{t('hints', { n: s.hints })}</span>
          </>
        )}
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${hidden ? styles.hidden : ''} ${s.solved ? styles.done : ''}`}
          style={{
            ['--rows' as string]: p.rows,
            ['--cols' as string]: p.cols,
            ['--lw' as string]: leftWidth,
            ['--th' as string]: topHeight,
          }}
          role="grid"
          aria-label={t('title')}
          data-testid="nono-board"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className={styles.corner} />
          {p.colClues.map((clue, c) => (
            <div
              key={`c${c}`}
              className={`${styles.colClue} ${lineDone(clue, colOf(s.grid, p.rows, p.cols, c)) ? styles.clueDone : ''} ${hintLine === `c${c}` ? styles.clueHint : ''} ${selCol === c ? styles.clueSel : ''}`}
            >
              {(clue.length ? clue : [0]).map((x, i) => (
                <span key={i}>{x}</span>
              ))}
            </div>
          ))}
          {Array.from({ length: p.rows }, (_, r) => (
            <div key={`r${r}`} className={styles.rowGroup}>
              <div
                className={`${styles.rowClue} ${lineDone(p.rowClues[r]!, rowOf(s.grid, p.cols, r)) ? styles.clueDone : ''} ${hintLine === `r${r}` ? styles.clueHint : ''} ${selRow === r ? styles.clueSel : ''}`}
              >
                {(p.rowClues[r]!.length ? p.rowClues[r]! : [0]).map((x, i) => (
                  <span key={i}>{x}</span>
                ))}
              </div>
              {Array.from({ length: p.cols }, (_, k) => {
                const c = r * p.cols + k;
                const v = hidden ? UNKNOWN : shown[c]!;
                return (
                  <div
                    key={c}
                    role="gridcell"
                    className={[
                      styles.cell,
                      v === FILLED ? styles.filled : v === EMPTY ? styles.crossed : '',
                      (k + 1) % 5 === 0 && k < p.cols - 1 ? styles.thickR : '',
                      (r + 1) % 5 === 0 && r < p.rows - 1 ? styles.thickB : '',
                      hintCells.has(c) ? styles.pointed : '',
                      selected === c ? styles.selected : '',
                      wrong.has(c) || flaggedSet.has(c) ? styles.wrong : '',
                    ].join(' ')}
                    aria-label={t('cell.nono', { cell: cellName(c), state: t(`cell.state.${v}`) })}
                    data-cell={c}
                    data-value={v}
                  >
                    {v === EMPTY && <X size="60%" strokeWidth={2.5} />}
                  </div>
                );
              })}
            </div>
          ))}
          {hidden && (
            <button type="button" className={shared.pausedCover} onClick={togglePause}>
              <Play size={28} /> {t('paused')}
            </button>
          )}
        </div>
      </div>
      <p className={shared.message} data-testid="nono-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={fillHint}
          data-testid="nono-fill"
        >
          {t('hint.fill')}
        </button>
      )}
      {mode === 'play' && !s.solved && (
        <div className={shared.tools}>
          <div className={shared.segmented}>
            {(['fill', 'cross'] as const).map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={tool === x}
                onClick={() => setTool(x)}
                data-testid={`nono-tool-${x}`}
              >
                {t(x)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            disabled={!myTurn || !s.undo.length}
            onClick={() => commit(undoMove(s), 'erase')}
            data-testid="nono-undo"
          >
            <Undo2 size={16} /> {t('undo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn || !s.redo.length}
            onClick={() => commit(redoMove(s), 'place')}
            data-testid="nono-redo"
          >
            <Redo2 size={16} /> {t('redo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn}
            onClick={showHint}
            data-testid="nono-hint"
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
          <button type="button" className="btn" onClick={togglePause} data-testid="nono-pause">
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        {mode === 'watch' && !s.solved && (
          <button type="button" className="btn" onClick={() => setPaused((x) => !x)}>
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        {s.solved && !s.kind.startsWith('picture:') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              begin(mode === 'watch' ? 'watch' : 'play', s.kind, randomSeed() >>> 0, false)
            }
            data-testid="nono-again"
          >
            {t('new.puzzle')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toMenu}
          data-testid="nono-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.keys}>{t('keys')}</p>}
    </div>
  );
}
