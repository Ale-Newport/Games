/**
 * The Fading Empires table: a menu (players, opponents or all human, new game, resume, watch the
 * AI, record), the valley, the row of pairings, the active empire with its bands, the buttons of
 * each phase (pick, march, decline, abandon, take or roll the die, stop, place, end turn), players
 * (coins, regions, active and declined peoples), hints and the log. Computer seats act after short
 * pauses.
 */
import { Bot, Lightbulb, Play, RotateCcw, Trophy } from 'lucide-react';
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
  activeRegions,
  cost,
  heldRegions,
  isLegal,
  isValidFading,
  legalActions,
  newFading,
  targets as targetsOf,
  turnCoins,
  type Action,
  type Fading,
  type LogEntry,
} from './engine';
import styles from './FadingEmpires.module.css';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import { ValleyBoard } from './ValleyBoard';
import { PEOPLES, REGIONS, TRAITS } from './world';

type Level = 'raider' | 'warlord' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['raider', 'warlord', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Fading | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidFading(s.state)) &&
    typeof s.record?.played === 'number'
  );
};

export function FadingTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('warlord');
  const [count, setCount] = useState(3);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'warlord', record: EMPTY });
  const [state, setState] = useState<Fading | null>(null);
  const [pick, setPick] = useState<{ key: string; r: number } | null>(null);
  const [amount, setAmount] = useState<1 | 0>(1);
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
  const name = (p: number) => (p < 0 ? '—' : isYou(p) ? t('you') : t(`colour.${p}`));
  const rname = (r: number) => REGIONS[r]!.name[locale];
  // English reads “Wealthy Delvers”; Spanish names the people first (“Excavadores · Ricos”).
  const pname = (people: number, trait: number) =>
    locale === 'es'
      ? `${PEOPLES[people]!.name.es} · ${TRAITS[trait]!.name.es}`
      : `${TRAITS[trait]!.name.en} ${PEOPLES[people]!.name.en}`;

  const start = (g: Fading, m: Mode, lv: Level) => {
    setState(g);
    stateRef.current = g;
    setMode(m);
    setLevel(lv);
    setPick(null);
    setHint(null);
    if (m === 'play') persist({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number) =>
    start(newFading(n, fixedSeed ?? randomSeed() >>> 0), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'warlord', 4), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Fading, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    if (a.t === 'take' || a.t === 'gamble')
      svc.playSound(a.t === 'gamble' ? SOUNDS.die : SOUNDS.take);
    else if (a.t === 'pick') svc.playSound(SOUNDS.pick);
    else if (a.t === 'decline') svc.playSound(SOUNDS.decline);
    else if (a.t === 'done') svc.playSound(SOUNDS.coins);
    if (mode === 'play' && level !== 'humans' && before.turn === 0) {
      if (activeRegions(next, 0).length >= 8) svc.unlockAchievement('sprawl');
      if (a.t === 'decline') svc.unlockAchievement('decline');
      if (
        a.t === 'gamble' &&
        next.log.some((e) => e.k === 'gamble' && e.ok && e.p === 0 && e.r === a.r)
      )
        svc.unlockAchievement('lucky');
    }
    if (next.phase.k === 'over') {
      if (mode === 'play') {
        const won = next.winners.includes(0);
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        if (level !== 'humans') {
          const score = next.ps[0]!.coins;
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score,
            mode: `${level}-${next.players}`,
          });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'warlord') svc.unlockAchievement('warlord-win');
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
  const p = g ? g.turn : 0;
  const myMove = !!g && g.phase.k !== 'over' && isHuman(p);
  const phaseKey = g ? `${g.round}:${g.turn}:${g.phase.k}` : '';
  const selected = pick && pick.key === phaseKey ? pick.r : null;

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase.k === 'over' || isHuman(g.turn)) return;
    const style: Style =
      mode === 'watch' ? (g.turn % 2 === 0 ? 'warlord' : 'raider') : (level as Style);
    const k = g.phase.k;
    const delay = k === 'redeploy' ? 110 : k === 'pick' ? 800 : 480;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur && cur.phase.k !== 'over') doAction(decide(cur, style, rngRef.rng));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  const showHint = () => {
    if (!g || !myMove) return;
    servicesRef.current.playSound(SOUNDS.hint);
    setHint(decide(g, 'warlord', new Rng(g.round * 37 + g.turn + g.log.length)));
  };

  const onRegion = (r: number) => {
    const cur = stateRef.current;
    if (!cur || !myMove) return;
    const ph = cur.phase;
    if (ph.k === 'conquer') {
      const a = legalActions(cur).find((x) => 'r' in x && x.r === r);
      if (a?.t === 'take') doAction(a);
      else setPick({ key: phaseKey, r });
    } else if (ph.k === 'redeploy') {
      let s = cur;
      const n = amount === 0 ? s.ps[p]!.hand : 1;
      for (let k = 0; k < n && isLegal(s, { t: 'place', r }); k++) s = act(s, { t: 'place', r });
      if (s !== cur) commit(s, { t: 'place', r });
    } else if (ph.k === 'start') setPick({ key: phaseKey, r });
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myMove) return false;
    const k = e.key.toLowerCase();
    const ph = g.phase.k;
    if (k === 'm' && ph === 'start') doAction({ t: 'march' });
    else if (k === 'd' && legalActions(g).some((a) => a.t === 'decline'))
      doAction({ t: 'decline' });
    else if (k === 's' && ph === 'conquer') doAction({ t: 'stop' });
    else if (k === 'e' && legalActions(g).some((a) => a.t === 'done')) doAction({ t: 'done' });
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase.k !== 'over') persist({ state: cur, level });
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
        onWatch={() => fresh('watch', 'warlord', 4)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const ph = g.phase;
  const me = g.ps[p]!;
  const legal = myMove ? legalActions(g) : [];
  const targets = new Set<number>();
  const costs = new Map<number, number>();
  if (myMove && ph.k === 'conquer')
    for (const r of targetsOf(g, p)) {
      targets.add(r);
      costs.set(r, cost(g, p, r));
    }
  if (myMove && ph.k === 'redeploy' && me.hand > 0)
    activeRegions(g, p).forEach((r) => targets.add(r));
  if (myMove && ph.k === 'start') activeRegions(g, p).forEach((r) => targets.add(r));
  const hintR = hint && 'r' in hint ? hint.r : null;

  let prompt: string;
  if (ph.k === 'over') {
    const best = Math.max(...g.ps.map((x) => x.coins));
    prompt =
      g.winners.length > 1
        ? t('prompt.tie', { n: best, who: g.winners.map(name).join(', ') })
        : t(isYou(g.winners[0]!) ? 'prompt.over.you' : 'prompt.over', {
            who: name(g.winners[0]!),
            n: best,
          });
  } else if (!myMove) prompt = t('prompt.cpu', { who: name(p) });
  else if (ph.k === 'pick') prompt = t('prompt.pick');
  else if (ph.k === 'start') prompt = t('prompt.start');
  else if (ph.k === 'conquer')
    prompt = t(activeRegions(g, p).length ? 'prompt.conquer' : 'prompt.conquer.first', {
      n: me.hand,
    });
  else
    prompt =
      me.hand > 0 && activeRegions(g, p).length
        ? t('prompt.redeploy', { n: me.hand })
        : t('prompt.redeploy.done');

  const describe = (a: Action): string => {
    switch (a.t) {
      case 'pick':
        return `${t('btn.pick')}: ${pname(g.row[a.i]!.people, g.row[a.i]!.trait)}`;
      case 'take':
        return rname(a.r);
      case 'gamble':
        return t('btn.gamble', { r: rname(a.r), n: cost(g, p, a.r) - me.hand });
      case 'place':
        return rname(a.r);
      case 'abandon':
        return t('btn.abandon', { r: rname(a.r) });
      case 'march':
        return t('btn.march');
      case 'decline':
        return t('btn.decline');
      case 'stop':
        return t('btn.stop');
      case 'done':
        return t('btn.done', { n: turnCoins(g, p, ph.k === 'redeploy' ? ph.heldTaken : 0) });
    }
  };
  const gambleSel = selected !== null && legal.find((a) => a.t === 'gamble' && a.r === selected);
  const abandonSel = selected !== null && legal.find((a) => a.t === 'abandon' && a.r === selected);

  return (
    <div className={styles.table} data-testid="fe-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="fe-prompt">
          {prompt}
        </p>
        <span className={styles.round} data-testid="fe-round">
          {t('prompt.round', { r: Math.min(g.round, g.rounds), of: g.rounds })}
        </span>
      </div>
      <div className={styles.layout}>
        <div className={styles.mapWrap}>
          <ValleyBoard
            g={g}
            t={t}
            locale={locale}
            name={name}
            targets={targets}
            costs={costs}
            selected={selected ?? hintR}
            onPick={onRegion}
          />
        </div>
        <div className={styles.side}>
          {ph.k === 'over' ? (
            <section className={styles.panel} data-testid="fe-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fresh(mode, level, g.players)}
                  data-testid="fe-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="fe-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            myMove && (
              <section className={styles.panel} data-testid="fe-controls">
                {me.active && (
                  <p className={styles.empire}>
                    <span>
                      <strong>{pname(me.active.people, me.active.trait)}</strong> ·{' '}
                      <span data-testid="fe-hand">{t('empire.hand', { n: me.hand })}</span>
                    </span>
                    <small>
                      {PEOPLES[me.active.people]!.text[locale]}{' '}
                      {TRAITS[me.active.trait]!.text[locale]}
                    </small>
                  </p>
                )}
                <div className={styles.actions}>
                  {ph.k === 'start' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => doAction({ t: 'march' })}
                        data-testid="fe-march"
                      >
                        {t('btn.march')}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => doAction({ t: 'decline' })}
                        data-testid="fe-decline"
                      >
                        {t('btn.decline')}
                      </button>
                      {abandonSel && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => doAction(abandonSel)}
                          data-testid="fe-abandon"
                        >
                          {describe(abandonSel)}
                        </button>
                      )}
                    </>
                  )}
                  {ph.k === 'conquer' && (
                    <>
                      {gambleSel && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => doAction(gambleSel)}
                          data-testid="fe-gamble"
                        >
                          {describe(gambleSel)}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn"
                        onClick={() => doAction({ t: 'stop' })}
                        data-testid="fe-stop"
                      >
                        {t('btn.stop')}
                      </button>
                    </>
                  )}
                  {ph.k === 'redeploy' && me.hand > 0 && activeRegions(g, p).length > 0 && (
                    <div className={shared.segmented}>
                      {([1, 0] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={amount === n}
                          onClick={() => setAmount(n)}
                          data-testid={`fe-amount-${n}`}
                        >
                          {n === 0 ? t('opt.all') : n}
                        </button>
                      ))}
                    </div>
                  )}
                  {legal.some((a) => a.t === 'done') && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => doAction({ t: 'done' })}
                      data-testid="fe-done"
                    >
                      {describe({ t: 'done' })}
                    </button>
                  )}
                  {ph.k === 'redeploy' && legal.some((a) => a.t === 'decline') && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => doAction({ t: 'decline' })}
                      data-testid="fe-decline"
                    >
                      {t('btn.decline')}
                    </button>
                  )}
                  <button type="button" className="btn" onClick={showHint} data-testid="fe-hint">
                    <Lightbulb size={16} /> {t('btn.hint')}
                  </button>
                </div>
                {hint && (
                  <p className={styles.small} data-testid="fe-hint-text">
                    {t('hint.say', { move: describe(hint) })}
                  </p>
                )}
              </section>
            )
          )}

          <section className={styles.panel} data-testid="fe-row">
            <h3>{t('panel.row')}</h3>
            <ol className={styles.row}>
              {g.row.map((c, i) => {
                const can = myMove && ph.k === 'pick' && i <= me.coins;
                return (
                  <li key={`${c.people}-${c.trait}`} data-hint={hint?.t === 'pick' && hint.i === i}>
                    <span>
                      <strong>{pname(c.people, c.trait)}</strong>
                      <small>
                        {PEOPLES[c.people]!.bands + TRAITS[c.trait]!.bands} ·{' '}
                        {PEOPLES[c.people]!.text[locale]} {TRAITS[c.trait]!.text[locale]}
                      </small>
                    </span>
                    <em>
                      {c.coins > 0 && <b>{t('row.coins', { n: c.coins })}</b>}{' '}
                      {i > 0 && t('row.cost', { n: i })}
                    </em>
                    {ph.k === 'pick' && myMove && (
                      <button
                        type="button"
                        className="btn"
                        disabled={!can}
                        onClick={() => doAction({ t: 'pick', i })}
                        data-testid={`fe-pick-${i}`}
                      >
                        {t('btn.pick')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="fe-players">
              {g.ps.map((x, q) => (
                <li
                  key={q}
                  className={styles.player}
                  data-current={ph.k !== 'over' && q === p}
                  style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  data-testid={`fe-player-${q}`}
                >
                  <span className={styles.swatch} aria-hidden />
                  <strong>{name(q)}</strong>
                  <b className={styles.coins}>{t('table.coins', { n: x.coins })}</b>
                  <small>
                    {[
                      t('table.regions', { n: heldRegions(g, q).length }),
                      x.active
                        ? t('table.active', { people: pname(x.active.people, x.active.trait) })
                        : '',
                      x.declined
                        ? t('table.declined', { people: PEOPLES[x.declined.people]!.name[locale] })
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="fe-log">
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
              <button type="button" className="btn" onClick={toMenu} data-testid="fe-to-menu">
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
      case 'pick':
        return t('log.pick', { who: name(e.p), people: pname(e.people, e.trait) });
      case 'take':
        return e.from !== null && e.from !== e.p
          ? t('log.take.from', { who: name(e.p), r: rname(e.r), from: name(e.from) })
          : t('log.take', { who: name(e.p), r: rname(e.r) });
      case 'gamble':
        return t(e.ok ? 'log.gamble.ok' : 'log.gamble.no', {
          who: name(e.p),
          n: e.roll,
          r: rname(e.r),
        });
      case 'decline':
        return t('log.decline', { who: name(e.p), people: PEOPLES[e.people]!.name[locale] });
      case 'score':
        return t('log.score', { who: name(e.p), n: e.coins });
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
    <div className={shared.menu} data-testid="fe-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="fe-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', {
                  n: saved.state.players,
                  r: Math.min(saved.state.round, saved.state.rounds),
                  of: saved.state.rounds,
                })}
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
                data-testid={`fe-count-${n}`}
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
                data-testid={`fe-level-${lv}`}
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
            data-testid="fe-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="fe-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="fe-record">
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
