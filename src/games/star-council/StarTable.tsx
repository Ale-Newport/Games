/**
 * The Star Council table: a menu (players, faction, opponents or everyone here, points to win,
 * new game, resume, watch the AI, record), the galaxy, and the panels of each phase — strategy
 * cards to pick, the action choices (activate the selected system, play a card, pass), ships that
 * can move in, the battle with its dice, landing, production, following a secondary, scoring and
 * the council vote — plus players, the chosen system, objectives, laws and the log. Computer
 * seats act after short pauses.
 */
import { Bot, Lightbulb, Play, RotateCcw, Trophy } from 'lucide-react';
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
  canScore,
  combatShips,
  currentPlayer,
  hitOn,
  isLegal,
  isValidStar,
  kindAt,
  legalActions,
  moveOf,
  newStar,
  owned,
  planet,
  planetsIn,
  productionAt,
  queueCost,
  spendable,
  votesOf,
  type Action,
  type Fleet,
  type LogEntry,
  type Star,
} from './engine';
import { GalaxyMap } from './GalaxyMap';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import styles from './StarCouncil.module.css';
import {
  AGENDAS,
  CARDS,
  FACTIONS,
  KINDS,
  MAX_ROUNDS,
  NEXUS_PLANET,
  OBJECTIVES,
  PLANETS,
  STAGE_VP,
  TARGETS,
  TECH_IDS,
  UNITS,
  type Kind,
} from './world';

type Level = 'envoy' | 'regent' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['envoy', 'regent', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Star | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidStar(s.state)) &&
    typeof s.record?.played === 'number'
  );
};
type Move = Extract<Action, { t: 'move' }>;

