import {
  Bot,
  Circle,
  LayoutList,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  StepForward,
  Undo2,
  Users,
  X as XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Agent } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import { moveCursor } from '../../../core/game-engine/grid';
import { useLatest } from '../../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../../core/game-engine/random';
import type { GameProps, GameServices } from '../../../core/game-engine/types';
import {
  createTranslator,
  pickText,
  type Dictionary,
  type Locale,
  type Translator,
} from '../../../core/i18n';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import { isLegalCell, type MnkState, type Seat } from './engine';
import { MNK_STRINGS } from './i18n';
import * as flow from './match';
import type { MatchSetup, MatchState, Mode, MnkMatchConfig } from './match';
import { MnkBoard } from './MnkBoard';
import { MNK_SOUNDS, type MnkSounds } from './sounds';
import styles from './MnkGame.module.css';

export interface RoundEndEvent {
  setup: MatchSetup;
  round: MnkState;
  /** Statistics outcome recorded for the round. */
  outcome: 'win' | 'loss' | 'draw' | 'complete';
  /** A human won (always true for a decisive two-player round). */
  humanWon: boolean;
  unlock: (achievementId: string) => void;
}

/** Everything that distinguishes one m,n,k game's UI from another. */
export interface MnkGameDefinition {
  match: MnkMatchConfig;
  env: GameEnvironment<MnkState, number>;
  agents: readonly AgentPreset<MnkState, number>[];
  /** Game strings (title, subtitle, difficulty names/hints, board label) over MNK_STRINGS. */
  strings: Record<Locale, Dictionary>;
  sounds?: Partial<MnkSounds>;
  /** Digit keys mapped to cells (e.g. numeric-keypad layout on 3×3). */
  digitKeys?: Readonly<Record<string, number>>;
  /** Agent preset used to compute hints. */
  hintAgent: string;
  /** Difficulty that cannot be beaten: a draw against it gets a special message. */
  unbeatableDifficulty?: string;
  /** Unlock game-specific achievements after each finished round outside watch mode. */
  onRoundEnd?: (event: RoundEndEvent) => void;
}

type Agents = [Agent<MnkState, number> | null, Agent<MnkState, number> | null];

function presetOf(def: MnkGameDefinition, id: string): AgentPreset<MnkState, number> {
  const preset = def.agents.find((a) => a.id === id);
  if (!preset) throw new Error(`Unknown agent preset ${id}`);
  return preset;
}

function createAgents(def: MnkGameDefinition, setup: MatchSetup): Agents {
  if (setup.mode === 'watch')
    return [
      presetOf(def, setup.watchAgents[0]).create(),
      presetOf(def, setup.watchAgents[1]).create(),
    ];
  if (setup.mode === 'ai') {
    const cpu = presetOf(def, setup.difficulty).create();
    return setup.humanSeat === 0 ? [null, cpu] : [cpu, null];
  }
  return [null, null];
}

