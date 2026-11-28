/**
 * The Iron Fields table: a menu (players, faction, opponents or everyone here, new game, resume,
 * watch the AI, record), the land, and the panels of each step — the four sections of the board,
 * picking units and destinations, trading, producing, the bottom action, secret bids, encounters
 * — plus the chosen space, every faction (coins, power, popularity, resources, development,
 * stars), the log and the final count. Computer seats act after short pauses.
 */
import { Bot, Lightbulb, Play, RotateCcw, Star, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator, type Locale, type Translator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { decide, type Style } from './ai';
import {
  act,
  bolsterPower,
  currentPlayer,
  homePlayer,
  isLegal,
  isValidIron,
  legalActions,
  movesAllowed,
  newIron,
  produceHexes,
  reach,
  sectionBottom,
  tradePopularity,
  workers,
  type Action,
  type Iron,
  type LogEntry,
  type Unit,
} from './engine';
import styles from './IronFields.module.css';
import { LandMap } from './LandMap';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import {
  BOTTOM,
  ENCOUNTERS,
  FACTIONS,
  MAX_TURNS,
  MECH_ABILITIES,
  RES,
  STARS_TO_END,
  STRUCTURES,
  TOPS,
  type Reward,
  type Structure,
} from './world';

type Level = 'recruit' | 'marshal' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['recruit', 'marshal', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Iron | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidIron(s.state)) &&
    typeof s.record?.played === 'number'
  );
};
const UNIT_ORDER = { char: 0, mech: 1, worker: 2 } as const;

