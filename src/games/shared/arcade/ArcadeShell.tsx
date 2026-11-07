/**
 * The shell shared by the real-time arcade games: a menu (the game's options, play, resume, watch
 * the AI, best score); a canvas scaled to the screen and driven by a fixed-step loop (the
 * simulation never depends on the display rate); keyboard, touch buttons and pointer steering;
 * pause (P, Escape, or leaving the tab), restart (R); the HUD; the run's end with its result and
 * achievements; a save of an interrupted run.
 */
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator } from '../../../core/i18n';
import { isTypingTarget } from '../../../core/input/keyboard';
import { createFixedStepLoop } from '../../../core/rendering/fixed-step-loop';
import shared from '../sudoku/SudokuGame.module.css';
import styles from './Arcade.module.css';
import { ARCADE_STRINGS } from './i18n';
import type { ArcadeDef, Control } from './types';

type Mode = 'menu' | 'play' | 'watch';

interface Saved<S> {
  state: S;
  options: Record<string, string>;
}

const KEYS: Record<string, Control> = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ' ': 'fire',
  Enter: 'fire',
  Shift: 'alt',
  x: 'alt',
  X: 'alt',
};

const ICONS: Record<Control, typeof ArrowLeft> = {
  left: ArrowLeft,
  right: ArrowRight,
  up: ArrowUp,
  down: ArrowDown,
  fire: Zap,
  alt: RotateCcw,
};

