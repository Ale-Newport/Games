/** The Go Fish table: one game against one to three AI players (or four AIs to watch). */
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
import { sortHand } from '../shared/tricks/cards';
import styles from '../shared/tricks/TrickGame.module.css';
import { levelAction } from './ai';
import {
  applyFishAction,
  createFish,
  isValidFishState,
  legalFishActions,
  type FishState,
} from './engine';
import { NAMES, STRINGS } from './i18n';
import fish from './FishGame.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const WATCH: Difficulty[] = ['hard', 'medium', 'easy', 'hard'];
const LOG_LINES = 5;

interface Saved {
  state: FishState;
  difficulty: Difficulty;
}
type Mode = 'menu' | 'play' | 'watch';

/** Cards in `after` that are not in `before`. */
const gained = (before: readonly number[], after: readonly number[]) =>
  after.filter((c) => !before.includes(c));

export function FishGame({ services }: GameProps) {
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
          isValidFishState((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedDeal = Number.isInteger(asked) && asked > 0 ? asked : null;
  const newSeed = () => fixedDeal ?? randomSeed() >>> 0;
  const rng = useRef(new Rng(fixedDeal ?? randomSeed()));
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [opponents, setOpponents] = useState(1);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<FishState | null>(() =>
    mode === 'watch' ? createFish(newSeed(), 4) : null,
  );
  /** The rank picked from the hand, waiting for a target. */
  const [rank, setRank] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const stateRef = useLatest(state);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && !d.state.over) setSaved(d);
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
  /** Names without the level, for the log. */
  const shortName = (p: number) =>
    p === 0 ? (mode === 'watch' ? 'Elena' : t('you')) : NAMES[p - 1]!;
  const rankText = (r: number) => t(`rank.${r}`);

  const start = (s: FishState, m: Mode, d: Difficulty) => {
    setState(s);
    setMode(m);
    setDifficulty(d);
    setRank(null);
    setHint(null);
    setPaused(false);
    setLog([]);
    if (m === 'play') void slot.save({ state: s, difficulty: d });
  };

  /** The log lines for one action. */
  const describe = (before: FishState, a: string, next: FishState): string[] => {
    const p = before.toAct;
    const me = mode === 'play' && p === 0;
    const lines: string[] = [];
    if (a === 'pass') lines.push(t('log.pass', { name: shortName(p) }));
    else if (a === 'draw') {
      const card = gained(before.hands[p]!, [...next.hands[p]!, ...poolOfBooks(before, next, p)]);
      lines.push(
        me && card[0] !== undefined
          ? t('log.youDraw', { card: cardName(card[0], locale) })
          : t('log.draw', { name: shortName(p) }),
      );
    } else {
      const ask = next.asks.at(-1)!;
      const r = rankText(ask.rank);
      const toMe = mode === 'play' && ask.target === 0;
      const head = me
        ? t('log.youAsk', { target: shortName(ask.target), rank: r })
        : toMe
          ? t('log.askYou', { name: shortName(p), rank: r })
          : t('log.ask', { name: shortName(p), target: shortName(ask.target), rank: r });
      const tail =
        ask.got > 0
          ? toMe
            ? t('log.youGive', { n: ask.got })
            : t('log.got', { target: shortName(ask.target), n: ask.got })
          : ask.lucky
            ? t('log.lucky')
            : t('log.fish');
      lines.push(`${head} — ${tail}`);
      if (me && ask.got === 0) {
        const card = gained(before.hands[p]!, [
          ...next.hands[p]!,
          ...poolOfBooks(before, next, p),
        ])[0];
        if (card !== undefined) lines.push(t('log.fished', { card: cardName(card, locale) }));
      }
    }
    for (const b of next.books[p]!.slice(before.books[p]!.length))
      lines.push(
        me
          ? t('log.youBook', { rank: rankText(b) })
          : t('log.book', { name: shortName(p), rank: rankText(b) }),
      );
    return lines;
  };

  const gameOver = (s: FishState) => {
    if (mode !== 'play') return;
    const svc = servicesRef.current;
    const mine = s.winners.includes(0);
    const outcome = mine ? (s.winners.length === 1 ? 'win' : 'draw') : 'loss';
    svc.playSound(mine ? POKER_SOUNDS.win : POKER_SOUNDS.lose);
    svc.recordResult({ outcome, score: s.books[0]!.length, mode: difficulty });
    if (outcome === 'win') {
      svc.unlockAchievement('win');
      if (difficulty === 'hard' && s.players === 4) svc.unlockAchievement('full-table');
    }
    void slot.clear();
    setSaved(null);
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!before) return;
    let next: FishState;
    try {
      next = applyFishAction(before, a);
    } catch {
      servicesRef.current.playSound(POKER_SOUNDS.invalid);
      return;
    }
    const svc = servicesRef.current;
    const p = before.toAct;
    setHint(null);
    setRank(null);
    const ask = a.startsWith('ask:') ? next.asks.at(-1)! : null;
    const newBooks = next.books[p]!.length - before.books[p]!.length;
    svc.playSound(
      newBooks > 0
        ? POKER_SOUNDS.pot
        : ask && ask.got > 0
          ? POKER_SOUNDS.chips
          : a === 'pass'
            ? POKER_SOUNDS.check
            : POKER_SOUNDS.deal,
    );
    if (mode === 'play' && p === 0) {
      if (newBooks > 0) svc.unlockAchievement('book');
      if (ask && ask.got >= 3) svc.unlockAchievement('big-catch');
      if (ask?.lucky) svc.unlockAchievement('lucky');
    }
    setLog((l) => [...l, ...describe(before, a, next)].slice(-LOG_LINES));
    if (next.over) gameOver(next);
    setState(next);
    if (mode === 'play' && !next.over) void slot.save({ state: next, difficulty });
  };

  useEffect(() => {
    if (!state || mode === 'menu' || paused || state.over) return;
    if (mode === 'play' && state.toAct === 0) return;
    const level = mode === 'watch' ? WATCH[state.toAct]! : difficulty;
    const id = window.setTimeout(() => act(levelAction(state, level, rng.current)), 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, paused]);

  const myTurn = mode === 'play' && !!state && state.toAct === 0 && !state.over;
  const legal = myTurn ? legalFishActions(state) : [];
  const canAsk = legal.some((a) => a.startsWith('ask:'));
  const hand = state ? sortHand(state.hands[0]!) : [];
  const ranks = [...new Set(hand.map(rankOf))];
  const targets = state
    ? Array.from({ length: state.players }, (_, p) => p).filter(
        (p) => p !== 0 && legal.includes(`ask:${p}:${rank ?? ranks[0]}`),
      )
    : [];

  const pickRank = (r: number) => {
    if (!myTurn || !canAsk) return;
    // With a single opponent the rank is all there is to choose.
    if (state.players === 2 && legal.includes(`ask:1:${r}`)) act(`ask:1:${r}`);
    else setRank(r);
  };
  const showHint = () => {
    if (!state || !myTurn) return;
    servicesRef.current.playSound(POKER_SOUNDS.hint);
    const a = levelAction(state, 'hard', rng.current);
    const level = t('difficulty.hard');
    if (a === 'draw') setHint(t('hint.draw', { level }));
    else if (a === 'pass') setHint(t('hint.pass', { level }));
    else {
      const [, target, r] = a.split(':').map(Number) as [number, number, number];
      setHint(t('hint.ask', { level, name: nameOf(target), rank: rankText(r) }));
    }
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !state || !myTurn) return false;
    const k = e.key.toLowerCase();
    const current = ranks[cursor % Math.max(1, ranks.length)];
    if (k === 'd' && legal.includes('draw')) act('draw');
    else if (k === 'p' && legal.includes('pass')) act('pass');
    else if (k === 'h') showHint();
    else if ((k === 'arrowleft' || k === 'arrowright') && ranks.length) {
      const next = (cursor + (k === 'arrowleft' ? -1 : 1) + ranks.length) % ranks.length;
      setCursor(next);
      setRank(ranks[next]!);
    } else if ((k === 'enter' || k === ' ') && current !== undefined) pickRank(rank ?? current);
    else if (/^[1-3]$/.test(k) && (rank ?? current) !== undefined) {
      const a = `ask:${k}:${rank ?? current}`;
      if (legal.includes(a)) act(a);
    } else return false;
    return true;
  });

  if (mode === 'menu' || !state) {
    const stats = services.getStats()?.modes[difficulty];
    return (
      <div className={styles.menu} data-testid="fish-menu">
        <div className={styles.menuCard}>
          <h2 className={styles.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${styles.resume}`}
              onClick={() => start(saved.state, 'play', saved.difficulty)}
              data-testid="fish-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    books: saved.state.books[0]!.length,
                    pond: saved.state.pond.length,
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
                  data-testid={`fish-opponents-${n}`}
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
                  data-testid={`fish-difficulty-${d}`}
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
              onClick={() => start(createFish(newSeed(), opponents + 1), 'play', difficulty)}
              data-testid="fish-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(createFish(newSeed(), 4), 'watch', difficulty)}
              data-testid="fish-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const most = Math.max(...s.books.map((b) => b.length));
  const winnerNames = new Intl.ListFormat(locale, { type: 'conjunction' }).format(
    s.winners.map(nameOf),
  );
  const status = s.over
    ? mode === 'play' && s.winners.length === 1 && s.winners[0] === 0
      ? t('over.won', { n: most })
      : s.winners.length > 1
        ? t('over.tie', { names: winnerNames, n: most })
        : t('over.lost', { names: winnerNames, n: most })
    : myTurn
      ? legal.includes('draw')
        ? t('must-draw')
        : legal.includes('pass')
          ? t('cannot')
          : rank !== null && s.players > 2
            ? t('pick.target', { rank: rankText(rank) })
            : t('your-turn')
      : t('thinking', { name: nameOf(s.toAct) });
  const faceUp = mode === 'watch' || s.over;
  const bookRow = (p: number) => (
    <div className={fish.books} data-testid={`fish-books-${p}`}>
      {s.books[p]!.map((r) => (
        <span key={r} className={fish.book} title={rankText(r)}>
          {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][r - 1]}
        </span>
      ))}
    </div>
  );

  return (
    <div className={styles.play} data-testid="fish">
      <div className={styles.scoreboard}>
        {s.books.map((b, p) => (
          <span
            key={p}
            className={styles.team}
            data-team={p === 0 ? 0 : 1}
            data-testid={`fish-score-${p}`}
          >
            {nameOf(p)}: {b.length}
          </span>
        ))}
      </div>
      <div className={fish.table}>
        <div className={fish.opponents}>
          {s.hands.slice(1).map((h, k) => {
            const p = k + 1;
            const askable = myTurn && rank !== null && legal.includes(`ask:${p}:${rank}`);
            return (
              <button
                key={p}
                type="button"
                className={`${fish.opponent} ${s.toAct === p && !s.over ? fish.active : ''} ${askable ? fish.askable : ''}`}
                disabled={!askable}
                onClick={() => act(`ask:${p}:${rank}`)}
                aria-label={`${nameOf(p)} · ${t('cards', { n: h.length })} · ${t('books', { n: s.books[p]!.length })}`}
                data-testid={`fish-opponent-${p}`}
              >
                <div className={fish.backs}>
                  {(faceUp ? sortHand(h) : h).map((c, j) => (
                    <div key={faceUp ? c : j} className={fish.back}>
                      <CardView card={c} faceUp={faceUp} fourColor={services.colorblind} />
                    </div>
                  ))}
                </div>
                <span className={fish.plate}>
                  {nameOf(p)} · {t('cards', { n: h.length })}
                </span>
                {bookRow(p)}
              </button>
            );
          })}
        </div>
        <div className={fish.middle}>
          <button
            type="button"
            className={fish.pile}
            disabled={!legal.includes('draw')}
            onClick={() => act('draw')}
            aria-label={t('pond', { n: s.pond.length })}
            data-testid="fish-pond"
          >
            {s.pond.length > 0 ? (
              <CardView card={0} faceUp={false} />
            ) : (
              <span className={fish.empty} />
            )}
            <span className={fish.count}>{s.pond.length}</span>
          </button>
          <ol
            className={fish.log}
            data-testid="fish-log"
            aria-label={t('pond', { n: s.pond.length })}
          >
            {log.map((line, i) => (
              <li key={`${log.length}-${i}`} className={i === log.length - 1 ? fish.latest : ''}>
                {line}
              </li>
            ))}
          </ol>
        </div>
        <p className={styles.status} data-testid="fish-status">
          {status}
        </p>
        {myTurn && rank !== null && s.players > 2 && (
          <div className={fish.targets} data-testid="fish-targets">
            {targets.map((p) => (
              <button
                key={p}
                type="button"
                className="btn"
                onClick={() => act(`ask:${p}:${rank}`)}
                data-testid={`fish-ask-${p}`}
              >
                {t('ask', { name: nameOf(p) })}
              </button>
            ))}
          </div>
        )}
        <div className={fish.hand} data-testid="fish-hand">
          {hand.map((c) => {
            const r = rankOf(c);
            return (
              <button
                key={c}
                type="button"
                className={`${fish.card} ${rank === r ? fish.picked : ''}`}
                disabled={!myTurn || !canAsk}
                onClick={() => pickRank(r)}
                aria-label={cardName(c, locale)}
                aria-pressed={rank === r}
                data-rank={r}
              >
                <CardView card={c} faceUp fourColor={services.colorblind} />
              </button>
            );
          })}
        </div>
        <div className={fish.mine}>
          <span className={fish.plate}>
            {nameOf(0)} · {t('books', { n: s.books[0]!.length })}
          </span>
          {bookRow(0)}
        </div>
      </div>
      <div className={styles.controls}>
        {legal.includes('draw') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('draw')}
            data-testid="fish-draw"
          >
            {t('draw')}
          </button>
        )}
        {legal.includes('pass') && (
          <button type="button" className="btn" onClick={() => act('pass')} data-testid="fish-pass">
            {t('pass')}
          </button>
        )}
        {myTurn && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={showHint}
            data-testid="fish-hint"
          >
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && s.over && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(createFish(newSeed(), s.players), 'play', difficulty)}
            data-testid="fish-again"
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
          data-testid="fish-menu-button"
        >
          {t('menu')}
        </button>
      </div>
      {hint && (
        <p className={styles.hint} data-testid="fish-hint-text">
          {hint}
        </p>
      )}
      {mode === 'play' && <p className={styles.keys}>{t('keys')}</p>}
      <div className="visually-hidden" role="status" aria-live="polite">
        {log.at(-1) ?? ''}
      </div>
    </div>
  );
}

/** Cards that went into a book this action (they left the hand, so `gained` must see them too). */
function poolOfBooks(before: FishState, next: FishState, p: number): number[] {
  const ranks = next.books[p]!.slice(before.books[p]!.length);
  // Books hold all four suits of their rank.
  return ranks.flatMap((r) => [0, 1, 2, 3].map((suit) => suit * 13 + r - 1));
}
