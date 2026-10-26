/**
 * The poker table shared by the community-card games: a setup menu, a sit-and-go against 1–5 AI
 * opponents (or a table of AIs to watch), betting controls with a raise slider and presets, a coach
 * that estimates the player's chances, saves, statistics and achievements.
 */
import { Bot, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { cardName } from '../cards/cards';
import { CardView } from '../cards/CardView';
import { STYLES, estimateEquity, styleAction, type PokerStyle } from './ai';
import {
  BLIND_LEVELS,
  HANDS_PER_LEVEL,
  MAX_DRAW,
  fixedBet,
  isUpCard,
  studAnte,
  studBringIn,
  applyPokerAction,
  createPoker,
  isValidPokerState,
  potSize,
  raiseRange,
  toCall,
  type PokerState,
  type PokerVariant,
} from './engine';
import { START_STACK } from './environment';
import { categoryOf } from './hands';
import { POKER_STRINGS, SEAT_NAMES } from './i18n';
import { POKER_SOUNDS } from './sounds';
import styles from './PokerTable.module.css';

export type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH_STYLES: PokerStyle[] = [STYLES.hard, STYLES.medium, STYLES.easy];

interface Saved {
  state: PokerState;
  difficulty: Difficulty;
}

type Mode = 'menu' | 'play' | 'watch';

export function PokerTable({
  variant,
  services,
}: {
  variant: PokerVariant;
  services: GameServices;
}) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(POKER_STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          DIFFICULTIES.includes((d as Saved).difficulty) &&
          isValidPokerState(variant, (d as Saved).state, START_STACK),
      }),
    [services, variant],
  );
  // A deal number in the URL (?deal=123) fixes the shuffles; otherwise a random tournament.
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [opponents, setOpponents] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<PokerState | null>(() =>
    mode === 'watch' ? createPoker(variant, fixedDeal ?? randomSeed() >>> 0, 6, START_STACK) : null,
  );
  const [said, setSaid] = useState<string[]>([]);
  const [coach, setCoach] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [raisePick, setRaisePick] = useState<{ at: number; to: number } | null>(null);
  const [discardPick, setDiscardPick] = useState<{ at: number; picked: number[] } | null>(null);
  const stateRef = useLatest(state);
  const rng = useRef(new Rng(fixedDeal ?? randomSeed()));
  /** The player's last action in the current hand (for the "steal" achievement). */
  const lastMine = useRef('');

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.champion === null) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const nameOf = (i: number) => (i === 0 && mode === 'play' ? t('you') : SEAT_NAMES[i]!);
  const styleOf = (i: number) =>
    mode === 'watch' ? WATCH_STYLES[i % WATCH_STYLES.length]! : STYLES[difficulty];
  const cardsText = (cards: readonly number[]) => cards.map((c) => cardName(c, locale)).join(', ');

  /** Stud: three of a kind in the first three cards. */
  const checkRolledUp = (s: PokerState, m: Mode) => {
    const [a, b, c] = s.seats[0]!.hole;
    if (
      m === 'play' &&
      variant.id === 'stud' &&
      c !== undefined &&
      a! % 13 === b! % 13 &&
      b! % 13 === c % 13
    )
      servicesRef.current.unlockAchievement('rolled-up');
  };

  const start = (s: PokerState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setSaid([]);
    setCoach(null);
    setPaused(false);
    lastMine.current = '';
    if (m === 'play') setAnnouncement(t('announce.hole', { cards: cardsText(s.seats[0]!.hole) }));
    checkRolledUp(s, m);
  };

  const newTournament = () => {
    const s = createPoker(variant, fixedDeal ?? randomSeed() >>> 0, opponents + 1, START_STACK);
    start(s, 'play', difficulty);
    void slot.save({ state: s, difficulty });
  };

  /** Statistics and achievements when a hand (and maybe the tournament) ends. */
  const handOver = (s: PokerState) => {
    const svc = servicesRef.current;
    const r = s.result!;
    const winners = r.won.flatMap((w, i) => (w > 0 ? [i] : []));
    const best = Math.max(...winners.map((i) => r.scores[i]!));
    const hand = r.shown.length ? t(`cat.${categoryOf(best)}`) : '';
    const top = winners.find((i) => r.scores[i] === best)!;
    const you = (i: number) => (i === 0 && mode === 'play' ? '.you' : '');
    setAnnouncement(
      !r.shown.length
        ? t(`win.fold${you(top)}`, { name: nameOf(top), n: r.won[top]! })
        : winners.length > 1 && winners.every((i) => r.scores[i] === best)
          ? t('win.split', { names: winners.map(nameOf).join(', '), hand })
          : t(`win.show${you(top)}`, { name: nameOf(top), n: r.won[top]!, hand }),
    );
    if (mode !== 'play') {
      svc.playSound(POKER_SOUNDS.pot);
      return;
    }
    const mine = r.won[0]!;
    svc.playSound(mine > 0 ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
    if (mine > 0) {
      svc.unlockAchievement('first-pot');
      const cat = categoryOf(r.scores[0]!);
      if (
        r.shown.includes(0) &&
        (cat === 'full-house' || cat === 'four-of-a-kind' || cat === 'straight-flush')
      )
        svc.unlockAchievement('monster');
      if (!r.shown.length && lastMine.current.startsWith('raise:')) svc.unlockAchievement('steal');
      if (r.shown.includes(0) && s.seats[0]!.allIn) svc.unlockAchievement('double-up');
      if (r.shown.includes(0) && s.seats[0]!.drew === 0) svc.unlockAchievement('pat-hand');
    }
    if (s.champion !== null) {
      const won = s.champion === 0;
      const place = won ? 1 : s.seats.filter((x) => !x.out).length + 1;
      svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
      svc.recordResult({ outcome: won ? 'win' : 'loss', score: place, mode: difficulty });
      if (won) {
        svc.unlockAchievement('champion');
        if (difficulty === 'hard' && s.seats.length === 6) svc.unlockAchievement('shark');
      }
      void slot.clear();
      setSaved(null);
    } else void slot.save({ state: s, difficulty });
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    let next: PokerState;
    try {
      next = applyPokerAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const seat = before.toAct;
    setCoach(null);
    if (a === 'next') {
      setSaid([]);
      checkRolledUp(next, mode);
      lastMine.current = '';
      servicesRef.current.playSound(POKER_SOUNDS.deal);
      if (mode === 'play')
        setAnnouncement(t('announce.hole', { cards: cardsText(next.seats[0]!.hole) }));
    } else {
      const allIn = next.seats[seat]!.allIn && !before.seats[seat]!.allIn;
      // A draw shows on the seat's plate instead of as an action label.
      const word = a.startsWith('draw:')
        ? ''
        : allIn
          ? 'all-in'
          : !a.startsWith('raise:')
            ? a
            : before.currentBet === 0
              ? 'bet'
              : variant.limit === 'fixed-limit' && before.currentBet < fixedBet(before)
                ? 'complete'
                : 'raise';
      if (seat === 0) lastMine.current = a;
      servicesRef.current.playSound(
        a === 'fold'
          ? POKER_SOUNDS.fold
          : a === 'check'
            ? POKER_SOUNDS.check
            : a.startsWith('draw:')
              ? POKER_SOUNDS.deal
              : POKER_SOUNDS.chips,
      );
      // Labels stay for the street; a new street clears all but folds and all-ins.
      const newStreet = next.street !== before.street;
      setSaid((prev) => {
        const out = before.seats.map((_, i) => prev[i] ?? '');
        out[seat] = word;
        return newStreet ? out.map((w) => (w === 'fold' || w === 'all-in' ? w : '')) : out;
      });
      const action = a.startsWith('draw:')
        ? a.length === 5
          ? t('said.pat')
          : t('said.draw', { n: a.length - 5 })
        : t(`said.${word}`) + (a.startsWith('raise:') ? ` ${a.slice(6)}` : '');
      if (next.street === 'done') handOver(next);
      else if (next.board.length > before.board.length)
        setAnnouncement(t('announce.board', { cards: cardsText(next.board) }));
      else if (seat === 0 && mode === 'play' && a.startsWith('draw:'))
        setAnnouncement(t('announce.hole', { cards: cardsText(next.seats[0]!.hole) }));
      else setAnnouncement(t('announce.act', { name: nameOf(seat), action }));
    }
    setState(next);
    if (mode === 'play' && next.street !== 'done') void slot.save({ state: next, difficulty });
  };

  // The AI seats act after a short pause; in watch mode the next hand deals itself.
  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.champion !== null) return;
    if (state.street === 'done') {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 2600);
      return () => window.clearTimeout(id);
    }
    if (mode === 'play' && state.toAct === 0) return;
    const id = window.setTimeout(
      () => act(styleAction(state, styleOf(state.toAct), rng.current)),
      services.reducedMotion ? 350 : 750,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = mode === 'play' && !!state && state.street !== 'done' && state.toAct === 0;
  const myDraw = myTurn && state.street === 'draw';
  const picked =
    myDraw && discardPick && discardPick.at === state.history.length ? discardPick.picked : [];
  const toggleDiscard = (k: number) => {
    if (!myDraw) return;
    const next = picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k];
    if (next.length > MAX_DRAW) {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    servicesRef.current.playSound(POKER_SOUNDS.check);
    setDiscardPick({ at: state.history.length, picked: next });
  };
  const drawPicked = () => act(`draw:${[...picked].sort((a, b) => a - b).join('')}`);
  const range = myTurn ? raiseRange(state) : null;
  const owe = myTurn ? toCall(state) : 0;
  const pot = state ? potSize(state) : 0;
  const preset = (share: number) =>
    range && state
      ? Math.min(range[1], Math.max(range[0], state.currentBet + Math.round((pot + owe) * share)))
      : 0;
  const raiseTo =
    range && state
      ? raisePick && raisePick.at === state.history.length
        ? raisePick.to
        : range[0]
      : 0;
  const pickRaise = (to: number) => {
    if (!range || !state) return;
    const bb = state.blinds[1];
    let v = Math.min(range[1], Math.max(range[0], to));
    // Snap to whole big blinds, except the all-in.
    if (v < range[1]) v = Math.max(range[0], Math.round(v / bb) * bb);
    setRaisePick({ at: state.history.length, to: v });
  };

  const showCoach = () => {
    if (!myTurn || !state) return;
    const players = state.seats.filter((x) => !x.out && !x.folded).length - 1;
    const move = styleAction(state, STYLES.medium, rng.current);
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    if (move.startsWith('draw:')) {
      const thrown = move
        .slice(5)
        .split('')
        .map((k) => state.seats[0]!.hole[Number(k)]!);
      setCoach(thrown.length ? t('coach.draw', { cards: cardsText(thrown) }) : t('coach.pat'));
      return;
    }
    const equity = estimateEquity(state, 0, 800, rng.current, true);
    const odds = owe > 0 ? owe / (pot + owe) : 0;
    setCoach(
      t('coach', {
        equity: Math.round(equity * 100),
        n: players,
        odds: Math.round(odds * 100),
        move: move.startsWith('raise:') ? t('move.raise', { n: move.slice(6) }) : t(`move.${move}`),
      }),
    );
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.street === 'done') {
      if ((k === 'n' || k === 'enter') && state.champion === null) {
        act('next');
        return true;
      }
      return false;
    }
    if (!myTurn) return false;
    if (myDraw) {
      if (/^[1-5]$/.test(k)) toggleDiscard(Number(k) - 1);
      else if (k === 'd' || k === 'enter') drawPicked();
      else if (k === 'h') showCoach();
      else return false;
      return true;
    }
    if (k === 'f' && owe > 0) act('fold');
    else if (k === 'c') act(owe > 0 ? 'call' : 'check');
    else if (k === 'r' && range) act(`raise:${raiseTo}`);
    else if (k === 'a' && range) act(`raise:${range[1]}`);
    else if ((k === 'arrowright' || k === 'arrowup') && range) pickRaise(raiseTo + state.blinds[1]);
    else if ((k === 'arrowleft' || k === 'arrowdown') && range)
      pickRaise(raiseTo - state.blinds[1]);
    else if (k === 'h') showCoach();
    else return false;
    return true;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="poker-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t(`title.${variant.id}`)}</h2>
          <p className="muted">
            {t(variant.id === 'stud' ? 'menu.subtitle.stud' : 'menu.subtitle', {
              stack: START_STACK,
              hands: HANDS_PER_LEVEL,
            })}
          </p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="poker-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    hand: saved.state.handNo,
                    players: saved.state.seats.filter((x) => !x.out).length,
                    stack: saved.state.seats[0]!.stack,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={styles.group}>
            <legend>{t('menu.opponents')}</legend>
            <div className={styles.segmented}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={opponents === n}
                  onClick={() => setOpponents(n)}
                  data-testid={`poker-opponents-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.group}>
            <legend>{t('menu.difficulty')}</legend>
            <div className={styles.segmented}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  data-testid={`poker-difficulty-${d}`}
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
              onClick={newTournament}
              data-testid="poker-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                start(
                  createPoker(variant, fixedDeal ?? randomSeed() >>> 0, 6, START_STACK),
                  'watch',
                  difficulty,
                )
              }
              data-testid="poker-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const n = s.seats.length;
  const r = s.result;
  const live = s.seats.filter((x) => !x.out).length;
  const level = Math.floor((s.handNo - 1) / HANDS_PER_LEVEL);
  const untilUp =
    level < BLIND_LEVELS.length - 1 ? HANDS_PER_LEVEL - ((s.handNo - 1) % HANDS_PER_LEVEL) : 0;
  const omaha = variant.hole === 4;
  const draw = variant.id === 'draw';
  const stud = variant.id === 'stud';
  const faceUp = (i: number, k: number) =>
    mode === 'watch' || i === 0 || !!r?.shown.includes(i) || (stud && isUpCard(k));
  /** The player's own stud cards that the others cannot see. */
  const hiddenMine = (i: number, k: number) =>
    stud && i === 0 && mode === 'play' && !isUpCard(k) && !r?.shown.includes(0);
  const over = s.champion !== null;
  const status = over
    ? mode === 'watch'
      ? t('over.watch', { name: nameOf(s.champion!) })
      : s.champion === 0
        ? t('over.won')
        : t('over.lost', { place: live + 1, players: n })
    : s.street === 'done'
      ? announcement
      : myDraw
        ? t('your-draw', { max: MAX_DRAW })
        : myTurn
          ? t('your-turn', { owe: owe > 0 ? t('to-call', { n: owe }) : t('to-check') })
          : t('thinking', { name: nameOf(s.toAct) });
  const verb =
    s.currentBet === 0
      ? 'bet.to'
      : variant.limit === 'fixed-limit' && s.currentBet < fixedBet(s)
        ? 'complete.to'
        : 'raise.to';

  return (
    <div className={styles.play} data-testid="poker">
      <div className={styles.stats}>
        <span>
          {t('hand')} <strong data-testid="poker-hand">{s.handNo}</strong>
        </span>
        {stud ? (
          <span>
            {t('stud.limits', {
              ante: studAnte(s),
              bringIn: studBringIn(s),
              small: s.blinds[1],
              big: 2 * s.blinds[1],
            })}
          </span>
        ) : (
          <span>
            {t('blinds')}{' '}
            <strong>
              {s.blinds[0]}/{s.blinds[1]}
            </strong>
          </span>
        )}
        <span>
          {t('players')} <strong>{live}</strong>
        </span>
        {untilUp > 0 && <span>{t(stud ? 'level.up.stud' : 'level.up', { n: untilUp })}</span>}
      </div>
      <div
        className={`${styles.table} ${services.reducedMotion ? styles.still : ''}`}
        style={{ '--seats': n } as CSSProperties}
      >
        <div className={styles.felt} />
        <div className={styles.center}>
          {(draw || stud) && s.street !== 'done' && (
            <span className={styles.phase} data-testid="poker-phase">
              {t(`street.${s.street}`)}
            </span>
          )}
          {!draw && !stud && (
            <div className={styles.board} data-testid="poker-board">
              {Array.from({ length: 5 }, (_, k) => {
                const c = s.board[k];
                return (
                  <div
                    key={k}
                    className={`${styles.boardCard} ${c === undefined ? styles.slot : ''}`}
                    role={c === undefined ? undefined : 'img'}
                    aria-label={c === undefined ? undefined : cardName(c, locale)}
                  >
                    {c !== undefined && (
                      <CardView
                        key={`${s.handNo}-${k}`}
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
          <span className={styles.pot} data-testid="poker-pot">
            {t('pot', { n: pot })}
          </span>
        </div>
        {s.seats.map((x, i) => {
          const angle = Math.PI / 2 + (i * 2 * Math.PI) / n;
          const pos = {
            left: `${50 + 41 * Math.cos(angle)}%`,
            top: `${50 + 39 * Math.sin(angle)}%`,
          } as CSSProperties;
          const won = r ? r.won[i]! > 0 : false;
          const shownCat = r && r.shown.includes(i) ? t(`cat.${categoryOf(r.scores[i]!)}`) : '';
          const word = said[i];
          return (
            <div
              key={i}
              className={[
                styles.seat,
                i === 0 && mode === 'play' ? styles.mine : '',
                omaha ? styles.omaha : '',
                draw ? styles.five : '',
                stud ? styles.seven : '',
                x.folded ? styles.folded : '',
                x.out ? styles.out : '',
                s.toAct === i && s.street !== 'done' ? styles.acting : '',
                won ? styles.winner : '',
              ].join(' ')}
              style={pos}
              data-testid={`poker-seat-${i}`}
            >
              <div className={styles.hole}>
                {(!x.out || r?.shown.includes(i)) &&
                  x.hole.map((c, k) =>
                    i === 0 && myDraw ? (
                      <button
                        key={`${s.handNo}-${k}-${c}`}
                        type="button"
                        className={`${styles.holeCard} ${styles.pick} ${picked.includes(k) ? styles.picked : ''}`}
                        aria-pressed={picked.includes(k)}
                        aria-label={cardName(c, locale)}
                        onClick={() => toggleDiscard(k)}
                        data-testid={`poker-card-${k}`}
                      >
                        <CardView card={c} faceUp fourColor={services.colorblind} />
                      </button>
                    ) : (
                      <div
                        key={`${s.handNo}-${k}-${c}`}
                        className={`${styles.holeCard} ${hiddenMine(i, k) ? styles.down : ''}`}
                        role="img"
                        aria-label={
                          faceUp(i, k)
                            ? cardName(c, locale) +
                              (hiddenMine(i, k) ? ` (${t('card.yours')})` : '')
                            : t('card.hidden')
                        }
                      >
                        <CardView card={c} faceUp={faceUp(i, k)} fourColor={services.colorblind} />
                      </div>
                    ),
                  )}
              </div>
              <div className={styles.plate}>
                <span className={styles.name}>
                  {nameOf(i)}
                  {s.button === i && !x.out && (
                    <span className={styles.dealer} aria-label="dealer">
                      D
                    </span>
                  )}
                </span>
                <span className={styles.stack} data-testid={`poker-stack-${i}`}>
                  {x.out ? t('out') : x.stack}
                </span>
                {draw && x.drew >= 0 && !x.out && !x.folded && (
                  <span className={styles.drew} data-testid={`poker-drew-${i}`}>
                    {x.drew === 0 ? t('pat') : t('drew', { n: x.drew })}
                  </span>
                )}
              </div>
              {(x.bet > 0 || word || shownCat) && (
                <div className={styles.tags}>
                  {x.bet > 0 && <span className={styles.bet}>{x.bet}</span>}
                  {shownCat ? (
                    <span className={styles.said}>{shownCat}</span>
                  ) : (
                    word && (
                      <span className={styles.said} data-w={word}>
                        {t(`said.${word}`)}
                      </span>
                    )
                  )}
                </div>
              )}
              {won && r && <span className={styles.won}>+{r.won[i]}</span>}
            </div>
          );
        })}
      </div>
      <div className={styles.status} data-testid="poker-status">
        {status}
      </div>
      {mode === 'watch' && !over && <p className={styles.keys}>{t('watching')}</p>}
      <div className={styles.controls}>
        {myDraw && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={drawPicked}
              data-testid="poker-draw"
            >
              {picked.length ? t('draw.n', { n: picked.length }) : t('stand-pat')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={showCoach}
              data-testid="poker-hint"
            >
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {myTurn && !myDraw && (
          <>
            {owe > 0 && (
              <button
                type="button"
                className="btn"
                onClick={() => act('fold')}
                data-testid="poker-fold"
              >
                {t('fold')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => act(owe > 0 ? 'call' : 'check')}
              data-testid="poker-call"
            >
              {owe > 0 ? t('call', { n: Math.min(owe, s.seats[0]!.stack) }) : t('check')}
            </button>
            {range && (
              <button
                type="button"
                className="btn"
                onClick={() => act(`raise:${raiseTo}`)}
                data-testid="poker-raise"
              >
                {raiseTo === s.seats[0]!.bet + s.seats[0]!.stack
                  ? t('all-in')
                  : t(verb, { n: raiseTo })}
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={showCoach}
              data-testid="poker-hint"
            >
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {mode === 'play' && s.street === 'done' && !over && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="poker-next"
          >
            {t('next')}
          </button>
        )}
        {over && mode === 'play' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={newTournament}
            data-testid="poker-again"
          >
            {t('new.tournament')}
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
            if (mode === 'play' && s.champion === null) setSaved({ state: s, difficulty });
            setMode('menu');
            setState(null);
          }}
          data-testid="poker-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {range && range[0] < range[1] && (
        <div className={styles.raise}>
          <div className={styles.presets}>
            {(
              [
                ['min', range[0]],
                ['half', preset(0.5)],
                ['full-pot', preset(1)],
                // Pot-limit caps the raise at the pot: all-in only when that is the whole stack.
                ...(range[1] === s.seats[0]!.bet + s.seats[0]!.stack
                  ? ([['all-in', range[1]]] as const)
                  : []),
              ] as const
            ).map(([label, to]) => (
              <button
                key={label}
                type="button"
                className={styles.presetButton}
                aria-pressed={raiseTo === to}
                onClick={() => pickRaise(to)}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <input
            type="range"
            className={styles.slider}
            min={range[0]}
            max={range[1]}
            step={1}
            value={raiseTo}
            onChange={(e) => pickRaise(Number(e.target.value))}
            aria-label={t('raise.amount')}
            data-testid="poker-slider"
          />
        </div>
      )}
      {coach && (
        <p className={styles.coach} data-testid="poker-coach">
          <Lightbulb size={14} /> {coach}
        </p>
      )}
      {mode === 'play' && (
        <p className={styles.keys}>
          {t(draw ? 'keys.draw' : omaha ? 'keys.omaha' : stud ? 'keys.stud' : 'keys')}
        </p>
      )}
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
