/**
 * The Farmstead table: a menu (players, opponents or everyone here, new game, resume, watch the
 * AI, record), the action spaces (goods lying on them, who took them), the current farm as a 3×5
 * yard you click to build, plough, fence and sow, the step panel (room or stable, crop, baking,
 * improvements, done), every farm with goods, animals and family, the improvements for sale, the
 * log and the final score. Computer seats act after short pauses.
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
  bakeFood,
  currentPlayer,
  isLegal,
  isValidFarm,
  legalActions,
  newFarm,
  type Action,
  type Farm,
  type Farmer,
  type LogEntry,
} from './engine';
import styles from './Farmstead.module.css';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import { ANIMALS, CELLS, GOODS, HARVESTS, IMPROVEMENTS, ROUNDS, SPACES, type Stock } from './world';

type Level = 'farmhand' | 'steward' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['farmhand', 'steward', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Farm | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidFarm(s.state)) &&
    typeof s.record?.played === 'number'
  );
};
type CellAction = Extract<Action, { cell: number }>;

export function FarmTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('steward');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'steward', record: EMPTY });
  const [state, setState] = useState<Farm | null>(null);
  const [buildMode, setBuildMode] = useState<'room' | 'stable'>('room');
  const [crop, setCrop] = useState<'grain' | 'veg'>('grain');
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
  const seat = (p: number) => t('seat.name', { n: p + 1 });
  const name = (p: number) => (isYou(p) ? t('you') : seat(p));
  const who = (p: number) => (isYou(p) ? `${seat(p)} (${t('you.short')})` : seat(p));

  const start = (next: Farm, m: Mode, lv: Level) => {
    setState(next);
    stateRef.current = next;
    setMode(m);
    setLevel(lv);
    setHint(null);
    if (m === 'play') persist({ state: next, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number) =>
    start(newFarm(n, fixedSeed ?? randomSeed() >>> 0), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'steward', 3), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Farm, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    const added = next.log.slice(before.log.length);
    if (added.some((e) => e.k === 'harvest')) svc.playSound(SOUNDS.harvest);
    else if (a.t === 'place') svc.playSound(SOUNDS.place);
    else if (a.t === 'room' || a.t === 'stable' || a.t === 'pasture') svc.playSound(SOUNDS.build);
    else if (a.t === 'plough' || a.t === 'sow') svc.playSound(SOUNDS.field);
    else if (a.t === 'improve' || a.t === 'bake') svc.playSound(SOUNDS.coins);
    if (mode === 'play' && level !== 'humans') {
      const me = next.ps[0]!;
      if (me.members >= 4) svc.unlockAchievement('family');
      if (ANIMALS.every((k) => me.animals[k] > 0)) svc.unlockAchievement('menagerie');
      if (me.material === 'stone') svc.unlockAchievement('stone');
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
            if (level === 'steward') svc.unlockAchievement('steward-win');
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

  const g = state;
  const p = g ? currentPlayer(g) : -1;
  const myMove = !!g && g.phase !== 'over' && p >= 0 && isHuman(p);

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase === 'over' || isHuman(currentPlayer(g))) return;
    const q = currentPlayer(g);
    const style: Style = mode === 'watch' ? (q === 0 ? 'steward' : 'farmhand') : (level as Style);
    const delay = g.phase === 'sub' ? 300 : 600;
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
    const h = decide(g, 'steward', new Rng(g.round * 97 + g.log.length));
    setHint(h);
    if (h.t === 'room' || h.t === 'stable') setBuildMode(h.t);
    if (h.t === 'sow') setCrop(h.crop);
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
        saved={saved}
        level={level}
        count={count}
        setLevel={setLevel}
        setCount={setCount}
        onStart={() => fresh('play', level, count)}
        onWatch={() => fresh('watch', 'steward', 3)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const goodName = (k: string) =>
    (GOODS as readonly string[]).includes(k) ? t(`good.${k}`) : t(`animal.${k}`);
  const stockText = (s: Stock) =>
    Object.entries(s)
      .filter(([, v]) => v)
      .map(([k, v]) => `${v} ${goodName(k)}`)
      .join(', ');
  const spaceName = (i: number) => SPACES[i]!.name[locale];
  const impName = (i: number) => IMPROVEMENTS[i]!.name[locale];
  const step = g.sub?.steps[0];
  const viewer = myMove ? p : mode === 'play' && level !== 'humans' ? 0 : Math.max(0, p);

  // What clicking a cell of the viewer's farm does now.
  const cellAction = (c: number): CellAction | null => {
    if (!myMove || viewer !== p || g.phase !== 'sub') return null;
    const want =
      step === 'build'
        ? buildMode
        : step === 'plough'
          ? 'plough'
          : step === 'fence'
            ? 'pasture'
            : step === 'sow'
              ? 'sow'
              : null;
    if (!want) return null;
    const a = legal.find(
      (x): x is CellAction =>
        x.t === want && 'cell' in x && x.cell === c && (x.t !== 'sow' || x.crop === crop),
    );
    return a ?? null;
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
  else if (g.phase === 'work') prompt = t('prompt.work', { who: name(p), n: g.ps[p]!.workers });
  else prompt = t('prompt.step', { who: name(p), step: t(`step.${step}`) });

  const describe = (a: Action): string => {
    switch (a.t) {
      case 'place':
        return spaceName(a.space);
      case 'room':
      case 'stable':
      case 'plough':
      case 'pasture':
        return `${t(a.t === 'room' ? 'mode.room' : a.t === 'stable' ? 'mode.stable' : `step.${a.t === 'plough' ? 'plough' : 'fence'}`)} (${a.cell + 1})`;
      case 'sow':
        return `${goodName(a.crop)} (${a.cell + 1})`;
      case 'bake':
        return t('btn.bake', { n: a.n, food: bakeFood(g.ps[p]!, a.n) });
      case 'improve':
        return impName(a.imp);
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

  const farmGrid = (q: number, big: boolean) => {
    const f = g.ps[q]!;
    return (
      <div
        className={styles.yard}
        data-big={big}
        style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
        data-testid={big ? 'fs-farm' : `fs-farm-${q}`}
      >
        {Array.from({ length: CELLS }, (_, c) => {
          const cell = f.cells[c]!;
          const a = big ? cellAction(c) : null;
          const label = [
            t(`farm.cell.${cell.kind}`),
            cell.stable ? t('farm.cell.stable') : '',
            cell.crop ? `${cell.n} ${goodName(cell.crop)}` : '',
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <button
              key={c}
              type="button"
              className={styles.cell}
              data-kind={cell.kind}
              data-material={cell.kind === 'room' ? f.material : undefined}
              data-target={!!a}
              data-hint={!!a && isHint(a)}
              disabled={!a}
              onClick={() => a && doAction(a)}
              aria-label={label}
              title={label}
              data-testid={big ? `fs-cell-${c}` : undefined}
            >
              {cell.crop && (
                <span className={styles.crop} data-crop={cell.crop}>
                  {cell.n}
                </span>
              )}
              {cell.stable && <span className={styles.stable} aria-hidden />}
            </button>
          );
        })}
      </div>
    );
  };
  const farmLine = (f: Farmer) =>
    t('farm.line', { n: f.members, house: t(`mat.${f.material}`), b: f.begging });

  const controls = () => {
    if (!myMove || g.phase !== 'sub') return null;
    const f = g.ps[p]!;
    return (
      <section className={styles.panel} data-testid="fs-controls">
        <h3>{t(`step.${step}`)}</h3>
        {step === 'build' && (
          <div className={shared.segmented}>
            {(['room', 'stable'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={buildMode === m}
                onClick={() => setBuildMode(m)}
                data-testid={`fs-mode-${m}`}
              >
                {t(`mode.${m}`)}
              </button>
            ))}
          </div>
        )}
        {step === 'sow' && (
          <div className={shared.segmented}>
            {(['grain', 'veg'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={crop === k}
                disabled={f.goods[k] === 0}
                onClick={() => setCrop(k)}
                data-testid={`fs-crop-${k}`}
              >
                {goodName(k)} ({f.goods[k]})
              </button>
            ))}
          </div>
        )}
        {step === 'bake' && (
          <div className={styles.actions}>
            {legal
              .filter((x): x is { t: 'bake'; n: number } => x.t === 'bake')
              .map((x) => btn(x, describe(x), `fs-bake-${x.n}`))}
          </div>
        )}
        {step === 'improve' && <p className={styles.small}>{t('panel.imps')} ↓</p>}
        <div className={styles.actions}>
          {btn(
            { t: 'done' },
            step === 'build' || step === 'fence' || step === 'sow' ? t('btn.done') : t('btn.skip'),
            'fs-done',
            true,
          )}
          <button type="button" className="btn" onClick={showHint} data-testid="fs-hint">
            <Lightbulb size={16} /> {t('btn.hint')}
          </button>
        </div>
        {hint && (
          <p className={styles.small} data-testid="fs-hint-text">
            {t('hint.say', { move: describe(hint) })}
          </p>
        )}
      </section>
    );
  };

  const nextHarvest = HARVESTS.includes(g.round);

  return (
    <div className={styles.table} data-testid="fs-table">
      <div className={styles.top}>
        <p className={styles.prompt} aria-live="polite" data-testid="fs-prompt">
          {prompt}
        </p>
        <span className={styles.round} data-testid="fs-round">
          {t('prompt.round', { r: g.round, of: ROUNDS })}
          <br />
          <small>{t('prompt.harvest', { list: HARVESTS.join(', ') })}</small>
        </span>
      </div>
      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.panel}>
            <h3>
              {t('panel.board')}
              {nextHarvest && <em className={styles.harvest}> · {t('space.next')}</em>}
            </h3>
            <ul className={styles.board} data-testid="fs-board">
              {g.open.map((i) => {
                const occ = g.occupied[i]!;
                const a: Action = { t: 'place', space: i };
                const ok =
                  myMove &&
                  g.phase === 'work' &&
                  legal.some((x) => x.t === 'place' && x.space === i);
                const s = SPACES[i]!;
                const lying = stockText(g.stock[i]!);
                const text =
                  s.accrue || s.take ? lying || stockText(s.take ?? {}) : t(`space.${s.id}`);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      className={styles.space}
                      data-stage={s.stage ?? 0}
                      data-occupied={occ >= 0}
                      data-hint={isHint(a)}
                      style={
                        occ >= 0 ? { ['--pc' as string]: `var(--player-${occ + 1})` } : undefined
                      }
                      disabled={!ok}
                      onClick={() => doAction(a)}
                      data-testid={`fs-space-${s.id}`}
                    >
                      <strong>{spaceName(i)}</strong>
                      <small>{text || '—'}</small>
                      {occ >= 0 && <em>{t('space.taken', { who: who(occ) })}</em>}
                    </button>
                  </li>
                );
              })}
            </ul>
            {myMove && g.phase === 'work' && (
              <div className={styles.actions}>
                <button type="button" className="btn" onClick={showHint} data-testid="fs-hint">
                  <Lightbulb size={16} /> {t('btn.hint')}
                </button>
                {hint && (
                  <span className={styles.small} data-testid="fs-hint-text">
                    {t('hint.say', { move: describe(hint) })}
                  </span>
                )}
              </div>
            )}
          </section>
          <section className={styles.panel}>
            <h3>{isYou(viewer) ? t('panel.farm.you') : t('panel.farm', { who: name(viewer) })}</h3>
            {farmGrid(viewer, true)}
            <p className={styles.small}>{farmLine(g.ps[viewer]!)}</p>
          </section>
        </div>
        <div className={styles.side}>
          {g.phase === 'over' && g.scores ? (
            <section className={styles.panel} data-testid="fs-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <ul className={styles.players} data-testid="fs-score">
                {g.scores.map((s, q) => (
                  <li
                    key={q}
                    className={styles.player}
                    style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  >
                    <span className={styles.swatch} aria-hidden />
                    <strong>{name(q)}</strong>
                    <b className={styles.vp}>{s.total}</b>
                    <small>
                      {t('score.line', {
                        fi: s.fields,
                        pa: s.pastures,
                        gr: s.grain,
                        ve: s.veg,
                        sh: s.sheep,
                        pi: s.pig,
                        co: s.cow,
                        em: s.empty,
                        st: s.stables,
                        ro: s.rooms,
                        fa: s.family,
                        be: s.begging,
                        im: s.improvements,
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
                  data-testid="fs-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="fs-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            controls()
          )}

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="fs-players">
              {g.ps.map((f, q) => (
                <li
                  key={q}
                  className={styles.player}
                  data-current={g.phase !== 'over' && q === p}
                  style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  data-testid={`fs-player-${q}`}
                >
                  <span className={styles.swatch} aria-hidden />
                  <strong>{name(q)}</strong>
                  <b className={styles.vp}>{g.phase === 'over' ? g.scores![q]!.total : ''}</b>
                  <span className={styles.goods}>
                    {[...GOODS, ...ANIMALS].map((k) => (
                      <span
                        key={k}
                        data-zero={
                          ((GOODS as readonly string[]).includes(k)
                            ? f.goods[k as never]
                            : f.animals[k as never]) === 0
                        }
                      >
                        {goodName(k)}
                        <b>
                          {(GOODS as readonly string[]).includes(k)
                            ? f.goods[k as keyof Farmer['goods']]
                            : f.animals[k as keyof Farmer['animals']]}
                        </b>
                      </span>
                    ))}
                  </span>
                  <small>
                    {farmLine(f)}
                    {f.imps.length > 0 && ` · ${f.imps.map(impName).join(', ')}`}
                  </small>
                  {q !== viewer && farmGrid(q, false)}
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.imps')}</h3>
            <ul className={styles.imps} data-testid="fs-imps">
              {IMPROVEMENTS.map((imp, i) => {
                const owner = g.impOwner[i]!;
                return (
                  <li
                    key={imp.id}
                    data-owned={owner >= 0}
                    data-hint={hint?.t === 'improve' && hint.imp === i}
                  >
                    <span>
                      <strong>
                        {imp.name[locale]} <em>({stockText(imp.cost)})</em>
                      </strong>
                      <small>
                        {imp.text[locale]} {t('imp.vp', { n: imp.vp })}
                        {owner >= 0 && ` · ${t('imp.owner', { who: who(owner) })}`}
                      </small>
                    </span>
                    {myMove &&
                      step === 'improve' &&
                      owner < 0 &&
                      btn({ t: 'improve', imp: i }, t('btn.buy'), `fs-imp-${imp.id}`)}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="fs-log">
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
              <button type="button" className="btn" onClick={toMenu} data-testid="fs-to-menu">
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
        return t('log.round', { r: e.r, space: spaceName(e.space) });
      case 'place': {
        const got = stockText(e.got);
        return t('log.place', {
          who: who(e.p),
          space: spaceName(e.space),
          got: got ? ` (${got})` : '',
        });
      }
      case 'room':
      case 'stable':
      case 'plough':
      case 'grow':
        return t(`log.${e.k}`, { who: who(e.p) });
      case 'pasture':
        return t('log.pasture', { who: who(e.p), c: e.cost });
      case 'sow':
        return t('log.sow', { who: who(e.p), crop: goodName(e.crop).toLowerCase() });
      case 'bake':
        return t('log.bake', { who: who(e.p), n: e.n, food: e.food });
      case 'improve':
        return t('log.improve', { who: who(e.p), imp: impName(e.imp) });
      case 'renovate':
        return t('log.renovate', { who: who(e.p), mat: t(`mat.${e.to}`) });
      case 'cooked':
        return t('log.cooked', { who: who(e.p), food: e.food, lost: e.lost });
      case 'harvest':
        return t('log.harvest', { r: e.r });
      case 'fed':
        return t('log.fed', {
          who: who(e.p),
          beg: e.begging ? t('log.fed.beg', { n: e.begging }) : '',
        });
      case 'born':
        return t('log.born', { who: who(e.p), animal: goodName(e.animal).toLowerCase() });
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
    <div className={shared.menu} data-testid="fs-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="fs-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', { n: saved.state.players, r: saved.state.round, of: ROUNDS })}
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
                data-testid={`fs-count-${n}`}
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
                data-testid={`fs-level-${lv}`}
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
            data-testid="fs-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="fs-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="fs-record">
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
