/**
 * The Global Front table: a menu (your alliance, opponents or two players, new game, resume, watch
 * the AI, record), the map, the phase prompt and its button (done buying, fight, done moving, end
 * turn), a buying panel, the chosen place with its units (pick a kind and how many, then where
 * they go — or by sea), the battle with its dice, roll and retreat, placing new units, the war's
 * status (round, cities, treasuries), hints and dispatches. Computer powers act after short
 * pauses.
 */
import { Bot, Lightbulb, Minus, Play, Plus, RotateCcw, Trophy } from 'lucide-react';
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
  canMove,
  canSail,
  citiesOf,
  currentPlayer,
  income,
  isLegal,
  isValidFront,
  legalActions,
  newFront,
  placeSpots,
  type Action,
  type Front,
  type LogEntry,
} from './engine';
import styles from './GlobalFront.module.css';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import { isSea, KINDS, LOCS, MAX_ROUNDS, POWERS, sideOf, unitType, type UnitKind } from './world';
import { WorldMap } from './WorldMap';

type Level = 'colonel' | 'general' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['colonel', 'general', 'humans'];
const LOADS: UnitKind[][] = [
  ['infantry', 'infantry'],
  ['infantry', 'armor'],
  ['infantry', 'artillery'],
  ['infantry'],
  ['armor'],
  ['artillery'],
];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Front | null;
  level: Level;
  side: number;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.side === 0 || s.side === 1) &&
    (s.state === null || isValidFront(s.state)) &&
    typeof s.record?.played === 'number'
  );
};
type Pick =
  | { kind: UnitKind; from: number; n: number }
  | { sail: UnitKind[]; from: number; sea: number }
  | { place: UnitKind };

