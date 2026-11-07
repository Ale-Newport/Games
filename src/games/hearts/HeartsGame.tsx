/** The Hearts table: a game to 100 against three AI players (or four AIs to watch). */
import { Bot, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { cardName } from '../shared/cards/cards';
import { POKER_SOUNDS } from '../shared/poker/sounds';
import { sortHand, trickWinner } from '../shared/tricks/cards';
import { TrickTable, type TrickSeat } from '../shared/tricks/TrickTable';
import { choosePass, levelAction, searchPlay } from './ai';
import {
  QUEEN_OF_SPADES,
  TWO_OF_CLUBS,
  applyHeartsAction,
  cardPoints,
  createHearts,
  isValidHeartsState,
  passOffset,
  playableCards,
  type HeartsState,
} from './engine';
import { NAMES, STRINGS } from './i18n';
import styles from './HeartsGame.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium', 'hard', 'medium'];
const PASS_NAMES = { 1: 'left', 3: 'right', 2: 'across' } as const;

interface Saved {
  state: HeartsState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

export function HeartsGame({ services }: GameProps) {
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
          DIFFICULTIES.includes((d as Saved).difficulty) &&
          isValidHeartsState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<HeartsState | null>(() =>
    mode === 'watch' ? createHearts(newSeed()) : null,
  );
  const [picked, setPicked] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  /** A finished trick stays on the table for a moment. */
  const [showLast, setShowLast] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const stateRef = useLatest(state);
  const rng = useRef(new Rng(fixedDeal ?? randomSeed()));
  /** Whether the player put the queen of spades on a trick this hand. */
  const queenPlayed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.winner === null) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const nameOf = (seat: number) =>
    mode === 'watch'
      ? `${seat === 0 ? 'Elena' : NAMES[seat - 1]!} (${t(`difficulty.${WATCH[seat]!}`)})`
      : seat === 0
        ? t('you')
        : NAMES[seat - 1]!;

