import {
  Bot,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  StepForward,
  Undo2,
  Users,
  X as XIcon,
  Circle,
  LayoutList,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Agent } from '../../ai/agents/types';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { moveCursor } from '../../core/game-engine/grid';
import { createTranslator, pickText } from '../../core/i18n';
import { arrowDirection, useKeyboard } from '../../core/input/keyboard';
import { MnkBoard } from '../shared/mnk/MnkBoard';
import { AGENT_PRESETS, DIFFICULTIES, presetById } from './ai';
import { tttEnv } from './ai-adapter';
import { SOUNDS } from './audio';
import { STRINGS } from './i18n';
import {
  SAVE_SPEC,
  SPEED_MS,
  applyMove,
  canUndo,
  defaultSetup,
  isHumanTurn,
  markRecorded,
  newMatch,
  nextRound,
  restartRound,
  statsMode,
  undo,
  type MatchSetup,
  type MatchState,
  type Mode,
} from './match';
import { isLegal, winnerMarkCount, wonByFork, type Seat, type TttState } from './rules';
import styles from './Game.module.css';

const NUMPAD: Record<string, number> = {
  '7': 0,
  '8': 1,
  '9': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '1': 6,
  '2': 7,
  '3': 8,
};

function createAgents(
  setup: MatchSetup,
): [Agent<TttState, number> | null, Agent<TttState, number> | null] {
  if (setup.mode === 'watch')
    return [presetById(setup.watchAgents[0]).create(), presetById(setup.watchAgents[1]).create()];
  if (setup.mode === 'ai') {
    const cpu = presetById(setup.difficulty).create();
    return setup.humanSeat === 0 ? [null, cpu] : [cpu, null];
  }
  return [null, null];
}

