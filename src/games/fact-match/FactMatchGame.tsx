/**
 * Fact Match screens: menu (daily, endless with difficulty and topic, resume, record), the board
 * (five facts with slots, the tray of seven numbers, checks), the reveal (answers, when each
 * locked, what the decoys were, source) and results.
 */
import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCheck,
  Copy,
  Infinity as InfinityIcon,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { question, type Question } from '../rough-guess/engine';
import { formatValue, unitLabel } from '../rough-guess/format';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  boardOver,
  CHECKS,
  checkIn,
  current,
  dayNumber,
  destination,
  DIFFICULTIES,
  finish,
  isSession,
  newDaily,
  newEndless,
  next,
  NUMBERS,
  placeIn,
  shareText,
  TOPICS,
  unplaceIn,
  type Bank,
  type Board,
  type Difficulty,
  type Session,
  type Topic,
} from './engine';
import styles from './FactMatch.module.css';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';

interface Tally {
  boards: number;
  sum: number;
  perfect: number;
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
  record: { boards: 0, sum: 0, perfect: 0 },
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
    typeof s.record?.boards === 'number'
  );
};
const loadBank = () =>
  Promise.all([
    import('../rough-guess/data.json'),
    import('../order-of-magnitude/questions.json'),
  ]).then(([r, m]) => ({ rough: r.default, mag: m.default }) as unknown as Bank);
const LETTERS = 'ABCDE';
const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
const grade = (n: number) => (n >= 80 ? 3 : n >= 50 ? 2 : n > 0 ? 1 : 0);