  const start = (s: HeartsState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setPicked([]);
    setHint(null);
    setPaused(false);
    setShowLast(false);
    queenPlayed.current = false;
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const handOver = (s: HeartsState) => {
    const svc = servicesRef.current;
    const pts = s.handPoints!;
    setAnnouncement(
      s.moon !== null
        ? t('hand.moon', { name: nameOf(s.moon) })
        : t('hand.over', {
            summary: pts.map((p, i) => t('hand.points', { name: nameOf(i), n: p })).join(', '),
          }),
    );
    if (mode !== 'play') return;
    svc.playSound(pts[0] === 0 || s.moon === 0 ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
    if (pts[0] === 0 && s.moon === null) svc.unlockAchievement('clean-hand');
    if (s.moon === 0) svc.unlockAchievement('moon');
    // We played the queen of spades and someone else took it.
    if (queenPlayed.current && !s.taken[0]!.includes(QUEEN_OF_SPADES))
      svc.unlockAchievement('queen-dump');
    if (s.winner !== null) {
      const won = s.winner === 0;
      svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
      svc.recordResult({ outcome: won ? 'win' : 'loss', score: s.scores[0], mode: difficulty });
      if (won) {
        svc.unlockAchievement('win-game');
        if (difficulty === 'hard') svc.unlockAchievement('win-hard');
      }
      void slot.clear();
      setSaved(null);
    }
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    let next: HeartsState;
    try {
      next = applyHeartsAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    setHint(null);
    if (a === 'next') {
      svc.playSound(POKER_SOUNDS.deal);
      setShowLast(false);
      queenPlayed.current = false;
    } else if (a.startsWith('pass:')) {
      if (before.toAct === 0) setPicked([]);
      if (next.phase === 'play') svc.playSound(POKER_SOUNDS.deal);
    } else {
      const card = Number(a.slice(5));
      if (card === QUEEN_OF_SPADES && before.toAct === 0) queenPlayed.current = true;
      svc.playSound(cardPoints(card) ? POKER_SOUNDS.chips : POKER_SOUNDS.check);
      setAnnouncement(`${nameOf(before.toAct)}: ${cardName(card, locale)}`);
      if (next.tricks > before.tricks) setShowLast(true);
      if (next.phase === 'done') handOver(next);
    }
    setState(next);
    if (mode === 'play' && next.winner === null) void slot.save({ state: next, difficulty });
  };

  // Clear a finished trick after a moment.
  useEffect(() => {
    if (!showLast) return;
    const id = window.setTimeout(() => setShowLast(false), services.reducedMotion ? 500 : 1100);
    return () => window.clearTimeout(id);
  }, [showLast, services.reducedMotion]);

  // The AI seats (all four when watching).
  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.winner !== null) return;
    if (state.phase === 'done') {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 2600);
      return () => window.clearTimeout(id);
    }
    if (mode === 'play' && state.toAct === 0) return;
    const level = mode === 'watch' ? WATCH[state.toAct]! : difficulty;
    const delay =
      state.phase === 'pass' ? 150 : showLast ? (services.reducedMotion ? 600 : 1200) : 650;
    const id = window.setTimeout(() => act(levelAction(state, level, rng.current)), delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = mode === 'play' && !!state && state.toAct === 0 && state.winner === null;
  const passing = myTurn && state.phase === 'pass';
  const hand = state ? sortHand(state.hands[0]!) : [];
  const playable = new Set<number>(
    passing ? hand : myTurn && state.phase === 'play' ? playableCards(state) : [],
  );

  const tapCard = (card: number) => {
    if (!state || !myTurn) return;
    if (passing) {
      setPicked((p) =>
        p.includes(card) ? p.filter((c) => c !== card) : p.length < 3 ? [...p, card] : p,
      );
      return;
    }
    act(`play:${card}`);
  };
  const pass = () => {
    if (!passing || picked.length !== 3) return;
    act(`pass:${[...picked].sort((a, b) => a - b).join('.')}`);
  };
  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    if (passing) {
      const cards = choosePass(state.hands[0]!, true);
      setPicked(cards);
      setHint(t('hint.pass', { cards: cards.map((c) => cardName(c, locale)).join(', ') }));
    } else
      setHint(t('hint.play', { card: cardName(searchPlay(state, 24, rng.current).card, locale) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.phase === 'done' && state.winner === null && (k === 'n' || k === 'enter')) {
      act('next');
      return true;
    }
    if (!myTurn) return false;
    if (k === 'arrowleft' || k === 'arrowright') {
      setCursor((c) => (c + (k === 'arrowleft' ? -1 : 1) + hand.length) % hand.length);
      return true;
    }
    if (k === 'enter' || k === ' ') {
      const card = hand[cursor % Math.max(1, hand.length)];
      if (card !== undefined && playable.has(card)) tapCard(card);
      return true;
    }
    if (k === 'p') {
      pass();
      return true;
    }
    if (k === 'h') {
      showHint();
      return true;
    }
    return false;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="hearts-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="hearts-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    hand: saved.state.handNo,
                    score: saved.state.scores[0]!,
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
                  data-testid={`hearts-difficulty-${d}`}
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
              onClick={() => start(createHearts(newSeed()), 'play', difficulty)}
              data-testid="hearts-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createHearts(newSeed()), 'watch', difficulty)}
              data-testid="hearts-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const offset = passOffset(s.handNo) as 0 | 1 | 2 | 3;
  const passName = offset ? PASS_NAMES[offset as 1 | 2 | 3] : null;
  const takenPoints = (seat: number) => s.taken[seat]!.reduce((a, c) => a + cardPoints(c), 0);
  const seats: TrickSeat[] = [0, 1, 2, 3].map((i) => ({
    name: nameOf(i),
    detail: t('seat.detail', { score: s.scores[i]!, taken: takenPoints(i) }),
    cards: i === 0 ? [] : mode === 'watch' ? sortHand(s.hands[i]!) : s.hands[i]!.map(() => 0),
    active: s.toAct === i && s.phase !== 'done',
  }));
  const trick = s.trick.length ? s.trick : showLast && s.lastTrick ? s.lastTrick : [];
  const winnerSeat =
    !s.trick.length && showLast && s.lastTrick ? trickWinner(s.lastTrick).seat : null;
  const status =
    s.winner !== null
      ? s.winner === 0 && mode === 'play'
        ? t('game.won', { score: s.scores[0]! })
        : t('game.lost', { name: nameOf(s.winner), score: s.scores[s.winner]! })
      : s.phase === 'done'
        ? announcement
        : passing
          ? t(`pass.${passName!}`)
          : s.phase === 'pass'
            ? t('pass.waiting')
            : myTurn
              ? s.tricks === 0 && s.trick.length === 0 && s.hands[0]!.includes(TWO_OF_CLUBS)
                ? t('your-lead-first')
                : s.trick.length
                  ? t('your-turn.follow')
                  : t('your-turn')
              : t('thinking', { name: nameOf(s.toAct) });

  return (
    <div className={styles.play} data-testid="hearts">
      <div className={styles.stats}>
        <span>{t('hand', { n: s.handNo })}</span>
        {s.heartsBroken && s.phase === 'play' && <span>♥ {t('hearts.broken')}</span>}
      </div>
      <TrickTable
        seats={seats}
        hand={hand}
        playable={playable}
        picked={passing ? new Set(picked) : undefined}
        fresh={s.phase === 'play' && s.tricks === 0 ? new Set(s.received[0]) : undefined}
        onCard={tapCard}
        trick={trick}
        winner={winnerSeat}
        reveal={mode === 'watch'}
        locale={locale}
        colorblind={services.colorblind}
        still={services.reducedMotion}
        labels={{ hidden: t('card.hidden'), hand: t('your-hand') }}
        center={
          <p className={styles.status} data-testid="hearts-status">
            {status}
          </p>
        }
      />
      <div className={styles.controls}>
        {passing && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={picked.length !== 3}
            onClick={pass}
            data-testid="hearts-pass"
          >
            {t(`pass.button.${passName!}`)} ({picked.length}/3)
          </button>
        )}
        {myTurn && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={showHint}
            data-testid="hearts-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && s.phase === 'done' && s.winner === null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="hearts-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && s.winner !== null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createHearts(newSeed()), 'play', difficulty)}
            data-testid="hearts-again"
          >
            {t('new.game')}
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
            if (mode === 'play' && s.winner === null) setSaved({ state: s, difficulty });
            setMode('menu');
            setState(null);
          }}
          data-testid="hearts-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="hearts-hint-text">
          {hint}
        </p>
      )}
      {mode === 'play' && <p className={styles.keys}>{t('keys')}</p>}
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
