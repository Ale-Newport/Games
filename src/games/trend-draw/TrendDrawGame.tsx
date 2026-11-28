/**
 * Trend Draw screens: menu (daily, endless by topic and difficulty, resume, record), the chart
 * (only the first point visible, the world's dotted curve as a guide, freehand or keyboard
 * drawing — the #231 chart), the reveal (the country's real line, the similar-countries curve,
 * points, source) and results.
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Eraser,
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
import { ForecastChart } from '../graph-forecast/ForecastChart';
import styles from '../graph-forecast/GraphForecast.module.css';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import { formatValue, loadStats, seriesAt, type StatsData } from '../shared/stats/stats';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  actual,
  completeDraft,
  current,
  dayNumber,
  describe,
  DIFFICULTIES,
  emptyDraft,
  finish,
  isSession,
  newDaily,
  newEndless,
  next,
  scoreDrawing,
  shareText,
  strategyCurve,
  submit,
  TOPICS,
  worldValues,
  yearOf,
  type Difficulty,
  type Draft,
  type Session,
  type Topic,
} from './engine';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import own from './TrendDraw.module.css';

interface Tally {
  rounds: number;
  sum: number;
  beat: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: number[];
  difficulty: Difficulty;
  topic: Topic;
  record: Tally;
}
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  topic: 'all',
  record: { rounds: 0, sum: 0, beat: 0 },
};
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.session === null || isSession(s.session)) &&
    typeof s.daily === 'object' &&
    Array.isArray(s.seen) &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    typeof s.record?.rounds === 'number'
  );
};
const grade = (n: number) => (n >= 80 ? 3 : n >= 50 ? 2 : n >= 25 ? 1 : 0);

export function TrendDrawGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset<StatsData>(loadStats);
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
  const [warn, setWarn] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const nextRef = useRef<HTMLButtonElement>(null);
  const today = dayNumber();

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
      <p className={styles.loading} data-testid="td-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    setDraft(emptyDraft(current(s).c));
    setWarn(false);
    setCopied(false);
    setView('play');
    persist({ session: s });
  };
  const seedFor = () =>
    (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
  const startDaily = () => {
    const r = saved.session;
    if (r && r.mode === 'daily' && r.day === today && r.status === 'playing') return begin(r);
    begin(newDaily(data, today));
  };
  const startEndless = () => {
    const { difficulty, topic, seen } = savedRef.current;
    begin(newEndless(data, seedFor(), difficulty, topic, new Set(seen)));
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
        <div className={shared.menuCard} data-testid="td-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="td-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <ol className={styles.roundList}>
            {session.rounds
              .filter((r) => r.score !== null)
              .map((r, i) => {
                const d = describe(data, r.c);
                return (
                  <li key={i} data-grade={grade(r.score!)}>
                    <span>
                      <strong>{d.indicator.title[lang]}</strong>
                      <small>
                        {d.entity.name[lang]} · {yearOf(data, r.c, 0)}–
                        {yearOf(data, r.c, r.c.to - r.c.from)}
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
              data-testid="td-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="td-again"
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
              data-testid="td-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const round = current(session);
  const c = round.c;
  const series = seriesAt(data, c.s);
  const { indicator, entity } = describe(data, c);
  const revealed = round.pred !== null;
  const first = series.values[c.from]!;
  const complete = completeDraft(c, draft, first);
  const cpu = revealed ? strategyCurve(data, c, 'peers') : null;
  const cpuScore = cpu ? scoreDrawing(c, cpu, actual(data, c).slice(1)) : null;
  const lastYear = yearOf(data, c, c.to - c.from);
  const fmt = (v: number) => formatValue(v, indicator, locale);

  const onSubmit = () => {
    if (revealed) return;
    if (!complete) {
      setWarn(true);
      return;
    }
    const s = submit(session, data, complete);
    const r = current(s);
    const svc = servicesRef.current;
    svc.playSound(r.score! >= 80 ? SOUNDS.great! : r.score! >= 50 ? SOUNDS.good! : SOUNDS.poor!);
    const peers = scoreDrawing(c, strategyCurve(data, c, 'peers'), actual(data, c).slice(1));
    const rec = savedRef.current.record;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + r.score!,
      beat: rec.beat + (r.score! > peers ? 1 : 0),
    };
    svc.unlockAchievement('first-trend');
    if (r.score! >= 90) svc.unlockAchievement('steady-hand');
    if (record.beat >= 10) svc.unlockAchievement('beat-peers');
    const seen = [...savedRef.current.seen.filter((x) => x !== c.s), c.s].slice(-300);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (s.total >= 350) svc.unlockAchievement('trend-setter');
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    setSession(s);
    persist({ session: s, record, seen, daily });
    requestAnimationFrame(() => nextRef.current?.focus());
  };
  const onNext = () => {
    if (session.status === 'done') return setView('results');
    begin(next(session, data, new Set(savedRef.current.seen)));
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

  return (
    <div className={styles.wrap} data-testid="td-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="td-round">
          {session.limit
            ? t('play.round', { n: session.count + (revealed ? 0 : 1), of: session.limit })
            : t('play.roundN', { n: session.count + (revealed ? 0 : 1) })}
        </span>
        <span data-testid="td-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.head}>
          <div>
            <h3 className={styles.indicator} data-testid="td-title">
              {indicator.title[lang]}
            </h3>
            <p className={styles.entity} data-testid="td-entity">
              {entity.name[lang]}{' '}
              <span className={styles.years}>
                {t('play.years', { from: yearOf(data, c, 0), to: lastYear })}
              </span>
            </p>
            {indicator.unit[lang] && <p className={styles.unit}>{indicator.unit[lang]}</p>}
          </div>
        </div>
        <div className={styles.legend}>
          <span className={styles.keyYou}>{t('legend.you')}</span>
          <span className={own.keyWorld}>{t('legend.world')}</span>
          {revealed && <span className={styles.keyActual}>{t('legend.actual')}</span>}
          {revealed && <span className={styles.keyCpu}>{t('legend.cpu')}</span>}
        </div>
        <ForecastChart
          key={`${session.count}:${c.s}:${c.from}`}
          series={series}
          c={c}
          draft={draft}
          onDraft={(d) => {
            setDraft(d);
            setWarn(false);
          }}
          pred={round.pred}
          cpu={cpu}
          locale={locale}
          reducedMotion={services.reducedMotion}
          t={t}
          onSubmit={onSubmit}
          onStroke={() => servicesRef.current.playSound(SOUNDS.pen!)}
          guide={worldValues(data, c)}
        />

        {!revealed ? (
          <>
            <p className={styles.hint}>{t('play.draw', { to: lastYear })}</p>
            <p className={styles.keys}>{t('play.keys')}</p>
            {warn && (
              <p className={styles.warn} role="alert" data-testid="td-warn">
                {t('play.needEnd')}
              </p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(emptyDraft(c))}
                data-testid="td-clear"
              >
                <Eraser size={16} /> {t('play.clear')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                aria-disabled={!complete}
                data-ready={complete !== null}
                data-testid="td-submit"
              >
                {t('play.submit')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="td-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.reveal} data-testid="td-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(round.score!)}>
                <small>{t('reveal.score')}</small>
                <strong data-testid="td-score">
                  <CountUp to={round.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p data-testid="td-cpu">{t('reveal.cpu', { n: cpuScore! })}</p>
                {round.score! > cpuScore! && <p className={styles.beat}>{t('reveal.beat')}</p>}
                <p>
                  {t('reveal.final', {
                    year: lastYear,
                    you: fmt(round.pred![round.pred!.length - 1]!),
                    actual: fmt(series.values[c.to]!),
                  })}
                </p>
              </div>
            </div>
            <a
              className={styles.source}
              href={`https://data.worldbank.org/indicator/${indicator.code}?locations=${entity.iso2}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('reveal.source', { date: data.updated })}
            </a>
            <div className={styles.actions}>
              <button
                ref={nextRef}
                type="button"
                className="btn btn-primary"
                onClick={onNext}
                data-testid="td-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="td-end">
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
  const s = saved.session;
  const resumable = s?.status === 'playing' && !(s.mode === 'daily' && s.day !== today) ? s : null;
  return (
    <div className={shared.menu}>
      <div className={shared.menuCard} data-testid="td-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="td-resume"
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
              <strong data-testid="td-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="td-daily"
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
                  data-testid={`td-diff-${d}`}
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
                  data-testid={`td-topic-${k}`}
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
            data-testid="td-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="td-record">
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
              <dt>{t('stats.beat')}</dt>
              <dd>{r.beat}</dd>
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
