/**
 * The Tile Realm table: a menu (players, opponents or all human, new game, resume, watch the AI,
 * record), the realm (scrollable, zoomable), the tile in hand with rotation, the squares where it
 * fits, a placed-but-unconfirmed tile with its warden spots, confirm / no warden / cancel, hints,
 * players (score, wardens left), tiles left and the log. Computer seats act after a pause.
 */
import { Bot, Lightbulb, Play, RotateCcw, RotateCw, Trophy, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { decide, type Style } from './ai';
import {
  act,
  boardIndex,
  fits,
  frontier,
  isLegal,
  isValidRealm,
  newRealm,
  supply,
  wardenSpots,
  WARDENS,
  type Action,
  type LogEntry,
  type Realm,
} from './engine';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import { TileArt, TileBoard, type Ghost } from './TileBoard';
import styles from './TileRealm.module.css';
import { TILE_TYPES } from './tiles';

type Level = 'apprentice' | 'master' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['apprentice', 'master', 'humans'];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Realm | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidRealm(s.state)) &&
    typeof s.record?.played === 'number'
  );
};
const ZOOMS = [44, 60, 80, 104];

export function RealmTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('master');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'master', record: EMPTY });
  const [state, setState] = useState<Realm | null>(null);
  const [rot, setRot] = useState(0);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [zoom, setZoom] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2,
  );
  const [hinted, setHinted] = useState(false);
  const stateRef = useLatest(state);
  const savedRef = useLatest(saved);
  const rngRef = useMemo(() => ({ rng: new Rng(randomSeed()) }), []);
  const scroller = useRef<HTMLDivElement>(null);

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
  const name = (p: number) => (isYou(p) ? t('you') : t(`colour.${p}`));

  const start = (g: Realm, m: Mode, lv: Level) => {
    setState(g);
    stateRef.current = g;
    setMode(m);
    setLevel(lv);
    setGhost(null);
    setRot(0);
    if (m === 'play') persist({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number) =>
    start(newRealm(n, fixedSeed ?? randomSeed() >>> 0), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'master', 3), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Realm, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setGhost(null);
    setRot(0);
    setHinted(false);
    // Entries after this move's placement: did it score anything?
    const at = next.log.map((e) => e.k).lastIndexOf('place');
    const scored = next.log.slice(at + 1).some((e) => e.k === 'score');
    svc.playSound(scored ? SOUNDS.score : a.warden !== null ? SOUNDS.warden : SOUNDS.place);
    if (mode === 'play' && level !== 'humans') {
      const mine = next.log
        .slice(-6)
        .filter((e) => e.k === 'score' && !e.final && e.players.includes(0));
      if (mine.some((e) => e.k === 'score' && e.kind === 'town' && e.tiles >= 4))
        svc.unlockAchievement('big-town');
      if (mine.some((e) => e.k === 'score' && e.kind === 'shrine')) svc.unlockAchievement('shrine');
    }
    if (next.phase === 'over') {
      if (mode === 'play') {
        const won = next.winners.includes(0);
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        if (level !== 'humans') {
          const score = next.scores[0]!;
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score,
            mode: `${level}-${next.players}`,
          });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'master') svc.unlockAchievement('master-win');
          }
          if (score >= 100) svc.unlockAchievement('hundred');
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
  const myMove = !!g && g.phase === 'place' && isHuman(g.turn);

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase === 'over' || isHuman(g.turn)) return;
    const style: Style =
      mode === 'watch' ? (g.turn % 2 === 0 ? 'master' : 'apprentice') : (level as Style);
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur && cur.phase === 'place') doAction(decide(cur, style, rngRef.rng));
    }, 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  // Cells where the tile in hand fits in some rotation.
  const fitting = useMemo(() => {
    if (!g || g.current === null || !myMove) return [] as [number, number][];
    const idx = boardIndex(g);
    return frontier(g).filter(([x, y]) =>
      [0, 1, 2, 3].some((r) => fits(g, idx, x, y, g.current!, r)),
    );
  }, [g, myMove]);

  /** Places the tile tentatively at (x, y), in the current rotation or the next one that fits. */
  const tryCell = (x: number, y: number, from = rot) => {
    const cur = stateRef.current;
    if (!cur || cur.current === null) return;
    const idx = boardIndex(cur);
    for (let k = 0; k < 4; k++) {
      const r = (from + k) % 4;
      if (fits(cur, idx, x, y, cur.current, r)) {
        setRot(r);
        setGhost({ x, y, r, spots: wardenSpots(cur, x, y, cur.current, r), warden: null });
        return;
      }
    }
  };
  const rotate = (d: number) => {
    const r = (rot + d + 4) % 4;
    if (ghost && g && g.current !== null) {
      // Turn the tile on its square to the next rotation that fits there.
      const idx = boardIndex(g);
      for (let k = 0; k < 4; k++) {
        const rr = (r + d * k + 8) % 4;
        if (fits(g, idx, ghost.x, ghost.y, g.current, rr)) {
          setRot(rr);
          setGhost({
            ...ghost,
            r: rr,
            spots: wardenSpots(g, ghost.x, ghost.y, g.current, rr),
            warden: null,
          });
          return;
        }
      }
    } else setRot(r);
  };
  const confirm = (warden: number | null) => {
    if (!ghost) return;
    doAction({ t: 'place', x: ghost.x, y: ghost.y, r: ghost.r, warden });
  };
  const showHint = () => {
    if (!g || !myMove) return;
    servicesRef.current.playSound(SOUNDS.hint);
    const a = decide(g, 'master', new Rng(g.bag.length * 31 + g.turn));
    setRot(a.r);
    setGhost({
      x: a.x,
      y: a.y,
      r: a.r,
      spots: wardenSpots(g, a.x, a.y, g.current!, a.r),
      warden: a.warden,
    });
    setHinted(true);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myMove) return false;
    const k = e.key;
    if (k === 'r' || k === 'R') rotate(e.shiftKey ? -1 : 1);
    else if (k === 'Enter' && ghost && (e.target as HTMLElement | null)?.tagName !== 'BUTTON')
      confirm(ghost.warden);
    else if ((k === 'n' || k === 'N') && ghost) confirm(null);
    else if (k === 'h' || k === 'H') showHint();
    else if (k === 'Escape' && ghost) setGhost(null);
    else if (k === '+' || k === '=') setZoom((z) => Math.min(ZOOMS.length - 1, z + 1));
    else if (k === '-') setZoom((z) => Math.max(0, z - 1));
    else return false;
    return true;
  });

  // Keep the start of the realm in view when a game begins.
  const boardKey = g ? `${g.seed}:${g.board.length === 1}` : '';
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }
  }, [boardKey]);

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
        onWatch={() => fresh('watch', 'master', 3)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const over = g.phase === 'over';
  let prompt: string;
  if (over) {
    const best = Math.max(...g.scores);
    prompt =
      g.winners.length > 1
        ? t('prompt.tie', { n: best, who: g.winners.map(name).join(', ') })
        : t(isYou(g.winners[0]!) ? 'prompt.over.you' : 'prompt.over', {
            who: name(g.winners[0]!),
            n: best,
          });
  } else if (!myMove) prompt = t('prompt.cpu', { who: name(g.turn) });
  else prompt = ghost ? t('prompt.warden') : t('prompt.place');

  const last = g.log.length ? [...g.log].reverse().find((e) => e.k === 'place') : undefined;

  return (
    <div className={styles.table} data-still={services.reducedMotion} data-testid="tr-table">
      <p className={styles.prompt} aria-live="polite" data-testid="tr-prompt">
        {prompt}
      </p>
      <div className={styles.layout}>
        <div className={styles.realm}>
          <div className={styles.scroller} ref={scroller}>
            <TileBoard
              g={g}
              t={t}
              cell={ZOOMS[zoom]!}
              fitting={fitting}
              ghost={myMove ? ghost : null}
              last={last && last.k === 'place' ? last.tile : null}
              onCell={(x, y) => tryCell(x, y)}
              onSpot={(f) => ghost && setGhost({ ...ghost, warden: ghost.warden === f ? null : f })}
              onConfirm={() => ghost && confirm(ghost.warden)}
            />
          </div>
          <div className={styles.zoom}>
            <button
              type="button"
              className={styles.icon}
              onClick={() => setZoom(Math.max(0, zoom - 1))}
              aria-label={t('btn.zoomOut')}
              data-testid="tr-zoom-out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              className={styles.icon}
              onClick={() => setZoom(Math.min(ZOOMS.length - 1, zoom + 1))}
              aria-label={t('btn.zoomIn')}
              data-testid="tr-zoom-in"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
        <div className={styles.side}>
          {over ? (
            <section className={styles.panel} data-testid="tr-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fresh(mode, level, g.players)}
                  data-testid="tr-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="tr-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            <section className={styles.panel} data-testid="tr-hand">
              <h3>
                {myMove ? t('panel.tile') : name(g.turn)} · {t('tiles.left', { n: g.bag.length })}
              </h3>
              <div className={styles.handRow}>
                {g.current !== null && (
                  <svg
                    className={styles.hand}
                    viewBox="-4 -4 108 108"
                    aria-hidden
                    data-testid="tr-current"
                  >
                    <TileArt type={g.current} rot={ghost ? ghost.r : rot} />
                  </svg>
                )}
                {myMove && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.icon}
                      onClick={() => rotate(-1)}
                      aria-label={t('btn.rotateLeft')}
                      data-testid="tr-rot-left"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      type="button"
                      className={styles.icon}
                      onClick={() => rotate(1)}
                      aria-label={t('btn.rotateRight')}
                      data-testid="tr-rot-right"
                    >
                      <RotateCw size={18} />
                    </button>
                  </div>
                )}
              </div>
              {myMove && ghost && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => confirm(ghost.warden)}
                    data-testid="tr-confirm"
                  >
                    {t('btn.confirm')}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => confirm(null)}
                    data-testid="tr-no-warden"
                  >
                    {t('btn.noWarden')}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setGhost(null)}
                    data-testid="tr-cancel"
                  >
                    {t('btn.cancel')}
                  </button>
                </div>
              )}
              {myMove && (
                <div className={styles.actions}>
                  <button type="button" className="btn" onClick={showHint} data-testid="tr-hint">
                    <Lightbulb size={16} /> {t('btn.hint')}
                  </button>
                  {hinted && ghost && (
                    <span className={styles.small} data-testid="tr-hint-text">
                      {t('hint.say', {
                        w:
                          ghost.warden === null
                            ? t('hint.none')
                            : t('hint.warden', {
                                what: t(
                                  `kind.${TILE_TYPES[g.current!]!.features[ghost.warden]!.kind}`,
                                ),
                              }),
                      })}
                    </span>
                  )}
                </div>
              )}
            </section>
          )}

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="tr-players">
              {g.scores.map((s, p) => {
                const n = over ? WARDENS : supply(g, p);
                return (
                  <li
                    key={p}
                    className={styles.player}
                    data-current={!over && p === g.turn}
                    style={{ ['--pc' as string]: `var(--player-${p + 1})` }}
                    data-testid={`tr-player-${p}`}
                  >
                    <span className={styles.swatch} aria-hidden />
                    <strong>{name(p)}</strong>
                    <b className={styles.pts}>{t('table.points', { n: s })}</b>
                    <small>{t(n === 1 ? 'table.wardens.one' : 'table.wardens', { n })}</small>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="tr-log">
              {g.log
                .slice(-8)
                .reverse()
                .map((e, i) => (
                  <li key={g.log.length - i}>{logLine(e)}</li>
                ))}
            </ol>
          </section>
          <p className={styles.small}>{t('keys')}</p>
          {!over && (
            <div className={styles.actions}>
              <button type="button" className="btn" onClick={toMenu} data-testid="tr-to-menu">
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
      case 'place': {
        const b = g!.board[e.tile];
        if (e.warden === null || !b)
          return t(isYou(e.p) ? 'log.place.you' : 'log.place', { who: name(e.p) });
        const what = t(`kind.${TILE_TYPES[b.type]!.features[e.warden]!.kind}`);
        return t(isYou(e.p) ? 'log.placeW.you' : 'log.placeW', { who: name(e.p), what });
      }
      case 'score':
        return t(e.final ? 'log.final' : 'log.score', {
          who: e.players.map(name).join(' + '),
          n: e.points,
          what: t(`kind.${e.kind}`),
          tiles: e.tiles,
        });
      case 'discard':
        return t('log.discard');
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
    <div className={shared.menu} data-testid="tr-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="tr-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', { n: saved.state.players, left: saved.state.bag.length })}
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
                data-testid={`tr-count-${n}`}
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
                data-testid={`tr-level-${lv}`}
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
            data-testid="tr-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="tr-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="tr-record">
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
