/**
 * The Hex Isles table: a menu (players, opponents or all human, new game, resume, watch the AI,
 * record), the island, the player's hand and builds, charts, bank and player trades, the dice,
 * every player's public figures, the log, and dialogs for discards, steals, bounty, embargo and
 * offers. Computer seats act after short pauses; in an all-human game a hand-off screen hides the
 * next player's hand until they continue.
 */
import { Bot, Dices, Lightbulb, Minus, Play, Plus, RotateCcw, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { decide, type Style } from './ai';
import {
  act,
  CHART_KINDS,
  covers,
  currentPlayer,
  isLegal,
  isValidIsles,
  legalActions,
  MAX_OFFERS,
  newIsles,
  none,
  offerOk,
  piecesLeft,
  points,
  rate,
  RESOURCES,
  total,
  trailLength,
  type Action,
  type Build,
  type Cards,
  type ChartKind,
  type IsleGame,
  type LogEntry,
} from './engine';
import styles from './HexIsles.module.css';
import { IslesBoard, type Targets } from './IslesBoard';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';

type Level = 'settler' | 'strategist' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['settler', 'strategist', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: IsleGame | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidIsles(s.state)) &&
    typeof s.record?.played === 'number'
  );
};

/** Cards as text: “2 wood, 1 fish”. */
const cardsText = (t: Translator, c: readonly number[]) =>
  c
    .map((n, r) => (n > 0 ? `${n} ${t(`res.${r}`)}` : ''))
    .filter(Boolean)
    .join(', ');

