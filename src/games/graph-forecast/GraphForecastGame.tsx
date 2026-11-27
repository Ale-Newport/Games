/**
 * Graph Forecast screens: menu (daily challenge, endless run with difficulty and topic, resume,
 * record), play (series card, drawing chart, submit), reveal (accuracy, computer comparison,
 * source) and results (per-graph scores, share line).
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Eraser,
  Globe2,
  Infinity as InfinityIcon,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import shared from '../shared/sudoku/SudokuGame.module.css';
import type { StatTopic } from '../shared/stats/indicators';
import { formatValue, loadStats, seriesAt, sourceUrl, type StatsData } from '../shared/stats/stats';
import { flagUrl } from '../shared/world/world';
import { ForecastChart } from './ForecastChart';
import {
  completeDraft,
  computerForecast,
  current,
  dayNumber,
  DIFFICULTIES,
  emptyDraft,
  finish,
  isSession,
  newDaily,
  newEndless,
  next,
  shareText,
  submit,
  TOPICS,
  type Difficulty,
  type Draft,
  type Session,
  type Topic,
} from './engine';
import styles from './GraphForecast.module.css';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  sum: number;
  /** Graph scores in buckets of ten (0–9 … 90–100). */
  hist: number[];
  beat: number;
  best: number;
  topics: Partial<{ [K in StatTopic]: number }>;
}
interface Saved {
  session: Session | null;
  /** Daily number → total. */
  daily: { [day: string]: number };
  /** Recently seen series (endless runs skip them). */
  seen: number[];
  difficulty: Difficulty;
  topic: Topic;
  record: Tally;
}
const SEEN_MAX = 1500;
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  topic: 'all',
  record: { rounds: 0, sum: 0, hist: Array(10).fill(0) as number[], beat: 0, best: 0, topics: {} },
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
    typeof s.record === 'object' &&
    Array.isArray(s.record.hist) &&
    s.record.hist.length === 10
  );
}

/** Consecutive daily challenges played, ending today or yesterday. */
export function dailyStreak(daily: { [day: string]: number }, today: number): number {
  let d = daily[today] !== undefined ? today : today - 1;
  let n = 0;
  while (daily[d] !== undefined) {
    n++;
    d--;
  }
  return n;
}

const grade = (score: number) =>
  score >= 95 ? 5 : score >= 85 ? 4 : score >= 70 ? 3 : score >= 50 ? 2 : score >= 25 ? 1 : 0;

function Flag({ iso2, aggregate, label }: { iso2: string; aggregate: boolean; label: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    if (!aggregate)
      flagUrl(iso2).then(
        (u) => alive && setUrl(u),
        () => undefined,
      );
    return () => {
      alive = false;
    };
  }, [iso2, aggregate]);
  return url ? (
    <img className={styles.flag} src={url} alt="" />
  ) : (
    <Globe2 className={styles.globe} size={22} aria-label={aggregate ? label : undefined} />
  );
}

function CountUp({ to, instant }: { to: number; instant: boolean }) {
  const [n, setN] = useState(instant ? to : 0);
  useEffect(() => {
    if (instant) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, instant]);
  return <>{instant ? to : n}</>;
}

