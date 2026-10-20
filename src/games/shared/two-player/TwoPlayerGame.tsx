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
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from 'react';
import type { Agent } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
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
import { useKeyboard } from '../../../core/input/keyboard';
import { TWO_PLAYER_STRINGS } from './i18n';
import * as flow from './match';
import type { MatchConfig, MatchSetup, MatchState, Mode, Seat } from './match';
import { SHELL_SOUNDS, type ShellSounds } from './sounds';
import styles from './TwoPlayerGame.module.css';

/** Props every game board receives from the shell. Boards own their cursor and arrow keys. */
export interface BoardProps<S, A> {
  state: S;
  /** The human may act now. */
  interactive: boolean;
  hint: A | null;
  animate: boolean;
  t: Translator;
  onAction: (action: A) => void;
}

export interface RoundEndEvent<S> {
  setup: MatchSetup;
  round: S;
  /** Statistics outcome recorded for the round. */
  outcome: 'win' | 'loss' | 'draw' | 'complete';
  /** A human won (always true for a decisive two-player round). */
  humanWon: boolean;
  unlock: (achievementId: string) => void;
}

/** Everything a two-player game supplies to the shared match shell. */
export interface TwoPlayerGameDefinition<S, A> {
  match: MatchConfig<S, A>;
  env: GameEnvironment<S, A>;
  agents: readonly AgentPreset<S, A>[];
  /** Game strings (menu.title, menu.subtitle, difficulty.<id>[.hint], …) layered over the shell's. */
  strings: Record<Locale, Dictionary>;
  Board: ComponentType<BoardProps<S, A>>;
  /** Short badge on the menu logo, e.g. "4×4". */
  badge?: string;
  /** Large boards (Go-style 15×15+): on wide screens, put scores and controls beside the board. */
  wideLayout?: boolean;
  SeatIcon?: ComponentType<{ seat: Seat; size: number }>;
  /** Agent preset used for hints (no hint button when absent). */
  hintAgent?: string;
  /** Difficulty that cannot be beaten: a draw against it gets a special message. */
  unbeatableDifficulty?: string;
  /** Screen-reader announcement for an action that was just applied. */
  describeAction: (before: S, action: A, after: S, t: Translator) => string;
  /** Optional live line under the status during play (e.g. Pente capture counts). */
  statusInfo?: (state: S, t: Translator) => string | null;
  /** Optional extra line under the result (e.g. why a misère round was lost). */
  describeResult?: (state: S, t: Translator) => string | null;
  /** Sound for an action; defaults to the seat's placement sound. */
  actionSound?: (after: S, action: A, mover: Seat, before: S) => SoundSpec;
  sounds?: Partial<ShellSounds>;
  onRoundEnd?: (event: RoundEndEvent<S>) => void;
}

function DefaultSeatIcon({ seat, size }: { seat: Seat; size: number }) {
  return seat === 0 ? (
    <XIcon size={size + 2} strokeWidth={3} />
  ) : (
    <Circle size={size} strokeWidth={3} />
  );
}

type Agents<S, A> = [Agent<S, A> | null, Agent<S, A> | null];

function presetOf<S, A>(def: TwoPlayerGameDefinition<S, A>, id: string): AgentPreset<S, A> {
  const preset = def.agents.find((a) => a.id === id);
  if (!preset) throw new Error(`Unknown agent preset ${id}`);
  return preset;
}

