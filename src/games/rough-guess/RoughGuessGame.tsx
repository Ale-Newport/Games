/**
 * Rough Guess screens: menu (daily, endless with difficulty and topic, resume, record), play
 * (question card, range scale, lock in), reveal (hit or miss, answer, score, source) and results
 * (scores, calibration verdict, share line).
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
  answer,
  current,
  dayNumber,
  DIFFICULTIES,
  domain,
  finish,
  isSession,
  newDaily,
  newEndless,
  next,
  question,
  scoreRange,
  shareText,
  TOPICS,
  type Bank,
  type Difficulty,
  type Question,
  type Session,
  type Topic,
} from './engine';
import { formatValue, unitLabel } from './format';
import { STRINGS } from './i18n';
import { RangeScale } from './RangeScale';
import styles from './RoughGuess.module.css';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  sum: number;
  hits: number;
  /** Sum of range widths (orders of magnitude). */
  widths: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: string[];
  difficulty: Difficulty;
  topic: Topic;
  record: Tally;
}
const SEEN_MAX = 2500;
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  topic: 'all',
  record: { rounds: 0, sum: 0, hits: 0, widths: 0 },
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
    typeof s.record?.rounds === 'number'
  );
}

const loadBank = () =>
  Promise.all([import('./data.json'), import('../order-of-magnitude/questions.json')]).then(
    ([r, m]) => ({ rough: r.default, mag: m.default }) as unknown as Bank,
  );
const grade = (n: number) => (n === 0 ? 0 : n >= 80 ? 3 : n >= 50 ? 2 : 1);

/** Round Celsius temperatures as ticks (log10 kelvin) for melting and boiling points. */
const CELSIUS = [-250, -200, -100, 0, 100, 250, 500, 1000, 2000, 3000, 5000];
const celsiusTicks = (d: [number, number]) =>
  CELSIUS.map((c) => Math.log10(c + 273.15)).filter((v) => v >= d[0] && v <= d[1]);

/** The starting range: the middle fifth of the scale's log width (a fair, uninformative start). */
function startRange(d: [number, number]): [number, number] {
  const mid = (d[0] + d[1]) / 2;
  const half = Math.min(1, (d[1] - d[0]) / 5);
  return [mid - half, mid + half];
}

