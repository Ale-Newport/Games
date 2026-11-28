/**
 * The Planet Shapers table: a menu (players, opponents or everyone here, new game, resume, watch
 * the AI, record), the three parameter tracks and the map of Kepra, then the panels of each step
 * — corporations, cards on offer, the hand with play and sell, standard projects, conversions,
 * card actions, placing tiles — plus players (TR, resources and production), milestones and
 * awards, the log and the final score. With everyone on one device, hands and offers stay hidden
 * behind a hand-off screen between players. Computer seats act after short pauses.
 */
import { Bot, Lightbulb, Play, RotateCcw, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { decide, type Style } from './ai';
import {
  act,
  card,
  costOf,
  currentPlayer,
  groveCost,
  heatCost,
  isLegal,
  isValidShapers,
  legalActions,
  milestoneMet,
  newShapers,
  researchPrice,
  scoreAll,
  type Action,
  type LogEntry,
  type Shapers,
} from './engine';
import { PlanetMap } from './PlanetMap';
import styles from './PlanetShapers.module.css';
import { SOUNDS } from './sounds';
import { STRINGS } from './i18n';
import {
  AWARD_COSTS,
  AWARDS,
  BASINS,
  BONUS,
  CARD_BONUS,
  CORPS,
  MAX,
  MILESTONES,
  PARAMS,
  RES,
  STD,
  type Amounts,
  type CardDef,
} from './world';

type Level = 'cadet' | 'architect' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['cadet', 'architect', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Shapers | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidShapers(s.state)) &&
    typeof s.record?.played === 'number'
  );
};
const PARAM_COLOUR = { heat: '#e8743b', air: '#9fd3ff', sea: '#2f7fc1' } as const;

