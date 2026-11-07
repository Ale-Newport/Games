/**
 * Shared shell for the patience games: lays out piles of cards to fit the screen, and handles
 * tapping (select, then tap a destination; tap the selection again to send it to its best spot),
 * dragging, the keyboard, undo, hints, finishing, the computer playing the deal ("Watch AI"), the
 * clock and score, statistics, achievements and the saved game.
 */
import { Bot, CheckCheck, Lightbulb, Pause, Play, RotateCcw, Shuffle, Undo2 } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { Agent } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import { useLatest } from '../../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../../core/game-engine/random';
import type { GameProps } from '../../../core/game-engine/types';
import {
  createTranslator,
  pickText,
  type Dictionary,
  type Locale,
  type Translator,
} from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import { cardName } from '../cards/cards';
import { CardView } from '../cards/CardView';
import { SOLITAIRE_STRINGS } from './i18n';
import { CARD_SOUNDS, type CardSound } from './sounds';
import styles from './SolitaireGame.module.css';

export interface PileCard {
  card: number;
  up: boolean;
}

export interface PileView {
  id: string;
  kind: 'stock' | 'waste' | 'foundation' | 'tableau' | 'cell';
  /** Column in the layout grid (fractions allowed) and row: 0 the top row, 1 the tableau. */
  col: number;
  row: 0 | 1;
  /** Exact top edge in card heights, overriding `row` (for layouts such as a pyramid). */
  y?: number;
  fan: 'none' | 'down' | 'right';
  /** Spread only the last n cards (the waste in draw-three). */
  fanLast?: number;
  cards: PileCard[];
  /** Placeholder glyph for an empty pile (e.g. "A", "K", "↺"). */
  empty?: string;
  /** Draw no slot once the pile is empty (cards removed from play, as in a pyramid). */
  vanish?: boolean;
  /** Make the pile glow (e.g. the pile to turn next). */
  glow?: boolean;
}

export interface CardRef {
  pile: string;
  index: number;
}

export interface SolitaireEndEvent<S> {
  won: boolean;
  state: S;
  timeMs: number;
  undos: number;
  hints: number;
  unlock: (id: string) => void;
}

/** Everything a patience game supplies to the shell. */
export interface SolitaireDefinition<S> {
  /** Statistics mode key, e.g. "draw-1". */
  mode: string;
  strings: Record<Locale, Dictionary>;
  /** Layout columns (the widest row). */
  columns: number;
  deal(seed: number): S;
  seedOf(s: S): number;
  historyOf(s: S): readonly string[];
  replay(seed: number, history: readonly string[]): S;
  validate(data: unknown): data is S;
  apply(s: S, move: string): S;
  legal(s: S): string[];
  status(s: S): 'playing' | 'won' | 'lost';
  score(s: S): number;
  piles(s: S): PileView[];
  canPick(s: S, from: CardRef): boolean;
  /** The move that puts the cards picked at `from` onto pile `to`, if legal. */
  moveTo(s: S, from: CardRef, to: string): string | null;
  /** Best destination for the cards at `from` (foundations first), if any. */
  autoMove(s: S, from: CardRef): string | null;
  /** Tapping the stock. */
  stockMove(s: S): string | null;
  /** The next move of the automatic finish, when the deal can be finished without choices. */
  finishMove(s: S): string | null;
  /** A single tap plays a card straight to its spot (games where each card has one move). */
  tapPlays?: boolean;
  /** An extra line of information for the stats row (e.g. "Deals left 3"). */
  info?: (s: S, t: Translator) => string;
  /** A move the shell plays by itself after each of the player's moves (e.g. safe cards home). */
  autoPlay?: (s: S) => string | null;
  /** Source and target of a move, for hints. */
  moveEnds(s: S, move: string): { from: CardRef | null; to: string } | null;
  describe(before: S, move: string, after: S, t: Translator, locale: Locale): string;
  sound(before: S, move: string, after: S): CardSound;
  env: GameEnvironment<S, string>;
  agents: readonly AgentPreset<S, string>[];
  hintAgent: string;
  watchAgent: string;
  onEnd?: (event: SolitaireEndEvent<S>) => void;
}