export function RoughGuessGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadBank);
  const bank = asset.value;
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'menu' | 'play' | 'results'>('menu');
  const [session, setSession] = useState<Session | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 1]);
  const [copied, setCopied] = useState(false);
  const today = dayNumber();
  const savedRef = useLatest(saved);
  const rangeRef = useLatest(range);

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
  if (!bank || !loaded)
    return (
      <p className={styles.loading} data-testid="rg-loading">
        {t('loading')}
      </p>
    );

  const fmt = (q: Question, v: number) => formatValue(q, v, locale, t);
  const begin = (s: Session) => {
    setSession(s);
    setRange(startRange(domain(bank, question(bank, current(s).key))));
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
    begin(newDaily(bank, today));
  };
  const startEndless = () => {
    const { difficulty, topic } = savedRef.current;
    begin(newEndless(bank, seedFor(), difficulty, topic, seenSet()));
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

  if (view === 'results') {
    const pct = session.count ? Math.round((100 * session.hits) / session.count) : 0;
    const verdict = pct < 60 ? 'results.tooBold' : pct > 92 ? 'results.tooSafe' : 'results.good';
    return (
      <div className={shared.menu}>
        <div className={shared.menuCard} data-testid="rg-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="rg-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <p data-testid="rg-calibration">
            {t('results.calibration', { h: session.hits, n: session.count, pct })}{' '}
            <b>{t(verdict)}</b>
          </p>
          <ol className={styles.roundList}>
            {session.rounds.map((r, i) => {
              const q = question(bank, r.key);
              return (
                <li key={i} data-grade={grade(r.score ?? 0)}>
                  <span>
                    <strong>{q.subject[lang]}</strong>
                    <small>
                      {t(`k.${q.kind}`)} · {fmt(q, q.value)}
                      {r.range && ` · ${fmt(q, r.range[0])} – ${fmt(q, r.range[1])}`}
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
              data-testid="rg-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="rg-again"
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
              data-testid="rg-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const round = current(session);
  const q = question(bank, round.key);
  const d = domain(bank, q);
  const revealed = round.range !== null;
  const shown: [number, number] = round.range
    ? [Math.log10(round.range[0]), Math.log10(round.range[1])]
    : range;
  const loV = Math.pow(10, shown[0]);
  const hiV = Math.pow(10, shown[1]);
  const potential = scoreRange(loV, hiV, Math.sqrt(loV * hiV));
  const nf = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    maximumSignificantDigits: 3,
  });

  const onLock = () => {
    if (revealed) return;
    const [a, b] = rangeRef.current;
    const s = answer(session, bank, Math.pow(10, a), Math.pow(10, b));
    const r = current(s);
    const svc = servicesRef.current;
    svc.playSound(r.score! >= 80 ? SOUNDS.great! : r.score! > 0 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + r.score!,
      hits: rec.hits + (r.score! > 0 ? 1 : 0),
      widths: rec.widths + (b - a),
    };
    svc.unlockAchievement('first-range');
    if (r.score! >= 90) svc.unlockAchievement('narrow');
    if (
      record.rounds >= 50 &&
      record.hits / record.rounds >= 0.8 &&
      record.hits / record.rounds <= 0.95
    )
      svc.unlockAchievement('calibrated');
    if (q.kind === 'price' && r.score! >= 80) svc.unlockAchievement('trader');
    const seen = [...savedRef.current.seen.filter((k) => k !== r.key), r.key].slice(-SEEN_MAX);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (s.hits === s.count) svc.unlockAchievement('clean-sheet');
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    setSession(s);
    persist({ session: s, record, seen, daily });
  };
  const onNext = () => {
    if (session.status === 'done') return setView('results');
    begin(next(session, bank, seenSet()));
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

  const hit = revealed ? round.score! > 0 : null;
  const sourceUrl =
    q.source === 'pink'
      ? 'https://www.worldbank.org/en/research/commodity-markets'
      : q.source === 'worldbank'
        ? `https://data.worldbank.org/country/${q.ref}`
        : `https://www.wikidata.org/wiki/${q.ref.split(',')[0]}`;
  const sourceText =
    q.source === 'wikidata'
      ? t('reveal.source.wikidata', { id: q.ref })
      : t(`reveal.source.${q.source}`);

  return (
    <div className={styles.wrap} data-testid="rg-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="rg-round">
          {session.limit
            ? t('play.question', { n: session.count + (revealed ? 0 : 1), of: session.limit })
            : t('play.questionN', { n: session.count + (revealed ? 0 : 1) })}
        </span>
        <span data-testid="rg-hits">{t('play.hits', { h: session.hits, n: session.count })}</span>
        <span data-testid="rg-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.kind}>{t(`k.${q.kind}`)}</span>
          <h3 className={styles.name} data-testid="rg-subject">
            {q.subject[lang]}
          </h3>
          <p className={styles.question} data-testid="rg-question">
            {t(`q.${q.kind}`, { year: q.year })}
          </p>
          <p className={styles.unit}>
            {unitLabel(q, t)}
            {q.year && q.kind !== 'price' ? ` · ${t('year', { year: q.year })}` : ''}
          </p>
        </div>
        <RangeScale
          key={round.key}
          domain={d}
          range={shown}
          onRange={setRange}
          answer={revealed ? Math.log10(q.value) : null}
          hit={hit}
          format={(v) => fmt(q, v)}
          labels={{ low: t('play.low'), high: t('play.high') }}
          disabled={revealed}
          tickValues={q.kind === 'melting' || q.kind === 'boiling' ? celsiusTicks(d) : undefined}
        />
        <p className={styles.readout} data-testid="rg-readout">
          {t('play.range')}: <b>{fmt(q, loV)}</b> – <b>{fmt(q, hiV)}</b>{' '}
          <small>{t('play.width', { x: nf.format(hiV / loV), pts: potential })}</small>
        </p>
        {!revealed ? (
          <>
            <p className={styles.hint}>{t('play.hint')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onLock}
                data-testid="rg-lock"
              >
                <Lock size={16} /> {t('play.lock')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="rg-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.reveal} data-testid="rg-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-hit={hit}>
                <small>{hit ? t('reveal.hit') : t('reveal.miss')}</small>
                <strong data-testid="rg-score">
                  <CountUp to={round.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p data-testid="rg-answer">{t('reveal.answer', { value: fmt(q, q.value) })}</p>
                {(q.kind === 'melting' || q.kind === 'boiling') && (
                  <p>
                    <small>{nf.format(q.value)} K</small>
                  </p>
                )}
              </div>
            </div>
            <a className={styles.source} href={sourceUrl} target="_blank" rel="noreferrer">
              {sourceText}
            </a>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onNext}
                autoFocus
                data-testid="rg-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="rg-end">
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
  const nf = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 2 });
  return (
    <div className={shared.menu}>
      <div className={shared.menuCard} data-testid="rg-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="rg-resume"
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
              <strong data-testid="rg-daily-done">{t('menu.dailyDone', { score: done })}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => onShare(`${t('title')} #${today + 1} — ${done}/1000`)}
              >
                <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDaily}
              data-testid="rg-daily"
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
                  data-testid={`rg-diff-${d}`}
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
                  data-testid={`rg-topic-${k}`}
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
            data-testid="rg-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="rg-record">
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
              <dt>{t('stats.hits')}</dt>
              <dd>{r.rounds ? `${Math.round((100 * r.hits) / r.rounds)} %` : '—'}</dd>
            </div>
            <div>
              <dt>{t('stats.width')}</dt>
              <dd>{r.rounds ? `×${nf.format(Math.pow(10, r.widths / r.rounds))}` : '—'}</dd>
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
