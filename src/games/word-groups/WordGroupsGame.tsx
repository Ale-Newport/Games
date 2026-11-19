/**
 * The Word Groups table: a menu (puzzle language, today's puzzle, every puzzle with its result,
 * watch the AI, resume), the 4×4 grid of word tiles with solved groups as coloured bars above it,
 * mistakes left as dots, shuffle / deselect / submit, feedback toasts, and the end reveal with a
 * share grid. Keyboard: arrows move, Space/Enter toggles a tile, S submits, D deselects.
 */
import { Bot, CalendarDays, Copy, RotateCcw, Shuffle as ShuffleIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { loadVectors } from '../shared/semantic/semantic';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { clusterMove, wordsOf } from './ai';
import {
  MAX_MISTAKES,
  dailyPuzzle,
  deselectAll,
  gameNumber,
  isValidState,
  newGame,
  puzzleById,
  puzzlesFor,
  revealOrder,
  shareGrid,
  shuffle,
  submit,
  toggle,
  type Feedback,
  type GroupsState,
} from './engine';
import { STRINGS } from './i18n';
import { GROUP_SOUNDS } from './sounds';
import styles from './WordGroups.module.css';

interface Saved {
  state: GroupsState | null;
  results: Record<string, 'won' | 'lost'>;
}

export function WordGroupsGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (
    s: GroupsState,
    unlock: (id: string) => void,
    results: Record<string, 'won' | 'lost'>,
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
  const [state, setStateRaw] = useState<GroupsState | null>(null);
  const [toast, setToast] = useState<Feedback | null>(null);
  const [shake, setShake] = useState(0);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<GroupsState | null>(null);
  // The watching AI reads the puzzle's own language (Spanish puzzles with Spanish vectors).
  const aiLang = state ? puzzleById(state.puzzleId).lang : lang;
  const vectorsAsset = useAsset(
    () => (mode === 'watch' ? loadVectors(aiLang) : Promise.resolve(null)),
    mode === 'watch' ? aiLang : 'off',
  );
  const vectors = vectorsAsset.value;
  const savedRef = useLatest(saved);
  const setState = (s: GroupsState | null) => {
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

  const persist = (patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    setSaved(next);
    void slot.save(next);
  };

  const start = (puzzleId: string, m: 'play' | 'watch', resume?: GroupsState) => {
    const s = resume ?? newGame(puzzleById(puzzleId), randomSeed() >>> 0);
    setState(s);
    setMode(m);
    setToast(null);
    setCopied(false);
    setFocus(0);
    if (m === 'play') persist({ state: s });
  };

  useEffect(() => {
    if (mode === 'watch' && !state) {
      const id = window.setTimeout(() => start(dailyPuzzle('en', gameNumber()).id, 'watch'), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const flash = (f: Feedback) => {
    setToast(f);
    window.setTimeout(() => setToast((x) => (x === f ? null : x)), 1600);
  };

  const finished = (s: GroupsState) => {
    const svc = servicesRef.current;
    svc.playSound(s.status === 'won' ? GROUP_SOUNDS.win : GROUP_SOUNDS.lose);
    if (mode !== 'play') return;
    const results = {
      ...savedRef.current.results,
      [s.puzzleId]: s.status === 'won' ? 'won' : 'lost',
    } as Saved['results'];
    persist({ state: null, results });
    svc.recordResult({
      outcome: s.status === 'won' ? 'win' : 'loss',
      score: MAX_MISTAKES - s.mistakes,
      mode: puzzleById(s.puzzleId).lang,
    });
    onFinish(s, (id) => svc.unlockAchievement(id), results);
  };

  const apply = (next: GroupsState) => {
    const before = stateRef.current;
    setState(next);
    if (before?.status === 'playing' && next.status !== 'playing') finished(next);
    else if (mode === 'play') persist({ state: next });
  };

  const tap = (word: string) => {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    servicesRef.current.playSound(GROUP_SOUNDS.tap);
    apply(toggle(s, word));
  };

  const doSubmit = () => {
    const s = stateRef.current;
    if (!s) return;
    const { state: next, feedback } = submit(s);
    if (feedback === 'invalid') return;
    const sound =
      feedback === 'solved'
        ? GROUP_SOUNDS.solved
        : feedback === 'one-away'
          ? GROUP_SOUNDS.oneAway
          : GROUP_SOUNDS.wrong;
    servicesRef.current.playSound(sound);
    if (feedback !== 'solved') setShake((n) => n + 1);
    flash(feedback);
    apply(next);
  };

  useKeyboard((e) => {
    const s = stateRef.current;
    if (mode !== 'play' || !s || s.status !== 'playing') return false;
    const n = s.board.length;
    const k = e.key.toLowerCase();
    if (k === 'arrowright') setFocus((f) => (f + 1) % n);
    else if (k === 'arrowleft') setFocus((f) => (f + n - 1) % n);
    else if (k === 'arrowdown') setFocus((f) => Math.min(n - 1, f + 4));
    else if (k === 'arrowup') setFocus((f) => Math.max(0, f - 4));
    else if (k === ' ' || k === 'enter') tap(s.board[Math.min(focus, n - 1)]!);
    else if (k === 's') doSubmit();
    else if (k === 'd') apply(deselectAll(s));
    else return false;
    return true;
  }, mode === 'play');

  // Watch: the clusterer selects its four words one by one, then submits.
  useEffect(() => {
    if (mode !== 'watch' || !vectors || !state || state.status !== 'playing') return;
    const words = wordsOf(clusterMove(vectors, state));
    let i = 0;
    const id = window.setInterval(() => {
      const s = stateRef.current!;
      if (i < 4) {
        setState(toggle(i === 0 ? deselectAll(s) : s, words[i]!));
        i++;
        return;
      }
      window.clearInterval(id);
      doSubmit();
    }, 450);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, vectors, state?.history.length, state?.status]);

  if (mode === 'watch' && vectorsAsset.error) return <LoadError onRetry={vectorsAsset.retry} />;

  // ---------------------------------------------------------------- menu
  if (mode === 'menu' || !state) {
    const today = dailyPuzzle(lang, gameNumber());
    const resume = saved.state && saved.state.status === 'playing' ? saved.state : null;
    return (
      <div className={shared.menu} data-testid="wg2-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resume.puzzleId, 'play', resume)}
              data-testid="wg2-resume"
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
                  data-testid={`wg2-lang-${l}`}
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
              data-testid="wg2-daily"
            >
              <CalendarDays size={16} /> {t('menu.daily')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(today.id, 'watch')}
              data-testid="wg2-watch"
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
                  data-result={saved.results[p.id] ?? 'none'}
                  onClick={() => start(p.id, 'play')}
                  aria-label={`#${i + 1}${saved.results[p.id] ? ` · ${t(saved.results[p.id] === 'won' ? 'menu.solved' : 'menu.failed')}` : ''}`}
                  data-testid={`wg2-pick-${p.id}`}
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
  const over = s.status !== 'playing';
  const bars = over ? revealOrder(s) : s.solved;
  const share = () => {
    const text = `${t('title')} · ${p.id}\n${shareGrid(s)}`;
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className={styles.wrap} data-testid="wg2-play">
      <p className={styles.instructions}>{t('play.instructions')}</p>
      <div className={styles.bars}>
        {bars.map((g) => (
          <div
            key={g}
            className={styles.bar}
            data-level={g}
            data-found={s.solved.includes(g)}
            data-testid={`wg2-bar-${g}`}
          >
            <strong>{p.groups[g]!.label}</strong>
            <span>{p.groups[g]!.words.join(', ')}</span>
          </div>
        ))}
      </div>
      {!over && (
        <div
          key={shake}
          className={`${styles.grid} ${shake ? styles.shake : ''}`}
          role="group"
          aria-label={t('play.instructions')}
          data-testid="wg2-grid"
        >
          {s.board.map((w, i) => (
            <button
              key={w}
              type="button"
              className={styles.tile}
              aria-pressed={s.selected.includes(w)}
              data-focus={mode === 'play' && i === focus}
              onClick={() => tap(w)}
              disabled={mode === 'watch'}
              data-testid={`wg2-tile-${w}`}
            >
              {w}
            </button>
          ))}
        </div>
      )}
      <p className={styles.toast} aria-live="polite" data-testid="wg2-toast">
        {toast ? t(`fb.${toast}`) : ''}
      </p>
      {!over && (
        <>
          <div className={styles.mistakes} data-testid="wg2-mistakes">
            {t('play.mistakes')}{' '}
            {Array.from({ length: MAX_MISTAKES - s.mistakes }, (_, i) => (
              <span key={i} className={styles.dot} />
            ))}
          </div>
          <div className={shared.controls}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                servicesRef.current.playSound(GROUP_SOUNDS.shuffle);
                apply(shuffle(s));
              }}
              disabled={mode === 'watch'}
              data-testid="wg2-shuffle"
            >
              <ShuffleIcon size={16} /> {t('play.shuffle')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => apply(deselectAll(s))}
              disabled={mode === 'watch' || !s.selected.length}
              data-testid="wg2-deselect"
            >
              {t('play.deselect')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={doSubmit}
              disabled={mode === 'watch' || s.selected.length !== 4}
              data-testid="wg2-submit"
            >
              {t('play.submit')}
            </button>
          </div>
        </>
      )}
      {over && (
        <div className={styles.result} data-testid="wg2-result" data-status={s.status}>
          <strong>
            {s.status === 'won'
              ? s.mistakes
                ? t('end.wonMistakes', { n: s.mistakes })
                : t('end.won')
              : t('end.lost')}
          </strong>
          <pre className={styles.grid2} aria-hidden="true">
            {shareGrid(s)}
          </pre>
          <div className={shared.menuActions}>
            <button type="button" className="btn" onClick={share} data-testid="wg2-share">
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
              data-testid="wg2-next"
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
              data-testid="wg2-menu-btn"
            >
              {t('end.menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