export function FrontTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('general');
  const [side, setSide] = useState(0);
  const [saved, setSaved] = useState<Saved>({
    state: null,
    level: 'general',
    side: 0,
    record: EMPTY,
  });
  const [state, setState] = useState<Front | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hint, setHint] = useState<Action | null>(null);
  const stateRef = useLatest(state);
  const savedRef = useLatest(saved);
  const rngRef = useMemo(() => ({ rng: new Rng(randomSeed()) }), []);

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => {
      if (alive && d) {
        setSaved(d);
        setLevel(d.level);
        setSide(d.side);
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

  const human = (s: number) => mode === 'play' && (level === 'humans' || s === side);
  const lname = (l: number) => LOCS[l]!.name[locale];
  const pname = (p: number) => t(`power.${p}`);

  const start = (g: Front, m: Mode, lv: Level, sd: number) => {
    setState(g);
    stateRef.current = g;
    setMode(m);
    setLevel(lv);
    setSide(sd);
    setSelected(null);
    setPick(null);
    setHint(null);
    if (m === 'play') persist({ state: g, level: lv, side: sd });
  };
  const fresh = (m: Mode, lv: Level, sd: number) =>
    start(newFront(fixedSeed ?? randomSeed() >>> 0), m, lv, sd);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'general', 0), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Front, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    if (a.t === 'roll') svc.playSound(SOUNDS.battle);
    else if (a.t === 'move' || a.t === 'sail') svc.playSound(SOUNDS.move);
    else if (a.t === 'buy' || a.t === 'place') svc.playSound(SOUNDS.buy);
    if (mode === 'play' && level !== 'humans') {
      // Places that changed hands to our alliance with this move.
      const taken = next.owner
        .map((o, l) =>
          o >= 0 && sideOf(o) === side && before.owner[l] !== o && sideOf(before.owner[l]!) !== side
            ? l
            : -1,
        )
        .filter((l) => l >= 0);
      if (taken.length) svc.unlockAchievement('first-capture');
      if (taken.some((l) => LOCS[l]!.capital)) svc.unlockAchievement('capital');
    }
    if (next.phase === 'over' && next.winner !== null) {
      if (mode === 'play') {
        const won = next.winner === side;
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        if (level !== 'humans') {
          const score = citiesOf(next, side);
          svc.recordResult({ outcome: won ? 'win' : 'loss', score, mode: `${level}-${side}` });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'general') svc.unlockAchievement('general-win');
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
  const mySide = g ? currentPlayer(g) : -1;
  const myMove = !!g && g.phase !== 'over' && human(mySide);

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase === 'over' || human(currentPlayer(g))) return;
    const style: Style =
      mode === 'watch' ? (currentPlayer(g) === 0 ? 'general' : 'colonel') : (level as Style);
    const delay = g.phase === 'battle' ? 450 : g.phase === 'buy' || g.phase === 'place' ? 60 : 160;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur && cur.phase !== 'over') doAction(decide(cur, style, rngRef.rng));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  // A new phase clears half-made choices.
  const phaseKey = g ? `${g.round}:${g.power}:${g.phase}` : '';
  const [lastKey, setLastKey] = useState(phaseKey);
  if (lastKey !== phaseKey) {
    setLastKey(phaseKey);
    setPick(null);
  }

  const showHint = () => {
    if (!g || !myMove) return;
    servicesRef.current.playSound(SOUNDS.hint);
    const a = decide(g, 'general', new Rng(g.round * 41 + g.power));
    setHint(a);
    if (a.t === 'move' || a.t === 'sail') setSelected(a.from);
  };

  // Where the current choice can go.
  const targets = new Set<number>();
  if (g && myMove && pick) {
    if ('kind' in pick) {
      const movable = g.units.filter(
        (u) => u.kind === pick.kind && u.loc === pick.from && u.owner === g.power,
      );
      for (let to = 0; to < LOCS.length; to++)
        if (movable.filter((u) => canMove(g, u, to)).length >= pick.n) targets.add(to);
    } else if ('sail' in pick) {
      for (let to = 0; to < LOCS.length; to++)
        if (canSail(g, pick.from, pick.sea, to, pick.sail)) targets.add(to);
    } else for (const l of placeSpots(g, pick.place)) targets.add(l);
  }

  const onPick = (loc: number) => {
    const cur = stateRef.current;
    if (!cur) return;
    if (pick && targets.has(loc) && myMove) {
      if ('kind' in pick)
        doAction({ t: 'move', kind: pick.kind, from: pick.from, to: loc, n: pick.n });
      else if ('sail' in pick)
        doAction({ t: 'sail', from: pick.from, sea: pick.sea, to: loc, kinds: pick.sail });
      else doAction({ t: 'place', kind: pick.place, loc });
      setPick(null);
      return;
    }
    setPick(null);
    setSelected(loc === selected ? null : loc);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myMove) return false;
    const k = e.key.toLowerCase();
    if (k === 'n' && legalActions(g).some((a) => a.t === 'next')) doAction({ t: 'next' });
    else if (k === 'r' && g.phase === 'battle') doAction({ t: 'roll' });
    else if (k === 'h') showHint();
    else if (k === 'escape' && pick) setPick(null);
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'over') persist({ state: cur, level, side });
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g)
    return (
      <Menu
        t={t}
        saved={saved}
        level={level}
        side={side}
        setLevel={setLevel}
        setSide={setSide}
        onStart={() => fresh('play', level, side)}
        onWatch={() => fresh('watch', 'general', 0)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level, saved.side)}
      />
    );

  const p = g.power;
  const spent = g.bought.reduce((a, k) => a + unitType(k).cost, 0);
  let prompt: string;
  if (g.phase === 'over')
    prompt =
      level !== 'humans' && mode === 'play' && g.winner === side
        ? t('prompt.over.you')
        : t('prompt.over', { side: t(`side.${g.winner}`) });
  else if (!myMove) prompt = t('prompt.cpu', { power: pname(p) });
  else if (pick && 'kind' in pick)
    prompt = t('prompt.pickDest', { n: pick.n, unit: t(`unit.${pick.kind}`) });
  else if (pick && 'sail' in pick) prompt = t('prompt.pickSail');
  else if (pick && 'place' in pick)
    prompt = t('prompt.pickPlace', { unit: t(`unit.${pick.place}`) });
  else if (g.phase === 'battle') prompt = t('prompt.battle', { loc: lname(g.battle!.loc) });
  else prompt = t(`prompt.${g.phase}`, { power: pname(p), n: g.treasury[p]! - spent });

  const here = selected === null ? [] : g.units.filter((u) => u.loc === selected);
  const ownHere = here.filter((u) => u.owner === p);
  const canAct = myMove && (g.phase === 'combat' || g.phase === 'move') && selected !== null;
  const kindsHere = KINDS.filter((k) =>
    ownHere.some((u) => u.kind === k && LOCS.some((_, to) => canMove(g, u, to))),
  );
  const sailOptions: { load: UnitKind[]; sea: number }[] = [];
  if (canAct && selected !== null && !isSea(selected)) {
    for (const sea of LOCS[selected]!.adj.filter(isSea))
      for (const load of LOADS)
        if (LOCS.some((_, to) => canSail(g, selected, sea, to, load))) {
          if (!sailOptions.some((o) => o.load.join() === load.join()))
            sailOptions.push({ load, sea });
        }
  }
  const nextLabel =
    g.phase === 'buy' || g.phase === 'combat' || g.phase === 'move' || g.phase === 'place'
      ? t(`btn.next.${g.phase}`)
      : '';
  const describe = (a: Action): string => {
    switch (a.t) {
      case 'buy':
        return `+ ${t(`unit.${a.kind}`)}`;
      case 'unbuy':
        return `− ${t(`unit.${a.kind}`)}`;
      case 'move':
        return `${t(`unit.${a.kind}`)}: ${lname(a.from)} → ${lname(a.to)}`;
      case 'sail':
        return `${a.kinds.map((k) => t(`unit.${k}`)).join(' + ')}: ${lname(a.from)} → ${lname(a.to)}`;
      case 'roll':
        return t('btn.roll');
      case 'retreat':
        return t('btn.retreat');
      case 'place':
        return `${t(`unit.${a.kind}`)} → ${lname(a.loc)}`;
      case 'next':
        return nextLabel;
    }
  };

  return (
    <div className={styles.table} data-testid="gf-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="gf-prompt">
          {prompt}
        </p>
        {g.phase !== 'over' && (
          <span
            className={styles.phase}
            style={{ ['--pc' as string]: `var(--player-${p + 1})` }}
            data-testid="gf-phase"
          >
            {pname(p)} · {t(`phase.${g.phase}`)}
          </span>
        )}
      </div>
      <div className={styles.layout}>
        <div className={styles.mapWrap}>
          <WorldMap
            g={g}
            t={t}
            locale={locale}
            targets={targets}
            selected={selected}
            battle={g.battle?.loc ?? null}
            onPick={onPick}
          />
        </div>
        <div className={styles.side}>
          {g.phase === 'over' ? (
            <section className={styles.panel} data-testid="gf-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fresh(mode, level, side)}
                  data-testid="gf-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="gf-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            myMove && (
              <section className={styles.panel} data-testid="gf-controls">
                {g.phase === 'buy' && (
                  <ul className={styles.buy} data-testid="gf-buy">
                    {KINDS.map((k) => {
                      const n = g.bought.filter((x) => x === k).length;
                      const u = unitType(k);
                      return (
                        <li key={k}>
                          <span>
                            <strong>{t(`unit.${k}`)}</strong>
                            <small>
                              {t('unit.stats', { c: u.cost, a: u.attack, d: u.defense, m: u.move })}
                            </small>
                          </span>
                          <button
                            type="button"
                            className={styles.step}
                            disabled={!n}
                            onClick={() => doAction({ t: 'unbuy', kind: k })}
                            aria-label={`− ${t(`unit.${k}`)}`}
                            data-testid={`gf-unbuy-${k}`}
                          >
                            <Minus size={12} />
                          </button>
                          <b>{n}</b>
                          <button
                            type="button"
                            className={styles.step}
                            disabled={!isLegal(g, { t: 'buy', kind: k })}
                            onClick={() => doAction({ t: 'buy', kind: k })}
                            aria-label={`+ ${t(`unit.${k}`)}`}
                            data-testid={`gf-buy-${k}`}
                          >
                            <Plus size={12} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {g.phase === 'battle' && g.battle && (
                  <div className={styles.battle} data-testid="gf-battle">
                    <BattleSide
                      t={t}
                      title={t('battle.att')}
                      units={g.units.filter((u) => u.loc === g.battle!.loc && u.owner === p)}
                    />
                    <BattleSide
                      t={t}
                      title={t('battle.def')}
                      units={g.units.filter(
                        (u) => u.loc === g.battle!.loc && sideOf(u.owner) !== sideOf(p),
                      )}
                    />
                    {g.battle.last && (
                      <p className={styles.small} data-testid="gf-dice">
                        {t('battle.dice', {
                          a: g.battle.last.a.join(' '),
                          d: g.battle.last.d.join(' '),
                          ah: g.battle.last.aHits,
                          dh: g.battle.last.dHits,
                        })}
                      </p>
                    )}
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => doAction({ t: 'roll' })}
                        data-testid="gf-roll"
                      >
                        {t('btn.roll')}
                      </button>
                      {isLegal(g, { t: 'retreat' }) && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => doAction({ t: 'retreat' })}
                          data-testid="gf-retreat"
                        >
                          {t('btn.retreat')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {g.phase === 'place' && g.bought.length > 0 && (
                  <div className={styles.actions} data-testid="gf-place">
                    {[...new Set(g.bought)].map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={styles.chip}
                        aria-pressed={!!pick && 'place' in pick && pick.place === k}
                        onClick={() => setPick({ place: k })}
                        data-testid={`gf-place-${k}`}
                      >
                        {t(`unit.${k}`)} ×{g.bought.filter((x) => x === k).length}
                      </button>
                    ))}
                  </div>
                )}
                <div className={styles.actions}>
                  {pick && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setPick(null)}
                      data-testid="gf-cancel"
                    >
                      {t('btn.cancel')}
                    </button>
                  )}
                  {nextLabel && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => doAction({ t: 'next' })}
                      data-testid="gf-next"
                    >
                      {nextLabel}
                    </button>
                  )}
                  <button type="button" className="btn" onClick={showHint} data-testid="gf-hint">
                    <Lightbulb size={16} /> {t('btn.hint')}
                  </button>
                </div>
                {hint && (
                  <p className={styles.small} data-testid="gf-hint-text">
                    {t('hint.say', { move: describe(hint) })}
                  </p>
                )}
              </section>
            )
          )}

          <section className={styles.panel} data-testid="gf-place-info">
            <h3>{t('panel.place')}</h3>
            {selected === null ? (
              <p className={styles.small}>{t('place.none')}</p>
            ) : (
              <>
                <p className={styles.small}>
                  <strong>{lname(selected)}</strong> ·{' '}
                  {isSea(selected)
                    ? t('place.sea')
                    : [
                        t('place.owner', { power: pname(g.owner[selected]!) }),
                        t('place.value', { n: LOCS[selected]!.value }),
                        LOCS[selected]!.city ? t('place.city') : '',
                        LOCS[selected]!.capital ? t('place.capital') : '',
                        LOCS[selected]!.factory ? t('place.factory') : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
                <ul className={styles.units} data-testid="gf-units">
                  {[...new Set(here.map((u) => u.owner))].map((o) => (
                    <li key={o} style={{ ['--pc' as string]: `var(--player-${o + 1})` }}>
                      <b>{pname(o)}</b>{' '}
                      {KINDS.filter((k) => here.some((u) => u.owner === o && u.kind === k))
                        .map(
                          (k) =>
                            `${here.filter((u) => u.owner === o && u.kind === k).length} ${t(`unit.${k}`)}`,
                        )
                        .join(', ')}
                    </li>
                  ))}
                </ul>
                {canAct && kindsHere.length > 0 && (
                  <div className={styles.movers} data-testid="gf-movers">
                    {kindsHere.map((k) => {
                      const max = ownHere.filter(
                        (u) => u.kind === k && LOCS.some((_, to) => canMove(g, u, to)),
                      ).length;
                      const n = Math.min(max, Math.max(1, counts[k] ?? max));
                      return (
                        <div key={k} className={styles.mover}>
                          <span>{t(`unit.${k}`)}</span>
                          <button
                            type="button"
                            className={styles.step}
                            onClick={() => setCounts({ ...counts, [k]: Math.max(1, n - 1) })}
                            aria-label="−1"
                            data-testid={`gf-less-${k}`}
                          >
                            <Minus size={12} />
                          </button>
                          <b>{n}</b>
                          <button
                            type="button"
                            className={styles.step}
                            onClick={() => setCounts({ ...counts, [k]: Math.min(max, n + 1) })}
                            aria-label="+1"
                            data-testid={`gf-more-${k}`}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            className={styles.chip}
                            aria-pressed={!!pick && 'kind' in pick && pick.kind === k}
                            onClick={() => setPick({ kind: k, from: selected!, n })}
                            data-testid={`gf-send-${k}`}
                          >
                            →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {canAct && sailOptions.length > 0 && (
                  <div className={styles.actions} data-testid="gf-sail">
                    {sailOptions.map((o) => (
                      <button
                        key={o.load.join('+')}
                        type="button"
                        className={styles.chip}
                        onClick={() => setPick({ sail: o.load, from: selected!, sea: o.sea })}
                        data-testid={`gf-sail-${o.load.join('+')}`}
                      >
                        {t('btn.sail', { load: o.load.map((k) => t(`unit.${k}`)).join(' + ') })}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className={styles.panel} data-testid="gf-status">
            <h3>{t('panel.status')}</h3>
            <p className={styles.small}>
              {t('status.round', { r: g.round, of: MAX_ROUNDS })} ·{' '}
              {t('status.cities', { a: citiesOf(g, 0), b: citiesOf(g, 1) })}
            </p>
            <ol className={styles.powers}>
              {POWERS.map((_, q) => (
                <li
                  key={q}
                  data-current={g.phase !== 'over' && q === p}
                  style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  data-testid={`gf-power-${q}`}
                >
                  <span className={styles.swatch} aria-hidden />
                  <strong>{pname(q)}</strong>
                  <small>
                    {t(`side.${sideOf(q)}`)} ·{' '}
                    {t('status.treasury', { n: g.treasury[q]!, i: income(g, q) })}
                  </small>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="gf-log">
              {g.log
                .slice(-8)
                .reverse()
                .map((e, i) => (
                  <li key={g.log.length - i}>{logLine(e)}</li>
                ))}
            </ol>
          </section>
          <p className={styles.small}>{t('keys')}</p>
          {g.phase !== 'over' && (
            <div className={styles.actions}>
              <button type="button" className="btn" onClick={toMenu} data-testid="gf-to-menu">
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
      case 'buy':
        return t('log.buy', { power: pname(e.p), n: e.kinds.length, c: e.spent });
      case 'battle':
        if (e.retreat) return t('log.retreat', { power: pname(e.p), loc: lname(e.loc) });
        return t(e.won ? 'log.win' : 'log.loss', {
          power: pname(e.p),
          loc: lname(e.loc),
          la: e.lostA,
          ld: e.lostD,
        });
      case 'capture':
        return e.capital
          ? t('log.capital', { power: pname(e.p), loc: lname(e.loc), n: e.plunder })
          : t('log.capture', { power: pname(e.p), loc: lname(e.loc) });
      case 'air-lost':
        return t('log.air', { power: pname(e.p), n: e.n });
      case 'income':
        return t('log.income', { power: pname(e.p), n: e.n });
      case 'end':
        return t('log.end', { side: t(`side.${e.side}`), n: e.cities[e.side]! });
    }
  }
}

function BattleSide({
  t,
  title,
  units,
}: {
  t: Translator;
  title: string;
  units: { kind: UnitKind; owner: number; hits: number }[];
}) {
  return (
    <div className={styles.bside}>
      <small>{title}</small>
      <span>
        {KINDS.filter((k) => units.some((u) => u.kind === k))
          .map((k) => `${units.filter((u) => u.kind === k).length} ${t(`unit.${k}`)}`)
          .join(', ') || '—'}
      </span>
    </div>
  );
}

function Menu({
  t,
  saved,
  level,
  side,
  setLevel,
  setSide,
  onStart,
  onWatch,
  onResume,
}: {
  t: Translator;
  saved: Saved;
  level: Level;
  side: number;
  setLevel: (l: Level) => void;
  setSide: (s: number) => void;
  onStart: () => void;
  onWatch: () => void;
  onResume: () => void;
}) {
  const r = saved.record;
  return (
    <div className={shared.menu} data-testid="gf-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="gf-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', {
                  r: saved.state.round,
                  power: t(`power.${saved.state.power}`),
                })}
              </small>
            </span>
          </button>
        )}
        <fieldset className={shared.group}>
          <legend>{t('menu.side')}</legend>
          <div className={shared.segmented}>
            {[0, 1].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={side === s}
                onClick={() => setSide(s)}
                data-testid={`gf-side-${s}`}
              >
                {t(`side.${s}`)}
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
                data-testid={`gf-level-${lv}`}
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
            data-testid="gf-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="gf-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="gf-record">
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
