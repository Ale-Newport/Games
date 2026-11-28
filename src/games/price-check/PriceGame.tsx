/**
 * Price Check screens: menu (daily, endless with difficulty, category and rule, resume, record),
 * play (item card with photo or illustration, year, description; price box with dial, slider and
 * typing), reveal (price, ratio, today's money, sources and photo credit) and results.
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Infinity as InfinityIcon,
  Lock,
  Minus,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { parseNumber } from '../order-of-magnitude/OrderOfMagnitudeGame';
import { CountUp, dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { CategoryArt } from './CategoryArt';
import {
  current,
  dayNumber,
  DIFFICULTIES,
  finish,
  guess,
  inToday,
  isSession,
  itemAt,
  newDaily,
  newEndless,
  next,
  RULES,
  scale,
  shareText,
  TOPICS,
  type Currency,
  type Difficulty,
  type PriceData,
  type Rule,
  type Session,
  type Topic,
} from './engine';
import { STRINGS } from './i18n';
import styles from './PriceCheck.module.css';
import { SOUNDS } from './sounds';

type Credits = Record<
  string,
  { file: string; page: string; artist: string; license: string; licenseUrl: string }
>;
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
  topic: Topic;
  rule: Rule;
  record: Tally;
}
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  topic: 'all',
  rule: 'closest',
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
    TOPICS.includes(s.topic) &&
    RULES.includes(s.rule) &&
    typeof s.record?.rounds === 'number'
  );
};

const IMAGES = import.meta.glob<string>('./images/*.jpg', { query: '?url', import: 'default' });
const loadData = () =>
  Promise.all([import('./items.json'), import('./credits.json')]).then(([i, c]) => ({
    data: i.default as unknown as PriceData,
    credits: c.default as unknown as Credits,
  }));
const grade = (n: number) => (n >= 90 ? 3 : n >= 65 ? 2 : n >= 35 ? 1 : 0);

export function money(v: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency,
    maximumSignificantDigits: v >= 1000 ? 4 : 3,
  }).format(v);
}

function Photo({ id, fallback }: { id: string; fallback: ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const load = IMAGES[`./images/${id}.jpg`];
    if (!load) return;
    let alive = true;
    void load().then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id]);
  return url ? (
    <img src={url} alt="" className={styles.photo} data-testid="pc-photo" />
  ) : (
    <>{fallback}</>
  );
}

export function PriceGame({ services }: GameProps) {
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
  if (!asset.value || !loaded)
    return (
      <p className={styles.loading} data-testid="pc-loading">
        {t('loading')}
      </p>
    );
  const { data, credits } = asset.value;

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
    begin(newDaily(data, today));
  };
  const startEndless = () => {
    const { difficulty, topic, rule, seen } = savedRef.current;
    begin(newEndless(data, seedFor(), difficulty, topic, rule, new Set(seen)));
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
        <div className={shared.menuCard} data-testid="pc-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="pc-final">
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
              const it = itemAt(data, r.item);
              return (
                <li key={i} data-grade={grade(r.score ?? 0)}>
                  <span>
                    <strong>{it.name[lang]}</strong>
                    <small>
                      {it.year} · {money(it.price, it.currency, locale)}
                      {r.guess !== null && ` · ${money(r.guess, it.currency, locale)}`}
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
              data-testid="pc-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="pc-again"
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
              data-testid="pc-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const round = current(session);
  const it = itemAt(data, round.item);
  const sc = scale(data, it);
  const revealed = round.guess !== null;
  const value = draft ?? Math.pow(10, (sc[0] + sc[1]) / 2);
  const clampV = (v: number) => Math.min(Math.pow(10, sc[1]), Math.max(Math.pow(10, sc[0]), v));
  const credit = credits[it.id];
  const todayMoney = inToday(data, it);

  const lock = () => {
    if (revealed) return;
    let v = value;
    if (typed.trim()) {
      const parsed = parseNumber(typed.replace(/[^\d.,eE-]/g, ''), locale);
      const l = parsed === null ? NaN : Math.log10(parsed);
      if (parsed === null || !(l >= sc[0] && l <= sc[1])) {
        setInvalid(true);
        return;
      }
      v = parsed;
    }
    const s = guess(session, data, v);
    const r = current(s);
    const svc = servicesRef.current;
    svc.playSound(r.score! >= 85 ? SOUNDS.great! : r.score! > 0 ? SOUNDS.good! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + r.score!,
      exact: rec.exact + (r.score === 100 ? 1 : 0),
    };
    svc.unlockAchievement('first-price');
    if (r.score === 100) svc.unlockAchievement('spot-on');
    if (it.category === 'art' && r.score! >= 70) svc.unlockAchievement('auctioneer');
    if (s.rule === 'under' && r.score! >= 90) svc.unlockAchievement('just-under');
    const seen = [...savedRef.current.seen.filter((x) => x !== r.item), r.item].slice(-800);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.rule}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    setSession(s);
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
        mode: `endless:${s.rule}`,
      });
    setSession(s);
    persist({ session: null });
    setView(s.count > 0 ? 'results' : 'menu');
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (revealed || (e.target as HTMLElement).tagName === 'INPUT') return;
    const f = e.shiftKey ? 1.5 : 1.05;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setDraft(clampV(value * f));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setDraft(clampV(value / f));
    else if (e.key === 'Enter') lock();
    else return;
    e.preventDefault();
  };
  const ratio = revealed ? Math.max(round.guess! / it.price, it.price / round.guess!) : 1;
  const nf = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 1,
  });

  return (
    <div className={styles.wrap} data-testid="pc-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', {
                difficulty: t(`diff.${session.difficulty}`),
                topic: session.topic === 'all' ? t('topic.all') : t(`cat.${session.topic}`),
              })}
        </span>
        <span data-testid="pc-round">
          {session.limit
            ? t('play.item', { n: session.count + (revealed ? 0 : 1), of: session.limit })
            : t('play.itemN', { n: session.count + (revealed ? 0 : 1) })}
        </span>
        <span data-testid="pc-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.item}>
          <div className={styles.picture}>
            <Photo
              key={it.id}
              id={it.id}
              fallback={<CategoryArt category={it.category} label={t(`cat.${it.category}`)} />}
            />
          </div>
          <div className={styles.info}>
            <span className={styles.kind}>{t(`cat.${it.category}`)}</span>
            <h3 className={styles.name} data-testid="pc-name">
              {it.name[lang]}
            </h3>
            {it.description[lang] && <p className={styles.desc}>{it.description[lang]}</p>}
            <p className={styles.question} data-testid="pc-question">
              {t('play.question', { year: it.year })}
            </p>
            <p className={styles.unit}>
              {t('play.currency', { currency: it.currency })}
              {session.rule === 'under' && <b className={styles.under}> · {t('play.under')}</b>}
            </p>
          </div>
        </div>

        {!revealed ? (
          <div className={styles.answerBox} tabIndex={0} onKeyDown={key} data-testid="pc-answer">
            <p className={styles.small}>{t('play.guess')}</p>
            <div className={styles.dial}>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(clampV(value / 1.5))}
                aria-label="÷1.5"
                data-testid="pc-down"
              >
                <Minus size={16} />
              </button>
              <strong data-testid="pc-value">{money(value, it.currency, locale)}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(clampV(value * 1.5))}
                aria-label="×1.5"
                data-testid="pc-up"
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
              aria-label={t('play.guess')}
              className={styles.slider}
              data-testid="pc-slider"
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
                    lock();
                  }
                }}
                data-testid="pc-typed"
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
                onClick={lock}
                data-testid="pc-lock"
              >
                <Lock size={16} /> {t('play.lock')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="pc-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.reveal} data-testid="pc-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(round.score!)}>
                <small>
                  {round.score === 0 && round.guess! > it.price
                    ? t('reveal.over')
                    : t('reveal.score')}
                </small>
                <strong data-testid="pc-score">
                  <CountUp to={round.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p data-testid="pc-price">
                  <b>{t('reveal.price', { price: money(it.price, it.currency, locale) })}</b>
                </p>
                <p>
                  {ratio < 1.02
                    ? t('reveal.exact')
                    : t('reveal.off', {
                        x: nf.format(ratio),
                        dir: round.guess! > it.price ? t('reveal.high') : t('reveal.low'),
                      })}
                </p>
                {todayMoney && todayMoney.year > it.year && (
                  <p data-testid="pc-today">
                    {t('reveal.today', {
                      value: money(todayMoney.value, it.currency, locale),
                      year: todayMoney.year,
                      area: data.cpi[it.currency]?.area ?? '',
                    })}
                  </p>
                )}
              </div>
            </div>
            <p className={styles.source}>
              <a href={`https://www.wikidata.org/wiki/${it.id}`} target="_blank" rel="noreferrer">
                {t('reveal.source', { id: it.id })}
              </a>
              {credit && (
                <>
                  {' · '}
                  <a href={credit.page} target="_blank" rel="noreferrer" data-testid="pc-credit">
                    {t('reveal.photo', { artist: credit.artist, license: credit.license })}
                  </a>
                </>
              )}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                onClick={onNext}
                data-testid="pc-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="pc-end">
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
      <div className={shared.menuCard} data-testid="pc-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="pc-resume"
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
              <strong data-testid="pc-daily-done">{t('menu.dailyDone', { score: done })}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => onShare(`${t('title')} #${today + 1} — ${done}/600`)}
              >
                <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDaily}
              data-testid="pc-daily"
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
            <legend>{t('menu.rule')}</legend>
            <div className={shared.segmented}>
              {RULES.map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={saved.rule === x}
                  onClick={() => onPick({ rule: x })}
                  data-testid={`pc-rule-${x}`}
                >
                  {t(`rule.${x}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`rule.${saved.rule}.hint`)}</p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.difficulty')}</legend>
            <div className={shared.segmented}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={saved.difficulty === d}
                  onClick={() => onPick({ difficulty: d })}
                  data-testid={`pc-diff-${d}`}
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
                  data-testid={`pc-topic-${k}`}
                >
                  {k === 'all' ? t('topic.all') : t(`cat.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEndless}
            data-testid="pc-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="pc-record">
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
