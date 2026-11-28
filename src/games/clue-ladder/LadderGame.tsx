/**
 * Clue Ladder screens: menu (daily, endless with difficulty and topic, resume, record), play (the
 * question, the ladder of clues — revealed rungs open, the rest locked — the guess box, then keep
 * or climb), reveal (answer, how the score was made, source) and results.
 */
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  ChevronsUp,
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
import { parseNumber } from '../order-of-magnitude/OrderOfMagnitudeGame';
import { domain, question, type Question } from '../rough-guess/engine';
import { formatValue, unitLabel } from '../rough-guess/format';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  accuracy,
  canDecide,
  canGuess,
  climb,
  cluesFor,
  current,
  dayNumber,
  DIFFICULTIES,
  feedback,
  finish,
  guess,
  isSession,
  keep,
  newDaily,
  newEndless,
  next,
  RUNG_VALUE,
  RUNGS,
  shareText,
  TOPICS,
  type Bank,
  type Difficulty,
  type Feedback,
  type Session,
  type Topic,
} from './engine';
import { STRINGS } from './i18n';
import styles from './ClueLadder.module.css';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  sum: number;
  first: number;
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
  record: { rounds: 0, sum: 0, first: 0 },
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
const loadBank = () =>
  Promise.all([
    import('../rough-guess/data.json'),
    import('../order-of-magnitude/questions.json'),
  ]).then(([r, m]) => ({ rough: r.default, mag: m.default }) as unknown as Bank);
const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
const grade = (n: number) => (n >= 80 ? 3 : n >= 50 ? 2 : n >= 25 ? 1 : 0);

function FeedbackText({ f, t }: { f: Feedback; t: Translator }) {
  if (f.direction === 'exact') return <>{t('fb.exact')}</>;
  return (
    <>
      {f.direction === 'higher' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}{' '}
      <b>{t(`fb.${f.direction}`)}</b> · {t(`fb.${f.band}`)}
    </>
  );
}