export function ShapersTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('architect');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'architect', record: EMPTY });
  const [state, setState] = useState<Shapers | null>(null);
  const [picked, setPicked] = useState<{ key: string; mask: number }>({ key: '', mask: 0 });
  const [seen, setSeen] = useState(0);
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
  const corpName = (p: number) => {
    const c = g?.ps[p]?.corp ?? -1;
    return c >= 0 ? CORPS[c]!.name[locale] : t('seat.name', { n: p + 1 });
  };
  const name = (p: number) => (isYou(p) ? t('you') : corpName(p));
  /** The name inside a sentence (“Verdance (you) played…”). */
  const who = (p: number) => (isYou(p) ? `${corpName(p)} (${t('you.short')})` : corpName(p));

  const start = (next: Shapers, m: Mode, lv: Level) => {
    setState(next);
    stateRef.current = next;
    setMode(m);
    setLevel(lv);
    setHint(null);
    setSeen(lv === 'humans' ? -1 : 0);
    if (m === 'play') persist({ state: next, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number) =>
    start(newShapers(n, fixedSeed ?? randomSeed() >>> 0), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'architect', 3), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Shapers, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    const added = next.log.slice(before.log.length);
    if (added.some((e) => e.k === 'raise')) svc.playSound(SOUNDS.raise);
    else if (a.t === 'tile') svc.playSound(SOUNDS.tile);
    else if (a.t === 'play' || a.t === 'use') svc.playSound(SOUNDS.card);
    else if (a.t === 'claim' || a.t === 'fund') svc.playSound(SOUNDS.goal);
    else if (a.t === 'buy' || a.t === 'std' || a.t === 'sell') svc.playSound(SOUNDS.coins);
    else if (added.some((e) => e.k === 'production')) svc.playSound(SOUNDS.production);
    if (mode === 'play' && level !== 'humans') {
      if (added.some((e) => e.k === 'claim' && e.p === 0)) svc.unlockAchievement('milestone');
      if (next.tiles.filter((x) => x?.kind === 'grove' && x.owner === 0).length >= 3)
        svc.unlockAchievement('gardener');
      if (next.ps[0]!.played.length >= 12) svc.unlockAchievement('engine');
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
            if (level === 'architect') svc.unlockAchievement('architect-win');
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
    return true;
  };

  const p = g ? currentPlayer(g) : -1;
  const myMove = !!g && g.phase !== 'over' && p >= 0 && isHuman(p);
  const handoff = myMove && level === 'humans' && seen !== p;
  const viewer = mode === 'play' ? (level === 'humans' ? (handoff ? -1 : p) : 0) : -1;

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase === 'over' || isHuman(currentPlayer(g))) return;
    const q = currentPlayer(g);
    const style: Style = mode === 'watch' ? (q === 0 ? 'architect' : 'cadet') : (level as Style);
    const delay = g.phase === 'place' ? 380 : g.phase === 'action' ? 520 : 650;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur && cur.phase !== 'over') doAction(decide(cur, style, rngRef.rng));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  const showHint = () => {
    if (!g || !myMove || handoff) return;
    servicesRef.current.playSound(SOUNDS.hint);
    setHint(decide(g, 'architect', new Rng(g.gen * 131 + g.log.length)));
  };

  const legal = myMove && g && !handoff ? legalActions(g) : [];
  useKeyboard((e) => {
    if (mode === 'menu' || !g || !myMove || handoff) return false;
    const k = e.key.toLowerCase();
    if (k === 'p' && legal.some((a) => a.t === 'pass')) doAction({ t: 'pass' });
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
        saved={saved}
        level={level}
        count={count}
        setLevel={setLevel}
        setCount={setCount}
        onStart={() => fresh('play', level, count)}
        onWatch={() => fresh('watch', 'architect', 3)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const resName = (r: string) => t(`res.${r}`);
  const list = (a: Amounts | undefined) =>
    RES.filter((r) => a?.[r])
      .map((r) => `${a![r]! > 0 ? '+' : ''}${a![r]} ${resName(r)}`)
      .join(', ');
  const cardText = (d: CardDef): string[] => {
    const out: string[] = [];
    const r = d.req;
    if (r?.param)
      out.push(
        t(r.min !== undefined ? 'fx.req.min' : 'fx.req.max', {
          param: t(`param.${r.param}`),
          n: r.min ?? r.max ?? 0,
        }),
      );
    if (r?.tag) out.push(t('fx.req.tag', { n: r.count ?? 1, tag: t(`tag.${r.tag}`) }));
    if (d.prod) out.push(t('fx.prod', { list: list(d.prod) }));
    if (d.gain) out.push(t('fx.gain', { list: list(d.gain) }));
    for (const param of PARAMS)
      if (d.raise?.[param])
        out.push(
          param === 'sea'
            ? t('fx.sea', { n: d.raise[param]! })
            : t('fx.raise', { param: t(`param.${param}`), n: d.raise[param]! }),
        );
    for (const x of d.tiles ?? []) out.push(t('fx.tile', { tile: t(`tile.${x}`) }));
    if (d.tr) out.push(t('fx.tr', { n: d.tr }));
    if (d.draw) out.push(t('fx.draw', { n: d.draw }));
    if (d.action) {
      const a = d.action;
      const get = [
        list(a.gain),
        a.draw ? t('fx.draw', { n: a.draw }) : '',
        ...PARAMS.filter((x) => a.raise?.[x]).map((x) =>
          x === 'sea' ? t('fx.sea', { n: 1 }) : t('fx.raise', { param: t(`param.${x}`), n: 1 }),
        ),
      ]
        .filter(Boolean)
        .join(', ');
      out.push(
        a.pay
          ? t('fx.action', { pay: `${list(a.pay).replace(/\+/g, '')} `, get })
          : t('fx.actionFree', { get }),
      );
    }
    if (d.effect?.discount)
      out.push(
        d.effect.discount.tag
          ? t('fx.discount', { tag: t(`tag.${d.effect.discount.tag}`), n: d.effect.discount.n })
          : t('fx.discountAll', { n: d.effect.discount.n }),
      );
    if (d.effect?.onTag)
      out.push(
        t('fx.onTag', { tag: t(`tag.${d.effect.onTag.tag}`), list: list(d.effect.onTag.gain) }),
      );
    if (d.vp) out.push(t('fx.vp', { n: d.vp }));
    return out;
  };
  const CardView = ({
    i,
    owner,
    attrs,
    children,
  }: {
    i: number;
    owner: number;
    attrs?: Record<string, string | boolean>;
    children?: ReactNode;
  }) => {
    const d = card(i);
    return (
      <li className={styles.card} data-kind={d.kind} {...attrs}>
        <span className={styles.cardHead}>
          <b className={styles.cost}>{owner >= 0 ? costOf(g, owner, i) : d.cost}</b>
          <strong>{d.name[locale]}</strong>
          <span className={styles.tags}>
            {d.tags.map((x, k) => (
              <span key={k} className={styles.tag}>
                {t(`tag.${x}`)}
              </span>
            ))}
          </span>
        </span>
        <span className={styles.btns}>{children}</span>
        <p className={styles.cardText}>{cardText(d).join(' · ')}</p>
      </li>
    );
  };
  const spaceName = (s: number) => {
    const tile = g.tiles[s];
    if (tile) return `${t(`tile.${tile.kind}`)}${tile.owner >= 0 ? ` · ${who(tile.owner)}` : ''}`;
    const b = [list(BONUS[s]), CARD_BONUS.has(s) ? `+1 ${t('fx.cards')}` : '']
      .filter(Boolean)
      .join(', ');
    return `${BASINS.includes(s) ? t('tile.sea') : '—'}${b ? ` · ${b}` : ''}`;
  };

  const phaseKey = g ? `${g.gen}:${g.phase}:${p}` : '';
  const mask = picked.key === phaseKey ? picked.mask : 0;
  const me = p >= 0 ? g.ps[p]! : null;

  // Map highlights.
  const targets = new Set<number>();
  if (myMove && !handoff && g.phase === 'place')
    legal.forEach((a) => a.t === 'tile' && targets.add(a.space));
  const hinted = hint?.t === 'tile' ? hint.space : null;

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
  } else if (handoff) prompt = t('prompt.handoff', { who: name(p) });
  else if (!myMove) prompt = t('prompt.cpu', { who: name(p) });
  else if (g.phase === 'setup' && me!.corp < 0) prompt = t('prompt.corp', { who: name(p) });
  else if (g.phase === 'setup' || g.phase === 'research')
    prompt = t('prompt.buy', { who: name(p), price: researchPrice(g, p) });
  else if (g.phase === 'place')
    prompt = t('prompt.place', { who: name(p), tile: t(`tile.${g.pending[0]!.kind}`) });
  else prompt = t('prompt.action', { who: name(p) });

  const describe = (a: Action): string => {
    switch (a.t) {
      case 'corp':
        return CORPS[me!.options[a.i]!]!.name[locale];
      case 'buy':
        return t('btn.buy', {
          n: me!.offer.filter((_, k) => a.mask & (1 << k)).length,
          c: me!.offer.filter((_, k) => a.mask & (1 << k)).length * researchPrice(g, p),
        });
      case 'play':
        return `${t('btn.play')}: ${card(a.card).name[locale]}`;
      case 'use':
        return `${t('btn.use')}: ${card(a.card).name[locale]}`;
      case 'sell':
        return `${t('btn.sell')}: ${card(a.card).name[locale]}`;
      case 'std':
        return t(`std.${a.id}`);
      case 'convert':
        return a.what === 'flora'
          ? t('btn.convertFlora', { n: groveCost(g, p) })
          : t('btn.convertHeat', { n: heatCost(g, p) });
      case 'claim':
        return t(`milestone.${MILESTONES[a.m]!}`);
      case 'fund':
        return t(`award.${AWARDS[a.a]!}`);
      case 'tile':
        return spaceName(a.space);
      case 'pass':
        return t('btn.pass');
    }
  };
  const same = (a: Action) => !!hint && JSON.stringify(hint) === JSON.stringify(a);
  const btn = (a: Action, label: string, id: string, primary = false) => (
    <button
      key={id}
      type="button"
      className={`btn${primary ? ' btn-primary' : ''}`}
      disabled={!legal.some((x) => JSON.stringify(x) === JSON.stringify(a))}
      onClick={() => doAction(a)}
      data-testid={id}
      data-hint={same(a) || undefined}
    >
      {label}
    </button>
  );

  const controls = (): ReactNode => {
    if (!myMove || !me) return null;
    if (handoff)
      return (
        <div className={styles.handoff} data-testid="ps-handoff">
          <p>{prompt}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSeen(p)}
            data-testid="ps-ready"
          >
            {t('btn.ready', { who: name(p) })}
          </button>
        </div>
      );
    if (g.phase === 'setup' && me.corp < 0)
      return (
        <>
          <h3>{t('panel.corp')}</h3>
          <ul className={styles.cards} data-testid="ps-corps">
            {me.options.map((c, i) => (
              <li key={c} className={styles.card} data-hint={hint?.t === 'corp' && hint.i === i}>
                <span className={styles.cardHead}>
                  <strong>{CORPS[c]!.name[locale]}</strong>
                </span>
                <span className={styles.btns}>
                  {btn({ t: 'corp', i }, t('btn.choose'), `ps-corp-${i}`, true)}
                </span>
                <p className={styles.cardText}>{CORPS[c]!.text[locale]}</p>
              </li>
            ))}
          </ul>
          <h3>{t('panel.offer')}</h3>
          <ul className={styles.cards}>
            {me.offer.map((i) => (
              <CardView key={i} i={i} owner={-1} />
            ))}
          </ul>
        </>
      );
    if (g.phase === 'setup' || g.phase === 'research') {
      const price = researchPrice(g, p);
      const n = me.offer.filter((_, k) => mask & (1 << k)).length;
      return (
        <>
          <h3>{t('panel.offer')}</h3>
          <ul className={styles.cards} data-testid="ps-offer">
            {me.offer.map((i, k) => (
              <CardView
                key={i}
                i={i}
                owner={p}
                attrs={{
                  'data-picked': !!(mask & (1 << k)),
                  'data-hint': hint?.t === 'buy' && !!(hint.mask & (1 << k)),
                }}
              >
                <button
                  type="button"
                  className="btn"
                  aria-pressed={!!(mask & (1 << k))}
                  onClick={() => setPicked({ key: phaseKey, mask: mask ^ (1 << k) })}
                  data-testid={`ps-offer-${k}`}
                >
                  {mask & (1 << k) ? '✓' : `+${price}`}
                </button>
              </CardView>
            ))}
          </ul>
          <div className={styles.actions}>
            {btn({ t: 'buy', mask }, t('btn.buy', { n, c: n * price }), 'ps-buy', true)}
          </div>
        </>
      );
    }
    if (g.phase === 'place') return null;
    const actionCards = me.played.filter((i) => card(i).action);
    return (
      <>
        <h3>{t('panel.hand')}</h3>
        {me.hand.length === 0 && <p className={styles.small}>{t('hand.empty')}</p>}
        <ul className={styles.cards} data-testid="ps-hand">
          {me.hand.map((i) => {
            const can = legal.some((a) => a.t === 'play' && a.card === i);
            return (
              <CardView
                key={i}
                i={i}
                owner={p}
                attrs={{ 'data-off': !can, 'data-hint': hint?.t === 'play' && hint.card === i }}
              >
                {btn({ t: 'play', card: i }, t('btn.play'), `ps-play-${card(i).id}`, true)}
                {btn({ t: 'sell', card: i }, t('btn.sell'), `ps-sell-${card(i).id}`)}
              </CardView>
            );
          })}
        </ul>
        {actionCards.length > 0 && (
          <>
            <h3>{t('panel.played')}</h3>
            <ul className={styles.cards}>
              {actionCards.map((i) => (
                <CardView key={i} i={i} owner={p} attrs={{ 'data-off': me.used.includes(i) }}>
                  {btn({ t: 'use', card: i }, t('btn.use'), `ps-use-${card(i).id}`)}
                </CardView>
              ))}
            </ul>
          </>
        )}
        <h3>{t('panel.std')}</h3>
        <div className={styles.actions} data-testid="ps-std">
          {STD.map((s) =>
            btn({ t: 'std', id: s.id }, `${t(`std.${s.id}`)} (${s.cost})`, `ps-std-${s.id}`),
          )}
          {btn(
            { t: 'convert', what: 'flora' },
            t('btn.convertFlora', { n: groveCost(g, p) }),
            'ps-convert-flora',
          )}
          {btn(
            { t: 'convert', what: 'heat' },
            t('btn.convertHeat', { n: heatCost(g, p) }),
            'ps-convert-heat',
          )}
        </div>
        <p className={styles.small}>
          {STD.map((s) => `${t(`std.${s.id}`)}: ${t(`std.${s.id}.text`)}`).join(' · ')}
        </p>
        <div className={styles.actions}>{btn({ t: 'pass' }, t('btn.pass'), 'ps-pass')}</div>
      </>
    );
  };

  const scores = g.scores ?? (g.phase === 'over' ? scoreAll(g) : null);

  return (
    <div className={styles.table} data-testid="ps-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="ps-prompt">
          {prompt}
        </p>
        <span className={styles.gen} data-testid="ps-gen">
          {t('prompt.gen', { g: g.gen })}
          <br />
          <span data-testid="ps-phase">{g.phase !== 'over' && t(`phase.${g.phase}`)}</span>
        </span>
      </div>
      <div className={styles.layout}>
        <div className={styles.mapWrap}>
          <div className={styles.params} data-testid="ps-params">
            {PARAMS.map((x) => (
              <div key={x} className={styles.param} data-testid={`ps-param-${x}`}>
                <span>{t(`param.${x}`)}</span>
                <span className={styles.track} style={{ ['--tc' as string]: PARAM_COLOUR[x] }}>
                  {Array.from({ length: MAX[x] }, (_, k) => (
                    <span key={k} data-on={k < g.params[x]} />
                  ))}
                </span>
                <span>
                  {g.params[x]} / {MAX[x]}
                </span>
              </div>
            ))}
          </div>
          <PlanetMap
            g={g}
            t={t}
            spaceName={spaceName}
            targets={targets}
            hinted={hinted}
            onPick={(s) => {
              if (targets.has(s)) doAction({ t: 'tile', space: s });
            }}
          />
        </div>
        <div className={styles.side}>
          {g.phase === 'over' && scores ? (
            <section className={styles.panel} data-testid="ps-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <ul className={styles.players} data-testid="ps-score">
                {scores.map((s, q) => (
                  <li
                    key={q}
                    className={styles.player}
                    style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  >
                    <span className={styles.swatch} aria-hidden />
                    <strong>{name(q)}</strong>
                    <b className={styles.tr}>{s.total}</b>
                    <small>
                      {t('score.line', {
                        tr: s.tr,
                        m: s.milestones,
                        a: s.awards,
                        g: s.groves,
                        s: s.settlements,
                        c: s.cards,
                      })}
                    </small>
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fresh(mode, level, g.players)}
                  data-testid="ps-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="ps-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            myMove && (
              <section className={styles.panel} data-testid="ps-controls">
                {controls()}
                {!handoff && (
                  <div className={styles.actions}>
                    <button type="button" className="btn" onClick={showHint} data-testid="ps-hint">
                      <Lightbulb size={16} /> {t('btn.hint')}
                    </button>
                    {hint && (
                      <span className={styles.small} data-testid="ps-hint-text">
                        {t('hint.say', { move: describe(hint) })}
                      </span>
                    )}
                  </div>
                )}
              </section>
            )
          )}

          {!myMove && viewer >= 0 && g.phase !== 'over' && g.ps[viewer]!.hand.length > 0 && (
            <section className={styles.panel}>
              <h3>{t('panel.hand')}</h3>
              <ul className={styles.cards} data-testid="ps-your-hand">
                {g.ps[viewer]!.hand.map((i) => (
                  <CardView key={i} i={i} owner={viewer} />
                ))}
              </ul>
            </section>
          )}

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="ps-players">
              {g.ps.map((x, q) => (
                <li
                  key={q}
                  className={styles.player}
                  data-current={g.phase !== 'over' && q === p}
                  style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  data-testid={`ps-player-${q}`}
                >
                  <span className={styles.swatch} aria-hidden />
                  <strong>
                    {name(q)}
                    {isYou(q) && x.corp >= 0 && ` · ${CORPS[x.corp]!.name[locale]}`}
                  </strong>
                  <b className={styles.tr}>{t('player.tr', { n: x.tr })}</b>
                  <span className={styles.resGrid}>
                    {RES.map((r) => (
                      <span key={r}>
                        {resName(r)}
                        <b>{x.res[r]}</b>
                        {x.prod[r] >= 0 ? `+${x.prod[r]}` : x.prod[r]}
                      </span>
                    ))}
                  </span>
                  <small>
                    {t('player.cards', { h: x.hand.length, p: x.played.length + x.events.length })}
                    {x.played.length > 0 &&
                      ` · ${x.played.map((i) => card(i).name[locale]).join(', ')}`}
                  </small>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.goals')}</h3>
            <div className={styles.goals} data-testid="ps-goals">
              <ul>
                <li>
                  <em className={styles.small}>{t('goal.limit', { n: g.claimed.length })}</em>
                </li>
                {MILESTONES.map((m, i) => {
                  const c = g.claimed.find((x) => x.m === i);
                  return (
                    <li key={m}>
                      <span>
                        <strong>{t(`milestone.${m}`)}</strong>{' '}
                        <span className={styles.small}>{t(`milestone.${m}.text`)}</span>
                        {c && (
                          <span className={styles.small}>
                            {' '}
                            · {t('goal.claimed', { who: who(c.p) })}
                          </span>
                        )}
                      </span>
                      {myMove &&
                        !handoff &&
                        g.phase === 'action' &&
                        !c &&
                        milestoneMet(g, p, i) &&
                        btn({ t: 'claim', m: i }, t('btn.claim'), `ps-claim-${m}`)}
                    </li>
                  );
                })}
              </ul>
              <ul>
                <li>
                  <em className={styles.small}>{t('goal.limit', { n: g.funded.length })}</em>
                </li>
                {AWARDS.map((a, i) => {
                  const f = g.funded.find((x) => x.a === i);
                  return (
                    <li key={a}>
                      <span>
                        <strong>{t(`award.${a}`)}</strong>{' '}
                        <span className={styles.small}>{t(`award.${a}.text`)}</span>
                        {f && (
                          <span className={styles.small}>
                            {' '}
                            · {t('goal.funded', { who: who(f.p) })}
                          </span>
                        )}
                      </span>
                      {myMove &&
                        !handoff &&
                        g.phase === 'action' &&
                        !f &&
                        g.funded.length < AWARD_COSTS.length &&
                        btn(
                          { t: 'fund', a: i },
                          t('btn.fund', { c: AWARD_COSTS[g.funded.length]! }),
                          `ps-fund-${a}`,
                        )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="ps-log">
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
              <button type="button" className="btn" onClick={toMenu} data-testid="ps-to-menu">
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
      case 'gen':
        return t('log.gen', { g: e.gen });
      case 'corp': {
        const seat = t('seat.name', { n: e.p + 1 });
        return t('log.corp', {
          who: isYou(e.p) ? `${seat} (${t('you.short')})` : seat,
          corp: CORPS[e.corp]!.name[locale],
        });
      }
      case 'buy':
        return t('log.buy', { who: who(e.p), n: e.n });
      case 'play':
        return t('log.play', { who: who(e.p), card: card(e.card).name[locale] });
      case 'std':
        return t('log.std', { who: who(e.p), std: t(`std.${e.id}`) });
      case 'convert':
        return t(`log.convert.${e.what}`, { who: who(e.p) });
      case 'use':
        return t('log.use', { who: who(e.p), card: card(e.card).name[locale] });
      case 'sell':
        return t('log.sell', { who: who(e.p) });
      case 'claim':
        return t('log.claim', { who: who(e.p), m: t(`milestone.${MILESTONES[e.m]!}`) });
      case 'fund':
        return t('log.fund', { who: who(e.p), a: t(`award.${AWARDS[e.a]!}`) });
      case 'tile':
        return t('log.tile', { who: who(e.p), tile: t(`tile.${e.kind}`) });
      case 'raise':
        return t('log.raise', { param: t(`param.${e.param}`), n: e.to });
      case 'pass':
        return t('log.pass', { who: who(e.p) });
      case 'production':
        return t('log.production');
      case 'end':
        return t('log.end');
    }
  }
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
    <div className={shared.menu} data-testid="ps-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="ps-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>{t('menu.resumeHint', { n: saved.state.players, g: saved.state.gen })}</small>
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
                data-testid={`ps-count-${n}`}
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
                data-testid={`ps-level-${lv}`}
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
            data-testid="ps-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="ps-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="ps-record">
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
