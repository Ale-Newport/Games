/**
 * The Narde table: a menu (opponent, match length, new match, resume, watch the AI), the shared
 * race board with both sides travelling the same way round, checkers moved one die at a time (tap
 * a checker, then a marked point), a match score, hints from the expectimax player, and computer
 * turns played with short pauses.
 */
import { Bot, Dices, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { BoardView, type PointView } from '../shared/raceboard/BoardView';
import { chooseAction, type Strength } from './ai';
import {
  OFF,
  across,
  applyStep,
  legalSequences,
  physical,
  pips,
  posKey,
  type Position,
  type Side,
  type Step,
} from './engine';
import { expectimaxPlay } from './evaluate';
import { STRINGS } from './i18n';
import { act, isValidNarde, newNarde, playKey, playsOf, type NardeMatch } from './match';
import styles from './Narde.module.css';
import { NARDE_SOUNDS } from './sounds';

type Opponent = 'easy' | 'hard' | 'two';
type Mode = 'menu' | 'play' | 'watch';
const OPPONENTS: Opponent[] = ['easy', 'hard', 'two'];
const LENGTHS = [1, 3, 5];

interface Saved {
  state: NardeMatch;
  opponent: Opponent;
}

const phys = (side: Side, p: number) => (p === OFF ? OFF : physical(side, p));

export function NardeGame({ services }: { services: GameServices }) {
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
          OPPONENTS.includes((d as Saved).opponent) &&
          isValidNarde((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [opponent, setOpponent] = useState<Opponent>('easy');
  const [length, setLength] = useState(3);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<NardeMatch | null>(null);
  const [partial, setPartial] = useState<Step[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [recent, setRecent] = useState<number[]>([]);
  const stateRef = useLatest(state);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.phase !== 'match-over') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const human = (side: Side) => mode === 'play' && (opponent === 'two' || side === 0);
  const strengthOf = (side: Side): Strength =>
    mode === 'watch'
      ? side === 0
        ? 'expectimax'
        : 'greedy'
      : opponent === 'hard'
        ? 'expectimax'
        : 'greedy';

  const start = (s: NardeMatch, m: Mode, o: Opponent) => {
    setState(s);
    setMode(m);
    setOpponent(o);
    setPartial([]);
    setSelected(null);
    setHint(null);
    setRecent([]);
    setMessage('');
    if (m === 'play') void slot.save({ state: s, opponent: o });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => start(newNarde(3, fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard'),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const name = (side: Side) =>
    opponent === 'two' || mode === 'watch'
      ? t(side === 0 ? 'side.light' : 'side.dark')
      : t(side === 0 ? 'side.you' : 'side.cpu');

  const commit = (next: NardeMatch, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setPartial([]);
    setSelected(null);
    setHint(null);
    if (action.startsWith('play:')) {
      const side = before.turn;
      setRecent(
        action
          .slice(5)
          .split(',')
          .flatMap((x) => x.split('/').map(Number))
          .filter((p) => p >= 1 && p <= 24)
          .map((p) => phys(side, p)),
      );
      svc.playSound(NARDE_SOUNDS.move);
    } else if (action === 'roll') svc.playSound(NARDE_SOUNDS.roll);
    setState(next);
    if ((next.phase === 'game-over' || next.phase === 'match-over') && next.lastWin) {
      const w = next.lastWin;
      const end = t(w.mars ? 'end.mars' : 'end.oin', { side: name(w.side), points: w.points });
      if (next.phase === 'match-over') {
        const winner: Side = next.score[0] >= next.matchTo ? 0 : 1;
        setMessage(
          `${end} ${t('match.won', { side: name(winner), a: next.score[0], b: next.score[1] })}`,
        );
        if (mode === 'play') {
          if (opponent !== 'two') {
            svc.playSound(winner === 0 ? NARDE_SOUNDS.win : NARDE_SOUNDS.lose);
            svc.recordResult({
              outcome: winner === 0 ? 'win' : 'loss',
              score: next.score[0] - next.score[1],
              mode: `${opponent}-${next.matchTo}`,
            });
            if (winner === 0) {
              svc.unlockAchievement('first');
              if (opponent === 'hard') svc.unlockAchievement('hard');
              if (next.matchTo >= 5) svc.unlockAchievement('long');
            }
          } else svc.playSound(NARDE_SOUNDS.win);
          void slot.clear();
          setSaved(null);
        }
      } else {
        setMessage(end);
        svc.playSound(NARDE_SOUNDS.game);
      }
      if (mode === 'play' && opponent !== 'two' && w.side === 0 && w.mars)
        svc.unlockAchievement('mars');
    } else if (action === 'pass') setMessage(t('passed', { side: name(before.turn) }));
    else setMessage('');
    if (mode === 'play' && next.phase !== 'match-over') void slot.save({ state: next, opponent });
  };

  const doAction = (a: string) => {
    const s = stateRef.current;
    if (!s) return;
    commit(act(s, a), a);
  };

  // Computer seats (and both seats in watch mode) act after a short pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'match-over') return;
    if (human(state.turn)) {
      if (state.phase === 'move' && !playsOf(state).length) {
        const id = window.setTimeout(() => doAction('pass'), 1200);
        return () => window.clearTimeout(id);
      }
      return;
    }
    if (state.phase === 'game-over' && mode === 'play') return;
    const delay = state.phase === 'move' ? 750 : state.phase === 'game-over' ? 2200 : 550;
    const id = window.setTimeout(() => {
      const s = stateRef.current;
      if (s) doAction(chooseAction(s, strengthOf(s.turn)));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const s = state;
  const myTurn = !!s && human(s.turn) && s.phase !== 'game-over';
  const sequences = useMemo(
    () =>
      s && s.phase === 'move' && s.dice
        ? legalSequences(s.pos, s.turn, s.dice, s.first[s.turn])
        : [],
    [s],
  );
  const matching = sequences.filter((sq) =>
    partial.every((st, i) => {
      const o = sq.steps[i];
      return o && o.from === st.from && o.to === st.to && o.die === st.die;
    }),
  );
  const nextSteps =
    myTurn && s?.phase === 'move'
      ? matching.flatMap((sq) => (sq.steps[partial.length] ? [sq.steps[partial.length]!] : []))
      : [];
  const shownPos: Position | null = s
    ? partial.reduce((p, st) => applyStep(p, s.turn, st), s.pos)
    : null;

  const finishIfDone = (steps: Step[]) => {
    const st = stateRef.current;
    if (!st) return;
    const done = sequences.find(
      (sq) =>
        sq.steps.length === steps.length &&
        sq.steps.every(
          (o, i) => o.from === steps[i]!.from && o.to === steps[i]!.to && o.die === steps[i]!.die,
        ),
    );
    if (!done) return;
    const play = playsOf(st).find((pl) => posKey(pl.result) === posKey(done.result));
    if (play) window.setTimeout(() => doAction(playKey(play)), 250);
  };

  const onPoint = (pp: number) => {
    if (!s || !myTurn || s.phase !== 'move') return;
    const own = pp === OFF ? OFF : s.turn === 0 ? pp : across(pp);
    if (selected !== null) {
      const step = nextSteps.find((st) => st.from === selected && st.to === own);
      if (step) {
        const steps = [...partial, step];
        setPartial(steps);
        setSelected(null);
        servicesRef.current.playSound(NARDE_SOUNDS.move);
        finishIfDone(steps);
        return;
      }
    }
    if (nextSteps.some((st) => st.from === own)) setSelected(own === selected ? null : own);
    else setSelected(null);
  };

  const showHint = () => {
    if (!s || !myTurn || s.phase !== 'move') return;
    const plays = playsOf(s);
    if (!plays.length) return;
    servicesRef.current.playSound(NARDE_SOUNDS.hint);
    const best = expectimaxPlay(plays, s.turn);
    setPartial([]);
    setSelected(null);
    setHint(playKey(best));
    setMessage(
      t('hint.play', {
        play: best.steps.map((st) => `${st.from}/${st.to === OFF ? t('off') : st.to}`).join(' '),
      }),
    );
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !s) return false;
    const k = e.key.toLowerCase();
    if (k === 'r' && myTurn && s.phase === 'roll') doAction('roll');
    else if (k === 'u' && partial.length) setPartial(partial.slice(0, -1));
    else if (k === 'h') showHint();
    else if (k === 'escape') setSelected(null);
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'match-over') {
      const kept = { state: cur, opponent };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !s || !shownPos) {
    return (
      <div className={shared.menu} data-testid="nd-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.opponent)}
              data-testid="nd-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    opponent: t(`opponent.${saved.opponent}`),
                    a: saved.state.score[0],
                    b: saved.state.score[1],
                    to: saved.state.matchTo,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.opponent')}</legend>
            <div className={shared.segmented}>
              {OPPONENTS.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={opponent === o}
                  onClick={() => setOpponent(o)}
                  data-testid={`nd-opp-${o}`}
                >
                  {t(`opponent.${o}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`opponent.${opponent}.hint`)}</p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.length')}</legend>
            <div className={shared.segmented}>
              {LENGTHS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={length === n}
                  onClick={() => setLength(n)}
                  data-testid={`nd-len-${n}`}
                >
                  {t('points', { n })}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t('length.hint')}</p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                start(newNarde(length, fixedSeed ?? randomSeed() >>> 0), 'play', opponent)
              }
              data-testid="nd-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newNarde(3, fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard')}
              data-testid="nd-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const points: PointView[] = Array.from({ length: 25 }, (_, p) => {
    if (p === 0) return { count: 0, owner: 0 };
    const a = shownPos.board[0][p]!;
    const b = shownPos.board[1][across(p)]!;
    return a ? { count: a, owner: 0 } : { count: b, owner: 1 };
  });
  const diceAll = s.dice
    ? s.dice[0] === s.dice[1]
      ? [s.dice[0], s.dice[0], s.dice[0], s.dice[0]]
      : [...s.dice]
    : null;
  const diceLeft = diceAll ? [...diceAll] : [];
  for (const st of partial) diceLeft.splice(diceLeft.indexOf(st.die), 1);
  const movable = [...new Set(nextSteps.map((st) => phys(s.turn, st.from)))];
  const targets =
    selected === null
      ? []
      : [
          ...new Set(
            nextSteps.filter((st) => st.from === selected).map((st) => phys(s.turn, st.to)),
          ),
        ];
  const label = (p: number) => {
    if (p === OFF) return t('label.off', { a: shownPos.off[0], b: shownPos.off[1] });
    if (p > 24) return t('label.middle');
    const pv = points[p]!;
    return pv.count
      ? t('label.point', { p, n: pv.count, side: name(pv.owner) })
      : t('label.empty', { p });
  };
  const openingNote =
    s.phase === 'roll' && s.first[0] && s.first[1]
      ? t(myTurn && opponent !== 'two' ? 'opening.you' : 'opening', {
          a: s.opening[0],
          b: s.opening[1],
          side: name(s.turn),
        })
      : '';

  return (
    <div className={shared.play} data-testid="narde">
      <div className={styles.bar}>
        <span className={styles.counter} data-testid="nd-score">
          {t('score', { a: s.score[0], b: s.score[1], to: s.matchTo })}
        </span>
        <span className={styles.counter} data-testid="nd-pips">
          {t('pips', { a: pips(shownPos, 0), b: pips(shownPos, 1) })}
        </span>
      </div>
      <BoardView
        points={points}
        bar={[0, 0]}
        off={shownPos.off}
        dice={diceAll}
        diceLeft={diceLeft}
        diceSide={s.turn}
        selected={selected === null ? null : phys(s.turn, selected)}
        targets={targets}
        movable={selected === null ? movable : []}
        recent={recent}
        onPoint={onPoint}
        label={label}
        ariaLabel={t('board')}
      />
      <p className={shared.message} data-testid="nd-message" aria-live="polite">
        {message ||
          openingNote ||
          (s.phase === 'move'
            ? t(myTurn ? (playsOf(s).length ? 'yourMove' : 'noMove') : 'theirMove', {
                side: name(s.turn),
              })
            : s.phase === 'roll'
              ? t(myTurn && opponent !== 'two' ? 'toRoll.you' : 'toRoll', { side: name(s.turn) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn && s.phase === 'roll' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('roll')}
            data-testid="nd-roll"
          >
            <Dices size={16} /> {t('roll')}
          </button>
        )}
        {myTurn && s.phase === 'move' && playsOf(s).length > 0 && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setPartial(partial.slice(0, -1))}
              disabled={!partial.length}
              data-testid="nd-undo"
            >
              <Undo2 size={16} /> {t('undo')}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="nd-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
            {hint && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => doAction(hint)}
                data-testid="nd-apply"
              >
                {t('hint.apply')}
              </button>
            )}
          </>
        )}
        {s.phase === 'game-over' && mode === 'play' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('next')}
            data-testid="nd-next"
          >
            <Play size={16} /> {t('nextGame')}
          </button>
        )}
        {(s.phase === 'match-over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              start(newNarde(mode === 'watch' ? 3 : s.matchTo, randomSeed() >>> 0), mode, opponent)
            }
            data-testid="nd-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="nd-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
