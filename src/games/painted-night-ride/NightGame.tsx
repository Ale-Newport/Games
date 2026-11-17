import { Bot, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { isTypingTarget } from '../../core/input/keyboard';
import { createFixedStepLoop } from '../../core/rendering/fixed-step-loop';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { STRINGS } from './i18n';
import styles from './Night.module.css';
import {
  controlsOf,
  courier,
  HZ,
  isRide,
  newRide,
  NONE,
  score,
  stepRide,
  type Controls,
  type Mode,
  type Ride,
} from './sim';
import { NightView } from './view3d';

interface Saved {
  ride: Ride;
}
const isSaved = (d: unknown): d is Saved =>
  typeof d === 'object' && d !== null && isRide((d as Saved).ride);
const MODES: Mode[] = ['starlight', 'constellation', 'free'];

const SOUNDS: Record<string, SoundSpec> = {
  orb: [
    { wave: 'sine', freq: 1047, duration: 0.12, gain: 0.08 },
    { wave: 'sine', freq: 1568, duration: 0.2, delay: 0.08, gain: 0.06 },
  ],
  deliver: [
    { wave: 'triangle', freq: 523, duration: 0.15, gain: 0.1 },
    { wave: 'triangle', freq: 659, duration: 0.15, delay: 0.12, gain: 0.1 },
    { wave: 'triangle', freq: 784, duration: 0.15, delay: 0.24, gain: 0.1 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.36, gain: 0.11 },
  ],
  leap: [{ wave: 'noise', freq: 0, duration: 0.15, gain: 0.04, lowpass: 900 }],
  trick: [{ wave: 'sine', freq: 880, freqEnd: 1320, duration: 0.2, gain: 0.08 }],
  combo: [{ wave: 'sine', freq: 880, freqEnd: 1760, duration: 0.3, gain: 0.09 }],
  bail: [{ wave: 'sawtooth', freq: 220, freqEnd: 110, duration: 0.3, gain: 0.07 }],
  land: [{ wave: 'noise', freq: 0, duration: 0.06, gain: 0.03, lowpass: 400 }],
  finish: [
    { wave: 'triangle', freq: 784, duration: 0.2, gain: 0.12 },
    { wave: 'triangle', freq: 988, duration: 0.2, delay: 0.18, gain: 0.12 },
    { wave: 'triangle', freq: 1175, duration: 0.2, delay: 0.36, gain: 0.12 },
    { wave: 'triangle', freq: 1568, duration: 0.6, delay: 0.54, gain: 0.13 },
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

const clock = (steps: number) => {
  const s = Math.floor(steps / HZ);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function NightGame({ services }: GameProps) {
  const t = useMemo(() => createTranslator(STRINGS, services.locale), [services.locale]);
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const params = services.launchParams;
  const seedFor = () => (params.deal ? Number(params.deal) : randomSeed()) >>> 0;
  const [mode, setMode] = useState<Mode>('starlight');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [run, setRun] = useState<{ ride: Ride; watch: boolean; id: number } | null>(() =>
    params.mode === 'watch' ? { ride: newRide(seedFor(), 'starlight'), watch: true, id: 1 } : null,
  );
  const [gl] = useState(hasWebGL);
  const best = services.getStats()?.bestScore;

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => !cancelled && d && !d.ride.over && setSaved(d));
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (watch: boolean, ride?: Ride) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setRun((r) => ({ ride: ride ?? newRide(seedFor(), mode), watch, id: (r?.id ?? 0) + 1 }));
  };

  if (!run)
    return (
      <div className={shared.menu} data-testid="nr-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('subtitle')}</p>
          {!gl && <p className={shared.hintText}>{t('nogl')}</p>}
          {best !== undefined && <p className={shared.hintText}>{t('best', { n: best })}</p>}
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(false, saved.ride)}
              data-testid="nr-resume"
            >
              <RotateCcw size={16} />
              <span>{t('resume')}</span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.mode')}</legend>
            <div className={shared.segmented}>
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  data-testid={`nr-mode-${m}`}
                >
                  {t(`mode.${m}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`mode.${mode}.hint`)}</p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(false)}
              data-testid="nr-start"
            >
              <Play size={16} /> {t('start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(true)}
              data-testid="nr-watch"
            >
              <Bot size={16} /> {t('watch')}
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <Ride3D
      key={run.id}
      services={services}
      t={t}
      initial={run.ride}
      watch={run.watch}
      gl={gl}
      onRestart={() => start(run.watch, newRide(seedFor(), run.ride.mode))}
      onMenu={(r) => {
        if (!run.watch && r && !r.over) {
          const kept = { ride: r };
          setSaved(kept);
          void slot.save(kept);
        }
        setRun(null);
      }}
      onFinish={(r) => {
        if (run.watch) return;
        void slot.clear();
        setSaved(null);
        services.recordResult({
          outcome: 'complete',
          score: score(r),
          timeMs: Math.round((r.t / HZ) * 1000),
          mode: r.mode,
        });
        if (r.mode === 'starlight') services.unlockAchievement('starlight');
        if (r.mode === 'constellation') services.unlockAchievement('constellation');
        if (r.mode === 'starlight' && r.t <= 180 * HZ) services.unlockAchievement('quick');
      }}
    />
  );
}

function Ride3D({
  services,
  t,
  initial,
  watch,
  gl,
  onRestart,
  onMenu,
  onFinish,
}: {
  services: GameProps['services'];
  t: ReturnType<typeof createTranslator>;
  initial: Ride;
  watch: boolean;
  gl: boolean;
  onRestart: () => void;
  onMenu: (r: Ride | null) => void;
  onFinish: (r: Ride) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rideRef = useRef<Ride>(initial);
  const keys = useRef(new Set<string>());
  const pad = useRef<Controls>({ ...NONE });
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState({
    carried: 0,
    delivered: initial.delivered,
    total: initial.orbs.length,
    tricks: 0,
    trickScore: 0,
    t: 0,
    over: false,
    score: 0,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [glFailed, setGlFailed] = useState(false);
  const pausedRef = useLatest(paused);
  const servicesRef = useLatest(services);
  const onFinishRef = useLatest(onFinish);
  const tRef = useLatest(t);
  const coarse = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches,
    [],
  );

  useEffect(() => {
    let view: NightView | null = null;
    if (gl && canvasRef.current) {
      try {
        view = new NightView(canvasRef.current, rideRef.current);
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
    let last = performance.now();
    let frames = 0;
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    const say = (text: string) => {
      setToast(text);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => setToast(null), 1400);
    };
    const loop = createFixedStepLoop({
      hz: HZ,
      update: () => {
        const r = rideRef.current;
        if (pausedRef.current || r.over) return;
        let c: Controls;
        if (watch) c = controlsOf(courier(r));
        else {
          const k = keys.current;
          const p = pad.current;
          c = {
            pedal: k.has('KeyW') || k.has('ArrowUp') || p.pedal,
            brake: k.has('KeyS') || k.has('ArrowDown') || p.brake,
            steer:
              (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) -
              (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) +
              p.steer,
            leap: k.has('Space') || p.leap,
            trick: k.has('KeyE') || p.trick,
            walk: k.has('KeyF') || p.walk,
          };
        }
        const next = stepRide(r, c);
        rideRef.current = next;
        const tr = tRef.current;
        for (const e of next.events) {
          const spec = SOUNDS[e];
          if (spec) servicesRef.current.playSound(spec);
          if (e === 'orb') say(tr('toast.orb'));
          if (e === 'deliver') say(tr('toast.deliver', { n: next.delivered - r.delivered }));
          if (e === 'trick' || e === 'combo') {
            say(tr(`toast.${e}`));
            if (!watch) servicesRef.current.unlockAchievement(e === 'combo' ? 'double' : 'spin');
          }
          if (e === 'bail' || e === 'dismount' || e === 'mount') say(tr(`toast.${e}`));
          if (e === 'deliver' && !watch) servicesRef.current.unlockAchievement('first-star');
        }
        if (next.over) onFinishRef.current(next);
      },
      render: () => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const r = rideRef.current;
        view?.render(r, { reducedMotion: servicesRef.current.reducedMotion, dt, time: now / 1000 });
        if (++frames % 6 === 0)
          setHud((h) => {
            const n = {
              carried: r.carried,
              delivered: r.delivered,
              total: r.orbs.length,
              tricks: r.tricks,
              trickScore: r.trickScore,
              t: r.t,
              over: r.over,
              score: score(r),
            };
            return JSON.stringify(n) === JSON.stringify(h) ? h : n;
          });
      },
    });
    loop.start();
    return () => {
      loop.stop();
      ro?.disconnect();
      view?.dispose();
      if (toastTimer) clearTimeout(toastTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.metaKey ||
        e.ctrlKey ||
        isTypingTarget(e.target) ||
        document.querySelector('dialog[open]')
      )
        return;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        setPaused((p) => !p);
        e.preventDefault();
        return;
      }
      if (watch) return;
      keys.current.add(e.code);
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    const hidden = () => document.hidden && setPaused(true);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [watch]);

  // Touch buttons: data-k names the control, data-v its value while held.
  const padSet = (e: React.PointerEvent<HTMLButtonElement>, on: boolean) => {
    const k = e.currentTarget.dataset.k as keyof Controls;
    const v = e.currentTarget.dataset.v;
    const value = k === 'steer' ? (on ? Number(v) : 0) : on;
    pad.current = { ...pad.current, [k]: value };
  };
  const padDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    padSet(e, true);
  };
  const padUp = (e: React.PointerEvent<HTMLButtonElement>) => padSet(e, false);
  const padProps = {
    onPointerDown: padDown,
    onPointerUp: padUp,
    onPointerCancel: padUp,
    onPointerLeave: padUp,
  };

  const free = initial.mode === 'free';

  return (
    <div className={styles.wrap} data-testid="nr-play">
      <div className={styles.stage} ref={stageRef}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={t('canvas')}
          data-testid="nr-canvas"
        />
        {(!gl || glFailed) && <div className={styles.nogl}>{t('nogl')}</div>}
        <div className={styles.hud}>
          <div className={styles.stats}>
            <div data-testid="nr-carried">{t('carried', { n: hud.carried })}</div>
            <div>
              <strong data-testid="nr-delivered">
                {free
                  ? t('deliveredFree', { n: hud.delivered })
                  : t('delivered', { n: hud.delivered, m: hud.total })}
              </strong>
            </div>
            <div data-testid="nr-tricks">{t('tricks', { n: hud.tricks, s: hud.trickScore })}</div>
          </div>
          <div className={styles.time} data-testid="nr-time">
            {clock(hud.t)}
          </div>
          {toast && (
            <div className={styles.toast} role="status" data-testid="nr-toast">
              {toast}
            </div>
          )}
          {!coarse && !watch && <div className={styles.keys}>{t('keys')}</div>}
        </div>
        {coarse && !watch && !paused && !hud.over && (
          <div className={styles.pad}>
            <div>
              <button
                type="button"
                {...padProps}
                data-k="steer"
                data-v="-1"
                aria-label={t('pad.left')}
              >
                {t('pad.left')}
              </button>
              <button
                type="button"
                {...padProps}
                data-k="pedal"
                data-v="true"
                data-testid="nr-pad-pedal"
              >
                {t('pad.pedal')}
              </button>
              <button
                type="button"
                {...padProps}
                data-k="steer"
                data-v="1"
                aria-label={t('pad.right')}
              >
                {t('pad.right')}
              </button>
            </div>
            <div>
              <button type="button" {...padProps} data-k="brake" data-v="true">
                {t('pad.brake')}
              </button>
              <button
                type="button"
                {...padProps}
                data-k="leap"
                data-v="true"
                data-testid="nr-pad-leap"
              >
                {t('pad.leap')}
              </button>
              <button type="button" {...padProps} data-k="trick" data-v="true">
                {t('pad.trick')}
              </button>
              <button type="button" {...padProps} data-k="walk" data-v="true">
                {t('pad.walk')}
              </button>
            </div>
          </div>
        )}
        {paused && !hud.over && (
          <div className={styles.overlay} data-testid="nr-overlay">
            <h2>{t('paused')}</h2>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPaused(false)}
                data-testid="nr-resume-run"
              >
                {t('resumeRun')}
              </button>
              <button type="button" className="btn" onClick={() => onMenu(rideRef.current)}>
                {t('menu')}
              </button>
            </div>
          </div>
        )}
        {hud.over && (
          <div className={styles.overlay} data-testid="nr-end">
            <h2>{t('finished')}</h2>
            <p data-testid="nr-summary">
              {t('summary', { t: clock(hud.t), k: hud.tricks, s: hud.score })}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onRestart}
                data-testid="nr-again"
              >
                {t('again')}
              </button>
              <button type="button" className="btn" onClick={() => onMenu(null)}>
                {t('menu')}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className="btn"
          onClick={() => setPaused((p) => !p)}
          data-testid="nr-pause"
        >
          {t('pause')}
        </button>
        <button type="button" className="btn" onClick={onRestart} data-testid="nr-restart">
          {t('restart')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onMenu(rideRef.current)}
          data-testid="nr-menu-btn"
        >
          {t('menu')}
        </button>
      </div>
    </div>
  );
}