export function ArcadeShell<S, A extends string>({
  services,
  def,
}: {
  services: GameServices;
  def: ArcadeDef<S, A>;
}) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...ARCADE_STRINGS.en, ...def.strings.en },
          es: { ...ARCADE_STRINGS.es, ...def.strings.es },
        },
        locale,
      ),
    [locale, def],
  );
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved<S>>({
        schema: 1,
        validate: (d: unknown): d is Saved<S> =>
          typeof d === 'object' && d !== null && def.validate((d as Saved<S>).state),
      }),
    [services, def],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const id = (s: string) => `${def.prefix}-${s}`;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [options, setOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.options.map((o) => [o.id, o.initial])),
  );
  const [saved, setSaved] = useState<Saved<S> | null>(null);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<[string, string | number][]>([]);
  const [ended, setEnded] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const stateRef = useRef<S | null>(null);
  const heldRef = useRef(new Set<Control>());
  // Presses since the last step, so a tap shorter than one step still counts.
  const tappedRef = useRef(new Set<Control>());
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useLatest(paused);
  const modeRef = useLatest(mode);
  const optionsRef = useLatest(options);
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const best = services.getStats()?.bestScore;

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && !def.over(d.state)) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot, def]);

  const begin = (m: Mode, state: S, opts: Record<string, string>) => {
    // Keys drive the game from here on, not the button that started it.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    stateRef.current = state;
    heldRef.current.clear();
    tappedRef.current.clear();
    setOptions(opts);
    setMode(m);
    setPaused(false);
    setEnded(null);
    setHud(def.hud(state));
    setRunId((r) => r + 1);
  };
  const fresh = (m: Mode, opts: Record<string, string>) =>
    begin(m, def.init(fixedSeed ?? randomSeed() >>> 0, opts), opts);

  useEffect(() => {
    if (mode === 'watch' && !stateRef.current) fresh('watch', options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (s: S) => {
    const svc = servicesRef.current;
    const [key, params] = def.ending(s);
    setEnded(t(key, params));
    if (modeRef.current !== 'play') return;
    svc.recordResult(def.result(s, optionsRef.current));
    def.achievements(s, optionsRef.current, (a) => svc.unlockAchievement(a));
    void slot.clear();
    setSaved(null);
  };

  // The fixed-step loop for the current run.
  useEffect(() => {
    if (mode === 'menu' || !stateRef.current) return;
    const watchPolicy = Object.values(def.policies)[0]!;
    let lastHud = '';
    const loop = createFixedStepLoop({
      hz: def.hz,
      update: () => {
        const s = stateRef.current;
        if (!s || pausedRef.current || def.over(s)) return;
        const action =
          modeRef.current === 'watch'
            ? watchPolicy(s)
            : def.control(
                s,
                new Set([...heldRef.current, ...tappedRef.current]),
                pointerRef.current,
              );
        tappedRef.current.clear();
        const next = def.step(s, action);
        stateRef.current = next;
        for (const k of def.sounds(s, next)) {
          const spec = def.soundBank[k];
          if (spec) servicesRef.current.playSound(spec);
        }
        if (def.over(next)) finish(next);
      },
      render: () => {
        const s = stateRef.current;
        if (!s) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) def.draw(ctx, s, { reducedMotion });
        const h = def.hud(s);
        const key = JSON.stringify(h);
        if (key !== lastHud) {
          lastHud = key;
          setHud(h);
        }
      },
    });
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, runId]);

  // Leaving the tab pauses a run in progress.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && modeRef.current === 'play') setPaused(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [modeRef]);

  const restart = () => fresh(modeRef.current === 'watch' ? 'watch' : 'play', optionsRef.current);

  // Held keys (and P / Escape / R).
  useEffect(() => {
    if (mode === 'menu') return;
    const down = (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        isTypingTarget(e.target) ||
        document.querySelector('dialog[open]')
      )
        return;
      const c = KEYS[e.key];
      if (c && modeRef.current === 'play') {
        heldRef.current.add(c);
        tappedRef.current.add(c);
        e.preventDefault();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setPaused((p) => !p);
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        restart();
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const c = KEYS[e.key];
      if (c) {
        heldRef.current.delete(c);
        // Space and Enter would otherwise also press whichever button has the focus.
        if (modeRef.current === 'play') e.preventDefault();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const toMenu = () => {
    const s = stateRef.current;
    if (modeRef.current === 'play' && s && !def.over(s)) {
      const kept = { state: s, options: optionsRef.current };
      setSaved(kept);
      void slot.save(kept);
    }
    stateRef.current = null;
    setMode('menu');
  };

  const toLogical = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * def.width,
      y: ((e.clientY - r.top) / r.height) * def.height,
    };
  };

  if (mode === 'menu') {
    return (
      <div className={shared.menu} data-testid={id('menu')}>
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {best !== undefined && <p className={shared.hintText}>{t('best', { n: best })}</p>}
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => begin('play', saved.state, saved.options)}
              data-testid={id('resume')}
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>{t('menu.resumeHint', { n: def.score(saved.state) })}</small>
              </span>
            </button>
          )}
          {def.options.map((o) => (
            <fieldset key={o.id} className={shared.group}>
              <legend>{t(o.label)}</legend>
              <div className={shared.segmented}>
                {o.values.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={options[o.id] === v}
                    onClick={() => setOptions((x) => ({ ...x, [o.id]: v }))}
                    data-testid={id(`${o.id}-${v}`)}
                  >
                    {t(`${o.id}.${v}`)}
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
              onClick={() => fresh('play', options)}
              data-testid={id('start')}
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', options)}
              data-testid={id('watch')}
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const press = (c: Control, on: boolean) => {
    if (on) {
      heldRef.current.add(c);
      tappedRef.current.add(c);
    } else heldRef.current.delete(c);
  };

  return (
    <div className={shared.play} data-testid={id('table')}>
      <div className={styles.hud} data-testid={id('hud')}>
        {hud.map(([k, v]) => (
          <span key={k}>
            {t(k)} <strong data-testid={id(`hud-${k}`)}>{v}</strong>
          </span>
        ))}
      </div>
      <div
        className={styles.stage}
        style={{
          aspectRatio: `${def.width} / ${def.height}`,
          ['--ratio' as string]: def.width / def.height,
        }}
      >
        <canvas
          ref={canvasRef}
          width={def.width}
          height={def.height}
          className={styles.canvas}
          aria-label={t('canvas')}
          role="img"
          data-testid={id('canvas')}
          onPointerDown={(e) => {
            if (!def.pointer || mode !== 'play') return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            pointerRef.current = toLogical(e);
          }}
          onPointerMove={(e) => {
            if (pointerRef.current) pointerRef.current = toLogical(e);
          }}
          onPointerUp={() => {
            pointerRef.current = null;
          }}
          onPointerCancel={() => {
            pointerRef.current = null;
          }}
        />
        {(paused || ended) && (
          <div className={styles.overlay} data-testid={id('overlay')}>
            <p>{ended ?? t('paused')}</p>
            {ended ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={restart}
                data-testid={id('again')}
              >
                <Play size={16} /> {t('again')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPaused(false)}
                data-testid={id('resume-run')}
              >
                <Play size={16} /> {t('resume')}
              </button>
            )}
          </div>
        )}
      </div>
      {mode === 'watch' && <p className={shared.hintText}>{t('watching')}</p>}
      {mode === 'play' && def.touch.length > 0 && (
        <div className={styles.pad}>
          {def.touch.map((c) => {
            const Icon = ICONS[c];
            return (
              <button
                key={c}
                type="button"
                className={styles.padBtn}
                aria-label={t(`control.${c}`)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  press(c, true);
                }}
                onPointerUp={() => press(c, false)}
                onPointerLeave={() => press(c, false)}
                onPointerCancel={() => press(c, false)}
                onContextMenu={(e) => e.preventDefault()}
                data-testid={id(`pad-${c}`)}
              >
                <Icon size={22} />
              </button>
            );
          })}
        </div>
      )}
      <div className={shared.controls}>
        {!ended && (
          <button
            type="button"
            className="btn"
            onClick={() => setPaused((p) => !p)}
            data-testid={id('pause')}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? t('resume') : t('pause')}
          </button>
        )}
        <button type="button" className="btn" onClick={restart} data-testid={id('restart')}>
          <RotateCcw size={16} /> {t('restart')}
        </button>
        <button type="button" className="btn" onClick={toMenu} data-testid={id('menu-btn')}>
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
