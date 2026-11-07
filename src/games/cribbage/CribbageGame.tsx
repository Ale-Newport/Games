/** The cribbage table: a game to 121 against one AI (or two AIs to watch), with a peg board. */
import { Bot, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { cardName, cardShort, rankOf } from '../shared/cards/cards';
import { CardView } from '../shared/cards/CardView';
import { POKER_SOUNDS } from '../shared/poker/sounds';
import styles from '../shared/tricks/TrickGame.module.css';
import { chooseCrib, choosePlay, levelAction } from './ai';
import {
  TARGET,
  applyCribbageAction,
  countOf,
  createCribbage,
  isValidCribbageState,
  playable,
  pone,
  type CribbageState,
} from './engine';
import { STRINGS } from './i18n';
import type { ShowBreakdown } from './scoring';
import crib from './CribbageGame.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium'];
/** Below this the loser is "skunked". */
const SKUNK = 91;

interface Saved {
  state: CribbageState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

const byRank = (cards: readonly number[]) =>
  [...cards].sort((a, b) => rankOf(a) - rankOf(b) || a - b);

export function CribbageGame({ services }: GameProps) {
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
          isValidCribbageState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<CribbageState | null>(() =>
    mode === 'watch' ? createCribbage(newSeed()) : null,
  );
  const [picked, setPicked] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  /** The plays since the player's last move: "Rival: 5♣ → 31 (+2)". */
  const [log, setLog] = useState<string[]>([]);
  const stateRef = useLatest(state);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.winner === null) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const nameOf = (p: number) =>
    mode === 'watch' ? t(`difficulty.${WATCH[p]!}`) : p === 0 ? t('you') : t('ai');