export function Game({ services }: GameProps) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(() => services.saveSlot(SAVE_SPEC), [services]);
  const slotRef = useLatest(slot);

  const [setup, setSetup] = useState<MatchSetup>(() => ({
    ...defaultSetup(
      services.profileName,
      createTranslator(STRINGS, services.locale)('default.player2'),
    ),
    mode: services.launchParams.mode === 'watch' ? 'watch' : 'ai',
  }));
  const [saved, setSaved] = useState<MatchState | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [cursor, setCursor] = useState(4);
  const [focusToken, setFocusToken] = useState(0);
  const [hint, setHint] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const matchRef = useLatest(match);
  const agentsRef = useRef<[Agent<TttState, number> | null, Agent<TttState, number> | null]>([
    null,
    null,
  ]);
  const rngRef = useRef(new Rng(randomSeed()));

  // Load a resumable match once.
  useEffect(() => {
    let cancelled = false;
    void slotRef.current.load().then((m) => {
      if (!cancelled && m && m.setup.mode !== 'watch') setSaved(m);
    });
    return () => {
      cancelled = true;
    };
  }, [slotRef]);

  const names = (m: MatchSetup): [string, string] => {
    if (m.mode === 'ai') {
      const cpu = `${t('computer')} · ${t(`difficulty.${m.difficulty}`)}`;
      return m.humanSeat === 0 ? [t('you'), cpu] : [cpu, t('you')];
    }
    if (m.mode === 'watch')
      return [
        pickText(presetById(m.watchAgents[0]).label, locale),
        pickText(presetById(m.watchAgents[1]).label, locale),
      ];
    return [m.names[0].trim() || 'X', m.names[1].trim() || 'O'];
  };

  /** Applies a new match state with all side effects of the move (sound, stats, achievements, save). */
  const commit = (next: MatchState, prev: MatchState) => {
    const svc = servicesRef.current;
    const moved = next.round.history.length > prev.round.history.length;
    if (moved) {
      const cell = next.round.history[next.round.history.length - 1]!;
      const mark = next.round.board[cell] === 1 ? 'X' : 'O';
      svc.playSound(mark === 'X' ? SOUNDS.placeX : SOUNDS.placeO);
      setAnnouncement(
        t('announce.move', { mark, row: Math.floor(cell / 3) + 1, col: (cell % 3) + 1 }),
      );
    }
    const result = next.round.result;
    if (result && !next.recorded) {
      const { mode, humanSeat, difficulty } = next.setup;
      const playerNames = names(next.setup);
      if (result.kind === 'draw') {
        svc.playSound(SOUNDS.draw);
        setAnnouncement(t('result.draw'));
      } else {
        const humanLost = mode === 'ai' && result.winner !== humanSeat;
        svc.playSound(humanLost ? SOUNDS.lose : SOUNDS.win);
        setAnnouncement(
          mode === 'ai'
            ? t(humanLost ? 'result.youLose' : 'result.youWin')
            : t('result.wins', { name: playerNames[result.winner] }),
        );
      }
      const statsKey = statsMode(next.setup);
      if (mode === 'ai' && statsKey) {
        const outcome =
          result.kind === 'draw' ? 'draw' : result.winner === humanSeat ? 'win' : 'loss';
        svc.recordResult({ outcome, mode: statsKey });
        if (outcome === 'win') {
          svc.unlockAchievement('first-win');
          if (difficulty === 'medium') svc.unlockAchievement('beat-medium');
        }
        if (outcome === 'draw' && difficulty === 'perfect') svc.unlockAchievement('perfect-draw');
      } else if (mode === 'local' && statsKey) {
        svc.recordResult({ outcome: result.kind === 'draw' ? 'draw' : 'complete', mode: statsKey });
        svc.unlockAchievement('hot-seat');
      }
      const humanWon =
        result.kind === 'win' &&
        (mode === 'local' || (mode === 'ai' && result.winner === humanSeat));
      if (humanWon && wonByFork(next.round)) svc.unlockAchievement('fork-master');
      if (humanWon && winnerMarkCount(next.round) === 3) svc.unlockAchievement('three-move-win');
      next = markRecorded(next);
    }
    if (moved) setHint(null);
    setMatch(next);
    if (next.setup.mode !== 'watch') {
      setSaved(next);
      void slotRef.current.save(next);
    }
  };

  // Computer moves and watch-mode autoplay. The timer only schedules; the move is computed from the
  // exact state it was scheduled for, and discarded if the match changed in the meantime.
  useEffect(() => {
    if (!match) return;
    const { setup: s, round } = match;
    if (round.result) {
      if (s.mode !== 'watch' || paused) return;
      const id = window.setTimeout(() => {
        const current = matchRef.current;
        if (current === match) commit(nextRound(current), current);
      }, SPEED_MS[s.speed] * 2.2);
      return () => window.clearTimeout(id);
    }
    const agent = agentsRef.current[round.toMove];
    if (!agent || (s.mode === 'watch' && paused)) return;
    const delay = s.mode === 'watch' ? SPEED_MS[s.speed] : 380 + rngRef.current.int(320);
    const id = window.setTimeout(() => {
      const current = matchRef.current;
      if (current !== match) return;
      const cell = agent.selectAction(tttEnv, round, round.toMove, { rng: rngRef.current });
      commit(applyMove(current, cell), current);
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, paused]);

  const start = (m: MatchState) => {
    agentsRef.current = createAgents(m.setup);
    setPaused(false);
    setHint(null);
    setCursor(4);
    setMatch(m);
    if (m.setup.mode !== 'watch') {
      setSaved(m);
      void slotRef.current.save(m);
    }
  };

  const place = (cell: number) => {
    if (!match) return;
    if (!isHumanTurn(match) || !isLegal(match.round, cell)) {
      if (!match.round.result) services.playSound(SOUNDS.invalid);
      return;
    }
    commit(applyMove(match, cell), match);
  };

  const doUndo = () => match && canUndo(match) && commit(undo(match), match);
  const doRestart = () => match && !match.round.result && commit(restartRound(match), match);
  const doNext = () => match?.round.result && commit(nextRound(match), match);
  const doHint = () => {
    if (!match || !isHumanTurn(match)) return;
    const cell = presetById('perfect')
      .create()
      .selectAction(tttEnv, match.round, match.round.toMove, { rng: rngRef.current });
    setHint(cell);
    setCursor(cell);
    services.playSound(SOUNDS.hint);
  };
  const toMenu = () => {
    setMatch(null);
    agentsRef.current = [null, null];
  };

  useKeyboard((e) => {
    if (!match) return false;
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => moveCursor(c, dir, { rows: 3, cols: 3 }));
      setFocusToken((n) => n + 1);
      return true;
    }
    if (e.key in NUMPAD) {
      const cell = NUMPAD[e.key]!;
      setCursor(cell);
      place(cell);
      return true;
    }
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
      place(cursor);
      return true;
    }
    const shortcuts: Record<string, () => unknown> = {
      u: doUndo,
      h: doHint,
      r: doRestart,
      n: doNext,
    };
    const action = shortcuts[e.key.toLowerCase()];
    if (!action) return false;
    action();
    return true;
  });

  if (!match) {
    return (
      <Menu
        t={t}
        locale={locale}
        setup={setup}
        setSetup={setSetup}
        saved={saved}
        services={services}
        onStart={() => start(newMatch(setup))}
        onResume={() => saved && start(saved)}
      />
    );
  }

  const { round, setup: s, scores } = match;
  const playerNames = names(s);
  const result = round.result;
  const humanTurn = isHumanTurn(match);
  const reduced = services.reducedMotion;
  let status: string;
  if (result?.kind === 'draw')
    status =
      s.mode === 'ai' && s.difficulty === 'perfect' ? t('result.drawPerfect') : t('result.draw');
  else if (result)
    status =
      s.mode === 'ai'
        ? t(result.winner === s.humanSeat ? 'result.youWin' : 'result.youLose')
        : t('result.wins', { name: playerNames[result.winner] });
  else if (s.mode === 'ai') status = humanTurn ? t('turn.you') : t('turn.computer');
  else if (s.mode === 'local') status = t('turn.player', { name: playerNames[round.toMove] });
  else status = t('turn.agent', { name: playerNames[round.toMove] });
  const resultTone = !result
    ? 'neutral'
    : result.kind === 'draw'
      ? 'draw'
      : s.mode === 'ai' && result.winner !== s.humanSeat
        ? 'loss'
        : 'win';
  const lastMove = round.history.length ? round.history[round.history.length - 1]! : null;

  return (
    <div className={styles.play} data-testid="ttt-play">
      <div className={styles.scoreboard}>
        {([0, 1] as Seat[]).map((seat) => (
          <div
            key={seat}
            className={styles.score}
            data-active={!result && round.toMove === seat}
            data-seat={seat}
          >
            <span className={styles.scoreMark} aria-hidden="true">
              {seat === 0 ? (
                <XIcon size={20} strokeWidth={3} />
              ) : (
                <Circle size={18} strokeWidth={3} />
              )}
            </span>
            <span className={styles.scoreName}>{playerNames[seat]}</span>
            <span className={styles.scoreValue} data-testid={`score-${seat === 0 ? 'x' : 'o'}`}>
              {seat === 0 ? scores.x : scores.o}
            </span>
          </div>
        ))}
        <div className={styles.score} data-draws>
          <span className={styles.scoreName}>{t('draws')}</span>
          <span className={styles.scoreValue} data-testid="score-draws">
            {scores.draws}
          </span>
        </div>
      </div>

      <div className={styles.status} data-tone={resultTone} data-testid="ttt-status">
        <span className={styles.round}>{t('round', { n: match.roundNumber })}</span>
        <strong>{status}</strong>
      </div>

      <div className={styles.boardWrap}>
        <MnkBoard
          rows={3}
          cols={3}
          board={round.board}
          winLine={result?.kind === 'win' ? result.line : null}
          winMark={result?.kind === 'win' ? (result.winner === 0 ? 1 : 2) : undefined}
          lastMove={lastMove}
          cursor={cursor}
          focusToken={focusToken}
          hint={hint}
          ghost={humanTurn ? (round.toMove === 0 ? 1 : 2) : null}
          animate={!reduced}
          label={t('board.label')}
          cellLabel={(i, c) =>
            t(c === 0 ? 'cell.empty' : c === 1 ? 'cell.x' : 'cell.o', {
              row: Math.floor(i / 3) + 1,
              col: (i % 3) + 1,
            })
          }
          onCell={place}
          onFocusCell={setCursor}
        />
        {result?.kind === 'win' && resultTone === 'win' && !reduced && (
          <div className={styles.burst} aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                style={
                  {
                    '--a': `${(i / 16) * 360}deg`,
                    '--d': `${90 + (i % 4) * 22}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.controls}>
        {result ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={doNext}
            data-testid="next-round"
          >
            <SkipForward size={16} /> {t('action.next')}
          </button>
        ) : s.mode === 'watch' ? (
          <>
            <button type="button" className="btn" onClick={() => setPaused((p) => !p)}>
              {paused ? <Play size={16} /> : <Pause size={16} />}{' '}
              {paused ? t('action.resume') : t('action.pause')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!paused}
              onClick={() => {
                const agent = agentsRef.current[round.toMove];
                if (agent)
                  commit(
                    applyMove(
                      match,
                      agent.selectAction(tttEnv, round, round.toMove, { rng: rngRef.current }),
                    ),
                    match,
                  );
              }}
            >
              <StepForward size={16} /> {t('action.step')}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn" onClick={doUndo} disabled={!canUndo(match)}>
              <Undo2 size={16} /> {t('action.undo')}
            </button>
            <button type="button" className="btn" onClick={doHint} disabled={!humanTurn}>
              <Lightbulb size={16} /> {t('action.hint')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={doRestart}
              disabled={round.history.length === 0}
            >
              <RotateCcw size={16} /> {t('action.restart')}
            </button>
          </>
        )}
        <button type="button" className="btn btn-ghost" onClick={toMenu}>
          <LayoutList size={16} /> {t('action.menu')}
        </button>
      </div>
      <p className={styles.keys}>{t('keys')}</p>
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}

interface MenuProps {
  t: ReturnType<typeof createTranslator>;
  locale: GameProps['services']['locale'];
  setup: MatchSetup;
  setSetup: (s: MatchSetup) => void;
  saved: MatchState | null;
  services: GameProps['services'];
  onStart: () => void;
  onResume: () => void;
}

function Menu({ t, locale, setup, setSetup, saved, services, onStart, onResume }: MenuProps) {
  const update = (patch: Partial<MatchSetup>) => setSetup({ ...setup, ...patch });
  const modeStats = services.getStats()?.modes[`vs-ai:${setup.difficulty}`];
  const modes: { id: Mode; icon: typeof Bot }[] = [
    { id: 'ai', icon: Bot },
    { id: 'local', icon: Users },
    { id: 'watch', icon: Play },
  ];
  return (
    <div className={styles.menu} data-testid="ttt-menu">
      <div className={styles.menuCard}>
        <div className={styles.menuHeader}>
          <div className={styles.menuLogo} aria-hidden="true">
            <XIcon size={26} strokeWidth={3} />
            <Circle size={22} strokeWidth={3} />
          </div>
          <div>
            <h2 className={styles.menuTitle}>{t('menu.title')}</h2>
            <p className="muted">{t('menu.subtitle')}</p>
          </div>
        </div>

        {saved && !saved.round.result && (
          <button
            type="button"
            className={`btn ${styles.resume}`}
            onClick={onResume}
            data-testid="resume-match"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', {
                  round: saved.roundNumber,
                  x: saved.scores.x,
                  o: saved.scores.o,
                  draws: saved.scores.draws,
                })}
              </small>
            </span>
          </button>
        )}

        <fieldset className={styles.group}>
          <legend>{t('menu.mode')}</legend>
          <div className={styles.modeGrid}>
            {modes.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={styles.modeButton}
                aria-pressed={setup.mode === id}
                onClick={() => update({ mode: id })}
                data-testid={`mode-${id}`}
              >
                <Icon size={22} />
                {t(`mode.${id}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {setup.mode === 'ai' && (
          <>
            <fieldset className={styles.group}>
              <legend>{t('menu.difficulty')}</legend>
              <div className={styles.segmented}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={setup.difficulty === d}
                    onClick={() => update({ difficulty: d })}
                    data-testid={`difficulty-${d}`}
                  >
                    {t(`difficulty.${d}`)}
                  </button>
                ))}
              </div>
              <p className={styles.hintText}>{t(`difficulty.${setup.difficulty}.hint`)}</p>
              {modeStats && (
                <p className={styles.hintText}>
                  {t('menu.record', {
                    difficulty: t(`difficulty.${setup.difficulty}`),
                    wins: modeStats.wins,
                    losses: modeStats.losses,
                    draws: modeStats.draws,
                  })}
                </p>
              )}
            </fieldset>
            <fieldset className={styles.group}>
              <legend>{t('menu.playAs')}</legend>
              <div className={styles.segmented}>
                <button
                  type="button"
                  aria-pressed={setup.humanSeat === 0}
                  onClick={() => update({ humanSeat: 0 })}
                  data-testid="play-as-x"
                >
                  X
                </button>
                <button
                  type="button"
                  aria-pressed={setup.humanSeat === 1}
                  onClick={() => update({ humanSeat: 1 })}
                  data-testid="play-as-o"
                >
                  O
                </button>
              </div>
            </fieldset>
          </>
        )}

        {setup.mode === 'local' && (
          <fieldset className={styles.group}>
            <legend>{t('menu.names')}</legend>
            <div className={styles.names}>
              {([0, 1] as const).map((seat) => (
                <label key={seat} className="field">
                  <span className={styles.fieldLabel}>
                    {t(seat === 0 ? 'menu.nameX' : 'menu.nameO')}
                  </span>
                  <input
                    className="input"
                    value={setup.names[seat]}
                    maxLength={20}
                    onChange={(e) => {
                      const names: [string, string] = [...setup.names];
                      names[seat] = e.target.value;
                      update({ names });
                    }}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {setup.mode === 'watch' && (
          <fieldset className={styles.group}>
            <legend>{t('mode.watch')}</legend>
            <div className={styles.names}>
              {([0, 1] as const).map((seat) => (
                <label key={seat} className="field">
                  <span className={styles.fieldLabel}>
                    {t(seat === 0 ? 'menu.agentX' : 'menu.agentO')}
                  </span>
                  <select
                    className="select"
                    value={setup.watchAgents[seat]}
                    onChange={(e) => {
                      const watchAgents: [string, string] = [...setup.watchAgents];
                      watchAgents[seat] = e.target.value;
                      update({ watchAgents });
                    }}
                  >
                    {AGENT_PRESETS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {pickText(a.label, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="field">
                <span className={styles.fieldLabel}>{t('menu.speed')}</span>
                <select
                  className="select"
                  value={setup.speed}
                  onChange={(e) => update({ speed: e.target.value as MatchSetup['speed'] })}
                >
                  {(['slow', 'normal', 'fast'] as const).map((sp) => (
                    <option key={sp} value={sp}>
                      {t(`speed.${sp}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        )}

        {setup.mode !== 'watch' && (
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={setup.alternate}
              onChange={(e) => update({ alternate: e.target.checked })}
            />
            {t('menu.alternate')}
          </label>
        )}

        <button
          type="button"
          className={`btn btn-primary ${styles.start}`}
          onClick={onStart}
          data-testid="start-match"
        >
          <Play size={18} /> {t('menu.start')}
        </button>
      </div>
    </div>
  );
}
