/**
 * One-Star Landmarks screens: menu (daily, endless by difficulty and region, resume, record),
 * play (the review card, the name search, hints for wrong guesses with distance and direction,
 * the map), reveal (the place, its country, points, source) and results.
 */
import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  Copy,
  Flag,
  Infinity as InfinityIcon,
  Play,
  RotateCcw,
  Star,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  awaiting,
  current,
  dayNumber,
  DIFFICULTIES,
  finish,
  giveUp,
  guess,
  hintFor,
  isSession,
  linesShown,
  MAX_GUESSES,
  newDaily,
  newEndless,
  next,
  placeAt,
  POINTS,
  REGION_FILTERS,
  search,
  shareText,
  type Difficulty,
  type PlaceRow,
  type RegionFilter,
  type Session,
} from './engine';
import { REVIEWERS, STRINGS } from './i18n';
import styles from './OneStar.module.css';
import { PlaceMap } from './PlaceMap';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  found: number;
  first: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: number[];
  difficulty: Difficulty;
  region: RegionFilter;
  record: Tally;
}
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  region: 'all',
  record: { rounds: 0, found: 0, first: 0 },
};
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.session === null || isSession(s.session)) &&
    typeof s.daily === 'object' &&
    Array.isArray(s.seen) &&
    DIFFICULTIES.includes(s.difficulty) &&
    REGION_FILTERS.includes(s.region) &&
    typeof s.record?.rounds === 'number'
  );
};
const loadData = () => import('./landmarks.json').then((m) => m.default as unknown as PlaceRow[]);
const grade = (n: number) => (n >= 75 ? 3 : n >= 50 ? 2 : n > 0 ? 1 : 0);
const ANGLE = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 } as const;

