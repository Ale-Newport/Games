/**
 * The Word Guess table: a menu (English or Spanish words, hard mode, today's or a random word,
 * resume, watch the AI), the 6×5 board with tiles that flip to show their marks, an on-screen
 * keyboard colored by what is known, explained hints from the solver, and the AI solving a word.
 */
import { Bot, CalendarDays, Delete, Lightbulb, Play, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { solverMove } from './ai';
import {
  LANGS,
  LENGTH,
  MAX_GUESSES,
  bestGuess,
  candidates,
  isValidWordState,
  newWordGame,
  play,
  rejection,
  type Lang,
  type Rejection,
  type WordState,
} from './engine';
import { STRINGS } from './i18n';
import { WORD_SOUNDS } from './sounds';
import styles from './WordGame.module.css';

interface Saved {
  state: WordState;
}
type Mode = 'menu' | 'play' | 'watch';

const ROWS: Record<Lang, string[]> = {
  en: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
  es: ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'],
};

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** Best mark seen for each letter. */
function letterMarks(s: WordState): Map<string, number> {
  const out = new Map<string, number>();
  for (const g of s.guesses)
    g.marks.forEach((m, i) => {
      const c = g.word[i]!;
      out.set(c, Math.max(out.get(c) ?? -1, m));
    });
  return out;
}

export function WordGame({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' && d !== null && isValidWordState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [lang, setLang] = useState<Lang>(locale === 'es' ? 'es' : 'en');
  const [hard, setHard] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<WordState | null>(null);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(0);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useLatest(state);
  const typedRef = useLatest(typed);
  const elapsedRef = useLatest(elapsed);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.status === 'playing') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (s: WordState, m: Mode) => {
    setState(s);
    setMode(m);
    setLang(s.lang);
    setHard(s.hard);
    setTyped('');
    setSuggestion(null);
    setElapsed(s.elapsedMs);
    setMessage('');
    if (m === 'play') void slot.save({ state: s });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => start(newWordGame(lang, fixedSeed ?? randomSeed() >>> 0), 'watch'),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'play' || !state || state.status !== 'playing') return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state]);

  const upper = (w: string) => w.toUpperCase();

  const finish = (s: WordState) => {
    const svc = servicesRef.current;
    const n = s.guesses.length;
    const modeKey = `${s.lang}${s.hard ? '-hard' : ''}`;
    if (s.status === 'won') {
      svc.playSound(WORD_SOUNDS.win);
      setMessage(n === 1 ? t('won.one') : t('won', { n, time: formatTime(elapsedRef.current) }));
      const stats = svc.recordResult({
        outcome: 'complete',
        score: n,
        timeMs: elapsedRef.current,
        mode: modeKey,
      });
      svc.unlockAchievement('first');
      if (n <= 3) svc.unlockAchievement('three');
      if (s.hard) svc.unlockAchievement('hard');
      const solvedIn = (l: Lang) =>
        (stats.modes[l]?.completions ?? 0) + (stats.modes[`${l}-hard`]?.completions ?? 0);
      if (solvedIn('en') && solvedIn('es')) svc.unlockAchievement('bilingual');
      if (stats.streak >= 5) svc.unlockAchievement('streak');
    } else {
      svc.playSound(WORD_SOUNDS.lose);
      setMessage(t('lost', { word: upper(s.answer) }));
      svc.recordResult({ outcome: 'fail', mode: modeKey });
    }
    void slot.clear();
    setSaved(null);
  };

  const active = mode === 'play' && !!state && state.status === 'playing';

  const explain = (r: Rejection, word: string) =>
    r.kind === 'unknown'
      ? t('reject.unknown', { word: upper(word) })
      : r.kind === 'place'
        ? t('reject.place', { at: r.at + 1, letter: upper(r.letter) })
        : r.kind === 'use'
          ? t('reject.use', { letter: upper(r.letter) })
          : t('reject.length');

  const typeLetter = (c: string) => {
    if (!active || typedRef.current.length >= LENGTH) return;
    servicesRef.current.playSound(WORD_SOUNDS.key);
    setTyped(typedRef.current + c);
    setMessage('');
    setSuggestion(null);
  };

  const erase = () => {
    if (!active) return;
    setTyped(typedRef.current.slice(0, -1));
    setMessage('');
  };

  const submit = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    const word = typedRef.current;
    const r = rejection(s, word);
    if (r) {
      servicesRef.current.playSound(WORD_SOUNDS.bad);
      setMessage(explain(r, word));
      setShake((x) => x + 1);
      return;
    }
    const next = play(s, word);
    servicesRef.current.playSound(WORD_SOUNDS.flip);
    setState(next);
    setTyped('');
    setSuggestion(null);
    setMessage('');
    if (next.status !== 'playing') finish(next);
    else void slot.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(WORD_SOUNDS.hint);
    const left = candidates(s.lang, s.guesses).length;
    const choice = bestGuess(s);
    setSuggestion(choice.word);
    setMessage(
      left === 1
        ? t('hint.one')
        : t(s.guesses.length ? 'hint.many' : 'hint.start', {
            n: left,
            avg: choice.expected.toFixed(1),
          }),
    );
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !suggestion || !active) return;
    const next = { ...s, hints: s.hints + 1 };
    setState(next);
    setTyped(suggestion);
    setSuggestion(null);
    setMessage('');
    void slot.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  // Watch mode: the solver plays one word every 1.2 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(() => {
      const word = solverMove(state);
      const next = play(state, word);
      const left = candidates(next.lang, next.guesses).length;
      servicesRef.current.playSound(next.status === 'won' ? WORD_SOUNDS.win : WORD_SOUNDS.flip);
      setMessage(
        next.status === 'won'
          ? t('watch.won', { word: upper(word), n: next.guesses.length })
          : next.status === 'lost'
            ? t('watch.lost', { word: upper(next.answer) })
            : t(left === 1 ? 'watch.last' : 'watch.step', { word: upper(word), left }),
      );
      setState(next);
    }, 1200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (!active || !state) return false;
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    const raw = e.key.toLowerCase();
    // Accented vowels type their plain letter (Spanish words ignore accents); ñ stays.
    const k = raw === 'ñ' ? raw : raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (k === 'enter') submit();
    else if (k === 'backspace' || k === 'delete') erase();
    else if (k.length === 1 && ROWS[state.lang].some((r) => r.includes(k))) typeLetter(k);
    else return false;
    return true;
  });

  const fresh = (m: Mode, seed: number) => start(newWordGame(lang, seed, hard), m);

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && s.status === 'playing') {
      const kept = { state: { ...s, elapsedMs: elapsedRef.current } };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const stats = services.getStats();
    return (
      <div className={shared.menu} data-testid="wg-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play')}
              data-testid="wg-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    lang: t(`lang.${saved.state.lang}`),
                    n: saved.state.guesses.length + 1,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.lang')}</legend>
            <div className={shared.segmented}>
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  data-testid={`wg-lang-${l}`}
                >
                  {t(`lang.${l}`)}
                </button>
              ))}
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={hard}
                onChange={(e) => setHard(e.target.checked)}
                data-testid="wg-hard"
              />
              {t('menu.hard')}
            </label>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', {
                    wins: stats.completions,
                    played: stats.played,
                    streak: stats.streak,
                    best: stats.bestStreak,
                  })
                : t('menu.unplayed')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', today() * 10 + LANGS.indexOf(lang))}
              data-testid="wg-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('play', fixedSeed ?? randomSeed() >>> 0)}
              data-testid="wg-random"
            >
              <Shuffle size={16} /> {t('menu.random')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', fixedSeed ?? randomSeed() >>> 0)}
              data-testid="wg-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const over = s.status !== 'playing';
  const known = letterMarks(s);
  const current = s.guesses.length;

  return (
    <div className={shared.play} data-testid="word-guess">
      <div className={styles.bar}>
        <span className={styles.counter}>
          {t(`lang.${s.lang}`)}
          {s.hard ? ' · ★' : ''}
        </span>
        {mode === 'play' && <span className={styles.counter}>{formatTime(elapsed)}</span>}
      </div>
      <div className={styles.board} role="grid" aria-label={t('title')} data-testid="wg-board">
        {Array.from({ length: MAX_GUESSES }, (_, r) => {
          const g = s.guesses[r];
          const isCurrent = r === current && !over && mode === 'play';
          const letters = g ? g.word : isCurrent ? typed : '';
          return (
            <div
              key={r === current ? `c${shake}` : r}
              role="row"
              className={`${styles.row} ${isCurrent && shake ? styles.shake : ''}`}
              aria-label={g ? t('row.label', { n: r + 1, word: upper(g.word) }) : undefined}
              data-testid={`wg-row-${r}`}
            >
              {Array.from({ length: LENGTH }, (_, i) => {
                const c = letters[i];
                const m = g?.marks[i];
                return (
                  <span
                    key={i}
                    role="gridcell"
                    className={[
                      styles.tile,
                      c ? styles.filled : '',
                      m === 2 ? styles.right : m === 1 ? styles.near : m === 0 ? styles.absent : '',
                      g ? styles.flip : '',
                    ].join(' ')}
                    style={{ ['--i' as string]: i }}
                    data-mark={m}
                    aria-label={
                      c
                        ? m === undefined
                          ? t('tile.typed', { letter: upper(c) })
                          : t(`tile.${m}`, { letter: upper(c) })
                        : t('tile.empty')
                    }
                  >
                    {c ? upper(c) : ''}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className={shared.message} data-testid="wg-message" aria-live="polite">
        {message}
      </p>
      {suggestion && active && (
        <div className={styles.suggestion}>
          <strong>{upper(suggestion)}</strong>
          <button
            type="button"
            className="btn btn-primary"
            onClick={applyHint}
            data-testid="wg-apply"
          >
            {t('hint.apply')}
          </button>
        </div>
      )}
      {active && (
        <div className={styles.keyboard} data-testid="wg-keyboard">
          {ROWS[s.lang].map((row, r) => (
            <div key={r} className={styles.keyRow}>
              {r === 2 && (
                <button
                  type="button"
                  className={`${styles.key} ${styles.wide}`}
                  onClick={submit}
                  data-testid="wg-enter"
                >
                  {t('key.enter')}
                </button>
              )}
              {[...row].map((c) => {
                const m = known.get(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={[
                      styles.key,
                      m === 2 ? styles.right : m === 1 ? styles.near : m === 0 ? styles.absent : '',
                    ].join(' ')}
                    onClick={() => typeLetter(c)}
                    aria-label={m === undefined ? upper(c) : t(`key.${m}`, { letter: upper(c) })}
                    data-testid={`wg-key-${c}`}
                  >
                    {upper(c)}
                  </button>
                );
              })}
              {r === 2 && (
                <button
                  type="button"
                  className={`${styles.key} ${styles.wide}`}
                  onClick={erase}
                  aria-label={t('key.back')}
                  data-testid="wg-back"
                >
                  <Delete size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={shared.controls}>
        {active && (
          <button type="button" className="btn" onClick={showHint} data-testid="wg-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(over || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, randomSeed() >>> 0)}
            data-testid="wg-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="wg-menu-btn">
          {t('menu')}
        </button>
      </div>
      <p className={shared.hintText}>{t('legend')}</p>
    </div>
  );
}
