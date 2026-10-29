/**
 * The Sokoban table: a level picker by tier with solved marks and best pushes, the warehouse (tap a
 * floor cell to walk there, tap a box next to the keeper or swipe to push, arrow keys), moves and
 * pushes against the fewest possible, dead boxes marked, undo and restart, hints from the push
 * solver, and the solver in watch mode.
 */
import { Bot, Check, Lightbulb, Play, RotateCcw, SkipForward, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { solverPlan } from './ai';
import {
  DIRS,
  TIERS,
  deadBoxes,
  isValidSokobanState,
  levelCount,
  newSokoban,
  stepPlayer,
  undo,
  walkTo,
  type Dir,
  type SokobanState,
  type Tier,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Sokoban.module.css';
import { SOKOBAN_SOUNDS } from './sounds';

interface Saved {
  state: SokobanState | null;
  /** Fewest pushes per solved level (hints or not), keyed "tier:index". */
  best: Record<string, number>;
}
type Mode = 'menu' | 'play' | 'watch';

const levelKey = (tier: Tier, index: number) => `${tier}:${index}`;

const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  if (typeof s.best !== 'object' || s.best === null) return false;
  if (!Object.values(s.best).every((v) => Number.isInteger(v) && v >= 0)) return false;
  return s.state === null || isValidSokobanState(s.state);
};

export function SokobanGame({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [tier, setTier] = useState<Tier>('easy');
  const [saved, setSaved] = useState<Saved>({ state: null, best: {} });
  const [state, setState] = useState<SokobanState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<Dir[] | null>(null);
  const swipe = useRef<{ x: number; y: number; cell: number } | null>(null);
  const savedRef = useLatest(saved);
  const stateRef = useLatest(state);
  const elapsedRef = useLatest(elapsed);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d) {
        setSaved(d);
        if (d.state && !d.state.solved) setTier(d.state.tier);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const persist = (next: Saved) => {
    setSaved(next);
    void slot.save(next);
  };

  const start = (s: SokobanState, m: Mode) => {
    setState(s);
    setMode(m);
    setTier(s.tier);
    setElapsed(s.elapsedMs);
    setHint(null);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') persist({ ...savedRef.current, state: s });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => start(newSokoban('medium', 0), 'watch'), 0);
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

  const solvedNow = (s: SokobanState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(SOKOBAN_SOUNDS.win);
    const optimal = s.pushes === s.warehouse.pushes && !s.hints;
    setMessage(
      t(optimal ? 'solved.optimal' : 'solved', {
        moves: s.moves,
        pushes: s.pushes,
        time: formatTime(time),
      }),
    );
    svc.recordResult({ outcome: 'complete', score: s.pushes, timeMs: time, mode: s.tier });
    svc.unlockAchievement('first');
    if (optimal) svc.unlockAchievement('optimal');
    if (s.tier === 'hard' && !s.hints) svc.unlockAchievement('hard');
    const key = levelKey(s.tier, s.index);
    const best = { ...savedRef.current.best };
    best[key] = Math.min(best[key] ?? Infinity, s.pushes);
    const solvedIn = (x: Tier) =>
      Array.from({ length: levelCount(x) }, (_, i) => levelKey(x, i)).filter((k) => k in best)
        .length;
    if (solvedIn('easy') >= 10) svc.unlockAchievement('ten');
    if (TIERS.every((x) => solvedIn(x) >= 1)) svc.unlockAchievement('all-tiers');
    persist({ state: null, best });
  };

  const commit = (next: SokobanState, pushed: boolean) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setHint(null);
    servicesRef.current.playSound(pushed ? SOKOBAN_SOUNDS.push : SOKOBAN_SOUNDS.step);
    setState(next);
    const dead = deadBoxes(next).length;
    setMessage(dead ? t('dead', { n: dead }) : '');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play')
      persist({ ...savedRef.current, state: { ...next, elapsedMs: elapsedRef.current } });
  };

  const active = mode === 'play' && !!state && !state.solved;

  const walk = (dirs: Dir[]) => {
    let s = stateRef.current;
    if (!s || !active) return;
    let pushed = false;
    for (const d of dirs) {
      const next = stepPlayer(s, d);
      if (next === s) break;
      pushed ||= next.pushes > s.pushes;
      s = next;
      if (s.solved) break;
    }
    commit(s, pushed);
  };

  const tapCell = (c: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    const w = s.warehouse;
    const dx = (c % w.width) - (s.player % w.width);
    const dy = Math.floor(c / w.width) - Math.floor(s.player / w.width);
    if (s.boxes.includes(c) && Math.abs(dx) + Math.abs(dy) === 1) {
      walk([dx === 1 ? 'R' : dx === -1 ? 'L' : dy === 1 ? 'D' : 'U']);
      return;
    }
    const path = walkTo(w, s.boxes, s.player, c);
    if (path?.length) walk(path);
  };

  const onDown = (e: PointerEvent, c: number) => {
    swipe.current = { x: e.clientX, y: e.clientY, cell: c };
  };
  const onUp = (e: PointerEvent) => {
    const sw = swipe.current;
    swipe.current = null;
    if (!sw) return;
    const dx = e.clientX - sw.x;
    const dy = e.clientY - sw.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return tapCell(sw.cell);
    walk([Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : dy > 0 ? 'D' : 'U']);
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(SOKOBAN_SOUNDS.hint);
    const plan = solverPlan(s);
    if (!plan) {
      setHint(null);
      setMessage(t('hint.stuck'));
      return;
    }
    // The walk up to and including the next push.
    const w = s.warehouse;
    let probe = s;
    const part: Dir[] = [];
    for (const d of plan) {
      part.push(d);
      const next = stepPlayer(probe, d);
      const pushed = next.pushes > probe.pushes;
      probe = next;
      if (pushed) break;
    }
    const pushDir = part[part.length - 1]!;
    const box = probe.player;
    setHint(part);
    setMessage(
      t('hint.push', {
        dir: t(`dir.${pushDir}`),
        cell: t('cell', { r: Math.floor(box / w.width) + 1, c: (box % w.width) + 1 }),
        left: plan.reduce((acc, d) => stepPlayer(acc, d), s).pushes - s.pushes,
      }),
    );
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !hint || !active) return;
    let next = { ...s, hints: s.hints + 1 };
    for (const d of hint) next = stepPlayer(next, d);
    commit(next, true);
  };

  // Watch mode: the solver takes a step every 0.18 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved) return;
    const id = window.setTimeout(() => {
      const d = solverPlan(state)?.[0];
      if (!d) return;
      const next = stepPlayer(state, d);
      servicesRef.current.playSound(
        next.solved
          ? SOKOBAN_SOUNDS.win
          : next.pushes > state.pushes
            ? SOKOBAN_SOUNDS.push
            : SOKOBAN_SOUNDS.step,
      );
      if (next.solved) setMessage(t('watch.done', { moves: next.moves, pushes: next.pushes }));
      setState(next);
    }, 180);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    const dir: Record<string, Dir> = {
      arrowup: 'U',
      arrowdown: 'D',
      arrowleft: 'L',
      arrowright: 'R',
      w: 'U',
      s: 'D',
      a: 'L',
      d: 'R',
    };
    if (dir[k]) walk([dir[k]]);
    else if (k === 'u' || k === 'z') commit(undo(state), false);
    else if (k === 'r') start(newSokoban(state.tier, state.index), 'play');
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && !s.solved)
      persist({ ...savedRef.current, state: { ...s, elapsedMs: elapsedRef.current } });
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const best = saved.best;
    const solvedHere = Array.from({ length: levelCount(tier) }, (_, i) => levelKey(tier, i)).filter(
      (k) => k in best,
    ).length;
    const resume = saved.state && !saved.state.solved ? saved.state : null;
    return (
      <div className={shared.menu} data-testid="sk-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume, 'play')}
              data-testid="sk-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    tier: t(`tier.${resume.tier}`),
                    n: resume.index + 1,
                    pushes: resume.pushes,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.tier')}</legend>
            <div className={shared.segmented}>
              {TIERS.map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={tier === x}
                  onClick={() => setTier(x)}
                  data-testid={`sk-tier-${x}`}
                >
                  {t(`tier.${x}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>
              {t(`tier.${tier}.hint`)} ·{' '}
              {t('menu.progress', { n: solvedHere, total: levelCount(tier) })}
            </p>
          </fieldset>
          <div className={styles.levels} data-testid="sk-levels">
            {Array.from({ length: levelCount(tier) }, (_, i) => {
              const b = best[levelKey(tier, i)];
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.level} ${b !== undefined ? styles.cleared : ''}`}
                  onClick={() => start(newSokoban(tier, i), 'play')}
                  aria-label={t('level.label', { n: i + 1 })}
                  data-testid={`sk-level-${i}`}
                >
                  {b !== undefined ? <Check size={12} /> : null}
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() => start(newSokoban('medium', 0), 'watch')}
              data-testid="sk-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const w = s.warehouse;
  const boxSet = new Set(s.boxes);
  const goalSet = new Set(w.goals);
  const dead = new Set(deadBoxes(s));
  const hintTarget = (() => {
    if (!hint) return -1;
    let probe = s;
    for (const d of hint) probe = stepPlayer(probe, d);
    return (
      probe.player + DIRS[hint[hint.length - 1]!][0] + DIRS[hint[hint.length - 1]!][1] * w.width
    );
  })();

  return (
    <div className={shared.play} data-testid="sokoban">
      <div className={styles.bar}>
        <span className={styles.counter}>
          {t(`tier.${s.tier}`)} {s.index + 1}
        </span>
        <span className={styles.counter} data-testid="sk-moves">
          {t('moves', { n: s.moves })}
        </span>
        <span className={styles.counter} data-testid="sk-pushes">
          {t('pushes', { n: s.pushes, best: w.pushes })}
        </span>
      </div>
      <div className={styles.wrap}>
        <div
          className={styles.board}
          style={{ ['--w' as string]: w.width, ['--h' as string]: w.height }}
          role="grid"
          aria-label={t('title')}
          data-testid="sk-board"
          onPointerUp={onUp}
        >
          {w.walls.map((wall, c) => {
            const box = boxSet.has(c);
            const goal = goalSet.has(c);
            const player = s.player === c;
            return (
              <button
                key={c}
                type="button"
                role="gridcell"
                tabIndex={-1}
                className={[
                  styles.cell,
                  wall ? styles.wall : styles.floor,
                  goal ? styles.goal : '',
                  hintTarget === c ? styles.pointed : '',
                ].join(' ')}
                data-cell={c}
                data-kind={
                  wall
                    ? 'wall'
                    : box
                      ? goal
                        ? 'box-goal'
                        : 'box'
                      : player
                        ? 'player'
                        : goal
                          ? 'goal'
                          : 'floor'
                }
                aria-label={t(
                  `cell.${wall ? 'wall' : box ? (goal ? 'boxGoal' : 'box') : player ? 'player' : goal ? 'goal' : 'floor'}`,
                )}
                onPointerDown={(e) => onDown(e, c)}
              >
                {box && (
                  <span
                    className={`${styles.box} ${goal ? styles.boxHome : ''} ${dead.has(c) ? styles.dead : ''}`}
                  />
                )}
                {player && <span className={styles.keeper} />}
              </button>
            );
          })}
        </div>
      </div>
      <p className={shared.message} data-testid="sk-message" aria-live="polite">
        {message}
      </p>
      {hint && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={applyHint}
          data-testid="sk-apply"
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
              onClick={() => commit(undo(s), false)}
              disabled={!s.history.length}
              data-testid="sk-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newSokoban(s.tier, s.index), 'play')}
              data-testid="sk-restart"
            >
              <RotateCcw size={16} /> {t('restart')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="sk-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {s.solved && mode === 'play' && s.index + 1 < levelCount(s.tier) && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(newSokoban(s.tier, s.index + 1), 'play')}
            data-testid="sk-next"
          >
            <SkipForward size={16} /> {t('next')}
          </button>
        )}
        {mode === 'watch' && s.solved && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(newSokoban(s.tier, (s.index + 1) % levelCount(s.tier)), 'watch')}
            data-testid="sk-again"
          >
            <Play size={16} /> {t('next')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="sk-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
