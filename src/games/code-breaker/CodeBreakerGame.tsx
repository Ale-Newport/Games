/**
 * The Code Breaker table: a menu (code size, new or daily code, resume, set a code for the AI,
 * watch the AI), the board of scored guesses under the hidden code, the row being composed (tap a
 * peg slot, then a color), a warning when a guess contradicts an earlier score, explained hints from
 * the minimax breaker, and the AI cracking a code with a running count of the codes that still fit.
 */
import { Bot, Eraser, Lightbulb, Lock, Play, RotateCcw, Send, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { minimaxMove, parseCode } from './ai';
import styles from './CodeBreaker.module.css';
import {
  VARIANTS,
  chooseGuess,
  consistent,
  contradiction,
  isValidCodeBreakerState,
  makeGuess,
  newCodeBreaker,
  secretFor,
  spaceFor,
  variantOf,
  type CodeBreakerState,
} from './engine';
import { COLOR_NAMES, STRINGS } from './i18n';
import { CODE_SOUNDS } from './sounds';

interface Saved {
  state: CodeBreakerState;
}
type Mode = 'menu' | 'play' | 'set' | 'watch';
type Draft = (number | null)[];

const LEVELS = Object.keys(VARIANTS);

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const emptyDraft = (s: { variant: string }): Draft =>
  Array.from({ length: variantOf(s).pegs }, () => null);

/** Every guess fitted all the scores before it. */
export const playedSharp = (s: CodeBreakerState) =>
  s.guesses.every((g, r) => !contradiction(s.guesses.slice(0, r), g.code));

function Peg({ c, label }: { c: number | null; label?: string }) {
  return (
    <span
      className={`${styles.peg} ${c === null ? styles.empty : ''}`}
      data-color={c ?? undefined}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {c === null ? '' : c + 1}
    </span>
  );
}

function Feedback({
  exact,
  near,
  pegs,
  title,
}: {
  exact: number;
  near: number;
  pegs: number;
  title: string;
}) {
  return (
    <span
      className={styles.feedback}
      style={{ ['--fcols' as string]: Math.ceil(pegs / 2) }}
      title={title}
      data-exact={exact}
      data-near={near}
    >
      {Array.from({ length: pegs }, (_, i) => (
        <span
          key={i}
          className={i < exact ? styles.solid : i < exact + near ? styles.hollow : styles.none}
        />
      ))}
    </span>
  );
}

export function CodeBreakerGame({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slotStore = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' && d !== null && isValidCodeBreakerState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [variant, setVariant] = useState('classic');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<CodeBreakerState | null>(null);
  const [draft, setDraft] = useState<Draft>([]);
  const [slot, setSlot] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState<number[] | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const stateRef = useLatest(state);
  const draftRef = useLatest(draft);
  const elapsedRef = useLatest(elapsed);
  const rowsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void slotStore.load().then((d) => {
      if (!cancelled && d && d.state.status === 'playing' && d.state.setter === 'computer')
        setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slotStore]);

  const start = (s: CodeBreakerState, m: Mode) => {
    setState(s);
    setMode(m);
    setVariant(s.variant);
    setDraft(emptyDraft(s));
    setSlot(0);
    setElapsed(s.elapsedMs);
    setSuggestion(null);
    setLeft(null);
    setMessage(m === 'watch' ? t('watch.thinking') : '');
    if (m === 'play') void slotStore.save({ state: s });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => start(newCodeBreaker(variant, fixedSeed ?? randomSeed() >>> 0), 'watch'),
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

  useEffect(() => {
    const el = rowsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state?.guesses.length, mode]);

  const colorName = (c: number) => `${COLOR_NAMES[locale][c]} (${c + 1})`;

  const finished = (s: CodeBreakerState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    const n = s.guesses.length;
    if (s.status === 'won') {
      svc.playSound(CODE_SOUNDS.win);
      setMessage(t(n === 1 ? 'won.one' : 'won', { n, time: formatTime(time) }));
      svc.recordResult({ outcome: 'complete', score: n, timeMs: time, mode: s.variant });
      svc.unlockAchievement('first');
      if (s.variant === 'classic' && n <= 4) svc.unlockAchievement('four');
      if (s.variant === 'hard') svc.unlockAchievement('win-hard');
      if (!s.hints && playedSharp(s)) svc.unlockAchievement('sharp');
    } else {
      svc.playSound(CODE_SOUNDS.lose);
      setMessage(t('lost'));
      svc.recordResult({ outcome: 'fail', mode: s.variant });
    }
    void slotStore.clear();
    setSaved(null);
  };

  const active = mode === 'play' && !!state && state.status === 'playing';
  const composing = active || mode === 'set';

  /** Explains why a full row cannot be the code, or '' when it could be. */
  const warning = (s: CodeBreakerState, code: number[]) => {
    const v = variantOf(s);
    if (!v.repeats && new Set(code).size < code.length) return t('warn.repeat');
    if (mode !== 'play') return '';
    const c = contradiction(s.guesses, code);
    if (!c) return '';
    const g = s.guesses[c.row]!;
    return t('warn.contradiction', {
      row: c.row + 1,
      exact: c.exact,
      near: c.near,
      gotExact: g.exact,
      gotNear: g.near,
    });
  };

  const setPeg = (color: number) => {
    const s = stateRef.current;
    if (!s || !composing) return;
    const d = [...draftRef.current];
    // The selected slot takes the color (overwriting it), then the next empty slot is selected.
    let at = slot;
    d[at] = color;
    servicesRef.current.playSound(CODE_SOUNDS.peg);
    setDraft(d);
    setSuggestion(null);
    const next = d.findIndex((x, i) => x === null && i > at);
    at = next >= 0 ? next : d.findIndex((x) => x === null);
    if (at >= 0) setSlot(at);
    if (d.every((x) => x !== null)) setMessage(warning(s, d as number[]));
    else setMessage('');
  };

  const clearPeg = (i: number) => {
    if (!composing) return;
    const d = [...draftRef.current];
    if (d[i] === null) {
      setSlot(i);
      return;
    }
    d[i] = null;
    servicesRef.current.playSound(CODE_SOUNDS.clear);
    setDraft(d);
    setSlot(i);
    setMessage('');
  };

  const clearAll = () => {
    const s = stateRef.current;
    if (!s || !composing) return;
    setDraft(emptyDraft(s));
    setSlot(0);
    setMessage('');
    setSuggestion(null);
  };

  const check = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    const d = draftRef.current;
    if (d.some((x) => x === null)) {
      setMessage(t('guess.short'));
      return;
    }
    const code = d as number[];
    const v = variantOf(s);
    if (!v.repeats && new Set(code).size < code.length) {
      setMessage(t('warn.repeat'));
      return;
    }
    const next = makeGuess(s, code);
    if (next === s) return;
    const last = next.guesses[next.guesses.length - 1]!;
    servicesRef.current.playSound(last.exact || last.near ? CODE_SOUNDS.score : CODE_SOUNDS.miss);
    setState(next);
    setDraft(emptyDraft(next));
    setSlot(0);
    setSuggestion(null);
    setLeft(null);
    setMessage('');
    if (next.status !== 'playing') finished(next);
    else void slotStore.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(CODE_SOUNDS.hint);
    const d = draftRef.current;
    if (d.every((x) => x !== null)) {
      const w = warning(s, d as number[]);
      if (w) {
        setMessage(t('hint.wrong', { text: w }));
        return;
      }
    }
    const space = spaceFor(variantOf(s));
    const cands = consistent(space, s.guesses);
    const choice = chooseGuess(space, s.guesses, cands);
    const code = space.code(choice.index);
    setSuggestion(code);
    setLeft(cands.length);
    setMessage(
      cands.length === 1
        ? t('hint.one')
        : t(s.guesses.length ? 'hint.many' : 'hint.start', {
            n: cands.length,
            worst: choice.worst,
          }),
    );
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !suggestion || !active) return;
    const next = { ...s, hints: s.hints + 1 };
    setState(next);
    setDraft([...suggestion]);
    setSlot(0);
    setSuggestion(null);
    setMessage('');
    void slotStore.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  // Watch mode: the minimax breaker guesses from the scores only.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(() => {
      const code = parseCode(minimaxMove(state));
      const next = makeGuess(state, code);
      const last = next.guesses[next.guesses.length - 1]!;
      const n = next.guesses.length;
      const fit = consistent(spaceFor(variantOf(next)), next.guesses).length;
      setLeft(fit);
      servicesRef.current.playSound(
        next.status === 'won'
          ? CODE_SOUNDS.win
          : last.exact || last.near
            ? CODE_SOUNDS.score
            : CODE_SOUNDS.miss,
      );
      setMessage(
        next.status === 'won'
          ? t('watch.won', { n })
          : next.status === 'lost'
            ? t('watch.lost')
            : t(fit === 1 ? 'watch.last' : 'watch.step', {
                n,
                exact: last.exact,
                near: last.near,
                left: fit,
              }),
      );
      if (next.status === 'won' && next.setter === 'player' && n >= 5)
        servicesRef.current.unlockAchievement('stump');
      setState(next);
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  const fresh = (m: Mode, level: string, seed: number) => start(newCodeBreaker(level, seed), m);

  const openSet = (level: string) => {
    const s = newCodeBreaker(level, randomSeed() >>> 0);
    setState(s);
    setVariant(level);
    setDraft(emptyDraft(s));
    setSlot(0);
    setLeft(null);
    setSuggestion(null);
    setMessage(t('set.title'));
    setMode('set');
  };

  const launchSet = () => {
    const s = stateRef.current;
    const d = draftRef.current;
    if (!s || d.some((x) => x === null)) {
      setMessage(t('guess.short'));
      return;
    }
    const code = d as number[];
    if (!variantOf(s).repeats && new Set(code).size < code.length) {
      setMessage(t('warn.repeat'));
      return;
    }
    start(newCodeBreaker(s.variant, s.seed, code), 'watch');
  };

  const randomSet = () => {
    const s = stateRef.current;
    if (!s) return;
    setDraft(secretFor(variantOf(s), randomSeed() >>> 0));
    setMessage('');
  };

  useKeyboard((e) => {
    if (!composing || !state) return false;
    const k = e.key.toLowerCase();
    const v = variantOf(state);
    const n = Number(k);
    if (Number.isInteger(n) && n >= 1 && n <= v.symbols) setPeg(n - 1);
    else if (k === 'arrowleft') setSlot((x) => Math.max(0, x - 1));
    else if (k === 'arrowright') setSlot((x) => Math.min(v.pegs - 1, x + 1));
    else if (k === 'backspace' || k === 'delete') {
      const d = draftRef.current;
      const at = d[slot] !== null ? slot : Math.max(0, slot - 1);
      clearPeg(at);
    } else if (k === 'enter') {
      if (mode === 'set') launchSet();
      else check();
    } else if (k === 'h' && mode === 'play') showHint();
    else if (k === 'n' && mode === 'play') fresh('play', state.variant, randomSeed() >>> 0);
    else return false;
    return true;
  });

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && s.status === 'playing') {
      const kept = { state: { ...s, elapsedMs: elapsedRef.current } };
      setSaved(kept);
      void slotStore.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[variant];
    return (
      <div className={shared.menu} data-testid="cb-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play')}
              data-testid="cb-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    variant: t(`variant.${saved.state.variant}`),
                    n: saved.state.guesses.length + 1,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.variant')}</legend>
            <div className={shared.segmented}>
              {LEVELS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={variant === d}
                  onClick={() => setVariant(d)}
                  data-testid={`cb-variant-${d}`}
                >
                  {t(`variant.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`variant.${variant}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', {
                    variant: t(`variant.${variant}`),
                    wins: stats.completions,
                    played: stats.played,
                    best: stats.bestScore ?? 0,
                  })
                : t('menu.unplayed', { variant: t(`variant.${variant}`) })}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', variant, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="cb-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('play', variant, today() * 10 + LEVELS.indexOf(variant))}
              data-testid="cb-daily"
            >
              {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => openSet(variant)}
              data-testid="cb-set"
            >
              <Lock size={16} /> {t('menu.set')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', variant, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="cb-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const v = variantOf(s);
  const over = s.status !== 'playing';
  const showSecret = over || mode === 'watch' || mode === 'set';
  const secretShown = mode === 'set' ? draft : s.secret;

  const draftRow = (
    <div className={`${styles.row} ${styles.current}`} data-testid="cb-draft">
      <span className={styles.num}>{mode === 'set' ? '' : s.guesses.length + 1}</span>
      <span className={styles.pegs}>
        {draft.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.slot} ${slot === i ? styles.selected : ''}`}
            onClick={() => (slot === i ? clearPeg(i) : setSlot(i))}
            aria-label={t('slot', { n: i + 1, color: c === null ? t('empty') : colorName(c) })}
            aria-pressed={slot === i}
            data-testid={`cb-slot-${i}`}
          >
            <Peg c={c} />
          </button>
        ))}
      </span>
      <span className={styles.feedbackSpace} />
    </div>
  );

  return (
    <div className={shared.play} data-testid="code-breaker">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="cb-count">
          {mode === 'set'
            ? t(`variant.${s.variant}`)
            : t('guessCount', {
                n: Math.min(s.guesses.length + (over ? 0 : 1), v.maxGuesses),
                max: v.maxGuesses,
              })}
        </span>
        {mode === 'play' && (
          <span className={styles.counter} data-testid="cb-time">
            {formatTime(elapsed)}
          </span>
        )}
        {mode === 'watch' && left !== null && (
          <span className={styles.counter} data-testid="cb-left">
            {t('left', { n: left })}
          </span>
        )}
      </div>
      <div className={styles.board} data-variant={s.variant}>
        <div className={`${styles.row} ${styles.secret}`} data-testid="cb-secret">
          <span className={styles.num}>
            <Lock size={14} aria-label={t('secret')} />
          </span>
          <span className={styles.pegs}>
            {secretShown.map((c, i) =>
              showSecret ? (
                <Peg
                  key={i}
                  c={c}
                  label={t('slot', { n: i + 1, color: c === null ? t('empty') : colorName(c) })}
                />
              ) : (
                <span
                  key={i}
                  className={`${styles.peg} ${styles.hiddenPeg}`}
                  aria-label={t('secret.peg', { n: i + 1 })}
                  role="img"
                >
                  ?
                </span>
              ),
            )}
          </span>
          <span className={styles.feedbackSpace} />
        </div>
        {mode !== 'set' && (
          <div className={styles.rows} ref={rowsRef} data-testid="cb-rows">
            {s.guesses.map((g, r) => (
              <div
                key={r}
                className={styles.row}
                data-testid={`cb-row-${r}`}
                aria-label={t('row.label', {
                  n: r + 1,
                  code: g.code.map((c) => COLOR_NAMES[locale][c]).join(', '),
                  exact: g.exact,
                  near: g.near,
                })}
              >
                <span className={styles.num}>{r + 1}</span>
                <span className={styles.pegs}>
                  {g.code.map((c, i) => (
                    <Peg key={i} c={c} />
                  ))}
                </span>
                <Feedback
                  exact={g.exact}
                  near={g.near}
                  pegs={v.pegs}
                  title={t('feedback.title', { exact: g.exact, near: g.near })}
                />
              </div>
            ))}
            {active && draftRow}
          </div>
        )}
        {mode === 'set' && draftRow}
      </div>
      {composing && (
        <div className={styles.palette} role="group" aria-label={t('menu.variant')}>
          {Array.from({ length: v.symbols }, (_, c) => (
            <button
              key={c}
              type="button"
              className={styles.paletteBtn}
              onClick={() => setPeg(c)}
              aria-label={t('color', { n: colorName(c) })}
              data-testid={`cb-color-${c}`}
              disabled={!v.repeats && draft.includes(c) && draft[slot] !== c}
            >
              <Peg c={c} />
            </button>
          ))}
        </div>
      )}
      <p className={shared.message} data-testid="cb-message" aria-live="polite">
        {message}
      </p>
      {suggestion && active && (
        <div className={styles.suggestion}>
          <span className={styles.pegs}>
            {suggestion.map((c, i) => (
              <Peg key={i} c={c} />
            ))}
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={applyHint}
            data-testid="cb-apply"
          >
            {t('hint.apply')}
          </button>
        </div>
      )}
      <div className={shared.controls}>
        {active && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={check}
              disabled={draft.some((x) => x === null)}
              data-testid="cb-check"
            >
              <Send size={16} /> {t('check')}
            </button>
            <button type="button" className="btn" onClick={clearAll} data-testid="cb-clear">
              <Eraser size={16} /> {t('clear')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="cb-hint">
              <Lightbulb size={16} /> {t('hint')}
              {left !== null ? ` · ${left}` : ''}
            </button>
          </>
        )}
        {mode === 'set' && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={launchSet}
              disabled={draft.some((x) => x === null)}
              data-testid="cb-set-go"
            >
              <Bot size={16} /> {t('set.go')}
            </button>
            <button type="button" className="btn" onClick={randomSet} data-testid="cb-set-random">
              <Shuffle size={16} /> {t('set.random')}
            </button>
          </>
        )}
        {(over || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              mode === 'watch' && s.setter === 'player'
                ? openSet(s.variant)
                : fresh(mode, s.variant, randomSeed() >>> 0)
            }
            data-testid="cb-again"
          >
            <RotateCcw size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="cb-menu-btn">
          {t('menu')}
        </button>
      </div>
      <p className={shared.hintText}>
        {t('legend')}
        {!v.repeats ? ` · ${t('noRepeats')}` : ''}
      </p>
      {composing && <p className={shared.hintText}>{t('keys', { n: v.symbols })}</p>}
    </div>
  );
}
