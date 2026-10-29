/**
 * The twisty-cube table shared by the 2×2, 3×3 and 4×4: a menu (scramble level, new or daily
 * scramble, resume, watch the AI), the cube in CSS 3D (drag to look around; layer turns animate),
 * face-turn buttons and keys (wide turns on the 4×4), timer and turn count, undo, hints from the
 * size's solver, and the solver in watch mode.
 */
import { Bot, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { formatTime } from '../sudoku/SudokuGame';
import shared from '../sudoku/SudokuGame.module.css';
import { FACES, moveName, parseMove, type Face, type Sticker, type Turn } from './cube';
import styles from './CubeGame.module.css';
import { CUBE_STRINGS } from './i18n';
import { isValidCubeState, newCube, play, undo, type CubeSpec, type CubeState } from './play';
import { CUBE_SOUNDS } from './sounds';

interface Saved {
  state: CubeState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

const COLORS: Record<Face, string> = {
  U: '#f4f4f0',
  D: '#f5d90a',
  F: '#30a46c',
  B: '#3e63dd',
  R: '#e5484d',
  L: '#f76b15',
};
const AXIS: Record<Face, [number, number]> = {
  R: [0, 1],
  L: [0, -1],
  U: [1, 1],
  D: [1, -1],
  F: [2, 1],
  B: [2, -1],
};
const TURN_MS = 180;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/**
 * CSS transform placing a sticker on the cube: its position in doubled coordinates (`--half` px
 * per unit), then a turn so that it faces along its normal.
 */
function stickerTransform(st: Sticker) {
  const [x, y, z] = st.pos;
  const [nx, ny, nz] = st.normal;
  const face =
    nx === 1
      ? ' rotateY(90deg)'
      : nx === -1
        ? ' rotateY(-90deg)'
        : ny === 1
          ? ' rotateX(90deg)'
          : ny === -1
            ? ' rotateX(-90deg)'
            : nz === -1
              ? ' rotateY(180deg)'
              : '';
  return `translate3d(calc(${x} * var(--half)), calc(${-y} * var(--half)), calc(${z} * var(--half)))${face}`;
}

/** Whether a sticker turns with `t` (same layer rule as the engine). */
function inLayer(st: Sticker, n: number, t: Turn) {
  const [axis, sign] = AXIS[t.face];
  const c = st.pos[axis]!;
  const along = (Math.abs(c) === n ? c - Math.sign(c) : c) * sign;
  return along > n - 1 - 2 * t.depth;
}

export interface CubeGameProps {
  services: GameServices;
  specs: Record<string, CubeSpec>;
  /** The next turns toward solved, or null when the solver cannot read the cube. */
  solve: (s: CubeState) => Turn[] | null;
  /** Title, menu.subtitle, level.<id>, level.<id>.hint and solver.<kind> strings. */
  strings: Record<Locale, Dictionary>;
  /** Solve time for the speed achievement. */
  speedMs: number;
}

export function CubeGame({ services, specs, solve, strings, speedMs }: CubeGameProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        { en: { ...CUBE_STRINGS.en, ...strings.en }, es: { ...CUBE_STRINGS.es, ...strings.es } },
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
          isValidCubeState((d as Saved).state, specs),
      }),
    [services, specs],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState(levels[levels.length - 1]!);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<CubeState | null>(null);
  const [daily, setDaily] = useState(false);
  const [wide, setWide] = useState(false);
  const [view, setView] = useState({ x: -28, y: -36 });
  const [spin, setSpin] = useState<{ turn: Turn; angle: number } | null>(null);
  const [hint, setHint] = useState<Turn | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const busy = useRef(false);
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

  const start = (s: CubeState, m: Mode, isDaily: boolean) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(s.elapsedMs);
    setHint(null);
    setSpin(null);
    busy.current = false;
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };
  const fresh = (m: Mode, lv: string, seed: number, isDaily: boolean) =>
    start(newCube(specs, lv, seed), m, isDaily);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', levels[levels.length - 1]!, fixedSeed ?? randomSeed() >>> 0, false),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'play' || !state || state.solved || !state.moves.length) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state]);

  const solvedNow = (s: CubeState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    svc.playSound(CUBE_SOUNDS.win);
    setMessage(t('solved', { moves: s.moves.length, time: formatTime(time) }));
    svc.recordResult({ outcome: 'complete', score: s.moves.length, timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    const full = s.level === levels[levels.length - 1];
    if (full && !s.hints) svc.unlockAchievement('own');
    if (full && !s.hints && time <= speedMs) svc.unlockAchievement('speed');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  /** Animates a layer turn, then applies it. */
  const turnCube = (tn: Turn, options: { hint?: boolean } = {}, after?: (s: CubeState) => void) => {
    const s = stateRef.current;
    if (!s || busy.current || s.solved) return;
    if (tn.depth > 1 && s.size < 4) return;
    busy.current = true;
    setHint(null);
    setSpin({ turn: tn, angle: 0 });
    servicesRef.current.playSound(CUBE_SOUNDS.turn);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setSpin({ turn: tn, angle: (tn.amount === 3 ? -1 : 1) * (tn.amount === 2 ? 180 : 90) }),
      ),
    );
    window.setTimeout(() => {
      const cur = stateRef.current!;
      const next = play(cur, tn, options);
      busy.current = false;
      setSpin(null);
      setState(next);
      setMessage('');
      if (next.solved && !cur.solved) {
        if (mode === 'play') solvedNow(next);
      } else if (mode === 'play')
        void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
      after?.(next);
    }, TURN_MS + 30);
  };

  const active = mode === 'play' && !!state && !state.solved;

  const doUndo = () => {
    const s = stateRef.current;
    if (!s || !active || busy.current || !s.moves.length) return;
    const last = parseMove(s.moves[s.moves.length - 1]!)!;
    const inverse = { ...last, amount: (4 - last.amount) as 1 | 2 | 3 };
    busy.current = true;
    setSpin({ turn: inverse, angle: 0 });
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setSpin({
          turn: inverse,
          angle: (inverse.amount === 3 ? -1 : 1) * (inverse.amount === 2 ? 180 : 90),
        }),
      ),
    );
    window.setTimeout(() => {
      busy.current = false;
      setSpin(null);
      const next = undo(stateRef.current!);
      setState(next);
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current }, daily });
    }, TURN_MS + 30);
  };

  const showHint = () => {
    const s = stateRef.current;
    // No hint mid-turn: the state still shows the cube before the turn.
    if (!s || !active || busy.current) return;
    servicesRef.current.playSound(CUBE_SOUNDS.hint);
    const plan = solve(s);
    if (!plan?.length) return;
    setHint(plan[0]!);
    setMessage(t('hint.move', { move: moveName(plan[0]!), left: plan.length }));
  };

  // Watch mode: the solver turns every 0.5 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved || spin) return;
    const id = window.setTimeout(() => {
      const plan = solve(state);
      if (!plan?.length) return;
      setMessage(t('watch.step', { move: moveName(plan[0]!), left: plan.length - 1 }));
      turnCube(plan[0]!, {}, (next) => {
        if (next.solved) {
          servicesRef.current.playSound(CUBE_SOUNDS.win);
          setMessage(t('watch.done', { moves: next.moves.length }));
        }
      });
    }, 500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state, spin]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key;
    const face = k.toUpperCase();
    if ((FACES as string[]).includes(face) && k.length === 1) {
      turnCube({ face: face as Face, depth: wide ? 2 : 1, amount: e.shiftKey ? 3 : 1 });
      return true;
    }
    const low = k.toLowerCase();
    if (low === 'w' && state.size >= 4) setWide((x) => !x);
    else if (low === 'z' || k === 'Backspace') doUndo();
    else if (low === 'h') showHint();
    else return false;
    return true;
  });

  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setView({
      x: Math.max(-80, Math.min(80, d.vx - (e.clientY - d.y) * 0.5)),
      y: d.vy + (e.clientX - d.x) * 0.5,
    });
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
    const stats = services.getStats()?.modes[level];
    return (
      <div className={shared.menu} data-testid="cu-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="cu-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.state.level}`),
                    moves: saved.state.moves.length,
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
                  data-testid={`cu-level-${d}`}
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
              onClick={() => fresh('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="cu-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('play', level, today() * 10 + levels.indexOf(level), true)}
              data-testid="cu-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="cu-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const n = s.size;
  const spinAxis = spin ? AXIS[spin.turn.face] : null;
  const axisCss = spinAxis
    ? [spinAxis[0] === 0 ? 1 : 0, spinAxis[0] === 1 ? -1 : 0, spinAxis[0] === 2 ? 1 : 0]
    : null;
  const buttons: Turn[] = FACES.flatMap((face) =>
    ([1, 3] as const).map((amount) => ({ face, depth: wide ? 2 : 1, amount })),
  );

  return (
    <div className={shared.play} data-testid="cube">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="cu-moves">
          {t('moves', { n: s.moves.length })}
        </span>
        <span className={styles.counter}>{formatTime(elapsed)}</span>
      </div>
      <div
        className={styles.scene}
        style={{ ['--n' as string]: n }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        data-testid="cu-scene"
        aria-label={t('scene')}
        role="img"
      >
        <div
          className={styles.cube}
          style={{ transform: `rotateX(${view.x}deg) rotateY(${view.y}deg)` }}
        >
          {s.cube.map((st, i) => {
            const turning = spin && inLayer(st, n, spin.turn);
            // A turning layer spins about its axis. CSS y points down, so the y axis is flipped, and a
            // clockwise quarter turn (seen from the face) is +90° about the face's CSS axis. Every sticker
            // carries the rotate3d prefix so the transition interpolates the angle alone and the layer
            // keeps its radius while it turns.
            const spinCss =
              turning && axisCss
                ? `rotate3d(${axisCss.join(',')}, ${spin.angle * AXIS[spin.turn.face][1]}deg) `
                : 'rotate3d(1,0,0, 0deg) ';
            return (
              <span
                key={i}
                className={`${styles.sticker} ${turning ? styles.turning : ''}`}
                style={{ background: COLORS[st.color], transform: spinCss + stickerTransform(st) }}
                data-color={st.color}
              />
            );
          })}
        </div>
      </div>
      <p className={shared.message} data-testid="cu-message" aria-live="polite">
        {message}
      </p>
      {hint && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => turnCube(hint, { hint: true })}
          data-testid="cu-apply"
        >
          {t('hint.apply', { move: moveName(hint) })}
        </button>
      )}
      {active && (
        <div className={styles.pad} data-testid="cu-pad">
          {buttons.map((b) => (
            <button
              key={moveName(b)}
              type="button"
              className={`${styles.key} ${hint && moveName(hint) === moveName(b) ? styles.pointed : ''}`}
              style={{ ['--face' as string]: COLORS[b.face] }}
              onClick={() => turnCube(b)}
              aria-label={t('turn.label', { move: moveName(b), face: t(`face.${b.face}`) })}
              data-testid={`cu-turn-${moveName(b)}`}
            >
              {moveName(b)}
            </button>
          ))}
          {n >= 4 && (
            <button
              type="button"
              className={`${styles.key} ${styles.wide}`}
              aria-pressed={wide}
              onClick={() => setWide((x) => !x)}
              data-testid="cu-wide"
            >
              {t('wide')}
            </button>
          )}
        </div>
      )}
      <div className={shared.controls}>
        {active && (
          <>
            <button
              type="button"
              className="btn"
              onClick={doUndo}
              disabled={!s.moves.length}
              data-testid="cu-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="cu-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="cu-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="cu-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t(n >= 4 ? 'keys.wide' : 'keys')}</p>}
    </div>
  );
}
