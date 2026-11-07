/**
 * The Bridges table: a menu (size, new or daily puzzle, resume, watch the AI), the sea of islands
 * where a tap between two islands (or on one island, then another) adds a bridge, islands coloured
 * by their count, undo/redo, explained hints, a timer with pause, and the technique solver in watch
 * mode.
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
  DIFFICULTIES,
  blockedBy,
  countSolutions,
  cycleBridge,
  hintStep,
  islandCounts,
  isValidHashiState,
  newHashi,
  redoMove,
  setBridge,
  undoMove,
  wrongPairs,
  type HashiState,
  type Step,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Hashi.module.css';

interface Saved {
  state: HashiState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';
const LEVELS = Object.keys(DIFFICULTIES);
const SPEED_MS = 5 * 60 * 1000;
const PAD = 0.6;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function HashiGame({ services }: GameProps) {
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
          isValidHashiState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<HashiState | null>(null);
  const [daily, setDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [showMistakes, setShowMistakes] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<{ pair: number; count: number; steps: Step[] } | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
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
      const s = newHashi(level, seed);
      setBusy(false);
      start(s, m, isDaily);
    }, 20);
  };

  const start = (s: HashiState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setDifficulty(s.difficulty);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setHint(null);
    setPicked(null);
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

  const save = (s: HashiState) => {
    if (mode === 'play' && !s.solved)
      void slot.save({ state: { ...s, elapsedMs: elapsedRef.current }, daily });
  };

  const solvedNow = (s: HashiState) => {
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

  const commit = (next: HashiState, sound: keyof typeof SUDOKU_SOUNDS) => {
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
  const rows = state?.puzzle.rows ?? 7;
  const cols = state?.puzzle.cols ?? 7;
  const cellName = (c: number) => t('cell', { r: Math.floor(c / cols) + 1, c: (c % cols) + 1 });
  const islandXY = (s: HashiState, i: number) => {
    const c = s.puzzle.islands[i]!.cell;
    return { x: c % cols, y: Math.floor(c / cols) };
  };

  const toggle = (q: number) => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    if (s.bridges[q] === 0 && blockedBy(s, q).length) {
      servicesRef.current.playSound(SUDOKU_SOUNDS.invalid);
      setMessage(t('blocked'));
      return;
    }
    const next = cycleBridge(s, q);
    commit(next, next.bridges[q] ? 'place' : 'erase');
  };

  /** A tap: on an island (pick it, or bridge to the picked one) or on the water between two. */
  const onTap = (e: PointerEvent<SVGSVGElement>) => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    const r = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * (cols - 1 + 2 * PAD) - PAD;
    const y = ((e.clientY - r.top) / r.height) * (rows - 1 + 2 * PAD) - PAD;
    const island = s.puzzle.islands.findIndex((_, i) => {
      const p = islandXY(s, i);
      return Math.hypot(p.x - x, p.y - y) < 0.45;
    });
    if (island >= 0) {
      if (picked === null || picked === island) {
        setPicked(picked === island ? null : island);
        return;
      }
      const q = s.puzzle.pairs.findIndex(
        (p) => (p.a === picked && p.b === island) || (p.b === picked && p.a === island),
      );
      setPicked(null);
      if (q >= 0) toggle(q);
      return;
    }
    // The closest bridge slot under the finger.
    let best = -1;
    let dist = 0.45;
    s.puzzle.pairs.forEach((p, q) => {
      const a = islandXY(s, p.a);
      const b = islandXY(s, p.b);
      const d = p.horizontal
        ? x > Math.min(a.x, b.x) && x < Math.max(a.x, b.x)
          ? Math.abs(y - a.y)
          : 9
        : y > Math.min(a.y, b.y) && y < Math.max(a.y, b.y)
          ? Math.abs(x - a.x)
          : 9;
      if (d < dist) {
        dist = d;
        best = q;
      }
    });
    setPicked(null);
    if (best >= 0) toggle(best);
  };

  const explain = (s: HashiState, h: { pair: number; steps: Step[] }) => {
    const last = h.steps.at(-1)!;
    const isl = s.puzzle.islands[last.island]!;
    const p = s.puzzle.pairs[h.pair]!;
    const other = s.puzzle.islands[p.a === last.island ? p.b : p.a]!;
    const text = t(last.technique === 'full' ? 'hint.full' : 'hint.at-least', {
      n: isl.n,
      cell: cellName(isl.cell),
      other: cellName(other.cell),
    });
    const before = [...new Set(h.steps.slice(0, -1).map((x) => t(`tech.${x.technique}`)))];
    return before.length ? `${t('hint.before', { techniques: before.join(', ') })} ${text}` : text;
  };

  const guess = (s: HashiState) => {
    const truth = countSolutions(s.puzzle, 1).first ?? s.puzzle.solution;
    const pair = s.bridges.findIndex((b, q) => b < truth[q]!);
    return { pair, count: s.bridges[pair]! + 1, steps: [] as Step[] };
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !myTurn) return;
    servicesRef.current.playSound(SUDOKU_SOUNDS.hint);
    const wrong = wrongPairs(s);
    if (wrong.length) {
      setFlagged(wrong);
      setHint(null);
      setMessage(
        wrong.length === 1 ? t('hint.wrongPair') : t('hint.wrongPairs', { n: wrong.length }),
      );
      return;
    }
    const h = hintStep(s);
    if (h) {
      setHint(h);
      setMessage(explain(s, h));
    } else {
      const g = guess(s);
      const p = s.puzzle.pairs[g.pair]!;
      setHint(g);
      setMessage(
        t('hint.guess', {
          cell: cellName(s.puzzle.islands[p.a]!.cell),
          other: cellName(s.puzzle.islands[p.b]!.cell),
        }),
      );
    }
  };

  const fillHint = () => {
    const s = stateRef.current;
    if (!s || !hint) return;
    commit(setBridge(s, hint.pair, hint.count, { hint: true }), 'place');
  };

  useEffect(() => {
    if (mode !== 'watch' || !state || paused || state.solved) return;
    const id = window.setTimeout(() => {
      const h = hintStep(state) ?? guess(state);
      const next = setBridge(state, h.pair, h.count);
      setHint(h);
      setMessage(t('watch.step', { text: h.steps.length ? explain(state, h) : t('hint.fill') }));
      watchSteps.current++;
      servicesRef.current.playSound(SUDOKU_SOUNDS.place);
      if (next.solved) {
        setHint(null);
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
      <div className={shared.menu} data-testid="hashi-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="hashi-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.difficulty}`),
                    time: formatTime(saved.state.elapsedMs),
                    filled: Math.round(
                      (100 * saved.state.bridges.reduce((a, b) => a + b, 0)) /
                        Math.max(
                          1,
                          saved.state.puzzle.solution.reduce((a, b) => a + b, 0),
                        ),
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
                  data-testid={`hashi-difficulty-${d}`}
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
              data-testid="hashi-start"
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
              data-testid="hashi-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => begin('watch', difficulty, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="hashi-watch"
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
  const counts = islandCounts(s);
  const wrong = new Set(showMistakes || mode === 'watch' ? wrongPairs(s) : []);
  const flaggedSet = new Set(flagged);
  const hidden = paused && mode === 'play';
  const hintIslands = new Set(hint?.steps.length ? [hint.steps.at(-1)!.island] : []);

  return (
    <div className={shared.play} data-testid="hashi">
      <div className={shared.bar}>
        <span data-testid="hashi-difficulty">{t(`difficulty.${s.difficulty}`)}</span>
        {mode === 'play' && (
          <>
            <span data-testid="hashi-time">{t('time', { time: formatTime(elapsed) })}</span>
            <span>{t('mistakes', { n: s.mistakes })}</span>
            <span>{t('hints', { n: s.hints })}</span>
          </>
        )}
      </div>
      <div className={styles.wrap}>
        <svg
          ref={svgRef}
          className={`${styles.board} ${s.solved ? styles.done : ''}`}
          viewBox={`${-PAD} ${-PAD} ${cols - 1 + 2 * PAD} ${rows - 1 + 2 * PAD}`}
          role="img"
          aria-label={t('board.label', { islands: s.puzzle.islands.length })}
          data-testid="hashi-board"
          onPointerUp={onTap}
        >
          {!hidden &&
            s.puzzle.pairs.map((p, q) => {
              const a = islandXY(s, p.a);
              const b = islandXY(s, p.b);
              const n = s.bridges[q]!;
              const off = 0.09;
              const dx = p.horizontal ? 0 : off;
              const dy = p.horizontal ? off : 0;
              const cls = [
                styles.bridge,
                wrong.has(q) || flaggedSet.has(q) ? styles.wrong : '',
                hint?.pair === q ? styles.hinted : '',
              ].join(' ');
              return (
                <g key={q} data-pair={q} data-value={n}>
                  {hint?.pair === q && n === 0 && (
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.hintSlot} />
                  )}
                  {n === 1 && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={cls} />}
                  {n === 2 && (
                    <>
                      <line
                        x1={a.x - dx}
                        y1={a.y - dy}
                        x2={b.x - dx}
                        y2={b.y - dy}
                        className={cls}
                      />
                      <line
                        x1={a.x + dx}
                        y1={a.y + dy}
                        x2={b.x + dx}
                        y2={b.y + dy}
                        className={cls}
                      />
                    </>
                  )}
                </g>
              );
            })}
          {s.puzzle.islands.map((isl, i) => {
            const { x, y } = islandXY(s, i);
            const c = counts[i]!;
            const cls = [
              styles.island,
              c === isl.n ? styles.full : c > isl.n ? styles.over : '',
              picked === i ? styles.picked : '',
              hintIslands.has(i) ? styles.hintIsland : '',
            ].join(' ');
            return (
              <g
                key={i}
                data-island={i}
                aria-label={t('island', { n: isl.n, cell: cellName(isl.cell) })}
              >
                <circle cx={x} cy={y} r={0.38} className={cls} />
                {!hidden && (
                  <text x={x} y={y} className={styles.num}>
                    {isl.n}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hidden && (
          <button type="button" className={shared.pausedCover} onClick={togglePause}>
            <Play size={28} /> {t('paused')}
          </button>
        )}
      </div>
      <p className={shared.message} data-testid="hashi-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={fillHint}
          data-testid="hashi-fill"
        >
          {t('hint.fill')}
        </button>
      )}
      {mode === 'play' && !s.solved && (
        <div className={shared.tools}>
          <button
            type="button"
            className="btn"
            disabled={!myTurn || !s.undo.length}
            onClick={() => commit(undoMove(s), 'erase')}
            data-testid="hashi-undo"
          >
            <Undo2 size={16} /> {t('undo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn || !s.redo.length}
            onClick={() => commit(redoMove(s), 'place')}
            data-testid="hashi-redo"
          >
            <Redo2 size={16} /> {t('redo')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!myTurn}
            onClick={showHint}
            data-testid="hashi-hint"
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
          <button type="button" className="btn" onClick={togglePause} data-testid="hashi-pause">
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
            data-testid="hashi-again"
          >
            {t('new.puzzle')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toMenu}
          data-testid="hashi-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.keys}>{t('keys')}</p>}
    </div>
  );
}
