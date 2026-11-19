/**
 * The Word Warmth table: a menu (today's puzzle, random word, watch the AI, resume), the header
 * with today's nearest/tenth/thousandth similarities, the guess box, the latest guess and the
 * table of guesses sorted by similarity with the "N/1000" closeness bar, and the end screen.
 */
import { Bot, CalendarDays, Copy, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { createTranslator } from '../../core/i18n';
import { loadVectors, semanticLang, type SemanticLang } from '../shared/semantic/semantic';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { warmerMove } from './ai';
import {
  NEAREST,
  check,
  dailySecret,
  gameNumber,
  giveUp,
  guess,
  isValidState,
  langOf,
  MAX_GUESSES,
  newGame,
  randomGame,
  secretInfo,
  temperature,
  type WarmGuess,
  type WarmState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './WordWarmth.module.css';
import { WARM_SOUNDS, warmSound } from './sounds';

/** Daily records: English keeps its original keys; each other language has its own series. */
const dailyKey = (gameNo: number, lang: SemanticLang) =>
  lang === 'en' ? String(gameNo) : `${lang}:${gameNo}`;

interface Saved {
  state: WarmState | null;
  daily: Record<string, number>;
}

export function WordWarmthGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: WarmState, unlock: (id: string) => void, daily: Record<string, number>) => void;
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
  const [state, setStateRaw] = useState<WarmState | null>(null);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<WarmState | null>(null);
  const savedRef = useLatest(saved);
  const setState = (s: WarmState | null) => {
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

  const asked = Number(services.launchParams.deal);
  const seedFor = () => (Number.isInteger(asked) && asked > 0 ? asked : randomSeed() >>> 0);

  const start = (s: WarmState, m: 'play' | 'watch') => {
    setState(s);
    setMode(m);
    setTyped('');
    setMessage('');
    setCopied(false);
    if (m === 'play') persist({ state: s });
  };

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

  const finished = (s: WarmState) => {
    const svc = servicesRef.current;
    svc.playSound(s.status === 'won' ? WARM_SOUNDS.win : WARM_SOUNDS.lose);
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

  const apply = (next: WarmState) => {
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
      servicesRef.current.playSound(WARM_SOUNDS.bad);
      return;
    }
    if (rejection === 'repeat') {
      setMessage(t('play.repeat', { word: vectors.words[word!]! }));
      return;
    }
    setMessage('');
    const next = guess(vectors, s, word!);
    servicesRef.current.playSound(warmSound(next.guesses.at(-1)!.score));
    apply(next);
  };

  useEffect(() => {
    if (mode !== 'watch' || !vectors || !state || state.status !== 'playing') return;
    const rng = new Rng(state.guesses.length * 104729 + 7);
    const id = window.setTimeout(() => {
      const s = stateRef.current!;
      const a = warmerMove(vectors, s, rng);
      if (a === 'give-up') apply(giveUp(s));
      else {
        const next = guess(vectors, s, Number(a.slice(2)));
        servicesRef.current.playSound(warmSound(next.guesses.at(-1)!.score));
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
        <p className="muted" data-testid="ww-loading">
          {t('loading')}
        </p>
      </div>
    );
  }

  if (mode === 'menu' || !state) {
    const today = gameNumber();
    const stats = services.getStats();
    const resume = saved.state && saved.state.status === 'playing' ? saved.state : null;
    return (
      <div className={shared.menu} data-testid="ww-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          <p className={shared.hintText}>{t('menu.language')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume, 'play')}
              data-testid="ww-resume"
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
              data-testid="ww-daily"
              disabled={saved.daily[dailyKey(today, lang)] !== undefined}
            >
              <CalendarDays size={16} /> {t('menu.daily', { n: today + 1 })}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor(), MAX_GUESSES, lang), 'play')}
              data-testid="ww-random"
            >
              <Shuffle size={16} /> {t('menu.random')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(randomGame(seedFor(), MAX_GUESSES, lang), 'watch')}
              data-testid="ww-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const info = secretInfo(vectors, s.secret);
  const over = s.status !== 'playing';
  const last = s.guesses.at(-1);
  const sorted = [...s.guesses].sort((a, b) => b.score - a.score);
  const row = (g: WarmGuess, pinned = false) => {
    const temp = temperature(g);
    return (
      <tr
        key={`${pinned ? 'p' : ''}${g.word}`}
        data-temp={temp}
        data-pinned={pinned}
        data-testid={pinned ? 'ww-last' : `ww-guess-${vectors.words[g.word]}`}
      >
        <td>{g.n}</td>
        <td className={styles.word}>{vectors.words[g.word]}</td>
        <td>{g.score.toFixed(2)}</td>
        <td>
          {g.near !== null ? (
            <span className={styles.meter}>
              <span className={styles.fill} style={{ width: `${(g.near / NEAREST) * 100}%` }} />
              <span className={styles.meterText}>
                {temp === 'found' ? t('temp.found') : `${g.near}/${NEAREST}`}
              </span>
            </span>
          ) : (
            <span className={styles.cold}>{t(`temp.${temp}`)}</span>
          )}
        </td>
      </tr>
    );
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(typed);
  };
  const share = () => {
    const best = Math.max(...s.guesses.map((g) => g.near ?? 0));
    const text = [
      `${t('title')}${s.gameNo !== null ? ` #${s.gameNo + 1}` : ''}`,
      `${s.status === 'won' ? '✅' : '❌'} ${s.guesses.length}`,
      `🔥 ${s.guesses.filter((g) => g.near !== null && g.near >= 900).length}  🌡️ ${s.guesses.filter((g) => g.near !== null).length}  🧊 ${s.guesses.filter((g) => g.near === null).length}`,
      `best ${best}/${NEAREST}`,
    ].join('\n');
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className={styles.wrap} data-testid="ww-play">
      <p className={styles.header} data-testid="ww-header">
        {t('play.header', {
          top1: info.top1.toFixed(2),
          top10: info.top10.toFixed(2),
          top1000: info.top1000.toFixed(2),
        })}
      </p>
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
            data-testid="ww-input"
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mode === 'watch'}
            data-testid="ww-submit"
          >
            {t('play.guess')}
          </button>
          {mode === 'play' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => apply(giveUp(s))}
              data-testid="ww-giveup"
            >
              {t('play.giveUp')}
            </button>
          )}
        </form>
      )}
      <p className={styles.message} aria-live="polite" data-testid="ww-message">
        {mode === 'watch' && !over ? t('watch.thinking') : message}
      </p>
      {over && (
        <div className={styles.result} data-testid="ww-result" data-status={s.status}>
          <strong>
            {s.status === 'won'
              ? t('end.won', { word: s.secret, n: s.guesses.length })
              : t('end.lost', { word: s.secret })}
          </strong>
          <div className={shared.menuActions}>
            <button type="button" className="btn" onClick={share} data-testid="ww-share">
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
              data-testid="ww-again"
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
              data-testid="ww-menu-btn"
            >
              {t('end.menu')}
            </button>
          </div>
          <details>
            <summary>{t('end.nearest')}</summary>
            <ol className={styles.nearest} data-testid="ww-nearest">
              {info.nearestList.slice(0, 100).map((w) => (
                <li key={w}>
                  {vectors.words[w]} <small>{(info.sims[w]! * 100).toFixed(2)}</small>
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}
      <table className={styles.table} data-testid="ww-table">
        <thead>
          <tr>
            <th>{t('col.n')}</th>
            <th>{t('col.word')}</th>
            <th>{t('col.score')}</th>
            <th>{t('col.near')}</th>
          </tr>
        </thead>
        <tbody>
          {last && row(last, true)}
          {sorted.map((g) => row(g))}
        </tbody>
      </table>
      {!over && (
        <div className={shared.controls}>
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
