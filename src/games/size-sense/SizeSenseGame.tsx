/**
 * Size Sense screens: menu (daily, endless with difficulty and category, units, resume, record),
 * play (object card, comparison stage, log slider, lock in), reveal (score, ratio, source) and
 * results (per-object scores, share line).
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Infinity as InfinityIcon,
  Lock,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  current,
  dayNumber,
  DIFFICULTIES,
  finish,
  guessRange,
  isSession,
  lockIn,
  newDaily,
  newEndless,
  next,
  refThing,
  shareText,
  thingAt,
  TOPICS,
  type Difficulty,
  type Session,
  type SizeData,
  type Topic,
} from './engine';
import { formatLength, ratioOf, type Units } from './format';
import { STRINGS } from './i18n';
import styles from './SizeSense.module.css';
import { SOUNDS } from './sounds';
import { Stage } from './Stage';

interface Tally {
  rounds: number;
  sum: number;
  best: number;
  /** Guesses within 10 % of the real size. */
  close: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: number[];
  difficulty: Difficulty;
  topic: Topic;
  units: Units;
  record: Tally;
}
const SEEN_MAX = 1500;
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  topic: 'all',
  units: 'metric',
  record: { rounds: 0, sum: 0, best: 0, close: 0 },
};

function isSaved(d: unknown): d is Saved {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.session === null || isSession(s.session)) &&
    typeof s.daily === 'object' &&
    Array.isArray(s.seen) &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    (s.units === 'metric' || s.units === 'imperial') &&
    typeof s.record === 'object' &&
    typeof s.record.rounds === 'number'
  );
}

const loadObjects = () => import('./objects.json').then((m) => m.default as unknown as SizeData);
const grade = (n: number) =>
  n >= 95 ? 5 : n >= 85 ? 4 : n >= 70 ? 3 : n >= 45 ? 2 : n >= 20 ? 1 : 0;

/** Slider position (0–1000) ↔ size on a log scale over the guess range. */
const toSlider = (m: number, [lo, hi]: [number, number]) =>
  Math.round((Math.log(m / lo) / Math.log(hi / lo)) * 1000);
const fromSlider = (v: number, [lo, hi]: [number, number]) => lo * Math.pow(hi / lo, v / 1000);

