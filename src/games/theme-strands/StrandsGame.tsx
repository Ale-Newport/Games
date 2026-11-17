/**
 * The Theme Strands table: the theme card, the 6×8 letter grid drawn in SVG with found answers
 * joined by coloured strands (blue theme words, yellow spangram), the current trace, the hint meter
 * and button, feedback, and the end screen with the share line. Trace by dragging, by tapping
 * letters (tap the last letter again to submit) or with the keyboard (arrows, Space, Enter,
 * Backspace).
 */
import { Bot, CalendarDays, Copy, Lightbulb, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { findPaths } from './ai';
import { loadDictionary } from './dictionary';
import {
  COLS,
  ROWS,
  WORDS_PER_HINT,
  adjacent,
  answers,
  dailyPuzzle,
  gameNumber,
  isValidState,
  letterAt,
  newGame,
  puzzleById,
  puzzlesFor,
  shareLine,
  submitPath,
  usedCells,
  takeHint,
  type StrandsState,
  type SubmitResult,
} from './engine';
import { STRINGS } from './i18n';
import { STRANDS_SOUNDS } from './sounds';
import styles from './Strands.module.css';

interface Saved {
  state: StrandsState | null;
  results: Record<string, number>;
}

const CELL = 56;
const cx = (c: number) => (c % COLS) * CELL + CELL / 2;
const cy = (c: number) => Math.floor(c / COLS) * CELL + CELL / 2;
const pathD = (path: readonly number[]) =>
  path.map((c, i) => `${i ? 'L' : 'M'}${cx(c)} ${cy(c)}`).join(' ');

export function StrandsGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (
    s: StrandsState,
    unlock: (id: string) => void,
    results: Record<string, number>,
  ) => void;
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
          typeof (d as Saved).results === 'object',
      }),
    [services],
  );
  const [mode, setMode] = useState<'menu' | 'play' | 'watch'>(
    services.launchParams.mode === 'watch' ? 'watch' : 'menu',
  );
  const [lang, setLang] = useState<'en' | 'es'>(locale === 'es' ? 'es' : 'en');
  const [saved, setSaved] = useState<Saved>({ state: null, results: {} });
  const [state, setStateRaw] = useState<StrandsState | null>(null);
  const [dicts, setDicts] = useState<Partial<Record<'en' | 'es', Set<string>>>>({});
  const [trace, setTrace] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: SubmitResult; word: string } | null>(null);
  const [cursor, setCursor] = useState(0);
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<StrandsState | null>(null);
  /** Cells entered by dragging during the current press (a tap enters none). */
  const draggedRef = useRef(0);
  const traceRef = useLatest(trace);
  const savedRef = useLatest(saved);
  const setState = (s: StrandsState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSaved(d));
    return () => {
      alive = false;
    };
  }, [slot]);

  const puzzleLang = state ? puzzleById(state.puzzleId).lang : lang;
  const dict = dicts[puzzleLang] ?? null;
  useEffect(() => {
    if (dicts[puzzleLang]) return;
    let alive = true;
    void loadDictionary(puzzleLang).then(
      (d) => alive && setDicts((x) => ({ ...x, [puzzleLang]: d })),
    );
    return () => {
      alive = false;
    };
  }, [puzzleLang, dicts]);

  const persist = (patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    setSaved(next);
    void slot.save(next);
  };

  const start = (id: string, m: 'play' | 'watch', resume?: StrandsState) => {
    const s = resume ?? newGame(puzzleById(id));
    setState(s);
    setMode(m);
    setTrace([]);
    setFeedback(null);
    setCopied(false);
    if (m === 'play') persist({ state: s });
  };

  useEffect(() => {
    if (mode === 'watch' && !state) {
      const id = window.setTimeout(() => start(dailyPuzzle(lang, gameNumber()).id, 'watch'), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (path: number[]) => {
    const s = stateRef.current;
    setTrace([]);
    if (!s || path.length === 0) return;
    // Theme words never need the dictionary; extra words wait until it has loaded.
    const { state: next, result, word } = submitPath(s, path, (w) => dict?.has(w) ?? false);
    const svc = servicesRef.current;
    svc.playSound(
      result === 'spangram'
        ? STRANDS_SOUNDS.spangram
        : result === 'theme'
          ? STRANDS_SOUNDS.theme
          : result === 'hint-word'
            ? STRANDS_SOUNDS.extra
            : STRANDS_SOUNDS.bad,
    );
    setFeedback({ kind: result, word });
    if (next === s) return;
    setState(next);
    if (next.status === 'won') {
      svc.playSound(STRANDS_SOUNDS.win);
      if (mode === 'play') {
        const results = { ...savedRef.current.results, [next.puzzleId]: next.hintsUsed };
        persist({ state: null, results });
        svc.recordResult({
          outcome: 'complete',
          score: next.hintsUsed,
          mode: puzzleById(next.puzzleId).lang,
        });
        onFinish(next, (id) => svc.unlockAchievement(id), results);
      }
    } else if (mode === 'play') persist({ state: next });
  };

  const extend = (cell: number) => {
    const s = stateRef.current;
    if (!s || s.status !== 'playing' || usedCells(s).has(cell)) return;
    const cur = traceRef.current;
    if (cur.length && cur[cur.length - 1] === cell) return;
    if (cur.length > 1 && cur[cur.length - 2] === cell) {
      setTrace(cur.slice(0, -1));
      return;
    }
    if (cur.includes(cell)) return;
    if (cur.length === 0 || adjacent(cur[cur.length - 1]!, cell)) setTrace([...cur, cell]);
    else setTrace([cell]);
  };

  const onDown = (cell: number, e: RPointerEvent) => {
    if (mode !== 'play') return;
    // Touch input captures the pointer on the first cell; release it so the drag reaches others.
    const el = e.target as Element;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    const cur = traceRef.current;
    if (cur.length && cur[cur.length - 1] === cell) {
      commit(cur);
      return;
    }
    draggedRef.current = 0;
    setDragging(true);
    extend(cell);
  };

  useEffect(() => {
    if (!dragging) return;
    const up = () => {
      setDragging(false);
      const cur = traceRef.current;
      // Releasing after a drag submits; releasing after a tap keeps building the trace.
      if (draggedRef.current > 0 && cur.length >= 2) commit(cur);
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  useKeyboard((e) => {
    if (mode !== 'play' || !stateRef.current) return false;
    const k = e.key;
    const r = Math.floor(cursor / COLS);
    const c = cursor % COLS;
    if (k === 'ArrowRight') setCursor(r * COLS + Math.min(COLS - 1, c + 1));
    else if (k === 'ArrowLeft') setCursor(r * COLS + Math.max(0, c - 1));
    else if (k === 'ArrowDown') setCursor(Math.min(ROWS - 1, r + 1) * COLS + c);
    else if (k === 'ArrowUp') setCursor(Math.max(0, r - 1) * COLS + c);
    else if (k === ' ') extend(cursor);
    else if (k === 'Enter') commit(traceRef.current);
    else if (k === 'Backspace') setTrace((tr) => tr.slice(0, -1));
    else if (k === 'Escape') setTrace([]);
    else return false;
    return true;
  }, mode === 'play');

  const hint = () => {
    const s = stateRef.current;
    if (!s) return;
    servicesRef.current.playSound(STRANDS_SOUNDS.hint);
    const next = takeHint(s);
    setState(next);
    if (mode === 'play') persist({ state: next });
  };

  // Watch: the word finder traces its best word every second (longest first, hints when ready).
  useEffect(() => {
    if (mode !== 'watch' || !dict || !state || state.status !== 'playing') return;
    const id = window.setTimeout(() => {
      const s = stateRef.current!;
      if (s.progress >= WORDS_PER_HINT && !s.hint) {
        hint();
        return;
      }
      const p = puzzleById(s.puzzleId);
      const target = s.hint ? p.paths[s.hint.word]! : null;
      const options = findPaths(s, dict).filter((path) => {
        const r = submitPath(s, path, (w) => dict.has(w)).result;
        return r === 'theme' || r === 'spangram' || r === 'hint-word';
      });
      options.sort((a, b) => b.length - a.length);
      const path = target ?? options[0];
      if (!path) {
        hint();
        return;
      }
      setTrace(path);
      window.setTimeout(() => commit(path), 500);
    }, 1100);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, dict, state?.found.length, state?.extraWords.length, state?.hint?.word, state?.status]);

  // ---------------------------------------------------------------- menu
  if (mode === 'menu' || !state) {
    const today = dailyPuzzle(lang, gameNumber());
    const resume = saved.state && saved.state.status === 'playing' ? saved.state : null;
    return (
      <div className={shared.menu} data-testid="ts-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume.puzzleId, 'play', resume)}
              data-testid="ts-resume"
            >
              <RotateCcw size={16} /> <span>{t('menu.resume')}</span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.lang')}</legend>
            <div className={shared.segmented}>
              {(['en', 'es'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  data-testid={`ts-lang-${l}`}
                >
                  {l === 'en' ? 'English' : 'Español'}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(today.id, 'play')}
              data-testid="ts-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(today.id, 'watch')}
              data-testid="ts-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
          <fieldset className={shared.group}>
            <legend>{t('menu.pick')}</legend>
            <div className={styles.picker}>
              {puzzlesFor(lang).map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.pick}
                  data-done={saved.results[p.id] !== undefined}
                  onClick={() => start(p.id, 'play')}
                  data-testid={`ts-pick-${p.id}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- play
  const s = state;
  const p = puzzleById(s.puzzleId);
  const total = answers(p).length;
  const traced = trace.map((c) => letterAt(p, c)).join('');
  const hintCells = s.hint ? p.paths[s.hint.word]! : [];
  const over = s.status === 'won';

  return (
    <div className={styles.wrap} data-testid="ts-play">
      <div className={styles.theme}>
        <span>{t('play.theme')}</span>
        <strong data-testid="ts-clue">{p.clue}</strong>
      </div>
      <p className={styles.count} data-testid="ts-count">
        {t('play.count', { found: s.found.length, total })}
      </p>
      <p className={styles.current} data-testid="ts-current" data-kind={feedback?.kind ?? 'none'}>
        {traced ||
          (feedback
            ? ['theme', 'spangram', 'hint-word'].includes(feedback.kind)
              ? feedback.word
              : ''
            : ' ')}
      </p>
      <p className={styles.feedback} aria-live="polite" data-testid="ts-feedback">
        {feedback && !traced ? t(`fb.${feedback.kind}`, { word: feedback.word }) : ' '}
      </p>
      <svg
        className={styles.grid}
        viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
        role="grid"
        aria-label={t('play.grid')}
        data-dict={dict ? 'ready' : 'loading'}
        data-testid="ts-grid"
        onPointerLeave={() => dragging && setDragging(false)}
      >
        {s.found.map((w) => (
          <path
            key={w}
            d={pathD(p.paths[w]!)}
            className={w === p.spangram ? styles.spanLine : styles.themeLine}
          />
        ))}
        {trace.length > 1 && <path d={pathD(trace)} className={styles.traceLine} />}
        {Array.from({ length: COLS * ROWS }, (_, c) => {
          const word = s.found.find((w) => p.paths[w]!.includes(c));
          const state = word
            ? word === p.spangram
              ? 'span'
              : 'theme'
            : trace.includes(c)
              ? 'trace'
              : 'free';
          const hintIndex = hintCells.indexOf(c);
          return (
            <g
              key={c}
              className={styles.cell}
              data-state={state}
              data-cursor={mode === 'play' && c === cursor}
              onPointerDown={(e) => onDown(c, e)}
              onPointerEnter={() => {
                if (!dragging) return;
                draggedRef.current++;
                extend(c);
              }}
              role="gridcell"
              aria-label={letterAt(p, c)}
              data-testid={`ts-cell-${c}`}
            >
              <circle cx={cx(c)} cy={cy(c)} r={CELL * 0.4} />
              {hintIndex >= 0 && !word && (
                <circle cx={cx(c)} cy={cy(c)} r={CELL * 0.46} className={styles.hintRing} />
              )}
              <text x={cx(c)} y={cy(c)} dy="0.35em">
                {letterAt(p, c)}
              </text>
              {hintIndex >= 0 && s.hint?.spelled && !word && (
                <text x={cx(c) + CELL * 0.3} y={cy(c) - CELL * 0.26} className={styles.order}>
                  {hintIndex + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {!over && (
        <div className={shared.controls}>
          <button
            type="button"
            className={`btn ${styles.hintBtn}`}
            style={
              {
                '--fill': `${Math.min(1, s.progress / WORDS_PER_HINT) * 100}%`,
              } as React.CSSProperties
            }
            onClick={hint}
            disabled={mode === 'watch' || s.progress < WORDS_PER_HINT || s.hint?.spelled === true}
            data-testid="ts-hint"
          >
            <Lightbulb size={16} /> {t('play.hint')} ({Math.min(s.progress, WORDS_PER_HINT)}/
            {WORDS_PER_HINT})
          </button>
          {mode === 'play' && (
            <button
              type="button"
              className="btn"
              onClick={() => commit(trace)}
              disabled={trace.length < 2}
              data-testid="ts-submit"
            >
              {t('play.submit')}
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              setState(null);
              setMode('menu');
            }}
            data-testid="ts-menu-btn"
          >
            {t('play.menu')}
          </button>
        </div>
      )}
      {over && (
        <div className={styles.result} data-testid="ts-result">
          <strong>{s.hintsUsed ? t('end.hints', { n: s.hintsUsed }) : t('end.perfect')}</strong>
          <p className={styles.share}>{shareLine(s)}</p>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn"
              onClick={() =>
                void navigator.clipboard
                  ?.writeText(`${t('title')} · “${p.clue}”\n${shareLine(s)}`)
                  .then(
                    () => setCopied(true),
                    () => setCopied(false),
                  )
              }
              data-testid="ts-share"
            >
              <Copy size={16} /> {copied ? t('end.copied') : t('end.share')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const list = puzzlesFor(p.lang);
                start(
                  list[(list.indexOf(p) + 1) % list.length]!.id,
                  mode === 'watch' ? 'watch' : 'play',
                );
              }}
              data-testid="ts-next"
            >
              {t('end.next')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setState(null);
                setMode('menu');
              }}
            >
              {t('play.menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
