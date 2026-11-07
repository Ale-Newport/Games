/** The Crazy Eights table: a game to 100 against one to three AI players (or AIs to watch). */
import { Bot, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { cardName } from '../shared/cards/cards';
import { CardView } from '../shared/cards/CardView';
import { POKER_SOUNDS } from '../shared/poker/sounds';
import { sortHand } from '../shared/tricks/cards';
import styles from '../shared/tricks/TrickGame.module.css';
import { levelAction } from './ai';
import {
  TARGET,
  applyEightsAction,
  createEights,
  isEight,
  isValidEightsState,
  legalEightsActions,
  playableCards,
  topCard,
  type EightsState,
} from './engine';
import { NAMES, STRINGS } from './i18n';
import eights from './EightsGame.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium', 'easy', 'hard'];

interface Saved {
  state: EightsState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

export function EightsGame({ services }: GameProps) {
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
          isValidEightsState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [opponents, setOpponents] = useState(1);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<EightsState | null>(() =>
    mode === 'watch' ? createEights(newSeed(), 4) : null,
  );
  /** An eight waiting for its suit. */
  const [eight, setEight] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
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
    mode === 'watch'
      ? `${p === 0 ? 'Elena' : NAMES[p - 1]!} (${t(`difficulty.${WATCH[p]!}`)})`
      : p === 0
        ? t('you')
        : NAMES[p - 1]!;
  const moveText = (a: string) => {
    const [, card, suit] = a.split(':');
    return suit !== undefined
      ? t('move.eight', { card: cardName(Number(card), locale), suit: t(`suit.${suit}`) })
      : cardName(Number(card), locale);
  };

  const start = (s: EightsState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setEight(null);
    setHint(null);
    setPaused(false);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const handOver = (s: EightsState) => {
    const svc = servicesRef.current;
    const r = s.result!;
    setAnnouncement(
      t(r.blocked ? 'result.blocked' : 'result.out', { name: nameOf(r.winner), n: r.points }),
    );
    if (mode !== 'play') return;
    svc.playSound(r.winner === 0 ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
    if (r.winner === 0) {
      svc.unlockAchievement('out');
      if (r.points >= 50) svc.unlockAchievement('big-hand');
      if (isEight(topCard(s))) svc.unlockAchievement('eight-finish');
    }
    if (s.winner !== null) {
      const won = s.winner === 0;
      svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
      svc.recordResult({ outcome: won ? 'win' : 'loss', score: s.scores[0], mode: difficulty });
      if (won) {
        svc.unlockAchievement('match');
        if (difficulty === 'hard' && s.players === 4) svc.unlockAchievement('full-table');
      }
      void slot.clear();
      setSaved(null);
    }
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    let next: EightsState;
    try {
      next = applyEightsAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    setHint(null);
    setEight(null);
    if (a === 'next' || a === 'draw') svc.playSound(POKER_SOUNDS.deal);
    else if (a === 'pass') svc.playSound(POKER_SOUNDS.check);
    else {
      svc.playSound(isEight(Number(a.split(':')[1])) ? POKER_SOUNDS.chips : POKER_SOUNDS.check);
      setAnnouncement(`${nameOf(before.toAct)}: ${moveText(a)}`);
    }
    if (next.result && !before.result) handOver(next);
    setState(next);
    if (mode === 'play' && next.winner === null) void slot.save({ state: next, difficulty });
  };

  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.winner !== null) return;
    if (state.result) {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 2800);
      return () => window.clearTimeout(id);
    }
    if (mode === 'play' && state.toAct === 0) return;
    const level = mode === 'watch' ? WATCH[state.toAct]! : difficulty;
    const id = window.setTimeout(() => act(levelAction(state, level)), 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn =
    mode === 'play' && !!state && state.toAct === 0 && state.winner === null && !state.result;
  const legal = myTurn ? legalEightsActions(state) : [];
  const playable = new Set(myTurn ? playableCards(state) : []);
  const hand = state ? sortHand(state.hands[0]!) : [];

  const tap = (card: number) => {
    if (!myTurn || !playable.has(card)) return;
    if (isEight(card)) setEight(card);
    else act(`play:${card}`);
  };
  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    const a = levelAction(state, 'hard');
    const level = t('difficulty.hard');
    setHint(
      a === 'draw'
        ? t('hint.draw', { level })
        : a === 'pass'
          ? t('hint.pass', { level })
          : t('hint.play', { level, move: moveText(a) }),
    );
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.result && state.winner === null && (k === 'n' || k === 'enter')) {
      act('next');
      return true;
    }
    if (!myTurn) return false;
    if (eight !== null && /^[1-4]$/.test(k)) act(`play:${eight}:${Number(k) - 1}`);
    else if (k === 'd' && legal.includes('draw')) act('draw');
    else if (k === 'p' && legal.includes('pass')) act('pass');
    else if (k === 'h') showHint();
    else if (k === 'arrowleft' || k === 'arrowright')
      setCursor((c) => (c + (k === 'arrowleft' ? -1 : 1) + hand.length) % hand.length);
    else if (k === 'enter' || k === ' ') {
      const card = hand[cursor % Math.max(1, hand.length)];
      if (card !== undefined) tap(card);
    } else return false;
    return true;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="eights-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="eights-resume"
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
            <legend>{t('menu.players')}</legend>
            <div className={styles.segmented}>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={opponents === n}
                  onClick={() => setOpponents(n)}
                  data-testid={`eights-opponents-${n}`}
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
                  data-testid={`eights-difficulty-${d}`}
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
              onClick={() => start(createEights(newSeed(), opponents + 1), 'play', difficulty)}
              data-testid="eights-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createEights(newSeed(), 4), 'watch', difficulty)}
              data-testid="eights-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const top = topCard(s);
  const drawnText = s.drawn !== null && myTurn ? cardName(s.drawn, locale) : '';
  const status =
    s.winner !== null
      ? s.winner === 0 && mode === 'play'
        ? t('over.won', { score: s.scores[0]! })
        : t('over.lost', { name: nameOf(s.winner), score: s.scores[s.winner]! })
      : s.result
        ? announcement
        : myTurn
          ? eight !== null
            ? t('pick.suit')
            : s.drawn !== null
              ? t(playable.size ? 'drawn' : 'drawn.stuck', { card: drawnText })
              : legal.includes('draw')
                ? t('must-draw')
                : legal.includes('pass')
                  ? t('cannot')
                  : t('your-turn')
          : t('thinking', { name: nameOf(s.toAct) });

  return (
    <div className={styles.play} data-testid="eights">
      <div className={styles.scoreboard}>
        {s.scores.map((score, p) => (
          <span
            key={p}
            className={styles.team}
            data-team={p === 0 ? 0 : 1}
            data-testid={`eights-score-${p}`}
          >
            {t('score', { name: nameOf(p), n: score })}
          </span>
        ))}
        <span className="muted">
          {t('hand', { n: s.handNo })} · {t('target', { n: TARGET })}
        </span>
      </div>
      <div className={eights.table}>
        <div className={eights.opponents}>
          {s.hands.slice(1).map((h, k) => (
            <div
              key={k}
              className={`${eights.opponent} ${s.toAct === k + 1 && !s.result ? eights.active : ''}`}
              data-testid={`eights-opponent-${k + 1}`}
            >
              <div className={eights.backs}>
                {(mode === 'watch' || s.result ? sortHand(h) : h).map((c, j) => (
                  <div
                    key={mode === 'watch' || s.result ? c : j}
                    className={eights.back}
                    role="img"
                    aria-label={
                      mode === 'watch' || s.result ? cardName(c, locale) : t('card.hidden')
                    }
                  >
                    <CardView
                      card={c}
                      faceUp={mode === 'watch' || !!s.result}
                      fourColor={services.colorblind}
                    />
                  </div>
                ))}
              </div>
              <span className={eights.plate}>
                {nameOf(k + 1)} · {t('cards', { n: h.length })}
              </span>
            </div>
          ))}
        </div>
        <div className={eights.middle}>
          <button
            type="button"
            className={eights.pile}
            disabled={!legal.includes('draw')}
            onClick={() => act('draw')}
            aria-label={t('stock', { n: s.stock.length })}
            data-testid="eights-stock"
          >
            <CardView card={0} faceUp={false} />
            <span className={eights.count}>{s.stock.length}</span>
          </button>
          <div
            className={eights.pile}
            role="img"
            aria-label={cardName(top, locale)}
            data-testid="eights-top"
          >
            <CardView key={s.discard.length} card={top} faceUp fourColor={services.colorblind} />
          </div>
          <span className={eights.suit} data-suit={s.suit} data-testid="eights-suit">
            {t('suit', { suit: t(`suit.${s.suit}`) })}
          </span>
        </div>
        <p className={styles.status} data-testid="eights-status">
          {status}
        </p>
        {eight !== null && (
          <div className={eights.suits} data-testid="eights-suits">
            {[0, 1, 2, 3].map((suit) => (
              <button
                key={suit}
                type="button"
                className="btn"
                data-suit={suit}
                onClick={() => act(`play:${eight}:${suit}`)}
                data-testid={`eights-suit-${suit}`}
              >
                {t(`suit.${suit}`)}
              </button>
            ))}
          </div>
        )}
        <div className={eights.hand} data-testid="eights-hand">
          {hand.map((c) => (
            <button
              key={c}
              type="button"
              className={`${eights.card} ${myTurn && !playable.has(c) ? eights.dim : ''} ${eight === c || s.drawn === c ? eights.picked : ''}`}
              disabled={!playable.has(c)}
              onClick={() => tap(c)}
              aria-label={cardName(c, locale)}
            >
              <CardView card={c} faceUp fourColor={services.colorblind} />
            </button>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        {legal.includes('draw') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('draw')}
            data-testid="eights-draw"
          >
            {t('draw')}
          </button>
        )}
        {legal.includes('pass') && (
          <button
            type="button"
            className="btn"
            onClick={() => act('pass')}
            data-testid="eights-pass"
          >
            {t('pass')}
          </button>
        )}
        {myTurn && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={showHint}
            data-testid="eights-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && s.result && s.winner === null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="eights-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && s.winner !== null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createEights(newSeed(), s.players), 'play', difficulty)}
            data-testid="eights-again"
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
          data-testid="eights-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="eights-hint-text">
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
