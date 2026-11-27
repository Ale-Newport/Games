/**
 * Order of Magnitude screens: menu (daily, endless with difficulty and topic, resume, record),
 * play (question card, scientific-notation answer box, magnitude ruler, guess history), reveal
 * (answer, score, source) and results.
 */
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  Copy,
  Infinity as InfinityIcon,
  Lock,
  Minus,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  accuracy,
  canGuess,
  canLock,
  current,
  dayNumber,
  DIFFICULTIES,
  EXP_RANGE,
  feedback,
  finish,
  guess,
  isSession,
  lock,
  newDaily,
  newEndless,
  next,
  questionAt,
  sciValue,
  shareText,
  toSci,
  TOPICS,
  TRY_FACTOR,
  type Difficulty,
  type Feedback,
  type MagnitudeData,
  type Sci,
  type Session,
  type Topic,
} from './engine';
import { STRINGS } from './i18n';
import styles from './OrderOfMagnitude.module.css';
import { Ruler, sup } from './Ruler';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  sum: number;
  exact: number;
  first: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: number[];
  difficulty: Difficulty;
  topic: Topic;
  record: Tally;
}
const SEEN_MAX = 2000;
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  topic: 'all',
  record: { rounds: 0, sum: 0, exact: 0, first: 0 },
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

const loadQuestions = () =>
  import('./questions.json').then((m) => m.default as unknown as MagnitudeData);
const grade = (n: number) =>
  n >= 95 ? 5 : n >= 85 ? 4 : n >= 70 ? 3 : n >= 45 ? 2 : n >= 20 ? 1 : 0;
const START: Sci = { m: 1, e: 6 };

/** "3,200,000" plus "3.2 million" for big numbers. */
export function formatBig(v: number, locale: string): string {
  const loc = locale === 'es' ? 'es-ES' : 'en-US';
  const plain = new Intl.NumberFormat(loc, { maximumSignificantDigits: 4 }).format(v);
  if (v < 1e6) return plain;
  const words = new Intl.NumberFormat(loc, {
    notation: 'compact',
    compactDisplay: 'long',
    maximumSignificantDigits: 3,
  }).format(v);
  return `${plain} (${words})`;
}

/** Parses "3200000", "3,200,000", "3.200.000" (es), "3.2e6" or "3,2e6" (es). */
export function parseNumber(text: string, locale: string): number | null {
  const t = text.trim().replace(/\s+/g, '').toLowerCase();
  if (!t) return null;
  const [mant, exp] = t.split('e');
  let m = mant ?? '';
  if (locale === 'es') m = m.replace(/\./g, '').replace(',', '.');
  else m = m.replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(m) || (exp !== undefined && !/^-?\d+$/.test(exp))) return null;
  const v = Number(m) * Math.pow(10, exp ? Number(exp) : 0);
  return Number.isFinite(v) && v >= 1 ? v : null;
}

function FeedbackText({ f, t }: { f: Feedback; t: Translator }) {
  if (f.direction === 'exact') return <>{t('fb.exact')}</>;
  const dist =
    f.band === 'off'
      ? f.orders === 1
        ? t('fb.off1')
        : t('fb.off', { n: f.orders })
      : t(`fb.${f.band}`);
  return (
    <>
      {f.direction === 'higher' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}{' '}
      <b>{t(`fb.${f.direction}`)}</b> · {dist}
    </>
  );
}

