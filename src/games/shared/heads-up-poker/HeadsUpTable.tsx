/**
 * A heads-up table for the small research pokers (#091 Kuhn, #092 Leduc): a match against one AI
 * opponent (or two AIs to watch), big cards, the hand's betting log, a coach that shows the Nash
 * equilibrium's mix for the player's decision, and — once a hand is over — the probabilities the
 * opponent's strategy gave to the moves it made.
 */
import { Bot, GraduationCap, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { sampleIndex } from '../../../ai/agents/cfr';
import { cardName } from '../cards/cards';
import { CardView } from '../cards/CardView';
import { POKER_SOUNDS } from '../poker/sounds';
import { HEADS_UP_STRINGS } from './i18n';
import styles from './HeadsUpTable.module.css';

export type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export interface HeadsUpResult {
  winner: 0 | 1;
  won: number;
  showdown: boolean;
}

/** What the table shows of a match state. */
export interface HeadsUpView {
  chips: [number, number];
  handNo: number;
  /** Card ids (for the card art) of each player's private card. */
  hole: [number, number];
  /** Public cards dealt so far, and how many there will be. */
  board: number[];
  boardSlots: number;
  pot: number;
  /** What each player has put in this hand. */
  paid: [number, number];
  toAct: 0 | 1 | -1;
  result: HeadsUpResult | null;
  matchWinner: 0 | 1 | null;
  /** This hand's actions in order. */
  log: { player: 0 | 1; action: string }[];
  /** Name of the hand at showdown for each player (e.g. "pair of kings"), when shown. */
  showdownNames?: [string, string];
}

/** A mixed decision: options and their probabilities. */
export interface Mix {
  options: string[];
  probs: number[];
}

export interface HeadsUpDefinition<S> {
  /** Title key and game-specific strings (rules summary, hand names) merged over the shared ones. */
  strings: Record<Locale, Dictionary>;
  startChips: number;
  create(seed: number): S;
  apply(s: S, a: string): S;
  legal(s: S): string[];
  isValid(d: unknown): d is S;
  view(s: S, locale: Locale): HeadsUpView;
  /** The opponents' mixed strategies for the player to act. */
  policy(difficulty: Difficulty, s: S): Mix;
  /** Achievements to unlock when a hand ends (for player 0). */
  onHandEnd?(s: S, unlock: (id: string) => void): void;
}

interface Saved<S> {
  state: S;
  difficulty: Difficulty;
}

type Mode = 'menu' | 'play' | 'watch';
const WATCH: [Difficulty, Difficulty] = ['hard', 'medium'];

export function HeadsUpTable<S>({
  def,
  services,
}: {
  def: HeadsUpDefinition<S>;
  services: GameServices;
}) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...HEADS_UP_STRINGS.en, ...def.strings.en },
          es: { ...HEADS_UP_STRINGS.es, ...def.strings.es },
        },
        locale,
      ),
    [locale, def],
  );
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved<S>>({
        schema: 1,
        validate: (d: unknown): d is Saved<S> =>
          typeof d === 'object' &&
          d !== null &&
          DIFFICULTIES.includes((d as Saved<S>).difficulty) &&
          def.isValid((d as Saved<S>).state),
      }),
    [services, def],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [saved, setSaved] = useState<Saved<S> | null>(null);
  const [state, setState] = useState<S | null>(() =>
    mode === 'watch' ? def.create(fixedDeal ?? randomSeed() >>> 0) : null,
  );
  const [paused, setPaused] = useState(false);
  const [coach, setCoach] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  /** Probabilities behind the opponent's moves this hand (shown once the hand is over). */
  const [aiMixes, setAiMixes] = useState<{ action: string; p: number }[]>([]);
  const stateRef = useLatest(state);
  const rng = useRef(new Rng(fixedDeal ?? randomSeed()));

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && def.view(d.state, locale).matchWinner === null) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  const nameOf = (p: 0 | 1) =>
    mode === 'watch' ? t(`difficulty.${WATCH[p]}`) : p === 0 ? t('you') : t('ai');

  const start = (s: S, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setPaused(false);
    setAiMixes([]);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    if (!def.legal(before).includes(a)) {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const v0 = def.view(before, locale);
    const next = def.apply(before, a);
    const v = def.view(next, locale);
    const svc = servicesRef.current;
    if (a === 'next') {
      setAiMixes([]);
      svc.playSound(POKER_SOUNDS.deal);
    } else {
      svc.playSound(
        a === 'fold' ? POKER_SOUNDS.fold : a === 'check' ? POKER_SOUNDS.check : POKER_SOUNDS.chips,
      );
      setAnnouncement(
        t('announce.act', { name: nameOf(v0.toAct as 0 | 1), action: t(`action.${a}`) }),
      );
    }
    if (v.result && !v0.result) {
      const r = v.result;
      const you = mode === 'play' && r.winner === 0 ? '.you' : '';
      setAnnouncement(
        t(`${r.showdown ? 'result.showdown' : 'result.fold'}${you}`, {
          name: nameOf(r.winner),
          n: r.won,
        }),
      );
      if (mode === 'play') {
        svc.playSound(r.winner === 0 ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
        if (r.winner === 0) svc.unlockAchievement('first-hand');
        def.onHandEnd?.(next, (id) => svc.unlockAchievement(id));
      }
      if (v.matchWinner !== null && mode === 'play') {
        const won = v.matchWinner === 0;
        svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
        // The score is the length of a won match (fastest wins first).
        svc.recordResult({
          outcome: won ? 'win' : 'loss',
          score: won ? v.handNo : undefined,
          mode: difficulty,
        });
        if (won) {
          svc.unlockAchievement('match');
          if (difficulty === 'hard') svc.unlockAchievement('beat-nash');
        }
        void slot.clear();
        setSaved(null);
      }
    }
    setState(next);
    if (mode === 'play' && v.matchWinner === null) void slot.save({ state: next, difficulty });
  };

  // The AI's turns (both seats when watching); in watch mode hands deal themselves.
  useEffect(() => {
    if (!state || mode === 'menu' || paused) return;
    const v = def.view(state, locale);
    if (v.matchWinner !== null) return;
    if (v.result) {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 2200);
      return () => window.clearTimeout(id);
    }
    if (mode === 'play' && v.toAct === 0) return;
    const seat = v.toAct as 0 | 1;
    const id = window.setTimeout(
      () => {
        const mix = def.policy(mode === 'watch' ? WATCH[seat] : difficulty, state);
        const k = sampleIndex(mix.probs, rng.current);
        if (seat === 1 || mode === 'watch')
          setAiMixes((m) => [...m, { action: mix.options[k]!, p: mix.probs[k]! }]);
        act(mix.options[k]!);
      },
      services.reducedMotion ? 350 : 800,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const view = state ? def.view(state, locale) : null;
  const myTurn = mode === 'play' && !!view && !view.result && view.toAct === 0;
  const legal = state && myTurn ? def.legal(state) : [];
  const nash = state && myTurn ? def.policy('hard', state) : null;

  useKeyboard((e) => {
    if (mode !== 'play' || !view) return false;
    const k = e.key.toLowerCase();
    if (view.result && view.matchWinner === null && (k === 'n' || k === 'enter')) {
      act('next');
      return true;
    }
    const map: Record<string, string[]> = {
      c: ['check', 'call'],
      b: ['bet', 'raise'],
      r: ['raise', 'bet'],
      f: ['fold'],
    };
    if (myTurn && map[k]) {
      const a = map[k]!.find((x) => legal.includes(x));
      if (a) act(a);
      return true;
    }
    if (k === 'h') {
      setCoach((c) => !c);
      return true;
    }
    return false;
  });

  if (mode === 'menu' || !state || !view) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="hu-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle', { chips: def.startChips })}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="hu-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    hand: def.view(saved.state, locale).handNo,
                    you: def.view(saved.state, locale).chips[0],
                    ai: def.view(saved.state, locale).chips[1],
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={styles.group}>
            <legend>{t('menu.difficulty')}</legend>
            <div className={styles.segmented}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  data-testid={`hu-difficulty-${d}`}
                >
                  {t(`difficulty.${d}`)}
                </button>
              ))}
            </div>
            <p className={styles.hintText}>{t(`difficulty.${difficulty}.hint`)}</p>
            {stats && (
              <p className={styles.hintText}>
                {t('menu.record', {
                  difficulty: t(`difficulty.${difficulty}`),
                  wins: stats.wins,
                  played: stats.played,
                })}
              </p>
            )}
          </fieldset>
          <div className={styles.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(def.create(fixedDeal ?? randomSeed() >>> 0), 'play', difficulty)}
              data-testid="hu-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                start(def.create(fixedDeal ?? randomSeed() >>> 0), 'watch', difficulty)
              }
              data-testid="hu-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const r = view.result;
  const showAi = mode === 'watch' || !!r?.showdown;
  const status =
    view.matchWinner !== null
      ? mode === 'watch'
        ? t('over.watch', { name: nameOf(view.matchWinner) })
        : view.matchWinner === 0
          ? t('over.won')
          : t('over.lost')
      : r
        ? announcement
        : myTurn
          ? t('your-turn')
          : t('thinking', { name: nameOf(view.toAct as 0 | 1) });

  const seatBlock = (p: 0 | 1) => {
    const faceUp = p === 0 || showAi;
    const card = view.hole[p];
    return (
      <div
        className={[
          styles.seat,
          view.toAct === p && !r ? styles.acting : '',
          r?.winner === p ? styles.winner : '',
        ].join(' ')}
        data-testid={`hu-seat-${p}`}
      >
        <div
          className={styles.card}
          role="img"
          aria-label={faceUp ? cardName(card, locale) : t('card.hidden')}
          data-testid={`hu-card-${p}`}
        >
          <CardView
            key={`${view.handNo}-${p}-${faceUp}`}
            card={card}
            faceUp={faceUp}
            fourColor={services.colorblind}
          />
        </div>
        <div className={styles.plate}>
          <span className={styles.name}>{nameOf(p)}</span>
          <span className={styles.chips} data-testid={`hu-chips-${p}`}>
            {t('chips', { n: view.chips[p] })}
          </span>
          {view.paid[p] > 0 && !r && (
            <span className={styles.paid}>{t('in-pot', { n: view.paid[p] })}</span>
          )}
          {r?.showdown && view.showdownNames && (
            <span className={styles.handName}>{view.showdownNames[p]}</span>
          )}
        </div>
        {r?.winner === p && <span className={styles.won}>+{r.won}</span>}
      </div>
    );
  };

  return (
    <div className={styles.play} data-testid="heads-up">
      <div className={styles.stats}>
        <span>
          {t('hand')} <strong data-testid="hu-hand">{view.handNo}</strong>
        </span>
        {mode === 'play' && <span>{t(`difficulty.${difficulty}`)}</span>}
      </div>
      <div className={`${styles.table} ${services.reducedMotion ? styles.still : ''}`}>
        {seatBlock(1)}
        <div className={styles.center}>
          {view.boardSlots > 0 && (
            <div className={styles.board} data-testid="hu-board">
              {Array.from({ length: view.boardSlots }, (_, k) => {
                const c = view.board[k];
                return (
                  <div
                    key={k}
                    className={`${styles.boardCard} ${c === undefined ? styles.slot : ''}`}
                    role={c === undefined ? undefined : 'img'}
                    aria-label={c === undefined ? undefined : cardName(c, locale)}
                  >
                    {c !== undefined && (
                      <CardView
                        key={`${view.handNo}-b${k}`}
                        card={c}
                        faceUp
                        fourColor={services.colorblind}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <span className={styles.pot} data-testid="hu-pot">
            {t('pot', { n: view.pot })}
          </span>
          <ol className={styles.log} data-testid="hu-log">
            {view.log.map((x, k) => (
              <li key={k} data-p={x.player}>
                {nameOf(x.player)}: {t(`action.${x.action}`)}
              </li>
            ))}
          </ol>
        </div>
        {seatBlock(0)}
      </div>
      <div className={styles.status} data-testid="hu-status">
        {status}
      </div>
      <div className={styles.controls}>
        {myTurn &&
          legal.map((a) => (
            <button
              key={a}
              type="button"
              className={`btn ${a === 'call' || a === 'check' ? 'btn-primary' : ''}`}
              onClick={() => act(a)}
              data-testid={`hu-${a}`}
            >
              {t(`button.${a}`)}
              {coach && nash && (
                <small className={styles.mix}>
                  {Math.round((nash.probs[nash.options.indexOf(a)] ?? 0) * 100)}%
                </small>
              )}
            </button>
          ))}
        {mode === 'play' && r && view.matchWinner === null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="hu-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && view.matchWinner !== null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(def.create(fixedDeal ?? randomSeed() >>> 0), 'play', difficulty)}
            data-testid="hu-again"
          >
            {t('again')}
          </button>
        )}
        {mode === 'play' && (
          <button
            type="button"
            className="btn btn-ghost"
            aria-pressed={coach}
            onClick={() => setCoach((c) => !c)}
            data-testid="hu-coach"
          >
            <GraduationCap size={16} /> {t(coach ? 'coach.on' : 'coach.off')}
          </button>
        )}
        {mode === 'watch' && (
          <button type="button" className="btn" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (mode === 'play' && view.matchWinner === null) setSaved({ state, difficulty });
            setMode('menu');
            setState(null);
          }}
          data-testid="hu-menu"
        >
          {t('menu')}
        </button>
      </div>
      {coach && myTurn && <p className={styles.note}>{t('coach.note')}</p>}
      {r && aiMixes.length > 0 && (
        <p className={styles.note} data-testid="hu-ai-mix">
          {t('ai.mix', {
            moves: aiMixes
              .map((m) =>
                t('ai.move', { action: t(`action.${m.action}`), p: Math.round(m.p * 100) }),
              )
              .join(' · '),
          })}
        </p>
      )}
      <p className={styles.keys}>{t('keys')}</p>
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