export function OneStarGame({ services }: GameProps) {
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
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const [warn, setWarn] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const listId = useId();
  const today = dayNumber();
  const km = useMemo(() => new Intl.NumberFormat(locale), [locale]);

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
      <p className={styles.loading} data-testid="os-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    setText('');
    setActive(0);
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
    const { difficulty, region, seen } = savedRef.current;
    begin(newEndless(data, seedFor(), difficulty, region, new Set(seen)));
  };
  const copy = (s: string) =>
    void navigator.clipboard?.writeText(s).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  const nameOf = (i: number) => data[i]![lang === 'es' ? 2 : 1];

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
        <div className={shared.menuCard} data-testid="os-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="os-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <p className={shared.hintText}>
            {t('results.found', {
              n: session.rounds.filter((r) => r.status === 'won').length,
              of: session.count,
            })}
          </p>
          <ol className={styles.roundList}>
            {session.rounds
              .filter((r) => r.status !== 'playing')
              .map((r, i) => (
                <li key={i} data-grade={grade(r.score ?? 0)}>
                  <span>
                    <strong>{nameOf(r.target)}</strong>
                    <small>
                      {r.status === 'won'
                        ? t('results.guesses', { n: r.guesses.length })
                        : t('results.missed')}
                    </small>
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
              data-testid="os-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="os-again"
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
              data-testid="os-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const r = current(session);
  const p = placeAt(data, r.target);
  const over = r.status !== 'playing';
  const misses = r.guesses.filter((g) => g !== r.target);
  const shown = over ? 3 : linesShown(misses.length);
  const hints = misses.map((g) => hintFor(data, g, r.target));
  const results = over ? [] : search(data, text, new Set(r.guesses));
  const reviewer = REVIEWERS[lang][r.target % REVIEWERS[lang].length]!;

  const settle = (s: Session) => {
    const nr = current(s);
    const svc = servicesRef.current;
    svc.playSound(
      nr.status === 'won' ? (nr.guesses.length === 1 ? SOUNDS.great! : SOUNDS.good!) : SOUNDS.poor!,
    );
    const rec = savedRef.current.record;
    const won = nr.status === 'won';
    const record: Tally = {
      rounds: rec.rounds + 1,
      found: rec.found + (won ? 1 : 0),
      first: rec.first + (won && nr.guesses.length === 1 ? 1 : 0),
    };
    if (won) svc.unlockAchievement('first-find');
    if (won && nr.guesses.length === 1) svc.unlockAchievement('first-guess');
    if (won && nr.guesses.length === MAX_GUESSES) svc.unlockAchievement('last-chance');
    if (record.found >= 50) svc.unlockAchievement('globetrotter');
    const seen = [...savedRef.current.seen.filter((k) => k !== nr.target), nr.target].slice(-100);
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
    setText('');
    setActive(0);
    setWarn(false);
    if (current(s).status !== 'playing') settle(s);
    else {
      servicesRef.current.playSound(SOUNDS.miss!);
      persist({ session: s });
    }
  };
  const tryPlace = (i: number | undefined) => {
    if (!awaiting(session)) return;
    if (i === undefined) {
      setWarn(true);
      return;
    }
    apply(guess(session, data, i));
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') setActive((a) => Math.min(results.length - 1, a + 1));
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1));
    else if (e.key === 'Enter') tryPlace(results[Math.min(active, results.length - 1)]);
    else if (e.key === 'Escape') setText('');
    else return;
    e.preventDefault();
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
    <div className={styles.wrap} data-testid="os-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                region: t(`region.${session.region}`),
              })}
        </span>
        <span data-testid="os-round">
          {session.limit
            ? t('play.round', { n: session.count + (over ? 0 : 1), of: session.limit })
            : t('play.roundN', { n: session.count + (over ? 0 : 1) })}
        </span>
        <span data-testid="os-total">{t('play.total', { n: session.total })}</span>
      </div>

      <article className={styles.review} data-testid="os-review">
        <header className={styles.reviewHead}>
          <span className={styles.avatar} aria-hidden>
            {reviewer.charAt(0)}
          </span>
          <span>
            <b>{t('review.by', { name: reviewer })}</b>
            <span className={styles.stars} role="img" aria-label={t('review.stars')}>
              {[0, 1, 2, 3, 4].map((k) => (
                <Star
                  key={k}
                  size={16}
                  className={k === 0 ? styles.starOn : styles.starOff}
                  aria-hidden
                />
              ))}
            </span>
          </span>
        </header>
        {p.review[lang].slice(0, shown).map((line, i) => (
          <p key={i} className={styles.line} data-testid={`os-line-${i}`}>
            {line}
          </p>
        ))}
        {shown < 3 && <p className={styles.more}>{t('review.more')}</p>}
      </article>

      {hints.length > 0 && (
        <ol className={styles.hints} data-testid="os-hints">
          {hints.map((h, i) => (
            <li key={i} data-testid={`os-hint-${i}`}>
              <span className={styles.hintName}>
                <b>{i + 1}</b> {nameOf(h.guess)}
              </span>
              <span className={styles.hintDist}>
                <ArrowUp
                  size={16}
                  style={{ transform: `rotate(${ANGLE[h.compass]}deg)` }}
                  aria-hidden
                />{' '}
                {t('hint.away', { km: km.format(h.km), dir: t(`dir.${h.compass}`) })}
              </span>
              <span className={styles.meter} style={{ ['--close' as string]: `${h.closeness}%` }}>
                {t('hint.close', { n: h.closeness })}
              </span>
            </li>
          ))}
        </ol>
      )}

      {over ? (
        <div className={styles.reveal} data-testid="os-reveal">
          <div className={styles.scoreRow}>
            <div className={styles.score} data-grade={grade(r.score!)}>
              <small>{t('reveal.points')}</small>
              <strong data-testid="os-score">
                <CountUp to={r.score!} instant={services.reducedMotion} />
              </strong>
            </div>
            <div className={styles.facts}>
              <p>
                {r.status === 'won' ? t('reveal.won', { n: r.guesses.length }) : t('reveal.lost')}
              </p>
              <p className={styles.answer} data-testid="os-answer">
                {p.name[lang]}
              </p>
              <p>{t('reveal.in', { country: p.review.country[lang === 'es' ? 1 : 0] })}</p>
            </div>
          </div>
          <a
            className={styles.source}
            href={`https://www.wikidata.org/wiki/${p.qid}`}
            target="_blank"
            rel="noreferrer"
          >
            {t('reveal.source', { id: p.qid })}
          </a>
          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-primary"
              autoFocus
              onClick={onNext}
              data-testid="os-next"
            >
              {session.status === 'done' ? t('play.results') : t('play.next')}
            </button>
            {session.mode === 'endless' && (
              <button type="button" className="btn" onClick={onEnd} data-testid="os-end">
                {t('play.end')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.guessBox}>
          <label className={styles.small} htmlFor={`${listId}-input`}>
            {t('play.input')}{' '}
            <span>
              {t('play.guesses', {
                n: r.guesses.length + 1,
                of: MAX_GUESSES,
                pts: POINTS[r.guesses.length]!,
              })}
            </span>
          </label>
          <div className={styles.combo}>
            <input
              id={`${listId}-input`}
              type="text"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={`${listId}-list`}
              aria-activedescendant={
                results.length ? `${listId}-opt-${Math.min(active, results.length - 1)}` : undefined
              }
              aria-autocomplete="list"
              autoComplete="off"
              placeholder={t('play.placeholder')}
              value={text}
              autoFocus={r.guesses.length > 0}
              onChange={(e) => {
                setText(e.target.value);
                setActive(0);
                setWarn(false);
              }}
              onKeyDown={onKey}
              data-testid="os-input"
            />
            {text.trim() && (
              <ul
                id={`${listId}-list`}
                role="listbox"
                className={styles.options}
                data-testid="os-options"
              >
                {results.length ? (
                  results.map((i, k) => (
                    <li
                      key={i}
                      id={`${listId}-opt-${k}`}
                      role="option"
                      aria-selected={k === Math.min(active, results.length - 1)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => tryPlace(i)}
                      data-testid={`os-option-${k}`}
                    >
                      {nameOf(i)}
                    </li>
                  ))
                ) : (
                  <li className={styles.none}>{t('play.none')}</li>
                )}
              </ul>
            )}
          </div>
          {warn && (
            <p className={styles.warn} role="alert">
              {t('play.pick')}
            </p>
          )}
          <p className={styles.keys}>{t('play.keys')}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (!awaiting(session)) return;
                const s = giveUp(session);
                setSession(s);
                settle(s);
              }}
              data-testid="os-give-up"
            >
              <Flag size={16} /> {t('play.giveUp')}
            </button>
            {session.mode === 'endless' && (
              <button type="button" className="btn" onClick={onEnd} data-testid="os-end">
                {t('play.end')}
              </button>
            )}
          </div>
        </div>
      )}

      {(hints.length > 0 || over) && (
        <PlaceMap
          label={t('map.label')}
          pins={misses.map((g, i) => ({
            lat: data[g]![3],
            lon: data[g]![4],
            label: String(i + 1),
          }))}
          answer={over ? { lat: p.lat, lon: p.lon, label: '★' } : null}
        />
      )}
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
      <div className={shared.menuCard} data-testid="os-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="os-resume"
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
              <strong data-testid="os-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="os-daily"
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
                  data-testid={`os-diff-${d}`}
                >
                  {t(`diff.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`diff.${saved.difficulty}.hint`)}</p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.region')}</legend>
            <div className={styles.chips}>
              {REGION_FILTERS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="chip"
                  aria-pressed={saved.region === k}
                  onClick={() => onPick({ region: k })}
                  data-testid={`os-region-${k}`}
                >
                  {t(`region.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEndless}
            data-testid="os-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="os-record">
          <h3>
            <BarChart3 size={18} /> {t('menu.stats')}
          </h3>
          <dl className={styles.stats}>
            <div>
              <dt>{t('stats.rounds')}</dt>
              <dd>{r.rounds}</dd>
            </div>
            <div>
              <dt>{t('stats.found')}</dt>
              <dd>{r.found}</dd>
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
