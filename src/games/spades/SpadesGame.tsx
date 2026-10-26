/** The Spades table: the player and an AI partner against two AI players, a game to 500. */
import { Bot, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { SPADES, cardName } from '../shared/cards/cards';
import { POKER_SOUNDS } from '../shared/poker/sounds';
import { sortHand, trickWinner } from '../shared/tricks/cards';
import { TrickTable, type TrickSeat } from '../shared/tricks/TrickTable';
import styles from '../shared/tricks/TrickGame.module.css';
import { levelAction, mediumBid, searchBid, searchPlay } from './ai';
import {
  TARGET,
  applySpadesAction,
  createSpades,
  isValidSpadesState,
  playableCards,
  teamOf,
  type SpadesState,
} from './engine';
import { NAMES, STRINGS } from './i18n';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium', 'hard', 'medium'];

interface Saved {
  state: SpadesState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

export function SpadesGame({ services }: GameProps) {
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
          isValidSpadesState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SpadesState | null>(() =>
    mode === 'watch' ? createSpades(newSeed()) : null,
  );
  const [cursor, setCursor] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [advisedBid, setAdvisedBid] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [showLast, setShowLast] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const stateRef = useLatest(state);
  const rng = useRef(new Rng(fixedDeal ?? randomSeed()));

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

  const start = (s: SpadesState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setHint(null);
    setAdvisedBid(null);
    setPaused(false);
    setShowLast(false);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const handOver = (s: SpadesState) => {
    const svc = servicesRef.current;
    const r = s.result!;
    setAnnouncement(
      t('hand.summary', {
        us: `${r.points[0] >= 0 ? '+' : ''}${r.points[0]}`,
        them: `${r.points[1] >= 0 ? '+' : ''}${r.points[1]}`,
      }),
    );
    if (mode !== 'play') return;
    svc.playSound(r.points[0] > r.points[1] ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
    if (r.made[0] && (s.bids[0]! > 0 || s.bids[2]! > 0)) svc.unlockAchievement('contract');
    if (r.nil[0] === true) svc.unlockAchievement('nil');
    if (!r.made[1]) svc.unlockAchievement('set');
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
    let next: SpadesState;
    try {
      next = applySpadesAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    setHint(null);
    setAdvisedBid(null);
    if (a === 'next') {
      svc.playSound(POKER_SOUNDS.deal);
      setShowLast(false);
    } else if (a.startsWith('bid:')) {
      svc.playSound(POKER_SOUNDS.check);
      const bid = Number(a.slice(4));
      setAnnouncement(`${nameOf(before.toAct)}: ${bid === 0 ? t('bid.nil') : bid}`);
    } else {
      const card = Number(a.slice(5));
      svc.playSound(POKER_SOUNDS.check);
      setAnnouncement(`${nameOf(before.toAct)}: ${cardName(card, locale)}`);
      if (next.played > before.played) setShowLast(true);
      if (next.phase === 'done') handOver(next);
    }
    setState(next);
    if (mode === 'play' && next.winner === null) void slot.save({ state: next, difficulty });
  };

  useEffect(() => {
    if (!showLast) return;
    const id = window.setTimeout(() => setShowLast(false), services.reducedMotion ? 500 : 1100);
    return () => window.clearTimeout(id);
  }, [showLast, services.reducedMotion]);

  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.winner !== null) return;
    if (state.phase === 'done') {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 3000);
      return () => window.clearTimeout(id);
    }
    if (mode === 'play' && state.toAct === 0) return;
    const level = mode === 'watch' ? WATCH[state.toAct]! : difficulty;
    const delay = showLast ? (services.reducedMotion ? 600 : 1200) : 650;
    const id = window.setTimeout(() => act(levelAction(state, level, rng.current)), delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = mode === 'play' && !!state && state.toAct === 0 && state.winner === null;
  const bidding = myTurn && state.phase === 'bid';
  const hand = state ? sortHand(state.hands[0]!) : [];
  const playable = new Set<number>(myTurn && state.phase === 'play' ? playableCards(state) : []);

  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    if (bidding) {
      const bid = difficulty === 'hard' ? searchBid(state, 12, rng.current) : mediumBid(state);
      setAdvisedBid(bid);
      setHint(
        t('bid.advice', {
          level: t(`difficulty.${difficulty === 'hard' ? 'hard' : 'medium'}`),
          bid: bid === 0 ? t('bid.nil') : bid,
        }),
      );
    } else
      setHint(t('hint.play', { card: cardName(searchPlay(state, 16, rng.current).card, locale) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.phase === 'done' && state.winner === null && (k === 'n' || k === 'enter')) {
      act('next');
      return true;
    }
    if (!myTurn) return false;
    if (bidding && /^[0-9]$/.test(k)) {
      act(`bid:${k}`);
      return true;
    }
    if (k === 'h') {
      showHint();
      return true;
    }
    if (state.phase !== 'play') return false;
    if (k === 'arrowleft' || k === 'arrowright') {
      setCursor((c) => (c + (k === 'arrowleft' ? -1 : 1) + hand.length) % hand.length);
      return true;
    }
    if (k === 'enter' || k === ' ') {
      const card = hand[cursor % Math.max(1, hand.length)];
      if (card !== undefined && playable.has(card)) act(`play:${card}`);
      return true;
    }
    return false;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="spades-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="spades-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    hand: saved.state.handNo,
                    us: saved.state.scores[0],
                    them: saved.state.scores[1],
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
                  data-testid={`spades-difficulty-${d}`}
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
              onClick={() => start(createSpades(newSeed()), 'play', difficulty)}
              data-testid="spades-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createSpades(newSeed()), 'watch', difficulty)}
              data-testid="spades-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const seats: TrickSeat[] = [0, 1, 2, 3].map((i) => {
    const bid = s.bids[i];
    return {
      name: nameOf(i),
      detail:
        bid === null || bid === undefined
          ? t('seat.waiting')
          : bid === 0
            ? t('seat.nil', { won: s.tricks[i]! })
            : t('seat.bid', { bid, won: s.tricks[i]! }),
      cards: i === 0 ? [] : mode === 'watch' ? sortHand(s.hands[i]!) : s.hands[i]!.map(() => 0),
      active: s.toAct === i && s.phase !== 'done',
      team: teamOf(i),
      badge: i === 2 && mode === 'play' ? t('partner') : s.dealer === i ? 'D' : undefined,
    };
  });
  const trick = s.trick.length ? s.trick : showLast && s.lastTrick ? s.lastTrick : [];
  const winnerSeat =
    !s.trick.length && showLast && s.lastTrick ? trickWinner(s.lastTrick, SPADES).seat : null;
  const status =
    s.winner !== null
      ? mode === 'play'
        ? s.winner === 0
          ? t('game.won', { us: s.scores[0], them: s.scores[1] })
          : t('game.lost', { us: s.scores[0], them: s.scores[1] })
        : t('game.watch', {
            team: s.winner === 0 ? `${nameOf(0)} / ${nameOf(2)}` : `${nameOf(1)} / ${nameOf(3)}`,
            a: Math.max(...s.scores),
            b: Math.min(...s.scores),
          })
      : s.phase === 'done'
        ? announcement
        : bidding
          ? t('bid.prompt')
          : myTurn
            ? s.trick.length
              ? t('your-turn.follow')
              : t('your-turn')
            : t('thinking', { name: nameOf(s.toAct) });

  return (
    <div className={styles.play} data-testid="spades">
      <div className={styles.scoreboard}>
        <span className={styles.team} data-team={0} data-testid="spades-us">
          {t('team', {
            name: mode === 'watch' ? `${nameOf(0)} / ${nameOf(2)}` : t('us'),
            score: s.scores[0],
            bags: s.bags[0],
          })}
        </span>
        <span className={styles.team} data-team={1} data-testid="spades-them">
          {t('team', {
            name: mode === 'watch' ? `${nameOf(1)} / ${nameOf(3)}` : t('them'),
            score: s.scores[1],
            bags: s.bags[1],
          })}
        </span>
        <span className="muted">
          {t('hand', { n: s.handNo })} · {t('target', { n: TARGET })}
          {s.spadesBroken && s.phase === 'play' ? ` · ♠ ${t('spades.broken')}` : ''}
        </span>
      </div>
      <TrickTable
        seats={seats}
        hand={hand}
        playable={playable}
        onCard={(c) => act(`play:${c}`)}
        trick={trick}
        winner={winnerSeat}
        reveal={mode === 'watch'}
        locale={locale}
        colorblind={services.colorblind}
        still={services.reducedMotion}
        labels={{ hidden: t('card.hidden'), hand: t('your-hand') }}
        center={
          <p className={styles.status} data-testid="spades-status">
            {status}
          </p>
        }
      />
      {bidding && (
        <div className={styles.bids} data-testid="spades-bids">
          {Array.from({ length: 14 }, (_, n) => (
            <button
              key={n}
              type="button"
              data-advised={advisedBid === n}
              onClick={() => act(`bid:${n}`)}
              data-testid={`spades-bid-${n}`}
            >
              {n === 0 ? t('bid.nil') : n}
            </button>
          ))}
        </div>
      )}
      <div className={styles.controls}>
        {myTurn && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={showHint}
            data-testid="spades-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && s.phase === 'done' && s.winner === null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="spades-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && s.winner !== null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createSpades(newSeed()), 'play', difficulty)}
            data-testid="spades-again"
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
          data-testid="spades-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="spades-hint-text">
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
