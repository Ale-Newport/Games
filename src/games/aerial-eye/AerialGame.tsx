/**
 * Aerial Eye screens: menu (daily, endless by kind and difficulty, resume, record), play (the
 * photo, zoomed on its centre, and six options of the same kind), reveal (the whole photo, the
 * place and its country, a map, the photo's credit) and results.
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Infinity as InfinityIcon,
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
import { PlaceMap } from '../one-star-landmarks/PlaceMap';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import styles from './AerialEye.module.css';
import {
  awaiting,
  CATEGORY_FILTERS,
  current,
  dayNumber,
  DIFFICULTIES,
  finish,
  isSession,
  newDaily,
  newEndless,
  next,
  pick,
  PICKS,
  placeAt,
  POINTS,
  shareText,
  zoomOf,
  type CategoryFilter,
  type Difficulty,
  type PlaceRow,
  type Session,
} from './engine';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';

interface Credit {
  file: string;
  page: string;
  artist: string;
  license: string;
  licenseUrl: string;
}
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
  category: CategoryFilter;
  record: Tally;
}
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  category: 'all',
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
    CATEGORY_FILTERS.includes(s.category) &&
    typeof s.record?.rounds === 'number'
  );
};
const IMAGES = import.meta.glob<string>('./images/*.jpg', { query: '?url', import: 'default' });
const loadData = () =>
  Promise.all([import('./places.json'), import('./credits.json')]).then(([p, c]) => ({
    data: p.default as unknown as PlaceRow[],
    credits: c.default as unknown as Record<string, Credit>,
  }));
const grade = (n: number) => (n >= 100 ? 3 : n >= 50 ? 2 : n > 0 ? 1 : 0);

function Photo({ qid, zoom, label }: { qid: string; zoom: number; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const load = IMAGES[`./images/${qid}.jpg`];
    if (!load) return;
    let alive = true;
    void load().then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [qid]);
  return (
    <div className={styles.frame} data-testid="ae-frame">
      {url ? (
        <img
          src={url}
          alt={label}
          className={styles.photo}
          style={{ transform: `scale(${zoom})` }}
          data-zoom={zoom}
          data-testid="ae-photo"
        />
      ) : (
        <div className={styles.photoLoading} aria-hidden>
          …
        </div>
      )}
    </div>
  );
}

export function AerialGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadData);
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
  // The board keeps keyboard focus: a struck option is disabled, which would drop focus to the page.
  const wrapRef = useRef<HTMLDivElement>(null);
  const refocus = () =>
    requestAnimationFrame(() => wrapRef.current?.focus({ preventScroll: true }));
  // Entering play focuses the board so 1–6 work at once (autoFocus only applies to form controls).
  useEffect(() => {
    if (view === 'play') wrapRef.current?.focus({ preventScroll: true });
  }, [view]);
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
  if (!asset.value || !loaded)
    return (
      <p className={styles.loading} data-testid="ae-loading">
        {t('loading')}
      </p>
    );
  const { data, credits } = asset.value;

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
    const { difficulty, category, seen } = savedRef.current;
    begin(newEndless(data, seedFor(), difficulty, category, new Set(seen)));
  };
  const copy = (text: string) =>
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  const nameOf = (i: number) => data[i]![lang === 'es' ? 3 : 2];

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
        <div className={shared.menuCard} data-testid="ae-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="ae-final">
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
                      {t(`cat.${data[r.target]![1]}`)} ·{' '}
                      {r.status === 'won'
                        ? t('results.picks', { n: r.picks.length })
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
              data-testid="ae-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="ae-again"
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
              data-testid="ae-menu-btn"
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
  const zoom = zoomOf(r);
  const credit = credits[p.qid];
  const lastWrong = !over && r.picks.length ? r.picks[r.picks.length - 1]! : null;

  const onPick = (place: number) => {
    const s0 = sessionRef.current!;
    if (!awaiting(s0) || current(s0).picks.includes(place)) return;
    const s = pick(s0, place);
    const nr = current(s);
    const svc = servicesRef.current;
    setSession(s);
    sessionRef.current = s;
    if (nr.status === 'playing') {
      svc.playSound(SOUNDS.miss!);
      refocus();
      return persist({ session: s });
    }
    svc.playSound(
      nr.status === 'won' ? (nr.picks.length === 1 ? SOUNDS.great! : SOUNDS.good!) : SOUNDS.poor!,
    );
    const rec = savedRef.current.record;
    const won = nr.status === 'won';
    const record: Tally = {
      rounds: rec.rounds + 1,
      found: rec.found + (won ? 1 : 0),
      first: rec.first + (won && nr.picks.length === 1 ? 1 : 0),
    };
    if (won) svc.unlockAchievement('first-spot');
    if (record.first >= 10) svc.unlockAchievement('eagle-eye');
    const seen = [...savedRef.current.seen.filter((k) => k !== nr.target), nr.target].slice(-150);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.difficulty}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (s.total === 500) svc.unlockAchievement('analyst');
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
      const kinds = new Set(
        s.rounds.filter((x) => x.status === 'won').map((x) => data[x.target]![1]),
      );
      if (kinds.size >= 5) svc.unlockAchievement('all-rounder');
    }
    persist({ session: s, record, seen, daily });
  };
  const onNext = () => {
    if (session.status === 'done') return setView('results');
    begin(next(session, data, new Set(savedRef.current.seen)));
    refocus();
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
    const n = Number(e.key);
    if (over || !Number.isInteger(n) || n < 1 || n > r.options.length) return;
    e.preventDefault();
    onPick(r.options[n - 1]!);
  };

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      data-testid="ae-play"
      tabIndex={-1}
      onKeyDown={onKey}
    >
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                category: t(`cat.${session.category}`),
              })}
        </span>
        <span data-testid="ae-round">
          {session.limit
            ? t('play.round', { n: session.count + (over ? 0 : 1), of: session.limit })
            : t('play.roundN', { n: session.count + (over ? 0 : 1) })}
        </span>
        <span data-testid="ae-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.kind}>{t(`cat.${p.category}`)}</span>
          <h3 className={styles.name} data-testid="ae-question">
            {t(`q.${p.category}`)}
          </h3>
        </div>
        <Photo qid={p.qid} zoom={zoom} label={over ? p.name[lang] : t('play.photo')} />
        {!over && (
          <p className={styles.small} data-testid="ae-status">
            {t('play.zoom', { z: zoom.toLocaleString(locale) })} ·{' '}
            {t('play.picks', { n: r.picks.length + 1, of: PICKS, pts: POINTS[r.picks.length]! })}
          </p>
        )}
        {lastWrong !== null && (
          <p className={styles.warn} role="status" data-testid="ae-wrong">
            {t('play.wrong', { name: nameOf(lastWrong) })}
          </p>
        )}
        <div className={styles.options} data-testid="ae-options">
          {r.options.map((o, i) => {
            const struck = r.picks.includes(o) && o !== r.target;
            const right = over && o === r.target;
            return (
              <button
                key={o}
                type="button"
                className={styles.option}
                data-struck={struck}
                data-right={right}
                disabled={over || struck}
                onClick={() => onPick(o)}
                data-testid={`ae-option-${i}`}
              >
                <small>{i + 1}</small> {nameOf(o)}
              </button>
            );
          })}
        </div>
        {!over && <p className={styles.keys}>{t('play.keys')}</p>}

        {over && (
          <div className={styles.reveal} data-testid="ae-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(r.score!)}>
                <small>{t('reveal.points')}</small>
                <strong data-testid="ae-score">
                  <CountUp to={r.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p>
                  {r.status === 'won' ? t('reveal.won', { n: r.picks.length }) : t('reveal.lost')}
                </p>
                <p className={styles.answer} data-testid="ae-answer">
                  {p.name[lang]}
                </p>
                <p>{t('reveal.in', { country: p.country[lang] })}</p>
              </div>
            </div>
            <PlaceMap
              label={t('map.label')}
              pins={[]}
              answer={{ lat: p.lat, lon: p.lon, label: '★' }}
            />
            {credit && (
              <a
                className={styles.source}
                href={credit.page}
                target="_blank"
                rel="noreferrer"
                data-testid="ae-credit"
              >
                {t('reveal.photo', { artist: credit.artist, license: credit.license })}
              </a>
            )}
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
                data-testid="ae-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="ae-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        )}
        {!over && session.mode === 'endless' && (
          <div className={styles.actions}>
            <button type="button" className="btn" onClick={onEnd} data-testid="ae-end">
              {t('play.end')}
            </button>
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
      <div className={shared.menuCard} data-testid="ae-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="ae-resume"
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
              <strong data-testid="ae-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="ae-daily"
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
                  data-testid={`ae-diff-${d}`}
                >
                  {t(`diff.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`diff.${saved.difficulty}.hint`)}</p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.category')}</legend>
            <div className={styles.chips}>
              {CATEGORY_FILTERS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="chip"
                  aria-pressed={saved.category === k}
                  onClick={() => onPick({ category: k })}
                  data-testid={`ae-cat-${k}`}
                >
                  {t(`cat.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEndless}
            data-testid="ae-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="ae-record">
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
