import { useEffect, useMemo, useRef, useState } from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { flagUrl } from '../shared/world/world';
import type { Category, Item } from './data';
import {
  guess,
  isRight,
  itemA,
  itemB,
  MODES,
  newRun,
  type Guess,
  type Mode,
  type Run,
} from './engine';
import styles from './HigherLower.module.css';
import { STRINGS } from './i18n';

interface Bests {
  best: Partial<Record<Mode, number>>;
}
const isBests = (d: unknown): d is Bests =>
  typeof d === 'object' && d !== null && typeof (d as Bests).best === 'object';

const SOUNDS: Record<string, SoundSpec> = {
  right: [
    { wave: 'triangle', freq: 660, duration: 0.08, gain: 0.1 },
    { wave: 'triangle', freq: 990, duration: 0.14, delay: 0.07, gain: 0.1 },
  ],
  wrong: [{ wave: 'sawtooth', freq: 220, freqEnd: 110, duration: 0.4, gain: 0.09 }],
  tick: [{ wave: 'square', freq: 1200, duration: 0.015, gain: 0.02 }],
};

const ICON: Record<Mode, string> = {
  population: '👥',
  area: '🗺️',
  mountains: '🏔️',
  rivers: '🏞️',
  animals: '🐾',
  mix: '🎲',
};
const TINT: Record<Category, [string, string]> = {
  population: ['#3a2f7a', '#7c5cff'],
  area: ['#14532d', '#2f9e44'],
  mountains: ['#334155', '#64748b'],
  rivers: ['#0c4a6e', '#0ea5e9'],
  animals: ['#7c2d12', '#ea580c'],
};

function Flag({ iso2 }: { iso2: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void flagUrl(iso2).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [iso2]);
  return url ? (
    <img className={styles.flag} src={url} alt="" />
  ) : (
    <span className={styles.icon}>🏳️</span>
  );
}

function format(item: Item, value: number, locale: string, t: Translator): [string, string] {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: value < 10 ? 1 : 0 });
  if (item.cat === 'animals' && item.value < 1)
    return [nf.format(Math.round(value * 1000)), t('unit.animals.g')];
  return [nf.format(value), t(`unit.${item.cat}`)];
}