function createAgents<S, A>(def: TwoPlayerGameDefinition<S, A>, setup: MatchSetup): Agents<S, A> {
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

export function TwoPlayerGame<S, A>({
  def,
  services,
}: { def: TwoPlayerGameDefinition<S, A> } & GameProps) {
  const { locale } = services;
  const cfg = def.match;
  const { rules } = cfg;
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...TWO_PLAYER_STRINGS.en, ...def.strings.en },
          es: { ...TWO_PLAYER_STRINGS.es, ...def.strings.es },
        },
        locale,
      ),
    [def.strings, locale],
  );
  const sounds = useMemo(() => ({ ...SHELL_SOUNDS, ...def.sounds }), [def.sounds]);
  const saveSpec = useMemo(() => flow.matchSaveSpec(cfg), [cfg]);
  const servicesRef = useLatest(services);
  const slot = useMemo(() => services.saveSlot(saveSpec), [services, saveSpec]);
  const slotRef = useLatest(slot);
  const SeatIcon = def.SeatIcon ?? DefaultSeatIcon;
  const Board = def.Board;

  const [setup, setSetup] = useState<MatchSetup>(() => ({
    ...flow.defaultSetup(cfg, services.profileName, t('default.player2')),
    mode: services.launchParams.mode === 'watch' ? 'watch' : 'ai',
  }));
  const [saved, setSaved] = useState<MatchState<S> | null>(null);
  const [match, setMatch] = useState<MatchState<S> | null>(null);
  const [hint, setHint] = useState<A | null>(null);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const matchRef = useLatest(match);
  const agentsRef = useRef<Agents<S, A>>([null, null]);
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
    return [s.names[0].trim() || t('seat.0'), s.names[1].trim() || t('seat.1')];
  };

  const recordRound = (next: MatchState<S>, svc: GameServices): MatchState<S> => {
    const outcome = rules.outcome(next.round)!;
    const { mode, humanSeat } = next.setup;
    if (outcome.winner === null) {
      svc.playSound(sounds.draw);
      setAnnouncement(t('result.draw'));
    } else {
      const humanLost = mode === 'ai' && outcome.winner !== humanSeat;
      svc.playSound(humanLost ? sounds.lose : sounds.win);
      setAnnouncement(
        mode === 'ai'
          ? t(humanLost ? 'result.youLose' : 'result.youWin')
          : t('result.wins', { name: names(next.setup)[outcome.winner] }),
      );
    }
    const statsKey = flow.statsMode(next.setup);
    if (!statsKey) return flow.markRecorded(next);
    const kind: RoundEndEvent<S>['outcome'] =
      outcome.winner === null
        ? 'draw'
        : mode === 'local'
          ? 'complete'
          : outcome.winner === humanSeat
            ? 'win'
            : 'loss';
    svc.recordResult({ outcome: kind, mode: statsKey });
    const humanWon = outcome.winner !== null && (mode === 'local' || outcome.winner === humanSeat);
    def.onRoundEnd?.({
      setup: next.setup,
      round: next.round,
      outcome: kind,
      humanWon,
      unlock: svc.unlockAchievement,
    });
    return flow.markRecorded(next);
  };

  /** Applies a new match state with every side effect: sound, announcement, stats, achievements, save. */
  const commit = (next: MatchState<S>, prev: MatchState<S>, action?: A) => {
    const svc = servicesRef.current;
    if (action !== undefined) {
      const mover = rules.moverOfPly(next.round, rules.plies(next.round) - 1);
      svc.playSound(
        def.actionSound?.(next.round, action, mover, prev.round) ??
          (mover === 0 ? sounds.placeX : sounds.placeO),
      );
      setAnnouncement(def.describeAction(prev.round, action, next.round, t));
      setHint(null);
    }
    if (rules.outcome(next.round) && !next.recorded) next = recordRound(next, svc);
    setMatch(next);
    if (next.setup.mode !== 'watch') {
      setSaved(next);
      void slotRef.current.save(next);
    }
  };

  // Computer moves and watch-mode autoplay. The timer only schedules; the action is computed from
  // the exact state it was scheduled for and discarded if the match changed in the meantime.
  useEffect(() => {
    if (!match) return;
    const { setup: s, round } = match;
    if (rules.outcome(round)) {
      if (s.mode !== 'watch' || paused) return;
      const id = window.setTimeout(() => {
        const current = matchRef.current;
        if (current === match) commit(flow.nextRound(cfg, current), current);
      }, flow.SPEED_MS[s.speed] * 2.2);
      return () => window.clearTimeout(id);
    }
    const seat = rules.toMove(round);
    const agent = agentsRef.current[seat];
    if (!agent || (s.mode === 'watch' && paused)) return;
    const delay = s.mode === 'watch' ? flow.SPEED_MS[s.speed] : 380 + rngRef.current.int(320);
    const id = window.setTimeout(() => {
      const current = matchRef.current;
      if (current !== match) return;
      const action = agent.selectAction(def.env, round, seat, { rng: rngRef.current });
      commit(flow.applyMove(cfg, current, action), current, action);
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, paused]);

  const start = (m: MatchState<S>) => {
    agentsRef.current = createAgents(def, m.setup);
    setPaused(false);
    setHint(null);
    setMatch(m);
    if (m.setup.mode !== 'watch') {
      setSaved(m);
      void slotRef.current.save(m);
    }
  };

  const act = (action: A) => {
    if (!match) return;
    if (!flow.isHumanTurn(cfg, match) || !rules.isLegal(match.round, action)) {
      if (!rules.outcome(match.round)) services.playSound(sounds.invalid);
      return;
    }
    commit(flow.applyMove(cfg, match, action), match, action);
  };

  const doUndo = () => match && flow.canUndo(cfg, match) && commit(flow.undo(cfg, match), match);
  const doRestart = () =>
    match && !rules.outcome(match.round) && commit(flow.restartRound(cfg, match), match);
  const doNext = () =>
    match && rules.outcome(match.round) && commit(flow.nextRound(cfg, match), match);
  const doHint = () => {
    if (!match || !def.hintAgent || !flow.isHumanTurn(cfg, match)) return;
    const seat = rules.toMove(match.round);
    setHint(
      presetOf(def, def.hintAgent)
        .create()
        .selectAction(def.env, match.round, seat, { rng: rngRef.current }),
    );
    services.playSound(sounds.hint);
  };
  const toMenu = () => {
    setMatch(null);
    agentsRef.current = [null, null];
  };

  useKeyboard((e) => {
    if (!match) return false;
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
        SeatIcon={SeatIcon}
        onStart={() => start(flow.newMatch(cfg, setup))}
        onResume={() => saved && start(saved)}
      />
    );
  }

  const { round, setup: s, scores } = match;
  const playerNames = names(s);
  const outcome = rules.outcome(round);
  const toMove = rules.toMove(round);
  const humanTurn = flow.isHumanTurn(cfg, match);
  const reduced = services.reducedMotion;
  let status: string;
  if (outcome?.winner === null)
    status =
      s.mode === 'ai' && s.difficulty === def.unbeatableDifficulty
        ? t('result.drawBest')
        : t('result.draw');
  else if (outcome)
    status =
      s.mode === 'ai'
        ? t(outcome.winner === s.humanSeat ? 'result.youWin' : 'result.youLose')
        : t('result.wins', { name: playerNames[outcome.winner] });
  else if (s.mode === 'ai') status = humanTurn ? t('turn.you') : t('turn.computer');
  else if (s.mode === 'local') status = t('turn.player', { name: playerNames[toMove] });
  else status = t('turn.agent', { name: playerNames[toMove] });
  const tone = !outcome
    ? 'neutral'
    : outcome.winner === null
      ? 'draw'
      : s.mode === 'ai' && outcome.winner !== s.humanSeat
        ? 'loss'
        : 'win';

  return (
    <div className={`${styles.play} ${def.wideLayout ? styles.wide : ''}`} data-testid="mnk-play">
      <div className={styles.scoreboard}>
        {([0, 1] as Seat[]).map((seat) => (
          <div
            key={seat}
            className={styles.score}
            data-active={!outcome && toMove === seat}
            data-seat={seat}
          >
            <span className={styles.scoreMark} aria-hidden="true">
              <SeatIcon seat={seat} size={18} />
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
        {def.statusInfo?.(round, t) && (
          <span className={styles.detail} data-testid="status-info">
            {def.statusInfo(round, t)}
          </span>
        )}
        {outcome && def.describeResult?.(round, t) && (
          <span className={styles.detail}>{def.describeResult(round, t)}</span>
        )}
      </div>

      <div className={styles.boardWrap}>
        <Board
          state={round}
          interactive={humanTurn}
          hint={hint}
          animate={!reduced}
          t={t}
          onAction={act}
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
        {outcome ? (
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
                const agent = agentsRef.current[toMove];
                if (!agent) return;
                const action = agent.selectAction(def.env, round, toMove, { rng: rngRef.current });
                commit(flow.applyMove(cfg, match, action), match, action);
              }}
            >
              <StepForward size={16} /> {t('action.step')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn"
              onClick={doUndo}
              disabled={!flow.canUndo(cfg, match)}
            >
              <Undo2 size={16} /> {t('action.undo')}
            </button>
            {def.hintAgent && (
              <button type="button" className="btn" onClick={doHint} disabled={!humanTurn}>
                <Lightbulb size={16} /> {t('action.hint')}
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={doRestart}
              disabled={rules.plies(round) === 0}
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

interface MenuProps<S, A> {
  def: TwoPlayerGameDefinition<S, A>;
  t: Translator;
  locale: Locale;
  setup: MatchSetup;
  setSetup: (s: MatchSetup) => void;
  saved: MatchState<S> | null;
  services: GameServices;
  SeatIcon: ComponentType<{ seat: Seat; size: number }>;
  onStart: () => void;
  onResume: () => void;
}

function Menu<S, A>({
  def,
  t,
  locale,
  setup,
  setSetup,
  saved,
  services,
  SeatIcon,
  onStart,
  onResume,
}: MenuProps<S, A>) {
  const update = (patch: Partial<MatchSetup>) => setSetup({ ...setup, ...patch });
  const modeStats = services.getStats()?.modes[`vs-ai:${setup.difficulty}`];
  const modes: { id: Mode; icon: typeof Bot }[] = [
    { id: 'ai', icon: Bot },
    { id: 'local', icon: Users },
    { id: 'watch', icon: Play },
  ];
  return (
    <div className={styles.menu} data-testid="mnk-menu">
      <div className={styles.menuCard}>
        <div className={styles.menuHeader}>
          <div className={styles.menuLogo} aria-hidden="true">
            <span className={styles.logoSeat0}>
              <SeatIcon seat={0} size={22} />
            </span>
            <span className={styles.logoSeat1}>
              <SeatIcon seat={1} size={22} />
            </span>
            {def.badge && <span className={styles.menuSize}>{def.badge}</span>}
          </div>
          <div>
            <h2 className={styles.menuTitle}>{t('menu.title')}</h2>
            <p className="muted">{t('menu.subtitle')}</p>
          </div>
        </div>

        {saved && !def.match.rules.outcome(saved.round) && (
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
                  seat0: t('seat.0'),
                  seat1: t('seat.1'),
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
                {([0, 1] as const).map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    aria-pressed={setup.humanSeat === seat}
                    onClick={() => update({ humanSeat: seat })}
                    data-testid={`play-as-${seat === 0 ? 'x' : 'o'}`}
                  >
                    {t(`seat.${seat}`)}
                  </button>
                ))}
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
                  <span className={styles.fieldLabel}>{t(`menu.name${seat}`)}</span>
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
                  <span className={styles.fieldLabel}>{t(`menu.agent${seat}`)}</span>
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

        {setup.mode !== 'watch' && def.match.fixedFirstSeat === undefined && (
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
