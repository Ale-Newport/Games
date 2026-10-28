/**
 * The Bulls and Cows table: a menu (3, 4 or 5 digits; crack the number, today's number, a duel
 * against an easy, medium or hard computer, watch the AI, resume), the number pad, the scored
 * guesses (two columns in the duel), notes on each digit, a warning when a guess contradicts an
 * earlier score, and explained hints from the breaker.
 */
import { Bot, Delete, Lightbulb, Play, RotateCcw, Send, Shuffle, Swords } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { MOVES, parseCode } from './ai';
import styles from './Bulls.module.css';
import {
  VARIANTS,
  chooseGuess,
  consistent,
  contradiction,
  isValidBullsState,
  makeGuess,
  newBulls,
  secretFor,
  spaceFor,
  variantOf,
  type BullsState,
  type Scored,
} from './engine';
import { STRINGS } from './i18n';
import { BULLS_SOUNDS } from './sounds';

type Level = keyof typeof MOVES;
interface Saved {
  state: BullsState;
  level: Level;
}
type Mode = 'menu' | 'solo' | 'pick' | 'duel' | 'watch';

const LEVELS = Object.keys(MOVES) as Level[];
const SIZES = Object.keys(VARIANTS);

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const isLevel = (x: unknown): x is Level => typeof x === 'string' && LEVELS.includes(x as Level);

function Score({ g, bull, cow, label }: { g: Scored; bull: string; cow: string; label: string }) {
  return (
    <span className={styles.score} aria-label={label}>
      <span className={`${styles.chip} ${g.exact ? styles.bull : styles.zero}`}>
        {g.exact}
        {bull}
      </span>
      <span className={`${styles.chip} ${g.near ? styles.cow : styles.zero}`}>
        {g.near}
        {cow}
      </span>
    </span>
  );
}