export function OrderOfMagnitudeGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadQuestions);
  const data = asset.value;
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'menu' | 'play' | 'results'>('menu');
  const [session, setSession] = useState<Session | null>(null);
  const [sci, setSci] = useState<Sci>(START);
  const [typed, setTyped] = useState('');
  const [copied, setCopied] = useState(false);
  const today = dayNumber();
  const savedRef = useLatest(saved);
  const sciRef = useLatest(sci);

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
      <p className={styles.loading} data-testid="om-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    const r = current(s);
    setSci(r.guesses.length ? toSci(r.guesses[r.guesses.length - 1]!) : START);
    setTyped('');
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
        <div className={shared.menuCard} data-testid="om-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="om-final">
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
              const q = questionAt(data, r.q);
              return (
                <li key={i} data-grade={grade(r.score ?? 0)}>
                  <span>
                    <strong>{q.subject[lang]}</strong>
                    <small>
                      {t(`k.${q.kind}`)} · {formatBig(q.value, locale)} {t(`u.short.${q.kind}`)}
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
              data-testid="om-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="om-again"
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
              data-testid="om-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const round = current(session);
  const q = questionAt(data, round.q);
  const history = round.guesses.map((value) => ({ value, feedback: feedback(value, q.value) }));
  const draft = sciValue(sci);
  const tries = round.guesses.length;

  const record = (s: Session) => {
    const r = current(s);
    const svc = servicesRef.current;
    const last = r.guesses[r.guesses.length - 1]!;
    const exact = accuracy(last, q.value) === 100;
    svc.playSound(r.score! >= 85 ? SOUNDS.great! : r.score! >= 45 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const tally: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + r.score!,
      exact: rec.exact + (exact ? 1 : 0),
      first: rec.first + (exact && r.guesses.length === 1 ? 1 : 0),
    };
    svc.unlockAchievement('first-answer');
    if (exact && r.guesses.length === 1) svc.unlockAchievement('first-try');
    if (tally.exact >= 25) svc.unlockAchievement('calibrated');
    if (q.kind === 'gdp' && exact) svc.unlockAchievement('economist');
    const seen = [...savedRef.current.seen.filter((x) => x !== r.q), r.q].slice(-SEEN_MAX);
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
    persist({ session: s, record: tally, seen, daily });
  };

  const onGuess = () => {
    if (!canGuess(session)) return;
    const s = guess(session, data, sciRef.current);
    setSession(s);
    if (current(s).locked) record(s);
    else {
      servicesRef.current.playSound(SOUNDS.tick!);
      persist({ session: s });
    }
  };
  const onLock = () => {
    if (!canLock(session)) return;
    const s = lock(session, data);
    setSession(s);
    record(s);
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

  const setM = (m: number) => {
    let { e } = sciRef.current;
    let mm = Math.round(m * 10) / 10;
    if (mm >= 10) {
      mm = Math.round((mm / 10) * 10) / 10;
      e++;
    } else if (mm < 1) {
      mm = Math.round(mm * 10 * 10) / 10;
      e--;
    }
    if (e < EXP_RANGE[0] || e > EXP_RANGE[1]) return;
    const n = { m: Math.min(9.9, Math.max(1, mm)), e };
    sciRef.current = n;
    setSci(n);
  };
  const setE = (e: number) => {
    const n = { m: sciRef.current.m, e: Math.max(EXP_RANGE[0], Math.min(EXP_RANGE[1], e)) };
    sciRef.current = n;
    setSci(n);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!canGuess(session) && !(canLock(session) && (e.key === 'l' || e.key === 'L'))) return;
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const step = e.shiftKey ? 1 : 0.1;
    if (e.key === 'ArrowUp') setE(sciRef.current.e + 1);
    else if (e.key === 'ArrowDown') setE(sciRef.current.e - 1);
    else if (e.key === 'ArrowRight') setM(sciRef.current.m + step);
    else if (e.key === 'ArrowLeft') setM(sciRef.current.m - step);
    else if (e.key === 'Enter') onGuess();
    else if (e.key === 'l' || e.key === 'L') onLock();
    else return;
    e.preventDefault();
  };
  const applyTyped = () => {
    const v = parseNumber(typed, locale);
    if (v === null) return;
    const n = toSci(v);
    sciRef.current = n;
    setSci(n);
  };

  const nf1 = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const lockedGuess = round.locked ? round.guesses[round.guesses.length - 1]! : null;
  const g = round.locked ? grade(round.score!) : 0;
  const sourceUrl = q.id.startsWith('WB:')
    ? `https://data.worldbank.org/country/${q.id.split(':')[1]}`
    : `https://www.wikidata.org/wiki/${q.id.split(':')[0]}`;

  return (
    <div className={styles.wrap} data-testid="om-play" onKeyDown={key}>
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="om-round">
          {session.limit
            ? t('play.question', { n: session.count + (round.locked ? 0 : 1), of: session.limit })
            : t('play.questionN', { n: session.count + (round.locked ? 0 : 1) })}
        </span>
        <span data-testid="om-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.kind}>{t(`k.${q.kind}`)}</span>
          <h3 className={styles.name} data-testid="om-subject">
            {q.subject[lang]}
          </h3>
          <p className={styles.question} data-testid="om-question">
            {t(`q.${q.kind}`)}
          </p>
          <p className={styles.unit}>
            {t(`u.${q.kind}`)}
            {q.year ? ` · ${t('year', { year: q.year })}` : ''}
          </p>
        </div>

        <Ruler
          guesses={history}
          draft={canGuess(session) ? draft : null}
          answer={round.locked ? q.value : null}
          label={t('play.ruler')}
        />

        {history.length > 0 && (
          <ol className={styles.history} data-testid="om-history">
            {history.map((h, i) => (
              <li key={i} data-band={h.feedback.band} data-testid={`om-guess-${i}`}>
                <span className={styles.num}>{i + 1}</span>
                <span className={styles.val}>{formatBig(h.value, locale)}</span>
                <span className={styles.fb}>
                  <FeedbackText f={h.feedback} t={t} />
                </span>
              </li>
            ))}
          </ol>
        )}

        {!round.locked ? (
          <div
            className={styles.answer}
            tabIndex={0}
            data-testid="om-answer"
            aria-label={t('play.keys')}
          >
            <p className={styles.tries}>{t('play.tries', { n: tries + 1 })}</p>
            <div className={styles.sci}>
              <div className={styles.dial}>
                <small>{t('play.mantissa')}</small>
                <div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setM(sci.m - 0.1)}
                    aria-label="−0.1"
                    data-testid="om-m-down"
                  >
                    <Minus size={16} />
                  </button>
                  <strong data-testid="om-m">{nf1.format(sci.m)}</strong>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setM(sci.m + 0.1)}
                    aria-label="+0.1"
                    data-testid="om-m-up"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <span className={styles.times}>×</span>
              <div className={styles.dial}>
                <small>{t('play.exponent')}</small>
                <div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setE(sci.e - 1)}
                    aria-label="÷10"
                    data-testid="om-e-down"
                  >
                    <Minus size={16} />
                  </button>
                  <strong data-testid="om-e">10{sup(sci.e)}</strong>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setE(sci.e + 1)}
                    aria-label="×10"
                    data-testid="om-e-up"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={99}
              value={Math.round(sci.m * 10)}
              onChange={(e) => setM(Number(e.target.value) / 10)}
              className={styles.slider}
              aria-label={t('play.mantissa')}
            />
            <p className={styles.preview} data-testid="om-preview">
              = {formatBig(draft, locale)} {t(`u.short.${q.kind}`)}
            </p>
            <label className={styles.typed}>
              <span>{t('play.type')}</span>
              <input
                type="text"
                inputMode="decimal"
                value={typed}
                placeholder={t('play.typeHint')}
                onChange={(e) => setTyped(e.target.value)}
                onBlur={applyTyped}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyTyped();
                  }
                }}
                data-testid="om-typed"
              />
            </label>
            <p className={styles.keys}>{t('play.keys')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onGuess}
                data-testid="om-guess"
              >
                <Check size={16} /> {t('play.guess')}
              </button>
              {tries > 0 && (
                <button type="button" className="btn" onClick={onLock} data-testid="om-lock">
                  <Lock size={16} />{' '}
                  {t('play.lock', { pts: Math.round(100 * TRY_FACTOR[tries - 1]!) })}
                </button>
              )}
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="om-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.reveal} data-testid="om-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={g}>
                <small>{t('reveal.score')}</small>
                <strong data-testid="om-score">
                  <CountUp to={round.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p>
                  {t('reveal.answer')}:{' '}
                  <b data-testid="om-answer-value">
                    {formatBig(q.value, locale)} {t(`u.short.${q.kind}`)}
                  </b>
                </p>
                <p>
                  {t('reveal.with', {
                    n: round.guesses.length,
                    acc: accuracy(lockedGuess!, q.value),
                    factor: TRY_FACTOR[round.guesses.length - 1]!,
                  })}
                </p>
                <p className={styles.sci2}>
                  {nf1.format(toSci(q.value).m)} × 10{sup(toSci(q.value).e)}
                </p>
              </div>
            </div>
            <a className={styles.source} href={sourceUrl} target="_blank" rel="noreferrer">
              {q.id.startsWith('WB:')
                ? t('reveal.sourceWb')
                : t('reveal.sourceWd', { id: q.id.split(':')[0] ?? q.id })}
            </a>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onNext}
                autoFocus
                data-testid="om-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="om-end">
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
      <div className={shared.menuCard} data-testid="om-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="om-resume"
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
              <strong data-testid="om-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="om-daily"
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
                  data-testid={`om-diff-${d}`}
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
                  data-testid={`om-topic-${k}`}
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
            data-testid="om-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="om-record">
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
              <dt>{t('stats.exact')}</dt>
              <dd>{r.exact}</dd>
            </div>
            <div>
              <dt>{t('stats.first')}</dt>
              <dd>{r.first}</dd>
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
