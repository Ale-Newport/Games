/** The euchre table: the player and an AI partner against two AI players, a game to 10. */
import { Bot, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { cardName, suitOf } from '../shared/cards/cards';
import { CardView } from '../shared/cards/CardView';
import { POKER_SOUNDS } from '../shared/poker/sounds';
import { sortHand } from '../shared/tricks/cards';
import { TrickTable, type TrickSeat } from '../shared/tricks/TrickTable';
import styles from '../shared/tricks/TrickGame.module.css';
import { bidAction, levelAction, searchPlay } from './ai';
import {
  TARGET,
  applyEuchreAction,
  cardPower,
  createEuchre,
  effectiveSuit,
  isValidEuchreState,
  legalEuchreActions,
  playableCards,
  sittingOut,
  teamOf,
  type EuchreState,
} from './engine';
import { NAMES, STRINGS } from './i18n';
import euchre from './EuchreGame.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium', 'hard', 'medium'];

interface Saved {
  state: EuchreState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

export function EuchreGame({ services }: GameProps) {
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
          isValidEuchreState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<EuchreState | null>(() =>
    mode === 'watch' ? createEuchre(newSeed()) : null,
  );
  const [alone, setAlone] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
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
  const sideName = (team: 0 | 1) =>
    mode === 'watch'
      ? team === 0
        ? `${nameOf(0)} / ${nameOf(2)}`
        : `${nameOf(1)} / ${nameOf(3)}`
      : t(team === 0 ? 'us' : 'them');

  const start = (s: EuchreState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setHint(null);
    setAlone(false);
    setPaused(false);
    setShowLast(false);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const handOver = (s: EuchreState) => {
    const svc = servicesRef.current;
    const r = s.result!;
    const side = sideName(r.makers);
    setAnnouncement(
      r.euchred
        ? t('result.euchre', { side })
        : r.march
          ? t('result.march', { side, points: r.points[r.makers] })
          : t('result.made', { side, tricks: r.tricks, points: r.points[r.makers] }),
    );
    if (mode !== 'play') return;
    svc.playSound(r.points[0] > 0 ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
    if (r.makers === 0 && !r.euchred && s.maker === 0) svc.unlockAchievement('maker');
    if (r.makers === 0 && r.march) svc.unlockAchievement('march');
    if (r.makers === 0 && r.march && s.alone && s.maker === 0) svc.unlockAchievement('alone');
    if (r.makers === 1 && r.euchred) svc.unlockAchievement('euchre');
    if (s.winner !== null) {
      const won = s.winner === 0;
      svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
      svc.recordResult({
        outcome: won ? 'win' : 'loss',
        score: s.scores[0] - s.scores[1],
        mode: difficulty,
      });
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
    let next: EuchreState;
    try {
      next = applyEuchreAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    setHint(null);
    if (a === 'next') {
      svc.playSound(POKER_SOUNDS.deal);
      setShowLast(false);
      setAlone(false);
    } else if (a.startsWith('play:')) {
      svc.playSound(POKER_SOUNDS.check);
      setAnnouncement(`${nameOf(before.toAct)}: ${cardName(Number(a.slice(5)), locale)}`);
      if (next.played > before.played) setShowLast(true);
      if (next.phase === 'done') handOver(next);
    } else {
      svc.playSound(a === 'pass' ? POKER_SOUNDS.check : POKER_SOUNDS.chips);
      setAnnouncement(`${nameOf(before.toAct)}: ${callText(a)}`);
    }
    setState(next);
    if (mode === 'play' && next.winner === null) void slot.save({ state: next, difficulty });
  };

  const callText = (a: string) => {
    if (a === 'pass') return t('pass');
    if (a.startsWith('order')) return a === 'order-alone' ? t('order.alone') : t('order');
    if (a.startsWith('name')) {
      const suit = t(`suit.${a.slice(a.indexOf(':') + 1)}`);
      return a.startsWith('name-alone') ? t('name.alone', { suit }) : t('name', { suit });
    }
    return a;
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
    const delay = showLast ? (services.reducedMotion ? 600 : 1200) : 700;
    const id = window.setTimeout(() => act(levelAction(state, level, rng.current)), delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = mode === 'play' && !!state && state.toAct === 0 && state.winner === null;
  const phase = state?.phase;
  const hand = state ? sortHand(state.hands[0]!) : [];
  const playable = new Set<number>(
    myTurn && phase === 'play' ? playableCards(state) : myTurn && phase === 'throw' ? hand : [],
  );

  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    if (phase === 'round1' || phase === 'round2') {
      const call = bidAction(state, difficulty === 'easy' ? 'medium' : difficulty);
      const text =
        call === 'pass'
          ? t('call.pass')
          : call.startsWith('order')
            ? t('call.order')
            : t('call.name', { suit: t(`suit.${call.slice(call.indexOf(':') + 1)}`) });
      setHint(
        t('hint.bid', {
          level: t(`difficulty.${difficulty === 'easy' ? 'medium' : difficulty}`),
          call: text,
        }),
      );
    } else if (phase === 'play')
      setHint(t('hint.play', { card: cardName(searchPlay(state, rng.current).card, locale) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.phase === 'done' && state.winner === null && (k === 'n' || k === 'enter')) {
      act('next');
      return true;
    }
    if (!myTurn) return false;
    if (k === 'h') {
      showHint();
      return true;
    }
    if (phase === 'round1' && k === 'o') act(alone ? 'order-alone' : 'order');
    else if (k === 'p' && legalEuchreActions(state).includes('pass')) act('pass');
    else if ((phase === 'play' || phase === 'throw') && (k === 'arrowleft' || k === 'arrowright'))
      setCursor((c) => (c + (k === 'arrowleft' ? -1 : 1) + hand.length) % hand.length);
    else if ((phase === 'play' || phase === 'throw') && (k === 'enter' || k === ' ')) {
      const card = hand[cursor % Math.max(1, hand.length)];
      if (card !== undefined && playable.has(card))
        act(`${phase === 'throw' ? 'throw' : 'play'}:${card}`);
    } else return false;
    return true;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="euchre-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="euchre-resume"
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
                  data-testid={`euchre-difficulty-${d}`}
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
              onClick={() => start(createEuchre(newSeed()), 'play', difficulty)}
              data-testid="euchre-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createEuchre(newSeed()), 'watch', difficulty)}
              data-testid="euchre-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const out = sittingOut(s);
  const bidding = s.phase === 'round1' || s.phase === 'round2';
  const seats: TrickSeat[] = [0, 1, 2, 3].map((i) => ({
    name: nameOf(i),
    detail:
      i === out
        ? t('seat.out')
        : bidding
          ? i === s.dealer
            ? t('upcard')
            : ''
          : t('seat.tricks', { n: s.tricks[teamOf(i)] }),
    cards: i === 0 ? [] : mode === 'watch' ? sortHand(s.hands[i]!) : s.hands[i]!.map(() => 0),
    active: s.toAct === i && s.phase !== 'done',
    team: teamOf(i),
    badge:
      i === 2 && mode === 'play'
        ? t('partner')
        : s.dealer === i
          ? 'D'
          : i === s.maker
            ? '★'
            : undefined,
  }));
  const trick = s.trick.length ? s.trick : showLast && s.lastTrick ? s.lastTrick : [];
  const winnerSeat =
    !s.trick.length && showLast && s.lastTrick
      ? s.lastTrick.reduce((best, x) => {
          const led = effectiveSuit(s.lastTrick![0]!.card, s.trump);
          return cardPower(x.card, s.trump, led) > cardPower(best.card, s.trump, led) ? x : best;
        }).seat
      : null;
  const status =
    s.winner !== null
      ? mode === 'play'
        ? s.winner === 0
          ? t('game.won', { us: s.scores[0], them: s.scores[1] })
          : t('game.lost', { us: s.scores[0], them: s.scores[1] })
        : t('game.watch', {
            team: sideName(s.winner),
            a: Math.max(...s.scores),
            b: Math.min(...s.scores),
          })
      : s.phase === 'done'
        ? announcement
        : myTurn
          ? s.phase === 'round1'
            ? t('round1.prompt', {
                card: cardName(s.upcard, locale),
                suit: t(`suit.${suitOf(s.upcard)}`),
              })
            : s.phase === 'round2'
              ? t(s.dealer === 0 ? 'round2.stuck' : 'round2.prompt')
              : s.phase === 'throw'
                ? t('throw.prompt')
                : s.trick.length
                  ? t('your-turn.follow')
                  : t('your-turn')
          : t('thinking', { name: nameOf(s.toAct) });

  return (
    <div className={styles.play} data-testid="euchre">
      <div className={styles.scoreboard}>
        <span className={styles.team} data-team={0} data-testid="euchre-us">
          {t('score.line', { side: sideName(0), score: s.scores[0] })}
        </span>
        <span className={styles.team} data-team={1} data-testid="euchre-them">
          {t('score.line', { side: sideName(1), score: s.scores[1] })}
        </span>
        <span className="muted">
          {t('hand', { n: s.handNo })} · {t('target', { n: TARGET })}
        </span>
      </div>
      {s.trump !== null && (
        <p className={euchre.trump} data-testid="euchre-trump">
          {t('trump.by', {
            suit: t(`suit.${s.trump}`),
            name: nameOf(s.maker),
            alone: s.alone ? t('alone') : '',
          })}
        </p>
      )}
      <TrickTable
        seats={seats}
        hand={hand}
        playable={playable}
        onCard={(card) => act(`${s.phase === 'throw' ? 'throw' : 'play'}:${card}`)}
        trick={trick}
        winner={winnerSeat}
        reveal={mode === 'watch'}
        locale={locale}
        colorblind={services.colorblind}
        still={services.reducedMotion}
        labels={{ hidden: t('card.hidden'), hand: t('your-hand') }}
        center={
          <>
            {bidding && (
              <div className={euchre.upcard} data-testid="euchre-upcard">
                <div className={euchre.card} role="img" aria-label={cardName(s.upcard, locale)}>
                  <CardView card={s.upcard} faceUp fourColor={services.colorblind} />
                </div>
                <span>{t('upcard')}</span>
              </div>
            )}
            <p className={styles.status} data-testid="euchre-status">
              {status}
            </p>
          </>
        }
      />
      {myTurn && bidding && (
        <div className={euchre.bids} data-testid="euchre-bids">
          {s.phase === 'round1' ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => act(alone ? 'order-alone' : 'order')}
              data-testid="euchre-order"
            >
              {t(alone ? 'order.alone' : 'order')}
            </button>
          ) : (
            [0, 1, 2, 3]
              .filter((suit) => suit !== suitOf(s.upcard))
              .map((suit) => (
                <button
                  key={suit}
                  type="button"
                  className="btn"
                  data-suit={suit}
                  onClick={() => act(`${alone ? 'name-alone' : 'name'}:${suit}`)}
                  data-testid={`euchre-name-${suit}`}
                >
                  {t(alone ? 'name.alone' : 'name', { suit: t(`suit.${suit}`) })}
                </button>
              ))
          )}
          {!(s.phase === 'round2' && s.dealer === 0) && (
            <button
              type="button"
              className="btn"
              onClick={() => act('pass')}
              data-testid="euchre-pass"
            >
              {t('pass')}
            </button>
          )}
          <label className={euchre.alone}>
            <input type="checkbox" checked={alone} onChange={(e) => setAlone(e.target.checked)} />
            {t('alone.label')}
          </label>
        </div>
      )}
      <div className={styles.controls}>
        {myTurn && (s.phase === 'round1' || s.phase === 'round2' || s.phase === 'play') && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={showHint}
            data-testid="euchre-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && s.phase === 'done' && s.winner === null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="euchre-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && s.winner !== null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createEuchre(newSeed()), 'play', difficulty)}
            data-testid="euchre-again"
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
          data-testid="euchre-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="euchre-hint-text">
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
