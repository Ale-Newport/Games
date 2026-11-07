/**
 * The Peg Solitaire table: a menu (English, European or triangle board, resume, watch the AI),
 * the board (tap a peg, then a highlighted hole; the triangle drawn as a triangle), pegs left,
 * undo and restart, hints from the solver (or word that no finish is left), and the solver in
 * watch mode.
 */
import { Bot, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { formatTime } from '../shared/sudoku/SudokuGame';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  SHAPES,
  count,
  geometry,
  has,
  isValidPegState,
  legalJumps,
  newPegGame,
  nextJump,
  pegsOf,
  play,
  shapeOf,
  undo,
  type Jump,
  type PegState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Peg.module.css';
import { PEG_SOUNDS } from './sounds';

interface Saved {
  state: PegState;
}
type Mode = 'menu' | 'play' | 'watch';

const BOARDS = Object.keys(SHAPES);

export function PegGame({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' && d !== null && isValidPegState((d as Saved).state),
      }),
    [services],
  );
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [board, setBoard] = useState('english');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<PegState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<Jump | null>(null);
  const [message, setMessage] = useState('');
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

  const start = (s: PegState, m: Mode) => {
    setState(s);
    setMode(m);
    setBoard(s.board);
    setSelected(null);
    setHint(null);
    setElapsed(s.elapsedMs);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => start(newPegGame(board), 'watch'), 0);
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

  const finished = (s: PegState) => {
    const svc = servicesRef.current;
    const left = count(pegsOf(s));
    const time = elapsedRef.current;
    if (s.status === 'won') {
      svc.playSound(PEG_SOUNDS.win);
      setMessage(t('won', { time: formatTime(time) }));
      svc.recordResult({ outcome: 'complete', score: 1, timeMs: time, mode: s.board });
      svc.unlockAchievement('first');
      if (s.board === 'english') svc.unlockAchievement('centre');
      if (s.board === 'european') svc.unlockAchievement('european');
      if (!s.undos && !s.hints) svc.unlockAchievement('clean');
    } else {
      svc.playSound(PEG_SOUNDS.stuck);
      setMessage(t(left === 1 ? 'stuck.notCentre' : 'stuck', { n: left }));
      svc.recordResult({ outcome: 'fail', score: left, mode: s.board });
    }
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: PegState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setSelected(null);
    setHint(null);
    servicesRef.current.playSound(PEG_SOUNDS.jump);
    setState(next);
    setMessage('');
    if (next.status !== 'playing') finished(next);
    else if (mode === 'play') void slot.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  const active = mode === 'play' && !!state && state.status === 'playing';

  const tapHole = (h: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    const shape = shapeOf(s);
    const p = pegsOf(s);
    if (has(p, h)) {
      const moves = legalJumps(shape, p).filter((j) => j[0] === h);
      setSelected(moves.length ? h : null);
      if (!moves.length) {
        servicesRef.current.playSound(PEG_SOUNDS.blocked);
        setMessage(t('noJump'));
      } else setMessage('');
      return;
    }
    if (selected === null) return;
    const j = legalJumps(shape, p).find((x) => x[0] === selected && x[2] === h);
    if (j) commit(play(s, j));
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(PEG_SOUNDS.hint);
    const r = nextJump(s);
    if (r.jump) {
      setHint(r.jump);
      setSelected(r.jump[0]);
      setMessage(t('hint.jump'));
    } else setMessage(t(r.exhausted ? 'hint.unknown' : 'hint.none'));
  };

  const applyHint = () => {
    const s = stateRef.current;
    if (!s || !hint || !active) return;
    commit(play(s, hint, { hint: true }));
  };

  // Watch mode: the solver jumps every 0.7 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing') return;
    const id = window.setTimeout(() => {
      // The solver's jump, or the first legal one when no finish is known.
      const j = nextJump(state).jump ?? legalJumps(shapeOf(state), pegsOf(state))[0]!;
      const next = play(state, j);
      servicesRef.current.playSound(next.status === 'won' ? PEG_SOUNDS.win : PEG_SOUNDS.jump);
      setHint(j);
      if (next.status !== 'playing')
        setMessage(
          next.status === 'won' ? t('watch.won') : t('watch.stuck', { n: count(pegsOf(next)) }),
        );
      setState(next);
    }, 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (k === 'u') commit(undo(state));
    else if (k === 'r') start(newPegGame(state.board), 'play');
    else if (k === 'h') showHint();
    else if (k === 'escape') setSelected(null);
    else return false;
    return true;
  });

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
    const stats = services.getStats()?.modes[board];
    return (
      <div className={shared.menu} data-testid="pg-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play')}
              data-testid="pg-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    board: t(`board.${saved.state.board}`),
                    n: count(pegsOf(saved.state)),
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.board')}</legend>
            <div className={shared.segmented}>
              {BOARDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={board === b}
                  onClick={() => setBoard(b)}
                  data-testid={`pg-board-${b}`}
                >
                  {t(`board.${b}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`board.${board}.hint`)}</p>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', { n: stats.completions, played: stats.played })
                : t('menu.unsolved')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(newPegGame(board), 'play')}
              data-testid="pg-start"
            >
              <Play size={16} /> {t('menu.play')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newPegGame(board), 'watch')}
              data-testid="pg-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const shape = shapeOf(s);
  const g = geometry(shape);
  const p = pegsOf(s);
  const triangle = shape.id === 'triangle';
  const targets = new Set(
    selected === null
      ? []
      : legalJumps(shape, p)
          .filter((j) => j[0] === selected)
          .map((j) => j[2]),
  );
  const pos = (h: number) => {
    const cell = g.cellOf[h]!;
    const x = cell % g.width;
    const y = Math.floor(cell / g.width);
    return triangle ? { x: x - y / 2 + (g.height - 1) / 2, y: y * 0.88 } : { x, y };
  };

  return (
    <div className={shared.play} data-testid="peg-solitaire">
      <div className={styles.bar}>
        <span className={styles.counter}>{t(`board.${s.board}`)}</span>
        <span className={styles.counter} data-testid="pg-left">
          {t('left', { n: count(p) })}
        </span>
        <span className={styles.counter}>{formatTime(elapsed)}</span>
      </div>
      <div className={styles.wrap}>
        <div
          className={`${styles.board} ${triangle ? styles.triangle : ''}`}
          style={{
            ['--w' as string]: g.width,
            ['--h' as string]: triangle ? g.height * 0.88 + 0.12 : g.height,
          }}
          role="grid"
          aria-label={t('title')}
          data-testid="pg-board"
        >
          {g.cellOf.map((_, h) => {
            const { x, y } = pos(h);
            const peg = has(p, h);
            return (
              <button
                key={h}
                type="button"
                className={[
                  styles.hole,
                  peg ? styles.peg : '',
                  selected === h ? styles.selected : '',
                  targets.has(h) ? styles.target : '',
                  hint && (hint[0] === h || hint[2] === h) ? styles.pointed : '',
                  hint && hint[1] === h ? styles.over : '',
                ].join(' ')}
                style={{ ['--x' as string]: x, ['--y' as string]: y }}
                onClick={() => tapHole(h)}
                aria-label={t(peg ? 'hole.peg' : 'hole.empty', { n: h + 1 })}
                data-hole={h}
                data-peg={peg || undefined}
              />
            );
          })}
        </div>
      </div>
      <p className={shared.message} data-testid="pg-message" aria-live="polite">
        {message}
      </p>
      {hint && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={applyHint}
          data-testid="pg-apply"
        >
          {t('hint.apply')}
        </button>
      )}
      <div className={shared.controls}>
        {mode === 'play' && s.status !== 'won' && (
          <button
            type="button"
            className="btn"
            onClick={() => commit(undo(s))}
            disabled={!s.history.length}
            data-testid="pg-undo"
          >
            <Undo2 size={16} /> {t('undo')}
          </button>
        )}
        {active && (
          <button type="button" className="btn" onClick={showHint} data-testid="pg-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && (
          <button
            type="button"
            className={`btn ${s.status !== 'playing' ? 'btn-primary' : ''}`}
            onClick={() => start(newPegGame(s.board), 'play')}
            data-testid="pg-restart"
          >
            <RotateCcw size={16} /> {t('restart')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="pg-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