/** Counts up to `value` over ~0.9 s (at once with reduced motion). */
function CountUp({
  item,
  locale,
  t,
  instant,
}: {
  item: Item;
  locale: string;
  t: Translator;
  instant: boolean;
}) {
  const [shown, setShown] = useState(instant ? item.value : 0);
  useEffect(() => {
    if (instant) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 900);
      setShown(item.value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [item, instant]);
  const [n, unit] = format(item, shown, locale, t);
  return (
    <>
      <div className={styles.value} data-testid="hl-b-value">
        {n}
      </div>
      <div className={styles.unit}>{unit}</div>
    </>
  );
}

export function HigherLowerGame({ services }: GameProps) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const slot = useMemo(
    () => services.saveSlot<Bests>({ schema: 1, validate: isBests }),
    [services],
  );
  const [bests, setBests] = useState<Bests>({ best: {} });
  const [mode, setMode] = useState<Mode>('population');
  const [run, setRun] = useState<Run | null>(null);
  const [reveal, setReveal] = useState<{ g: Guess; right: boolean; next: Run } | null>(null);
  const servicesRef = useLatest(services);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seedFor = () =>
    (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
  const name = (i: Item) => (locale === 'es' ? i.es : i.en);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => !cancelled && d && setBests(d));
    return () => {
      cancelled = true;
    };
  }, [slot]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const finish = (r: Run) => {
    const svc = servicesRef.current;
    svc.recordResult({ outcome: 'complete', score: r.score, mode: r.mode });
    if (r.score >= 10) svc.unlockAchievement('score-10');
    if (r.score >= 25) svc.unlockAchievement('score-25');
    if (r.score >= 50) svc.unlockAchievement('score-50');
    if (r.mode === 'mix' && r.score >= 20) svc.unlockAchievement('mix-20');
    const best = { ...bests.best, [r.mode]: Math.max(bests.best[r.mode] ?? 0, r.score) };
    if (
      ['population', 'area', 'mountains', 'rivers', 'animals'].every(
        (m) => (best[m as Mode] ?? 0) >= 10,
      )
    )
      svc.unlockAchievement('all-categories');
    const next = { best };
    setBests(next);
    void slot.save(next);
  };

  const choose = (g: Guess) => {
    if (!run || reveal || run.over) return;
    const right = isRight(run, g);
    const next = guess(run, g);
    setReveal({ g, right, next });
    const wait = services.reducedMotion ? 700 : 1500;
    timer.current = setTimeout(() => {
      servicesRef.current.playSound(right ? SOUNDS.right! : SOUNDS.wrong!);
      timer.current = setTimeout(
        () => {
          setRun(next);
          setReveal(null);
          if (next.over) finish(next);
        },
        right ? 350 : 500,
      );
    }, wait - 500);
  };

  useEffect(() => {
    if (!run) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        choose('higher');
      } else if (e.key === 'ArrowDown' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        choose('lower');
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const start = (m: Mode) => {
    if (timer.current) clearTimeout(timer.current);
    setReveal(null);
    setRun(newRun(seedFor(), m));
  };

  if (!run)
    return (
      <div className={styles.menu} data-testid="hl-menu">
        <h2>{t('title')}</h2>
        <p className="muted">{t('subtitle')}</p>
        <div className={styles.modes}>
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={styles.mode}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              data-testid={`hl-mode-${m}`}
            >
              <span aria-hidden="true">{ICON[m]}</span>
              {t(`mode.${m}`)}
              <small>{t(`hint.${m}`)}</small>
              <small>{t('best', { n: bests.best[m] ?? 0 })}</small>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => start(mode)}
          data-testid="hl-start"
        >
          {t('start')}
        </button>
      </div>
    );

  const a = itemA(run);
  const b = itemB(run);
  const card = (item: Item) => {
    const [c1, c2] = TINT[item.cat];
    return { background: `linear-gradient(160deg, ${c1}, ${c2})` };
  };
  const [aValue, aUnit] = format(a, a.value, locale, t);
  const shownOver = run.over && !reveal;

  return (
    <div data-testid="hl-play">
      <div className={styles.scores}>
        <span data-testid="hl-score">{t('score', { n: run.score })}</span>
        <span>{t('high', { n: Math.max(bests.best[run.mode] ?? 0, run.score) })}</span>
      </div>
      <div className={styles.board}>
        <section className={styles.card} style={card(a)} data-testid="hl-a">
          {a.flag ? <Flag iso2={a.flag} /> : <span className={styles.icon}>{a.emoji}</span>}
          <h3>{name(a)}</h3>
          <div>{t(a.cat === 'mountains' || a.cat === 'rivers' ? 'is' : 'has')}</div>
          <div className={styles.value}>{aValue}</div>
          <div className={styles.unit}>{aUnit}</div>
        </section>
        <section className={styles.card} style={card(b)} data-testid="hl-b">
          {b.flag ? <Flag iso2={b.flag} /> : <span className={styles.icon}>{b.emoji}</span>}
          <h3 data-testid="hl-b-name">{name(b)}</h3>
          <div>{t(b.cat === 'mountains' || b.cat === 'rivers' ? 'is' : 'has')}</div>
          {reveal ? (
            <CountUp item={b} locale={locale} t={t} instant={services.reducedMotion} />
          ) : (
            <>
              <div className={styles.choices}>
                <button
                  type="button"
                  className={styles.choice}
                  onClick={() => choose('higher')}
                  data-testid="hl-higher"
                >
                  {t('higher')}
                </button>
                <button
                  type="button"
                  className={styles.choice}
                  onClick={() => choose('lower')}
                  data-testid="hl-lower"
                >
                  {t('lower')}
                </button>
              </div>
              <div className={styles.unit}>{t(`than.${b.cat}`, { a: name(a) })}</div>
            </>
          )}
        </section>
        <div
          className={`${styles.vs} ${reveal ? (reveal.right ? styles.right : styles.wrong) : ''}`}
          aria-hidden="true"
        >
          {reveal ? (reveal.right ? '✓' : '✗') : 'VS'}
        </div>
        {shownOver && (
          <div className={styles.over} data-testid="hl-over">
            <div>{t('over.title')}</div>
            <strong data-testid="hl-final">{run.score}</strong>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => start(run.mode)}
                data-testid="hl-again"
              >
                {t('again')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setRun(null)}
                data-testid="hl-menu-btn"
              >
                {t('menu')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