export function BullsGame({ services }: { services: GameServices }) {
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
          isLevel((d as Saved).level) &&
          isValidBullsState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [variant, setVariant] = useState('four');
  const [level, setLevel] = useState<Level>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<BullsState | null>(null);
  const [entry, setEntry] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState<number[] | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useLatest(state);
  const entryRef = useLatest(entry);
  const elapsedRef = useLatest(elapsed);
  const levelRef = useLatest(level);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.status === 'playing') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const persist = (s: BullsState) => {
    if (s.status === 'playing')
      void slot.save({ state: { ...s, elapsedMs: elapsedRef.current }, level: levelRef.current });
  };

  const start = (s: BullsState, m: Mode, lvl: Level = levelRef.current) => {
    setState(s);
    setMode(m);
    setVariant(s.variant);
    setLevel(lvl);
    setEntry([]);
    setSuggestion(null);
    setLeft(null);
    setElapsed(s.elapsedMs);
    setMessage(m === 'duel' ? t(s.turn === 0 ? 'turn.you' : 'turn.ai') : '');
    if (m === 'solo' || m === 'duel') void slot.save({ state: s, level: lvl });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => start(newBulls(variant, 'solo', fixedSeed ?? randomSeed() >>> 0), 'watch'),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if ((mode !== 'solo' && mode !== 'duel') || !state || state.status !== 'playing') return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state]);

  const moves = state ? state.guesses[0]!.length + (state.guesses[1]?.length ?? 0) : 0;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [moves]);

  const show = (code: readonly number[]) => code.join('');

  const finish = (s: BullsState) => {
    const svc = servicesRef.current;
    const n = s.guesses[0]!.length;
    if (s.mode === 'solo') {
      if (s.winner === 0) {
        svc.playSound(BULLS_SOUNDS.win);
        setMessage(t('won', { n, time: formatTime(elapsedRef.current) }));
        svc.recordResult({
          outcome: 'complete',
          score: n,
          timeMs: elapsedRef.current,
          mode: `solo-${s.variant}`,
        });
        svc.unlockAchievement('first');
        if (s.variant === 'four' && n <= 5) svc.unlockAchievement('quick');
        if (s.variant === 'five') svc.unlockAchievement('five');
      } else {
        svc.playSound(BULLS_SOUNDS.lose);
        setMessage(t('lost', { code: show(s.secrets[0]!) }));
        svc.recordResult({ outcome: 'fail', mode: `solo-${s.variant}` });
      }
    } else {
      const lvl = levelRef.current;
      if (s.winner === 0) {
        svc.playSound(BULLS_SOUNDS.win);
        setMessage(t('duel.won', { n }));
        svc.recordResult({ outcome: 'win', mode: `duel-${lvl}` });
        svc.unlockAchievement('duel-win');
        if (lvl === 'hard') svc.unlockAchievement('duel-hard');
      } else if (s.winner === 1) {
        svc.playSound(BULLS_SOUNDS.lose);
        setMessage(t('duel.lost', { n: s.guesses[1]!.length, code: show(s.secrets[0]!) }));
        svc.recordResult({ outcome: 'loss', mode: `duel-${lvl}` });
      } else {
        svc.playSound(BULLS_SOUNDS.score);
        const both = s.guesses[0]!.some((g) => g.exact === variantOf(s).pegs);
        setMessage(both ? t('duel.draw', { n }) : t('duel.drawOut'));
        svc.recordResult({ outcome: 'draw', mode: `duel-${lvl}` });
      }
    }
    void slot.clear();
    setSaved(null);
  };

  const playing = (mode === 'solo' || mode === 'duel') && !!state && state.status === 'playing';
  const myTurn = playing && state.turn === 0;
  const composing = myTurn || mode === 'pick';

  const warning = (s: BullsState, code: number[]) => {
    const c = contradiction(s.guesses[0]!, code);
    if (!c) return '';
    const g = s.guesses[0]![c.row]!;
    return t('warn.contradiction', {
      row: c.row + 1,
      bulls: c.exact,
      cows: c.near,
      gotBulls: g.exact,
      gotCows: g.near,
    });
  };

  const type = (d: number) => {
    const s = stateRef.current;
    if (!s || !composing) return;
    const e = entryRef.current;
    const v = variantOf(s);
    if (e.length >= v.pegs || e.includes(d)) return;
    const next = [...e, d];
    servicesRef.current.playSound(BULLS_SOUNDS.key);
    setEntry(next);
    setSuggestion(null);
    setMessage(next.length === v.pegs && mode !== 'pick' ? warning(s, next) : '');
  };

  const back = () => {
    if (!composing) return;
    setEntry((e) => e.slice(0, -1));
    setMessage('');
  };

  const submit = () => {
    const s = stateRef.current;
    if (!s) return;
    const e = entryRef.current;
    const v = variantOf(s);
    if (e.length !== v.pegs) {
      setMessage(t('guess.short', { n: v.pegs }));
      return;
    }
    if (mode === 'pick') {
      start(newBulls(s.variant, 'duel', s.seed, e), 'duel');
      return;
    }
    if (!myTurn) return;
    const next = makeGuess(s, e);
    if (next === s) return;
    const g = next.guesses[0]![next.guesses[0]!.length - 1]!;
    servicesRef.current.playSound(g.exact || g.near ? BULLS_SOUNDS.score : BULLS_SOUNDS.miss);
    setState(next);
    setEntry([]);
    setSuggestion(null);
    setLeft(null);
    if (next.status === 'done') finish(next);
    else {
      setMessage(next.mode === 'duel' ? (g.exact === v.pegs ? t('ai.last') : t('turn.ai')) : '');
      persist(next);
    }
  };

  const toggleNote = (d: number) => {
    const s = stateRef.current;
    if (!s || !playing) return;
    const notes = s.notes.map((n, i) => (i === d ? (n + 1) % 3 : n));
    const next = { ...s, notes };
    setState(next);
    persist(next);
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !myTurn || s.mode !== 'solo') return;
    servicesRef.current.playSound(BULLS_SOUNDS.hint);
    const e = entryRef.current;
    if (e.length === variantOf(s).pegs) {
      const w = warning(s, e);
      if (w) {
        setMessage(t('hint.wrong', { text: w }));
        return;
      }
    }
    const space = spaceFor(variantOf(s));
    const cands = consistent(space, s.guesses[0]!);
    const choice = chooseGuess(space, s.guesses[0]!, cands, undefined, 'expected');
    setSuggestion(space.code(choice.index));
    setLeft(cands.length);
    setMessage(
      cands.length === 1
        ? t('hint.one')
        : s.guesses[0]!.length
          ? t('hint.many', { n: cands.length, avg: choice.expected.toFixed(1) })
          : t('hint.start', { n: cands.length }),
    );
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !suggestion || !myTurn) return;
    const next = { ...s, hints: s.hints + 1 };
    setState(next);
    setEntry([...suggestion]);
    setSuggestion(null);
    setMessage('');
    persist(next);
  };

  // The computer's turn in the duel.
  useEffect(() => {
    if (mode !== 'duel' || !state || state.status !== 'playing' || state.turn !== 1) return;
    const id = window.setTimeout(() => {
      const rng = new Rng((state.seed ^ (state.guesses[1]!.length * 7919)) >>> 0);
      const next = makeGuess(state, parseCode(MOVES[level](state, rng)));
      const g = next.guesses[1]![next.guesses[1]!.length - 1]!;
      servicesRef.current.playSound(g.exact || g.near ? BULLS_SOUNDS.score : BULLS_SOUNDS.miss);
      setState(next);
      if (next.status === 'done') finish(next);
      else {
        setMessage(
          `${t('ai.scored', { code: show(g.code), bulls: g.exact, cows: g.near })} ${t('turn.you')}`,
        );
        persist(next);
      }
    }, 800);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  // Watch mode: the breaker cracks a number on its own.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(() => {
      const next = makeGuess(state, parseCode(MOVES.hard(state)));
      const g = next.guesses[0]![next.guesses[0]!.length - 1]!;
      const fit = consistent(spaceFor(variantOf(next)), next.guesses[0]!).length;
      setLeft(fit);
      servicesRef.current.playSound(
        next.status === 'done'
          ? BULLS_SOUNDS.win
          : g.exact || g.near
            ? BULLS_SOUNDS.score
            : BULLS_SOUNDS.miss,
      );
      const vars = { code: show(g.code), bulls: g.exact, cows: g.near, left: fit };
      setMessage(
        next.status === 'done'
          ? t('watch.won', { n: next.guesses[0]!.length })
          : t(fit === 1 ? 'watch.last' : 'watch.step', vars),
      );
      setState(next);
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  const openPick = () => {
    const s = newBulls(variant, 'duel', fixedSeed ?? randomSeed() >>> 0);
    setState(s);
    setEntry([]);
    setSuggestion(null);
    setLeft(null);
    setMessage(t('pick.title'));
    setMode('pick');
  };

  const fresh = (m: 'solo' | 'watch', size: string, seed: number) =>
    start(newBulls(size, 'solo', seed), m);

  useKeyboard((e) => {
    if (!state || (mode !== 'solo' && mode !== 'duel' && mode !== 'pick')) return false;
    const k = e.key.toLowerCase();
    if (/^[0-9]$/.test(k)) type(Number(k));
    else if (k === 'backspace' || k === 'delete') back();
    else if (k === 'enter') submit();
    else if (k === 'h' && mode === 'solo') showHint();
    else if (k === 'n' && mode === 'solo') fresh('solo', state.variant, randomSeed() >>> 0);
    else return false;
    return true;
  });

  const toMenu = () => {
    const s = stateRef.current;
    if ((mode === 'solo' || mode === 'duel') && s && s.status === 'playing') {
      const kept = { state: { ...s, elapsedMs: elapsedRef.current }, level: levelRef.current };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const stats = services.getStats();
    const solo = stats?.modes[`solo-${variant}`];
    const duel = stats?.modes[`duel-${level}`];
    return (
      <div className={shared.menu} data-testid="bc-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, saved.state.mode, saved.level)}
              data-testid="bc-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t(saved.state.mode === 'solo' ? 'menu.resumeSolo' : 'menu.resumeDuel', {
                    variant: `${t(`variant.${saved.state.variant}`)} · ${t(`level.${saved.level}`)}`,
                    n: saved.state.guesses[0]!.length + 1,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.digits')}</legend>
            <div className={shared.segmented}>
              {SIZES.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={variant === d}
                  onClick={() => setVariant(d)}
                  data-testid={`bc-size-${d}`}
                >
                  {t(`variant.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`variant.${variant}.hint`)}</p>
            <p className={shared.hintText}>
              {solo?.completions
                ? t('menu.record', {
                    wins: solo.completions,
                    played: solo.played,
                    best: solo.bestScore ?? 0,
                  })
                : t('menu.unplayed')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('solo', variant, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="bc-solo"
            >
              <Play size={16} /> {t('menu.solo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('solo', variant, today() * 10 + SIZES.indexOf(variant))}
              data-testid="bc-daily"
            >
              {t('menu.daily')}
            </button>
          </div>
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                  data-testid={`bc-level-${l}`}
                >
                  {t(`level.${l}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
            {duel?.played ? (
              <p className={shared.hintText}>
                {t('menu.duelRecord', { wins: duel.wins, losses: duel.losses, draws: duel.draws })}
              </p>
            ) : null}
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openPick}
              data-testid="bc-duel"
            >
              <Swords size={16} /> {t('menu.duel')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', variant, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="bc-watch"
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
  const over = s.status === 'done';
  const pegs = Array.from({ length: v.pegs }, (_, i) => i);

  const column = (p: number, title: string, testid: string) => (
    <div className={styles.column} data-testid={testid}>
      <h3 className={styles.colTitle}>{title}</h3>
      {s.guesses[p]!.map((g, r) => (
        <div
          key={r}
          className={styles.row}
          data-testid={`${testid}-row-${r}`}
          aria-label={t('row.label', {
            n: r + 1,
            code: show(g.code),
            bulls: g.exact,
            cows: g.near,
          })}
        >
          <span className={styles.num}>{r + 1}</span>
          <span className={styles.code}>{show(g.code)}</span>
          <Score
            g={g}
            bull={t('bull')}
            cow={t('cow')}
            label={t('score.label', { bulls: g.exact, cows: g.near })}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className={shared.play} data-testid="bulls">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="bc-count">
          {mode === 'pick'
            ? t('yourNumber')
            : t('guessCount', {
                n: Math.min(s.guesses[0]!.length + (over ? 0 : 1), v.maxGuesses),
                max: v.maxGuesses,
              })}
        </span>
        {(mode === 'solo' || mode === 'duel') && (
          <span className={styles.counter}>{formatTime(elapsed)}</span>
        )}
        {mode === 'watch' && left !== null && (
          <span className={styles.counter} data-testid="bc-left">
            {left}
          </span>
        )}
      </div>
      {mode === 'duel' && (
        <div className={styles.secrets}>
          <span>
            {t('hiddenNumber')}:{' '}
            <strong className={styles.code} data-testid="bc-hidden">
              {over ? show(s.secrets[0]!) : '?'.repeat(v.pegs)}
            </strong>
          </span>
          <span>
            {t('yourNumber')}:{' '}
            <strong className={styles.code} data-testid="bc-mine">
              {show(s.secrets[1]!)}
            </strong>
          </span>
        </div>
      )}
      {mode !== 'pick' && (
        <div
          className={`${styles.history} ${mode === 'duel' ? styles.duel : ''}`}
          ref={listRef}
          data-testid="bc-history"
        >
          {column(0, mode === 'duel' ? t('you') : t('entry'), 'bc-you')}
          {mode === 'duel' && column(1, t('ai'), 'bc-ai')}
        </div>
      )}
      {composing && (
        <div className={styles.entry} aria-label={t('entry')} data-testid="bc-entry">
          {pegs.map((i) => (
            <span
              key={i}
              className={`${styles.box} ${i === entry.length ? styles.caret : ''}`}
              aria-label={t('entry.digit', { n: i + 1, d: entry[i] ?? t('entry.empty') })}
              role="img"
            >
              {entry[i] ?? ''}
            </span>
          ))}
        </div>
      )}
      {composing && (
        <div className={styles.pad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              type="button"
              className={styles.key}
              onClick={() => type(d)}
              disabled={entry.includes(d) || entry.length >= v.pegs}
              aria-label={t('key.digit', { d })}
              data-testid={`bc-key-${d}`}
              data-note={mode === 'pick' ? undefined : s.notes[d] || undefined}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className={styles.key}
            onClick={back}
            aria-label={t('key.back')}
            data-testid="bc-back"
          >
            <Delete size={20} />
          </button>
          <button
            type="button"
            className={styles.key}
            onClick={() => type(0)}
            disabled={entry.includes(0) || entry.length >= v.pegs}
            aria-label={t('key.digit', { d: 0 })}
            data-testid="bc-key-0"
            data-note={mode === 'pick' ? undefined : s.notes[0] || undefined}
          >
            0
          </button>
          <button
            type="button"
            className={`${styles.key} ${styles.enter}`}
            onClick={submit}
            disabled={entry.length !== v.pegs}
            aria-label={t('key.enter')}
            data-testid="bc-enter"
          >
            <Send size={20} />
          </button>
        </div>
      )}
      {playing && (
        <div className={styles.notes} role="group" aria-label={t('notes')}>
          <span className={shared.hintText}>{t('notes')}</span>
          <div className={styles.noteRow}>
            {s.notes.map((n, d) => (
              <button
                key={d}
                type="button"
                className={styles.note}
                data-note={n || undefined}
                onClick={() => toggleNote(d)}
                aria-label={t(`note.${n}`, { d })}
                data-testid={`bc-note-${d}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className={shared.message} data-testid="bc-message" aria-live="polite">
        {message}
      </p>
      {suggestion && myTurn && (
        <div className={styles.suggestion}>
          <span className={styles.code}>{show(suggestion)}</span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={applyHint}
            data-testid="bc-apply"
          >
            {t('hint.apply')}
          </button>
        </div>
      )}
      <div className={shared.controls}>
        {myTurn && mode === 'solo' && (
          <button type="button" className="btn" onClick={showHint} data-testid="bc-hint">
            <Lightbulb size={16} /> {t('hint')}
            {left !== null ? ` · ${left}` : ''}
          </button>
        )}
        {mode === 'pick' && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={entry.length !== v.pegs}
              data-testid="bc-pick-go"
            >
              <Swords size={16} /> {t('pick.go')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setEntry(secretFor(v, randomSeed() >>> 0))}
              data-testid="bc-pick-random"
            >
              <Shuffle size={16} /> {t('pick.random')}
            </button>
          </>
        )}
        {(over || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              mode === 'duel'
                ? openPick()
                : fresh(mode === 'watch' ? 'watch' : 'solo', s.variant, randomSeed() >>> 0)
            }
            data-testid="bc-again"
          >
            <RotateCcw size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="bc-menu-btn">
          {t('menu')}
        </button>
      </div>
      <p className={shared.hintText}>{t('legend')}</p>
      {composing && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
