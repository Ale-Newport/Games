import { Bot, Play, RotateCcw } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps, GameServices } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { isTypingTarget } from '../../core/input/keyboard';
import { createFixedStepLoop } from '../../core/rendering/fixed-step-loop';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { create, OPTIONS, SIM } from './definition';
import styles from './Game.module.css';
import {
  HZ,
  isMatch,
  place,
  standings,
  stepMatch,
  think,
  weaponOf,
  won,
  type Input,
  type Match,
} from './sim';
import { STRINGS } from './strings';
import { ArenaView } from './view3d';

interface Saved {
  match: Match;
  options: Record<string, string>;
}

const isSaved = (d: unknown): d is Saved =>
  typeof d === 'object' &&
  d !== null &&
  isMatch((d as Saved).match) &&
  typeof (d as Saved).options === 'object';

const defaults = () => Object.fromEntries(OPTIONS.map((o) => [o.id, o.initial]));

const SOUNDS: Record<string, SoundSpec> = {
  'shot-rifle': [
    { wave: 'noise', freq: 0, duration: 0.07, gain: 0.12, lowpass: 2600 },
    { wave: 'square', freq: 150, freqEnd: 60, duration: 0.06, gain: 0.05 },
  ],
  'shot-sniper': [
    { wave: 'noise', freq: 0, duration: 0.3, gain: 0.2, lowpass: 1400 },
    { wave: 'sine', freq: 90, freqEnd: 40, duration: 0.25, gain: 0.12 },
  ],
  'shot-pistol': [{ wave: 'noise', freq: 0, duration: 0.06, gain: 0.1, lowpass: 3200 }],
  hit: [{ wave: 'square', freq: 1300, duration: 0.03, gain: 0.05 }],
  'hit-head': [{ wave: 'square', freq: 1900, duration: 0.05, gain: 0.07 }],
  kill: [
    { wave: 'triangle', freq: 880, duration: 0.07, gain: 0.13 },
    { wave: 'triangle', freq: 1320, duration: 0.15, delay: 0.07, gain: 0.13 },
  ],
  'kill-head': [
    { wave: 'triangle', freq: 990, duration: 0.07, gain: 0.14 },
    { wave: 'triangle', freq: 1480, duration: 0.18, delay: 0.07, gain: 0.14 },
  ],
  hurt: [{ wave: 'sawtooth', freq: 140, freqEnd: 90, duration: 0.12, gain: 0.08 }],
  die: [{ wave: 'sawtooth', freq: 260, freqEnd: 60, duration: 0.6, gain: 0.1 }],
  reload: [
    { wave: 'square', freq: 500, duration: 0.03, gain: 0.05 },
    { wave: 'square', freq: 700, duration: 0.03, delay: 0.35, gain: 0.05 },
  ],
  empty: [{ wave: 'square', freq: 900, duration: 0.02, gain: 0.04 }],
  swap: [{ wave: 'square', freq: 400, duration: 0.03, gain: 0.04 }],
  spawn: [{ wave: 'sine', freq: 520, freqEnd: 780, duration: 0.2, gain: 0.06 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
  lose: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
};

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function Game({ services }: GameProps) {
  const t = useMemo(() => createTranslator(STRINGS, services.locale), [services.locale]);
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [saved, setSaved] = useState<Saved | null>(null);
  const [options, setOptions] = useState<Record<string, string>>(defaults);
  const params = services.launchParams;
  const seedFor = () => (params.deal ? Number(params.deal) : randomSeed()) >>> 0;
  const [run, setRun] = useState<{
    match: Match;
    options: Record<string, string>;
    watch: boolean;
    id: number;
  } | null>(() =>
    params.mode === 'watch'
      ? { match: create(seedFor(), defaults()), options: defaults(), watch: true, id: 1 }
      : null,
  );
  const [gl] = useState(hasWebGL);
  const best = services.getStats()?.bestScore;

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && !d.match.over) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (watch: boolean, opts: Record<string, string>, match?: Match) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setRun((r) => ({
      match: match ?? create(seedFor(), opts),
      options: opts,
      watch,
      id: (r?.id ?? 0) + 1,
    }));
  };

  if (!run)
    return (
      <div className={shared.menu} data-testid="fps-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('subtitle')}</p>
          {!gl && <p className={shared.hintText}>{t('menu.webgl')}</p>}
          {best !== undefined && <p className={shared.hintText}>{t('menu.best', { n: best })}</p>}
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(false, saved.options, saved.match)}
              data-testid="fps-resume"
            >
              <RotateCcw size={16} />
              <span>{t('menu.resume')}</span>
            </button>
          )}
          {OPTIONS.map((o) => (
            <fieldset key={o.id} className={shared.group}>
              <legend>{t(o.label)}</legend>
              <div className={shared.segmented}>
                {o.values.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={options[o.id] === v}
                    onClick={() => setOptions((x) => ({ ...x, [o.id]: v }))}
                    data-testid={`fps-${o.id}-${v}`}
                  >
                    {o.id === 'bots' ? v : t(`${o.id}.${v}`)}
                  </button>
                ))}
              </div>
              {t(`${o.id}.${options[o.id]}.hint`) !== `${o.id}.${options[o.id]}.hint` && (
                <p className={shared.hintText}>{t(`${o.id}.${options[o.id]}.hint`)}</p>
              )}
            </fieldset>
          ))}
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(false, options)}
              data-testid="fps-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(true, options)}
              data-testid="fps-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <Arena
      key={run.id}
      services={services}
      t={t}
      initial={run.match}
      watch={run.watch}
      gl={gl}
      onRestart={() => start(run.watch, run.options)}
      onMenu={(m) => {
        if (!run.watch && m && !m.over) {
          const kept = { match: m, options: run.options };
          setSaved(kept);
          void slot.save(kept);
        }
        setRun(null);
      }}
      onFinish={(m) => {
        if (run.watch) return;
        services.recordResult(SIM.result(m, run.options));
        const me = m.fighters[0]!;
        const unlock = (id: string) => services.unlockAchievement(id);
        if (me.kills > 0) unlock('first-blood');
        if (me.headshots >= 5) unlock('headhunter');
        if (me.bestStreak >= 5) unlock('streak-5');
        if (won(m)) {
          unlock('win');
          if (run.options.level === 'hard') unlock('win-hard');
          if (run.options.loadout === 'marksman') unlock('marksman-win');
        }
        void slot.clear();
        setSaved(null);
      }}
    />
  );
}

