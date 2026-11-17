/**
 * The Country Shape table: a menu (today's shape, practice, watch the AI, km/mi), the silhouette,
 * the country box with suggestions, guess rows (name, distance, arrow, proximity), and after the
 * round the capital and flag bonus questions plus the share line.
 */
import { Bot, CalendarDays, Copy, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { CountryInput } from '../shared/world/CountryInput';
import { Silhouette } from '../shared/world/Silhouette';
import { country, flagUrl } from '../shared/world/world';
import { triangulatorMove } from './ai';
import styles from './CountryShape.module.css';
import {
  MAX_GUESSES,
  answerBonus,
  clue,
  dailyTarget,
  gameNumber,
  guess,
  isValidState,
  newGame,
  randomGame,
  share,
  type ShapeState,
} from './engine';
import { STRINGS } from './i18n';
import { SHAPE_SOUNDS } from './sounds';

interface Saved {
  state: ShapeState | null;
  miles: boolean;
  daily: Record<string, number>;
}

function Flag({ iso2 }: { iso2: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    void flagUrl(iso2).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [iso2]);
  return url ? <img src={url} alt="" className={styles.flag} /> : <span className={styles.flag} />;
}

export function CountryShapeGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: ShapeState, unlock: (id: string) => void, daily: Record<string, number>) => void;
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
  const [state, setStateRaw] = useState<ShapeState | null>(null);
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<ShapeState | null>(null);
  const savedRef = useLatest(saved);
  const setState = (s: ShapeState | null) => {
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

  const start = (s: ShapeState, m: 'play' | 'watch') => {
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

  const apply = (next: ShapeState) => {
    const before = stateRef.current;
    setState(next);
    const svc = servicesRef.current;
    if (before?.status === 'playing' && next.status !== 'playing') {
      svc.playSound(next.status === 'won' ? SHAPE_SOUNDS.win : SHAPE_SOUNDS.lose);
      if (mode === 'play') {
        const daily =
          next.gameNo !== null
            ? {
                ...savedRef.current.daily,
                [next.gameNo]: next.status === 'won' ? next.guesses.length : 0,
              }
            : savedRef.current.daily;
        persist({ state: next, daily });
        svc.recordResult({
          outcome: next.status === 'won' ? 'win' : 'loss',
          score: next.guesses.length,
          mode: next.gameNo !== null ? 'daily' : 'practice',
        });
        onFinish(next, (id) => svc.unlockAchievement(id), daily);
      }
      return;
    }
    if (mode === 'play') {
      persist({
        state:
          next.status === 'playing' || next.capital === 'pending' || next.flag === 'pending'
            ? next
            : null,
      });
      if (next.status !== 'playing')
        onFinish(next, (id) => svc.unlockAchievement(id), savedRef.current.daily);
    }
  };

  const onGuess = (iso2: string) => {
    const s = stateRef.current;
    if (!s) return;
    const next = guess(s, iso2);
    if (next !== s && next.status === 'playing') servicesRef.current.playSound(SHAPE_SOUNDS.guess);
    apply(next);
  };

  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(
      () => onGuess(triangulatorMove(state, new Rng(state.guesses.length + 17))),
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
      <div className={shared.menu} data-testid="cs-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume, 'play')}
              data-testid="cs-resume"
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
                data-testid="cs-km"
              >
                km
              </button>
              <button
                type="button"
                aria-pressed={saved.miles}
                onClick={() => persist({ miles: true })}
                data-testid="cs-mi"
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
              onClick={() => start(newGame(dailyTarget(today), today, today + 1), 'play')}
              disabled={saved.daily[today] !== undefined}
              data-testid="cs-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily', { n: today + 1 })}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor()), 'play')}
              data-testid="cs-random"
            >
              <Shuffle size={16} /> {t('menu.random')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor()), 'watch')}
              data-testid="cs-watch"
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
  const target = country(s.target);
  const name = target.name[lang];
  const onShare = () => {
    void navigator.clipboard?.writeText(share(s, t('title'))).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className={styles.wrap} data-testid="cs-play">
      <div className={styles.shapeBox} data-status={s.status}>
        <Silhouette iso2={s.target} className={styles.shape} label={t('play.shape')} />
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
            testId="cs"
          />
          <p className={styles.left}>
            {mode === 'watch'
              ? t('watch.thinking')
              : t('play.left', { n: MAX_GUESSES - s.guesses.length })}
          </p>
        </>
      )}
      <ol className={styles.rows} data-testid="cs-rows">
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          const g = s.guesses[i];
          if (!g) return <li key={i} className={styles.row} data-empty="true" />;
          const c = clue(g, s.target);
          return (
            <li
              key={i}
              className={styles.row}
              data-correct={g === s.target}
              data-testid={`cs-row-${i}`}
            >
              <span className={styles.name}>{country(g).name[lang]}</span>
              <span>{units(c.km)}</span>
              <span
                className={styles.arrow}
                style={{ transform: g === s.target ? undefined : `rotate(${c.bearing}deg)` }}
                aria-label={`${Math.round(c.bearing)}°`}
              >
                {g === s.target ? '🎉' : '⬆'}
              </span>
              <span className={styles.pct}>{c.proximity}%</span>
            </li>
          );
        })}
      </ol>
      {over && (
        <div className={styles.result} data-testid="cs-result" data-status={s.status}>
          <strong>{s.status === 'won' ? t('end.won', { name }) : t('end.lost', { name })}</strong>
          <div className={styles.bonus} data-testid="cs-bonus-capital">
            <p>{t('bonus.capital', { name })}</p>
            <div className={styles.options}>
              {s.capitalOptions.map((o) => (
                <button
                  key={o}
                  type="button"
                  className="btn"
                  data-mark={s.capital !== 'pending' && o === s.target ? 'right' : 'none'}
                  disabled={s.capital !== 'pending' || mode === 'watch'}
                  onClick={() => apply(answerBonus(s, 'capital', o))}
                  data-testid={`cs-capital-${o}`}
                >
                  {country(o).capital[lang]}
                </button>
              ))}
            </div>
            {s.capital !== 'pending' && (
              <p>
                {s.capital === 'right'
                  ? t('bonus.right')
                  : t('bonus.wrong', { answer: target.capital[lang] })}
              </p>
            )}
          </div>
          <div className={styles.bonus} data-testid="cs-bonus-flag">
            <p>{t('bonus.flag', { name })}</p>
            <div className={styles.options}>
              {s.flagOptions.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={styles.flagButton}
                  data-mark={s.flag !== 'pending' && o === s.target ? 'right' : 'none'}
                  disabled={s.flag !== 'pending' || mode === 'watch'}
                  onClick={() => apply(answerBonus(s, 'flag', o))}
                  aria-label={s.flag !== 'pending' ? country(o).name[lang] : `${o}`}
                  data-testid={`cs-flag-${o}`}
                >
                  <Flag iso2={o} />
                </button>
              ))}
            </div>
            {s.flag !== 'pending' && (
              <p>{s.flag === 'right' ? t('bonus.right') : t('bonus.wrong', { answer: name })}</p>
            )}
          </div>
          <div className={shared.menuActions}>
            <button type="button" className="btn" onClick={onShare} data-testid="cs-share">
              <Copy size={16} /> {copied ? t('end.copied') : t('end.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                start(randomGame(randomSeed() >>> 0), mode === 'watch' ? 'watch' : 'play')
              }
              data-testid="cs-again"
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
              data-testid="cs-menu-btn"
            >
              {t('end.menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
