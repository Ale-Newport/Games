/**
 * The Word Rank table: a menu (today's game, random word, past games by number, watch the AI,
 * resume), the guess box, the latest guess pinned on top of a list sorted by rank with closeness
 * bars, hints, give up, and an end screen with the closest words and a spoiler-free share line.
 */
import { Bot, CalendarDays, Copy, History, Lightbulb, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { createTranslator } from '../../core/i18n';
import { loadVectors, semanticLang, type SemanticLang } from '../shared/semantic/semantic';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { climberMove } from './ai';
import {
  band,
  bestRank,
  check,
  closest,
  dailySecret,
  gameNumber,
  giveUp,
  guess,
  isValidState,
  langOf,
  MAX_GUESSES,
  newGame,
  randomGame,
  takeHint,
  type RankState,
} from './engine';
import { STRINGS } from './i18n';
import { guessSound, RANK_SOUNDS } from './sounds';
import styles from './WordRank.module.css';

interface Saved {
  state: RankState | null;
  /** Finished daily games: gameNo (English) or `es:gameNo` → guesses (negative when given up). */
  daily: Record<string, number>;
}

const closeness = (rank: number) => Math.max(0.02, 1 - Math.log(rank) / Math.log(30000));

/** Daily records: English keeps its original keys; each other language has its own series. */
const dailyKey = (gameNo: number, lang: SemanticLang) =>
  lang === 'en' ? String(gameNo) : `${lang}:${gameNo}`;

export function WordRankGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: RankState, unlock: (id: string) => void, daily: Record<string, number>) => void;
}) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          ((d as Saved).state === null || isValidState((d as Saved).state)) &&
          typeof (d as Saved).daily === 'object',
      }),
    [services],
  );
  const [mode, setMode] = useState<'menu' | 'play' | 'watch'>(
    services.launchParams.mode === 'watch' ? 'watch' : 'menu',
  );
  const [saved, setSaved] = useState<Saved>({ state: null, daily: {} });
  const [state, setStateRaw] = useState<RankState | null>(null);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState('');
  const [archiveNo, setArchiveNo] = useState(Math.max(0, gameNumber() - 1));
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<RankState | null>(null);
  const savedRef = useLatest(saved);
  const setState = (s: RankState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };
  // New games use the interface language; a game in progress keeps its own.
  const menuLang = semanticLang(locale);
  const lang: SemanticLang = mode !== 'menu' && state ? langOf(state) : menuLang;
  const vectorsAsset = useAsset(() => loadVectors(lang), lang);
  const vectors = vectorsAsset.value;

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSaved(d));
    return () => {
      alive = false;
    };
  }, [slot]);

  const persist = (patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    setSaved(next);
    void slot.save(next);
  };

  const start = (s: RankState, m: 'play' | 'watch') => {
    setState(s);
    setMode(m);
    setTyped('');
    setMessage('');
    setCopied(false);
    if (m === 'play') persist({ state: s });
  };

  const asked = Number(services.launchParams.deal);
  const seedFor = () => (Number.isInteger(asked) && asked > 0 ? asked : randomSeed() >>> 0);

  useEffect(() => {
    if (mode === 'watch' && !state && vectors) {
      const id = window.setTimeout(
        () => start(randomGame(seedFor(), MAX_GUESSES, menuLang), 'watch'),
        0,
      );
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, vectors]);

  const finished = (s: RankState) => {
    const svc = servicesRef.current;
    svc.playSound(s.status === 'won' ? RANK_SOUNDS.win : RANK_SOUNDS.lose);
    if (mode !== 'play') return;
    const daily =
      s.gameNo !== null
        ? {
            ...savedRef.current.daily,
            [dailyKey(s.gameNo, langOf(s))]:
              s.status === 'won' ? s.guesses.length : -s.guesses.length,
          }
        : savedRef.current.daily;
    persist({ state: null, daily });
    svc.recordResult({
      outcome: s.status === 'won' ? 'complete' : 'loss',
      score: s.guesses.length,
      mode: s.gameNo !== null ? 'daily' : 'random',
    });
    onFinish(s, (id) => svc.unlockAchievement(id), daily);
  };

  const apply = (next: RankState) => {
    const before = stateRef.current;
    setState(next);
    if (before?.status === 'playing' && next.status !== 'playing') finished(next);
    else if (mode === 'play') persist({ state: next });
  };

  const submit = (text: string) => {
    const s = stateRef.current;
    if (!s || !vectors || s.status !== 'playing' || !text.trim()) return;
    const { word, rejection } = check(vectors, s, text);
    setTyped('');
    if (rejection === 'unknown') {
      setMessage(t('play.unknown'));
      servicesRef.current.playSound(RANK_SOUNDS.bad);
      return;
    }
    if (rejection === 'repeat') {
      setMessage(t('play.repeat', { word: vectors.words[word!]! }));
      return;
    }
    const canonical = vectors.words[word!]!;
    setMessage(
      canonical !== text.trim().toLowerCase() ? t('play.plural', { word: canonical }) : '',
    );
    const next = guess(vectors, s, word!);
    servicesRef.current.playSound(guessSound(next.guesses.at(-1)!.rank));
    apply(next);
  };

  const hint = () => {
    const s = stateRef.current;
    if (!s || !vectors) return;
    servicesRef.current.playSound(RANK_SOUNDS.hint);
    setMessage('');
    apply(takeHint(vectors, s));
  };

  // Watch: the climber guesses every 0.9 s.
  useEffect(() => {
    if (mode !== 'watch' || !vectors || !state || state.status !== 'playing') return;
    const rng = new Rng(state.guesses.length * 7919 + 1);
    const id = window.setTimeout(() => {
      const s = stateRef.current!;
      const a = climberMove(vectors, s, rng, true);
      if (a === 'hint') apply(takeHint(vectors, s));
      else if (a === 'give-up') apply(giveUp(s));
      else {
        const next = guess(vectors, s, Number(a.slice(2)));
        servicesRef.current.playSound(guessSound(next.guesses.at(-1)!.rank));
        apply(next);
      }
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, vectors, state?.guesses.length, state?.status]);

  if (!vectors) {
    if (vectorsAsset.error) return <LoadError onRetry={vectorsAsset.retry} />;
    return (
      <div className={shared.menu}>
        <p className="muted" data-testid="wr-loading">
          {t('loading')}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- menu
  if (mode === 'menu' || !state) {
    const today = gameNumber();
    const stats = services.getStats();
    const resume = saved.state && saved.state.status === 'playing' ? saved.state : null;
    return (
      <div className={shared.menu} data-testid="wr-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          <p className={shared.hintText}>{t('menu.language')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume, 'play')}
              data-testid="wr-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>{t('menu.resumeHint', { n: resume.guesses.length })}</small>
              </span>
            </button>
          )}
          <p className={shared.hintText}>
            {stats?.completions
              ? t('menu.record', { wins: stats.completions, best: stats.bestScore ?? 0 })
              : t('menu.unplayed')}
          </p>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                start(newGame(dailySecret(today, lang), today, MAX_GUESSES, lang), 'play')
              }
              data-testid="wr-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily', { n: today + 1 })}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor(), MAX_GUESSES, lang), 'play')}
              data-testid="wr-random"
            >
              <Shuffle size={16} /> {t('menu.random')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor(), MAX_GUESSES, lang), 'watch')}
              data-testid="wr-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
          <fieldset className={shared.group}>
            <legend>{t('menu.archive')}</legend>
            <div className={styles.archive}>
              <label>
                {t('menu.archivePick')}{' '}
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={today}
                  value={archiveNo + 1}
                  onChange={(e) =>
                    setArchiveNo(Math.max(0, Math.min(today - 1, Number(e.target.value) - 1)))
                  }
                  data-testid="wr-archive-no"
                />
              </label>
              <button
                type="button"
                className="btn"
                disabled={today < 1}
                onClick={() =>
                  start(newGame(dailySecret(archiveNo, lang), archiveNo, MAX_GUESSES, lang), 'play')
                }
                data-testid="wr-archive"
              >
                <History size={16} /> {t('menu.archive')}
              </button>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- play
  const s = state;
  const over = s.status !== 'playing';
  const last = s.guesses.at(-1);
  const sorted = [...s.guesses].sort((a, b) => a.rank - b.rank);
  const row = (g: { word: number; rank: number; hint: boolean }, pinned = false) => (
    <li
      key={`${pinned ? 'p' : ''}${g.word}`}
      className={styles.row}
      data-band={band(g.rank)}
      data-pinned={pinned}
      data-testid={pinned ? 'wr-last' : `wr-guess-${vectors.words[g.word]}`}
    >
      <span className={styles.bar} style={{ width: `${closeness(g.rank) * 100}%` }} />
      <span className={styles.word}>
        {vectors.words[g.word]}
        {g.hint && <Lightbulb size={12} aria-label={t('play.hint')} />}
      </span>
      <span className={styles.rank}>{g.rank}</span>
    </li>
  );
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(typed);
  };
  const share = () => {
    const counts = { close: 0, warm: 0, far: 0 };
    for (const g of s.guesses) counts[band(g.rank)]++;
    const text = [
      `${t('title')}${s.gameNo !== null ? ` #${s.gameNo + 1}` : ''}`,
      `${s.status === 'won' ? '✅' : '❌'} ${s.guesses.length} · 💡 ${s.hints}`,
      `🟩 ${counts.close}  🟨 ${counts.warm}  🟥 ${counts.far}`,
    ].join('\n');
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className={styles.wrap} data-testid="wr-play">
      <div className={styles.head}>
        <span>{s.gameNo !== null ? `#${s.gameNo + 1}` : t('menu.random')}</span>
        <span data-testid="wr-count">{t('play.guesses', { n: s.guesses.length })}</span>
        <span>{t('play.hints', { n: s.hints })}</span>
      </div>
      {!over && (
        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={`input ${styles.input}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t('play.placeholder')}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={mode === 'watch'}
            aria-label={t('play.placeholder')}
            data-testid="wr-input"
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mode === 'watch'}
            data-testid="wr-submit"
          >
            {t('play.guess')}
          </button>
        </form>
      )}
      <p className={styles.message} aria-live="polite" data-testid="wr-message">
        {mode === 'watch' && !over ? t('watch.thinking') : message}
      </p>
      {over && (
        <div className={styles.result} data-testid="wr-result" data-status={s.status}>
          <strong>
            {s.status === 'won'
              ? t('end.won', { word: s.secret, n: s.guesses.length, h: s.hints })
              : t('end.lost', { word: s.secret })}
          </strong>
          <div className={shared.menuActions}>
            <button type="button" className="btn" onClick={share} data-testid="wr-share">
              <Copy size={16} /> {copied ? t('end.copied') : t('end.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                start(
                  randomGame(randomSeed() >>> 0, MAX_GUESSES, langOf(s)),
                  mode === 'watch' ? 'watch' : 'play',
                )
              }
              data-testid="wr-again"
            >
              <Shuffle size={16} /> {t('end.again')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setState(null);
                setMode('menu');
              }}
              data-testid="wr-menu-btn"
            >
              {t('end.menu')}
            </button>
          </div>
          <details>
            <summary>{t('end.closest')}</summary>
            <ol className={styles.closest} data-testid="wr-closest">
              {closest(vectors, s, 100).map((w) => (
                <li key={w}>{vectors.words[w]}</li>
              ))}
            </ol>
          </details>
        </div>
      )}
      {last && <ul className={styles.list}>{row(last, true)}</ul>}
      <ul className={styles.list} data-testid="wr-list">
        {sorted.map((g) => row(g))}
      </ul>
      {!over && mode === 'play' && (
        <div className={shared.controls}>
          <button
            type="button"
            className="btn"
            onClick={hint}
            disabled={bestRank(s) === 2}
            data-testid="wr-hint"
          >
            <Lightbulb size={16} /> {t('play.hint')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => apply(giveUp(s))}
            data-testid="wr-giveup"
          >
            {t('play.giveUp')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setState(null);
              setMode('menu');
            }}
          >
            {t('end.menu')}
          </button>
        </div>
      )}
    </div>
  );
}