export function IslesTable({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('strategist');
  const [count, setCount] = useState(4);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'strategist', record: EMPTY });
  const [state, setState] = useState<IsleGame | null>(null);
  const [placing, setPlacing] = useState<'path' | 'hut' | 'town' | null>(null);
  const [trade, setTrade] = useState(false);
  const [give, setGive] = useState<Cards>(none());
  const [get, setGet] = useState<Cards>(none());
  const [bankGive, setBankGive] = useState<number | null>(null);
  const [discard, setDiscard] = useState<Cards>(none());
  const [picks, setPicks] = useState<number[]>([]);
  const [choosing, setChoosing] = useState<'bounty' | 'embargo' | null>(null);
  const [hint, setHint] = useState<Action | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);
  const stateRef = useLatest(state);
  const savedRef = useLatest(saved);
  const rngRef = useMemo(() => ({ rng: new Rng(randomSeed()) }), []);

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => {
      if (alive && d) {
        setSaved(d);
        setLevel(d.level);
      }
    });
    return () => {
      alive = false;
    };
  }, [slot]);

  const persist = (patch: Partial<Saved>) => {
    const n = { ...savedRef.current, ...patch };
    savedRef.current = n;
    setSaved(n);
    void slot.save(n);
  };

  const humans = mode === 'play' && level === 'humans';
  const isHuman = (p: number) => mode === 'play' && (level === 'humans' || p === 0);
  const isYou = (p: number) => mode === 'play' && level !== 'humans' && p === 0;
  const name = (p: number) => (isYou(p) ? t('you') : t(`colour.${p}`));
  const tn = (key: string, n: number) => t(n === 1 ? `${key}.one` : key, { n });
  const say = (key: string, p: number, params: { [k: string]: string | number } = {}) =>
    t(isYou(p) ? `${key}.you` : key, { who: name(p), ...params });

  const resetUi = () => {
    setPlacing(null);
    setTrade(false);
    setGive(none());
    setGet(none());
    setBankGive(null);
    setDiscard(none());
    setPicks([]);
    setChoosing(null);
    setHint(null);
  };

  const start = (g: IsleGame, m: Mode, lv: Level) => {
    resetUi();
    setState(g);
    setMode(m);
    setLevel(lv);
    setRevealed(null);
    if (m === 'play') persist({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number) =>
    start(newIsles(n, fixedSeed ?? randomSeed() >>> 0), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'strategist', 4), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: IsleGame, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    if (a.t === 'roll')
      svc.playSound(next.dice![0] + next.dice![1] === 7 ? SOUNDS.seven : SOUNDS.roll);
    else if (a.t === 'hut' || a.t === 'town' || a.t === 'path') svc.playSound(SOUNDS.build);
    else if (a.t === 'steal' || (a.t === 'storm' && next.phase.k !== 'steal'))
      svc.playSound(SOUNDS.steal);
    else if (a.t === 'bank' || (a.t === 'answer' && a.accept)) svc.playSound(SOUNDS.trade);
    else if (a.t === 'buy' || CHART_KINDS.includes(a.t as ChartKind)) svc.playSound(SOUNDS.chart);
    if (mode === 'play' && level !== 'humans') {
      if (next.trail === 0 && before.trail !== 0) svc.unlockAchievement('trail');
      if (next.fleet === 0 && before.fleet !== 0) svc.unlockAchievement('fleet');
      if (next.sites.filter((s) => s?.p === 0 && s.town).length >= 4)
        svc.unlockAchievement('towns');
    }
    if (next.phase.k === 'over' && next.winner !== null) {
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        const rec = savedRef.current.record;
        if (level !== 'humans') {
          const score = points(next, 0);
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score,
            mode: `${level}-${next.players}`,
          });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'strategist') svc.unlockAchievement('strategist-win');
          }
          persist({
            state: null,
            record: {
              played: rec.played + 1,
              won: rec.won + (won ? 1 : 0),
              best: Math.max(rec.best, score),
            },
          });
        } else persist({ state: null });
      }
    } else if (mode === 'play') persist({ state: next });
  };

  const doAction = (a: Action) => {
    const g = stateRef.current;
    if (!g || !isLegal(g, a)) return;
    resetUi();
    commit(act(g, a), a);
  };

  const g = state;
  const seat = g ? currentPlayer(g) : -1;
  const myMove = !!g && g.phase.k !== 'over' && isHuman(seat);
  const needPass = humans && myMove && revealed !== seat;
  const viewer = mode === 'watch' ? seat : humans ? (revealed ?? 0) : 0;

  // Computer seats (all of them when watching) act after a pause.
  useEffect(() => {
    if (!g || mode === 'menu' || g.phase.k === 'over' || isHuman(seat)) return;
    const style: Style =
      mode === 'watch' ? (seat % 2 === 0 ? 'strategist' : 'settler') : (level as Style);
    const delay = g.phase.k === 'roll' ? 650 : g.phase.k === 'setup' ? 500 : 520;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur) doAction(decide(cur, style, rngRef.rng));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  const legal = useMemo(
    () => (g && myMove && !needPass ? legalActions(g) : []),
    [g, myMove, needPass],
  );
  const can = (pred: (a: Action) => boolean) => legal.some(pred);

  const showHint = () => {
    if (!g || !myMove || needPass) return;
    servicesRef.current.playSound(SOUNDS.hint);
    setHint(decide(g, 'strategist', new Rng(g.round * 977 + g.log.length)));
  };

  // Board targets for the current choice.
  let targets: Targets | null = null;
  if (g && myMove && !needPass) {
    const ph = g.phase;
    const hintId = (k: 'hut' | 'path' | 'town' | 'storm') =>
      hint && hint.t === k
        ? k === 'path'
          ? (hint as { e: number }).e
          : k === 'storm'
            ? (hint as { h: number }).h
            : (hint as { v: number }).v
        : null;
    const ids = (k: 'hut' | 'path' | 'town' | 'storm') =>
      legal
        .filter((a) => a.t === k)
        .map((a) =>
          k === 'path'
            ? (a as { e: number }).e
            : k === 'storm'
              ? (a as { h: number }).h
              : (a as { v: number }).v,
        );
    if (ph.k === 'setup')
      targets =
        ph.hut === null
          ? { kind: 'corner', ids: ids('hut'), hint: hintId('hut') }
          : { kind: 'edge', ids: ids('path'), hint: hintId('path') };
    else if (ph.k === 'roadworks')
      targets = { kind: 'edge', ids: ids('path'), hint: hintId('path') };
    else if (ph.k === 'storm') targets = { kind: 'hex', ids: ids('storm'), hint: hintId('storm') };
    else if (ph.k === 'main' && placing)
      targets = {
        kind: placing === 'path' ? 'edge' : 'corner',
        ids: ids(placing),
        hint: hintId(placing),
      };
  }
  const onPick = (id: number) => {
    if (!g || !targets) return;
    const ph = g.phase;
    if (ph.k === 'storm') return doAction({ t: 'storm', h: id });
    if (targets.kind === 'edge') return doAction({ t: 'path', e: id });
    if (ph.k === 'setup' || placing === 'hut') return doAction({ t: 'hut', v: id });
    if (placing === 'town') return doAction({ t: 'town', v: id });
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myMove || needPass) return false;
    const k = e.key.toLowerCase();
    if (k === 'r' && g.phase.k === 'roll') doAction({ t: 'roll' });
    else if (k === 'e' && g.phase.k === 'main') doAction({ t: 'end' });
    else if (k === 'h') showHint();
    else if (k === 'escape' && (placing || trade || choosing)) resetUi();
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase.k !== 'over') persist({ state: cur, level });
    setMode('menu');
    setState(null);
    resetUi();
  };

  if (mode === 'menu' || !g)
    return (
      <Menu
        t={t}
        saved={saved}
        level={level}
        count={count}
        setLevel={setLevel}
        setCount={setCount}
        onStart={() => fresh('play', level, count)}
        onWatch={() => fresh('watch', 'strategist', 4)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const ph = g.phase;
  const me = g.hands[viewer]!;
  const showHand = !needPass && (mode === 'watch' || isHuman(viewer));
  const left = piecesLeft(g, viewer);
  const sum = g.dice ? g.dice[0] + g.dice[1] : null;

  let prompt: string;
  if (ph.k === 'over') prompt = say('prompt.over', g.winner!, { n: points(g, g.winner!) });
  else if (ph.k === 'setup')
    prompt = t(ph.hut === null ? 'prompt.setupHut' : 'prompt.setupPath', { who: name(seat) });
  else if (ph.k === 'roll')
    prompt =
      isYou(seat) || (humans && myMove)
        ? t('prompt.roll.you')
        : t('prompt.roll', { who: name(seat) });
  else if (ph.k === 'discard') prompt = t('prompt.discard', { who: name(seat), n: ph.owed[seat]! });
  else if (ph.k === 'storm') prompt = t('prompt.storm', { who: name(seat) });
  else if (ph.k === 'steal') prompt = t('prompt.steal', { who: name(seat) });
  else if (ph.k === 'roadworks') prompt = t('prompt.roadworks', { who: name(seat), n: ph.left });
  else if (ph.k === 'offer')
    prompt = t(isYou(ph.to) ? 'prompt.offer.you' : 'prompt.offer', {
      from: name(ph.from),
      to: name(ph.to),
      give: cardsText(t, ph.give),
      get: cardsText(t, ph.get),
    });
  else if (placing) prompt = t(`prompt.place.${placing}`);
  else prompt = myMove ? t('prompt.main.you') : t('prompt.main', { who: name(seat) });

  const buildable = (b: Build) => {
    if (!myMove || ph.k !== 'main') return false;
    if (b === 'chart') return can((a) => a.t === 'buy');
    return can((a) => a.t === b);
  };
  const playable = (c: ChartKind) =>
    myMove &&
    (c === 'captain'
      ? can((a) => a.t === 'captain')
      : c === 'roadworks'
        ? can((a) => a.t === 'roadworks')
        : c === 'bounty'
          ? can((a) => a.t === 'bounty')
          : c === 'embargo'
            ? can((a) => a.t === 'embargo')
            : false);
  const playChart = (c: ChartKind) => {
    if (c === 'captain') doAction({ t: 'captain' });
    else if (c === 'roadworks') doAction({ t: 'roadworks' });
    else if (c === 'bounty' || c === 'embargo') {
      setPicks([]);
      setChoosing(c);
    }
  };
  const describe = (a: Action): string => {
    switch (a.t) {
      case 'hut':
      case 'path':
      case 'town':
        return t(`build.${a.t}`);
      case 'buy':
        return t('build.chart');
      case 'roll':
        return t('btn.roll');
      case 'end':
        return t('btn.end');
      case 'bank':
        return `${t('btn.bank')}: ${rate(g, seat, a.give)} ${t(`res.${a.give}`)} → 1 ${t(`res.${a.get}`)}`;
      case 'discard':
        return `${t('btn.discard')}: ${cardsText(t, a.cards)}`;
      case 'steal':
        return `${t('btn.take')}: ${name(a.p)}`;
      case 'storm':
        return t('storm');
      case 'offer':
        return `${t('btn.offer')} ${name(a.to)}: ${cardsText(t, a.give)} → ${cardsText(t, a.get)}`;
      case 'answer':
        return t(a.accept ? 'btn.accept' : 'btn.decline');
      case 'bounty':
      case 'embargo':
      case 'captain':
      case 'roadworks':
        return t(`chart.${a.t}`);
    }
  };

  const charts = [
    ...me.charts.map((c) => ({ c, fresh: false })),
    ...me.fresh.map((c) => ({ c, fresh: true })),
  ];
  const bankOk = (r: number, r2: number) =>
    myMove && ph.k === 'main' && can((a) => a.t === 'bank' && a.give === r && a.get === r2);
  const offerReady = (to: number) => offerOk(g, to, give, get);

  return (
    <div className={styles.table} data-still={services.reducedMotion} data-testid="hi-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="hi-prompt">
          {prompt}
        </p>
        <div
          className={styles.dice}
          data-testid="hi-dice"
          aria-label={g.dice ? t('dice', { a: g.dice[0], b: g.dice[1] }) : undefined}
        >
          {g.dice ? (
            <>
              <span className={styles.die}>{g.dice[0]}</span>
              <span className={styles.die}>{g.dice[1]}</span>
              <b data-seven={sum === 7}>{sum}</b>
            </>
          ) : (
            <Dices size={22} aria-hidden />
          )}
        </div>
      </div>
      <div className={styles.layout}>
        <div className={styles.boardWrap}>
          <IslesBoard g={g} t={t} targets={targets} onPick={onPick} />
        </div>
        <div className={styles.side}>
          <ol className={styles.players} data-testid="hi-players">
            {g.hands.map((h, p) => (
              <li
                key={p}
                className={styles.player}
                data-current={p === seat}
                style={{ ['--pc' as string]: `var(--player-${p + 1})` }}
                data-testid={`hi-player-${p}`}
              >
                <span className={styles.swatch} aria-hidden />
                <strong>{name(p)}</strong>
                <span className={styles.pts}>
                  {t('table.points', {
                    n: points(g, p, ph.k === 'over' || (showHand && p === viewer)),
                  })}
                </span>
                <small>
                  {tn('table.cards', total(h.hand))} ·{' '}
                  {tn('table.charts', h.charts.length + h.fresh.length)} ·{' '}
                  {t('table.trail', { n: trailLength(g, p) })}
                  {h.captains > 0 && <> · {tn('table.captains', h.captains)}</>}
                </small>
                <span className={styles.awards}>
                  {g.trail === p && <em>{t('award.trail')}</em>}
                  {g.fleet === p && <em>{t('award.fleet')}</em>}
                </span>
              </li>
            ))}
          </ol>

          {needPass ? (
            <div className={styles.pass} data-testid="hi-pass">
              <h3>{t('pass.title', { who: name(seat) })}</h3>
              <p className="muted">{t('pass.body')}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setRevealed(seat)}
                data-testid="hi-pass-go"
              >
                {t('btn.next')}
              </button>
            </div>
          ) : (
            <>
              {showHand && (
                <section className={styles.panel} data-testid="hi-hand">
                  <h3>
                    {t('panel.hand')}
                    {mode === 'watch' || humans ? ` · ${name(viewer)}` : ''}
                  </h3>
                  <div className={styles.cards}>
                    {RESOURCES.map((_, r) => (
                      <span
                        key={r}
                        className={styles.card}
                        data-res={r}
                        data-testid={`hi-res-${r}`}
                      >
                        <i aria-hidden />
                        <span>{t(`Res.${r}`)}</span>
                        <b>{me.hand[r]}</b>
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {ph.k === 'over' ? (
                <section className={styles.panel} data-testid="hi-over">
                  <h3>
                    <Trophy size={16} />{' '}
                    {say('prompt.over', g.winner!, { n: points(g, g.winner!) })}
                  </h3>
                  <ol className={styles.final}>
                    {g.hands
                      .map((_, p) => p)
                      .sort((a, b) => points(g, b) - points(g, a))
                      .map((p) => (
                        <li key={p}>
                          {name(p)} — {points(g, p)}
                        </li>
                      ))}
                  </ol>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => fresh(mode, level, g.players)}
                      data-testid="hi-again"
                    >
                      <Play size={16} /> {t('btn.again')}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={toMenu}
                      data-testid="hi-menu-btn"
                    >
                      {t('btn.menu')}
                    </button>
                  </div>
                </section>
              ) : (
                myMove && (
                  <>
                    {ph.k === 'roll' && (
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => doAction({ t: 'roll' })}
                          data-testid="hi-roll"
                        >
                          <Dices size={16} /> {t('btn.roll')}
                        </button>
                        {can((a) => a.t === 'captain') && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => doAction({ t: 'captain' })}
                            data-testid="hi-captain-first"
                          >
                            {t('chart.captain')}
                          </button>
                        )}
                      </div>
                    )}

                    {ph.k === 'discard' && (
                      <DiscardPanel
                        t={t}
                        hand={me.hand}
                        owed={ph.owed[seat]!}
                        value={discard}
                        onChange={setDiscard}
                        onDone={() => doAction({ t: 'discard', cards: discard })}
                      />
                    )}

                    {ph.k === 'steal' && (
                      <section className={styles.panel} data-testid="hi-steal">
                        <div className={styles.actions}>
                          {ph.from.map((q) => (
                            <button
                              key={q}
                              type="button"
                              className="btn"
                              onClick={() => doAction({ t: 'steal', p: q })}
                              data-testid={`hi-steal-${q}`}
                            >
                              {t('btn.take')}: {name(q)} ({total(g.hands[q]!.hand)})
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {ph.k === 'offer' && (
                      <section className={styles.panel} data-testid="hi-offer">
                        <p>
                          {t(isYou(ph.to) ? 'prompt.offer.you' : 'prompt.offer', {
                            from: name(ph.from),
                            to: name(ph.to),
                            give: cardsText(t, ph.give),
                            get: cardsText(t, ph.get),
                          })}
                        </p>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={!covers(me.hand, ph.get)}
                            onClick={() => doAction({ t: 'answer', accept: true })}
                            data-testid="hi-accept"
                          >
                            {t('btn.accept')}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => doAction({ t: 'answer', accept: false })}
                            data-testid="hi-decline"
                          >
                            {t('btn.decline')}
                          </button>
                        </div>
                      </section>
                    )}

                    {ph.k === 'main' && (
                      <>
                        <section className={styles.panel}>
                          <h3>{t('panel.build')}</h3>
                          <div className={styles.builds}>
                            {(['path', 'hut', 'town', 'chart'] as Build[]).map((b) => (
                              <button
                                key={b}
                                type="button"
                                className={styles.build}
                                aria-pressed={placing === b}
                                disabled={!buildable(b)}
                                onClick={() => {
                                  if (b === 'chart') return doAction({ t: 'buy' });
                                  setTrade(false);
                                  setPlacing(placing === b ? null : b);
                                }}
                                data-testid={`hi-build-${b}`}
                              >
                                <strong>{t(`build.${b}`)}</strong>
                                <small>{t(`build.${b}.hint`)}</small>
                                {b !== 'chart' && <em>{left[b as 'path' | 'hut' | 'town']}</em>}
                              </button>
                            ))}
                          </div>
                        </section>
                        {charts.length > 0 && (
                          <section className={styles.panel} data-testid="hi-charts">
                            <h3>{t('panel.charts')}</h3>
                            <ul className={styles.charts}>
                              {charts.map(({ c, fresh: isNew }, i) => (
                                <li key={i}>
                                  <span>
                                    <strong>{t(`chart.${c}`)}</strong>
                                    {isNew && <em> · {t('chart.new')}</em>}
                                    <small>{t(`chart.${c}.hint`)}</small>
                                  </span>
                                  {c !== 'relic' && !isNew && (
                                    <button
                                      type="button"
                                      className="btn"
                                      disabled={!playable(c)}
                                      onClick={() => playChart(c)}
                                      data-testid={`hi-play-${c}`}
                                    >
                                      {t('btn.play')}
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                        {choosing && (
                          <ChoosePanel
                            t={t}
                            kind={choosing}
                            picks={picks}
                            setPicks={setPicks}
                            ok={(rs) =>
                              choosing === 'embargo'
                                ? isLegal(g, { t: 'embargo', r: rs[0]! })
                                : isLegal(g, {
                                    t: 'bounty',
                                    r: Math.min(rs[0]!, rs[1]!),
                                    r2: Math.max(rs[0]!, rs[1]!),
                                  })
                            }
                            onDone={(rs) =>
                              choosing === 'embargo'
                                ? doAction({ t: 'embargo', r: rs[0]! })
                                : doAction({
                                    t: 'bounty',
                                    r: Math.min(rs[0]!, rs[1]!),
                                    r2: Math.max(rs[0]!, rs[1]!),
                                  })
                            }
                            onCancel={() => setChoosing(null)}
                          />
                        )}
                        <section className={styles.panel}>
                          <button
                            type="button"
                            className={styles.disclose}
                            aria-expanded={trade}
                            onClick={() => {
                              setPlacing(null);
                              setTrade(!trade);
                            }}
                            data-testid="hi-trade"
                          >
                            {t('panel.trade')}
                          </button>
                          {trade && (
                            <div className={styles.trade}>
                              <h4>{t('btn.bank')}</h4>
                              <div className={styles.bank} data-testid="hi-bank">
                                {RESOURCES.map((_, r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    className={styles.chip}
                                    aria-pressed={bankGive === r}
                                    disabled={me.hand[r]! < rate(g, seat, r)}
                                    onClick={() => setBankGive(bankGive === r ? null : r)}
                                    data-res={r}
                                    data-testid={`hi-give-${r}`}
                                  >
                                    {rate(g, seat, r)} {t(`res.${r}`)}
                                  </button>
                                ))}
                              </div>
                              {bankGive !== null && (
                                <div className={styles.bank}>
                                  <span>→</span>
                                  {RESOURCES.map((_, r) =>
                                    r === bankGive ? null : (
                                      <button
                                        key={r}
                                        type="button"
                                        className={styles.chip}
                                        disabled={!bankOk(bankGive, r)}
                                        onClick={() =>
                                          doAction({ t: 'bank', give: bankGive, get: r })
                                        }
                                        data-res={r}
                                        data-testid={`hi-get-${r}`}
                                      >
                                        1 {t(`res.${r}`)}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                              <h4>{t('btn.offer')}</h4>
                              <p className={styles.small}>
                                {t('trade.left', { n: MAX_OFFERS - g.offers })}
                              </p>
                              <Bundle
                                t={t}
                                label={t('trade.give')}
                                value={give}
                                max={me.hand}
                                onChange={setGive}
                                id="og"
                              />
                              <Bundle
                                t={t}
                                label={t('trade.get')}
                                value={get}
                                max={[9, 9, 9, 9, 9]}
                                onChange={setGet}
                                id="ow"
                              />
                              <div className={styles.actions}>
                                {g.hands.map((_, q) =>
                                  q === seat ? null : (
                                    <button
                                      key={q}
                                      type="button"
                                      className="btn"
                                      disabled={!offerReady(q)}
                                      onClick={() => doAction({ t: 'offer', to: q, give, get })}
                                      data-testid={`hi-offer-${q}`}
                                    >
                                      {t('btn.offer')} → {name(q)}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </section>
                        <div className={styles.actions}>
                          {placing && (
                            <button
                              type="button"
                              className="btn"
                              onClick={() => setPlacing(null)}
                              data-testid="hi-cancel"
                            >
                              {t('btn.cancel')}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => doAction({ t: 'end' })}
                            data-testid="hi-end"
                          >
                            {t('btn.end')}
                          </button>
                        </div>
                      </>
                    )}
                    {ph.k !== 'discard' && (
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="btn"
                          onClick={showHint}
                          data-testid="hi-hint"
                        >
                          <Lightbulb size={16} /> {t('btn.hint')}
                        </button>
                        {hint && (
                          <span className={styles.small} data-testid="hi-hint-text">
                            {t('hint.say', { move: describe(hint) })}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )
              )}
            </>
          )}

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="hi-log">
              {g.log
                .slice(-8)
                .reverse()
                .map((e, i) => (
                  <li key={g.log.length - i}>{logLine(e)}</li>
                ))}
            </ol>
          </section>
          <p className={styles.small}>{t('keys')}</p>
          {ph.k !== 'over' && (
            <div className={styles.actions}>
              <button type="button" className="btn" onClick={toMenu} data-testid="hi-to-menu">
                {t('btn.menu')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function logLine(e: LogEntry): string {
    switch (e.k) {
      case 'roll': {
        const gains = e.gains
          .map((c, p) => (total(c) ? say('log.gain', p, { cards: cardsText(t, c) }) : ''))
          .filter(Boolean)
          .join(' · ');
        return `${say('log.roll', e.p, { sum: e.dice[0] + e.dice[1] })}${gains ? ` ${gains}` : ''}`;
      }
      case 'build':
        return say(`log.build.${e.what}`, e.p);
      case 'chart':
        return say('log.chart', e.p);
      case 'play':
        return say('log.play', e.p, { chart: t(`chart.${e.c}`) });
      case 'storm':
        return say('log.storm', e.p);
      case 'steal':
        return say('log.steal', e.p, { from: name(e.from) });
      case 'discard':
        return say('log.discard', e.p, { n: e.n });
      case 'bank':
        return say('log.bank', e.p, { n: e.n, give: t(`res.${e.give}`), get: t(`res.${e.get}`) });
      case 'offer':
        return t(e.ok ? 'log.offer.ok' : isYou(e.to) ? 'log.offer.no.you' : 'log.offer.no', {
          who: name(e.p),
          to: name(e.to),
          give: cardsText(t, e.give),
          get: cardsText(t, e.get),
        });
      case 'award':
        return e.p === null ? t('log.award.none') : t(`log.award.${e.what}`, { who: name(e.p) });
      case 'win':
        return t('log.win', { who: name(e.p) });
    }
  }
}

function Bundle({
  t,
  label,
  value,
  max,
  onChange,
  id,
}: {
  t: Translator;
  label: string;
  value: Cards;
  max: readonly number[];
  onChange: (c: Cards) => void;
  id: string;
}) {
  const set = (r: number, d: number) => {
    const n = [...value] as Cards;
    n[r] = Math.max(0, Math.min(max[r]!, n[r]! + d));
    onChange(n);
  };
  return (
    <div className={styles.bundle}>
      {label && <span className={styles.bundleLabel}>{label}</span>}
      {RESOURCES.map((_, r) => (
        <span key={r} className={styles.stepper} data-res={r}>
          <small>{t(`Res.${r}`)}</small>
          <button
            type="button"
            aria-label={`− ${t(`res.${r}`)}`}
            onClick={() => set(r, -1)}
            data-testid={`hi-${id}-minus-${r}`}
          >
            <Minus size={12} />
          </button>
          <b title={t(`Res.${r}`)}>{value[r]}</b>
          <button
            type="button"
            aria-label={`+ ${t(`res.${r}`)}`}
            onClick={() => set(r, 1)}
            data-testid={`hi-${id}-plus-${r}`}
          >
            <Plus size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

function DiscardPanel({
  t,
  hand,
  owed,
  value,
  onChange,
  onDone,
}: {
  t: Translator;
  hand: Cards;
  owed: number;
  value: Cards;
  onChange: (c: Cards) => void;
  onDone: () => void;
}) {
  const k = total(value);
  return (
    <section className={styles.panel} data-testid="hi-discard">
      <p>{t('discard.pick', { n: owed, k })}</p>
      <Bundle
        t={t}
        label=""
        value={value}
        max={hand.map((x) => x)}
        onChange={(c) => total(c) <= owed && onChange(c)}
        id="dis"
      />
      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={k !== owed}
          onClick={onDone}
          data-testid="hi-discard-go"
        >
          {t('btn.discard')}
        </button>
      </div>
    </section>
  );
}

function ChoosePanel({
  t,
  kind,
  picks,
  setPicks,
  ok,
  onDone,
  onCancel,
}: {
  t: Translator;
  kind: 'bounty' | 'embargo';
  picks: number[];
  setPicks: (p: number[]) => void;
  ok: (rs: number[]) => boolean;
  onDone: (rs: number[]) => void;
  onCancel: () => void;
}) {
  const need = kind === 'bounty' ? 2 : 1;
  return (
    <section className={styles.panel} data-testid={`hi-choose-${kind}`}>
      <p>{t(kind === 'bounty' ? 'bounty.pick' : 'embargo.pick')}</p>
      <div className={styles.bank}>
        {RESOURCES.map((_, r) => (
          <button
            key={r}
            type="button"
            className={styles.chip}
            data-res={r}
            onClick={() => setPicks(picks.length >= need ? [r] : [...picks, r])}
            data-testid={`hi-pick-${r}`}
          >
            {t(`Res.${r}`)}
            {picks.filter((x) => x === r).length > 0 && ` ×${picks.filter((x) => x === r).length}`}
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={picks.length !== need || !ok(picks)}
          onClick={() => onDone(picks)}
          data-testid="hi-choose-go"
        >
          {t(kind === 'bounty' ? 'btn.take' : 'btn.claim')}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          {t('btn.cancel')}
        </button>
      </div>
    </section>
  );
}

function Menu({
  t,
  saved,
  level,
  count,
  setLevel,
  setCount,
  onStart,
  onWatch,
  onResume,
}: {
  t: Translator;
  saved: Saved;
  level: Level;
  count: number;
  setLevel: (l: Level) => void;
  setCount: (n: number) => void;
  onStart: () => void;
  onWatch: () => void;
  onResume: () => void;
}) {
  const r = saved.record;
  return (
    <div className={shared.menu} data-testid="hi-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="hi-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', { n: saved.state.players, r: saved.state.round + 1 })}
              </small>
            </span>
          </button>
        )}
        <fieldset className={shared.group}>
          <legend>{t('menu.players')}</legend>
          <div className={shared.segmented}>
            {[3, 4].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                data-testid={`hi-count-${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className={shared.group}>
          <legend>{t('menu.level')}</legend>
          <div className={shared.segmented}>
            {LEVELS.map((lv) => (
              <button
                key={lv}
                type="button"
                aria-pressed={level === lv}
                onClick={() => setLevel(lv)}
                data-testid={`hi-level-${lv}`}
              >
                {t(`level.${lv}`)}
              </button>
            ))}
          </div>
          <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
        </fieldset>
        <div className={shared.menuActions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStart}
            data-testid="hi-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="hi-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="hi-record">
          <div>
            <dt>{t('record.played')}</dt>
            <dd>{r.played}</dd>
          </div>
          <div>
            <dt>{t('record.won')}</dt>
            <dd>{r.won}</dd>
          </div>
          <div>
            <dt>{t('record.best')}</dt>
            <dd>{r.best}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
