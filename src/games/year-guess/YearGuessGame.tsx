/**
 * Year Guess screens: menu (daily, endless with difficulty, era and topic, resume, record), play
 * (the event, the timeline, nudges and a typed year), reveal (answer, error, the event's
 * tolerance, source) and results (a timeline of every guess against the truth).
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
  astro,
  awaiting,
  current,
  dayNumber,
  DIFFICULTIES,
  ERA_FILTERS,
  eraOf,
  eventAt,
  finish,
  fromAstro,
  guess,
  halfLife,
  isSession,
  MAX_YEAR,
  MIN_YEAR,
  newDaily,
  newEndless,
  next,
  parseYear,
  shareText,
  TOPICS,
  yearAt,
  yearsApart,
  type Difficulty,
  type EraFilter,
  type EventData,
  type Session,
  type Topic,
} from './engine';
import { STRINGS } from './i18n';
import { Timeline } from './Timeline';
import styles from './YearGuess.module.css';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  sum: number;
  exact: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: number[];
  difficulty: Difficulty;
  era: EraFilter;
  topic: Topic;
  record: Tally;
}
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  era: 'all',
  topic: 'all',
  record: { rounds: 0, sum: 0, exact: 0 },
};
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.session === null || isSession(s.session)) &&
    typeof s.daily === 'object' &&
    Array.isArray(s.seen) &&
    DIFFICULTIES.includes(s.difficulty) &&
    ERA_FILTERS.includes(s.era) &&
    TOPICS.includes(s.topic) &&
    typeof s.record?.rounds === 'number'
  );
};
const loadData = () => import('./events.json').then((m) => m.default as unknown as EventData);
const grade = (n: number) => (n >= 90 ? 3 : n >= 60 ? 2 : n >= 30 ? 1 : 0);
const NUDGES = [-100, -10, -1, 1, 10, 100];
/** Where the marker starts: the middle of the timeline (around 1800). */
const START = yearAt(0.5);