export function MnkGame({ def, services }: { def: MnkGameDefinition } & GameProps) {
  const { locale } = services;
  const { rules } = def.match;
  const cols = rules.cols;
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...MNK_STRINGS.en, ...def.strings.en },
          es: { ...MNK_STRINGS.es, ...def.strings.es },
        },
        locale,
      ),
    [def.strings, locale],
  );
  const sounds = useMemo(() => ({ ...MNK_SOUNDS, ...def.sounds }), [def.sounds]);
  const saveSpec = useMemo(() => flow.matchSaveSpec(def.match), [def.match]);
  const servicesRef = useLatest(services);
  const slot = useMemo(() => services.saveSlot(saveSpec), [services, saveSpec]);
  const slotRef = useLatest(slot);
  const center = Math.floor(rules.rows / 2) * cols + Math.floor(cols / 2);

  const [setup, setSetup] = useState<MatchSetup>(() => ({
    ...flow.defaultSetup(def.match, services.profileName, t('default.player2')),
    mode: services.launchParams.mode === 'watch' ? 'watch' : 'ai',
  }));
  const [saved, setSaved] = useState<MatchState | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [cursor, setCursor] = useState(center);
  const [focusToken, setFocusToken] = useState(0);
  const [hint, setHint] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const matchRef = useLatest(match);
  const agentsRef = useRef<Agents>([null, null]);
  const rngRef = useRef(new Rng(randomSeed()));

  useEffect(() => {
    let cancelled = false;
    void slotRef.current.load().then((m) => {
      if (!cancelled && m && m.setup.mode !== 'watch') setSaved(m);
    });
    return () => {
      cancelled = true;
    };
  }, [slotRef]);

  const names = (s: MatchSetup): [string, string] => {
    if (s.mode === 'ai') {
      const cpu = `${t('computer')} · ${t(`difficulty.${s.difficulty}`)}`;
      return s.humanSeat === 0 ? [t('you'), cpu] : [cpu, t('you')];
    }
    if (s.mode === 'watch')
      return [
        pickText(presetOf(def, s.watchAgents[0]).label, locale),
        pickText(presetOf(def, s.watchAgents[1]).label, locale),
      ];
    return [s.names[0].trim() || 'X', s.names[1].trim() || 'O'];
  };

  /** Applies a new match state with every side effect of the move: sound, stats, achievements, save. */
  const commit = (next: MatchState, prev: MatchState) => {
    const svc = servicesRef.current;
    const moved = next.round.history.length > prev.round.history.length;
    if (moved) {
      const cell = next.round.history[next.round.history.length - 1]!;
      const mark = next.round.board[cell] === 1 ? 'X' : 'O';
      svc.playSound(mark === 'X' ? sounds.placeX : sounds.placeO);
      setAnnouncement(
        t('announce.move', { mark, row: Math.floor(cell / cols) + 1, col: (cell % cols) + 1 }),
      );
    }
    const result = next.round.result;
    if (result && !next.recorded) {
      next = recordRound(next, svc);
    }
    if (moved) setHint(null);
    setMatch(next);
    if (next.setup.mode !== 'watch') {
      setSaved(next);
      void slotRef.current.save(next);
    }
  };

  const recordRound = (next: MatchState, svc: GameServices): MatchState => {
    const result = next.round.result!;
    const { mode, humanSeat } = next.setup;
    if (result.kind === 'draw') {
      svc.playSound(sounds.draw);
      setAnnouncement(t('result.draw'));
    } else {
      const humanLost = mode === 'ai' && result.winner !== humanSeat;
      svc.playSound(humanLost ? sounds.lose : sounds.win);
      setAnnouncement(
        mode === 'ai'
          ? t(humanLost ? 'result.youLose' : 'result.youWin')
          : t('result.wins', { name: names(next.setup)[result.winner] }),
      );
    }
    const statsKey = flow.statsMode(next.setup);
    if (!statsKey) return flow.markRecorded(next);
    const outcome: RoundEndEvent['outcome'] =
      result.kind === 'draw'
        ? 'draw'
        : mode === 'local'
          ? 'complete'
          : result.winner === humanSeat
            ? 'win'
            : 'loss';
    svc.recordResult({ outcome, mode: statsKey });
    const humanWon = result.kind === 'win' && (mode === 'local' || result.winner === humanSeat);
    def.onRoundEnd?.({
      setup: next.setup,
      round: next.round,
      outcome,
      humanWon,
      unlock: svc.unlockAchievement,
    });
    return flow.markRecorded(next);
  };

  // Computer moves and watch-mode autoplay. The timer only schedules; the move is computed from the
  // exact state it was scheduled for and discarded if the match changed in the meantime.
  useEffect(() => {
    if (!match) return;
    const { setup: s, round } = match;
    if (round.result) {
      if (s.mode !== 'watch' || paused) return;
      const id = window.setTimeout(() => {
        const current = matchRef.current;
        if (current === match) commit(flow.nextRound(def.match, current), current);
      }, flow.SPEED_MS[s.speed] * 2.2);
      return () => window.clearTimeout(id);
    }
    const agent = agentsRef.current[round.toMove];
    if (!agent || (s.mode === 'watch' && paused)) return;
    const delay = s.mode === 'watch' ? flow.SPEED_MS[s.speed] : 380 + rngRef.current.int(320);
    const id = window.setTimeout(() => {
      const current = matchRef.current;
      if (current !== match) return;
      const cell = agent.selectAction(def.env, round, round.toMove, { rng: rngRef.current });
      commit(flow.applyMove(def.match, current, cell), current);
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, paused]);

  const start = (m: MatchState) => {
    agentsRef.current = createAgents(def, m.setup);
    setPaused(false);
    setHint(null);
    setCursor(center);
    setMatch(m);
    if (m.setup.mode !== 'watch') {
      setSaved(m);
      void slotRef.current.save(m);
    }
  };

  const place = (cell: number) => {
    if (!match) return;
    if (!flow.isHumanTurn(match) || !isLegalCell(rules, match.round, cell)) {
      if (!match.round.result) services.playSound(sounds.invalid);
      return;
    }
    commit(flow.applyMove(def.match, match, cell), match);
  };

  const doUndo = () => match && flow.canUndo(match) && commit(flow.undo(def.match, match), match);
  const doRestart = () =>
    match && !match.round.result && commit(flow.restartRound(def.match, match), match);
  const doNext = () => match?.round.result && commit(flow.nextRound(def.match, match), match);
  const doHint = () => {
    if (!match || !flow.isHumanTurn(match)) return;
    const cell = presetOf(def, def.hintAgent)
      .create()
      .selectAction(def.env, match.round, match.round.toMove, { rng: rngRef.current });
    setHint(cell);
    setCursor(cell);
    services.playSound(sounds.hint);
  };
  const toMenu = () => {
    setMatch(null);
    agentsRef.current = [null, null];
  };

  useKeyboard((e) => {
    if (!match) return false;
    const dir = arrowDirection(e.key);
    if (dir) {
      setCursor((c) => moveCursor(c, dir, rules));
      setFocusToken((n) => n + 1);
      return true;
    }
    const digitCell = def.digitKeys?.[e.key];
    if (digitCell !== undefined) {
      setCursor(digitCell);
      place(digitCell);
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
        def={def}
        t={t}
        locale={locale}
        setup={setup}
        setSetup={setSetup}
        saved={saved}
        services={services}
        onStart={() => start(flow.newMatch(def.match, setup))}
        onResume={() => saved && start(saved)}
      />
    );
  }

  const { round, setup: s, scores } = match;
  const playerNames = names(s);
  const result = round.result;
  const humanTurn = flow.isHumanTurn(match);
  const reduced = services.reducedMotion;
  let status: string;
  if (result?.kind === 'draw')
    status =
      s.mode === 'ai' && s.difficulty === def.unbeatableDifficulty
        ? t('result.drawBest')
        : t('result.draw');
  else if (result)
    status =
      s.mode === 'ai'
        ? t(result.winner === s.humanSeat ? 'result.youWin' : 'result.youLose')
        : t('result.wins', { name: playerNames[result.winner] });
  else if (s.mode === 'ai') status = humanTurn ? t('turn.you') : t('turn.computer');
  else if (s.mode === 'local') status = t('turn.player', { name: playerNames[round.toMove] });
  else status = t('turn.agent', { name: playerNames[round.toMove] });
  const tone = !result
    ? 'neutral'
    : result.kind === 'draw'
      ? 'draw'
      : s.mode === 'ai' && result.winner !== s.humanSeat
        ? 'loss'
        : 'win';
  const lastMove = round.history.length ? round.history[round.history.length - 1]! : null;

  return (
    <div className={styles.play} data-testid="mnk-play">
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

      <div className={styles.status} data-tone={tone} data-testid="mnk-status">
        <span className={styles.round}>{t('round', { n: match.roundNumber })}</span>
        <strong>{status}</strong>
      </div>

      <div className={styles.boardWrap}>
        <MnkBoard
          rows={rules.rows}
          cols={cols}
          board={round.board}
          winLine={result?.kind === 'win' ? result.line : null}
          winMark={
            result?.kind === 'win'
              ? result.reason === 'misere-line'
                ? result.winner === 0
                  ? 2
                  : 1
                : result.winner === 0
                  ? 1
                  : 2
              : undefined
          }
          lastMove={lastMove}
          cursor={cursor}
          focusToken={focusToken}
          hint={hint}
          ghost={humanTurn ? (round.toMove === 0 ? 1 : 2) : null}
          animate={!reduced}
          label={t('board.label')}
          cellLabel={(i, c) =>
            t(c === 0 ? 'cell.empty' : c === 1 ? 'cell.x' : 'cell.o', {
              row: Math.floor(i / cols) + 1,
              col: (i % cols) + 1,
            })
          }
          onCell={place}
          onFocusCell={setCursor}
        />
        {tone === 'win' && !reduced && (
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
                    flow.applyMove(
                      def.match,
                      match,
                      agent.selectAction(def.env, round, round.toMove, { rng: rngRef.current }),
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
            <button type="button" className="btn" onClick={doUndo} disabled={!flow.canUndo(match)}>
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
  def: MnkGameDefinition;
  t: Translator;
  locale: Locale;
  setup: MatchSetup;
  setSetup: (s: MatchSetup) => void;
  saved: MatchState | null;
  services: GameServices;
  onStart: () => void;
  onResume: () => void;
}

function Menu({ def, t, locale, setup, setSetup, saved, services, onStart, onResume }: MenuProps) {
  const update = (patch: Partial<MatchSetup>) => setSetup({ ...setup, ...patch });
  const modeStats = services.getStats()?.modes[`vs-ai:${setup.difficulty}`];
  const modes: { id: Mode; icon: typeof Bot }[] = [
    { id: 'ai', icon: Bot },
    { id: 'local', icon: Users },
    { id: 'watch', icon: Play },
  ];
  const { rows, cols } = def.match.rules;
  return (
    <div className={styles.menu} data-testid="mnk-menu">
      <div className={styles.menuCard}>
        <div className={styles.menuHeader}>
          <div className={styles.menuLogo} aria-hidden="true">
            <XIcon size={26} strokeWidth={3} />
            <Circle size={22} strokeWidth={3} />
            <span className={styles.menuSize}>
              {rows}×{cols}
            </span>
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
                {def.match.difficulties.map((d) => (
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
                      const nextNames: [string, string] = [...setup.names];
                      nextNames[seat] = e.target.value;
                      update({ names: nextNames });
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
                    {def.agents.map((a) => (
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