export function FactMatchGame({ services }: GameProps) {
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
  const [selNumber, setSelNumber] = useState<number | null>(null);
  const [selFact, setSelFact] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const sessionRef = useLatest(session);
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
      <p className={styles.loading} data-testid="fm-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    sessionRef.current = s;
    setSelNumber(null);
    setSelFact(null);
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

  /** Board title, unit and how each fact is labelled. */
  const describe = (b: Board) => {
    const q0 = question(bank, b.facts[0]!);
    const f = b.family;
    const title = f.startsWith('p:')
      ? t('board.price', { name: q0.subject[lang] })
      : f.startsWith('d:')
        ? t('board.distance', {
            city: bank.rough.cities[Number(f.split(':')[1])]![lang === 'es' ? 2 : 1],
          })
        : t(`board.${q0.kind}`);
    const what = f.startsWith('p:')
      ? 'price'
      : f.startsWith('d:')
        ? 'distance'
        : f.startsWith('e:')
          ? 'element'
          : 'world';
    const label = (key: string): { main: string; sub: string } => {
      const q = question(bank, key);
      if (f.startsWith('p:')) return { main: String(q.year), sub: '' };
      if (f.startsWith('d:')) {
        const c = bank.rough.cities[destination(f, key)]!;
        return { main: c[lang === 'es' ? 2 : 1], sub: '' };
      }
      return {
        main: cap(q.subject[lang]),
        sub: q.year && !f.startsWith('e:') ? String(q.year) : '',
      };
    };
    return { q0, title, what, label };
  };
  const fmt = (q: Question, v: number) => formatValue(q, v, locale, t, 3);

  if (view === 'results')
    return (
      <div className={shared.menu}>
        <div className={shared.menuCard} data-testid="fm-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="fm-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <ol className={styles.roundList}>
            {session.boards.filter(boardOver).map((b, i) => (
              <li key={i} data-grade={grade(b.score ?? 0)}>
                <span>
                  <strong>{describe(b).title}</strong>
                  <small>
                    {b.locked
                      .map((l) => (l === 1 ? '🟩' : l === 2 ? '🟨' : l === 3 ? '🟧' : '⬛'))
                      .join('')}
                  </small>
                </span>
                <b>{b.score}</b>
              </li>
            ))}
          </ol>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() => copy(shareText(session, t('title')))}
              data-testid="fm-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="fm-again"
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
              data-testid="fm-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const b = current(session);
  const over = boardOver(b);
  const { q0, title, what, label } = describe(b);
  const lockedNumbers = new Set(
    b.placement.filter((p, f) => p !== null && b.locked[f]) as number[],
  );
  const placedOn = (n: number) => b.placement.findIndex((p) => p === n);

  const apply = (s: Session) => {
    setSession(s);
    sessionRef.current = s;
    persist({ session: s });
  };
  const doPlace = (f: number, n: number) => {
    const s = sessionRef.current!;
    const cb = current(s);
    if (boardOver(cb) || cb.locked[f] || lockedNumbers.has(n)) return;
    servicesRef.current.playSound(SOUNDS.place!);
    apply(placeIn(s, f, n));
    setSelNumber(null);
    setSelFact(null);
  };
  const onNumber = (n: number) => {
    if (over || lockedNumbers.has(n)) return;
    if (selFact !== null) doPlace(selFact, n);
    else setSelNumber((x) => (x === n ? null : n));
  };
  const onFact = (f: number) => {
    if (over || b.locked[f]) return;
    if (selNumber !== null) return doPlace(f, selNumber);
    const p = b.placement[f];
    if (p !== null && p !== undefined) {
      apply(unplaceIn(sessionRef.current!, f));
      return;
    }
    setSelFact((x) => (x === f ? null : f));
  };
  const canCheck = !over && b.placement.some((p, f) => p !== null && !b.locked[f]);
  const onCheck = () => {
    const s0 = sessionRef.current!;
    if (!canCheck) return;
    const s = checkIn(s0);
    const nb = current(s);
    const svc = servicesRef.current;
    const newLocks = nb.locked.filter((l, f) => l && !current(s0).locked[f]).length;
    setSelNumber(null);
    setSelFact(null);
    if (!boardOver(nb)) {
      svc.playSound(newLocks ? SOUNDS.good! : SOUNDS.poor!);
      return apply(s);
    }
    svc.playSound(nb.score! >= 80 ? SOUNDS.great! : nb.score! >= 40 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const perfect = nb.score === 100;
    const record: Tally = {
      boards: rec.boards + 1,
      sum: rec.sum + nb.score!,
      perfect: rec.perfect + (perfect ? 1 : 0),
    };
    svc.unlockAchievement('first-board');
    if (perfect) svc.unlockAchievement('perfect');
    if (nb.locked.every((l) => l > 0) && nb.checks === CHECKS) svc.unlockAchievement('close-call');
    const seen = [...savedRef.current.seen.filter((k) => k !== nb.family), nb.family].slice(-40);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (s.total >= 250) svc.unlockAchievement('sharp');
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    setSession(s);
    sessionRef.current = s;
    persist({ session: s, record, seen, daily });
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
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (over) return;
    const k = e.key.toUpperCase();
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= NUMBERS) onNumber(n - 1);
    else if (k.length === 1 && LETTERS.includes(k)) onFact(LETTERS.indexOf(k));
    else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') onCheck();
    else if (e.key === 'Escape') {
      setSelNumber(null);
      setSelFact(null);
    } else return;
    e.preventDefault();
  };
  const sources = [...new Set(b.facts.map((k) => question(bank, k).source))];

  return (
    <div className={styles.wrap} data-testid="fm-play" tabIndex={-1} onKeyDown={onKey}>
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: t(`topic.${session.topic}`),
              })}
        </span>
        <span data-testid="fm-round">
          {session.limit
            ? t('play.board', { n: session.count + (over ? 0 : 1), of: session.limit })
            : t('play.boardN', { n: session.count + (over ? 0 : 1) })}
        </span>
        <span data-testid="fm-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div>
          <h3 className={styles.name} data-testid="fm-title">
            {title}
          </h3>
          <p className={styles.unit}>{t('board.unit', { unit: unitLabel(q0, t) })}</p>
          <p className={styles.hint}>{t('board.hint', { what: t(`what.${what}`) })}</p>
        </div>

        <ol className={styles.facts} data-testid="fm-facts">
          {b.facts.map((key, f) => {
            const l = label(key);
            const p = b.placement[f];
            const q = question(bank, key);
            const crosses = b.wrong
              .filter((w) => Math.floor(w / NUMBERS) === f)
              .map((w) => w % NUMBERS);
            return (
              <li
                key={key}
                className={styles.fact}
                data-locked={b.locked[f]! > 0}
                data-selected={selFact === f}
                data-testid={`fm-fact-${f}`}
              >
                <span className={styles.factLabel}>
                  <b className={styles.letter}>{LETTERS[f]}</b>
                  <span>
                    {l.main}
                    {l.sub && <small> · {l.sub}</small>}
                  </span>
                </span>
                {over ? (
                  <span className={styles.answer} data-testid={`fm-answer-${f}`}>
                    {fmt(q, q.value)}{' '}
                    <small>
                      {b.locked[f] ? t('reveal.lockedOn', { n: b.locked[f]! }) : t('reveal.missed')}
                    </small>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.slot}
                    data-filled={p !== null}
                    disabled={b.locked[f]! > 0}
                    onClick={() => onFact(f)}
                    aria-label={
                      p !== null && p !== undefined
                        ? t('play.remove', { number: fmt(q0, b.values[p]!), fact: l.main })
                        : selNumber !== null
                          ? t('play.place', { number: fmt(q0, b.values[selNumber]!), fact: l.main })
                          : l.main
                    }
                    data-testid={`fm-slot-${f}`}
                  >
                    {b.locked[f] ? <Check size={16} aria-label={t('play.locked')} /> : null}
                    {p !== null && p !== undefined ? fmt(q0, b.values[p]!) : t('play.empty')}
                  </button>
                )}
                {crosses.length > 0 && !b.locked[f] && !over && (
                  <span className={styles.crosses} data-testid={`fm-crosses-${f}`}>
                    <X size={13} aria-hidden /> {t('play.not')}{' '}
                    {crosses.map((n) => fmt(q0, b.values[n]!)).join(', ')}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {over ? (
          <div className={styles.reveal} data-testid="fm-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(b.score!)}>
                <small>{t('reveal.points')}</small>
                <strong data-testid="fm-score">
                  <CountUp to={b.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts2}>
                <p>{t('reveal.decoys')}</p>
                <ul data-testid="fm-decoys">
                  {b.decoyFacts.map((k) => {
                    const q = question(bank, k);
                    const l = label(k);
                    return (
                      <li key={k}>
                        <b>{fmt(q, q.value)}</b> — {l.main}
                        {l.sub && ` (${l.sub})`}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            {sources.map((src) => (
              <p key={src} className={styles.source}>
                {t(`reveal.source.${src}`)}
              </p>
            ))}
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                onClick={onNext}
                data-testid="fm-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="fm-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className={styles.small}>{t('play.numbers')}</p>
              <div className={styles.tray} data-testid="fm-tray">
                {b.values.map((v, n) => {
                  const on = placedOn(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      className={styles.chip}
                      aria-pressed={selNumber === n}
                      data-placed={on >= 0}
                      data-locked={lockedNumbers.has(n)}
                      disabled={lockedNumbers.has(n)}
                      onClick={() => onNumber(n)}
                      data-testid={`fm-number-${n}`}
                    >
                      <small>{n + 1}</small> {fmt(q0, v)}
                      {on >= 0 && <em> → {LETTERS[on]}</em>}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className={styles.keys}>
              {t('play.select')} {t('play.keys')}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canCheck}
                onClick={onCheck}
                data-testid="fm-check"
              >
                <CheckCheck size={16} /> {t('play.check', { n: CHECKS - b.checks })}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="fm-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
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
      <div className={shared.menuCard} data-testid="fm-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="fm-resume"
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
              <strong data-testid="fm-daily-done">{t('menu.dailyDone', { score: done })}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => onShare(`${t('title')} #${today + 1} — ${done}/300`)}
              >
                <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDaily}
              data-testid="fm-daily"
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
                  data-testid={`fm-diff-${d}`}
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
                  data-testid={`fm-topic-${k}`}
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
            data-testid="fm-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="fm-record">
          <h3>
            <BarChart3 size={18} /> {t('menu.stats')}
          </h3>
          <dl className={styles.stats}>
            <div>
              <dt>{t('stats.boards')}</dt>
              <dd>{r.boards}</dd>
            </div>
            <div>
              <dt>{t('stats.average')}</dt>
              <dd>{r.boards ? Math.round(r.sum / r.boards) : '—'}</dd>
            </div>
            <div>
              <dt>{t('stats.perfect')}</dt>
              <dd>{r.perfect}</dd>
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