interface HudSnap {
  hp: number;
  ammo: number;
  mag: number;
  weapon: string;
  reloading: boolean;
  scoped: boolean;
  kills: number;
  left: number;
  goal: number;
  board: { name: string; kills: number; me: boolean }[];
  feed: { killer: string; victim: string; head: boolean; key: string }[];
  dead: { by: string; n: number } | null;
  table: { id: number; name: string; kills: number; deaths: number }[];
}

function snap(m: Match): HudSnap {
  const me = m.fighters[0]!;
  const w = weaponOf(me);
  const name = (id: number) => m.fighters.find((f) => f.id === id)?.name ?? '';
  const order = standings(m);
  const board = order.slice(0, 3).map((f) => ({ name: f.name, kills: f.kills, me: f.id === 0 }));
  if (!board.some((b) => b.me)) board.push({ name: '', kills: me.kills, me: true });
  return {
    hp: Math.ceil(me.hp),
    ammo: me.ammo[me.weapon],
    mag: w.mag,
    weapon: w.id,
    reloading: me.reload > 0,
    scoped: me.aiming && w.id === 'sniper' && me.alive,
    kills: me.kills,
    left: Math.max(0, Math.ceil((m.limit - m.t) / HZ)),
    goal: m.goal,
    board,
    feed: m.feed.map((k) => ({
      killer: name(k.killer),
      victim: name(k.victim),
      head: k.head,
      key: `${k.t}-${k.killer}-${k.victim}`,
    })),
    dead: me.alive ? null : { by: name(me.lastHitBy), n: Math.ceil(me.respawn / HZ) },
    table: order.map((f) => ({ id: f.id, name: f.name, kills: f.kills, deaths: f.deaths })),
  };
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function Arena({
  services,
  t,
  initial,
  watch,
  gl,
  onRestart,
  onMenu,
  onFinish,
}: {
  services: GameServices;
  t: Translator;
  initial: Match;
  watch: boolean;
  gl: boolean;
  onRestart: () => void;
  onMenu: (m: Match | null) => void;
  onFinish: (m: Match) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hitRef = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const crossRef = useRef<HTMLDivElement | null>(null);
  const matchRef = useRef<Match>(initial);
  const keys = useRef(new Set<string>());
  const mouse = useRef({ fire: false, aim: false, dyaw: 0, dpitch: 0 });
  const touch = useRef({
    fx: 0,
    sx: 0,
    fire: false,
    jump: false,
    crouch: false,
    reload: false,
    swap: false,
    stick: -1,
    look: -1,
    lx: 0,
    ly: 0,
  });
  const [touchAim, setTouchAim] = useState(false);
  const touchAimRef = useLatest(touchAim);
  const coarse = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches,
    [],
  );
  const [engaged, setEngaged] = useState(watch || coarse);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState<string | null>(null);
  const [scores, setScores] = useState(false);
  const [hud, setHud] = useState<HudSnap>(() => snap(initial));
  const [glFailed, setGlFailed] = useState(false);
  const runningRef = useLatest(engaged && !paused && !ended);
  const servicesRef = useLatest(services);
  const onFinishRef = useLatest(onFinish);
  const stickKnob = useRef<HTMLSpanElement | null>(null);

  // The loop: fixed 60 Hz steps, render every frame.
  useEffect(() => {
    let view: ArenaView | null = null;
    if (gl && canvasRef.current) {
      try {
        view = new ArenaView(canvasRef.current, matchRef.current);
      } catch {
        view = null;
        queueMicrotask(() => setGlFailed(true));
      }
    }
    const resize = () => {
      const el = stageRef.current;
      if (el && view) view.resize(el.clientWidth, el.clientHeight);
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    let frames = 0;
    let lastHud = '';
    let hitT = 0;
    let hurtT = 0;
    let last = performance.now();
    const loop = createFixedStepLoop({
      hz: HZ,
      update: () => {
        const m = matchRef.current;
        if (!runningRef.current || m.over) return;
        let input: Input;
        if (watch) input = think(m, 0, 'hard')[0];
        else {
          const k = keys.current;
          const tc = touch.current;
          const ms = mouse.current;
          const fwd =
            (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) -
            (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) +
            tc.fx;
          const side =
            (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) -
            (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) +
            tc.sx;
          const me = m.fighters[0]!;
          input = {
            fx: Math.max(-1, Math.min(1, fwd)),
            sx: Math.max(-1, Math.min(1, side)),
            dyaw: ms.dyaw,
            dpitch: ms.dpitch,
            fire: ms.fire || tc.fire,
            aim: ms.aim || touchAimRef.current,
            jump: k.has('Space') || tc.jump,
            crouch:
              k.has('ShiftLeft') ||
              k.has('ShiftRight') ||
              k.has('KeyC') ||
              k.has('ControlLeft') ||
              tc.crouch,
            reload: k.has('KeyR') || tc.reload,
            swap:
              k.has('KeyQ') ||
              (k.has('Digit1') && me.weapon === 1) ||
              (k.has('Digit2') && me.weapon === 0) ||
              tc.swap,
          };
          ms.dyaw = 0;
          ms.dpitch = 0;
          tc.reload = false;
          tc.swap = false;
        }
        const next = stepMatch(m, input);
        matchRef.current = next;
        for (const e of next.events) {
          const spec = SOUNDS[e];
          if (spec) servicesRef.current.playSound(spec);
          if (e === 'hit' || e === 'hit-head' || e === 'kill' || e === 'kill-head') {
            hitT = performance.now();
            if (hitRef.current)
              hitRef.current.style.color = e.startsWith('kill')
                ? '#ff4d4d'
                : e === 'hit-head'
                  ? '#ffd23f'
                  : '#ffffff';
          }
          if (e === 'hurt' || e === 'die') hurtT = performance.now();
        }
        if (next.over) {
          const me = next.fighters[0]!;
          setEnded(
            won(next)
              ? t('end.win', { k: me.kills })
              : t('end.place', { p: place(next), k: me.kills }),
          );
          setScores(true);
          setHud(snap(next));
          onFinishRef.current(next);
        }
      },
      render: () => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const m = matchRef.current;
        view?.render(m, { reducedMotion: servicesRef.current.reducedMotion, dt });
        if (hitRef.current)
          hitRef.current.style.opacity = String(Math.max(0, 1 - (now - hitT) / 180));
        if (vignetteRef.current)
          vignetteRef.current.style.opacity = String(Math.max(0, 1 - (now - hurtT) / 450));
        const me = m.fighters[0]!;
        if (crossRef.current) {
          const w = weaponOf(me);
          const moving = Math.hypot(me.vx, me.vz) > 1.2 || !me.ground;
          const spread = (me.aiming ? w.aimed : w.hip) + (moving ? w.moving : 0) + me.bloom;
          crossRef.current.style.setProperty('--gap', `${4 + spread * 380}px`);
        }
        if (++frames % 6 === 0) {
          const h = snap(m);
          const key = JSON.stringify(h);
          if (key !== lastHud) {
            lastHud = key;
            setHud(h);
          }
        }
      },
    });
    loop.start();
    return () => {
      loop.stop();
      ro?.disconnect();
      view?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard.
  useEffect(() => {
    if (watch) {
      const down = (e: KeyboardEvent) => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') setPaused((p) => !p);
      };
      window.addEventListener('keydown', down);
      return () => window.removeEventListener('keydown', down);
    }
    const down = (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.metaKey ||
        isTypingTarget(e.target) ||
        document.querySelector('dialog[open]')
      )
        return;
      if (e.code === 'Tab') {
        setScores(true);
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyP' || (e.code === 'Escape' && !document.pointerLockElement)) {
        setPaused((p) => !p);
        e.preventDefault();
        return;
      }
      keys.current.add(e.code);
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        setScores(false);
        e.preventDefault();
      }
      keys.current.delete(e.code);
    };
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [watch]);

  // Mouse look with pointer lock; losing the lock pauses.
  useEffect(() => {
    if (watch) return;
    const canvas = canvasRef.current;
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      mouse.current.dyaw -= e.movementX * 0.0022 * (matchRef.current.fighters[0]!.aiming ? 0.5 : 1);
      mouse.current.dpitch -=
        e.movementY * 0.0022 * (matchRef.current.fighters[0]!.aiming ? 0.5 : 1);
    };
    const lockChange = () => {
      if (document.pointerLockElement !== canvas && !matchRef.current.over) {
        mouse.current.fire = false;
        mouse.current.aim = false;
        setPaused(true);
      }
    };
    const hidden = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('pointerlockchange', lockChange);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('pointerlockchange', lockChange);
      document.removeEventListener('visibilitychange', hidden);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    };
  }, [watch]);

  const lock = () => {
    const c = canvasRef.current;
    if (c && !coarse && c.requestPointerLock) {
      try {
        const p = c.requestPointerLock() as unknown;
        if (p instanceof Promise) p.catch(() => undefined);
      } catch {
        // Pointer lock is optional: keys and drag-to-look still work.
      }
    }
  };

  const engage = () => {
    setEngaged(true);
    setPaused(false);
    lock();
  };

  // Without pointer lock (or with a mouse button held outside it), dragging on the arena looks around.
  const onCanvasDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (watch) return;
    if (e.pointerType === 'mouse') {
      if (e.button === 0) mouse.current.fire = true;
      if (e.button === 2) mouse.current.aim = true;
      if (document.pointerLockElement !== canvasRef.current) lock();
    }
  };
  const onCanvasUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (e.button === 0) mouse.current.fire = false;
    if (e.button === 2) mouse.current.aim = false;
  };
  const onCanvasMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (
      watch ||
      e.pointerType !== 'mouse' ||
      document.pointerLockElement === canvasRef.current ||
      !e.buttons
    )
      return;
    mouse.current.dyaw -= e.movementX * 0.004;
    mouse.current.dpitch -= e.movementY * 0.004;
  };

  // Touch: a stick on the left, drag to look on the right.
  const stickDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    touch.current.stick = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    stickMove(e);
  };
  const stickMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (touch.current.stick !== e.pointerId) return;
    const r = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - r.left) / r.width) * 2 - 1;
    let y = ((e.clientY - r.top) / r.height) * 2 - 1;
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    touch.current.sx = x;
    touch.current.fx = -y;
    if (stickKnob.current)
      stickKnob.current.style.transform = `translate(calc(-50% + ${x * 60}%), calc(-50% + ${y * 60}%))`;
  };
  const stickUp = () => {
    touch.current.stick = -1;
    touch.current.fx = 0;
    touch.current.sx = 0;
    if (stickKnob.current) stickKnob.current.style.transform = 'translate(-50%, -50%)';
  };
  const lookDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    touch.current.look = e.pointerId;
    touch.current.lx = e.clientX;
    touch.current.ly = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const lookMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (touch.current.look !== e.pointerId) return;
    const k = touchAimRef.current ? 0.0035 : 0.007;
    mouse.current.dyaw -= (e.clientX - touch.current.lx) * k;
    mouse.current.dpitch -= (e.clientY - touch.current.ly) * k;
    touch.current.lx = e.clientX;
    touch.current.ly = e.clientY;
  };
  const lookUp = () => {
    touch.current.look = -1;
  };
  const hold = (key: 'fire' | 'jump' | 'crouch') => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      touch.current[key] = true;
    },
    onPointerUp: () => {
      touch.current[key] = false;
    },
    onPointerCancel: () => {
      touch.current[key] = false;
    },
    onPointerLeave: () => {
      touch.current[key] = false;
    },
  });

  const toMenu = () => {
    if (document.pointerLockElement) document.exitPointerLock?.();
    onMenu(matchRef.current);
  };

  const showScores = scores || !!ended;
  const low = hud.hp <= 35;

  return (
    <div
      className={`${styles.wrap} ${coarse && !watch ? styles.touchMode : ''}`}
      data-testid="fps-play"
    >
      <div className={styles.stage} ref={stageRef}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label={t('canvas')}
          role="img"
          data-testid="fps-canvas"
          onPointerDown={onCanvasDown}
          onPointerUp={onCanvasUp}
          onPointerMove={onCanvasMove}
          onContextMenu={(e) => e.preventDefault()}
        />
        {(!gl || glFailed) && <div className={styles.nogl}>{t('menu.webgl')}</div>}
        <div className={styles.hud}>
          {hud.scoped && <div className={styles.scope} />}
          <div className={styles.vignette} ref={vignetteRef} />
          <div className={styles.top}>
            <strong data-testid="fps-time">{clock(hud.left)}</strong>
            <small>{t('hud.goal', { n: hud.goal })}</small>
          </div>
          <div className={styles.board} data-testid="fps-board">
            {hud.board.map((b, i) => (
              <div key={i} className={b.me ? styles.me : undefined}>
                {b.me ? t('hud.you') : b.name} · {b.kills}
              </div>
            ))}
          </div>
          <div className={styles.feed}>
            {hud.feed.map((f) => (
              <span key={f.key}>
                {f.killer || t('hud.you')} ⌖ {f.victim || t('hud.you')}
                {f.head && <em> ({t('feed.head')})</em>}
              </span>
            ))}
          </div>
          {!hud.scoped && (
            <div className={styles.cross} ref={crossRef} aria-hidden="true">
              <i
                style={{ left: 'calc(-1 * var(--gap, 6px) - 8px)', top: -1, width: 8, height: 2 }}
              />
              <i style={{ left: 'var(--gap, 6px)', top: -1, width: 8, height: 2 }} />
              <i
                style={{ top: 'calc(-1 * var(--gap, 6px) - 8px)', left: -1, width: 2, height: 8 }}
              />
              <i style={{ top: 'var(--gap, 6px)', left: -1, width: 2, height: 8 }} />
            </div>
          )}
          <div className={styles.hit} ref={hitRef} aria-hidden="true" />
          {hud.dead && !ended && (
            <div className={styles.death} data-testid="fps-dead">
              {t('dead.by', { who: hud.dead.by || '?' })}
              <br />
              <small>{t('dead.respawn', { n: hud.dead.n })}</small>
            </div>
          )}
          <div className={styles.health}>
            <small>
              {t('hud.hp')} <strong data-testid="fps-hp">{hud.hp}</strong>
            </small>
            <div className={`${styles.bar} ${low ? styles.low : ''}`}>
              <div style={{ width: `${hud.hp}%` }} />
            </div>
          </div>
          <div className={styles.ammo}>
            <strong data-testid="fps-ammo">{hud.ammo}</strong> / {hud.mag}
            <small>{hud.reloading ? t('hud.reloading') : t(`weapon.${hud.weapon}`)}</small>
            <small>
              {t('hud.kills')} <span data-testid="fps-kills">{hud.kills}</span>
            </small>
          </div>
        </div>
        {coarse && !watch && engaged && !paused && !ended && (
          <div className={styles.touch}>
            <div
              className={styles.look}
              onPointerDown={lookDown}
              onPointerMove={lookMove}
              onPointerUp={lookUp}
              onPointerCancel={lookUp}
            />
            <div
              className={styles.stick}
              onPointerDown={stickDown}
              onPointerMove={stickMove}
              onPointerUp={stickUp}
              onPointerCancel={stickUp}
              data-testid="fps-stick"
            >
              <span ref={stickKnob} />
            </div>
            <div className={styles.buttons}>
              <button type="button" {...hold('jump')} data-testid="fps-jump">
                {t('touch.jump')}
              </button>
              <button type="button" {...hold('crouch')}>
                {t('touch.crouch')}
              </button>
              <button type="button" aria-pressed={touchAim} onClick={() => setTouchAim((a) => !a)}>
                {t('touch.aim')}
              </button>
              <button type="button" onClick={() => (touch.current.reload = true)}>
                {t('touch.reload')}
              </button>
              <button type="button" onClick={() => (touch.current.swap = true)}>
                {t('touch.swap')}
              </button>
              <button type="button" {...hold('fire')} data-testid="fps-fire">
                {t('touch.fire')}
              </button>
            </div>
          </div>
        )}
        {!engaged && !ended && (
          <button
            type="button"
            className={styles.overlay}
            onClick={engage}
            data-testid="fps-engage"
          >
            <p>
              <strong>{t('lock.click')}</strong>
            </p>
            <p>
              <small>{t('lock.hint')}</small>
            </p>
          </button>
        )}
        {engaged && paused && !ended && (
          <div className={styles.overlay} data-testid="fps-overlay">
            <p>{t('paused')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={engage}
                data-testid="fps-resume-run"
              >
                {t('resume')}
              </button>
              <button type="button" className="btn" onClick={toMenu}>
                {t('menu')}
              </button>
            </div>
          </div>
        )}
        {showScores && (
          <div
            className={styles.overlay}
            data-testid={ended ? 'fps-end' : 'fps-scores'}
            style={ended ? undefined : { pointerEvents: 'none' }}
          >
            {ended && <p data-testid="fps-result">{ended}</p>}
            <table className={styles.scores}>
              <caption>{t('scores')}</caption>
              <thead>
                <tr>
                  <th>{t('col.player')}</th>
                  <th>{t('col.kills')}</th>
                  <th>{t('col.deaths')}</th>
                </tr>
              </thead>
              <tbody>
                {hud.table.map((f) => (
                  <tr key={f.id} className={f.id === 0 ? styles.me : undefined}>
                    <td>{f.id === 0 ? t('hud.you') : f.name}</td>
                    <td>{f.kills}</td>
                    <td>{f.deaths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ended && (
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRestart}
                  data-testid="fps-again"
                >
                  {t('again')}
                </button>
                <button type="button" className="btn" onClick={() => onMenu(null)}>
                  {t('menu')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className="btn"
          onClick={() => setPaused((p) => !p)}
          data-testid="fps-pause"
        >
          {t('pause')}
        </button>
        <button type="button" className="btn" onClick={onRestart} data-testid="fps-restart">
          {t('restart')}
        </button>
        <button type="button" className="btn" onClick={toMenu} data-testid="fps-menu-btn">
          {t('menu')}
        </button>
      </div>
    </div>
  );
}
