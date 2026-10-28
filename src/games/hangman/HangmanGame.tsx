/**
 * The Hangman table: a menu (English or Spanish words, category, level, play, today's word, two
 * players with a typed secret word, watch the AI, resume), the drawing that grows with each miss,
 * the word's letter slots, an alphabet keyboard that shows hits and misses, explained hints from the
 * word-list solver, and the AI guessing a word letter by letter.
 */
import { Bot, CalendarDays, EyeOff, Lightbulb, Play, RotateCcw, Users } from 'lucide-react';
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
  ALPHABET,
  CATEGORIES,
  LANGS,
  LEVELS,
  bestLetter,
  cleanWord,
  fitting,
  guess,
  isValidHangmanState,
  levelOf,
  livesLeft,
  misses,
  newHangman,
  type Category,
  type HangmanState,
  type Lang,
} from './engine';
import styles from './Hangman.module.css';
import { STRINGS } from './i18n';
import { HANGMAN_SOUNDS } from './sounds';

interface Saved {
  state: HangmanState;
}
type Mode = 'menu' | 'play' | 'friend' | 'watch';

const STROKES = 8;

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** The drawing: the scaffold first, then the figure; `shown` strokes of eight. */
function Drawing({ shown, lost }: { shown: number; lost: boolean }) {
  const parts = [
    <line key="base" x1="20" y1="190" x2="140" y2="190" />,
    <line key="pole" x1="50" y1="190" x2="50" y2="20" />,
    <polyline key="beam" points="50,50 80,20 150,20" />,
    <line key="rope" x1="150" y1="20" x2="150" y2="48" />,
    <circle key="head" cx="150" cy="64" r="16" />,
    <line key="body" x1="150" y1="80" x2="150" y2="130" />,
    <polyline key="arms" points="122,108 150,92 178,108" />,
    <polyline key="legs" points="128,168 150,130 172,168" />,
  ];
  return (
    <svg
      viewBox="0 0 200 200"
      className={`${styles.drawing} ${lost ? styles.lost : ''}`}
      aria-hidden="true"
    >
      <g className={styles.ghost}>{parts}</g>
      <g className={styles.ink}>{parts.slice(0, shown)}</g>
    </svg>
  );
}

