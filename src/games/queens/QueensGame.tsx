/**
 * The Royal Regions table: a menu (grid size, new or daily puzzle, resume, watch the AI), the board
 * of colored regions (tap for ✕ then queen, or queen mode; drag to cross), clashes shown at once,
 * optional automatic crosses around queens, undo/redo, explained hints from the technique solver,
 * pause, and the technique AI in watch mode.
 */
import { Bot, Crown, Lightbulb, Pause, Play, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { SUDOKU_SOUNDS } from '../shared/sudoku/sounds';
import { logicMove, markOf } from './ai';
import {
  CROSS,
  EMPTY,
  QUEEN,
  SPECS,
  applyStep,
  attacked,
  clashes,
  hintStep,
  isValidQueensState,
  newQueens,
  redoMove,
  setMarks,
  undoMove,
  wrongCells,
  type QueensState,
  type Step,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Queens.module.css';

interface Saved {
  state: QueensState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';
type Tap = 'cycle' | 'queen';

const LEVELS = Object.keys(SPECS);
const SPEED_MS = 60_000;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function QueensGame({ services }: { services: GameServices }) {
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
          isValidQueensState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<QueensState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tap, setTap] = useState<Tap>('cycle');
  const [autoCross, setAutoCross] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<{ step: Step; cells: number[] } | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const drag = useRef<{ start: number; moved: boolean; cells: Set<number> } | null>(null);
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

  const start = (s: QueensState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setHint(null);
    setFlagged([]);
    setPaused(false);
    setCursor(0);
    setMessage(m === 'play' ? t('select.cell') : '');
    watchSteps.current = 0;
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };

  const begin = (m: Mode, lv: string, seed: number, isDaily: boolean) => {
    setBusy(true);
    window.setTimeout(() => {
      const s = newQueens(lv, seed);
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

  const n = state?.puzzle.size ?? 6;
  const cellName = (c: number) => t('cell', { r: Math.floor(c / n) + 1, c: (c % n) + 1 });
  const regionName = (g: number) => t(`region.${g}`);

  const solvedNow = (s: QueensState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SUDOKU_SOUNDS.solved);
    setMessage(t('solved', { time: formatTime(time), mistakes: s.mistakes, hints: s.hints }));
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (!s.mistakes && !s.hints) svc.unlockAchievement('clean');
    if (s.level === 'expert') svc.unlockAchievement('expert');
    if (s.level === 'medium' && time <= SPEED_MS && !s.hints) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: QueensState, sound: keyof typeof SUDOKU_SOUNDS) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    setFlagged([]);
    servicesRef.current.playSound(SUDOKU_SOUNDS[clashes(next).size ? 'wrong' : sound]);
    setState(next);
    setMessage(clashes(next).size ? t('clash') : '');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play' && !next.solved)
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
  };

  const active = mode === 'play' && !!state && !state.solved && !paused;

  /** Marks a cell; a queen with auto-cross also crosses the empty cells it attacks. */
  const mark = (cell: number, m: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    const set = [{ cell, mark: m }];
    if (m === QUEEN && autoCross)
      for (const x of attacked(s.puzzle, cell))
        if (s.marks[x] === EMPTY) set.push({ cell: x, mark: CROSS });
    commit(setMarks(s, set), m === QUEEN ? 'place' : m === CROSS ? 'note' : 'erase');
  };

  const cycle = (cell: number) => {
    const s = stateRef.current;
    if (!s) return;
    const now = s.marks[cell]!;
    const next =
      tap === 'queen'
        ? now === QUEEN
          ? EMPTY
          : QUEEN
        : now === EMPTY
          ? CROSS
          : now === CROSS
            ? QUEEN
            : EMPTY;
    mark(cell, next);
  };

  const cellAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const c = el instanceof HTMLElement ? el.closest<HTMLElement>('[data-cell]') : null;
    return c ? Number(c.dataset.cell) : null;
  };

  const onDown = (e: PointerEvent, cell: number) => {
    if (!active) return;
    setCursor(cell);
    drag.current = { start: cell, moved: false, cells: new Set([cell]) };
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    const s = stateRef.current;
    if (!d || !s || !active) return;
    const c = cellAt(e);
    if (c === null || d.cells.has(c)) return;
    if (!d.moved) {
      d.moved = true;
      // The drag starts by crossing the first cell too, when it is empty.
      if (s.marks[d.start] === EMPTY) d.cells.add(d.start);
    }
    d.cells.add(c);
    const set = [...d.cells]
      .filter((x) => stateRef.current!.marks[x] === EMPTY)
      .map((x) => ({ cell: x, mark: CROSS }));
    if (set.length) {
      commit(setMarks(stateRef.current!, set), 'note');
    }
  };

  const onUp = (cell: number) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || d.start !== cell) return;
    cycle(cell);
  };

  const unitName = (kind: 'row' | 'col' | 'region', i: number) =>
    kind === 'region'
      ? t('line.region', { region: regionName(i) })
      : t(`line.${kind}`, { n: i + 1 });

  const explain = (s: QueensState, step: Step) => {
    const list = (xs: string[]) =>
      xs.length > 1 ? `${xs.slice(0, -1).join(', ')}${t('and')}${xs[xs.length - 1]}` : xs[0]!;
    switch (step.technique) {
      case 'single':
        return step.kind === 'cell'
          ? t('hint.cross', { cell: cellName(step.at[0]!) })
          : t('hint.single', {
              unit: unitName(step.kind as 'row' | 'col' | 'region', step.at[0]!),
              cell: cellName(step.place[0]!),
            });
      case 'confined': {
        if (step.kind === 'region') {
          const g = step.at[0]!;
          const cells = s.puzzle.regions.flatMap((x, c) =>
            x === g && s.marks[c] !== CROSS ? [c] : [],
          );
          const rows = new Set(cells.map((c) => Math.floor(c / n)));
          const line =
            rows.size === 1
              ? t('line.row', { n: [...rows][0]! + 1 })
              : t('line.col', { n: (cells[0]! % n) + 1 });
          return t('hint.confinedRegion', { region: regionName(g), line });
        }
        const g = s.puzzle.regions[step.rule[0]!]!;
        return t('hint.confinedLine', {
          line: unitName(step.kind as 'row' | 'col', step.at[0]!),
          region: regionName(g),
        });
      }
      case 'group': {
        if (step.kind === 'region') {
          const rowsUsed = new Set(step.rule.map((c) => Math.floor(c / n)));
          const byRow =
            step.rule.every((c) => rowsUsed.has(Math.floor(c / n))) &&
            rowsUsed.size <= step.at.length;
          const lines = byRow
            ? [...rowsUsed].sort((a, b) => a - b).map((r) => t('line.row', { n: r + 1 }))
            : [...new Set(step.rule.map((c) => c % n))]
                .sort((a, b) => a - b)
                .map((k) => t('line.col', { n: k + 1 }));
          return t('hint.groupRegions', {
            regions: list(step.at.map(regionName)),
            lines: list(lines),
          });
        }
        const regions = [...new Set(step.rule.map((c) => s.puzzle.regions[c]!))];
        return t('hint.groupLines', {
          lines: list(step.at.map((i) => unitName(step.kind as 'row' | 'col', i))),
          regions: list(regions.map(regionName)),
        });
      }
      case 'attack':
        return t('hint.attack', {
          cell: cellName(step.at[0]!),
          unit: unitName(step.emptied!.kind, step.emptied!.index),
        });
    }
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(SUDOKU_SOUNDS.hint);
    const wrong = wrongCells(s);
    if (wrong.length) {
      setFlagged(wrong);
      setMessage(
        wrong.length === 1 ? t('hint.wrongCell') : t('hint.wrongCells', { n: wrong.length }),
      );
      return;
    }
    const step = hintStep(s);
    if (step) {
      const cells = [...step.place, ...step.rule, ...(step.kind === 'cell' ? step.at : [])];
      setHint({ step, cells });
      setMessage(explain(s, step));
      return;
    }
    const r = s.puzzle.solution.findIndex((k, row) => s.marks[row * n + k] !== QUEEN);
    const c = r * n + s.puzzle.solution[r]!;
    setHint({
      step: { technique: 'single', place: [c], rule: [], kind: 'cell', at: [c] },
      cells: [c],
    });
    setMessage(t('hint.none', { row: r + 1, cell: cellName(c) }));
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !hint || !active) return;
    const after = applyStep(s.marks, hint.step);
    const set = after.flatMap((m, c) => (m !== s.marks[c] ? [{ cell: c, mark: m }] : []));
    commit(setMarks(s, set, { hint: true }), 'place');
  };

  // Watch mode: the technique solver plays one mark every 0.35 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved || paused) return;
    const id = window.setTimeout(() => {
      const step = hintStep(state);
      const a = logicMove(state);
      const cell = Number(a.split(':')[0]);
      const next = setMarks(state, [{ cell, mark: markOf(a) }]);
      watchSteps.current++;
      if (step) {
        setHint({ step, cells: [cell] });
        setMessage(explain(state, step));
      }
      servicesRef.current.playSound(SUDOKU_SOUNDS[markOf(a) === QUEEN ? 'place' : 'note']);
      if (next.solved) {
        setHint(null);
        setMessage(t('watch.done', { steps: watchSteps.current }));
        servicesRef.current.playSound(SUDOKU_SOUNDS.solved);
      }
      setState(next);
    }, 350);
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
    const r = Math.floor(cursor / n);
    const c = cursor % n;
    const moveTo = (rr: number, cc: number) =>
      setCursor(Math.min(n - 1, Math.max(0, rr)) * n + Math.min(n - 1, Math.max(0, cc)));
    if (k === 'arrowup') moveTo(r - 1, c);
    else if (k === 'arrowdown') moveTo(r + 1, c);
    else if (k === 'arrowleft') moveTo(r, c - 1);
    else if (k === 'arrowright') moveTo(r, c + 1);
    else if (k === ' ' || k === 'enter') cycle(cursor);
    else if (k === 'q') mark(cursor, state.marks[cursor] === QUEEN ? EMPTY : QUEEN);
    else if (k === 'x') mark(cursor, state.marks[cursor] === CROSS ? EMPTY : CROSS);
    else if (k === 'backspace' || k === 'delete') mark(cursor, EMPTY);
    else if (k === 'u') commit(undoMove(state), 'erase');
    else if (k === 'r') commit(redoMove(state), 'place');
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
      <div className={shared.menu} data-testid="qn-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="qn-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.level}`),
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.marks.filter((m) => m === QUEEN).length) /
                        saved.state.puzzle.size,
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
                  data-testid={`qn-level-${d}`}
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
              data-testid="qn-start"
            >
              <Play size={16} /> {busy ? t('generating') : t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('play', level, today() * 10 + LEVELS.indexOf(level), true)}
              data-testid="qn-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="qn-watch"
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
  const clash = clashes(s);
  const flaggedSet = new Set(flagged);
  const pointed = new Set(hint?.cells ?? []);
  const hidden = paused && mode === 'play';
  const edge = (c: number, dr: number, dk: number) => {
    const r = Math.floor(c / n) + dr;
    const k = (c % n) + dk;
    return r < 0 || r >= n || k < 0 || k >= n || p.regions[r * n + k] !== p.regions[c];
  };

  return (
    <div className={shared.play} data-testid="queens">
      <div className={styles.bar}>
        <span className={styles.counter}>{t('time', { time: formatTime(elapsed) })}</span>
        <span className={styles.counter} data-testid="qn-queens">
          <Crown size={15} /> {s.marks.filter((m) => m === QUEEN).length}/{n}
        </span>
        <span className={styles.counter}>{t('mistakes', { n: s.mistakes })}</span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${hidden ? styles.hidden : ''}`}
          style={{ ['--n' as string]: n }}
          role="grid"
          aria-label={t('title')}
          data-testid="qn-board"
          onPointerMove={onMove}
          onPointerLeave={() => (drag.current = null)}
        >
          {s.marks.map((m, c) => (
            <button
              key={c}
              type="button"
              role="gridcell"
              className={[
                styles.cell,
                edge(c, -1, 0) ? styles.top : '',
                edge(c, 1, 0) ? styles.bottom : '',
                edge(c, 0, -1) ? styles.left : '',
                edge(c, 0, 1) ? styles.right : '',
                clash.has(c) ? styles.clash : '',
                flaggedSet.has(c) ? styles.flagged : '',
                pointed.has(c) ? styles.pointed : '',
                cursor === c && mode === 'play' && !s.solved ? styles.cursor : '',
              ].join(' ')}
              data-region={p.regions[c]}
              data-cell={c}
              data-mark={m}
              aria-label={t('cell.label', {
                cell: cellName(c),
                region: regionName(p.regions[c]!),
                state: t(`cell.state.${m}`),
              })}
              onPointerDown={(e) => onDown(e, c)}
              onPointerUp={() => onUp(c)}
            >
              {hidden ? null : m === QUEEN ? (
                <Crown className={styles.queen} size="62%" />
              ) : m === CROSS ? (
                <span className={styles.cross}>✕</span>
              ) : null}
            </button>
          ))}
          {hidden && (
            <button type="button" className={shared.pausedCover} onClick={() => setPaused(false)}>
              <Play size={28} /> {t('paused')}
            </button>
          )}
        </div>
      </div>
      <p className={shared.message} data-testid="qn-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && !s.solved && (
        <button type="button" className="btn btn-primary" onClick={applyHint} data-testid="qn-fill">
          {t('hint.fill')}
        </button>
      )}
      <div className={shared.controls}>
        {mode === 'play' && !s.solved && (
          <>
            <div className={shared.segmented}>
              {(['cycle', 'queen'] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={tap === x}
                  onClick={() => setTap(x)}
                  data-testid={`qn-tap-${x}`}
                >
                  {t(`tap.${x}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => commit(undoMove(s), 'erase')}
              disabled={!s.undo.length}
              data-testid="qn-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => commit(redoMove(s), 'place')}
              disabled={!s.redo.length}
              data-testid="qn-redo"
            >
              <Redo2 size={16} /> {t('redo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="qn-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setPaused((x) => !x)}
              aria-pressed={paused}
              data-testid="qn-pause"
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
            data-testid="qn-again"
          >
            <Play size={16} /> {t('new.puzzle')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="qn-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && !s.solved && (
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={autoCross}
            onChange={(e) => setAutoCross(e.target.checked)}
            data-testid="qn-auto"
          />
          {t('auto.cross')}
        </label>
      )}
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
