/**
 * The Hot & Cold Globe table: a menu (today's country, practice, watch the AI), the globe with
 * guessed countries coloured by heat, the country box, the closest guess, the list sorted by
 * border distance, give up, and the end screen with a share line.
 */
import { Bot, CalendarDays, Copy, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { CountryInput } from '../shared/world/CountryInput';
import { country } from '../shared/world/world';
import { trackerMove } from './ai-adapter';
import {
  dailyTarget,
  gameNumber,
  giveUp,
  guess,
  heat,
  isValidState,
  newGame,
  randomGame,
  ranked,
  share,
  type GlobeState,
} from './engine';
import { Globe } from './Globe';
import styles from './GlobeGame.module.css';
import { STRINGS } from './i18n';
import { GLOBE_SOUNDS } from './sounds';

interface Saved {
  state: GlobeState | null;
  daily: Record<string, number>;
}

export function GlobeGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: GlobeState, unlock: (id: string) => void, daily: Record<string, number>) => void;
}) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          ((d as Saved).state === null || isValidState((d as Saved).state)) &&
          typeof (d as Saved).daily === 'object',
      }),
    [services],
  );
  const [mode, setMode] = useState<'menu' | 'play' | 'watch'>(
    services.launchParams.mode === 'watch' ? 'watch' : 'menu',
  );
  const [saved, setSaved] = useState<Saved>({ state: null, daily: {} });
  const [state, setStateRaw] = useState<GlobeState | null>(null);
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<GlobeState | null>(null);
  const savedRef = useLatest(saved);
  const setState = (s: GlobeState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSaved(d));
    return () => {
      alive = false;
    };
  }, [slot]);

  const persist = (patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    setSaved(next);
    void slot.save(next);
  };
  const asked = Number(services.launchParams.deal);
  const seedFor = () => (Number.isInteger(asked) && asked > 0 ? asked : randomSeed() >>> 0);

  const start = (s: GlobeState, m: 'play' | 'watch') => {
    setState(s);
    setMode(m);
    setCopied(false);
    if (m === 'play') persist({ state: s });
  };

  useEffect(() => {
    if (mode === 'watch' && !state) {
      const id = window.setTimeout(() => start(randomGame(seedFor()), 'watch'), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const apply = (next: GlobeState) => {
    const before = stateRef.current;
    if (next === before) return;
    setState(next);
    const svc = servicesRef.current;
    if (next.status === 'playing') {
      const last = next.guesses.at(-1);
      if (last) {
        const km = ranked(next).find((r) => r.iso2 === last)!.km;
        svc.playSound(
          km === 0 ? GLOBE_SOUNDS.hot : km < 1500 ? GLOBE_SOUNDS.warm : GLOBE_SOUNDS.cold,
        );
      }
      if (mode === 'play') persist({ state: next });
      return;
    }
    svc.playSound(next.status === 'won' ? GLOBE_SOUNDS.win : GLOBE_SOUNDS.lose);
    if (mode !== 'play') return;
    const daily =
      next.gameNo !== null
        ? {
            ...savedRef.current.daily,
            [next.gameNo]: next.status === 'won' ? next.guesses.length : 0,
          }
        : savedRef.current.daily;
    persist({ state: null, daily });
    svc.recordResult({
      outcome: next.status === 'won' ? 'complete' : 'loss',
      score: next.guesses.length,
      mode: next.gameNo !== null ? 'daily' : 'practice',
    });
    onFinish(next, (id) => svc.unlockAchievement(id), daily);
  };

  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(
      () => apply(guess(state, trackerMove(state, new Rng(state.guesses.length + 41)))),
      1300,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state?.guesses.length, state?.status]);

  if (mode === 'menu' || !state) {
    const today = gameNumber();
    const stats = services.getStats();
    const resume = saved.state && saved.state.status === 'playing' ? saved.state : null;
    return (
      <div className={shared.menu} data-testid="gl-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume, 'play')}
              data-testid="gl-resume"
            >
              <RotateCcw size={16} /> <span>{t('menu.resume')}</span>
            </button>
          )}
          <p className={shared.hintText}>
            {stats?.completions
              ? t('menu.record', { wins: stats.completions, best: stats.bestScore ?? 0 })
              : t('menu.unplayed')}
          </p>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(newGame(dailyTarget(today), today), 'play')}
              disabled={saved.daily[today] !== undefined}
              data-testid="gl-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily', { n: today + 1 })}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor()), 'play')}
              data-testid="gl-random"
            >
              <Shuffle size={16} /> {t('menu.random')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor()), 'watch')}
              data-testid="gl-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const over = s.status !== 'playing';
  const list = ranked(s);
  const fills: Record<string, string> = {};
  for (const r of list) fills[r.iso2] = heat(r.km, r.iso2 === s.target);
  if (over && s.status !== 'won') fills[s.target] = '#3ddc84';
  const closest = list.find((r) => r.iso2 !== s.target);
  const name = (iso2: string) => country(iso2).name[lang];

  return (
    <div className={styles.wrap} data-testid="gl-play">
      <Globe
        fills={fills}
        focus={over ? s.target : (s.guesses.at(-1) ?? null)}
        label={t('play.globe')}
        zoomIn={t('play.zoomIn')}
        zoomOut={t('play.zoomOut')}
        reducedMotion={services.reducedMotion}
      />
      {!over && (
        <>
          <CountryInput
            lang={lang}
            onPick={(iso2) => apply(guess(stateRef.current!, iso2))}
            exclude={s.guesses}
            placeholder={t('play.placeholder')}
            buttonLabel={t('play.guess')}
            disabled={mode === 'watch'}
            testId="gl"
          />
          <p className={styles.closest} data-testid="gl-closest">
            {closest
              ? t('play.closest', { name: name(closest.iso2), km: closest.km.toLocaleString() })
              : t('play.first')}
          </p>
        </>
      )}
      {over && (
        <div className={styles.result} data-testid="gl-result" data-status={s.status}>
          <strong>
            {s.status === 'won'
              ? t('end.won', { name: name(s.target), n: s.guesses.length })
              : t('end.lost', { name: name(s.target) })}
          </strong>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() =>
                void navigator.clipboard?.writeText(share(s, t('title'))).then(
                  () => setCopied(true),
                  () => setCopied(false),
                )
              }
              data-testid="gl-share"
            >
              <Copy size={16} /> {copied ? t('end.copied') : t('end.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                start(randomGame(randomSeed() >>> 0), mode === 'watch' ? 'watch' : 'play')
              }
              data-testid="gl-again"
            >
              <Shuffle size={16} /> {t('end.again')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setState(null);
                setMode('menu');
              }}
            >
              {t('end.menu')}
            </button>
          </div>
        </div>
      )}
      <ol className={styles.list} data-testid="gl-list">
        {list.map((r) => (
          <li key={r.iso2} data-testid={`gl-guess-${r.iso2}`}>
            <span
              className={styles.swatch}
              style={{ background: heat(r.km, r.iso2 === s.target) }}
            />
            <span className={styles.name}>{name(r.iso2)}</span>
            <span>
              {r.iso2 === s.target
                ? '🌎'
                : r.km === 0
                  ? t('play.touching')
                  : `${r.km.toLocaleString()} km`}
            </span>
          </li>
        ))}
      </ol>
      {!over && mode === 'play' && (
        <div className={shared.controls}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => apply(giveUp(s))}
            data-testid="gl-giveup"
          >
            {t('play.giveUp')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setState(null);
              setMode('menu');
            }}
          >
            {t('end.menu')}
          </button>
        </div>
      )}
    </div>
  );
}