export function YearGuessGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadData);
  const data = asset.value;
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'menu' | 'play' | 'results'>('menu');
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState(START);
  const [typed, setTyped] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const draftRef = useLatest(draft);
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
      <p className={styles.loading} data-testid="yg-loading">
        {t('loading')}
      </p>
    );

  const fmtYear = (y: number) =>
    y < 0 ? t('year.bc', { y: -y }) : y < 1000 ? t('year.ad', { y }) : String(y);
  const begin = (s: Session) => {
    setSession(s);
    const r = current(s);
    setDraft(r.guess ?? START);
    draftRef.current = r.guess ?? START;
    setTyped('');
    setInvalid(false);
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
    const { difficulty, era, topic, seen } = savedRef.current;
    begin(newEndless(data, seedFor(), difficulty, era, topic, new Set(seen)));
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
        <div className={shared.menuCard} data-testid="yg-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="yg-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <p className={shared.hintText}>
            {t('results.avg', { n: session.count ? Math.round(session.total / session.count) : 0 })}
          </p>
          <section className={styles.recap}>
            <h3>{t('results.timeline')}</h3>
            <Timeline
              value={START}
              answer={null}
              disabled
              label={t('results.timeline')}
              format={fmtYear}
              markers={session.rounds
                .filter((r) => r.guess !== null)
                .map((r, i) => ({
                  guess: r.guess!,
                  answer: eventAt(data, r.event).year,
                  label: String(i + 1),
                }))}
            />
            <p className={styles.legend}>
              <span>
                <b className={styles.dotKey}>●</b> {t('results.guess')}
              </span>
              <span>
                <b className={styles.starKey}>★</b> {t('results.actual')}
              </span>
            </p>
          </section>
          <ol className={styles.roundList}>
            {session.rounds
              .filter((r) => r.guess !== null)
              .map((r, i) => {
                const e = eventAt(data, r.event);
                return (
                  <li key={i} data-grade={grade(r.score ?? 0)}>
                    <span>
                      <strong>
                        {i + 1}. {e.name[lang]}
                      </strong>
                      <small>
                        {t(`k.${e.kind}`)} · {fmtYear(e.year)} · {fmtYear(r.guess!)}
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
              data-testid="yg-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="yg-again"
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
              data-testid="yg-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const r = current(session);
  const e = eventAt(data, r.event);
  const over = r.guess !== null;
  const shown = r.guess ?? draft;
  const description = e.description[lang];

  const setYear = (y: number) => {
    draftRef.current = y;
    setDraft(y);
    setTyped('');
    setInvalid(false);
  };
  const nudge = (n: number) => {
    const a = Math.min(astro(MAX_YEAR), Math.max(astro(MIN_YEAR), astro(draftRef.current) + n));
    setYear(fromAstro(a));
  };
  const lockIn = () => {
    if (!awaiting(session)) return;
    let y = draftRef.current;
    if (typed.trim()) {
      const p = parseYear(typed);
      if (p === null) {
        setInvalid(true);
        return;
      }
      y = p;
      setYear(p);
    }
    const s = guess(session, data, y);
    const nr = current(s);
    const svc = servicesRef.current;
    setSession(s);
    svc.playSound(nr.score! >= 90 ? SOUNDS.great! : nr.score! >= 50 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const exact = nr.guess === e.year;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + nr.score!,
      exact: rec.exact + (exact ? 1 : 0),
    };
    svc.unlockAchievement('first-year');
    if (exact) svc.unlockAchievement('exact');
    if (eraOf(e.year) === 'ancient' && nr.score! >= 80) svc.unlockAchievement('antiquarian');
    const seen = [...savedRef.current.seen.filter((k) => k !== e.index), e.index].slice(-1500);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (s.rounds.every((x) => (x.score ?? 0) >= 60)) svc.unlockAchievement('historian');
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    persist({ session: s, record, seen, daily });
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
  const onBoxKey = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'Enter' && (ev.target as HTMLElement).tagName !== 'BUTTON') {
      ev.preventDefault();
      lockIn();
    }
  };
  const off = over ? yearsApart(r.guess!, e.year) : 0;

  return (
    <div className={styles.wrap} data-testid="yg-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                era: t(`era.${session.era}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="yg-round">
          {session.limit
            ? t('play.round', { n: session.count + (over ? 0 : 1), of: session.limit })
            : t('play.roundN', { n: session.count + (over ? 0 : 1) })}
        </span>
        <span data-testid="yg-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div>
          <span className={styles.kind}>{t(`k.${e.kind}`)}</span>
          <h3 className={styles.name} data-testid="yg-subject">
            {e.name[lang]}
          </h3>
          {description && <p className={styles.desc}>{description}</p>}
        </div>
        <p className={styles.question} data-testid="yg-question">
          {t(`q.${e.kind}`)}
        </p>
        <div onKeyDown={onBoxKey}>
          <Timeline
            value={shown}
            onChange={setYear}
            answer={over ? e.year : null}
            disabled={over}
            label={t('play.timeline')}
            format={fmtYear}
          />
        </div>

        {over ? (
          <div className={styles.reveal} data-testid="yg-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(r.score!)}>
                <small>{t('reveal.points')}</small>
                <strong data-testid="yg-score">
                  <CountUp to={r.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p data-testid="yg-answer">
                  <b>{t('reveal.answer', { year: fmtYear(e.year) })}</b>
                </p>
                <p data-testid="yg-off">
                  {off === 0
                    ? t('reveal.exact')
                    : off === 1
                      ? t('reveal.offOne')
                      : t('reveal.off', { n: off })}
                </p>
                <p className={styles.unit}>
                  {t('reveal.half', { h: Math.round(halfLife(e.year)) })}
                </p>
              </div>
            </div>
            <a
              className={styles.source}
              href={`https://www.wikidata.org/wiki/${e.qid}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('reveal.source', { id: e.qid })}
            </a>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                onClick={onNext}
                data-testid="yg-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="yg-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.answerBox} onKeyDown={onBoxKey} data-testid="yg-answer-box">
            <div className={styles.nudge}>
              {NUDGES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="btn"
                  onClick={() => nudge(n)}
                  data-testid={`yg-nudge-${n}`}
                >
                  {n > 0 ? `+${n}` : `−${-n}`}
                </button>
              ))}
            </div>
            <label className={styles.typed}>
              <span>{t('play.type')}</span>
              <input
                type="text"
                inputMode="text"
                placeholder={t('play.typeHint')}
                value={typed}
                onChange={(ev) => {
                  setTyped(ev.target.value);
                  setInvalid(false);
                }}
                data-testid="yg-typed"
              />
            </label>
            {invalid && (
              <p className={styles.warn} role="alert">
                {t('play.invalid')}
              </p>
            )}
            <p className={styles.keys}>{t('play.keys')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={lockIn}
                data-testid="yg-lock"
              >
                <Lock size={16} /> {t('play.submit')} ·{' '}
                {fmtYear(typed.trim() ? (parseYear(typed) ?? draft) : draft)}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="yg-end">
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
      <div className={shared.menuCard} data-testid="yg-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="yg-resume"
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
              <strong data-testid="yg-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="yg-daily"
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
                  data-testid={`yg-diff-${d}`}
                >
                  {t(`diff.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`diff.${saved.difficulty}.hint`)}</p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.era')}</legend>
            <div className={styles.chips}>
              {ERA_FILTERS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="chip"
                  aria-pressed={saved.era === k}
                  onClick={() => onPick({ era: k })}
                  data-testid={`yg-era-${k}`}
                >
                  {t(`era.${k}`)}
                </button>
              ))}
            </div>
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
                  data-testid={`yg-topic-${k}`}
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
            data-testid="yg-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="yg-record">
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
              <dt>{t('stats.streak')}</dt>
              <dd>{dailyStreak(saved.daily, today)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