export function StarTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('regent');
  const [count, setCount] = useState(3);
  const [faction, setFaction] = useState(-1);
  const [target, setTarget] = useState<number>(10);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'regent', record: EMPTY });
  const [state, setState] = useState<Star | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
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
  const name = (p: number): string =>
    p === -2
      ? t('wardens')
      : p < 0 || !g
        ? '—'
        : isYou(p)
          ? t('you')
          : FACTIONS[g.ps[p]!.faction]!.name[locale];
  /** The name inside a sentence: the faction, marked as yours (“Oru Syndicate (you) took…”). */
  const who = (p: number): string =>
    g && p >= 0 && isYou(p)
      ? `${FACTIONS[g.ps[p]!.faction]!.name[locale]} (${t('you.short')})`
      : name(p);
  const sysName = (s: number) => (g ? systemName(g, s, t) : '');
  const pname = (id: number) => PLANETS[id]!.name;

  const start = (next: Star, m: Mode, lv: Level) => {
    setState(next);
    stateRef.current = next;
    setMode(m);
    setLevel(lv);
    setSelected(null);
    setHint(null);
    if (m === 'play') persist({ state: next, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, tg: number, f: number) =>
    start(newStar(n, fixedSeed ?? randomSeed() >>> 0, tg, f >= 0 ? f : undefined), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'regent', 3, 10, -1), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Star, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    const fresh = next.log.slice(before.log.length);
    if (a.t === 'roll') svc.playSound(SOUNDS.roll);
    else if (fresh.some((e) => e.k === 'score' || e.k === 'seat' || e.k === 'throne'))
      svc.playSound(SOUNDS.score);
    else if (fresh.some((e) => e.k === 'claim' || (e.k === 'ground' && e.won)))
      svc.playSound(SOUNDS.claim);
    else if (a.t === 'activate' || a.t === 'move') svc.playSound(SOUNDS.move);
    else if (a.t === 'pick' || a.t === 'play' || a.t === 'follow') svc.playSound(SOUNDS.card);
    else if (fresh.some((e) => e.k === 'agenda')) svc.playSound(SOUNDS.gavel);
    if (mode === 'play' && level !== 'humans') {
      if (planet(next, NEXUS_PLANET)!.owner === 0) svc.unlockAchievement('nexus');
      if (next.ps[0]!.techs.length >= 4) svc.unlockAchievement('scholar');
      if (
        fresh.some(
          (e) =>
            e.k === 'agenda' &&
            e.option === 0 &&
            AGENDAS[e.agenda]!.elect &&
            AGENDAS[e.agenda]!.id !== 'censure',
        )
      )
        svc.unlockAchievement('elected');
    }
    if (next.phase === 'over') {
      if (mode === 'play') {
        const won = next.winners.includes(0);
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        if (level !== 'humans') {
          const score = next.ps[0]!.vp;
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score,
            mode: `${level}-${next.players}-${next.target}`,
          });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'regent') svc.unlockAchievement('regent-win');
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

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase === 'over' || isHuman(currentPlayer(g))) return;
    const q = currentPlayer(g);
    const style: Style = mode === 'watch' ? (q % 2 === 0 ? 'regent' : 'envoy') : (level as Style);
    const step = g.act?.step;
    const delay =
      g.phase === 'strategy'
        ? 650
        : step === 'move' || step === 'build'
          ? 260
          : step === 'space'
            ? 520
            : step === 'land'
              ? 420
              : 600;
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
    const h = decide(g, 'regent', new Rng(g.round * 101 + g.log.length));
    setHint(h);
    if (h.t === 'activate') setSelected(h.sys);
  };

  const legal = myMove && g ? legalActions(g) : [];
  const done = legal.find((a) => a.t === 'done');
  useKeyboard((e) => {
    if (mode === 'menu' || !g) return false;
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      setSelected(null);
      return true;
    }
    if (!myMove) return false;
    if (k === 'd' && done) doAction(done);
    else if (k === 'r' && legal.some((a) => a.t === 'roll')) doAction({ t: 'roll' });
    else if (k === 'p' && legal.some((a) => a.t === 'pass')) doAction({ t: 'pass' });
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
        target={target}
        setLevel={setLevel}
        setCount={setCount}
        setFaction={setFaction}
        setTarget={setTarget}
        onStart={() => fresh('play', level, count, target, level === 'humans' ? -1 : faction)}
        onWatch={() => fresh('watch', 'regent', 3, 10, -1)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const a = g.act;
  const me = p >= 0 ? g.ps[p]! : null;
  const cardName = (c: number) => t(`card.${CARDS[c]!}`);
  const techName = (x: number) => t(`tech.${TECH_IDS[x]!}`);
  const objText = (o: number) => t(`obj.${OBJECTIVES[o]!.id}`);
  const unitName = (k: Kind) => t(`unit.${k}`);
  const fleetText = (f: Fleet) =>
    KINDS.filter((k) => f[k] > 0)
      .map((k) => `${f[k]} ${unitName(k)}`)
      .join(', ');

  // Highlights on the map.
  const targets = new Set<number>();
  if (myMove && g.phase === 'action') {
    if (a?.step === 'move') legal.forEach((x) => x.t === 'move' && targets.add(x.from));
  }
  const hintSys = hint?.t === 'activate' ? hint.sys : hint?.t === 'move' ? hint.from : null;

  let prompt: string;
  if (g.phase === 'over') {
    const best = Math.max(...g.ps.map((x) => x.vp));
    prompt =
      g.winners.length > 1
        ? t('prompt.tie', { n: best, who: g.winners.map(name).join(', ') })
        : t(isYou(g.winners[0]!) ? 'prompt.over.you' : 'prompt.over', {
            who: name(g.winners[0]!),
            n: g.ps[g.winners[0]!]!.vp,
          });
  } else if (!myMove) prompt = t('prompt.cpu', { who: name(p) });
  else if (g.phase === 'strategy') prompt = t('prompt.pick', { who: name(p) });
  else if (g.phase === 'follow')
    prompt = t('prompt.follow', { who: name(p), card: cardName(g.follow!.card) });
  else if (g.phase === 'status') prompt = t('prompt.status', { who: name(p) });
  else if (g.phase === 'council')
    prompt = t('prompt.council', {
      who: name(p),
      agenda: t(`agenda.${AGENDAS[g.council!.agenda]!.id}`),
      n: votesOf(g, p),
    });
  else if (!a) prompt = t('prompt.action', { who: name(p) });
  else if (a.step === 'move') prompt = t('prompt.move', { sys: sysName(a.sys) });
  else if (a.step === 'space') prompt = t('prompt.space', { sys: sysName(a.sys) });
  else if (a.step === 'land') prompt = t('prompt.land', { sys: sysName(a.sys) });
  else
    prompt = t('prompt.build', {
      sys: sysName(a.sys),
      n: spendable(g, p, 'res') + g.ps[p]!.tg - queueCost(a.queue),
      cap: productionAt(g, p, a.sys) - a.queue.length,
    });

  const describe = (x: Action): string => {
    switch (x.t) {
      case 'pick':
        return cardName(x.card);
      case 'activate':
        return t('btn.activate', { sys: sysName(x.sys) });
      case 'move':
        return `${sysName(x.from)}: ${x.n} ${unitName(x.kind)}`;
      case 'land':
        return `${t('btn.land', { planet: pname(x.planet) })} (${x.n})`;
      case 'build':
        return `+ ${unitName(x.kind)}`;
      case 'unbuild':
        return `− ${unitName(x.kind)}`;
      case 'play':
        return `${t('btn.play', { card: cardName(x.card) })}${choiceText(x.card, x.x)}`;
      case 'follow':
        return `${t('btn.follow')}${g.follow ? choiceText(g.follow.card, x.x) : ''}`;
      case 'score':
        return objText(x.obj);
      case 'vote':
        return optionText(x.option);
      case 'done':
        return t('btn.done');
      case 'roll':
        return t('btn.roll');
      case 'retreat':
        return t('btn.retreat');
      case 'decline':
        return t('btn.decline');
      case 'pass':
        return t('btn.pass');
      case 'skip':
        return t('btn.skip');
      case 'abstain':
        return t('btn.abstain');
    }
  };
  function choiceText(card: number, x: number) {
    if (x < 0) return '';
    const id = CARDS[card]!;
    if (id === 'industry') return `: ${pname(x)}`;
    if (id === 'research') return `: ${techName(x)}`;
    if (id === 'dominion') return `: ${objText(x)}`;
    return '';
  }
  function optionText(o: number) {
    if (!g!.council) return '';
    return AGENDAS[g!.council.agenda]!.elect ? name(o) : t(o === 0 ? 'vote.for' : 'vote.against');
  }

  const btn = (x: Action, label: string, id: string, primary = false) => (
    <button
      key={id}
      type="button"
      className={`btn${primary ? ' btn-primary' : ''}`}
      onClick={() => doAction(x)}
      data-testid={id}
      data-hint={hint ? JSON.stringify(hint) === JSON.stringify(x) : undefined}
    >
      {label}
    </button>
  );

  const controls = () => {
    if (!myMove || !me) return null;
    if (g.phase === 'strategy') return null;
    if (g.phase === 'follow') {
      const c = g.follow!.card;
      const xs = legal.filter((x): x is { t: 'follow'; x: number } => x.t === 'follow');
      return (
        <>
          <p className={styles.small}>{t(`card.${CARDS[c]!}.text`)}</p>
          <div className={styles.actions}>
            {xs.map((x) => btn(x, describe(x), x.x < 0 ? 'sc-follow' : `sc-follow-${x.x}`, true))}
            {btn({ t: 'decline' }, t('btn.decline'), 'sc-decline')}
          </div>
        </>
      );
    }
    if (g.phase === 'status') {
      const xs = legal.filter((x): x is { t: 'score'; obj: number } => x.t === 'score');
      return (
        <>
          <ul className={styles.list} data-testid="sc-goals">
            {g.revealed.map((o) => (
              <li key={o} data-done={me.scored.includes(o)}>
                <span>
                  <strong>{objText(o)}</strong>
                  <small>
                    {me.scored.includes(o)
                      ? t('goal.scored')
                      : canScore(g, p, o)
                        ? t('goal.ready')
                        : t('goal.not')}
                  </small>
                </span>
                <b>{t('obj.vp', { n: STAGE_VP[OBJECTIVES[o]!.stage] })}</b>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            {xs.map((x) =>
              btn(
                x,
                `${objText(x.obj)} (+${STAGE_VP[OBJECTIVES[x.obj]!.stage]})`,
                `sc-score-${x.obj}`,
                true,
              ),
            )}
            {btn({ t: 'skip' }, t('btn.skip'), 'sc-skip')}
          </div>
        </>
      );
    }
    if (g.phase === 'council') {
      const ag = AGENDAS[g.council!.agenda]!;
      const xs = legal.filter((x): x is { t: 'vote'; option: number } => x.t === 'vote');
      return (
        <>
          <p className={styles.small}>
            <strong>{t(`agenda.${ag.id}`)}</strong> — {t(`agenda.${ag.id}.text`)}
          </p>
          <div className={styles.actions}>
            {xs.map((x) => btn(x, optionText(x.option), `sc-vote-${x.option}`, true))}
            {btn({ t: 'abstain' }, t('btn.abstain'), 'sc-abstain')}
          </div>
        </>
      );
    }
    if (!a) {
      const plays = legal.filter(
        (x): x is { t: 'play'; card: number; x: number } => x.t === 'play',
      );
      const cards = [...new Set(plays.map((x) => x.card))];
      const canActivate = selected !== null && isLegal(g, { t: 'activate', sys: selected });
      return (
        <>
          <div className={styles.actions}>
            {canActivate &&
              btn(
                { t: 'activate', sys: selected },
                t('btn.activate', { sys: sysName(selected) }),
                'sc-activate',
                true,
              )}
            {legal.some((x) => x.t === 'pass') && btn({ t: 'pass' }, t('btn.pass'), 'sc-pass')}
          </div>
          {cards.map((c) => {
            const xs = plays.filter((x) => x.card === c);
            return (
              <div key={c} className={styles.actions} data-testid={`sc-card-${c}`}>
                <small className={styles.small}>{t(`card.${CARDS[c]!}.text`)}</small>
                {xs.length === 1 && xs[0]!.x < 0
                  ? btn(xs[0]!, t('btn.play', { card: cardName(c) }), `sc-play-${c}`)
                  : xs.map((x) =>
                      btn(
                        x,
                        x.x < 0
                          ? CARDS[c] === 'dominion'
                            ? `${cardName(c)}: ${t('btn.playNone')}`
                            : t('btn.play', { card: cardName(c) })
                          : `${cardName(c)}${choiceText(c, x.x)}`,
                        x.x < 0 ? `sc-play-${c}-none` : `sc-play-${c}-${x.x}`,
                      ),
                    )}
              </div>
            );
          })}
        </>
      );
    }
    if (a.step === 'move') {
      const moves = legal.filter((x): x is Move => x.t === 'move');
      const groups = new Map<string, Move>();
      for (const m of moves) {
        const k = `${m.from}-${m.kind}`;
        if ((groups.get(k)?.n ?? 0) < m.n) groups.set(k, m);
      }
      const rows = [...groups.values()].sort(
        (x, y) => Number(y.from === selected) - Number(x.from === selected) || x.from - y.from,
      );
      return (
        <>
          <h3>{t('panel.move')}</h3>
          <ul className={styles.list} data-testid="sc-moves">
            {rows.map((m) => (
              <li
                key={`${m.from}-${m.kind}`}
                data-hint={hint?.t === 'move' && hint.from === m.from && hint.kind === m.kind}
              >
                <span>
                  <strong>
                    {unitName(m.kind)} × {m.n}
                  </strong>
                  <small>{sysName(m.from)}</small>
                </span>
                <span className={styles.btns}>
                  {btn({ ...m, n: 1 }, t('btn.one'), `sc-move-${m.from}-${m.kind}`)}
                  {m.n > 1 && btn(m, t('btn.all', { n: m.n }), `sc-moveall-${m.from}-${m.kind}`)}
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            {btn({ t: 'done' }, t('btn.noMove'), 'sc-done', true)}
          </div>
        </>
      );
    }
    if (a.step === 'space') {
      const b = g.battle!;
      return (
        <section className={styles.panel} data-testid="sc-battle">
          <h3>{t('panel.battle')}</h3>
          <p className={styles.small}>
            {t('battle.att')}: {name(p)} — {fleetText(g.space[a.sys]![p]!)}
          </p>
          <p className={styles.small}>
            {t('battle.def')}: {name(b.defender)} — {fleetText(g.space[a.sys]![b.defender]!)}
          </p>
          {b.last && (
            <p className={styles.dice} data-testid="sc-dice">
              {t('battle.dice', {
                a: b.last.a.join(' '),
                d: b.last.d.join(' '),
                ah: b.last.ah,
                dh: b.last.dh,
              })}
            </p>
          )}
          <div className={styles.actions}>
            {btn({ t: 'roll' }, t('btn.roll'), 'sc-roll', true)}
            {legal.some((x) => x.t === 'retreat') &&
              btn({ t: 'retreat' }, t('btn.retreat'), 'sc-retreat')}
          </div>
        </section>
      );
    }
    if (a.step === 'land') {
      const inf = g.space[a.sys]![p]!.infantry;
      return (
        <>
          <ul className={styles.list} data-testid="sc-lands">
            {planetsIn(g, a.sys).map((pl) => (
              <li key={pl.id}>
                <span>
                  <strong>{pname(pl.id)}</strong>
                  <small>{planetLine(pl.id)}</small>
                </span>
                <span className={styles.btns}>
                  {btn({ t: 'land', planet: pl.id, n: 1 }, t('btn.one'), `sc-land-${pl.id}`)}
                  {inf > 1 &&
                    btn(
                      { t: 'land', planet: pl.id, n: inf },
                      t('btn.all', { n: inf }),
                      `sc-landall-${pl.id}`,
                      true,
                    )}
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>{btn({ t: 'done' }, t('btn.done'), 'sc-done')}</div>
        </>
      );
    }
    // Production.
    return (
      <>
        <h3>{t('panel.build')}</h3>
        <ul className={styles.list} data-testid="sc-builds">
          {KINDS.map((k) => {
            const n = a.queue.filter((x) => x === k).length;
            return (
              <li key={k}>
                <span>
                  <strong>
                    {unitName(k)} {n > 0 && `× ${n}`}
                  </strong>
                  <small>
                    {t('unit.stats', {
                      c: UNITS[k].cost,
                      h: hitOn(g, p, k, 'space'),
                      m: moveOf(g, p, k),
                    })}
                  </small>
                </span>
                <span className={styles.btns}>
                  {legal.some((x) => x.t === 'unbuild' && x.kind === k) &&
                    btn({ t: 'unbuild', kind: k }, '−', `sc-unbuild-${k}`)}
                  {legal.some((x) => x.t === 'build' && x.kind === k) &&
                    btn({ t: 'build', kind: k }, '+', `sc-build-${k}`)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className={styles.small} data-testid="sc-queue">
          {a.queue.length
            ? t('queue.cost', {
                units: a.queue.map(unitName).join(', '),
                n: queueCost(a.queue),
              })
            : t('queue.empty')}
        </p>
        <div className={styles.actions}>
          {btn(
            { t: 'done' },
            a.queue.length ? t('btn.build', { n: a.queue.length }) : t('btn.noBuild'),
            'sc-done',
            true,
          )}
        </div>
      </>
    );
  };

  function planetLine(id: number) {
    const pl = planet(g!, id)!;
    const d = PLANETS[id]!;
    return [
      t('system.planet', { r: d.r, i: d.i }),
      pl.owner === -2
        ? t('system.wardens')
        : pl.owner >= 0
          ? t('system.owner', { who: who(pl.owner) })
          : t('system.free'),
      pl.inf > 0 ? t('system.inf', { n: pl.inf }) : '',
      pl.dock ? t('system.dock') : '',
      pl.owner >= 0 && !pl.ready ? t('system.exhausted') : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  const sel = selected;
  const cardOwner = (c: number) => g.ps.findIndex((x) => x.cards.includes(c));

  return (
    <div className={styles.table} data-testid="sc-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="sc-prompt">
          {prompt}
        </p>
        <span className={styles.round} data-testid="sc-round">
          {t('prompt.round', { r: g.round, of: g.maxRounds })}
          <br />
          <span data-testid="sc-phase">
            {g.phase !== 'over' && t(`phase.${g.phase}`)}
            {a && ` · ${t(`step.${a.step}`)}`}
          </span>
        </span>
      </div>
      <div className={styles.layout}>
        <div className={styles.mapWrap}>
          <GalaxyMap
            g={g}
            t={t}
            sysName={sysName}
            targets={targets}
            selected={sel ?? hintSys}
            active={a?.sys ?? null}
            onPick={(s) => setSelected(s === selected ? null : s)}
          />
        </div>
        <div className={styles.side}>
          {g.phase === 'over' ? (
            <section className={styles.panel} data-testid="sc-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    fresh(
                      mode,
                      level,
                      g.players,
                      g.target,
                      mode === 'play' && level !== 'humans' ? g.ps[0]!.faction : -1,
                    )
                  }
                  data-testid="sc-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="sc-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            myMove &&
            g.phase !== 'strategy' && (
              <section className={styles.panel} data-testid="sc-controls">
                {controls()}
                <div className={styles.actions}>
                  <button type="button" className="btn" onClick={showHint} data-testid="sc-hint">
                    <Lightbulb size={16} /> {t('btn.hint')}
                  </button>
                </div>
                {hint && (
                  <p className={styles.small} data-testid="sc-hint-text">
                    {t('hint.say', { move: describe(hint) })}
                  </p>
                )}
              </section>
            )
          )}

          <section className={styles.panel}>
            <h3>{t('panel.cards')}</h3>
            <ul className={styles.list} data-testid="sc-cards">
              {CARDS.map((id, c) => {
                const o = cardOwner(c);
                const can = myMove && g.phase === 'strategy' && o < 0;
                return (
                  <li
                    key={id}
                    data-hint={hint?.t === 'pick' && hint.card === c}
                    data-done={o >= 0 && g.ps[o]!.played.includes(c)}
                  >
                    <span>
                      <strong>
                        {c + 1}. {cardName(c)}
                      </strong>
                      <small>{t(`card.${id}.text`)}</small>
                      <em>
                        {[
                          g.cardTg[c]! > 0 ? t('card.tg', { n: g.cardTg[c]! }) : '',
                          o >= 0 ? t('card.taken', { who: who(o) }) : '',
                          o >= 0 && g.ps[o]!.played.includes(c) ? t('card.played') : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </em>
                    </span>
                    {can && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => doAction({ t: 'pick', card: c })}
                        data-testid={`sc-pick-${c}`}
                      >
                        {t('btn.pick')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {myMove && g.phase === 'strategy' && (
              <div className={styles.actions}>
                <button type="button" className="btn" onClick={showHint} data-testid="sc-hint">
                  <Lightbulb size={16} /> {t('btn.hint')}
                </button>
                {hint && (
                  <span className={styles.small} data-testid="sc-hint-text">
                    {t('hint.say', { move: describe(hint) })}
                  </span>
                )}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="sc-players">
              {g.ps.map((x, q) => (
                <li
                  key={q}
                  className={styles.player}
                  data-current={g.phase !== 'over' && q === p}
                  style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  data-testid={`sc-player-${q}`}
                >
                  <span className={styles.swatch} aria-hidden />
                  <strong>
                    {name(q)}
                    {isYou(q) && ` · ${FACTIONS[x.faction]!.name[locale]}`}
                  </strong>
                  <b className={styles.vp}>{t('player.vp', { n: x.vp, of: g.target })}</b>
                  <small>
                    {[
                      t('player.line', {
                        t: x.tokens,
                        g: x.tg,
                        pl: owned(g, q).length,
                        tech: x.techs.length,
                      }),
                      x.cards.length
                        ? t('player.cards', { cards: x.cards.map(cardName).join(', ') })
                        : '',
                      x.passed ? t('player.passed') : '',
                      g.speaker === q ? t('player.speaker') : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                  <small>
                    {FACTIONS[x.faction]!.ability[locale]}
                    {x.techs.length > 0 && ` · ${x.techs.map((id) => t(`tech.${id}`)).join(', ')}`}
                  </small>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel} data-testid="sc-system">
            <h3>{sel === null ? t('panel.system') : sysName(sel)}</h3>
            {sel === null ? (
              <p className={styles.small}>{t('system.none')}</p>
            ) : (
              <>
                {['nebula', 'rift', 'field'].includes(kindAt(g, sel)) && (
                  <p className={styles.small}>{t(`kind.${kindAt(g, sel)}.text`)}</p>
                )}
                {planetsIn(g, sel).map((pl) => (
                  <p key={pl.id} className={styles.small}>
                    <strong>{pname(pl.id)}</strong> — {planetLine(pl.id)}
                  </p>
                ))}
                {g.ps.map((_, q) =>
                  combatShips(g.space[sel]![q]!) + g.space[sel]![q]!.infantry > 0 ? (
                    <p key={q} className={styles.small}>
                      {t('system.fleet', { who: name(q), units: fleetText(g.space[sel]![q]!) })}
                    </p>
                  ) : null,
                )}
                {g.tokens[sel]!.some(Boolean) && (
                  <p className={styles.small}>
                    {t('system.token', {
                      who: g.ps
                        .map((_, q) => q)
                        .filter((q) => g.tokens[sel]![q])
                        .map(name)
                        .join(', '),
                    })}
                  </p>
                )}
              </>
            )}
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.objectives')}</h3>
            <ul className={styles.list} data-testid="sc-objectives">
              {g.revealed.map((o) => (
                <li key={o}>
                  <span>
                    <strong>{objText(o)}</strong>
                    <em>
                      {g.ps
                        .map((_, q) => q)
                        .filter((q) => g.ps[q]!.scored.includes(o))
                        .map(name)
                        .join(', ')}
                    </em>
                  </span>
                  <b>{t('obj.vp', { n: STAGE_VP[OBJECTIVES[o]!.stage] })}</b>
                </li>
              ))}
            </ul>
            {g.council && (
              <div data-testid="sc-council">
                <p className={styles.small}>
                  <strong>
                    {t('panel.council')}: {t(`agenda.${AGENDAS[g.council.agenda]!.id}`)}
                  </strong>{' '}
                  — {t(`agenda.${AGENDAS[g.council.agenda]!.id}.text`)}
                </p>
                <p className={styles.small}>
                  {g.council.votes.length
                    ? g.council.votes
                        .map((v) =>
                          t('council.votes', {
                            who: name(v.p),
                            n: v.n,
                            option: optionText(v.option),
                          }),
                        )
                        .join(' · ')
                    : t('council.abstained')}
                </p>
              </div>
            )}
            <p className={styles.small} data-testid="sc-laws">
              <strong>{t('panel.laws')}:</strong>{' '}
              {g.laws.length
                ? g.laws.map((l) => t(`agenda.${AGENDAS[l]!.id}`)).join(', ')
                : t('laws.none')}
            </p>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="sc-log">
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
              <button type="button" className="btn" onClick={toMenu} data-testid="sc-to-menu">
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
      case 'round':
        return t('log.round', { r: e.r });
      case 'pick':
        return t('log.pick', {
          who: who(e.p),
          card: cardName(e.card),
          tg: e.tg ? t('log.pick.tg', { n: e.tg }) : '',
        });
      case 'activate':
        return t('log.activate', { who: who(e.p), sys: sysName(e.sys) });
      case 'battle':
        return e.won === null
          ? t('log.battle.draw', { sys: sysName(e.sys) })
          : t(e.won ? 'log.battle.won' : 'log.battle.lost', {
              who: who(e.p),
              sys: sysName(e.sys),
              d: who(e.d),
            });
      case 'retreat':
        return t('log.retreat', { who: who(e.p), sys: sysName(e.sys) });
      case 'claim':
        return t('log.claim', { who: who(e.p), planet: pname(e.planet) });
      case 'ground':
        return t(e.won ? 'log.ground.won' : 'log.ground.lost', {
          who: who(e.p),
          planet: pname(e.planet),
          from: who(e.from),
        });
      case 'build':
        return t('log.build', { who: who(e.p), n: e.n, sys: sysName(e.sys), c: e.cost });
      case 'play':
        return t('log.play', { who: who(e.p), card: cardName(e.card) + choiceText(e.card, e.x) });
      case 'follow':
        return t('log.follow', {
          who: who(e.p),
          card: cardName(e.card) + choiceText(e.card, e.x),
        });
      case 'pass':
        return t('log.pass', { who: who(e.p) });
      case 'score':
        return t('log.score', { who: who(e.p), obj: objText(e.obj), n: e.vp });
      case 'seat':
        return t('log.seat', { who: who(e.p) });
      case 'throne':
        return t('log.throne', { who: who(e.p) });
      case 'reveal':
        return t('log.reveal', { obj: objText(e.obj) });
      case 'agenda': {
        const ag = t(`agenda.${AGENDAS[e.agenda]!.id}`);
        if (e.option < 0) return t('log.agenda.none', { agenda: ag });
        const opt = AGENDAS[e.agenda]!.elect
          ? who(e.option)
          : t(e.option === 0 ? 'vote.for' : 'vote.against');
        return t('log.agenda', { agenda: ag, option: opt });
      }
      case 'end':
        return t('log.end');
    }
  }
}

/** A system's name: its planets, or what it is. */
export function systemName(g: Star, s: number, t: Translator) {
  const k = kindAt(g, s);
  if (k === 'nexus') return t('kind.nexus');
  const pls = planetsIn(g, s);
  if (pls.length) return pls.map((pl) => PLANETS[pl.id]!.name).join(' · ');
  return t(`kind.${k}`);
}

function Menu({
  t,
  locale,
  saved,
  level,
  count,
  faction,
  target,
  setLevel,
  setCount,
  setFaction,
  setTarget,
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
  target: number;
  setLevel: (l: Level) => void;
  setCount: (n: number) => void;
  setFaction: (n: number) => void;
  setTarget: (n: number) => void;
  onStart: () => void;
  onWatch: () => void;
  onResume: () => void;
}) {
  const r = saved.record;
  return (
    <div className={shared.menu} data-testid="sc-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="sc-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', {
                  n: saved.state.players,
                  r: saved.state.round,
                  of: saved.state.maxRounds,
                })}
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
                data-testid={`sc-count-${n}`}
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
                data-testid={`sc-level-${lv}`}
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
                data-testid="sc-faction-random"
              >
                <strong>{t('faction.random')}</strong>
              </button>
              {FACTIONS.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={faction === i}
                  onClick={() => setFaction(i)}
                  data-testid={`sc-faction-${f.id}`}
                >
                  <strong>{f.name[locale]}</strong>
                  <span>{f.ability[locale]}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset className={shared.group}>
          <legend>{t('menu.target')}</legend>
          <div className={shared.segmented}>
            {TARGETS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={target === n}
                onClick={() => setTarget(n)}
                data-testid={`sc-target-${n}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className={shared.hintText}>{t('target.hint', { n: MAX_ROUNDS })}</p>
        </fieldset>
        <div className={shared.menuActions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStart}
            data-testid="sc-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="sc-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="sc-record">
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