export function HangmanGame({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' && d !== null && isValidHangmanState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [lang, setLang] = useState<Lang>(locale === 'es' ? 'es' : 'en');
  const [level, setLevel] = useState('normal');
  const [category, setCategory] = useState<Category | 'any'>('any');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<HangmanState | null>(null);
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useLatest(state);
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

  const start = (s: HangmanState, m: Mode) => {
    setState(s);
    setMode(m);
    setLang(s.lang);
    setLevel(s.level);
    setSuggestion(null);
    setElapsed(s.elapsedMs);
    setMessage('');
    if (m === 'play') void slot.save({ state: s });
  };

  const fresh = (m: Mode, seed: number, cat: Category | 'any' = category) =>
    start(newHangman(lang, level, cat, seed), m);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', fixedSeed ?? randomSeed() >>> 0), 0);
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

  const upper = (x: string) => x.toUpperCase();
  const catName = (s: HangmanState) =>
    s.category === 'custom'
      ? t('cat.custom')
      : levelOf(s).showCategory
        ? t(`cat.${s.category}`)
        : t('cat.hidden');

  const finish = (s: HangmanState) => {
    const svc = servicesRef.current;
    if (s.status === 'won') {
      svc.playSound(HANGMAN_SOUNDS.win);
      setMessage(t('won', { lives: livesLeft(s), time: formatTime(elapsedRef.current) }));
      const stats = svc.recordResult({
        outcome: 'win',
        score: misses(s),
        timeMs: elapsedRef.current,
        mode: s.category === 'custom' ? 'friend' : s.level,
      });
      if (s.category === 'custom') return;
      svc.unlockAchievement('first');
      if (misses(s) === 0 && !s.hints) svc.unlockAchievement('flawless');
      if (s.level === 'hard' && !s.hints) svc.unlockAchievement('hard');
      if (livesLeft(s) === 1) svc.unlockAchievement('close');
      if (stats.streak >= 5) svc.unlockAchievement('streak');
    } else {
      svc.playSound(HANGMAN_SOUNDS.lose);
      setMessage(t('lost', { word: upper(s.word) }));
      svc.recordResult({ outcome: 'loss', mode: s.category === 'custom' ? 'friend' : s.level });
    }
    void slot.clear();
    setSaved(null);
  };

  const active = mode === 'play' && !!state && state.status === 'playing';

  const tryLetter = (letter: string, viaHint = false) => {
    const s0 = stateRef.current;
    if (!s0 || !active) return;
    const s = viaHint ? { ...s0, hints: s0.hints + 1 } : s0;
    const next = guess(s, letter);
    if (next === s) return;
    const n = [...s.word].filter((c) => c === letter).length;
    servicesRef.current.playSound(n ? HANGMAN_SOUNDS.hit : HANGMAN_SOUNDS.miss);
    setState(next);
    setSuggestion(null);
    setMessage(
      n
        ? t(n === 1 ? 'hit.one' : 'hit', { letter: upper(letter), n })
        : t('miss', { letter: upper(letter) }),
    );
    if (next.status !== 'playing') finish(next);
    else if (next.category !== 'custom')
      void slot.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(HANGMAN_SOUNDS.hint);
    const c = bestLetter(s);
    setSuggestion(c.letter);
    setMessage(
      c.fits === 0
        ? t('hint.none', { letter: upper(c.letter) })
        : c.fits === 1
          ? t('hint.one', { letter: upper(c.letter) })
          : t('hint.words', { n: c.fits, count: c.count, letter: upper(c.letter) }),
    );
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !suggestion || !active) return;
    tryLetter(suggestion, true);
  };

  // Watch mode: the solver guesses a letter every 0.9 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(() => {
      const letter = solverMove(state);
      const next = guess(state, letter);
      const hit = state.word.includes(letter);
      servicesRef.current.playSound(hit ? HANGMAN_SOUNDS.hit : HANGMAN_SOUNDS.miss);
      setMessage(
        next.status === 'won'
          ? t('watch.won', { word: upper(next.word), lives: livesLeft(next) })
          : next.status === 'lost'
            ? t('watch.lost', { word: upper(next.word) })
            : t('watch.step', {
                letter: upper(letter),
                result: t(hit ? 'watch.hit' : 'watch.miss'),
                n: fitting(next).length,
              }),
      );
      setState(next);
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (!active || !state || e.ctrlKey || e.metaKey || e.altKey) return false;
    const raw = e.key.toLowerCase();
    const k = raw === 'ñ' ? raw : raw.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (e.shiftKey && k === 'h') showHint();
    else if (k.length === 1 && ALPHABET[state.lang].includes(k)) tryLetter(k);
    else return false;
    return true;
  });

  const startFriend = () => {
    const w = cleanWord(lang, secret);
    if (!w) {
      setMessage(t('friend.bad'));
      return;
    }
    setSecret('');
    start(newHangman(lang, level, 'any', randomSeed() >>> 0, w), 'play');
  };

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && s.status === 'playing' && s.category !== 'custom') {
      const kept = { state: { ...s, elapsedMs: elapsedRef.current } };
      setSaved(kept);
      void slot.save(kept);
    }
    setMessage('');
    setMode('menu');
    setState(null);
  };

  if (mode === 'friend') {
    return (
      <div className={shared.menu} data-testid="hm-friend">
        <form
          className={shared.menuCard}
          onSubmit={(e) => {
            e.preventDefault();
            startFriend();
          }}
        >
          <h2 className={shared.menuTitle}>{t('menu.friend')}</h2>
          <p className="muted">{t('friend.title')}</p>
          <input
            className={styles.secret}
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={t('friend.placeholder')}
            aria-label={t('friend.placeholder')}
            data-testid="hm-secret"
          />
          <p className={shared.message} data-testid="hm-message">
            {message}
          </p>
          <div className={shared.menuActions}>
            <button type="submit" className="btn btn-primary" data-testid="hm-friend-go">
              <EyeOff size={16} /> {t('friend.go')}
            </button>
            <button type="button" className="btn" onClick={toMenu}>
              {t('menu')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'menu' || !state) {
    const stats = services.getStats();
    return (
      <div className={shared.menu} data-testid="hm-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play')}
              data-testid="hm-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    category: catName(saved.state),
                    lives: livesLeft(saved.state),
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
                  data-testid={`hm-lang-${l}`}
                >
                  {t(`lang.${l}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.category')}</legend>
            <div className={styles.chips}>
              {(['any', ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.chip}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  data-testid={`hm-cat-${c}`}
                >
                  {t(`cat.${c}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {Object.keys(LEVELS).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                  data-testid={`hm-level-${l}`}
                >
                  {t(`level.${l}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.wins
                ? t('menu.record', { wins: stats.wins, played: stats.played, streak: stats.streak })
                : t('menu.unplayed')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', fixedSeed ?? randomSeed() >>> 0)}
              data-testid="hm-play"
            >
              <Play size={16} /> {t('menu.play')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('play', today() * 10 + LANGS.indexOf(lang), 'any')}
              data-testid="hm-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setMessage('');
                setMode('friend');
              }}
              data-testid="hm-friend-btn"
            >
              <Users size={16} /> {t('menu.friend')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', fixedSeed ?? randomSeed() >>> 0)}
              data-testid="hm-watch"
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
  const lives = levelOf(s).lives;
  const missed = s.guessed.filter((l) => !s.word.includes(l));
  const shown = STROKES - lives + missed.length;
  const patternText = [...s.word].map((c) => (s.guessed.includes(c) ? upper(c) : '_')).join(' ');

  return (
    <div className={shared.play} data-testid="hangman">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="hm-category">
          {catName(s)}
        </span>
        <span className={styles.counter} data-testid="hm-lives">
          {t('lives', { n: livesLeft(s) })}
        </span>
        {mode === 'play' && <span className={styles.counter}>{formatTime(elapsed)}</span>}
      </div>
      <Drawing shown={shown} lost={s.status === 'lost'} />
      <div
        className={styles.word}
        role="img"
        aria-label={t('word.label', { pattern: patternText })}
        data-testid="hm-word"
      >
        {[...s.word].map((c, i) => {
          const open = s.guessed.includes(c);
          return (
            <span
              key={i}
              className={`${styles.slot} ${open ? styles.open : ''} ${over && !open ? styles.reveal : ''}`}
              data-open={open || undefined}
            >
              {open || over ? upper(c) : ''}
            </span>
          );
        })}
      </div>
      <p className={styles.misses} data-testid="hm-misses">
        {missed.length ? t('misses', { letters: missed.map(upper).join(' ') }) : ' '}
      </p>
      <p className={shared.message} data-testid="hm-message" aria-live="polite">
        {message}
      </p>
      {suggestion && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={applyHint}
          data-testid="hm-apply"
        >
          {t('hint.apply', { letter: upper(suggestion) })}
        </button>
      )}
      {active && (
        <div className={styles.keyboard} data-testid="hm-keyboard">
          {[...ALPHABET[s.lang]].map((c) => {
            const used = s.guessed.includes(c);
            const hit = used && s.word.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={`${styles.key} ${used ? (hit ? styles.hit : styles.miss) : ''}`}
                onClick={() => tryLetter(c)}
                disabled={used}
                aria-label={
                  used
                    ? t(hit ? 'key.hit' : 'key.miss', { letter: upper(c) })
                    : t('key.letter', { letter: upper(c) })
                }
                data-testid={`hm-key-${c}`}
              >
                {upper(c)}
              </button>
            );
          })}
        </div>
      )}
      <div className={shared.controls}>
        {active && (
          <button type="button" className="btn" onClick={showHint} data-testid="hm-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(over || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              s.category === 'custom' ? setMode('friend') : fresh(mode, randomSeed() >>> 0)
            }
            data-testid="hm-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="hm-menu-btn">
          {t('menu')}
        </button>
      </div>
      {active && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
