/**
 * Number Line screens: menu (daily, endless by topic and difficulty, resume, record), the board
 * (indicator, year, the line with references and pins, the three mystery countries), the reveal
 * (true positions, points, source) and results.
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
import { valueOf } from '../plot-the-point/engine';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import { INDICATOR_BY_CODE } from '../shared/stats/indicators';
import { entityAt, formatValue, loadStats, type StatsData } from '../shared/stats/stats';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  allPlaced,
  boardScore,
  current,
  dayNumber,
  DIFFICULTIES,
  finish,
  isSession,
  lock,
  newDaily,
  newEndless,
  next,
  place,
  positionOf,
  shareText,
  TOPICS,
  truePosition,
  valueAt,
  type Difficulty,
  type Session,
  type Topic,
} from './engine';
import { STRINGS } from './i18n';
import { Line } from './Line';
import styles from './NumberLine.module.css';
import { SOUNDS } from './sounds';

interface Tally {
  boards: number;
  sum: number;
  sharp: number;
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
  record: { boards: 0, sum: 0, sharp: 0 },
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
const LETTERS = 'ABC';
const grade = (n: number) => (n >= 80 ? 3 : n >= 50 ? 2 : n >= 25 ? 1 : 0);

export function NumberLineGame({ services }: GameProps) {
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
  const [selected, setSelected] = useState(0);
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
  // Entering play focuses the board so the keys work at once.
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
      <p className={styles.loading} data-testid="nl-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    sessionRef.current = s;
    setSelected(
      Math.max(
        0,
        current(s).placed.findIndex((p) => p === null),
      ),
    );
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
        <div className={shared.menuCard} data-testid="nl-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="nl-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <ol className={styles.roundList}>
            {session.boards
              .filter((b) => b.points)
              .map((b, i) => (
                <li key={i} data-grade={grade(boardScore(b)!)}>
                  <span>
                    <strong>{INDICATOR_BY_CODE.get(b.code)!.title[lang]}</strong>
                    <small>
                      {b.year} · {b.targets.map(name).join(', ')}
                    </small>
                  </span>
                  <b>{boardScore(b)}</b>
                </li>
              ))}
          </ol>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() => copy(shareText(session, t('title')))}
              data-testid="nl-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="nl-again"
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
              data-testid="nl-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const b = current(session);
  const ind = INDICATOR_BY_CODE.get(b.code)!;
  const locked = b.points !== null;
  const fmt = (v: number) => formatValue(v, ind, locale, true);
  const value = (e: number) => valueOf(data, b.code, e, b.year)!;

  const onPlace = (i: number, p: number) => {
    const s0 = sessionRef.current!;
    if (current(s0).points) return;
    const s = place(s0, i, p);
    setSession(s);
    sessionRef.current = s;
    persist({ session: s });
  };
  const onLock = () => {
    const s0 = sessionRef.current!;
    if (current(s0).points || !allPlaced(current(s0))) return;
    const s = lock(s0, data);
    const nb = current(s);
    const sc = boardScore(nb)!;
    const svc = servicesRef.current;
    svc.playSound(sc >= 80 ? SOUNDS.great! : sc >= 50 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const sharpNow = nb.points!.filter((p) => p >= 90).length;
    const record: Tally = {
      boards: rec.boards + 1,
      sum: rec.sum + sc,
      sharp: rec.sharp + sharpNow,
    };
    svc.unlockAchievement('first-line');
    if (nb.points!.every((p) => p >= 90)) svc.unlockAchievement('bullseye');
    if (record.sharp >= 25) svc.unlockAchievement('sharpshooter');
    const seen = [...savedRef.current.seen.filter((k) => k !== nb.code), nb.code].slice(-20);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (s.total >= 400) svc.unlockAchievement('statistician');
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
    // A focused pin handles its own arrows; do not move a second pin as the key bubbles up.
    if (locked || e.defaultPrevented) return;
    const n = Number(e.key);
    const cur = b.placed[selected] ?? null;
    const step = e.shiftKey ? 0.05 : 0.005;
    if (Number.isInteger(n) && n >= 1 && n <= 3) setSelected(n - 1);
    else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') onLock();
    // Arrows move the selected country's pin (dropping it in the middle first if it is not placed).
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
      onPlace(selected, cur === null ? 0.5 : Math.max(0, cur - step));
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
      onPlace(selected, cur === null ? 0.5 : Math.min(1, cur + step));
    else if (e.key === 'Home') onPlace(selected, 0);
    else if (e.key === 'End') onPlace(selected, 1);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      data-testid="nl-play"
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
        <span data-testid="nl-round">
          {session.limit
            ? t('play.board', { n: session.count + (locked ? 0 : 1), of: session.limit })
            : t('play.boardN', { n: session.count + (locked ? 0 : 1) })}
        </span>
        <span data-testid="nl-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div>
          <span className={styles.kind}>{t(`topic.${ind.topic}`)}</span>
          <h3 className={styles.name} data-testid="nl-title">
            {ind.title[lang]}{' '}
            <span className={styles.year}>{t('play.year', { year: b.year })}</span>
          </h3>
          <p className={styles.unit}>
            {ind.unit[lang] ? `${ind.unit[lang]} · ` : ''}
            {b.axis.log ? t('play.log') : t('play.linear')}
          </p>
        </div>
        <Line
          axis={b.axis}
          format={fmt}
          refs={b.refs.map((e) => ({
            position: positionOf(b.axis, value(e)),
            label: name(e),
            value: fmt(value(e)),
          }))}
          pins={b.targets.map((e, i) => ({
            position: b.placed[i]!,
            letter: LETTERS[i]!,
            label: name(e),
            truth: locked ? truePosition(data, b, i) : null,
            truthLabel: `${LETTERS[i]} ${fmt(value(e))}`,
          }))}
          selected={selected}
          onSelect={setSelected}
          onPlace={onPlace}
          locked={locked}
          label={t('play.line', { indicator: ind.title[lang] })}
          pinLabel={(i) => t('play.place', { name: name(b.targets[i]!) })}
        />
        <ol className={styles.targets} data-testid="nl-targets">
          {b.targets.map((e, i) => (
            <li key={e} data-pin={i}>
              <button
                type="button"
                className={styles.target}
                aria-pressed={selected === i}
                disabled={locked}
                onClick={() => setSelected(i)}
                data-testid={`nl-target-${i}`}
              >
                <b className={styles.letter} data-pin={i}>
                  {LETTERS[i]}
                </b>
                <span>{name(e)}</span>
              </button>
              <span className={styles.targetValue} data-testid={`nl-value-${i}`}>
                {locked ? (
                  <>
                    <strong>{b.points![i]}</strong> ·{' '}
                    {t('reveal.yours', { value: fmt(valueAt(b.axis, b.placed[i]!)) })} ·{' '}
                    {t('reveal.actual', { value: fmt(value(e)) })}
                  </>
                ) : b.placed[i] === null ? (
                  t('play.unplaced')
                ) : (
                  fmt(valueAt(b.axis, b.placed[i]!))
                )}
              </span>
            </li>
          ))}
        </ol>
        {!locked && (
          <>
            <p className={styles.keys}>
              {t('play.pick')} {t('play.keys')}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!allPlaced(b)}
                onClick={onLock}
                data-testid="nl-lock"
              >
                <Lock size={16} /> {t('play.lock')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="nl-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
        )}
        {locked && (
          <div className={styles.reveal} data-testid="nl-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(boardScore(b)!)}>
                <small>{t('reveal.points')}</small>
                <strong data-testid="nl-score">
                  <CountUp to={boardScore(b)!} instant={services.reducedMotion} />
                </strong>
              </div>
              <p className={styles.facts}>{t('reveal.board')}</p>
            </div>
            <a
              className={styles.source}
              href={`https://data.worldbank.org/indicator/${b.code}`}
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
                data-testid="nl-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="nl-end">
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
      <div className={shared.menuCard} data-testid="nl-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="nl-resume"
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
              <strong data-testid="nl-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="nl-daily"
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
                  data-testid={`nl-diff-${d}`}
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
                  data-testid={`nl-topic-${k}`}
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
            data-testid="nl-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="nl-record">
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
              <dt>{t('stats.sharp')}</dt>
              <dd>{r.sharp}</dd>
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
