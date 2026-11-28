/**
 * Plot the Point screens: menu (daily, endless by difficulty, resume, record), play (axes and
 * year, the scatter chart, the mystery-country chips, submit), reveal (true positions, points
 * per country, the computer's attempt, source) and results.
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Infinity as InfinityIcon,
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
import { loadStats, type StatsData } from '../shared/stats/stats';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  chartKey,
  countryName,
  current,
  dayNumber,
  DIFFICULTIES,
  finish,
  indicatorOf,
  isSession,
  layout,
  newDaily,
  newEndless,
  next,
  PAIRS,
  placementScore,
  shareText,
  submit,
  truth,
  valueOf,
  type Difficulty,
  type Session,
} from './engine';
import { STRINGS } from './i18n';
import { computerPlacements } from './neighbours';
import styles from './PlotThePoint.module.css';
import { ScatterChart } from './ScatterChart';
import { SOUNDS } from './sounds';

interface Tally {
  rounds: number;
  sum: number;
  best: number;
  beat: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: string[];
  difficulty: Difficulty;
  record: Tally;
}
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  difficulty: 'normal',
  record: { rounds: 0, sum: 0, best: 0, beat: 0 },
};
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.session === null || isSession(s.session)) &&
    typeof s.daily === 'object' &&
    Array.isArray(s.seen) &&
    DIFFICULTIES.includes(s.difficulty) &&
    typeof s.record?.rounds === 'number'
  );
};
const grade = (n: number) => (n >= 80 ? 3 : n >= 60 ? 2 : n >= 35 ? 1 : 0);

export function PlotGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadStats);
  const data = asset.value;
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'menu' | 'play' | 'results'>('menu');
  const [session, setSession] = useState<Session | null>(null);
  const [placed, setPlaced] = useState<([number, number] | null)[]>([]);
  const [active, setActive] = useState(0);
  const [warn, setWarn] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const placedRef = useLatest(placed);
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
      <p className={styles.loading} data-testid="pp-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    setPlaced(current(s).c.targets.map(() => null));
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
  const startEndless = () =>
    begin(newEndless(data, seedFor(), savedRef.current.difficulty, new Set(savedRef.current.seen)));
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
        <div className={shared.menuCard} data-testid="pp-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="pp-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <p className={shared.hintText}>
            {t('results.avg', { n: session.count ? Math.round(session.total / session.count) : 0 })}
          </p>
          <ol className={styles.roundList}>
            {session.rounds.map((r, i) => (
              <li key={i} data-grade={grade(r.score ?? 0)}>
                <span>
                  <strong>
                    {indicatorOf(PAIRS[r.c.pair]!.y).title[lang]} ×{' '}
                    {indicatorOf(PAIRS[r.c.pair]!.x).title[lang]}
                  </strong>
                  <small>
                    {r.c.year} · {r.c.targets.map((e) => countryName(data, e, lang)).join(', ')}
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
              data-testid="pp-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="pp-again"
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
              data-testid="pp-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const round = current(session);
  const c = round.c;
  const pair = PAIRS[c.pair]!;
  const l = layout(data, c);
  const revealed = round.guesses !== null;
  const shown = revealed ? round.guesses! : placed;
  const real = revealed ? truth(data, c) : null;
  const cpu = revealed ? computerPlacements(data, c) : null;
  const cpuScore =
    cpu && real
      ? Math.round(cpu.reduce((a, p, i) => a + placementScore(p, real[i]!), 0) / cpu.length)
      : 0;
  const name = (ent: number) => countryName(data as StatsData, ent, lang);
  // Label the six most populous visible countries as landmarks.
  const labelled = new Set(
    l.points
      .filter((p) => !c.targets.includes(p.ent))
      .map((p) => ({ ent: p.ent, pop: valueOf(data, 'SP.POP.TOTL', p.ent, c.year) ?? 0 }))
      .sort((a, b) => b.pop - a.pop)
      .slice(0, 6)
      .map((p) => p.ent),
  );

  const onSubmit = () => {
    if (revealed) return;
    const g = placedRef.current;
    if (g.some((p) => p === null)) {
      setWarn(true);
      return;
    }
    const s = submit(session, data, g as [number, number][]);
    const r = current(s);
    const svc = servicesRef.current;
    svc.playSound(r.score! >= 80 ? SOUNDS.great! : r.score! >= 45 ? SOUNDS.good! : SOUNDS.poor!);
    const realNow = truth(data, c);
    const cpuNow = computerPlacements(data, c);
    const cpuPts = Math.round(
      cpuNow.reduce((a, p, i) => a + placementScore(p, realNow[i]!), 0) / cpuNow.length,
    );
    const rec = savedRef.current.record;
    const record: Tally = {
      rounds: rec.rounds + 1,
      sum: rec.sum + r.score!,
      best: Math.max(rec.best, r.score!),
      beat: rec.beat + (r.score! > cpuPts ? 1 : 0),
    };
    svc.unlockAchievement('first-chart');
    if (r.scores!.some((x) => x >= 95)) svc.unlockAchievement('pinpoint');
    if (r.score! >= 85) svc.unlockAchievement('cartographer');
    if (record.beat >= 10) svc.unlockAchievement('beat-machine');
    const seen = [...savedRef.current.seen, chartKey(c)].slice(-1500);
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
        mode: `endless:${s.difficulty}`,
      });
    setSession(s);
    persist({ session: null });
    setView(s.count > 0 ? 'results' : 'menu');
  };

  return (
    <div className={styles.wrap} data-testid="pp-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', { difficulty: t(`diff.${session.difficulty}`) })}
        </span>
        <span data-testid="pp-round">
          {session.limit
            ? t('play.chart', { n: session.count + (revealed ? 0 : 1), of: session.limit })
            : t('play.chartN', { n: session.count + (revealed ? 0 : 1) })}
        </span>
        <span data-testid="pp-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <div className={styles.axes}>
          <p data-testid="pp-y">
            {t('play.yAxis', { title: indicatorOf(pair.y).title[lang] })}
            {pair.yLog && <small> · {t('play.log')}</small>}
          </p>
          <p data-testid="pp-x">
            {t('play.xAxis', { title: indicatorOf(pair.x).title[lang] })}
            {pair.xLog && <small> · {t('play.log')}</small>}
          </p>
          <p className={styles.year}>{t('play.year', { year: c.year })}</p>
        </div>
        <ScatterChart
          key={`${session.count}:${chartKey(c)}`}
          l={l}
          xCode={pair.x}
          yCode={pair.y}
          names={name}
          labelled={labelled}
          targets={c.targets}
          placed={shown}
          active={active}
          onActive={setActive}
          onPlace={(i, p) => {
            const n = placedRef.current.slice();
            n[i] = p;
            placedRef.current = n;
            setPlaced(n);
            setWarn(false);
          }}
          truth={real}
          computer={cpu}
          locale={locale}
          label={t('chart.aria')}
          onSubmit={onSubmit}
        />
        <div className={styles.chips} role="tablist">
          {c.targets.map((ent, i) => (
            <button
              key={ent}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`${styles.chip} ${styles[`t${i}`]}`}
              onClick={() => setActive(i)}
              disabled={revealed}
              data-placed={shown[i] !== null}
              data-testid={`pp-chip-${i}`}
            >
              <span className={styles.num}>{i + 1}</span>
              {name(ent)}
              {revealed && round.scores && <b data-testid={`pp-points-${i}`}>{round.scores[i]}</b>}
              {!revealed && shown[i] === null && <small>{t('play.unplaced')}</small>}
            </button>
          ))}
        </div>
        {!revealed ? (
          <>
            <p className={styles.hint}>{t('play.hint')}</p>
            <p className={styles.keys}>{t('play.keys')}</p>
            {warn && (
              <p className={styles.warn} role="alert" data-testid="pp-warn">
                {t('play.place')}
              </p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                data-testid="pp-submit"
              >
                {t('play.submit')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="pp-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.reveal} data-testid="pp-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(round.score!)}>
                <small>{t('reveal.score')}</small>
                <strong data-testid="pp-score">
                  <CountUp to={round.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p data-testid="pp-cpu">{t('reveal.cpu', { n: cpuScore })}</p>
                {round.score! > cpuScore && <p className={styles.beat}>{t('reveal.beat')}</p>}
                <p>
                  <small>{t('reveal.legend')}</small>
                </p>
              </div>
            </div>
            <a
              className={styles.source}
              href={`https://data.worldbank.org/indicator/${pair.y}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('source', { x: pair.x, y: pair.y })}
            </a>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                onClick={onNext}
                data-testid="pp-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="pp-end">
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
      <div className={shared.menuCard} data-testid="pp-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="pp-resume"
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
              <strong data-testid="pp-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="pp-daily"
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
                  data-testid={`pp-diff-${d}`}
                >
                  {t(`diff.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`diff.${saved.difficulty}.hint`)}</p>
          </fieldset>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEndless}
            data-testid="pp-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="pp-record">
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
              <dt>{t('stats.best')}</dt>
              <dd>{r.rounds ? r.best : '—'}</dd>
            </div>
            <div>
              <dt>{t('stats.beat')}</dt>
              <dd>{r.beat}</dd>
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
