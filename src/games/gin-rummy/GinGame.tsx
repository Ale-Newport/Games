/** The gin rummy table: a match to 100 against one AI (or two AIs to watch). */
import { Bot, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { cardName, rankOf } from '../shared/cards/cards';
import { CardView } from '../shared/cards/CardView';
import { POKER_SOUNDS } from '../shared/poker/sounds';
import styles from '../shared/tricks/TrickGame.module.css';
import { hardThrow, levelAction, mediumDraw } from './ai';
import {
  TARGET,
  applyGinAction,
  canKnockWith,
  createGin,
  discardable,
  isValidGinState,
  type GinState,
} from './engine';
import { STRINGS } from './i18n';
import { bestMelds, deadwoodOf } from './melds';
import gin from './GinGame.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium'];

interface Saved {
  state: GinState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

/** A hand laid out as its melds followed by its deadwood (sorted by rank). */
function arrange(hand: readonly number[]): { melds: number[][]; deadwood: number[] } {
  const b = bestMelds(hand);
  return {
    melds: b.melds.map((m) => [...m].sort((a, c) => rankOf(a) - rankOf(c) || a - c)),
    deadwood: [...b.deadwood].sort((a, c) => rankOf(a) - rankOf(c) || a - c),
  };
}

export function GinGame({ services }: GameProps) {
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
          isValidGinState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<GinState | null>(() =>
    mode === 'watch' ? createGin(newSeed()) : null,
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
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

  const nameOf = (p: number) =>
    mode === 'watch' ? t(`difficulty.${WATCH[p]!}`) : p === 0 ? t('you') : t('ai');

  const start = (s: GinState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setSelected(null);
    setHint(null);
    setPaused(false);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  const handOver = (s: GinState) => {
    const svc = servicesRef.current;
    const r = s.result!;
    setAnnouncement(
      r.kind === 'void'
        ? t('result.void')
        : t(`result.${r.kind}`, { name: nameOf(r.winner!), n: r.points }),
    );
    if (mode !== 'play') return;
    svc.playSound(r.winner === 0 ? POKER_SOUNDS.win : POKER_SOUNDS.pot);
    if (r.winner === 0) {
      if (r.kind === 'gin') svc.unlockAchievement('gin');
      if (r.kind === 'undercut') svc.unlockAchievement('undercut');
      if (r.kind === 'knock') svc.unlockAchievement('knock');
    }
    if (s.winner !== null) {
      const won = s.winner === 0;
      svc.playSound(won ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
      svc.recordResult({
        outcome: won ? 'win' : 'loss',
        score: s.scores[0] - s.scores[1],
        mode: difficulty,
      });
      if (won) {
        svc.unlockAchievement('match');
        if (difficulty === 'hard') svc.unlockAchievement('match-hard');
      }
      void slot.clear();
      setSaved(null);
    }
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    let next: GinState;
    try {
      next = applyGinAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    setHint(null);
    setSelected(null);
    if (a === 'next') svc.playSound(POKER_SOUNDS.deal);
    else if (a.startsWith('draw:')) svc.playSound(POKER_SOUNDS.deal);
    else svc.playSound(a.startsWith('knock:') ? POKER_SOUNDS.chips : POKER_SOUNDS.check);
    if (a.startsWith('discard:') || a.startsWith('knock:'))
      setAnnouncement(
        `${nameOf(before.toAct)}: ${cardName(Number(a.slice(a.indexOf(':') + 1)), locale)}`,
      );
    if (next.phase === 'done' && before.phase !== 'done') handOver(next);
    setState(next);
    if (mode === 'play' && next.winner === null) void slot.save({ state: next, difficulty });
  };

  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.winner !== null) return;
    if (state.phase === 'done') {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => act('next'), 3200);
      return () => window.clearTimeout(id);
    }
    if (mode === 'play' && state.toAct === 0) return;
    const level = mode === 'watch' ? WATCH[state.toAct]! : difficulty;
    const id = window.setTimeout(() => act(levelAction(state, level, rng.current)), 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = mode === 'play' && !!state && state.toAct === 0 && state.winner === null;
  const drawing = myTurn && state.phase === 'draw';
  const throwing = myTurn && state.phase === 'discard';
  const mine = state ? arrange(state.hands[0]!) : { melds: [], deadwood: [] };
  const order = [...mine.melds.flat(), ...mine.deadwood];
  const canThrow = new Set(throwing ? discardable(state) : []);

  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    if (drawing) {
      const a = mediumDraw(state);
      setHint(t('hint.draw', { from: t(a === 'draw:stock' ? 'from.stock' : 'from.discard') }));
    } else {
      const a = hardThrow(state, rng.current);
      const card = Number(a.slice(a.indexOf(':') + 1));
      setSelected(card);
      setHint(
        t(a.startsWith('knock:') ? 'hint.knock' : 'hint.throw', { card: cardName(card, locale) }),
      );
    }
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state) return false;
    const k = e.key.toLowerCase();
    if (state.phase === 'done' && state.winner === null && (k === 'n' || k === 'enter')) {
      act('next');
      return true;
    }
    if (!myTurn) return false;
    if (k === 'h') showHint();
    else if (drawing && k === 's') act('draw:stock');
    else if (drawing && k === 'd') act('draw:discard');
    else if (throwing && (k === 'arrowleft' || k === 'arrowright')) {
      const pool = order.filter((c) => canThrow.has(c));
      const at = selected === null ? -1 : pool.indexOf(selected);
      const step = k === 'arrowleft' ? -1 : 1;
      setSelected(pool[(at + step + pool.length) % pool.length] ?? null);
    } else if (throwing && k === 'enter' && selected !== null) act(`discard:${selected}`);
    else if (throwing && k === 'k' && selected !== null && canKnockWith(state, selected))
      act(`knock:${selected}`);
    else return false;
    return true;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="gin-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="gin-resume"
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
                  data-testid={`gin-difficulty-${d}`}
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
              onClick={() => start(createGin(newSeed()), 'play', difficulty)}
              data-testid="gin-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createGin(newSeed()), 'watch', difficulty)}
              data-testid="gin-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const r = s.result;
  const done = s.phase === 'done';
  const top = s.discard[s.discard.length - 1];
  const oppOpen = mode === 'watch' || done;
  const opp = arrange(s.hands[1]!);
  const card = (c: number, faceUp: boolean, extra = '') => (
    <div
      key={c}
      className={`${gin.card} ${extra}`}
      role="img"
      aria-label={faceUp ? cardName(c, locale) : t('card.hidden')}
    >
      <CardView card={c} faceUp={faceUp} fourColor={services.colorblind} />
    </div>
  );
  const status =
    s.winner !== null
      ? mode === 'watch'
        ? t('over.watch', { name: nameOf(s.winner) })
        : s.winner === 0
          ? t('over.won', { you: s.scores[0], ai: s.scores[1] })
          : t('over.lost', { you: s.scores[0], ai: s.scores[1] })
      : done
        ? announcement
        : drawing
          ? t('phase.draw')
          : throwing
            ? selected !== null
              ? t('phase.selected', { card: cardName(selected, locale) })
              : t('phase.discard')
            : t('thinking', { name: nameOf(s.toAct) });
  const myDeadwood = deadwoodOf(s.hands[0]!);
  const knockable = throwing && selected !== null && canKnockWith(s, selected);
  const ginWith = knockable && deadwoodOf(s.hands[0]!.filter((c) => c !== selected)) === 0;

  return (
    <div className={styles.play} data-testid="gin">
      <div className={styles.scoreboard}>
        <span className={styles.team} data-team={0} data-testid="gin-score-0">
          {t('score', { name: nameOf(0), n: s.scores[0] })}
        </span>
        <span className={styles.team} data-team={1} data-testid="gin-score-1">
          {t('score', { name: nameOf(1), n: s.scores[1] })}
        </span>
        <span className="muted">
          {t('hand', { n: s.handNo })} · {t('target', { n: TARGET })}
        </span>
      </div>
      <div className={gin.table}>
        <div className={gin.opponent} data-testid="gin-opponent">
          <div className={gin.row}>
            {oppOpen
              ? [...opp.melds.flat(), ...opp.deadwood].map((c) =>
                  card(c, true, opp.deadwood.includes(c) ? gin.dead : ''),
                )
              : s.hands[1]!.map((c) => card(c, false))}
          </div>
          {s.picks[1]!.length > 0 && !oppOpen && (
            <p className={gin.note}>
              {t('took', { cards: s.picks[1]!.map((c) => cardName(c, locale)).join(', ') })}
            </p>
          )}
        </div>
        <div className={gin.piles}>
          <button
            type="button"
            className={gin.pile}
            disabled={!drawing}
            onClick={() => act('draw:stock')}
            aria-label={t('stock', { n: s.stock.length })}
            data-testid="gin-stock"
          >
            <CardView card={0} faceUp={false} />
            <span className={gin.count}>{s.stock.length}</span>
          </button>
          <button
            type="button"
            className={gin.pile}
            disabled={!drawing || top === undefined}
            onClick={() => act('draw:discard')}
            aria-label={
              top === undefined ? t('discard') : `${t('discard')}: ${cardName(top, locale)}`
            }
            data-testid="gin-discard"
          >
            {top !== undefined && <CardView card={top} faceUp fourColor={services.colorblind} />}
          </button>
        </div>
        <p className={styles.status} data-testid="gin-status">
          {status}
        </p>
        <div className={gin.mine} data-testid="gin-hand">
          {mine.melds.map((m, k) => (
            <div key={`m${k}`} className={gin.meld}>
              {m.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${gin.card} ${selected === c ? gin.picked : ''}`}
                  disabled={!canThrow.has(c)}
                  onClick={() => setSelected(selected === c ? null : c)}
                  aria-label={cardName(c, locale)}
                  aria-pressed={selected === c}
                >
                  <CardView card={c} faceUp fourColor={services.colorblind} />
                </button>
              ))}
            </div>
          ))}
          <div className={gin.loose}>
            {mine.deadwood.map((c) => (
              <button
                key={c}
                type="button"
                className={`${gin.card} ${gin.dead} ${selected === c ? gin.picked : ''}`}
                disabled={!canThrow.has(c)}
                onClick={() => setSelected(selected === c ? null : c)}
                aria-label={cardName(c, locale)}
                aria-pressed={selected === c}
              >
                <CardView card={c} faceUp fourColor={services.colorblind} />
              </button>
            ))}
          </div>
        </div>
        <p className={gin.deadwood} data-testid="gin-deadwood">
          {t('deadwood', { n: myDeadwood })}
          {done && r && r.kind !== 'void'
            ? ` · ${t('result.counts', { you: r.counts[0]!, ai: r.counts[1]! })}`
            : ''}
          {done && r && r.laid.length
            ? ` · ${t('laid.off', { cards: r.laid.map((c) => cardName(c, locale)).join(', ') })}`
            : ''}
        </p>
      </div>
      <div className={styles.controls}>
        {throwing && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selected === null}
              onClick={() => selected !== null && act(`discard:${selected}`)}
              data-testid="gin-throw"
            >
              {t('button.discard')}
            </button>
            {knockable && (
              <button
                type="button"
                className="btn"
                onClick={() => act(`knock:${selected}`)}
                data-testid="gin-knock"
              >
                {ginWith
                  ? t('button.gin')
                  : t('button.knock', { n: deadwoodOf(s.hands[0]!.filter((c) => c !== selected)) })}
              </button>
            )}
          </>
        )}
        {myTurn && (
          <button type="button" className="btn btn-ghost" onClick={showHint} data-testid="gin-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && done && s.winner === null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="gin-next"
          >
            {t('next')}
          </button>
        )}
        {mode === 'play' && s.winner !== null && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createGin(newSeed()), 'play', difficulty)}
            data-testid="gin-again"
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
          data-testid="gin-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="gin-hint-text">
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