export function GraphForecastGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadStats);
  const data = asset.value;
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'menu' | 'play' | 'results'>('menu');
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState<Draft>([]);
  const [copied, setCopied] = useState(false);
  const [warn, setWarn] = useState(false);
  const today = dayNumber();
  const savedRef = useLatest(saved);
  const nextRef = useRef<HTMLButtonElement>(null);

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
    const nextSaved = { ...savedRef.current, ...patch };
    savedRef.current = nextSaved;
    setSaved(nextSaved);
    void slot.save(nextSaved);
  };

  const begin = (s: Session) => {
    setSession(s);
    setDraft(emptyDraft(current(s).c));
    setWarn(false);
    setCopied(false);
    setView('play');
    persist({ session: s });
  };

  if (asset.error) return <LoadError onRetry={asset.retry} />;
  if (!data || !loaded)
    return (
      <p className={styles.loading} data-testid="gf-loading">
        {t('loading')}
      </p>
    );

  const seenSet = () => new Set(savedRef.current.seen);
  const startDaily = () => {
    const resume = saved.session;
    if (resume && resume.mode === 'daily' && resume.day === today && resume.status === 'playing')
      return begin(resume);
    begin(newDaily(data, today));
  };
  const seedFor = () =>
    (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
  const startEndless = () =>
    begin(newEndless(data, seedFor(), saved.difficulty, saved.topic, seenSet()));

  if (view === 'menu' || !session)
    return (
      <Menu
        t={t}
        saved={saved}
        today={today}
        onDaily={startDaily}
        onEndless={startEndless}
        onResume={() => saved.session && begin(saved.session)}
        onPick={(patch) => persist(patch)}
        copied={copied}
        onShare={(text) => {
          void navigator.clipboard?.writeText(text).then(
            () => setCopied(true),
            () => setCopied(false),
          );
        }}
      />
    );

  const round = current(session);
  const series = seriesAt(data, round.c.s);
  const revealed = round.pred !== null;
  const first = round.c.cut - round.c.from;
  const lastVisible = series.values[round.c.cut - 1]!;
  const complete = completeDraft(round.c, draft, lastVisible);
  const cpuPred = revealed ? computerForecast(series, round.c).pred : null;

  const onSubmit = () => {
    if (revealed) return;
    if (!complete) {
      setWarn(true);
      return;
    }
    const s = submit(session, data, complete);
    const r = current(s);
    const svc = servicesRef.current;
    svc.playSound(r.score! >= 85 ? SOUNDS.great! : r.score! >= 50 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const topic = series.indicator.topic;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + r.score!,
      hist: rec.hist.map((n, i) => (i === Math.min(9, Math.floor(r.score! / 10)) ? n + 1 : n)),
      beat: rec.beat + (r.score! > r.cpu! ? 1 : 0),
      best: Math.max(rec.best, r.score!),
      topics: { ...rec.topics, [topic]: Math.max(rec.topics[topic] ?? 0, r.score!) },
    };
    svc.unlockAchievement('first-forecast');
    if (r.score! >= 95) svc.unlockAchievement('sharp-eye');
    if (r.score! >= 90 && s.difficulty === 'hard') svc.unlockAchievement('hard-90');
    if (record.beat >= 10) svc.unlockAchievement('beat-machine');
    if (
      (['economy', 'people', 'health', 'environment', 'technology', 'society'] as const).every(
        (k) => (record.topics[k] ?? 0) >= 80,
      )
    )
      svc.unlockAchievement('all-topics');
    const seen = [...savedRef.current.seen.filter((x) => x !== r.c.s), r.c.s].slice(-SEEN_MAX);
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
    requestAnimationFrame(() => nextRef.current?.focus());
  };

  const onNext = () => {
    if (session.status === 'done') {
      setView('results');
      return;
    }
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

  if (view === 'results')
    return (
      <Results
        t={t}
        s={session}
        data={data}
        lang={lang}
        copied={copied}
        onShare={() => {
          void navigator.clipboard?.writeText(shareText(session, t('title'))).then(
            () => setCopied(true),
            () => setCopied(false),
          );
        }}
        onMenu={() => {
          persist({ session: null });
          setView('menu');
        }}
        onAgain={() => startEndless()}
      />
    );

  const year = (i: number) => series.start + i;
  const lastIdx = round.c.to;
  const g = revealed ? grade(round.score!) : 0;

  return (
    <div className={styles.wrap} data-testid="gf-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="gf-round">
          {session.limit
            ? t('play.graph', {
                n: Math.min(session.limit, session.count + (revealed ? 0 : 1)),
                of: session.limit,
              })
            : t('play.graphN', { n: session.count + (revealed ? 0 : 1) })}
        </span>
        <span data-testid="gf-total">{t('play.total', { n: session.total })}</span>
      </div>

      <div className={styles.card}>
        <div className={styles.head}>
          <Flag
            key={series.entity.iso3}
            iso2={series.entity.iso2}
            aggregate={series.entity.aggregate}
            label={t('region')}
          />
          <div>
            <h3 className={styles.indicator} data-testid="gf-indicator">
              {series.indicator.title[lang]}
            </h3>
            <p className={styles.entity} data-testid="gf-entity">
              {series.entity.name[lang]}
              <span className={styles.years}>
                {' · '}
                {t('play.years', {
                  from: year(round.c.from),
                  cut: year(round.c.cut),
                  to: year(lastIdx),
                })}
              </span>
            </p>
            {series.indicator.unit[lang] && (
              <p className={styles.unit}>{series.indicator.unit[lang]}</p>
            )}
          </div>
        </div>

        <ForecastChart
          key={`${session.count}:${round.c.s}:${round.c.from}`}
          series={series}
          c={round.c}
          draft={draft}
          onDraft={(d) => {
            setDraft(d);
            setWarn(false);
          }}
          pred={round.pred}
          cpu={cpuPred}
          locale={locale}
          reducedMotion={services.reducedMotion}
          t={t}
          onSubmit={onSubmit}
          onStroke={() => servicesRef.current.playSound(SOUNDS.pen!)}
        />

        {!revealed ? (
          <>
            <p className={styles.hint}>{t('play.draw')}</p>
            <p className={styles.keys}>{t('play.keys')}</p>
            {warn && (
              <p className={styles.warn} role="alert" data-testid="gf-warn">
                {t('play.needEnd')}
              </p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(emptyDraft(round.c))}
                data-testid="gf-clear"
              >
                <Eraser size={16} /> {t('play.clear')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                aria-disabled={!complete}
                data-ready={complete !== null}
                data-testid="gf-submit"
              >
                {t('play.submit')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="gf-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.reveal} data-testid="gf-reveal">
            <div className={styles.legend}>
              <span className={styles.keyYou}>{t('reveal.you')}</span>
              <span className={styles.keyActual}>{t('reveal.actual')}</span>
              <span className={styles.keyCpu}>{t('reveal.computer')}</span>
            </div>
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={g}>
                <small>{t('reveal.score')}</small>
                <strong data-testid="gf-score">
                  <CountUp to={round.score!} instant={services.reducedMotion} />
                </strong>
                <span>{t(`grade.${g}`)}</span>
              </div>
              <div className={styles.facts}>
                <p data-testid="gf-cpu">
                  {t('reveal.cpu', { method: t(`method.${round.cpuMethod}`), n: round.cpu! })}
                </p>
                {round.score! > round.cpu! && <p className={styles.beat}>{t('reveal.beat')}</p>}
                <p>
                  {t('reveal.final', {
                    year: year(lastIdx),
                    you: formatValue(
                      round.pred![round.pred!.length - 1]!,
                      series.indicator,
                      locale,
                    ),
                    actual: formatValue(series.values[lastIdx]!, series.indicator, locale),
                  })}
                </p>
              </div>
            </div>
            <a className={styles.source} href={sourceUrl(series)} target="_blank" rel="noreferrer">
              {t('source', { code: series.indicator.code })}
            </a>
            <div className={styles.actions}>
              <button
                ref={nextRef}
                type="button"
                className="btn btn-primary"
                onClick={onNext}
                data-testid="gf-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="gf-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <span hidden data-testid="gf-first-hidden">
        {first}
      </span>
    </div>
  );
}

function Menu({
  t,
  saved,
  today,
  onDaily,
  onEndless,
  onResume,
  onPick,
  onShare,
  copied,
}: {
  t: Translator;
  saved: Saved;
  today: number;
  onDaily: () => void;
  onEndless: () => void;
  onResume: () => void;
  onPick: (p: Partial<Saved>) => void;
  onShare: (text: string) => void;
  copied: boolean;
}) {
  const r = saved.record;
  const dailyDone = saved.daily[today];
  const resumable =
    saved.session?.status === 'playing' &&
    !(saved.session.mode === 'daily' && saved.session.day !== today)
      ? saved.session
      : null;
  const maxHist = Math.max(1, ...r.hist);
  return (
    <div className={shared.menu}>
      <div className={shared.menuCard} data-testid="gf-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="gf-resume"
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
          {dailyDone !== undefined ? (
            <div className={shared.menuActions}>
              <strong data-testid="gf-daily-done">
                {t('menu.dailyDone', { score: dailyDone })}
              </strong>
              <button
                type="button"
                className="btn"
                onClick={() => onShare(`${t('title')} #${today + 1} — ${dailyDone}/500`)}
              >
                <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDaily}
              data-testid="gf-daily"
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
                  data-testid={`gf-diff-${d}`}
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
                  data-testid={`gf-topic-${k}`}
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
            data-testid="gf-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="gf-record">
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
              <dt>{t('stats.streak')}</dt>
              <dd>{dailyStreak(saved.daily, today)}</dd>
            </div>
            <div>
              <dt>{t('stats.beat')}</dt>
              <dd>{r.beat}</dd>
            </div>
          </dl>
          <div className={styles.hist} aria-label={t('stats.hist')} role="img">
            {r.hist.map((n, i) => (
              <div key={i} className={styles.histCol}>
                <span className={styles.histBar} style={{ height: `${(n / maxHist) * 100}%` }} />
                <small>{i * 10}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Results({
  t,
  s,
  data,
  lang,
  copied,
  onShare,
  onMenu,
  onAgain,
}: {
  t: Translator;
  s: Session;
  data: StatsData;
  lang: 'en' | 'es';
  copied: boolean;
  onShare: () => void;
  onMenu: () => void;
  onAgain: () => void;
}) {
  const max = (s.limit || s.count) * 100;
  return (
    <div className={shared.menu}>
      <div className={shared.menuCard} data-testid="gf-results">
        <h2 className={shared.menuTitle}>
          {s.mode === 'daily' ? t('results.daily', { n: s.day + 1 }) : t('results.endless')}
        </h2>
        <p className={styles.bigTotal} data-testid="gf-final">
          {t('results.total', { total: s.total, max })}
        </p>
        <p className={shared.hintText}>
          {t('results.avg', { n: s.count ? Math.round(s.total / s.count) : 0 })}
        </p>
        <ol className={styles.roundList}>
          {s.rounds.map((r, i) => {
            const series = seriesAt(data, r.c.s);
            return (
              <li key={i} data-grade={grade(r.score ?? 0)}>
                <span>
                  <strong>{series.indicator.title[lang]}</strong>
                  <small>
                    {series.entity.name[lang]} · {series.start + r.c.cut}–{series.start + r.c.to}
                  </small>
                </span>
                <b>{r.score}</b>
              </li>
            );
          })}
        </ol>
        <div className={shared.menuActions}>
          <button type="button" className="btn" onClick={onShare} data-testid="gf-share">
            <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAgain}
            data-testid="gf-again"
          >
            <InfinityIcon size={16} /> {t('results.again')}
          </button>
          <button type="button" className="btn" onClick={onMenu} data-testid="gf-menu-btn">
            {t('play.menu')}
          </button>
        </div>
      </div>
    </div>
  );
}
