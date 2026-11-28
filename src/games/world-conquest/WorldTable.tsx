/**
 * The World Conquest table: a menu (players, opponents or all human, new game, resume, watch the
 * AI, record), the map, the phase prompt, the dice of the last battle, the empires, landmasses and
 * cards, and the controls of each phase — placing (one, five or all armies a click), card sets,
 * attacks (dice count, or attack until it falls), the advance after a conquest, the one fortifying
 * move, hints and the log. Computer seats act after short pauses; an all-human game shows a
 * hand-off screen before each player's turn.
 */
import { Bot, Dices, Lightbulb, Minus, Play, Plus, RotateCcw, Swords, Trophy } from 'lucide-react';
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
  cardKind,
  cardTerritory,
  income,
  isLegal,
  isValidWar,
  newWar,
  owned,
  regionsHeld,
  SETUP_BATCH,
  setsIn,
  setValue,
  type Action,
  type LogEntry,
  type WarGame,
} from './engine';
import { MAP } from './map';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import { WorldBoard } from './WorldBoard';
import styles from './WorldConquest.module.css';

type Level = 'general' | 'marshal' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['general', 'marshal', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: WarGame | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidWar(s.state)) &&
    typeof s.record?.played === 'number'
  );
};

export function WorldTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('marshal');
  const [count, setCount] = useState(3);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'marshal', record: EMPTY });
  const [state, setState] = useState<WarGame | null>(null);
  const [pick, setPick] = useState<{ key: string; id: number } | null>(null);
  const [amount, setAmount] = useState<1 | 5 | 0>(1);
  const [dice, setDice] = useState(3);
  const [move, setMove] = useState(1);
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
  const say = (key: string, p: number, params: { [k: string]: string | number } = {}) =>
    t(isYou(p) ? `${key}.you` : key, { who: name(p), ...params });
  const tname = (i: number) => MAP.territories[i]!.name[locale];

  const start = (g: WarGame, m: Mode, lv: Level) => {
    setState(g);
    stateRef.current = g;
    setMode(m);
    setLevel(lv);
    setPick(null);
    setHint(null);
    setRevealed(null);
    if (m === 'play') persist({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number) =>
    start(newWar(n, fixedSeed ?? randomSeed() >>> 0), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'marshal', 4), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: WarGame, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    if (a.t === 'attack') {
      const won = next.owner[a.to] === before.turn;
      svc.playSound(won ? SOUNDS.conquer : SOUNDS.battle);
    } else if (a.t === 'trade') svc.playSound(SOUNDS.trade);
    else if (a.t === 'place' && mode === 'play' && isHuman(before.turn))
      svc.playSound(SOUNDS.place);
    else if (a.t === 'fortify') svc.playSound(SOUNDS.move);
    if (next.phase.k === 'advance') setMove(next.phase.max);
    if (mode === 'play' && level !== 'humans') {
      if (regionsHeld(next, 0).length > regionsHeld(before, 0).length)
        svc.unlockAchievement('landmass');
      if (next.alive.some((al, p) => !al && before.alive[p] && p !== 0) && before.turn === 0)
        svc.unlockAchievement('knockout');
    }
    if (next.phase.k === 'over' && next.winner !== null) {
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        if (level !== 'humans') {
          const score = owned(next, 0).length;
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score,
            mode: `${level}-${next.players}`,
          });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'marshal') svc.unlockAchievement('marshal-win');
            if (next.players >= 4) svc.unlockAchievement('crowded');
          }
          const rec = savedRef.current.record;
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
    if (!g || !isLegal(g, a)) return false;
    commit(act(g, a), a);
    return true;
  };

  const g = state;
  const seat = g && g.phase.k !== 'over' ? g.turn : -1;
  const myMove = !!g && seat >= 0 && isHuman(seat);
  const needPass = humans && myMove && revealed !== seat;
  const viewer = mode === 'watch' ? seat : humans ? (revealed ?? 0) : 0;
  // A selection belongs to one phase of one turn.
  const phaseKey = g ? `${g.turn}:${g.round}:${g.phase.k}` : '';
  const selected = pick && pick.key === phaseKey ? pick.id : null;
  const setSelected = (id: number | null) => setPick(id === null ? null : { key: phaseKey, id });

  // Computer seats act after a pause (placements quickly, battles a little slower).
  useEffect(() => {
    if (!g || mode === 'menu' || g.phase.k === 'over' || isHuman(seat)) return;
    const style: Style =
      mode === 'watch' ? (seat % 2 === 0 ? 'marshal' : 'general') : (level as Style);
    const k = g.phase.k;
    const delay = k === 'setup' || k === 'reinforce' ? 90 : k === 'attack' ? 380 : 260;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur) doAction(decide(cur, style, rngRef.rng));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  const showHint = () => {
    if (!g || !myMove || needPass) return;
    servicesRef.current.playSound(SOUNDS.hint);
    setHint(decide(g, 'marshal', new Rng(g.round * 131 + g.log.length)));
  };

  /** Places armies on territory i: one, five or all that are left. */
  const place = (i: number) => {
    const cur = stateRef.current;
    if (!cur) return;
    const ph = cur.phase;
    const left =
      ph.k === 'setup'
        ? Math.min(cur.pool[cur.turn]!, SETUP_BATCH - ph.placed)
        : ph.k === 'reinforce'
          ? ph.left
          : 0;
    const n = amount === 0 ? left : Math.min(amount, left);
    const a: Action = { t: 'place', at: i };
    let s = cur;
    for (let k = 0; k < Math.max(1, n); k++) {
      if (!isLegal(s, a) || s.turn !== cur.turn || s.phase.k !== ph.k) break;
      s = act(s, a);
    }
    if (s !== cur) commit(s, a);
  };

  /** One attack, or repeated attacks until the territory falls or the attacker cannot go on. */
  const attack = (from: number, to: number, blitz: boolean) => {
    const cur = stateRef.current;
    if (!cur) return;
    let s = cur;
    let a: Action;
    do {
      a = {
        t: 'attack',
        from,
        to,
        dice: blitz ? Math.min(3, s.armies[from]! - 1) : Math.min(dice, s.armies[from]! - 1),
      };
      if (!isLegal(s, a)) break;
      s = act(s, a);
    } while (blitz && s.phase.k === 'attack' && s.owner[to] !== cur.turn && s.armies[from]! > 1);
    if (s !== cur) commit(s, a);
  };

  const onPick = (i: number) => {
    const cur = stateRef.current;
    if (!cur || !myMove) return;
    const ph = cur.phase;
    if (ph.k === 'setup' || ph.k === 'reinforce') return place(i);
    if (ph.k === 'attack') {
      if (cur.owner[i] === cur.turn) return setSelected(selected === i ? null : i);
      if (selected !== null) attack(selected, i, false);
      return;
    }
    if (ph.k === 'fortify') {
      if (selected === null) {
        setSelected(i);
        setMove(cur.armies[i]! - 1);
      } else if (i === selected) setSelected(null);
      else
        doAction({
          t: 'fortify',
          from: selected,
          to: i,
          n: Math.min(move, cur.armies[selected]! - 1),
        });
    }
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myMove || needPass) return false;
    const k = e.key.toLowerCase();
    if (k === 'e' && g.phase.k === 'attack') doAction({ t: 'endAttack' });
    else if (k === 'e' && g.phase.k === 'fortify') doAction({ t: 'end' });
    else if (k === 'h') showHint();
    else if (k === 'escape' && selected !== null) setSelected(null);
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase.k !== 'over') persist({ state: cur, level });
    setMode('menu');
    setState(null);
    setPick(null);
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
        onWatch={() => fresh('watch', 'marshal', 4)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const ph = g.phase;
  const p = seat;
  // Which territories can be clicked now.
  const targets = new Set<number>();
  if (myMove && !needPass) {
    const mine = owned(g, p);
    if (
      ph.k === 'setup' ||
      (ph.k === 'reinforce' &&
        ph.left > 0 &&
        !(g.hands[p]!.length >= 5 && setsIn(g.hands[p]!).length))
    )
      mine.forEach((i) => targets.add(i));
    else if (ph.k === 'attack') {
      if (selected !== null)
        MAP.territories[selected]!.adj.forEach((j) => g.owner[j] !== p && targets.add(j));
      mine
        .filter((i) => g.armies[i]! > 1 && MAP.territories[i]!.adj.some((j) => g.owner[j] !== p))
        .forEach((i) => targets.add(i));
    } else if (ph.k === 'fortify') {
      if (selected !== null)
        MAP.territories[selected]!.adj.forEach((j) => g.owner[j] === p && targets.add(j));
      else
        mine
          .filter((i) => g.armies[i]! > 1 && MAP.territories[i]!.adj.some((j) => g.owner[j] === p))
          .forEach((i) => targets.add(i));
    }
  }
  const hintTo =
    hint &&
    (hint.t === 'place'
      ? hint.at
      : hint.t === 'attack'
        ? hint.to
        : hint.t === 'fortify'
          ? hint.to
          : null);

  let prompt: string;
  if (ph.k === 'over') {
    const w = g.winner!;
    prompt = g.owner.every((o) => o === w)
      ? say('phase.over', w)
      : t('phase.over.limit', { who: name(w) });
  } else if (!myMove || needPass)
    prompt = t(`phase.${ph.k === 'advance' ? 'attack' : ph.k}.cpu`, { who: name(p) });
  else if (ph.k === 'setup')
    prompt = t('phase.setup', {
      n: Math.min(g.pool[p]!, SETUP_BATCH - ph.placed),
      left: g.pool[p]!,
    });
  else if (ph.k === 'reinforce')
    prompt =
      g.hands[p]!.length >= 5 && setsIn(g.hands[p]!).length
        ? t('phase.reinforce.trade')
        : t('phase.reinforce', { n: ph.left });
  else if (ph.k === 'attack')
    prompt =
      selected !== null ? t('phase.attack.from', { from: tname(selected) }) : t('phase.attack');
  else if (ph.k === 'advance') prompt = t('phase.advance', { to: tname(ph.to) });
  else
    prompt =
      selected !== null ? t('phase.fortify.from', { from: tname(selected) }) : t('phase.fortify');

  const describe = (a: Action): string => {
    switch (a.t) {
      case 'place':
        return t('hint.place', { t: tname(a.at) });
      case 'attack':
        return t('hint.attack', { from: tname(a.from), to: tname(a.to) });
      case 'trade':
        return t('hint.trade');
      case 'advance':
        return t('hint.advance', { n: a.n });
      case 'fortify':
        return t('hint.fortify', { n: a.n, from: tname(a.from), to: tname(a.to) });
      case 'endAttack':
        return t('hint.endAttack');
      case 'end':
        return t('hint.end');
    }
  };

  const hand = g.hands[viewer] ?? [];
  const showCards = !needPass && (mode === 'watch' || isHuman(viewer));
  const sets = myMove && ph.k === 'reinforce' ? setsIn(g.hands[p]!) : [];

  return (
    <div className={styles.table} data-still={services.reducedMotion} data-testid="wc-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="wc-prompt">
          {prompt}
        </p>
        <div className={styles.dice} data-testid="wc-dice">
          {g.dice ? (
            <>
              {g.dice.a.map((d, i) => (
                <span key={`a${i}`} className={styles.die} data-side="a">
                  {d}
                </span>
              ))}
              <Swords size={16} aria-hidden />
              {g.dice.d.map((d, i) => (
                <span key={`d${i}`} className={styles.die} data-side="d">
                  {d}
                </span>
              ))}
            </>
          ) : (
            <Dices size={22} aria-hidden />
          )}
        </div>
      </div>
      <div className={styles.layout}>
        <div className={styles.mapWrap}>
          <WorldBoard
            g={g}
            t={t}
            locale={locale}
            name={name}
            targets={targets}
            selected={selected ?? hintTo ?? null}
            onPick={onPick}
          />
        </div>
        <div className={styles.side}>
          {needPass ? (
            <div className={styles.pass} data-testid="wc-pass">
              <h3>{t('pass.title', { who: name(p) })}</h3>
              <p className="muted">{t('pass.body')}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setRevealed(p)}
                data-testid="wc-pass-go"
              >
                {t('btn.next')}
              </button>
            </div>
          ) : ph.k === 'over' ? (
            <section className={styles.panel} data-testid="wc-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fresh(mode, level, g.players)}
                  data-testid="wc-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="wc-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            myMove && (
              <section className={styles.panel} data-testid="wc-controls">
                {(ph.k === 'setup' || ph.k === 'reinforce') && (
                  <>
                    <div className={styles.row}>
                      <span className={styles.small}>{t('opt.amount')}</span>
                      <div className={shared.segmented}>
                        {([1, 5, 0] as const).map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={amount === n}
                            onClick={() => setAmount(n)}
                            data-testid={`wc-amount-${n}`}
                          >
                            {n === 0 ? t('opt.all') : n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {ph.k === 'setup' && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          let s = stateRef.current!;
                          const rng = new Rng(s.round + s.pool[p]!);
                          while (s.phase.k === 'setup' && s.turn === p)
                            s = act(s, decide(s, 'general', rng));
                          commit(s, { t: 'place', at: 0 });
                        }}
                        data-testid="wc-auto"
                      >
                        {t('btn.auto')}
                      </button>
                    )}
                    {sets.length > 0 && (
                      <div className={styles.sets}>
                        {sets.map((s) => (
                          <button
                            key={s.join('-')}
                            type="button"
                            className="btn"
                            onClick={() => doAction({ t: 'trade', cards: s })}
                            data-testid={`wc-trade-${s.join('-')}`}
                          >
                            {s.map((c) => t(`kind.${cardKind(c)}`)).join(' · ')} —{' '}
                            {t('btn.trade', { n: setValue(g.trades) })}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {ph.k === 'attack' && (
                  <>
                    <div className={styles.row}>
                      <span className={styles.small}>{t('opt.dice')}</span>
                      <div className={shared.segmented}>
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={dice === n}
                            onClick={() => setDice(n)}
                            data-testid={`wc-dice-${n}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selected !== null && g.armies[selected]! > 1 && (
                      <div className={styles.blitz}>
                        <span className={styles.small}>{t('btn.blitz')}</span>
                        {MAP.territories[selected]!.adj.filter((j) => g.owner[j] !== p).map((j) => (
                          <button
                            key={j}
                            type="button"
                            className={styles.target}
                            style={{ ['--pc' as string]: `var(--player-${g.owner[j]! + 1})` }}
                            onClick={() => attack(selected, j, true)}
                            data-testid={`wc-blitz-${j}`}
                          >
                            <Swords size={14} aria-hidden /> {tname(j)} <b>{g.armies[j]}</b>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => doAction({ t: 'endAttack' })}
                        data-testid="wc-end-attack"
                      >
                        {t('btn.endAttack')}
                      </button>
                    </div>
                  </>
                )}
                {ph.k === 'advance' && (
                  <Stepper
                    t={t}
                    value={move}
                    min={ph.min}
                    max={ph.max}
                    onChange={setMove}
                    onGo={() => doAction({ t: 'advance', n: move })}
                    id="advance"
                  />
                )}
                {ph.k === 'fortify' && (
                  <>
                    {selected !== null && (
                      <Stepper
                        t={t}
                        value={move}
                        min={1}
                        max={g.armies[selected]! - 1}
                        onChange={setMove}
                        id="fortify"
                      />
                    )}
                    <div className={styles.actions}>
                      {selected !== null && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setSelected(null)}
                          data-testid="wc-cancel"
                        >
                          {t('btn.cancel')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => doAction({ t: 'end' })}
                        data-testid="wc-end"
                      >
                        {t('btn.end')}
                      </button>
                    </div>
                  </>
                )}
                <div className={styles.actions}>
                  <button type="button" className="btn" onClick={showHint} data-testid="wc-hint">
                    <Lightbulb size={16} /> {t('btn.hint')}
                  </button>
                  {hint && (
                    <span className={styles.small} data-testid="wc-hint-text">
                      {t('hint.say', { move: describe(hint) })}
                    </span>
                  )}
                </div>
              </section>
            )
          )}

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="wc-players">
              {g.alive.map((al, q) => {
                const terr = owned(g, q);
                return (
                  <li
                    key={q}
                    className={styles.player}
                    data-current={q === seat}
                    data-out={!al}
                    style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                    data-testid={`wc-player-${q}`}
                  >
                    <span className={styles.swatch} aria-hidden />
                    <strong>{name(q)}</strong>
                    <small>
                      {al
                        ? `${t('table.terr', { n: terr.length })} · ${t('table.armies', { n: terr.reduce((a, i) => a + g.armies[i]!, 0) })} · ${t(g.hands[q]!.length === 1 ? 'table.cards.one' : 'table.cards', { n: g.hands[q]!.length })} · ${t('table.income', { n: income(g, q) })}`
                        : t('table.out')}
                    </small>
                  </li>
                );
              })}
            </ol>
          </section>

          {showCards && (
            <section className={styles.panel} data-testid="wc-cards">
              <h3>
                {isYou(viewer) ? t('panel.cards') : t('panel.cardsOf', { who: name(viewer) })}
              </h3>
              {hand.length ? (
                <ul className={styles.cards}>
                  {hand.map((c) => (
                    <li key={c} data-kind={cardKind(c)}>
                      <strong>{t(`kind.${cardKind(c)}`)}</strong>
                      <small>{cardTerritory(c) >= 0 ? tname(cardTerritory(c)) : '★'}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.small}>{t('cards.none')}</p>
              )}
              <p className={styles.small}>{t('cards.next', { n: setValue(g.trades) })}</p>
            </section>
          )}

          <section className={styles.panel}>
            <h3>{t('panel.regions')}</h3>
            <ul className={styles.regions} data-testid="wc-regions">
              {MAP.regions.map((r, i) => {
                const holder = g.alive.findIndex((_, q) =>
                  r.members.every((m) => g.owner[m] === q),
                );
                return (
                  <li key={r.id} data-region={i}>
                    <i aria-hidden />
                    <span>{r.name[locale]}</span>
                    <b>{t('region.bonus', { n: r.bonus })}</b>
                    {holder >= 0 && (
                      <small style={{ color: `var(--player-${holder + 1})` }}>
                        {t('region.held', { who: name(holder) })}
                      </small>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="wc-log">
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
              <button type="button" className="btn" onClick={toMenu} data-testid="wc-to-menu">
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
      case 'battle':
        return say('log.battle', e.p, {
          from: tname(e.from),
          to: tname(e.to),
          a: e.a.join(' '),
          d: e.d.join(' '),
          la: e.lost[0],
          ld: e.lost[1],
          def: name(e.def),
        });
      case 'conquer':
        return say('log.conquer', e.p, { t: tname(e.t) });
      case 'out':
        return t('log.out', { who: name(e.p), by: name(e.by), n: e.cards });
      case 'trade':
        return say('log.trade', e.p, { n: e.armies });
      case 'reinforce':
        return say('log.reinforce', e.p, { n: e.armies });
      case 'fortify':
        return say('log.fortify', e.p, { n: e.n, from: tname(e.from), to: tname(e.to) });
      case 'card':
        return say('log.card', e.p);
      case 'win':
        return t('log.win', { who: name(e.p) });
    }
  }
}

function Stepper({
  t,
  value,
  min,
  max,
  onChange,
  onGo,
  id,
}: {
  t: Translator;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  onGo?: () => void;
  id: string;
}) {
  const v = Math.max(min, Math.min(max, value));
  return (
    <div className={styles.stepper} data-testid={`wc-${id}`}>
      <button
        type="button"
        aria-label="−1"
        onClick={() => onChange(Math.max(min, v - 1))}
        data-testid={`wc-${id}-minus`}
      >
        <Minus size={14} />
      </button>
      <input
        type="range"
        min={min}
        max={max}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={t('btn.move', { n: v })}
        data-testid={`wc-${id}-range`}
      />
      <button
        type="button"
        aria-label="+1"
        onClick={() => onChange(Math.min(max, v + 1))}
        data-testid={`wc-${id}-plus`}
      >
        <Plus size={14} />
      </button>
      {onGo && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGo}
          data-testid={`wc-${id}-go`}
        >
          {t('btn.move', { n: v })}
        </button>
      )}
      {!onGo && <b>{v}</b>}
    </div>
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
    <div className={shared.menu} data-testid="wc-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="wc-resume"
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
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                data-testid={`wc-count-${n}`}
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
                data-testid={`wc-level-${lv}`}
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
            data-testid="wc-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="wc-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="wc-record">
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
