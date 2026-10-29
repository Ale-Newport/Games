/**
 * The Towers of Hanoi table: a menu (3, 5 or 7 disks on three pegs, or 6 disks on four), the pegs
 * (tap a peg to lift its top disk, another to drop it; keys 1–4), moves against the fewest
 * possible, undo and restart, exact hints, and the solver in watch mode.
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
  SPECS,
  bestMove,
  distances,
  encode,
  isValidHanoiState,
  legalMoves,
  minimum,
  moveDisk,
  newHanoi,
  specOf,
  tops,
  undo,
  type HanoiState,
} from './engine';
import styles from './Hanoi.module.css';
import { STRINGS } from './i18n';
import { HANOI_SOUNDS } from './sounds';

interface Saved {
  state: HanoiState;
}
type Mode = 'menu' | 'play' | 'watch';

const LEVELS = Object.keys(SPECS);
const DISK_COLORS = [
  '#e5484d',
  '#f76b15',
  '#f5d90a',
  '#30a46c',
  '#12a5c4',
  '#3e63dd',
  '#8e4ec6',
  '#d6409f',
];

export function HanoiGame({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' && d !== null && isValidHanoiState((d as Saved).state),
      }),
    [services],
  );
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState('three');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<HanoiState | null>(null);
  const [lifted, setLifted] = useState<number | null>(null);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
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

  const start = (s: HanoiState, m: Mode) => {
    setState(s);
    setMode(m);
    setLevel(s.level);
    setLifted(null);
    setHint(null);
    setElapsed(s.elapsedMs);
    setMessage(m === 'play' ? t('select') : '');
    if (m === 'play') void slot.save({ state: s });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => start(newHanoi('five'), 'watch'), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'play' || !state || state.solved) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, state]);

  const solvedNow = (s: HanoiState) => {
    const svc = servicesRef.current;
    const time = elapsedRef.current;
    const best = minimum(specOf(s));
    const perfect = s.moves === best && !s.hints;
    svc.playSound(HANOI_SOUNDS.win);
    setMessage(
      t(perfect ? 'solved.optimal' : 'solved', { moves: s.moves, time: formatTime(time) }),
    );
    svc.recordResult({ outcome: 'complete', score: s.moves, timeMs: time, mode: s.level });
    svc.unlockAchievement('first');
    if (perfect) svc.unlockAchievement('optimal');
    if (perfect && s.level === 'seven') svc.unlockAchievement('seven');
    if (perfect && s.level === 'four') svc.unlockAchievement('four');
    void slot.clear();
    setSaved(null);
  };

  const commit = (next: HanoiState) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    setLifted(null);
    setHint(null);
    servicesRef.current.playSound(HANOI_SOUNDS.drop);
    setState(next);
    setMessage('');
    if (next.solved && !before.solved) solvedNow(next);
    else if (mode === 'play') void slot.save({ state: { ...next, elapsedMs: elapsedRef.current } });
  };

  const active = mode === 'play' && !!state && !state.solved;

  const tapPeg = (peg: number) => {
    const s = stateRef.current;
    if (!s || !active) return;
    const spec = specOf(s);
    if (lifted === null) {
      if (tops(s.position, spec.pegs)[peg]! < 0) return;
      setLifted(peg);
      servicesRef.current.playSound(HANOI_SOUNDS.lift);
      return;
    }
    if (lifted === peg) {
      setLifted(null);
      return;
    }
    if (!legalMoves(s.position, spec.pegs).some(([a, b]) => a === lifted && b === peg)) {
      servicesRef.current.playSound(HANOI_SOUNDS.blocked);
      setMessage(t('blocked'));
      return;
    }
    commit(moveDisk(s, lifted, peg));
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || !active) return;
    servicesRef.current.playSound(HANOI_SOUNDS.hint);
    const spec = specOf(s);
    const m = bestMove(spec, s.position);
    if (!m) return;
    setHint(m);
    setLifted(m[0]);
    setMessage(
      t('hint.move', {
        from: m[0] + 1,
        to: m[1] + 1,
        left: distances(spec)[encode(s.position, spec.pegs)]!,
      }),
    );
  };

  // Watch mode: the solver moves a disk every 0.45 s.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.solved) return;
    const id = window.setTimeout(() => {
      const m = bestMove(specOf(state), state.position);
      if (!m) return;
      const next = moveDisk(state, m[0], m[1]);
      servicesRef.current.playSound(next.solved ? HANOI_SOUNDS.win : HANOI_SOUNDS.drop);
      setHint(m);
      if (next.solved) setMessage(t('watch.done', { moves: next.moves }));
      setState(next);
    }, 450);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    const n = Number(k);
    if (Number.isInteger(n) && n >= 1 && n <= specOf(state).pegs) tapPeg(n - 1);
    else if (k === 'u') commit(undo(state));
    else if (k === 'h') showHint();
    else if (k === 'escape') setLifted(null);
    else return false;
    return true;
  });

  const toMenu = () => {
    const s = stateRef.current;
    if (mode === 'play' && s && !s.solved) {
      const kept = { state: { ...s, elapsedMs: elapsedRef.current } };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[level];
    return (
      <div className={shared.menu} data-testid="th-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play')}
              data-testid="th-resume"
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
                  data-testid={`th-level-${d}`}
                >
                  {t(`level.${d}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>
              {t('level.hint', {
                disks: SPECS[level]!.disks,
                pegs: SPECS[level]!.pegs,
                min: minimum(SPECS[level]!),
              })}
            </p>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.record', { solved: stats.completions, best: stats.bestScore ?? 0 })
                : t('menu.unsolved')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(newHanoi(level), 'play')}
              data-testid="th-start"
            >
              <Play size={16} /> {t('menu.play')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newHanoi(level), 'watch')}
              data-testid="th-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const spec = specOf(s);
  const stacks = Array.from({ length: spec.pegs }, () => [] as number[]);
  for (let d = spec.disks - 1; d >= 0; d--) stacks[s.position[d]!]!.push(d);

  return (
    <div className={shared.play} data-testid="hanoi">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="th-moves">
          {t('moves', { n: s.moves })}
        </span>
        <span className={styles.counter}>{t('best', { n: minimum(spec) })}</span>
        <span className={styles.counter}>{formatTime(elapsed)}</span>
      </div>
      <div
        className={styles.pegs}
        style={{ ['--disks' as string]: spec.disks, ['--pegs' as string]: spec.pegs }}
        data-testid="th-pegs"
      >
        {stacks.map((stack, peg) => (
          <button
            key={peg}
            type="button"
            className={[
              styles.peg,
              lifted === peg ? styles.lifted : '',
              hint && hint[1] === peg ? styles.target : '',
              peg === spec.pegs - 1 ? styles.goal : '',
            ].join(' ')}
            onClick={() => tapPeg(peg)}
            aria-label={t('peg.label', {
              n: peg + 1,
              disks: stack.length ? stack.map((d) => d + 1).join(', ') : t('peg.empty'),
            })}
            data-peg={peg}
            data-count={stack.length}
          >
            <span className={styles.pole} />
            {stack.map((d, i) => (
              <span
                key={d}
                className={`${styles.disk} ${lifted === peg && i === stack.length - 1 ? styles.up : ''}`}
                style={{
                  ['--size' as string]: (d + 1) / spec.disks,
                  ['--level' as string]: i,
                  background: DISK_COLORS[d % DISK_COLORS.length],
                }}
              >
                {d + 1}
              </span>
            ))}
            <span className={styles.label}>{peg + 1}</span>
          </button>
        ))}
      </div>
      <p className={shared.message} data-testid="th-message" aria-live="polite">
        {message}
      </p>
      {hint && active && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => commit(moveDisk(s, hint[0], hint[1], { hint: true }))}
          data-testid="th-apply"
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
              disabled={!s.history.length}
              data-testid="th-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newHanoi(s.level), 'play')}
              data-testid="th-restart"
            >
              <RotateCcw size={16} /> {t('restart')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="th-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(s.solved || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(newHanoi(s.level), mode)}
            data-testid="th-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="th-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