interface Session<S> {
  state: S;
  elapsedMs: number;
  undos: number;
  hints: number;
  recorded: boolean;
  /** Automatic plays at the end of the history (undone together with the move before them). */
  autoTrail?: number;
  /** Automatic plays are paused after an undo until the player moves again. */
  autoPaused?: boolean;
}

type Saved<S> = Session<S>;

const newSeed = () => (randomSeed() % 999_999) + 1;

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

interface Geometry {
  cardW: number;
  cardH: number;
  gap: number;
  height: number;
  /** Top-left of each card by pile id and index, and each pile's drop area. */
  cards: Map<string, { x: number; y: number }[]>;
  areas: Map<string, { x: number; y: number; w: number; h: number }>;
}

function layout(piles: PileView[], columns: number, width: number, maxHeight: number): Geometry {
  const gap = Math.max(4, Math.round(width * 0.012));
  // Layouts placed by height (a pyramid) must also fit the height available.
  const tallest = Math.max(0, ...piles.map((p) => (p.y === undefined ? 0 : p.y + 1)));
  // (Leave room for the buttons under the board.)
  const byHeight = tallest ? (maxHeight - 110) / tallest / 1.4 : Infinity;
  const cardW = Math.min(110, (width - gap * (columns + 1)) / columns, byHeight);
  const cardH = cardW * 1.4;
  // Center the columns when cards reach their maximum size.
  const left = Math.max(0, (width - (columns * cardW + (columns + 1) * gap)) / 2);
  const rowY = [0, cardH + gap * 2.5];
  const cards = new Map<string, { x: number; y: number }[]>();
  const areas = new Map<string, { x: number; y: number; w: number; h: number }>();
  let height = cardH;
  for (const p of piles) {
    const x = left + gap + p.col * (cardW + gap);
    const y = p.y !== undefined ? p.y * cardH : rowY[p.row]!;
    const spots: { x: number; y: number }[] = [];
    if (p.fan === 'down') {
      const downStep = cardH * 0.13;
      const upStep = cardH * 0.27;
      const natural = p.cards.slice(0, -1).reduce((a, c) => a + (c.up ? upStep : downStep), 0);
      const room = Math.max(cardH * 0.6, maxHeight - y - cardH);
      const k = natural > room ? room / natural : 1;
      let cy = y;
      p.cards.forEach((c) => {
        spots.push({ x, y: cy });
        cy += (c.up ? upStep : downStep) * k;
      });
    } else if (p.fan === 'right') {
      const spread = p.fanLast ?? p.cards.length;
      const first = Math.max(0, p.cards.length - spread);
      p.cards.forEach((_, i) => spots.push({ x: x + Math.max(0, i - first) * cardW * 0.24, y }));
    } else p.cards.forEach(() => spots.push({ x, y }));
    cards.set(p.id, spots);
    const last = spots[spots.length - 1] ?? { x, y };
    const h = last.y - y + cardH;
    areas.set(p.id, {
      x,
      y,
      w: last.x - x + cardW,
      h: p.fan === 'down' ? Math.max(h, cardH * 1.6) : h,
    });
    height = Math.max(height, last.y + cardH);
  }
  return { cardW, cardH, gap, height: height + gap, cards, areas };
}

