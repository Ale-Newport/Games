/**
 * The Sliding Blocks table: a menu (level, new or daily puzzle, resume, watch the AI), the 4×5 tray
 * with its exit, blocks dragged anywhere they can slide (or selected, then moved with the arrow keys
 * or a tap on a marked spot), moves against the fewest possible, undo, hints that name the block and
 * where it goes, and the solver in watch mode.
 */
import { Bot, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { solverStep } from './ai';
import {
  H,
  LEVELS,
  W,
  blocksOf,
  fits,
  isValidKlotskiState,
  newKlotski,
  puzzleOf,
  reach,
  relocate,
  undo,
  type Block,
  type KlotskiState,
  type Level,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Klotski.module.css';
import { KLOTSKI_SOUNDS } from './sounds';

interface Saved {
  state: KlotskiState;
  daily: boolean;
}
type Mode = 'menu' | 'play' | 'watch';

const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export function KlotskiGame({ services }: { services: GameServices }) {
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
          typeof (d as Saved).daily === 'boolean' &&
          isValidKlotskiState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('easy');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<KlotskiState | null>(null);
  const [daily, setDaily] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ from: number; at: number } | null>(null);
  const grab = useRef<{ block: Block; x: number; y: number; moved: boolean } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  /** The last relocation [from, to], so the block that arrives slides in from where it was. */
  const [arrive, setArrive] = useState<[number, number] | null>(null);
  const stateRef = useLatest(state);
  const elapsedRef = useLatest(elapsed);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && !d.state.solved) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (s: KlotskiState, m: Mode, isDaily: boolean, ms = 0) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setDaily(isDaily);
    setElapsed(ms);
    setHint(null);
    setSelected(null);
    setDrag(null);
    setArrive(null);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s, daily: isDaily });
  };
  const fresh = (m: Mode, lv: Level, seed: number, isDaily: boolean) =>
    start(newKlotski(lv, seed), m, isDaily);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'medium', fixedSeed ?? randomSeed() >>> 0, false),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'play' || !state || state.solved || !state.steps.length) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state]);

  const name = (b: Pick<Block, 'kind'>) => t(`block.${b.kind}`);
  const where = (cell: number) => t('cell', { row: Math.floor(cell / W) + 1, col: (cell % W) + 1 });

  const solvedNow = (s: KlotskiState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    const best = puzzleOf(s.level, s.index).best;
    svc.playSound(KLOTSKI_SOUNDS.win);
    const optimal = s.moves === best && !s.hints;
    setMessage(
      t(optimal ? 'solved.optimal' : 'solved', { moves: s.moves, time: formatTime(time) }),
    );
    svc.recordResult({ outcome: 'complete', score: s.moves, timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (optimal) svc.unlockAchievement('optimal');
    if (s.level === 'classic' && !s.hints) svc.unlockAchievement('classic');
    if (daily) svc.unlockAchievement('daily');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: KlotskiState, animate = true) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const last = next.steps[next.steps.length - 1];
    const undone = before.steps[before.steps.length - 1];
    if (!animate) setArrive(null);
    else if (next.steps.length > before.steps.length && last) setArrive(last);
    else if (undone) setArrive([undone[1], undone[0]]);
    setHint(null);
    servicesRef.current.playSound(KLOTSKI_SOUNDS.slide);
    setState(next);
    setMessage('');
    const moved = next.steps[next.steps.length - 1];
    setSelected(next.steps.length > before.steps.length && moved ? moved[1] : null);
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play') void slot.save({ state: next, daily });
  };

  const active = mode === 'play' && !!state && !state.solved;

  const blockOf = (s: KlotskiState, at: number | null) =>
    at === null ? undefined : blocksOf(s.board).find((b) => b.at === at);

  const onDown = (e: PointerEvent<HTMLButtonElement>, b: Block) => {
    if (!active) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { block: b, x: e.clientX, y: e.clientY, moved: false };
    setSelected(b.at);
  };

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    const s = stateRef.current;
    if (!g || !s || !boardRef.current) return;
    const u = boardRef.current.clientWidth / W;
    const dx = Math.round((e.clientX - g.x) / u);
    const dy = Math.round((e.clientY - g.y) / u);
    const x = Math.min(W - g.block.w, Math.max(0, (g.block.at % W) + dx));
    const y = Math.min(H - g.block.h, Math.max(0, Math.floor(g.block.at / W) + dy));
    const to = y * W + x;
    if (to === g.block.at || reach(s.board, g.block).includes(to)) {
      g.moved = g.moved || to !== g.block.at;
      setDrag({ from: g.block.at, at: to });
    }
  };

  const onUp = () => {
    const g = grab.current;
    const s = stateRef.current;
    grab.current = null;
    const d = drag;
    setDrag(null);
    if (!g || !s || !d || d.at === g.block.at) return;
    commit(relocate(s, g.block.at, d.at), false);
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(KLOTSKI_SOUNDS.hint);
    const step = solverStep(s.board);
    if (!step) return;
    setHint(step);
    setSelected(step[0]);
    setMessage(t('hint.move', { block: name(blockOf(s, step[0])!), cell: where(step[1]) }));
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !hint || !active) return;
    commit(relocate(s, hint[0], hint[1], { hint: true }));
  };

  // Watch mode: the solver moves one block every 0.6 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved) return;
    const id = window.setTimeout(() => {
      const step = solverStep(state.board);
      if (!step) return;
      const next = relocate(state, step[0], step[1]);
      servicesRef.current.playSound(next.solved ? KLOTSKI_SOUNDS.win : KLOTSKI_SOUNDS.slide);
      setMessage(
        next.solved
          ? t('watch.done', { moves: next.moves })
          : t('watch.step', { block: name(blockOf(state, step[0])!), cell: where(step[1]) }),
      );
      setArrive(step);
      setState(next);
    }, 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state || !active) return false;
    const k = e.key.toLowerCase();
    const blocks = blocksOf(state.board);
    const sel = blockOf(state, selected);
    const step = (d: number, ok: boolean) => {
      if (!sel || !ok) return;
      if (fits(state.board, sel, sel.at + d)) commit(relocate(state, sel.at, sel.at + d));
    };
    if (k === 'tab') {
      const i = sel ? blocks.indexOf(sel) : -1;
      setSelected(blocks[(i + (e.shiftKey ? -1 : 1) + blocks.length) % blocks.length]!.at);
    } else if (k === 'arrowleft') step(-1, !!sel && sel.at % W > 0);
    else if (k === 'arrowright') step(1, !!sel && (sel.at % W) + sel.w < W);
    else if (k === 'arrowup') step(-W, true);
    else if (k === 'arrowdown') step(W, true);
    else if (k === 'u') commit(undo(state));
    else if (k === 'h') showHint();
    else if (k === 'escape') setSelected(null);
    else return false;
    return true;
  });

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && !s.solved) {
      const kept = { state: s, daily };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[level];
    return (
      <div className={shared.menu} data-testid="kl-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.daily)}
              data-testid="kl-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    level: t(`level.${saved.state.level}`),
                    moves: saved.state.moves,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {LEVELS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={level === d}
                  onClick={() => setLevel(d)}
                  data-testid={`kl-level-${d}`}
                >
                  {t(`level.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', {
                    solved: stats.completions,
                    time: formatTime(stats.bestTimeMs ?? 0),
                  })
                : t('menu.unsolved')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="kl-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            {level !== 'classic' && (
              <button
                type="button"
                className="btn"
                onClick={() => fresh('play', level, today(), true)}
                data-testid="kl-daily"
              >
                {t('menu.daily')}
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', level, fixedSeed ?? randomSeed() >>> 0, false)}
              data-testid="kl-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const best = puzzleOf(s.level, s.index).best;
  const sel = active && !drag ? blockOf(s, selected) : undefined;
  const targets = sel ? reach(s.board, sel) : [];

  return (
    <div className={shared.play} data-testid="klotski">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="kl-moves">
          {t('moves', { n: s.moves })}
        </span>
        <span className={styles.counter}>{t('best', { n: best })}</span>
        <span className={styles.counter}>{formatTime(elapsed)}</span>
      </div>
      <div
        className={`${styles.tray} ${s.solved ? styles.done : ''}`}
        ref={boardRef}
        role="group"
        aria-label={t('title')}
        data-testid="kl-board"
      >
        <span className={styles.exit} aria-hidden="true" />
        {targets.map((to) => (
          <button
            key={`t${to}`}
            type="button"
            className={styles.target}
            style={{
              ['--row' as string]: Math.floor(to / W),
              ['--col' as string]: to % W,
              ['--w' as string]: sel!.w,
              ['--h' as string]: sel!.h,
            }}
            aria-label={t('target', { block: name(sel!), cell: where(to) })}
            data-target={to}
            onClick={() => commit(relocate(s, sel!.at, to))}
          />
        ))}
        {blocksOf(s.board).map((b) => {
          const at = drag?.from === b.at ? drag.at : b.at;
          return (
            <button
              key={b.at}
              type="button"
              className={[
                styles.block,
                styles[b.kind],
                selected === b.at && mode === 'play' ? styles.selected : '',
                hint?.[0] === b.at ? styles.pointed : '',
                drag?.from === b.at ? styles.dragging : '',
                arrive?.[1] === b.at ? styles.arrive : '',
              ].join(' ')}
              style={{
                ['--row' as string]: Math.floor(at / W),
                ['--col' as string]: at % W,
                ['--frow' as string]: arrive ? Math.floor(arrive[0] / W) : 0,
                ['--fcol' as string]: arrive ? arrive[0] % W : 0,
                ['--w' as string]: b.w,
                ['--h' as string]: b.h,
              }}
              data-block={b.kind}
              data-at={b.at}
              aria-label={t('block.label', { block: name(b), cell: where(b.at) })}
              onPointerDown={(e) => onDown(e, b)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onFocus={() => active && setSelected(b.at)}
              onClick={() => active && setSelected(b.at)}
            />
          );
        })}
      </div>
      <p className={shared.message} data-testid="kl-message" aria-live="polite">
        {message}
      </p>
      {hint && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={applyHint}
          data-testid="kl-apply"
        >
          {t('hint.apply')}
        </button>
      )}
      <div className={shared.controls}>
        {active && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => commit(undo(s))}
              disabled={!s.steps.length}
              data-testid="kl-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="kl-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, s.level, randomSeed() >>> 0, false)}
            data-testid="kl-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="kl-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
