/**
 * Gap Graph screens: menu (daily, endless by topic and difficulty, resume, record), the chart (a
 * line or bars with three gaps to fill), the reveal (real values, points per gap, source) and
 * results.
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
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import { INDICATOR_BY_CODE } from '../shared/stats/indicators';
import { entityAt, formatValue, loadStats, type StatsData } from '../shared/stats/stats';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  allSet,
  chartKey,
  current,
  dayNumber,
  DIFFICULTIES,
  finish,
  isSession,
  lock,
  newDaily,
  newEndless,
  next,
  setGap,
  shareText,
  TOPICS,
  truth,
  values,
  type Chart,
  type Difficulty,
  type Session,
  type Topic,
} from './engine';
import { GapChart } from './GapChart';
import styles from './GapGraph.module.css';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  sum: number;
  close: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: string[];
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
  record: { rounds: 0, sum: 0, close: 0 },
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

export function GapGraphGame({ services }: GameProps) {
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
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const sessionRef = useLatest(session);
  const wrapRef = useRef<HTMLDivElement>(null);
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
  // Entering play focuses the chart area so Enter works at once.
  useEffect(() => {
    if (view === 'play') wrapRef.current?.focus({ preventScroll: true });
  }, [view]);

  const persist = (patch: Partial<Saved>) => {
    const n = { ...savedRef.current, ...patch };
    savedRef.current = n;
    setSaved(n);
    void slot.save(n);
  };

  if (asset.error) return <LoadError onRetry={asset.retry} />;
  if (!data || !loaded)
    return (
      <p className={styles.loading} data-testid="gg-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    sessionRef.current = s;
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
  const name = (e: number) => entityAt(data, e).name[lang];
  /** The label of position k: a year on a line, a country on a bar chart. */
  const labelOf = (c: Chart, k: number) =>
    c.kind === 'line' ? String(c.year + k) : name(c.countries[k]!);
  const subtitle = (c: Chart) =>
    c.kind === 'line'
      ? t('play.line', { country: name(c.entity), from: c.year, to: c.year + c.length - 1 })
      : t('play.bars', { year: c.year });

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
        <div className={shared.menuCard} data-testid="gg-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="gg-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <ol className={styles.roundList}>
            {session.rounds
              .filter((r) => r.score !== null)
              .map((r, i) => (
                <li key={i} data-grade={grade(r.score!)}>
                  <span>
                    <strong>{INDICATOR_BY_CODE.get(r.c.code)!.title[lang]}</strong>
                    <small>{subtitle(r.c)}</small>
                  </span>
                  <b>{r.score}</b>
                </li>
              ))}
          </ol>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() => copy(shareText(session, t('title')))}
              data-testid="gg-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="gg-again"
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
              data-testid="gg-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const r = current(session);
  const c = r.c;
  const ind = INDICATOR_BY_CODE.get(c.code)!;
  const locked = r.points !== null;
  const fmt = (v: number) => formatValue(v, ind, locale, true);
  const all = values(data, c);
  const shown = all.map((v, k) => (!locked && c.gaps.includes(k) ? null : v));
  const real = locked ? truth(data, c) : null;
  const gapLabel = (i: number) => labelOf(c, c.gaps[i]!);

  const onSet = (i: number, v: number) => {
    const s0 = sessionRef.current!;
    if (current(s0).points) return;
    const s = setGap(s0, i, v);
    setSession(s);
    sessionRef.current = s;
    persist({ session: s });
  };
  const onLock = () => {
    const s0 = sessionRef.current!;
    if (current(s0).points || !allSet(current(s0))) return;
    const s = lock(s0, data);
    const nr = current(s);
    const svc = servicesRef.current;
    svc.playSound(nr.score! >= 80 ? SOUNDS.great! : nr.score! >= 50 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const close = nr.points!.filter((p) => p >= 90).length;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + nr.score!,
      close: rec.close + close,
    };
    svc.unlockAchievement('first-gap');
    if (nr.points!.every((p) => p >= 90)) svc.unlockAchievement('seamless');
    if (record.close >= 30) svc.unlockAchievement('gap-filler');
    const seen = [...savedRef.current.seen.filter((k) => k !== chartKey(c)), chartKey(c)].slice(
      -200,
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
        if (s.total >= 400) svc.unlockAchievement('data-detective');
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    setSession(s);
    sessionRef.current = s;
    persist({ session: s, record, seen, daily });
  };
  const onNext = () => {
    if (session.status === 'done') return setView('results');
    begin(next(session, data, new Set(savedRef.current.seen)));
    requestAnimationFrame(() => wrapRef.current?.focus({ preventScroll: true }));
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
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (locked || e.defaultPrevented) return;
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
      e.preventDefault();
      onLock();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      data-testid="gg-play"
      tabIndex={-1}
      onKeyDown={onKey}
    >
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="gg-round">
          {session.limit
            ? t('play.round', { n: session.count + (locked ? 0 : 1), of: session.limit })
            : t('play.roundN', { n: session.count + (locked ? 0 : 1) })}
        </span>
        <span data-testid="gg-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div>
          <span className={styles.kind}>{t(`topic.${ind.topic}`)}</span>
          <h3 className={styles.name} data-testid="gg-title">
            {ind.title[lang]}
          </h3>
          <p className={styles.sub} data-testid="gg-subtitle">
            {subtitle(c)}
            {ind.unit[lang] ? ` · ${ind.unit[lang]}` : ''}
          </p>
        </div>
        <GapChart
          c={c}
          shown={shown}
          labels={all.map((_, k) => labelOf(c, k))}
          guesses={r.guesses}
          real={real}
          onSet={onSet}
          format={fmt}
          label={t('chart.label', { indicator: ind.title[lang] })}
          gapLabel={(i) => t('play.gap', { label: gapLabel(i) })}
        />
        <ol className={styles.gaps} data-testid="gg-gaps">
          {c.gaps.map((g, i) => (
            <li key={g} data-testid={`gg-row-${i}`}>
              <b className={styles.num}>{i + 1}</b>
              <span>
                {locked
                  ? t('reveal.gap', {
                      label: gapLabel(i),
                      you: fmt(r.guesses[i]!),
                      actual: fmt(real![i]!),
                      n: r.points![i]!,
                    })
                  : `${gapLabel(i)}: ${r.guesses[i] === null ? '—' : fmt(r.guesses[i]!)}`}
              </span>
            </li>
          ))}
        </ol>
        {!locked ? (
          <>
            <p className={styles.hint}>{t(`play.hint.${c.kind}`)}</p>
            <p className={styles.keys}>{t('play.keys')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!allSet(r)}
                onClick={onLock}
                data-testid="gg-lock"
              >
                <Lock size={16} /> {t('play.lock')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="gg-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.reveal} data-testid="gg-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(r.score!)}>
                <small>{t('reveal.points')}</small>
                <strong data-testid="gg-score">
                  <CountUp to={r.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <p className={styles.facts}>{t('reveal.board')}</p>
            </div>
            <a
              className={styles.source}
              href={`https://data.worldbank.org/indicator/${c.code}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('reveal.source', { date: data.updated })}
            </a>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                onClick={onNext}
                data-testid="gg-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="gg-end">
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
      <div className={shared.menuCard} data-testid="gg-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="gg-resume"
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
              <strong data-testid="gg-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="gg-daily"
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
                  data-testid={`gg-diff-${d}`}
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
                  data-testid={`gg-topic-${k}`}
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
            data-testid="gg-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="gg-record">
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
              <dt>{t('stats.close')}</dt>
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