export function SolitaireGame<S>({ def, services }: { def: SolitaireDefinition<S> } & GameProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...SOLITAIRE_STRINGS.en, ...def.strings.en },
          es: { ...SOLITAIRE_STRINGS.es, ...def.strings.es },
        },
        locale,
      ),
    [def.strings, locale],
  );
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved<S>>({
        schema: 1,
        validate: (d: unknown): d is Saved<S> =>
          typeof d === 'object' &&
          d !== null &&
          def.validate((d as Saved<S>).state) &&
          typeof (d as Saved<S>).elapsedMs === 'number',
      }),
    [services, def],
  );
  const slotRef = useLatest(slot);
  const [watch, setWatch] = useState(services.launchParams.mode === 'watch');
  const [paused, setPaused] = useState(false);
  // A deal number in the URL (?deal=123) replays that deal; otherwise a random one.
  const requestedDeal = Number(services.launchParams.deal);
  const askedDeal = Number.isInteger(requestedDeal) && requestedDeal > 0 && requestedDeal < 1e9;
  const [session, setSession] = useState<Session<S>>(() => ({
    state: def.deal(askedDeal ? requestedDeal : newSeed()),
    elapsedMs: 0,
    undos: 0,
    hints: 0,
    recorded: false,
  }));
  const sessionRef = useLatest(session);
  const [selected, setSelected] = useState<CardRef | null>(null);
  const [cursor, setCursor] = useState<CardRef>({ pile: '', index: -1 });
  const [hint, setHint] = useState<{ from: CardRef | null; to: string } | null>(null);
  const [note, setNote] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [drag, setDrag] = useState<{ from: CardRef; dx: number; dy: number } | null>(null);
  const pointer = useRef<{
    from: CardRef | null;
    x: number;
    y: number;
    id: number;
    moved: boolean;
  } | null>(null);
  const agents = useRef<{ hint: Agent<S, string> | null; watch: Agent<S, string> | null }>({
    hint: null,
    watch: null,
  });
  const rng = useRef(new Rng(randomSeed()));
  const boardRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 360, maxHeight: 600 });

  const preset = (id: string) => def.agents.find((a) => a.id === id) ?? def.agents[0]!;
  const watchLabel = pickText(preset(def.watchAgent).label, locale);

  // Restore the saved deal (not in watch mode).
  useEffect(() => {
    if (watch || askedDeal) return;
    let cancelled = false;
    void slotRef.current.load().then((saved) => {
      if (cancelled || !saved || def.status(saved.state) !== 'playing') return;
      setSession({ ...saved });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Board size: the width of the play area and the height left in the viewport.
  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBox({
        width: Math.max(280, rect.width),
        maxHeight: Math.max(380, window.innerHeight - rect.top - 12),
      });
    };
    measure();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const state = session.state;
  const status = def.status(state);
  const piles = useMemo(() => def.piles(state), [def, state]);
  const geo = useMemo(
    () => layout(piles, def.columns, box.width, box.maxHeight),
    [piles, def.columns, box],
  );

  /** Saves and records the end of a deal (once). */
  const settle = (next: Session<S>, watching = watch): Session<S> => {
    const svc = servicesRef.current;
    const st = def.status(next.state);
    if (st !== 'playing' && !next.recorded) {
      if (!watching) {
        svc.recordResult(
          st === 'won'
            ? {
                outcome: 'win',
                score: def.score(next.state),
                timeMs: next.elapsedMs,
                mode: def.mode,
              }
            : { outcome: 'loss', mode: def.mode },
        );
        def.onEnd?.({
          won: st === 'won',
          state: next.state,
          timeMs: next.elapsedMs,
          undos: next.undos,
          hints: next.hints,
          unlock: svc.unlockAchievement,
        });
      }
      svc.playSound(st === 'won' ? CARD_SOUNDS.win : CARD_SOUNDS.lose);
      setAnnouncement(
        watching
          ? t(st === 'won' ? 'result.aiWon' : 'result.aiLost', { agent: watchLabel })
          : t(st === 'won' ? 'result.won' : 'result.lost'),
      );
      next = { ...next, recorded: true };
    }
    if (!watching) void slotRef.current.save(next);
    return next;
  };

  const play = (move: string, automatic = false) => {
    const current = sessionRef.current;
    if (def.status(current.state) !== 'playing') return;
    const next = def.apply(current.state, move);
    servicesRef.current.playSound(CARD_SOUNDS[def.sound(current.state, move, next)]);
    setAnnouncement(def.describe(current.state, move, next, t, locale));
    if (!automatic) setSelected(null);
    setHint(null);
    setNote('');
    setSession(
      settle({
        ...current,
        state: next,
        autoTrail: automatic ? (current.autoTrail ?? 0) + 1 : 0,
        autoPaused: false,
      }),
    );
  };

  const invalid = () => {
    servicesRef.current.playSound(CARD_SOUNDS.invalid);
    setNote(t('invalid'));
    setSelected(null);
  };

  /** Starts a deal; abandoning an unfinished one of the player's counts as a loss. */
  const startDeal = (seed: number, watching = watch) => {
    const current = sessionRef.current;
    if (
      !watch &&
      !watching &&
      !current.recorded &&
      def.historyOf(current.state).length > 0 &&
      def.status(current.state) === 'playing'
    )
      servicesRef.current.recordResult({ outcome: 'loss', mode: def.mode });
    agents.current = { hint: null, watch: null };
    setSelected(null);
    setHint(null);
    setNote('');
    setFinishing(false);
    setSession(
      settle(
        { state: def.deal(seed), elapsedMs: 0, undos: 0, hints: 0, recorded: false },
        watching,
      ),
    );
  };

  /** Watching starts the computer on a deal of its own; playing again resumes the saved deal. */
  const toggleWatch = () => {
    setPaused(false);
    if (!watch) {
      setWatch(true);
      startDeal(newSeed(), true);
      return;
    }
    setWatch(false);
    void slotRef.current.load().then((saved) => {
      if (saved && def.status(saved.state) === 'playing') {
        agents.current = { hint: null, watch: null };
        setSelected(null);
        setHint(null);
        setSession({ ...saved });
      } else startDeal(newSeed(), false);
    });
  };

  const undo = () => {
    const current = sessionRef.current;
    const history = def.historyOf(current.state);
    if (!history.length || def.status(current.state) === 'won') return;
    // The player's last move goes back together with the automatic plays that followed it.
    const steps = Math.min(history.length, (current.autoTrail ?? 0) + 1);
    const state = def.replay(def.seedOf(current.state), history.slice(0, -steps));
    setSelected(null);
    setHint(null);
    setNote('');
    setSession(
      settle({
        ...current,
        state,
        undos: current.undos + 1,
        autoTrail: 0,
        autoPaused: true,
        recorded: current.recorded && def.status(state) !== 'playing',
      }),
    );
  };

  const showHint = () => {
    const current = sessionRef.current;
    if (def.status(current.state) !== 'playing') return;
    agents.current.hint ??= preset(def.hintAgent).create();
    const move = agents.current.hint.selectAction(def.env, current.state, 0, {
      rng: rng.current,
      timeLimitMs: 800,
    });
    const ends = def.moveEnds(current.state, move);
    servicesRef.current.playSound(CARD_SOUNDS.hint);
    setHint(ends);
    setSession({ ...current, hints: current.hints + 1 });
    if (!ends) setNote(t('status.noHint'));
  };

  // The clock runs while a deal is being played by the human and the page is visible.
  useEffect(() => {
    if (watch || status !== 'playing' || def.historyOf(state).length === 0) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setSession((s) =>
        def.status(s.state) === 'playing' ? { ...s, elapsedMs: s.elapsedMs + 1000 } : s,
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [def, watch, status, state]);

  // Watch AI: the computer plays the deal, then deals again.
  useEffect(() => {
    if (!watch || paused) return;
    if (status !== 'playing') {
      const id = window.setTimeout(() => startDeal(newSeed()), 2600);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      agents.current.watch ??= preset(def.watchAgent).create();
      const current = sessionRef.current;
      const move = agents.current.watch.selectAction(def.env, current.state, 0, {
        rng: rng.current,
        timeLimitMs: 600,
      });
      play(move);
    }, 420);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, paused, state, status]);

  // Automatic plays after the player's moves (never while watching: the AI plans its own).
  useEffect(() => {
    if (watch || finishing || status !== 'playing' || !def.autoPlay || session.autoPaused) return;
    const move = def.autoPlay(state);
    if (!move) return;
    const id = window.setTimeout(() => play(move, true), services.reducedMotion ? 30 : 140);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, watch, finishing, session.autoPaused]);

  // Automatic finish: one move at a time.
  useEffect(() => {
    if (!finishing) return;
    const move = status === 'playing' ? def.finishMove(state) : null;
    const id = window.setTimeout(
      () => (move ? play(move) : setFinishing(false)),
      services.reducedMotion ? 30 : 110,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishing, state]);

  const interactive = !watch && status === 'playing' && !finishing;

  const tap = (target: CardRef) => {
    if (!interactive) return;
    const pile = piles.find((p) => p.id === target.pile);
    if (!pile) return;
    if (pile.kind === 'stock') {
      const m = def.stockMove(state);
      return m ? play(m) : invalid();
    }
    if (selected) {
      if (selected.pile === target.pile && selected.index === target.index) {
        const m = def.autoMove(state, selected);
        return m ? play(m) : invalid();
      }
      if (selected.pile !== target.pile) {
        const m = def.moveTo(state, selected, target.pile);
        if (m) return play(m);
      }
    }
    if (target.index >= 0 && def.canPick(state, target)) {
      if (def.tapPlays) {
        const m = def.autoMove(state, target);
        return m ? play(m) : invalid();
      }
      setSelected(target);
      setNote('');
      const card = pile.cards[target.index]!.card;
      setAnnouncement(t('selected', { card: cardName(card, locale) }));
    } else if (selected) invalid();
  };

  // Pointer input: a press that moves becomes a drag, otherwise a tap.
  const onPointerDown = (e: ReactPointerEvent, from: CardRef) => {
    if (!interactive || e.button !== 0) return;
    pointer.current = { from, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId || !p.from) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.hypot(dx, dy) < 7) return;
    if (!p.moved) {
      if (!def.canPick(state, p.from)) {
        pointer.current = null;
        return;
      }
      p.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    setDrag({ from: p.from, dx, dy });
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const p = pointer.current;
    pointer.current = null;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved || !p.from) {
      if (p.from) tap(p.from);
      return;
    }
    setDrag(null);
    // Drop on the pile under the dragged card's center (or the closest one that accepts it).
    const start = geo.cards.get(p.from.pile)?.[p.from.index];
    if (!start) return;
    const cx = start.x + (e.clientX - p.x) + geo.cardW / 2;
    const cy = start.y + (e.clientY - p.y) + geo.cardH / 2;
    let best: { id: string; d: number } | null = null;
    for (const [id, a] of geo.areas) {
      if (id === p.from.pile) continue;
      const inside =
        cx >= a.x && cx <= a.x + a.w && cy >= a.y - geo.gap && cy <= a.y + a.h + geo.gap;
      const d = inside ? 0 : Math.hypot(cx - (a.x + a.w / 2), cy - (a.y + geo.cardH / 2));
      if (d > geo.cardW * 1.2) continue;
      if (!def.moveTo(state, p.from, id)) continue;
      if (!best || d < best.d) best = { id, d };
    }
    const m = best ? def.moveTo(state, p.from, best.id) : null;
    if (m) play(m);
    else servicesRef.current.playSound(CARD_SOUNDS.invalid);
  };
  const onPointerCancel = () => {
    pointer.current = null;
    setDrag(null);
  };

  // Keyboard: a cursor over piles (←/→) and over the face-up cards of a pile (↑/↓).
  const cursorPile = piles.find((p) => p.id === cursor.pile) ?? piles[0]!;
  const firstUp = (p: PileView) => {
    const k = p.cards.findIndex((c) => c.up);
    return k === -1 ? p.cards.length - 1 : k;
  };
  useKeyboard((e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === 'n') {
      startDeal(newSeed());
      return true;
    }
    if (watch) return false;
    if (key === 'u') {
      undo();
      return true;
    }
    if (key === 'h') {
      showHint();
      return true;
    }
    if (key === 'f') {
      if (def.finishMove(state)) setFinishing(true);
      return true;
    }
    if (key === 'd') {
      const m = def.stockMove(state);
      if (m && interactive) play(m);
      return true;
    }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const i = piles.indexOf(cursorPile);
      const next = piles[(i + (key === 'ArrowLeft' ? -1 : 1) + piles.length) % piles.length]!;
      setCursor({ pile: next.id, index: next.cards.length - 1 });
      return true;
    }
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      const p = cursorPile;
      const lo = firstUp(p);
      const at = cursor.pile === p.id ? cursor.index : p.cards.length - 1;
      const index = Math.min(p.cards.length - 1, Math.max(lo, at + (key === 'ArrowUp' ? -1 : 1)));
      setCursor({ pile: p.id, index });
      return true;
    }
    if (key === 'Enter' || key === ' ') {
      const p = cursorPile;
      tap({ pile: p.id, index: cursor.pile === p.id ? cursor.index : p.cards.length - 1 });
      return true;
    }
    if (key === 'a') {
      // The selection, the card under the cursor, or else the first card that has a move.
      const top = (p: PileView) => ({ pile: p.id, index: p.cards.length - 1 });
      const playable = piles
        .map(top)
        .find((r) => r.index >= 0 && def.canPick(state, r) && def.autoMove(state, r));
      const cursorRef = top(cursorPile);
      const from =
        selected ??
        (cursorRef.index >= 0 && def.canPick(state, cursorRef)
          ? cursorRef
          : (playable ?? cursorRef));
      const m = interactive && from.index >= 0 ? def.autoMove(state, from) : null;
      if (m) play(m);
      else invalid();
      return true;
    }
    if (key === 'Escape' && selected) {
      setSelected(null);
      return true;
    }
    return false;
  });

  const moves = def.historyOf(state).length;
  const canFinish = interactive && def.finishMove(state) !== null;
  const statusText = watch
    ? t('status.watching', { agent: watchLabel })
    : status === 'won'
      ? t('status.won', { score: def.score(state), time: formatTime(session.elapsedMs) })
      : status === 'lost'
        ? t('status.lost')
        : note || t('status.playing');

  const cardStyle = (x: number, y: number, z: number, lifted: boolean): CSSProperties => ({
    width: geo.cardW,
    height: geo.cardH,
    transform: `translate(${x}px, ${y}px)`,
    zIndex: z,
    transition: lifted || services.reducedMotion ? 'none' : undefined,
  });

  return (
    <div className={styles.play} data-testid="solitaire">
      <div className={styles.stats} aria-live="off">
        <span>
          {t('stat.score')} <strong data-testid="sol-score">{def.score(state)}</strong>
        </span>
        <span>
          {t('stat.moves')} <strong data-testid="sol-moves">{moves}</strong>
        </span>
        <span>
          {t('stat.time')} <strong>{formatTime(session.elapsedMs)}</strong>
        </span>
        <span>
          {t('stat.deal')} <strong data-testid="sol-deal">#{def.seedOf(state)}</strong>
        </span>
        {def.info && <span data-testid="sol-info">{def.info(state, t)}</span>}
      </div>
      <div className={styles.status} data-testid="sol-status" data-status={status}>
        {statusText}
      </div>
      <div
        ref={boardRef}
        className={`${styles.board} ${services.reducedMotion ? styles.still : ''}`}
        style={{ height: geo.height }}
        role="application"
        aria-label={t('board.label')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {piles.map((p) => {
          if (p.vanish && p.cards.length === 0) return null;
          const a = geo.areas.get(p.id)!;
          const hinted = hint?.to === p.id;
          return (
            <button
              key={`slot-${p.id}`}
              type="button"
              className={`${styles.slot} ${hinted ? styles.hintTarget : ''} ${cursor.pile === p.id && p.cards.length === 0 ? styles.cursorSlot : ''}`}
              style={{ left: a.x, top: a.y, width: geo.cardW, height: geo.cardH }}
              data-pile={p.id}
              aria-label={`${t(`pile.${p.kind}`)}${p.id.match(/\d+/) ? ` ${Number(p.id.match(/\d+/)![0]) + 1}` : ''}, ${p.cards.length ? t('pile.cards', { n: p.cards.length }) : t('pile.empty')}`}
              onPointerDown={(e) => onPointerDown(e, { pile: p.id, index: -1 })}
              onClick={(e) => {
                // Pointer taps are handled on pointer up; this covers keyboard activation.
                if (e.detail === 0) tap({ pile: p.id, index: -1 });
              }}
            >
              <span className={styles.slotGlyph} aria-hidden="true">
                {p.empty ?? ''}
              </span>
            </button>
          );
        })}
        {piles.flatMap((p) =>
          p.cards.map((c, i) => {
            const spot = geo.cards.get(p.id)![i]!;
            const dragging = drag && drag.from.pile === p.id && i >= drag.from.index;
            const isSelected = selected && selected.pile === p.id && i >= selected.index;
            const isHint = hint?.from && hint.from.pile === p.id && i >= hint.from.index;
            const isCursor = cursor.pile === p.id && cursor.index === i;
            const x = spot.x + (dragging ? drag.dx : 0);
            const y = spot.y + (dragging ? drag.dy : 0);
            return (
              <div
                key={c.card}
                className={[
                  styles.card,
                  isSelected && styles.selected,
                  (isHint || (p.glow && i === p.cards.length - 1)) && styles.hinted,
                  isCursor && styles.cursor,
                  dragging && styles.dragging,
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={cardStyle(x, y, dragging ? 1000 + i : i + 1, !!dragging)}
                data-card={c.up ? c.card : undefined}
                data-pile-card={`${p.id}:${i}`}
                role="img"
                aria-label={c.up ? cardName(c.card, locale) : t('card.down')}
                onPointerDown={(e) => onPointerDown(e, { pile: p.id, index: i })}
                onDoubleClick={() => {
                  if (!interactive) return;
                  const m = def.canPick(state, { pile: p.id, index: i })
                    ? def.autoMove(state, { pile: p.id, index: i })
                    : null;
                  if (m) play(m);
                }}
              >
                <CardView card={c.card} faceUp={c.up} fourColor={services.colorblind} />
              </div>
            );
          }),
        )}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className="btn"
          onClick={() => startDeal(newSeed())}
          data-testid="sol-new"
        >
          <Shuffle size={16} /> {t('action.new')}
        </button>
        {!watch && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => startDeal(def.seedOf(state))}
              data-testid="sol-restart"
            >
              <RotateCcw size={16} /> {t('action.restart')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={undo}
              disabled={!moves || status === 'won'}
              data-testid="sol-undo"
            >
              <Undo2 size={16} /> {t('action.undo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={showHint}
              disabled={!interactive}
              data-testid="sol-hint"
            >
              <Lightbulb size={16} /> {t('action.hint')}
            </button>
            {canFinish && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setFinishing(true)}
                data-testid="sol-finish"
              >
                <CheckCheck size={16} /> {t('action.finish')}
              </button>
            )}
          </>
        )}
        {watch && (
          <button type="button" className="btn" onClick={() => setPaused((v) => !v)}>
            {paused ? <Play size={16} /> : <Pause size={16} />}{' '}
            {t(paused ? 'action.resume' : 'action.pause')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toggleWatch}
          data-testid="sol-watch"
        >
          {watch ? <Play size={16} /> : <Bot size={16} />}{' '}
          {t(watch ? 'action.play' : 'action.watch')}
        </button>
      </div>
      <p className={styles.keys}>{t('keys')}</p>
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