export function LadderGame({ services }: GameProps) {
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
  const [draft, setDraft] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
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
  if (!bank || !loaded)
    return (
      <p className={styles.loading} data-testid="cl-loading">
        {t('loading')}
      </p>
    );

  const fmt = (q: Question, v: number) => formatValue(q, v, locale, t, 4);
  const mult = (rung: number) => (RUNG_VALUE[rung]! / 100).toLocaleString(locale);
  const begin = (s: Session) => {
    setSession(s);
    setDraft(null);
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
    begin(newDaily(bank, today));
  };
  const startEndless = () => {
    const { difficulty, topic, seen } = savedRef.current;
    begin(newEndless(bank, seedFor(), difficulty, topic, new Set(seen)));
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
        <div className={shared.menuCard} data-testid="cl-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="cl-final">
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
              const q = question(bank, r.key);
              return (
                <li key={i} data-grade={grade(r.score ?? 0)}>
                  <span>
                    <strong>{cap(q.subject[lang])}</strong>
                    <small>
                      {t(`k.${q.kind}`)} · {fmt(q, q.value)} · {t(`rung.${r.kept ?? 0}`)}
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
              data-testid="cl-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="cl-again"
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
              data-testid="cl-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const r = current(session);
  const q = question(bank, r.key);
  const sc = domain(bank, q);
  const clues = cluesFor(bank, r.key, r.clueSeed);
  const over = r.kept !== null;
  const value = draft ?? Math.pow(10, (sc[0] + sc[1]) / 2);
  const clampV = (v: number) => Math.min(Math.pow(10, sc[1]), Math.max(Math.pow(10, sc[0]), v));
  const history = r.guesses.map((g) => ({ g, f: feedback(g, q.value) }));
  const deciding = canDecide(session);
  const yearOf = (y: number) => (y ? ` (${y})` : '');

  const settleSideEffects = (s: Session) => {
    const nr = current(s);
    if (nr.kept === null) return;
    const svc = servicesRef.current;
    svc.playSound(nr.score! >= 70 ? SOUNDS.great! : nr.score! >= 30 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + nr.score!,
      first: rec.first + (nr.kept === 0 ? 1 : 0),
    };
    svc.unlockAchievement('first-rung');
    if (nr.kept === 0 && nr.score! >= 85) svc.unlockAchievement('no-clues');
    if (nr.kept === RUNGS - 1 && nr.score! >= 25) svc.unlockAchievement('top-rung');
    if (record.first >= 20) svc.unlockAchievement('confident');
    const seen = [...savedRef.current.seen.filter((k) => k !== nr.key), nr.key].slice(-2500);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    persist({ session: s, record, seen, daily });
  };
  const apply = (s: Session) => {
    setSession(s);
    if (current(s).kept !== null) settleSideEffects(s);
    else persist({ session: s });
  };
  const onGuess = () => {
    if (!canGuess(session)) return;
    let v = value;
    if (typed.trim()) {
      const parsed = parseNumber(typed, locale);
      const l = parsed === null ? NaN : Math.log10(parsed);
      if (parsed === null || !(l >= sc[0] && l <= sc[1])) {
        setInvalid(true);
        return;
      }
      v = parsed;
    }
    setTyped('');
    setInvalid(false);
    servicesRef.current.playSound(SOUNDS.tick!);
    setDraft(v);
    apply(guess(session, bank, v));
  };
  const onKeep = () => canDecide(session) && apply(keep(session, bank));
  const onClimb = () => {
    if (!canDecide(session)) return;
    servicesRef.current.playSound(SOUNDS.climb!);
    apply(climb(session));
  };
  const onNext = () => {
    if (session.status === 'done') return setView('results');
    begin(next(session, bank, new Set(savedRef.current.seen)));
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
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (deciding) {
      if (e.key === 'k' || e.key === 'K') onKeep();
      else if (e.key === 'c' || e.key === 'C') onClimb();
      else return;
      e.preventDefault();
      return;
    }
    if (!canGuess(session)) return;
    const f = e.shiftKey ? 1.5 : 1.05;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setDraft(clampV(value * f));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setDraft(clampV(value / f));
    else if (e.key === 'Enter') onGuess();
    else return;
    e.preventDefault();
  };
  const sourceText =
    q.source === 'wikidata'
      ? t('reveal.source.wikidata', { id: q.ref })
      : t(`reveal.source.${q.source}`);
  const sourceUrl =
    q.source === 'pink'
      ? 'https://www.worldbank.org/en/research/commodity-markets'
      : q.source === 'worldbank'
        ? `https://data.worldbank.org/country/${q.ref}`
        : `https://www.wikidata.org/wiki/${q.ref.split(',')[0]}`;

  const clueText = (rung: number) => {
    if (rung === 0)
      return `${t(`q.${q.kind}`, { year: q.year })} ${unitLabel(q, t)}${q.year && q.kind !== 'price' ? ` · ${t('year', { year: q.year })}` : ''}`;
    if (rung === 1) {
      const b = clues.bracket;
      if (!b.below && !b.above) return t('clue.none');
      return [
        b.below &&
          t('clue.below', {
            subject: b.below.subject[lang],
            year: yearOf(b.below.year),
            value: fmt(q, b.below.value),
          }),
        b.above &&
          t('clue.above', {
            subject: b.above.subject[lang],
            year: yearOf(b.above.year),
            value: fmt(q, b.above.value),
          }),
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (rung === 2)
      return clues.digits === 0 ? t('clue.digits0') : t('clue.digits', { n: clues.digits });
    if (rung === 3) return t('clue.leading', { d: clues.leading });
    return t('clue.window', { lo: fmt(q, clues.window[0]), hi: fmt(q, clues.window[1]) });
  };

  return (
    <div className={styles.wrap} data-testid="cl-play" onKeyDown={key}>
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="cl-round">
          {session.limit
            ? t('play.question', { n: session.count + (over ? 0 : 1), of: session.limit })
            : t('play.questionN', { n: session.count + (over ? 0 : 1) })}
        </span>
        <span data-testid="cl-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.kind}>{t(`k.${q.kind}`)}</span>
          <h3 className={styles.name} data-testid="cl-subject">
            {q.subject[lang]}
          </h3>
        </div>
        <ol className={styles.ladder} data-testid="cl-ladder">
          {Array.from({ length: RUNGS }, (_, i) => {
            const open = i <= r.rung || over;
            const h = history[i];
            return (
              <li
                key={i}
                className={styles.rung}
                data-open={open}
                data-current={i === r.rung && !over}
                data-testid={`cl-rung-${i}`}
              >
                <span className={styles.rungHead}>
                  <b>{i + 1}</b> {t(`rung.${i}`)} <small>{t('rung.worth', { v: mult(i) })}</small>
                </span>
                {open ? (
                  <span className={styles.clue}>{clueText(i)}</span>
                ) : (
                  <Lock size={14} aria-hidden />
                )}
                {h && (
                  <span className={styles.fb} data-band={h.f.band} data-testid={`cl-fb-${i}`}>
                    {fmt(q, h.g)} — <FeedbackText f={h.f} t={t} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {over ? (
          <div className={styles.reveal} data-testid="cl-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(r.score!)}>
                <small>{t('reveal.points')}</small>
                <strong data-testid="cl-score">
                  <CountUp to={r.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p data-testid="cl-answer">
                  <b>{t('reveal.answer', { value: fmt(q, q.value) })}</b>
                </p>
                <p>
                  {t('reveal.kept', {
                    n: r.kept! + 1,
                    acc: accuracy(r.guesses[r.kept!]!, q.value),
                    v: RUNG_VALUE[r.kept!]!,
                  })}
                </p>
              </div>
            </div>
            <a className={styles.source} href={sourceUrl} target="_blank" rel="noreferrer">
              {sourceText}
            </a>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                onClick={onNext}
                data-testid="cl-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="cl-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        ) : deciding ? (
          <div className={styles.actions} data-testid="cl-decide">
            <button
              type="button"
              className="btn btn-primary"
              autoFocus
              onClick={onKeep}
              data-testid="cl-keep"
            >
              <Check size={16} /> {t('play.keep', { v: mult(r.rung) })}
            </button>
            <button type="button" className="btn" onClick={onClimb} data-testid="cl-climb">
              <ChevronsUp size={16} /> {t('play.climb')}
            </button>
          </div>
        ) : (
          <div
            className={styles.answerBox}
            tabIndex={0}
            autoFocus={r.rung > 0}
            data-testid="cl-answer-box"
          >
            <p className={styles.small}>{t('play.guess', { n: r.rung + 1 })}</p>
            <div className={styles.dial}>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(clampV(value / 1.5))}
                aria-label="÷1.5"
                data-testid="cl-down"
              >
                <Minus size={16} />
              </button>
              <strong data-testid="cl-value">{fmt(q, value)}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(clampV(value * 1.5))}
                aria-label="×1.5"
                data-testid="cl-up"
              >
                <Plus size={16} />
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(((Math.log10(value) - sc[0]) / (sc[1] - sc[0])) * 1000)}
              onChange={(e) =>
                setDraft(Math.pow(10, sc[0] + (Number(e.target.value) / 1000) * (sc[1] - sc[0])))
              }
              aria-label={t('play.guess', { n: r.rung + 1 })}
              className={styles.slider}
              data-testid="cl-slider"
            />
            <label className={styles.typed}>
              <span>{t('play.type')}</span>
              <input
                type="text"
                inputMode="decimal"
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setInvalid(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onGuess();
                  }
                }}
                data-testid="cl-typed"
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
                onClick={onGuess}
                data-testid="cl-guess"
              >
                <Play size={16} /> {t('play.submit')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="cl-end">
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
      <div className={shared.menuCard} data-testid="cl-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="cl-resume"
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
              <strong data-testid="cl-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="cl-daily"
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
                  data-testid={`cl-diff-${d}`}
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
                  data-testid={`cl-topic-${k}`}
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
            data-testid="cl-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="cl-record">
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