export function IronTable({ services }: { services: GameServices }) {
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
  const [count, setCount] = useState(2);
  const [faction, setFaction] = useState(-1);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'marshal', record: EMPTY });
  const [state, setState] = useState<Iron | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [unitSel, setUnitSel] = useState<number | null>(null);
  const [kind, setKind] = useState<Structure>('mill');
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

  const isHuman = (p: number) => mode === 'play' && (level === 'humans' || p === 0);
  const isYou = (p: number) => mode === 'play' && level !== 'humans' && p === 0;
  const g = state;
  const facName = (p: number) => (g ? FACTIONS[g.ps[p]!.faction]!.name[locale] : '');
  const name = (p: number) => (isYou(p) ? t('you') : facName(p));
  const who = (p: number) => (isYou(p) ? `${facName(p)} (${t('you.short')})` : facName(p));

  const start = (next: Iron, m: Mode, lv: Level) => {
    setState(next);
    stateRef.current = next;
    setMode(m);
    setLevel(lv);
    setHint(null);
    setSelected(null);
    setUnitSel(null);
    if (m === 'play') persist({ state: next, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, f: number) =>
    start(newIron(n, fixedSeed ?? randomSeed() >>> 0, f >= 0 ? f : undefined), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'marshal', 3, -1), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Iron, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    const added = next.log.slice(before.log.length);
    if (added.some((e) => e.k === 'star')) svc.playSound(SOUNDS.star);
    else if (added.some((e) => e.k === 'battle')) svc.playSound(SOUNDS.battle);
    else if (a.t === 'move') svc.playSound(SOUNDS.move);
    else if (a.t === 'produce' || a.t === 'trade' || a.t === 'coin') svc.playSound(SOUNDS.coins);
    else if (a.t === 'upgrade' || a.t === 'deploy' || a.t === 'build' || a.t === 'enlist')
      svc.playSound(SOUNDS.build);
    if (mode === 'play' && level !== 'humans') {
      if (added.some((e) => e.k === 'battle' && ((e.p === 0 && e.won) || (e.d === 0 && !e.won))))
        svc.unlockAchievement('victor');
      if (added.some((e) => e.k === 'foundry' && e.p === 0)) svc.unlockAchievement('foundry');
      if (next.ps[0]!.mechs >= 4) svc.unlockAchievement('mechs');
    }
    if (next.phase === 'over') {
      if (mode === 'play') {
        const won = next.winners.includes(0);
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        if (level !== 'humans') {
          const score = next.scores![0]!.total;
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score,
            mode: `${level}-${next.players}`,
          });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'marshal') svc.unlockAchievement('marshal-win');
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
    const cur = stateRef.current;
    if (!cur || !isLegal(cur, a)) return false;
    commit(act(cur, a), a);
    if (a.t === 'move') setUnitSel(null);
    return true;
  };

  const p = g ? currentPlayer(g) : -1;
  const myMove = !!g && g.phase !== 'over' && p >= 0 && isHuman(p);

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase === 'over' || isHuman(currentPlayer(g))) return;
    const q = currentPlayer(g);
    const style: Style = mode === 'watch' ? (q === 0 ? 'marshal' : 'recruit') : (level as Style);
    // The marshal thinks for about a second when it chooses a section.
    const delay = g.phase === 'choose' ? (style === 'marshal' ? 150 : 650) : 380;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur && cur.phase !== 'over') doAction(decide(cur, style, rngRef.rng));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  const showHint = () => {
    if (!g || !myMove) return;
    servicesRef.current.playSound(SOUNDS.hint);
    const h = decide(g, 'marshal', new Rng(g.ps[p]!.turns * 113 + g.log.length));
    setHint(h);
    if (h.t === 'move') {
      const u = g.units.find((x) => x.id === h.unit)!;
      setSelected(u.at);
      setUnitSel(u.id);
    }
    if (h.t === 'build') setKind(h.kind);
  };

  const legal = myMove && g ? legalActions(g) : [];
  const done = legal.find((a) => a.t === 'done');
  useKeyboard((e) => {
    if (mode === 'menu' || !g || !myMove) return false;
    const k = e.key.toLowerCase();
    if (k === 'd' && done) doAction(done);
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'over') persist({ state: cur, level });
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g)
    return (
      <Menu
        t={t}
        locale={locale}
        saved={saved}
        level={level}
        count={count}
        faction={faction}
        setLevel={setLevel}
        setCount={setCount}
        setFaction={setFaction}
        onStart={() => fresh('play', level, count, level === 'humans' ? -1 : faction)}
        onWatch={() => fresh('watch', 'marshal', 3, -1)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const resName = (r: string) => t(`res.${r}`);
  const terrName = (s: number) => t(`terrain.${g.terrain[s]}`);
  const spaceName = (s: number) => {
    const h = homePlayer(g, s);
    return h >= 0 ? `${t('terrain.home')} · ${facName(h)}` : terrName(s);
  };
  const cur = g.cur;
  const me = p >= 0 ? g.ps[p]! : null;
  const unitName = (u: Unit) => t(`unit.${u.kind}`);
  const rewardText = (r: Reward) =>
    [
      r.pay?.coins ? `−${r.pay.coins} ${t('word.coins')}` : '',
      r.pay?.popularity ? `−${r.pay.popularity} ${resName('pop')}` : '',
      r.coins ? `+${r.coins} ${t('word.coins')}` : '',
      r.popularity ? `+${r.popularity} ${resName('pop')}` : '',
      r.power ? `+${r.power} ${t('word.power')}` : '',
      ...RES.filter((k) => r.res?.[k]).map((k) => `+${r.res![k]} ${resName(k)}`),
      r.worker ? `+1 ${t('unit.worker')}` : '',
    ]
      .filter(Boolean)
      .join(', ');

  // Map highlights.
  const targets = new Set<number>();
  const selUnit = unitSel !== null ? g.units.find((u) => u.id === unitSel) : undefined;
  if (myMove && cur?.step === 'top' && cur.top === 'move' && selUnit)
    legal.forEach((a) => a.t === 'move' && a.unit === selUnit.id && targets.add(a.to));
  if (myMove && cur?.step === 'top' && cur.top === 'produce')
    legal.forEach((a) => a.t === 'produce' && targets.add(a.hex));
  if (myMove && cur?.step === 'bottom')
    legal.forEach((a) => {
      if (a.t === 'deploy') targets.add(a.hex);
      if (a.t === 'build' && a.kind === kind) targets.add(a.hex);
    });
  const hinted =
    hint?.t === 'move'
      ? hint.to
      : hint?.t === 'produce' || hint?.t === 'deploy' || hint?.t === 'build'
        ? hint.hex
        : null;

  const onSpace = (s: number) => {
    setSelected(s);
    if (!myMove || !g.cur) return;
    if (targets.has(s)) {
      if (cur!.step === 'top' && cur!.top === 'move' && selUnit)
        doAction({ t: 'move', unit: selUnit.id, to: s });
      else if (cur!.step === 'top' && cur!.top === 'produce') doAction({ t: 'produce', hex: s });
      else if (legal.some((a) => a.t === 'deploy' && a.hex === s))
        doAction({ t: 'deploy', hex: s });
      else doAction({ t: 'build', hex: s, kind });
      return;
    }
    if (cur!.step === 'top' && cur!.top === 'move') {
      const mine = g.units
        .filter(
          (u) => u.at === s && u.owner === p && !cur!.moved.includes(u.id) && reach(g, u).length,
        )
        .sort((a, b) => UNIT_ORDER[a.kind] - UNIT_ORDER[b.kind]);
      if (mine.length) {
        const i = mine.findIndex((u) => u.id === unitSel);
        setUnitSel(mine[(i + 1) % mine.length]!.id);
      }
    }
  };

  let prompt: string;
  if (g.phase === 'over') {
    const sc = g.scores!;
    const best = Math.max(...sc.map((s) => s.total));
    prompt =
      g.winners.length > 1
        ? t('prompt.tie', { n: best, who: g.winners.map(name).join(', ') })
        : t(isYou(g.winners[0]!) ? 'prompt.over.you' : 'prompt.over', {
            who: name(g.winners[0]!),
            n: best,
          });
  } else if (!myMove) prompt = t('prompt.cpu', { who: name(p) });
  else if (g.phase === 'choose') prompt = t('prompt.choose', { who: name(p) });
  else if (g.phase === 'attack')
    prompt = t('prompt.attack', { who: name(p), hex: spaceName(g.battle!.hex) });
  else if (g.phase === 'defend')
    prompt = t('prompt.defend', { who: name(p), hex: spaceName(g.battle!.hex) });
  else if (g.phase === 'encounter')
    prompt = t('prompt.encounter', { who: name(p), card: ENCOUNTERS[g.card!]!.name[locale] });
  else if (cur!.step === 'bottom') {
    const b = sectionBottom(g, p, cur!.section);
    prompt = t('prompt.bottom', {
      who: name(p),
      bottom: t(`bottom.${b}`),
      cost: t('bottom.cost', { n: me!.costs[b], res: resName(BOTTOM[b].res), c: BOTTOM[b].coins }),
    });
  } else if (cur!.top === 'move')
    prompt = t('prompt.move', { who: name(p), n: movesAllowed(g, p) - cur!.moved.length });
  else if (cur!.top === 'trade') prompt = t('prompt.trade', { who: name(p) });
  else prompt = t('prompt.produce', { who: name(p), n: produceHexes(g, p) - cur!.produced.length });

  const describe = (a: Action): string => {
    switch (a.t) {
      case 'section':
        return `${t(`top.${TOPS[a.i]}`)} / ${t(`bottom.${sectionBottom(g, p, a.i)}`)}`;
      case 'move': {
        const u = g.units.find((x) => x.id === a.unit)!;
        return `${unitName(u)}: ${spaceName(u.at)} → ${spaceName(a.to)}`;
      }
      case 'coin':
        return t('btn.coin');
      case 'trade':
        return a.a === 'pop'
          ? t('btn.pop', { n: tradePopularity(g, p) })
          : `${resName(a.a)} + ${resName(a.b)}`;
      case 'produce':
      case 'deploy':
        return spaceName(a.hex);
      case 'build':
        return `${t(`structure.${a.kind}`)}: ${spaceName(a.hex)}`;
      case 'upgrade':
        return `${t(`top.${a.top}`)} / ${t(`bottom.${a.bottom}`)}`;
      case 'enlist':
        return t(`recruit.${a.recruit}`);
      case 'bid':
        return t('btn.bid', { n: a.n });
      case 'option':
        return rewardText(ENCOUNTERS[g.card!]!.options[a.k]!);
      case 'done':
        return t('btn.done');
    }
  };
  const isHint = (a: Action) => !!hint && JSON.stringify(hint) === JSON.stringify(a);
  const btn = (a: Action, label: string, id: string, primary = false) => (
    <button
      key={id}
      type="button"
      className={`btn${primary ? ' btn-primary' : ''}`}
      disabled={!legal.some((x) => JSON.stringify(x) === JSON.stringify(a))}
      onClick={() => doAction(a)}
      data-testid={id}
      data-hint={isHint(a) || undefined}
    >
      {label}
    </button>
  );

  const topText = (top: (typeof TOPS)[number]) =>
    t(`top.${top}.text`, {
      n:
        top === 'move'
          ? movesAllowed(g, p)
          : top === 'trade'
            ? tradePopularity(g, p)
            : top === 'produce'
              ? produceHexes(g, p)
              : bolsterPower(g, p),
    });

  const controls = () => {
    if (!myMove || !me) return null;
    if (g.phase === 'choose')
      return (
        <ul className={styles.sections} data-testid="if-sections">
          {TOPS.map((top, i) => {
            const b = sectionBottom(g, p, i);
            const a: Action = { t: 'section', i };
            return (
              <li key={top} data-last={me.last === i} data-hint={isHint(a)}>
                <span>
                  <strong>{t(`top.${top}`)}</strong>
                  <small>{topText(top)}</small>
                  <strong>{t(`bottom.${b}`)}</strong>
                  <small>
                    {t(`bottom.${b}.text`)} ·{' '}
                    {t('bottom.cost', {
                      n: me.costs[b],
                      res: resName(BOTTOM[b].res),
                      c: BOTTOM[b].coins,
                    })}
                  </small>
                  {me.last === i && <em>{t('last.section')}</em>}
                </span>
                {btn(a, t('btn.section'), `if-section-${i}`, true)}
              </li>
            );
          })}
        </ul>
      );
    if (g.phase === 'attack' || g.phase === 'defend')
      return (
        <div className={styles.actions} data-testid="if-bids">
          {legal.map((a) => a.t === 'bid' && btn(a, t('btn.bid', { n: a.n }), `if-bid-${a.n}`))}
        </div>
      );
    if (g.phase === 'encounter')
      return (
        <div className={styles.actions} data-testid="if-options">
          {ENCOUNTERS[g.card!]!.options.map((o, k) =>
            btn({ t: 'option', k }, rewardText(o), `if-option-${k}`),
          )}
        </div>
      );
    const c = cur!;
    if (c.step === 'bottom') {
      const b = sectionBottom(g, p, c.section);
      return (
        <>
          {b === 'upgrade' && (
            <div className={styles.actions} data-testid="if-upgrades">
              {legal.map(
                (a) =>
                  a.t === 'upgrade' &&
                  btn(
                    a,
                    `${t(`top.${a.top}`)} ↑ · ${t(`bottom.${a.bottom}`)} ↓`,
                    `if-upgrade-${a.top}-${a.bottom}`,
                  ),
              )}
            </div>
          )}
          {b === 'enlist' && (
            <div className={styles.actions}>
              {legal.map(
                (a) =>
                  a.t === 'enlist' && btn(a, t(`recruit.${a.recruit}`), `if-enlist-${a.recruit}`),
              )}
            </div>
          )}
          {b === 'build' && (
            <div className={shared.segmented}>
              {STRUCTURES.filter((k) => !me.structures.includes(k)).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  title={t(`structure.${k}.text`)}
                  data-testid={`if-kind-${k}`}
                >
                  {t(`structure.${k}`)}
                </button>
              ))}
            </div>
          )}
          {(b === 'deploy' || b === 'build') && <p className={styles.small}>{t('space.none')}</p>}
          <div className={styles.actions}>{btn({ t: 'done' }, t('btn.skip'), 'if-done')}</div>
        </>
      );
    }
    if (c.top === 'trade')
      return (
        <div className={styles.actions} data-testid="if-trades">
          {legal.map((a) => a.t === 'trade' && btn(a, describe(a), `if-trade-${a.a}-${a.b}`))}
          {btn({ t: 'done' }, t('btn.skip'), 'if-done')}
        </div>
      );
    return (
      <>
        {c.top === 'move' && selected !== null && (
          <div className={styles.actions} data-testid="if-units">
            {g.units
              .filter((u) => u.at === selected && u.owner === p && !c.moved.includes(u.id))
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="btn"
                  aria-pressed={unitSel === u.id}
                  onClick={() => setUnitSel(u.id)}
                  data-testid={`if-unit-${u.id}`}
                >
                  {unitName(u)}
                </button>
              ))}
          </div>
        )}
        <div className={styles.actions}>
          {c.top === 'move' &&
            legal.some((a) => a.t === 'coin') &&
            btn({ t: 'coin' }, t('btn.coin'), 'if-coin')}
          {btn({ t: 'done' }, t('btn.done'), 'if-done', true)}
        </div>
      </>
    );
  };

  const starList = (q: number) => g.ps[q]!.stars.map((s) => t(`star.${s}`)).join(', ');

  return (
    <div className={styles.table} data-testid="if-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="if-prompt">
          {prompt}
        </p>
        <span className={styles.round} data-testid="if-turns">
          {t('prompt.turns', {
            t: Math.min(MAX_TURNS, (g.ps[Math.max(0, p)]?.turns ?? 0) + 1),
            of: MAX_TURNS,
            s: STARS_TO_END,
          })}
          <br />
          <span data-testid="if-phase">{g.phase !== 'over' && t(`phase.${g.phase}`)}</span>
        </span>
      </div>
      <div className={styles.layout}>
        <div className={styles.mapWrap}>
          <LandMap
            g={g}
            t={t}
            spaceName={spaceName}
            targets={targets}
            selected={selected}
            hinted={hinted}
            onPick={onSpace}
          />
        </div>
        <div className={styles.side}>
          {g.phase === 'over' && g.scores ? (
            <section className={styles.panel} data-testid="if-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <ul className={styles.players} data-testid="if-score">
                {g.scores.map((s, q) => (
                  <li
                    key={q}
                    className={styles.player}
                    style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  >
                    <span className={styles.swatch} aria-hidden />
                    <strong>{name(q)}</strong>
                    <b>{s.total}</b>
                    <small>
                      {t('score.line', {
                        c: s.coins,
                        s: s.stars,
                        t: s.territories,
                        r: s.resources,
                      })}
                    </small>
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    fresh(
                      mode,
                      level,
                      g.players,
                      mode === 'play' && level !== 'humans' ? g.ps[0]!.faction : -1,
                    )
                  }
                  data-testid="if-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="if-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            myMove && (
              <section className={styles.panel} data-testid="if-controls">
                {controls()}
                <div className={styles.actions}>
                  <button type="button" className="btn" onClick={showHint} data-testid="if-hint">
                    <Lightbulb size={16} /> {t('btn.hint')}
                  </button>
                  {hint && (
                    <span className={styles.small} data-testid="if-hint-text">
                      {t('hint.say', { move: describe(hint) })}
                    </span>
                  )}
                </div>
              </section>
            )
          )}

          <section className={styles.panel} data-testid="if-space">
            <h3>{selected === null ? t('panel.space') : spaceName(selected)}</h3>
            {selected === null ? (
              <p className={styles.small}>{t('space.none')}</p>
            ) : (
              <>
                {g.ps.map((_, q) => {
                  const us = g.units.filter((u) => u.at === selected && u.owner === q);
                  return us.length ? (
                    <p key={q} className={styles.small}>
                      {t('space.units', { who: who(q), list: us.map(unitName).join(', ') })}
                    </p>
                  ) : null;
                })}
                {g.tokens[selected] && <p className={styles.small}>{t('space.token')}</p>}
                {g.structures
                  .filter((x) => x.hex === selected)
                  .map((x) => (
                    <p key={x.kind} className={styles.small}>
                      {t('space.structure', { kind: t(`structure.${x.kind}`), who: who(x.owner) })}
                    </p>
                  ))}
              </>
            )}
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="if-players">
              {g.ps.map((x, q) => (
                <li
                  key={q}
                  className={styles.player}
                  data-current={g.phase !== 'over' && q === p}
                  style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  data-testid={`if-player-${q}`}
                >
                  <span className={styles.swatch} aria-hidden />
                  <strong>
                    {name(q)}
                    {isYou(q) && ` · ${facName(q)}`}
                  </strong>
                  <b className={styles.stars}>
                    <Star size={12} /> {x.stars.length}
                  </b>
                  <small>{t('player.line', { c: x.coins, pw: x.power, pop: x.popularity })}</small>
                  <small>
                    {t('player.res', {
                      o: x.res.oil,
                      m: x.res.metal,
                      f: x.res.food,
                      w: x.res.wood,
                    })}
                  </small>
                  <small>
                    {t('player.dev', {
                      u: x.improved.length,
                      m: x.mechs,
                      s: x.structures.length,
                      r: x.recruits.length,
                      w: workers(g, q),
                    })}
                  </small>
                  <small>
                    {x.stars.length
                      ? t('player.stars', { list: starList(q) })
                      : t('player.nostars')}
                  </small>
                  <small>
                    {FACTIONS[x.faction]!.ability[locale]}
                    {x.mechs > 0 &&
                      ` · ${MECH_ABILITIES.slice(0, x.mechs)
                        .map((m) => t(`mech.${m}`))
                        .join(' · ')}`}
                  </small>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="if-log">
              {g.log
                .slice(-10)
                .reverse()
                .map((e, i) => (
                  <li key={g.log.length - i}>{logLine(e)}</li>
                ))}
            </ol>
          </section>
          <p className={styles.small}>{t('keys')}</p>
          {g.phase !== 'over' && (
            <div className={styles.actions}>
              <button type="button" className="btn" onClick={toMenu} data-testid="if-to-menu">
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
      case 'section':
        return t('log.section', { who: who(e.p), top: t(`top.${e.top}`) });
      case 'move':
        return t('log.move', { who: who(e.p), unit: t(`unit.${e.unit}`).toLowerCase() });
      case 'coin':
        return t('log.coin', { who: who(e.p) });
      case 'trade':
        return t('log.trade', { who: who(e.p) });
      case 'produce':
        return t('log.produce', {
          who: who(e.p),
          n: e.n,
          what: e.what === 'worker' ? t('workerWord') : resName(e.what).toLowerCase(),
        });
      case 'bolster':
        return t('log.bolster', { who: who(e.p), n: e.power });
      case 'upgrade':
        return t('log.upgrade', { who: who(e.p), top: t(`top.${e.top}`) });
      case 'deploy':
        return t('log.deploy', { who: who(e.p) });
      case 'build':
        return t('log.build', { who: who(e.p), kind: t(`structure.${e.kind}`).toLowerCase() });
      case 'enlist':
        return t('log.enlist', { who: who(e.p), r: t(`recruit.${e.recruit}`) });
      case 'battle':
        return t('log.battle', {
          who: who(e.p),
          d: who(e.d),
          a: e.a,
          dv: e.dv,
          res: t(e.won ? 'log.battle.won' : 'log.battle.lost'),
        });
      case 'scatter':
        return t('log.scatter', { who: who(e.p), n: e.n, d: who(e.d) });
      case 'encounter':
        return t('log.encounter', { who: who(e.p), card: ENCOUNTERS[e.card]!.name[locale] });
      case 'foundry':
        return t('log.foundry', { who: who(e.p) });
      case 'star':
        return t('log.star', { who: who(e.p), star: t(`star.${e.star}`) });
      case 'end':
        return t('log.end');
    }
  }
}

function Menu({
  t,
  locale,
  saved,
  level,
  count,
  faction,
  setLevel,
  setCount,
  setFaction,
  onStart,
  onWatch,
  onResume,
}: {
  t: Translator;
  locale: Locale;
  saved: Saved;
  level: Level;
  count: number;
  faction: number;
  setLevel: (l: Level) => void;
  setCount: (n: number) => void;
  setFaction: (n: number) => void;
  onStart: () => void;
  onWatch: () => void;
  onResume: () => void;
}) {
  const r = saved.record;
  return (
    <div className={shared.menu} data-testid="if-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="if-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', { n: saved.state.players, t: saved.state.ps[0]!.turns + 1 })}
              </small>
            </span>
          </button>
        )}
        <fieldset className={shared.group}>
          <legend>{t('menu.players')}</legend>
          <div className={shared.segmented}>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                data-testid={`if-count-${n}`}
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
                data-testid={`if-level-${lv}`}
              >
                {t(`level.${lv}`)}
              </button>
            ))}
          </div>
          <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
        </fieldset>
        {level !== 'humans' && (
          <fieldset className={shared.group}>
            <legend>{t('menu.faction')}</legend>
            <div className={styles.factions}>
              <button
                type="button"
                aria-pressed={faction < 0}
                onClick={() => setFaction(-1)}
                data-testid="if-faction-random"
              >
                <strong>{t('faction.random')}</strong>
              </button>
              {FACTIONS.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={faction === i}
                  onClick={() => setFaction(i)}
                  data-testid={`if-faction-${f.id}`}
                >
                  <strong>{f.name[locale]}</strong>
                  <span>{f.ability[locale]}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <div className={shared.menuActions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStart}
            data-testid="if-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="if-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="if-record">
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
