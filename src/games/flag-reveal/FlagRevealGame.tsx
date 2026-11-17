/**
 * The Flag Reveal table: a menu (today's flag, practice, watch the AI, km/mi), the flag behind its
 * six tiles, the country box with suggestions, clue rows (name, distance, arrow, proximity) and the
 * end screen with the whole flag and a share line.
 */
import { Bot, CalendarDays, Copy, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { CountryInput } from '../shared/world/CountryInput';
import { country, flagUrl } from '../shared/world/world';
import { triangulatorMove } from './ai-adapter';
import {
  MAX_GUESSES,
  TILES,
  clue,
  dailyTarget,
  gameNumber,
  guess,
  isValidState,
  newGame,
  randomGame,
  revealed,
  share,
  type FlagState,
} from './engine';
import styles from './FlagReveal.module.css';
import { STRINGS } from './i18n';
import { FLAG_SOUNDS } from './sounds';

interface Saved {
  state: FlagState | null;
  miles: boolean;
  daily: Record<string, number>;
}

export function FlagRevealGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: FlagState, unlock: (id: string) => void, daily: Record<string, number>) => void;
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
  const [saved, setSaved] = useState<Saved>({ state: null, miles: false, daily: {} });
  const [state, setStateRaw] = useState<FlagState | null>(null);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<FlagState | null>(null);
  const savedRef = useLatest(saved);
  const setState = (s: FlagState | null) => {
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

  useEffect(() => {
    if (!state) return;
    let alive = true;
    void flagUrl(state.target).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [state?.target]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    setSaved(next);
    void slot.save(next);
  };
  const asked = Number(services.launchParams.deal);
  const seedFor = () => (Number.isInteger(asked) && asked > 0 ? asked : randomSeed() >>> 0);

  const start = (s: FlagState, m: 'play' | 'watch') => {
    setUrl('');
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

  const onGuess = (iso2: string) => {
    const s = stateRef.current;
    if (!s) return;
    const next = guess(s, iso2);
    if (next === s) return;
    setState(next);
    const svc = servicesRef.current;
    if (next.status === 'playing') {
      svc.playSound(FLAG_SOUNDS.tile);
      if (mode === 'play') persist({ state: next });
      return;
    }
    svc.playSound(next.status === 'won' ? FLAG_SOUNDS.win : FLAG_SOUNDS.lose);
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
      outcome: next.status === 'won' ? 'win' : 'loss',
      score: next.guesses.length,
      mode: next.gameNo !== null ? 'daily' : 'practice',
    });
    onFinish(next, (id) => svc.unlockAchievement(id), daily);
  };

  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(
      () => onGuess(triangulatorMove(state, new Rng(state.guesses.length + 29))),
      1300,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state?.guesses.length, state?.status]);

  const units = (km: number) =>
    saved.miles ? `${Math.round(km * 0.621371).toLocaleString()} mi` : `${km.toLocaleString()} km`;

  if (mode === 'menu' || !state) {
    const today = gameNumber();
    const stats = services.getStats();
    const resume = saved.state && saved.state.status === 'playing' ? saved.state : null;
    return (
      <div className={shared.menu} data-testid="fr-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume, 'play')}
              data-testid="fr-resume"
            >
              <RotateCcw size={16} /> <span>{t('menu.resume')}</span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.units')}</legend>
            <div className={shared.segmented}>
              <button
                type="button"
                aria-pressed={!saved.miles}
                onClick={() => persist({ miles: false })}
              >
                km
              </button>
              <button
                type="button"
                aria-pressed={saved.miles}
                onClick={() => persist({ miles: true })}
              >
                mi
              </button>
            </div>
          </fieldset>
          <p className={shared.hintText}>
            {stats?.played
              ? t('menu.record', { wins: stats.wins, played: stats.played, streak: stats.streak })
              : t('menu.unplayed')}
          </p>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(newGame(dailyTarget(today), today, today + 7), 'play')}
              disabled={saved.daily[today] !== undefined}
              data-testid="fr-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily', { n: today + 1 })}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor()), 'play')}
              data-testid="fr-random"
            >
              <Shuffle size={16} /> {t('menu.random')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor()), 'watch')}
              data-testid="fr-watch"
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
  const open = revealed(s);
  const name = country(s.target).name[lang];

  return (
    <div className={styles.wrap} data-testid="fr-play">
      <div className={styles.flagBox} aria-label={t('play.flag')} role="img">
        {url && <img src={url} alt="" className={styles.flag} data-testid="fr-flag" />}
        <div className={styles.tiles}>
          {Array.from({ length: TILES }, (_, i) => (
            <span
              key={i}
              className={styles.tile}
              data-open={open.has(i)}
              data-testid={`fr-tile-${i}`}
            />
          ))}
        </div>
      </div>
      {!over && (
        <>
          <CountryInput
            lang={lang}
            onPick={onGuess}
            exclude={s.guesses}
            placeholder={t('play.placeholder')}
            buttonLabel={t('play.guess')}
            disabled={mode === 'watch'}
            testId="fr"
          />
          <p className={styles.left}>
            {mode === 'watch'
              ? t('watch.thinking')
              : t('play.left', { n: MAX_GUESSES - s.guesses.length })}
          </p>
        </>
      )}
      <ol className={styles.rows} data-testid="fr-rows">
        {s.guesses.map((g, i) => {
          const c = clue(g, s.target);
          return (
            <li
              key={g}
              className={styles.row}
              data-correct={g === s.target}
              data-testid={`fr-row-${i}`}
            >
              <span className={styles.name}>{country(g).name[lang]}</span>
              <span>{units(c.km)}</span>
              <span
                className={styles.arrow}
                style={{ transform: g === s.target ? undefined : `rotate(${c.bearing}deg)` }}
              >
                {g === s.target ? '🎉' : '⬆'}
              </span>
              <span>{c.proximity}%</span>
            </li>
          );
        })}
      </ol>
      {over && (
        <div className={styles.result} data-testid="fr-result" data-status={s.status}>
          <strong>{s.status === 'won' ? t('end.won', { name }) : t('end.lost', { name })}</strong>
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
              data-testid="fr-share"
            >
              <Copy size={16} /> {copied ? t('end.copied') : t('end.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                start(randomGame(randomSeed() >>> 0), mode === 'watch' ? 'watch' : 'play')
              }
              data-testid="fr-again"
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
    </div>
  );
}
