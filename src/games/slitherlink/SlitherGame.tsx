/**
 * The Slitherlink table: a menu (size, new or daily puzzle, resume, watch the AI), the dotted grid
 * where a tap draws, crosses or clears an edge and a drag draws from dot to dot, broken numbers
 * shown live, undo/redo, explained hints, a timer with pause, and the technique solver in watch mode.
 */
import { Bot, Lightbulb, Pause, Play, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { SUDOKU_SOUNDS } from '../shared/sudoku/sounds';
import {
  CROSS,
  DIFFICULTIES,
  LINE,
  UNKNOWN,
  countSolutions,
  cycleEdge,
  geometry,
  isValidSlitherState,
  newSlither,
  nextStep,
  redoMove,
  ruleBreaks,
  setEdges,
  undoMove,
  wrongEdges,
  type Edge,
  type SlitherState,
  type Step,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Slitherlink.module.css';

interface Saved {
  state: SlitherState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';
type Tap = 'cycle' | 'line' | 'cross';
const LEVELS = Object.keys(DIFFICULTIES);
const SPEED_MS = 5 * 60 * 1000;
const PAD = 0.5;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** A drag along the dots. */
interface Stroke {
  vertex: number;
  value: Edge;
  edges: number[];
  moved: boolean;
  x: number;
  y: number;
}

export function SlitherGame({ services }: GameProps) {
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
          isValidSlitherState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SlitherState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tap, setTap] = useState<Tap>('cycle');
  const [showMistakes, setShowMistakes] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<Step | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [stroke, setStroke] = useState<Stroke | null>(null);
  const strokeRef = useLatest(stroke);
  const svgRef = useRef<SVGSVGElement>(null);
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
      const s = newSlither(level, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  const start = (s: SlitherState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setDifficulty(s.difficulty);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
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

  const save = (s: SlitherState) => {
    if (mode === 'play' && !s.solved)
      void slot.save({ state: { ...s, elapsedMs: elapsedRef.current }, daily });
  };

  const solvedNow = (s: SlitherState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SUDOKU_SOUNDS.solved);
    setMessage(t('solved', { time: formatTime(time), mistakes: s.mistakes, hints: s.hints }));
    svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.difficulty });
    svc.unlockAchievement('first');
    if (!s.mistakes && !s.hints) svc.unlockAchievement('clean');
    if (s.difficulty === 'expert') svc.unlockAchievement('hardest');
    if (s.difficulty === 'hard' && time <= SPEED_MS && !s.hints) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: SlitherState, sound: keyof typeof SUDOKU_SOUNDS) => {
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
  const rows = state?.puzzle.rows ?? 5;
  const cols = state?.puzzle.cols ?? 5;
  const geo = geometry(rows, cols);
  const cellName = (c: number) => t('cell', { r: Math.floor(c / cols) + 1, c: (c % cols) + 1 });

  // ---- pointer input in grid units
  const toGrid = (e: PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * (cols + 2 * PAD) - PAD,
      y: ((e.clientY - r.top) / r.height) * (rows + 2 * PAD) - PAD,
    };
  };
  const vertexAt = (x: number, y: number, reach: number) => {
    const c = Math.round(x);
    const r = Math.round(y);
    if (r < 0 || c < 0 || r > rows || c > cols) return -1;
    return Math.hypot(x - c, y - r) <= reach ? r * (cols + 1) + c : -1;
  };
  const edgeAt = (x: number, y: number) => {
    const H = (rows + 1) * cols;
    const hr = Math.round(y);
    const hc = Math.floor(x);
    const vc = Math.round(x);
    const vr = Math.floor(y);
    const dh = Math.abs(y - hr);
    const dv = Math.abs(x - vc);
    const hOk = hr >= 0 && hr <= rows && hc >= 0 && hc < cols;
    const vOk = vc >= 0 && vc <= cols && vr >= 0 && vr < rows;
    if (hOk && (!vOk || dh <= dv)) return hr * cols + hc;
    if (vOk) return H + vr * (cols + 1) + vc;
    return -1;
  };
  const edgeBetween = (a: number, b: number) =>
    geo.vertexEdges[a]!.find((e) => geo.vertexEdges[b]!.includes(e)) ?? -1;

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toGrid(e);
    setStroke({ vertex: vertexAt(x, y, 0.42), value: LINE, edges: [], moved: false, x, y });
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const st = strokeRef.current;
    const s = stateRef.current;
    if (!st || !s || st.vertex < 0) return;
    const { x, y } = toGrid(e);
    const v = vertexAt(x, y, 0.35);
    if (v < 0 || v === st.vertex) return;
    const edge = edgeBetween(st.vertex, v);
    if (edge < 0) return;
    // A drag that starts on a drawn line erases along its way.
    const value = st.edges.length ? st.value : s.edges[edge] === LINE ? UNKNOWN : LINE;
    setStroke({ ...st, vertex: v, value, edges: [...st.edges, edge], moved: true });
  };
  const onUp = () => {
    const st = strokeRef.current;
    const s = stateRef.current;
    setStroke(null);
    if (!st || !s) return;
    if (st.edges.length) {
      commit(
        setEdges(
          s,
          st.edges.map((edge) => ({ edge, value: st.value })),
        ),
        st.value === LINE ? 'place' : 'erase',
      );
      return;
    }
    const edge = edgeAt(st.x, st.y);
    if (edge < 0) return;
    const now = s.edges[edge]!;
    const value: Edge =
      tap === 'cycle'
        ? cycleEdge(now)
        : tap === 'line'
          ? now === LINE
            ? UNKNOWN
            : LINE
          : now === CROSS
            ? UNKNOWN
            : CROSS;
    commit(
      setEdges(s, [{ edge, value }]),
      value === LINE ? 'place' : value === CROSS ? 'note' : 'erase',
    );
  };

  const explain = (s: SlitherState, step: Step) => {
    if (step.technique === 'cell-count')
      return t(step.set[0]!.value === LINE ? 'hint.cell-count.line' : 'hint.cell-count.cross', {
        n: s.puzzle.clues[step.at]!,
        cell: cellName(step.at),
      });
    if (step.technique === 'loop') return t('hint.loop');
    if (step.set[0]!.value === LINE) return t('hint.vertex.go');
    const lines = geo.vertexEdges[step.at]!.filter((e) => s.edges[e] === LINE).length;
    return t(lines === 2 ? 'hint.vertex.full' : 'hint.vertex.dead');
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    servicesRef.current.playSound(SUDOKU_SOUNDS.hint);
    const wrong = wrongEdges(s);
    if (wrong.length) {
      setFlagged(wrong);
      setHint(null);
      setMessage(
        wrong.length === 1 ? t('hint.wrongEdge') : t('hint.wrongEdges', { n: wrong.length }),
      );
      return;
    }
    const step = nextStep(geo, s.puzzle.clues, s.edges);
    if (step) {
      setHint(step);
      setMessage(explain(s, step));
    } else {
      const edge = s.edges.indexOf(UNKNOWN);
      const value = s.puzzle.solution[edge] ? LINE : CROSS;
      setHint({ technique: 'vertex', at: -1, set: [{ edge, value }] });
      setMessage(
        t('hint.guess', { what: t(value === LINE ? 'hint.guess.line' : 'hint.guess.cross') }),
      );
    }
  };

  const fillHint = () => {
    const s = stateRef.current;
    if (!s || !hint) return;
    commit(setEdges(s, hint.set, { hint: true }), 'place');
  };

  useEffect(() => {
    if (mode !== 'watch' || !state || paused || state.solved) return;
    const id = window.setTimeout(() => {
      let step = nextStep(geo, state.puzzle.clues, state.edges);
      let text: string;
      if (step) text = explain(state, step);
      else {
        const truth = countSolutions(geo, state.puzzle.clues, 1).first ?? state.puzzle.solution;
        const edge = state.edges.indexOf(UNKNOWN);
        step = { technique: 'vertex', at: -1, set: [{ edge, value: truth[edge] ? LINE : CROSS }] };
        text = t('hint.guess', { what: t(truth[edge] ? 'hint.guess.line' : 'hint.guess.cross') });
      }
      const next = setEdges(state, step.set);
      setHint(step);
      setMessage(t('watch.step', { text }));
      watchSteps.current++;
      servicesRef.current.playSound(SUDOKU_SOUNDS.place);
      if (next.solved) {
        setHint(null);
        setMessage(t('watch.done', { steps: watchSteps.current }));
        servicesRef.current.playSound(SUDOKU_SOUNDS.solved);
      }
      setState(next);
    }, 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state, paused]);

  const togglePause = () => {
    setPaused((p) => !p);
    const s = stateRef.current;
    if (s) save(s);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const lower = e.key.toLowerCase();
    if (lower === 'p') {
      if (!state.solved) togglePause();
      return true;
    }
    if (!myTurn) return false;
    if (lower === 'enter' && hint) fillHint();
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
      <div className={shared.menu} data-testid="slither-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="slither-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.difficulty}`),
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.edges.filter((x) => x).length) / saved.state.edges.length,
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
                  data-testid={`slither-difficulty-${d}`}
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
              data-testid="slither-start"
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
              data-testid="slither-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="slither-watch"
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
  const shown = [...s.edges];
  if (stroke) for (const e of stroke.edges) shown[e] = stroke.value;
  const breaks = ruleBreaks(s);
  const wrong = new Set(showMistakes || mode === 'watch' ? wrongEdges(s) : []);
  const flaggedSet = new Set(flagged);
  const hintEdges = new Set(hint?.set.map((x) => x.edge) ?? []);
  const hidden = paused && mode === 'play';
  const ends = (e: number) => {
    const [a, b] = geo.edgeVertices[e]!;
    return [
      a % (cols + 1),
      Math.floor(a / (cols + 1)),
      b % (cols + 1),
      Math.floor(b / (cols + 1)),
    ] as const;
  };

  return (
    <div className={shared.play} data-testid="slither">
      <div className={shared.bar}>
        <span data-testid="slither-difficulty">{t(`difficulty.${s.difficulty}`)}</span>
        {mode === 'play' && (
          <>
            <span data-testid="slither-time">{t('time', { time: formatTime(elapsed) })}</span>
            <span>{t('mistakes', { n: s.mistakes })}</span>
            <span>{t('hints', { n: s.hints })}</span>
          </>
        )}
      </div>
      <div className={styles.wrap}>
        <svg
          ref={svgRef}
          className={`${styles.board} ${s.solved ? styles.done : ''}`}
          viewBox={`${-PAD} ${-PAD} ${cols + 2 * PAD} ${rows + 2 * PAD}`}
          role="img"
          aria-label={t('board.label', { lines: s.edges.filter((x) => x === LINE).length })}
          data-testid="slither-board"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {hint && hint.technique === 'cell-count' && (
            <rect
              x={hint.at % cols}
              y={Math.floor(hint.at / cols)}
              width={1}
              height={1}
              className={styles.hintCell}
            />
          )}
          {!hidden &&
            s.puzzle.clues.map((n, i) =>
              n === null ? null : (
                <text
                  key={i}
                  x={(i % cols) + 0.5}
                  y={Math.floor(i / cols) + 0.5}
                  className={`${styles.clue} ${breaks.cells.has(i) ? styles.broken : ''} ${
                    geo.cellEdges[i]!.filter((e) => s.edges[e] === LINE).length === n
                      ? styles.met
                      : ''
                  }`}
                >
                  {n}
                </text>
              ),
            )}
          {shown.map((v, e) => {
            const [x1, y1, x2, y2] = ends(e);
            const cls = [
              v === LINE ? styles.line : styles.slot,
              hintEdges.has(e) ? styles.hintEdge : '',
              wrong.has(e) || flaggedSet.has(e) ? styles.wrong : '',
            ].join(' ');
            return (
              <g key={e} data-edge={e} data-value={v}>
                {!hidden && <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} />}
                {!hidden && v === CROSS && (
                  <path
                    d={`M${(x1 + x2) / 2 - 0.09} ${(y1 + y2) / 2 - 0.09}l0.18 0.18m0 -0.18l-0.18 0.18`}
                    className={`${styles.cross} ${wrong.has(e) ? styles.wrongCross : ''}`}
                  />
                )}
              </g>
            );
          })}
          {Array.from({ length: (rows + 1) * (cols + 1) }, (_, v) => (
            <circle
              key={v}
              cx={v % (cols + 1)}
              cy={Math.floor(v / (cols + 1))}
              r={0.07}
              className={`${styles.dot} ${breaks.vertices.has(v) || (hint?.technique === 'vertex' && hint.at === v) ? styles.dotHot : ''}`}
            />
          ))}
        </svg>
        {hidden && (
          <button type="button" className={shared.pausedCover} onClick={togglePause}>
            <Play size={28} /> {t('paused')}
          </button>
        )}
      </div>
      <p className={shared.message} data-testid="slither-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={fillHint}
          data-testid="slither-fill"
        >
          {t('hint.fill')}
        </button>
      )}
      {mode === 'play' && !s.solved && (
        <div className={shared.tools}>
          <div className={shared.segmented}>
            {(['cycle', 'line', 'cross'] as const).map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={tap === x}
                onClick={() => setTap(x)}
                data-testid={`slither-tap-${x}`}
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
            data-testid="slither-undo"
          >
            <Undo2 size={16} /> {t('undo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn || !s.redo.length}
            onClick={() => commit(redoMove(s), 'place')}
            data-testid="slither-redo"
          >
            <Redo2 size={16} /> {t('redo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn}
            onClick={showHint}
            data-testid="slither-hint"
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
          <button type="button" className="btn" onClick={togglePause} data-testid="slither-pause">
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
            data-testid="slither-again"
          >
            {t('new.puzzle')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toMenu}
          data-testid="slither-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.keys}>{t('keys')}</p>}
    </div>
  );
}
