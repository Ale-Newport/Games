/**
 * The minesweeper table shared by Classic and No-Guess: a menu (board, new or daily game, resume,
 * watch the AI), the field (tap to open, long-press or right-click or flag mode to flag, tap an open
 * number to open around it), counters, explained hints, pause, and the deduction AI in watch mode.
 * Wide boards are shown turned on narrow screens.
 */
import { Bomb, Bot, Flag, Lightbulb, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { formatTime } from '../sudoku/SudokuGame';
import shared from '../sudoku/SudokuGame.module.css';
import { logicMove } from './ai';
import {
  chord,
  countAround,
  flagsLeft,
  hintFor,
  isValidMinesState,
  newMines,
  reveal,
  risks,
  toggleFlag,
  type Deduction,
  type MinesSpec,
  type MinesState,
} from './engine';
import { MINES_STRINGS } from './i18n';
import styles from './MinesGame.module.css';
import { MINES_SOUNDS } from './sounds';

interface Saved {
  state: MinesState;
}
type Mode = 'menu' | 'play' | 'watch';

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export interface MinesGameProps {
  services: GameServices;
  specs: Record<string, MinesSpec>;
  noGuess: boolean;
  /** Title and menu.subtitle. */
  strings: Record<Locale, Dictionary>;
  /** Beginner win time for the speed achievement. */
  speedMs: number;
}

export function MinesGame({ services, specs, noGuess, strings, speedMs }: MinesGameProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        { en: { ...MINES_STRINGS.en, ...strings.en }, es: { ...MINES_STRINGS.es, ...strings.es } },
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
          isValidMinesState((d as Saved).state, specs, noGuess),
      }),
    [services, specs, noGuess],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState(levels[0]!);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<MinesState | null>(null);
  const [flagMode, setFlagMode] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<{ cells: number[]; safe: number[]; mines: number[] } | null>(
    null,
  );
  const [flagged, setFlagged] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 700,
  );
  const usedFlags = useRef(false);
  const press = useRef<{ timer: number; cell: number; long: boolean } | null>(null);
  const stateRef = useLatest(state);
  const elapsedRef = useLatest(elapsed);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 700);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && (d.state.status === 'playing' || d.state.status === 'ready'))
        setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (s: MinesState, m: Mode) => {
    setState(s);
    setMode(m);
    setDifficulty(s.difficulty);
    setElapsed(s.elapsedMs);
    setHint(null);
    setFlagged([]);
    setPaused(false);
    setFlagMode(false);
    setCursor(Math.floor(s.rows / 2) * s.cols + Math.floor(s.cols / 2));
    setMessage(s.status === 'ready' && m === 'play' ? t('ready') : '');
    usedFlags.current = s.flags.some(Boolean);
    if (m === 'play') void slot.save({ state: s });
  };
  const fresh = (m: Mode, level: string, seed: number) =>
    start(newMines(level, specs[level]!, seed, noGuess), m);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', levels[1] ?? levels[0]!, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'play' || !state || state.status !== 'playing' || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state, paused]);

  const finished = (s: MinesState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    if (s.status === 'won') {
      svc.playSound(MINES_SOUNDS.win);
      setMessage(t('won', { time: formatTime(time) }));
      svc.recordResult({ outcome: 'complete', timeMs: time, mode: s.difficulty });
      svc.unlockAchievement('first');
      svc.unlockAchievement(`win-${s.difficulty}`);
      if (s.difficulty === levels[0] && time <= speedMs) svc.unlockAchievement('speed');
      if (!usedFlags.current) svc.unlockAchievement('no-flags');
    } else {
      svc.playSound(MINES_SOUNDS.boom);
      setMessage(t('lost'));
      svc.recordResult({ outcome: 'fail', mode: s.difficulty });
    }
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: MinesState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    setFlagged([]);
    const opened = next.revealed.filter(Boolean).length - before.revealed.filter(Boolean).length;
    if (next.flags !== before.flags && next.status === before.status)
      servicesRef.current.playSound(MINES_SOUNDS.flag);
    else if (next.status === 'playing')
      servicesRef.current.playSound(opened > 3 ? MINES_SOUNDS.cascade : MINES_SOUNDS.open);
    setState(next);
    if (next.status !== 'ready') setMessage('');
    if ((next.status === 'won' || next.status === 'lost') && before.status !== next.status)
      finished(next);
    else if (mode === 'play') void slot.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  const active =
    mode === 'play' &&
    !!state &&
    (state.status === 'ready' || state.status === 'playing') &&
    !paused;

  const act = (cell: number, flagging: boolean) => {
    const s = stateRef.current;
    if (!s || !active) return;
    setCursor(cell);
    if (s.revealed[cell]) return commit(chord(s, cell));
    if (flagging) {
      if (s.status === 'ready') return;
      usedFlags.current = true;
      return commit(toggleFlag(s, cell));
    }
    commit(reveal(s, cell));
  };

  const onDown = (e: PointerEvent<HTMLButtonElement>, cell: number) => {
    if (e.button === 2) return;
    const timer = window.setTimeout(() => {
      if (press.current) {
        press.current.long = true;
        act(cell, true);
      }
    }, 420);
    press.current = { timer, cell, long: false };
  };
  const onUp = (cell: number) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    window.clearTimeout(p.timer);
    if (!p.long && p.cell === cell) act(cell, flagMode);
  };

  const cellName = (s: MinesState, c: number) =>
    t('cell', { r: Math.floor(c / s.cols) + 1, c: (c % s.cols) + 1 });

  const explain = (s: MinesState, d: Deduction) => {
    const safe = d.safe.length > 0;
    if (d.technique === 'count') return t(safe ? 'hint.count.safe' : 'hint.count.mines');
    if (d.technique === 'single')
      return t(safe ? 'hint.single.safe' : 'hint.single.mines', {
        n: countAround(s, d.from[0]!),
        cell: cellName(s, d.from[0]!),
      });
    const [a, b] = d.from as [number, number];
    return t(safe ? 'hint.subset.safe' : 'hint.subset.mines', {
      a: countAround(s, a),
      cellA: cellName(s, a),
      b: countAround(s, b),
      cellB: cellName(s, b),
    });
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active || s.status !== 'playing') return;
    servicesRef.current.playSound(MINES_SOUNDS.hint);
    const wrong = s.flags.flatMap((f, c) => (f && !s.mines[c] ? [c] : []));
    if (wrong.length) {
      setFlagged(wrong);
      setMessage(t('hint.wrongFlags'));
      return;
    }
    const d = hintFor(s);
    if (d) {
      setHint({ cells: d.from, safe: d.safe, mines: d.mines });
      setMessage(explain(s, d));
    } else {
      const risk = risks(s);
      let best = -1;
      s.revealed.forEach((r, c) => {
        if (!r && !s.flags[c] && (best < 0 || risk[c]! < risk[best]!)) best = c;
      });
      setHint({ cells: [], safe: [best], mines: [] });
      setMessage(t('hint.guess', { cell: cellName(s, best), risk: Math.round(risk[best]! * 100) }));
    }
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !hint) return;
    let next = { ...s, hints: s.hints + 1 };
    for (const m of hint.mines) if (!next.flags[m]) next = toggleFlag(next, m);
    for (const x of hint.safe) next = reveal(next, x);
    commit(next);
  };

  // Watch mode: the deduction AI opens one cell at a time.
  useEffect(() => {
    if (mode !== 'watch' || !state || paused || state.status === 'won' || state.status === 'lost')
      return;
    const id = window.setTimeout(() => {
      const cell = Number(logicMove(state).slice(2));
      const d = state.status === 'playing' ? hintFor(state) : null;
      const next = reveal(state, cell);
      setHint({ cells: d?.from ?? [], safe: [cell], mines: [] });
      setMessage(
        next.status === 'won'
          ? t('watch.won')
          : next.status === 'lost'
            ? t('watch.lost')
            : d && d.safe.includes(cell)
              ? t('watch.step', { text: explain(state, d) })
              : state.status === 'ready'
                ? t('ready')
                : t('watch.guess', { cell: cellName(state, cell) }),
      );
      servicesRef.current.playSound(next.status === 'lost' ? MINES_SOUNDS.boom : MINES_SOUNDS.open);
      setState(next);
    }, 450);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state, paused]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (k === 'n') {
      fresh('play', state.difficulty, randomSeed() >>> 0);
      return true;
    }
    if (k === 'p') {
      setPaused((p) => !p);
      return true;
    }
    if (!active) return false;
    const r = Math.floor(cursor / state.cols);
    const c = cursor % state.cols;
    const moveTo = (rr: number, cc: number) =>
      setCursor(
        Math.min(state.rows - 1, Math.max(0, rr)) * state.cols +
          Math.min(state.cols - 1, Math.max(0, cc)),
      );
    if (k === 'arrowup') moveTo(r - 1, c);
    else if (k === 'arrowdown') moveTo(r + 1, c);
    else if (k === 'arrowleft') moveTo(r, c - 1);
    else if (k === 'arrowright') moveTo(r, c + 1);
    else if (k === ' ' || k === 'enter') act(cursor, false);
    else if (k === 'f') act(cursor, true);
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && (s.status === 'playing' || s.status === 'ready')) {
      const kept = { state: { ...s, elapsedMs: elapsedRef.current } };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={shared.menu} data-testid="mines-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play')}
              data-testid="mines-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    difficulty: t(`difficulty.${saved.state.difficulty}`),
                    time: formatTime(saved.state.elapsedMs),
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.difficulty')}</legend>
            <div className={shared.segmented}>
              {levels.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  data-testid={`mines-difficulty-${d}`}
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
                    wins: stats.completions,
                    played: stats.played,
                    time: formatTime(stats.bestTimeMs ?? 0),
                  })
                : t('menu.unplayed', { difficulty: t(`difficulty.${difficulty}`) })}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', difficulty, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="mines-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('play', difficulty, today() * 10 + levels.indexOf(difficulty))}
              data-testid="mines-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', difficulty, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="mines-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const turned = narrow && s.cols > s.rows;
  const dRows = turned ? s.cols : s.rows;
  const dCols = turned ? s.rows : s.cols;
  const over = s.status === 'won' || s.status === 'lost';
  const hidden = paused && mode === 'play';
  const pointed = new Set([...(hint?.cells ?? []), ...(hint?.safe ?? []), ...(hint?.mines ?? [])]);
  const flaggedSet = new Set(flagged);

  return (
    <div className={shared.play} data-testid="mines">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="mines-left">
          <Bomb size={16} /> {t('mines', { n: flagsLeft(s) })}
        </span>
        <button
          type="button"
          className={`btn ${styles.face}`}
          onClick={() => fresh(mode, s.difficulty, randomSeed() >>> 0)}
          data-testid="mines-restart"
          aria-label={t('restart')}
        >
          {s.status === 'lost' ? '✖' : s.status === 'won' ? '★' : '●'}
        </button>
        <span className={styles.counter} data-testid="mines-time">
          {t('time', { time: formatTime(elapsed) })}
        </span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${hidden ? styles.hidden : ''}`}
          style={{ ['--rows' as string]: dRows, ['--cols' as string]: dCols }}
          role="grid"
          aria-label={t('title')}
          data-testid="mines-board"
          onContextMenu={(e) => e.preventDefault()}
        >
          {Array.from({ length: dRows * dCols }, (_, i) => {
            const dr = Math.floor(i / dCols);
            const dc = i % dCols;
            const c = turned ? dc * s.cols + dr : dr * s.cols + dc;
            const open = s.revealed[c]!;
            const mine = s.mines[c];
            const n = open && !mine ? countAround(s, c) : 0;
            const label = open
              ? mine
                ? t('cell.mine', { cell: cellName(s, c) })
                : t('cell.open', { cell: cellName(s, c), n })
              : s.flags[c]
                ? t('cell.flagged', { cell: cellName(s, c) })
                : t('cell.closed', { cell: cellName(s, c) });
            return (
              <button
                key={c}
                type="button"
                role="gridcell"
                className={[
                  styles.cell,
                  open ? styles.open : styles.closed,
                  open && mine ? (c === s.exploded ? styles.exploded : styles.mine) : '',
                  pointed.has(c) ? styles.pointed : '',
                  cursor === c && mode === 'play' && !over ? styles.cursor : '',
                  flaggedSet.has(c) ? styles.wrongFlag : '',
                ].join(' ')}
                data-n={n || undefined}
                data-cell={c}
                data-state={open ? 'open' : s.flags[c] ? 'flag' : 'closed'}
                aria-label={label}
                onPointerDown={(e) => onDown(e, c)}
                onPointerUp={() => onUp(c)}
                onPointerLeave={() => {
                  if (press.current) window.clearTimeout(press.current.timer);
                  press.current = null;
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  act(c, true);
                }}
              >
                {hidden ? null : open ? (
                  mine ? (
                    <Bomb size="62%" />
                  ) : n ? (
                    n
                  ) : null
                ) : s.flags[c] ? (
                  over && s.status === 'lost' && !mine ? (
                    <X size="62%" />
                  ) : (
                    <Flag size="58%" />
                  )
                ) : null}
              </button>
            );
          })}
          {hidden && (
            <button type="button" className={shared.pausedCover} onClick={() => setPaused(false)}>
              <Play size={28} /> {t('paused')}
            </button>
          )}
        </div>
      </div>
      <p className={shared.message} data-testid="mines-message" aria-live="polite">
        {message}
      </p>
      {hint && mode === 'play' && !over && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={applyHint}
          data-testid="mines-apply"
        >
          {t('hint.apply')}
        </button>
      )}
      <div className={shared.controls}>
        {mode === 'play' && !over && (
          <>
            <button
              type="button"
              className={`btn ${flagMode ? 'btn-primary' : ''}`}
              aria-pressed={flagMode}
              onClick={() => setFlagMode((x) => !x)}
              data-testid="mines-flag-mode"
            >
              <Flag size={16} /> {t(flagMode ? 'flag.on' : 'flag')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={s.status !== 'playing' || paused}
              onClick={showHint}
              data-testid="mines-hint"
            >
              <Lightbulb size={16} /> {t('hint')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setPaused((p) => !p)}
              data-testid="mines-pause"
            >
              {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
            </button>
          </>
        )}
        {mode === 'watch' && !over && (
          <button type="button" className="btn" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        {over && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, s.difficulty, randomSeed() >>> 0)}
            data-testid="mines-again"
          >
            {t('restart')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toMenu}
          data-testid="mines-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.keys}>{t('keys')}</p>}
    </div>
  );
}
