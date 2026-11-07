/**
 * The bridge table: a Chicago of four deals with an AI partner. When north–south win the auction
 * the player declares and plays both their hands (north is dummy, face up and tappable); when
 * east–west do, the player defends from south and the declarer's dummy is shown once the opening
 * lead is made.
 */
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
import styles from '../shared/tricks/TrickGame.module.css';
import { levelAction, searchPlay } from './ai';
import { chooseCall, trumpSuit } from './bidding';
import {
  STRAIN_LETTERS,
  applyBridgeAction,
  bidCall,
  createBridge,
  isValidBridgeState,
  legalCalls,
  parseBid,
  partnerOf,
  playableCards,
  sideOf,
  type BridgeState,
  type Contract,
} from './engine';
import { STRINGS } from './i18n';
import bridge from './BridgeGame.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium', 'hard', 'medium'];
const SYMBOLS = ['♣', '♦', '♥', '♠'];

interface Saved {
  state: BridgeState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

export function BridgeGame({ services }: GameProps) {
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
          isValidBridgeState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<BridgeState | null>(() =>
    mode === 'watch' ? createBridge(newSeed()) : null,
  );
  const [cursor, setCursor] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [advised, setAdvised] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showLast, setShowLast] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const stateRef = useLatest(state);
  const rng = useRef(new Rng(fixedDeal ?? randomSeed()));

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && !d.state.over) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const seatName = (seat: number) =>
    mode === 'play' && seat === 0
      ? t('you')
      : mode === 'watch'
        ? `${t(`seat.${seat}`)} (${t(`difficulty.${WATCH[seat]!}`)})`
        : t(`seat.${seat}`);
  const strainText = (strain: number) => (strain === 4 ? t('nt') : SYMBOLS[strain]!);
  const callText = (call: string) => {
    const bid = parseBid(call);
    if (bid) return `${bid.level}${strainText(bid.strain)}`;
    return t(`call.${call}`);
  };
  const contractText = (c: Contract) =>
    `${c.level}${strainText(c.strain)}${c.doubled === 1 ? ' X' : c.doubled === 2 ? ' XX' : ''}`;

  /** Seats the player chooses for: south, plus north while north–south are declaring. */
  const humanSeats = (s: BridgeState) =>
    mode !== 'play'
      ? []
      : s.phase === 'play' && s.contract && sideOf(s.contract.declarer) === 0
        ? [0, 2]
        : [0];

  const start = (s: BridgeState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setHint(null);
    setAdvised(null);
    setPaused(false);
    setShowLast(false);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const dealOver = (s: BridgeState) => {
    const svc = servicesRef.current;
    const r = s.result!;
    const c = s.contract;
    if (r.passedOut || !c) setAnnouncement(t('passed.out'));
    else {
      const side = sideOf(c.declarer);
      const winner = r.over >= 0 ? side : ((1 - side) as 0 | 1);
      setAnnouncement(
        r.over >= 0
          ? t('result.made', {
              contract: contractText(c),
              over: r.over > 0 ? ` +${r.over}` : '',
              side: t(winner === 0 ? 'ns' : 'ew'),
              points: r.points[winner],
            })
          : t('result.down', {
              contract: contractText(c),
              n: -r.over,
              side: t(winner === 0 ? 'ns' : 'ew'),
              points: r.points[winner],
            }),
      );
      if (mode === 'play') {
        svc.playSound(r.points[0] > 0 ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
        if (side === 0 && r.over >= 0) {
          const game =
            c.level >= 5 || (c.level === 4 && c.strain >= 2) || (c.level === 3 && c.strain === 4);
          if (game) svc.unlockAchievement('game');
          if (c.level >= 6) svc.unlockAchievement('slam');
          if (c.doubled > 0) svc.unlockAchievement('doubled');
        }
        if (side === 1 && r.over < 0) svc.unlockAchievement('defeat');
      }
    }
    if (s.over && mode === 'play') {
      const won = s.winner === 0;
      svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
      svc.recordResult({
        outcome: won ? 'win' : s.winner === null ? 'draw' : 'loss',
        score: s.scores[0] - s.scores[1],
        mode: difficulty,
      });
      if (won) {
        svc.unlockAchievement('chicago');
        if (difficulty === 'hard') svc.unlockAchievement('win-hard');
      }
      void slot.clear();
      setSaved(null);
    }
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    let next: BridgeState;
    try {
      next = applyBridgeAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    setHint(null);
    setAdvised(null);
    if (a === 'next') {
      svc.playSound(POKER_SOUNDS.deal);
      setShowLast(false);
    } else if (before.phase === 'auction') {
      svc.playSound(POKER_SOUNDS.check);
      setAnnouncement(`${seatName(before.toAct)}: ${callText(a)}`);
      if (next.phase === 'done') dealOver(next);
    } else {
      const card = Number(a.slice(5));
      svc.playSound(POKER_SOUNDS.check);
      setAnnouncement(`${seatName(before.toAct)}: ${cardName(card, locale)}`);
      if (next.played > before.played) setShowLast(true);
      if (next.phase === 'done') dealOver(next);
    }
    setState(next);
    if (mode === 'play' && !next.over) void slot.save({ state: next, difficulty });
  };

  useEffect(() => {
    if (!showLast) return;
    const id = window.setTimeout(() => setShowLast(false), services.reducedMotion ? 500 : 1100);
    return () => window.clearTimeout(id);
  }, [showLast, services.reducedMotion]);

  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.over) return;
    if (state.phase === 'done') {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 3200);
      return () => window.clearTimeout(id);
    }
    if (humanSeats(state).includes(state.toAct)) return;
    // On dummy's turn the declarer decides (and plays at the declarer's level when watching).
    const chooser =
      state.phase === 'play' && state.contract && state.toAct === partnerOf(state.contract.declarer)
        ? state.contract.declarer
        : state.toAct;
    const level = mode === 'watch' ? WATCH[chooser]! : difficulty;
    const delay = showLast ? (services.reducedMotion ? 600 : 1200) : 650;
    const id = window.setTimeout(() => act(levelAction(state, level, rng.current)), delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = !!state && !state.over && humanSeats(state).includes(state.toAct);
  const calling = myTurn && state.phase === 'auction';
  const hand = state ? sortHand(state.hands[0]!) : [];
  const legal = state && myTurn && state.phase === 'play' ? playableCards(state) : [];
  const southPlayable = new Set<number>(myTurn && state.toAct === 0 ? legal : []);
  const northPlayable = new Set<number>(myTurn && state.toAct === 2 ? legal : []);

  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    if (calling) {
      const call = chooseCall(state, 'medium');
      setAdvised(call);
      setHint(t('auction.advice', { level: t('difficulty.medium'), call: callText(call) }));
    } else
      setHint(t('hint.play', { card: cardName(searchPlay(state, 12, rng.current).card, locale) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.phase === 'done' && !state.over && (k === 'n' || k === 'enter')) {
      act('next');
      return true;
    }
    if (!myTurn) return false;
    if (k === 'h') {
      showHint();
      return true;
    }
    if (calling) {
      if (k === 'p') act('pass');
      else if (k === 'd' && legalCalls(state).includes('double')) act('double');
      else return false;
      return true;
    }
    if (state.toAct !== 0) return false;
    if (k === 'arrowleft' || k === 'arrowright') {
      setCursor((c) => (c + (k === 'arrowleft' ? -1 : 1) + hand.length) % hand.length);
      return true;
    }
    if (k === 'enter' || k === ' ') {
      const card = hand[cursor % Math.max(1, hand.length)];
      if (card !== undefined && southPlayable.has(card)) act(`play:${card}`);
      return true;
    }
    return false;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="bridge-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="bridge-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    deal: saved.state.dealNo,
                    ns: saved.state.scores[0],
                    ew: saved.state.scores[1],
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
                  data-testid={`bridge-difficulty-${d}`}
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
              onClick={() => start(createBridge(newSeed()), 'play', difficulty)}
              data-testid="bridge-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createBridge(newSeed()), 'watch', difficulty)}
              data-testid="bridge-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const c = s.contract;
  const dummy = c ? partnerOf(c.declarer) : -1;
  const dummyOpen = s.phase !== 'auction' && !!c && (s.dummyShown || sideOf(c.declarer) === 0);
  const seats: TrickSeat[] = [0, 1, 2, 3].map((i) => {
    // North is open to the player whenever north–south declare (the player plays both hands).
    const open =
      mode === 'watch' ||
      (i === dummy && dummyOpen) ||
      (i === 2 && mode === 'play' && s.phase === 'play' && !!c && sideOf(c.declarer) === 0);
    return {
      name: seatName(i),
      // During the auction the seat's last call; then ★ marks the declarer and ⌂ the dummy.
      detail: !c
        ? lastCallOf(s, i, callText)
        : i === c.declarer
          ? `★ ${contractText(c)}`
          : i === dummy
            ? '⌂'
            : t(sideOf(i) === 0 ? 'ns' : 'ew'),
      cards: i === 0 ? [] : open ? sortHand(s.hands[i]!) : s.hands[i]!.map(() => 0),
      active: s.toAct === i && s.phase !== 'done',
      team: sideOf(i),
      badge: i === 2 && mode === 'play' ? t('partner') : s.dealer === i ? 'D' : undefined,
      open,
      playable: i === 2 && open && mode === 'play' ? northPlayable : undefined,
    };
  });
  const trick = s.trick.length ? s.trick : showLast && s.lastTrick ? s.lastTrick : [];
  const winnerSeat =
    !s.trick.length && showLast && s.lastTrick && c
      ? trickWinner(s.lastTrick, trumpSuit(c.strain)).seat
      : null;
  const vulnerable =
    s.vulnerable[0] && s.vulnerable[1]
      ? t('vul.both')
      : s.vulnerable[0]
        ? t('ns')
        : s.vulnerable[1]
          ? t('ew')
          : t('vul.none');
  const status = s.over
    ? s.winner === 0
      ? t('over.won', { ns: s.scores[0], ew: s.scores[1] })
      : s.winner === 1
        ? t('over.lost', { ns: s.scores[0], ew: s.scores[1] })
        : t('over.tie', { ns: s.scores[0] })
    : s.phase === 'done'
      ? announcement
      : calling
        ? t('auction.prompt')
        : myTurn
          ? s.toAct === dummy
            ? t(s.toAct === 2 ? 'your-turn.dummy' : 'your-turn.dummy-south')
            : s.toAct === 2
              ? t('your-turn.north')
              : s.trick.length
                ? t('your-turn')
                : t('your-lead')
          : t('thinking', {
              name: seatName(s.phase === 'play' && c && s.toAct === dummy ? c.declarer : s.toAct),
            });
  const legalNow = calling ? new Set(legalCalls(s)) : new Set<string>();

  return (
    <div className={styles.play} data-testid="bridge">
      <div className={styles.scoreboard}>
        <span className={styles.team} data-team={0} data-testid="bridge-ns">
          {t('score.line', { side: t('ns'), score: s.scores[0] })}
        </span>
        <span className={styles.team} data-team={1} data-testid="bridge-ew">
          {t('score.line', { side: t('ew'), score: s.scores[1] })}
        </span>
        <span className="muted">
          {t('deal', { n: s.dealNo })} · {t('vul', { who: vulnerable })}
        </span>
      </div>
      {c && (
        <p className={bridge.contract} data-testid="bridge-contract">
          {t('contract', { contract: contractText(c), declarer: seatName(c.declarer) })} ·{' '}
          {t('tricks.line', { ns: s.tricks[0], ew: s.tricks[1], need: 6 + c.level })}
        </p>
      )}
      <TrickTable
        seats={seats}
        hand={hand}
        playable={southPlayable}
        onCard={(card) => act(`play:${card}`)}
        onSeatCard={(seat, card) => seat === 2 && act(`play:${card}`)}
        trick={trick}
        winner={winnerSeat}
        reveal={mode === 'watch'}
        locale={locale}
        colorblind={services.colorblind}
        still={services.reducedMotion}
        labels={{ hidden: t('card.hidden'), hand: t('your-hand') }}
        center={
          s.phase === 'auction' || (s.phase === 'done' && !c) ? (
            <div className={bridge.auction} data-testid="bridge-auction">
              <div className={bridge.auctionGrid}>
                {[1, 2, 3, 0].map((seat) => (
                  <span key={`h${seat}`} className={bridge.auctionHead}>
                    {t(`seat.${seat}`).slice(0, 1)}
                  </span>
                ))}
                {Array.from({ length: (s.dealer + 3) % 4 }, (_, k) => (
                  <span key={`pad${k}`} />
                ))}
                {s.auction.map((call, k) => (
                  <span key={k} className={bridge.auctionCall} data-call={call}>
                    {callText(call)}
                  </span>
                ))}
              </div>
              <p className={styles.status} data-testid="bridge-status">
                {status}
              </p>
            </div>
          ) : (
            <p className={styles.status} data-testid="bridge-status">
              {status}
            </p>
          )
        }
      />
      {calling && (
        <div className={bridge.box} data-testid="bridge-box">
          <div className={bridge.bids}>
            {Array.from({ length: 35 }, (_, r) => {
              const call = bidCall(Math.floor(r / 5) + 1, r % 5);
              return (
                <button
                  key={call}
                  type="button"
                  disabled={!legalNow.has(call)}
                  data-advised={advised === call}
                  data-strain={STRAIN_LETTERS[r % 5]}
                  onClick={() => act(call)}
                  data-testid={`bridge-${call}`}
                >
                  {callText(call)}
                </button>
              );
            })}
          </div>
          <div className={bridge.special}>
            {(['pass', 'double', 'redouble'] as const).map((call) => (
              <button
                key={call}
                type="button"
                className={`btn ${call === 'pass' ? 'btn-primary' : ''}`}
                disabled={!legalNow.has(call)}
                data-advised={advised === call}
                onClick={() => act(call)}
                data-testid={`bridge-${call}`}
              >
                {t(call)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={styles.controls}>
        {myTurn && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={showHint}
            data-testid="bridge-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && s.phase === 'done' && !s.over && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="bridge-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && s.over && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createBridge(newSeed()), 'play', difficulty)}
            data-testid="bridge-again"
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
            if (mode === 'play' && !s.over) setSaved({ state: s, difficulty });
            setMode('menu');
            setState(null);
          }}
          data-testid="bridge-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="bridge-hint-text">
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

/** A seat's latest call in the auction ("—" before it has spoken). */
function lastCallOf(s: BridgeState, seat: number, text: (call: string) => string): string {
  for (let k = s.auction.length - 1; k >= 0; k--)
    if ((s.dealer + k) % 4 === seat) return text(s.auction[k]!);
  return '—';
}