export function SizeSenseGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadObjects);
  const data = asset.value;
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'menu' | 'play' | 'results'>('menu');
  const [session, setSession] = useState<Session | null>(null);
  const [guess, setGuess] = useState(1);
  const [copied, setCopied] = useState(false);
  const today = dayNumber();
  const savedRef = useLatest(saved);

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => {
      if (!alive) return;
      if (d) setSaved(d);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [slot]);

  const persist = (patch: Partial<Saved>) => {
    const n = { ...savedRef.current, ...patch };
    savedRef.current = n;
    setSaved(n);
    void slot.save(n);
  };

  if (asset.error) return <LoadError onRetry={asset.retry} />;
  if (!data || !loaded)
    return (
      <p className={styles.loading} data-testid="ss-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    // Every guess starts at the reference's size.
    setGuess(refThing(data, current(s).ref).metres);
    setCopied(false);
    setView('play');
    persist({ session: s });
  };
  const seenSet = () => new Set(savedRef.current.seen);
  const seedFor = () =>
    (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
  const startDaily = () => {
    const r = saved.session;
    if (r && r.mode === 'daily' && r.day === today && r.status === 'playing') return begin(r);
    begin(newDaily(data, today));
  };
  const startEndless = () => {
    const { difficulty, topic } = savedRef.current;
    begin(newEndless(data, seedFor(), difficulty, topic, seenSet()));
  };
  const copy = (text: string) =>
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );

  if (view === 'menu' || !session)
    return (
      <Menu
        t={t}
        saved={saved}
        today={today}
        copied={copied}
        onDaily={startDaily}
        onEndless={startEndless}
        onResume={() => saved.session && begin(saved.session)}
        onPick={persist}
        onShare={copy}
      />
    );

  if (view === 'results')
    return (
      <div className={shared.menu}>
        <div className={shared.menuCard} data-testid="ss-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="ss-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <p className={shared.hintText}>
            {t('results.avg', { n: session.count ? Math.round(session.total / session.count) : 0 })}
          </p>
          <ol className={styles.roundList}>
            {session.rounds.map((r, i) => {
              const th = thingAt(data, r.target);
              return (
                <li key={i} data-grade={grade(r.score ?? 0)}>
                  <span>
                    <strong>{th.name[lang]}</strong>
                    <small>
                      {t(`fam.${th.family}`)} · {formatLength(th.metres, saved.units, locale)}
                      {r.guess !== null &&
                        ` · ${t('reveal.you', { guess: formatLength(r.guess, saved.units, locale) })}`}
                    </small>
                  </span>
                  <b>{r.score}</b>
                </li>
              );
            })}
          </ol>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() => copy(shareText(session, t('title')))}
              data-testid="ss-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="ss-again"
            >
              <InfinityIcon size={16} /> {t('results.again')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                persist({ session: null });
                setView('menu');
              }}
              data-testid="ss-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const round = current(session);
  const target = thingAt(data, round.target);
  const reference = refThing(data, round.ref);
  const range = guessRange(reference.metres);
  const revealed = round.guess !== null;
  const shownGuess = round.guess ?? guess;

  const onLock = () => {
    if (revealed) return;
    const s = lockIn(session, data, guess);
    const r = current(s);
    const svc = servicesRef.current;
    svc.playSound(r.score! >= 85 ? SOUNDS.great! : r.score! >= 45 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const close = ratioOf(r.guess!, target.metres) <= 1.1;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + r.score!,
      best: Math.max(rec.best, r.score!),
      close: rec.close + (close ? 1 : 0),
    };
    svc.unlockAchievement('first-size');
    if (r.score! >= 97) svc.unlockAchievement('spot-on');
    if (record.close >= 25) svc.unlockAchievement('tape-measure');
    if (target.family === 'planet' || target.family === 'star')
      if (r.score! >= 80) svc.unlockAchievement('astronomer');
    const seen = [...savedRef.current.seen.filter((x) => x !== r.target), r.target].slice(
      -SEEN_MAX,
    );
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (s.total >= 400) svc.unlockAchievement('daily-400');
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    setSession(s);
    persist({ session: s, record, seen, daily });
  };
  const onNext = () => {
    if (session.status === 'done') return setView('results');
    begin(next(session, data, seenSet()));
  };
  const onEnd = () => {
    const s = finish(session);
    if (s.count > 0)
      servicesRef.current.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: `endless:${s.difficulty}`,
      });
    setSession(s);
    persist({ session: null });
    setView(s.count > 0 ? 'results' : 'menu');
  };

  const g = revealed ? grade(round.score!) : 0;
  const ratio = revealed ? ratioOf(round.guess!, target.metres) : 1;
  const nf = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 1,
  });

  return (
    <div className={styles.wrap} data-testid="ss-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="ss-round">
          {session.limit
            ? t('play.object', { n: session.count + (revealed ? 0 : 1), of: session.limit })
            : t('play.objectN', { n: session.count + (revealed ? 0 : 1) })}
        </span>
        <span data-testid="ss-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.kind}>{t(`fam.${target.family}`)}</span>
          <h3 className={styles.name} data-testid="ss-name">
            {target.name[lang]}
          </h3>
          <p className={styles.question}>{t(`q.${target.dim}`)}</p>
        </div>
        <Stage
          key={`${session.count}:${round.target}`}
          reference={reference}
          target={target}
          guess={shownGuess}
          range={range}
          onGuess={setGuess}
          onLock={onLock}
          actual={revealed ? target.metres : null}
          units={saved.units}
          lang={lang}
          locale={locale}
          reducedMotion={services.reducedMotion}
          t={t}
        />
        {!revealed ? (
          <>
            <input
              type="range"
              min={0}
              max={1000}
              value={toSlider(guess, range)}
              onChange={(e) => setGuess(fromSlider(Number(e.target.value), range))}
              className={styles.slider}
              aria-label={t('play.slider')}
              data-testid="ss-slider"
            />
            <p className={styles.hint}>{t('play.hint')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onLock}
                data-testid="ss-lock"
              >
                <Lock size={16} /> {t('play.lock')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="ss-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.reveal} data-testid="ss-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={g}>
                <small>{t('reveal.score')}</small>
                <strong data-testid="ss-score">
                  <CountUp to={round.score!} instant={services.reducedMotion} />
                </strong>
                <span>{t(`grade.${g}`)}</span>
              </div>
              <div className={styles.facts}>
                <p>{t('reveal.you', { guess: formatLength(round.guess!, saved.units, locale) })}</p>
                <p>
                  <b>
                    {t('reveal.actual', {
                      actual: formatLength(target.metres, saved.units, locale),
                    })}
                  </b>
                </p>
                <p data-testid="ss-ratio">
                  {ratio < 1.005
                    ? t('reveal.exact')
                    : round.guess! < target.metres
                      ? t('reveal.small', { x: nf.format(ratio) })
                      : t('reveal.big', { x: nf.format(ratio) })}
                </p>
              </div>
            </div>
            <a
              className={styles.source}
              href={`https://www.wikidata.org/wiki/${target.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('reveal.source', { id: target.id })}
            </a>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onNext}
                autoFocus
                data-testid="ss-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="ss-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Menu({
  t,
  saved,
  today,
  copied,
  onDaily,
  onEndless,
  onResume,
  onPick,
  onShare,
}: {
  t: Translator;
  saved: Saved;
  today: number;
  copied: boolean;
  onDaily: () => void;
  onEndless: () => void;
  onResume: () => void;
  onPick: (p: Partial<Saved>) => void;
  onShare: (text: string) => void;
}) {
  const r = saved.record;
  const done = saved.daily[today];
  const resumable =
    saved.session?.status === 'playing' &&
    !(saved.session.mode === 'daily' && saved.session.day !== today)
      ? saved.session
      : null;
  return (
    <div className={shared.menu}>
      <div className={shared.menuCard} data-testid="ss-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="ss-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', {
                  mode:
                    resumable.mode === 'daily'
                      ? t('play.daily', { n: resumable.day + 1 })
                      : t(`diff.${resumable.difficulty}`),
                  n: resumable.count + 1,
                })}
              </small>
            </span>
          </button>
        )}
        <section className={styles.modeCard}>
          <h3>
            <CalendarDays size={18} /> {t('menu.daily', { n: today + 1 })}
          </h3>
          <p className={shared.hintText}>{t('menu.dailyHint')}</p>
          {done !== undefined ? (
            <div className={shared.menuActions}>
              <strong data-testid="ss-daily-done">{t('menu.dailyDone', { score: done })}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => onShare(`${t('title')} #${today + 1} — ${done}/500`)}
              >
                <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDaily}
              data-testid="ss-daily"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
          )}
        </section>
        <section className={styles.modeCard}>
          <h3>
            <InfinityIcon size={18} /> {t('menu.endless')}
          </h3>
          <p className={shared.hintText}>{t('menu.endlessHint')}</p>
          <fieldset className={shared.group}>
            <legend>{t('menu.difficulty')}</legend>
            <div className={shared.segmented}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={saved.difficulty === d}
                  onClick={() => onPick({ difficulty: d })}
                  data-testid={`ss-diff-${d}`}
                >
                  {t(`diff.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`diff.${saved.difficulty}.hint`)}</p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.topic')}</legend>
            <div className={styles.chips}>
              {TOPICS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="chip"
                  aria-pressed={saved.topic === k}
                  onClick={() => onPick({ topic: k })}
                  data-testid={`ss-topic-${k}`}
                >
                  {t(`topic.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEndless}
            data-testid="ss-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <fieldset className={shared.group}>
          <legend>{t('menu.units')}</legend>
          <div className={shared.segmented}>
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={saved.units === u}
                onClick={() => onPick({ units: u })}
                data-testid={`ss-units-${u}`}
              >
                {t(`units.${u}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <section className={styles.modeCard} data-testid="ss-record">
          <h3>
            <BarChart3 size={18} /> {t('menu.stats')}
          </h3>
          <dl className={styles.stats}>
            <div>
              <dt>{t('stats.rounds')}</dt>
              <dd>{r.rounds}</dd>
            </div>
            <div>
              <dt>{t('stats.average')}</dt>
              <dd>{r.rounds ? Math.round(r.sum / r.rounds) : '—'}</dd>
            </div>
            <div>
              <dt>{t('stats.best')}</dt>
              <dd>{r.rounds ? r.best : '—'}</dd>
            </div>
            <div>
              <dt>{t('stats.perfect')}</dt>
              <dd>{r.close}</dd>
            </div>
            <div>
              <dt>{t('stats.streak')}</dt>
              <dd>{dailyStreak(saved.daily, today)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
