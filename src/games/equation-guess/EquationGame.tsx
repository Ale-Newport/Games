/**
 * Equation Guess screens: menu (daily, endless by size, resume, record), the board (rows of
 * tiles, the guess being typed, the on-screen keypad coloured by what is known), the reveal and
 * results. Physical keys: digits, + - = and x / * for ×, : / for ÷, Enter, Backspace.
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Delete,
  Infinity as InfinityIcon,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  finish,
  invalidReason,
  isSession,
  keyStates,
  LENGTH,
  mark,
  newDaily,
  newEndless,
  next,
  POINTS,
  pretty,
  shareText,
  SIZES,
  submit,
  TRIES,
  type EquationData,
  type Session,
  type Size,
} from './engine';
import styles from './EquationGuess.module.css';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';

interface Tally {
  played: number;
  solved: number;
  tries: number;
}
interface Saved {
  session: Session | null;
  daily: { [day: string]: number };
  seen: string[];
  size: Size;
  record: Tally;
}
const EMPTY: Saved = {
  session: null,
  daily: {},
  seen: [],
  size: 'classic',
  record: { played: 0, solved: 0, tries: 0 },
};
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.session === null || isSession(s.session)) &&
    typeof s.daily === 'object' &&
    Array.isArray(s.seen) &&
    SIZES.includes(s.size) &&
    typeof s.record?.played === 'number'
  );
};
const loadData = () => import('./equations.json').then((m) => m.default as unknown as EquationData);
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '*', '/', '='];
const grade = (n: number) => (n >= 85 ? 3 : n >= 55 ? 2 : n > 0 ? 1 : 0);

export function EquationGame({ services }: GameProps) {
  const { locale } = services;
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
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const sessionRef = useLatest(session);
  const typedRef = useLatest(typed);
  const nextRef = useRef<HTMLButtonElement>(null);
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

  const onGuess = () => {
    const s0 = sessionRef.current!;
    const p0 = current(s0);
    const g = typedRef.current;
    const len = LENGTH[p0.size];
    const reason = invalidReason(g, len);
    if (reason) {
      setError(reason === 'length' ? t('error.length', { n: len }) : t(`error.${reason}`));
      servicesRef.current.playSound(SOUNDS.bad!);
      return;
    }
    if (p0.guesses.includes(g)) {
      setError(t('error.repeat'));
      return;
    }
    const s = submit(s0, g);
    const p = current(s);
    typedRef.current = '';
    setTyped('');
    setSession(s);
    sessionRef.current = s;
    const svc = servicesRef.current;
    if (p.status === 'playing') {
      svc.playSound(SOUNDS.tick!);
      return persist({ session: s });
    }
    svc.playSound(p.status === 'won' ? SOUNDS.great! : SOUNDS.poor!);
    const rec = savedRef.current.record;
    const won = p.status === 'won';
    const record: Tally = {
      played: rec.played + 1,
      solved: rec.solved + (won ? 1 : 0),
      tries: rec.tries + (won ? p.guesses.length : 0),
    };
    if (won) svc.unlockAchievement('first-solve');
    if (won && p.guesses.length <= 2) svc.unlockAchievement('lightning');
    if (won && p.size === 'hard') svc.unlockAchievement('hard-solve');
    if (record.solved >= 25) svc.unlockAchievement('mathematician');
    const seen = [...savedRef.current.seen.filter((x) => x !== p.answer), p.answer].slice(-500);
    let daily = savedRef.current.daily;
    if (s.status === 'done') {
      svc.recordResult({
        outcome: 'complete',
        score: s.total,
        mode: s.mode === 'daily' ? 'daily' : `endless:${s.size}`,
      });
      if (s.mode === 'daily') {
        daily = { ...daily, [s.day]: s.total };
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    persist({ session: s, record, seen, daily });
    requestAnimationFrame(() => nextRef.current?.focus());
  };

  const press = (k: string) => {
    const s = sessionRef.current;
    if (!s || !awaiting(s)) return;
    const len = LENGTH[current(s).size];
    const cur = typedRef.current;
    setError(null);
    if (k === 'Backspace') {
      typedRef.current = cur.slice(0, -1);
      setTyped(typedRef.current);
    } else if (k === 'Enter') onGuess();
    else if (KEYS.includes(k) && cur.length < len) {
      typedRef.current = cur + k;
      setTyped(typedRef.current);
    }
  };
  const pressRef = useLatest(press);
  // Physical keyboard while a puzzle is on screen.
  useEffect(() => {
    if (view !== 'play') return;
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      const map: Record<string, string> = { x: '*', X: '*', ':': '/', '÷': '/', '×': '*' };
      const k = map[e.key] ?? e.key;
      if (k === 'Enter' && (e.target as HTMLElement | null)?.tagName === 'BUTTON') return;
      if (KEYS.includes(k) || k === 'Enter' || k === 'Backspace') {
        e.preventDefault();
        pressRef.current(k);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [view, pressRef]);

  if (asset.error) return <LoadError onRetry={asset.retry} />;
  if (!data || !loaded)
    return (
      <p className={styles.loading} data-testid="eq-loading">
        {t('loading')}
      </p>
    );

  const begin = (s: Session) => {
    setSession(s);
    sessionRef.current = s;
    typedRef.current = '';
    setTyped('');
    setError(null);
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
    const { size, seen } = savedRef.current;
    begin(newEndless(data, seedFor(), size, new Set(seen)));
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
        <div className={shared.menuCard} data-testid="eq-results">
          <h2 className={shared.menuTitle}>
            {session.mode === 'daily'
              ? t('results.daily', { n: session.day + 1 })
              : t('results.endless')}
          </h2>
          <p className={styles.bigTotal} data-testid="eq-final">
            {t('results.total', {
              total: session.total,
              max: (session.limit || session.count) * 100,
            })}
          </p>
          <ol className={styles.roundList}>
            {session.puzzles
              .filter((p) => p.status !== 'playing')
              .map((p, i) => (
                <li key={i} data-grade={grade(p.score ?? 0)}>
                  <span>
                    <strong className={styles.eqText}>{pretty(p.answer)}</strong>
                    <small>
                      {t(`size.${p.size}`)} ·{' '}
                      {p.status === 'won'
                        ? t('results.solved', { n: p.guesses.length })
                        : t('results.missed')}
                    </small>
                  </span>
                  <b>{p.score}</b>
                </li>
              ))}
          </ol>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() => copy(shareText(session, t('title')))}
              data-testid="eq-share"
            >
              <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startEndless}
              data-testid="eq-again"
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
              data-testid="eq-menu-btn"
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      </div>
    );

  const p = current(session);
  const len = LENGTH[p.size];
  const tries = TRIES[p.size];
  const over = p.status !== 'playing';
  const keys = keyStates(p.guesses, p.answer);
  const rows = Array.from({ length: tries }, (_, r) => {
    if (r < p.guesses.length)
      return { text: p.guesses[r]!, marks: mark(p.guesses[r]!, p.answer), active: false };
    if (r === p.guesses.length && !over) return { text: typed, marks: null, active: true };
    return { text: '', marks: null, active: false };
  });
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
        mode: `endless:${s.size}`,
      });
    setSession(s);
    persist({ session: null });
    setView(s.count > 0 ? 'results' : 'menu');
  };

  return (
    <div className={styles.wrap} data-testid="eq-play">
      <div className={styles.bar}>
        <span>
          {session.mode === 'daily'
            ? t('play.daily', { n: session.day + 1 })
            : t('play.endless', { size: t(`size.${session.size}`) })}
        </span>
        <span data-testid="eq-round">
          {session.limit
            ? t('play.round', { n: session.count + (over ? 0 : 1), of: session.limit })
            : t('play.roundN', { n: session.count + (over ? 0 : 1) })}
        </span>
        <span data-testid="eq-total">{t('play.total', { n: session.total })}</span>
      </div>
      <div className={styles.card}>
        <p className={styles.sizeLine} data-testid="eq-size">
          {t('play.size', { size: t(`size.${p.size}`), length: len, tries })}
          {!over && (
            <span>
              {' '}
              ·{' '}
              {t('play.tries', {
                n: p.guesses.length + 1,
                of: tries,
                pts: POINTS[p.guesses.length]!,
              })}
            </span>
          )}
        </p>
        <div
          className={styles.board}
          role="grid"
          aria-label={t('board')}
          data-testid="eq-board"
          style={{ ['--cols' as string]: len }}
        >
          {rows.map((row, r) => (
            <div
              key={r}
              role="row"
              className={styles.row}
              data-active={row.active}
              data-testid={`eq-row-${r}`}
            >
              {Array.from({ length: len }, (_, i) => {
                const ch = row.text[i] ?? '';
                const m = row.marks?.[i];
                return (
                  <span
                    key={i}
                    role="gridcell"
                    className={styles.tile}
                    data-mark={m ?? (ch ? 'typed' : 'empty')}
                    aria-label={
                      ch
                        ? t('cell', { symbol: pretty(ch), state: t(`state.${m ?? 'empty'}`) })
                        : t('state.empty')
                    }
                  >
                    {pretty(ch)}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        {error && (
          <p className={styles.warn} role="alert" data-testid="eq-error">
            {error}
          </p>
        )}
        {over ? (
          <div className={styles.reveal} data-testid="eq-reveal">
            <div className={styles.scoreRow}>
              <div className={styles.score} data-grade={grade(p.score!)}>
                <small>{t('reveal.points')}</small>
                <strong data-testid="eq-score">
                  <CountUp to={p.score!} instant={services.reducedMotion} />
                </strong>
              </div>
              <div className={styles.facts}>
                <p>
                  {p.status === 'won' ? t('reveal.won', { n: p.guesses.length }) : t('reveal.lost')}
                </p>
                <p className={styles.answer} data-testid="eq-answer">
                  {pretty(p.answer)}
                </p>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                ref={nextRef}
                type="button"
                className="btn btn-primary"
                onClick={onNext}
                data-testid="eq-next"
              >
                {session.status === 'done' ? t('play.results') : t('play.next')}
              </button>
              {session.mode === 'endless' && (
                <button type="button" className="btn" onClick={onEnd} data-testid="eq-end">
                  {t('play.end')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.keypad} data-testid="eq-keypad">
              {KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={styles.key}
                  data-mark={keys.get(k) ?? 'unknown'}
                  onClick={() => press(k)}
                  data-testid={`eq-key-${k}`}
                >
                  {pretty(k)}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.key} ${styles.wide}`}
                onClick={() => press('Backspace')}
                aria-label={t('key.back')}
                data-testid="eq-key-back"
              >
                <Delete size={18} />
              </button>
              <button
                type="button"
                className={`${styles.key} ${styles.wide} ${styles.enter}`}
                onClick={() => press('Enter')}
                data-testid="eq-key-enter"
              >
                {t('key.enter')}
              </button>
            </div>
            <p className={styles.keys}>{t('play.keys')}</p>
            {session.mode === 'endless' && (
              <div className={styles.actions}>
                <button type="button" className="btn" onClick={onEnd} data-testid="eq-end">
                  {t('play.end')}
                </button>
              </div>
            )}
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
      <div className={shared.menuCard} data-testid="eq-menu">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="eq-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', {
                  mode:
                    resumable.mode === 'daily'
                      ? t('play.daily', { n: resumable.day + 1 })
                      : t(`size.${resumable.size}`),
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
              <strong data-testid="eq-daily-done">{t('menu.dailyDone', { score: done })}</strong>
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
              data-testid="eq-daily"
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
            <legend>{t('menu.size')}</legend>
            <div className={shared.segmented}>
              {SIZES.map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={saved.size === z}
                  onClick={() => onPick({ size: z })}
                  data-testid={`eq-size-${z}`}
                >
                  {t(`size.${z}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`size.${saved.size}.hint`)}</p>
          </fieldset>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEndless}
            data-testid="eq-endless"
          >
            <Play size={16} /> {t('menu.start')}
          </button>
        </section>
        <section className={styles.modeCard} data-testid="eq-record">
          <h3>
            <BarChart3 size={18} /> {t('menu.stats')}
          </h3>
          <dl className={styles.stats}>
            <div>
              <dt>{t('stats.played')}</dt>
              <dd>{r.played}</dd>
            </div>
            <div>
              <dt>{t('stats.solved')}</dt>
              <dd>{r.solved}</dd>
            </div>
            <div>
              <dt>{t('stats.average')}</dt>
              <dd>{r.solved ? (r.tries / r.solved).toFixed(1) : '—'}</dd>
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