  const start = (s: CribbageState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setPicked([]);
    setHint(null);
    setPaused(false);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const describe = (s: CribbageState) =>
    s.events
      .map((e) =>
        e.reason === 'peg'
          ? t('event.peg', { name: nameOf(e.seat), n: e.points })
          : t(`event.${e.reason}`, { name: nameOf(e.seat), n: e.points }),
      )
      .join(' · ');

  const finishGame = (s: CribbageState) => {
    const svc = servicesRef.current;
    if (mode !== 'play' || s.winner === null) return;
    const won = s.winner === 0;
    svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
    svc.recordResult({
      outcome: won ? 'win' : 'loss',
      score: s.scores[0] - s.scores[1],
      mode: difficulty,
    });
    if (won) {
      svc.unlockAchievement('match');
      if (s.scores[1] < SKUNK) svc.unlockAchievement('skunk');
      if (difficulty === 'hard') svc.unlockAchievement('match-hard');
    }
    void slot.clear();
    setSaved(null);
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    let next: CribbageState;
    try {
      next = applyCribbageAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    setHint(null);
    if (a.startsWith('crib:')) setPicked([]);
    if (a === 'next' || a.startsWith('crib:')) setLog([]);
    if (a.startsWith('play:')) {
      const points = next.events.reduce((x, e) => x + (e.seat === before.toAct ? e.points : 0), 0);
      const entry = `${nameOf(before.toAct)}: ${cardShort(Number(a.slice(5)))} → ${countOf(before.pile) + Math.min(10, rankOf(Number(a.slice(5))))}${points ? ` (+${points})` : ''}`;
      setLog((l) => (before.toAct === 0 && mode === 'play' ? [entry] : [...l, entry].slice(-5)));
    }
    svc.playSound(
      next.events.length
        ? POKER_SOUNDS.chips
        : a.startsWith('play:')
          ? POKER_SOUNDS.check
          : POKER_SOUNDS.deal,
    );
    const text = describe(next);
    if (text) setAnnouncement(text);
    if (mode === 'play' && a.startsWith('play:')) {
      const p = next.events.find((e) => e.seat === 0 && e.reason === 'peg');
      if (p && countOf(before.pile) + Math.min(10, rankOf(Number(a.slice(5)))) === 31)
        svc.unlockAchievement('thirty-one');
      if (p && p.points >= 6) svc.unlockAchievement('pair-royal');
    }
    if (mode === 'play' && next.show && !before.show) {
      const mine = next.dealer === 0 ? next.show.dealer.total : next.show.pone.total;
      if (mine >= 16) svc.unlockAchievement('big-hand');
    }
    setState(next);
    if (next.winner !== null && before.winner === null) finishGame(next);
    else if (mode === 'play') void slot.save({ state: next, difficulty });
  };

  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.winner !== null) return;
    if (state.phase === 'show') {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 3600);
      return () => window.clearTimeout(id);
    }
    if (mode === 'play' && state.toAct === 0) return;
    const level = mode === 'watch' ? WATCH[state.toAct]! : difficulty;
    const id = window.setTimeout(
      () => act(levelAction(state, level)),
      state.phase === 'crib' ? 300 : 800,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = mode === 'play' && !!state && state.toAct === 0 && state.winner === null;
  const throwing = myTurn && state.phase === 'crib';
  const pegging = myTurn && state.phase === 'peg';
  const hand = state ? byRank(state.hands[0]!) : [];
  const canPlay = new Set(pegging ? playable(state) : []);

  const tap = (card: number) => {
    if (throwing)
      setPicked((p) =>
        p.includes(card) ? p.filter((c) => c !== card) : p.length < 2 ? [...p, card] : p,
      );
    else if (pegging && canPlay.has(card)) act(`play:${card}`);
  };
  const throwPicked = () => {
    if (throwing && picked.length === 2) act(`crib:${[...picked].sort((a, b) => a - b).join('.')}`);
  };
  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    if (throwing) {
      const cards = chooseCrib(state, 'hard').slice(5).split('.').map(Number);
      setPicked(cards);
      setHint(t('hint.crib', { cards: cards.map((c) => cardName(c, locale)).join(', ') }));
    } else if (pegging)
      setHint(t('hint.play', { card: cardName(choosePlay(state, 'hard'), locale) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.phase === 'show' && state.winner === null && (k === 'n' || k === 'enter')) {
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
      if (card !== undefined) tap(card);
      return true;
    }
    if (k === 't') {
      throwPicked();
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
      <div className={styles.menu} data-testid="cribbage-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="cribbage-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    hand: saved.state.handNo,
                    you: saved.state.scores[0],
                    ai: saved.state.scores[1],
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
                  data-testid={`cribbage-difficulty-${d}`}
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
              onClick={() => start(createCribbage(newSeed()), 'play', difficulty)}
              data-testid="cribbage-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createCribbage(newSeed()), 'watch', difficulty)}
              data-testid="cribbage-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const showing = s.phase === 'show' || (s.phase === 'done' && !!s.show);
  const oppOpen = mode === 'watch' || showing;
  const count = countOf(s.pile);
  const status =
    s.winner !== null
      ? (mode === 'watch'
          ? t('over.watch', { name: nameOf(s.winner) })
          : s.winner === 0
            ? t('over.won', { you: s.scores[0], ai: s.scores[1] })
            : t('over.lost', { you: s.scores[0], ai: s.scores[1] })) +
        (Math.min(...s.scores) < SKUNK ? ` ${t('skunk')}` : '')
      : s.phase === 'crib'
        ? throwing
          ? t(s.dealer === 0 ? 'crib.yours' : 'crib.theirs')
          : t('crib.waiting')
        : s.phase === 'show'
          ? t('show.title')
          : pegging
            ? t('your-turn')
            : t('thinking', { name: nameOf(s.toAct) });
  const card = (c: number, faceUp = true, extra = '') => (
    <div
      key={c}
      className={`${crib.card} ${extra}`}
      role="img"
      aria-label={faceUp ? cardName(c, locale) : t('card.hidden')}
    >
      <CardView card={c} faceUp={faceUp} fourColor={services.colorblind} />
    </div>
  );
  const line = (b: ShowBreakdown) =>
    t('show.line', {
      f: b.fifteens,
      p: b.pairs,
      r: b.runs,
      fl: b.flush,
      n: b.nobs,
      total: b.total,
    });

  return (
    <div className={styles.play} data-testid="cribbage">
      <svg
        className={crib.board}
        viewBox="0 0 248 40"
        role="img"
        aria-label={`${t('board')}: ${nameOf(0)} ${s.scores[0]}, ${nameOf(1)} ${s.scores[1]}`}
      >
        {[0, 1].map((p) => (
          <g key={p} transform={`translate(4 ${8 + p * 20})`}>
            <rect x="0" y="-5" width="240" height="10" rx="5" className={crib.lane} data-p={p} />
            {/* A tick every five holes. */}
            {Array.from({ length: 25 }, (_, k) => (
              <line
                key={k}
                x1={k * 5 * (240 / TARGET)}
                y1="-5"
                x2={k * 5 * (240 / TARGET)}
                y2="5"
                className={crib.tick}
              />
            ))}
            <circle
              cx={Math.min(TARGET, s.scores[p as 0 | 1]) * (240 / TARGET)}
              cy="0"
              r="5"
              className={crib.peg}
              data-p={p}
            />
          </g>
        ))}
      </svg>
      <div className={styles.scoreboard}>
        <span className={styles.team} data-team={0} data-testid="cribbage-score-0">
          {nameOf(0)}: {s.scores[0]}
          {s.dealer === 0 ? ` (${t('dealer')})` : ''}
        </span>
        <span className={styles.team} data-team={1} data-testid="cribbage-score-1">
          {nameOf(1)}: {s.scores[1]}
          {s.dealer === 1 ? ` (${t('dealer')})` : ''}
        </span>
        <span className="muted">{t('hand', { n: s.handNo })}</span>
      </div>
      <div className={crib.table}>
        <div className={crib.row} data-testid="cribbage-opponent">
          {(showing ? byRank(s.kept[1]!) : s.hands[1]!).map((c) => card(c, oppOpen))}
        </div>
        <div className={crib.middle}>
          <div className={crib.starter}>
            {s.starter !== null ? card(s.starter) : card(0, false)}
            <span className={crib.label}>{t('starter')}</span>
          </div>
          <div className={crib.pile} data-testid="cribbage-pile">
            {(showing ? [] : s.pile).map((p) => card(p.card, true, p.seat === 0 ? crib.mine : ''))}
          </div>
          <span className={crib.count} data-testid="cribbage-count">
            {t('count', { n: count })}
          </span>
        </div>
        <p className={styles.status} data-testid="cribbage-status">
          {status}
        </p>
        {!showing && log.length > 0 && (
          <p className={crib.log} data-testid="cribbage-log">
            {log.join(' · ')}
          </p>
        )}
        {s.events.length > 0 && !showing && (
          <p className={crib.events} data-testid="cribbage-events">
            {describe(s)}
          </p>
        )}
        {showing && s.show && (
          <div className={crib.show} data-testid="cribbage-show">
            {(
              [
                ['pone', pone(s), s.kept[pone(s)]!, s.show.pone],
                ['dealer', s.dealer, s.kept[s.dealer]!, s.show.dealer],
                ['crib', s.dealer, s.crib, s.show.crib],
              ] as const
            ).map(([key, seat, cards, b]) => (
              <div key={key} className={crib.showRow}>
                <span className={crib.showTitle}>{t(`show.${key}`, { name: nameOf(seat) })}</span>
                <div className={crib.row}>{byRank(cards).map((c) => card(c))}</div>
                <span className={crib.showLine}>{line(b)}</span>
              </div>
            ))}
          </div>
        )}
        {!showing && (
          <div className={crib.hand} data-testid="cribbage-hand">
            {hand.map((c) => (
              <button
                key={c}
                type="button"
                className={`${crib.card} ${crib.handCard} ${picked.includes(c) ? crib.picked : ''} ${pegging && !canPlay.has(c) ? crib.dim : ''}`}
                disabled={!(throwing || (pegging && canPlay.has(c)))}
                onClick={() => tap(c)}
                aria-label={cardName(c, locale)}
                aria-pressed={throwing ? picked.includes(c) : undefined}
              >
                <CardView card={c} faceUp fourColor={services.colorblind} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.controls}>
        {throwing && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={picked.length !== 2}
            onClick={throwPicked}
            data-testid="cribbage-throw"
          >
            {t('crib.button')} ({picked.length}/2)
          </button>
        )}
        {myTurn && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={showHint}
            data-testid="cribbage-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && s.phase === 'show' && s.winner === null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="cribbage-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && s.winner !== null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createCribbage(newSeed()), 'play', difficulty)}
            data-testid="cribbage-again"
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
          data-testid="cribbage-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="cribbage-hint-text">
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
