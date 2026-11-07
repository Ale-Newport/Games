/**
 * The domino table shared by #156–#158: a menu (players, opponents, new game, resume, watch the AI),
 * score chips with every player's tile count, the layout (the line through the centre tile, plus
 * the spinner's top and bottom arms in all fives), your hand with the playable tiles lit, end
 * buttons when a tile fits more than one end, draw and pass, hints from the planner, the hand's
 * result with every hand revealed, and computer turns played with short pauses.
 */
import { Bot, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import shared from '../sudoku/SudokuGame.module.css';
import { plannerAction } from './ai';
import styles from './Bones.module.css';
import {
  TILES,
  act,
  armEnd,
  isDouble,
  isValidBones,
  legalActions,
  newBones,
  openArms,
  pips,
  playsFor,
  type BonesGame,
  type BonesRules,
  type Placed,
} from './engine';
import { heavyFromView } from './environment';
import { BONES_STRINGS } from './i18n';
import { BONES_SOUNDS } from './sounds';
import { TileFace } from './Tile';

type Level = 'easy' | 'hard';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard'];
const COUNTS = [2, 3, 4];

interface Saved {
  state: BonesGame;
  level: Level;
}

export interface BonesTableProps {
  services: GameServices;
  rules: BonesRules;
  /** Test-id prefix. */
  prefix: string;
  /** The game's own strings (`title`, `menu.subtitle`), merged over the shared ones. */
  strings: Record<Locale, Dictionary>;
  /** Achievements when a game against the computer ends (seat 0 is you). */
  onGameEnd: (g: BonesGame, level: Level, unlock: (id: string) => void) => void;
}

/** A tile as it lies in the layout: `near` faces the centre, `far` the open end. */
function LaidTile({ placed, reverse }: { placed: Placed; reverse?: boolean }) {
  const [x, y] = TILES[placed.tile]!;
  const near = x + y - placed.outer;
  const dbl = x === y;
  return (
    <span className={styles.laid}>
      <TileFace
        a={reverse ? placed.outer : near}
        b={reverse ? near : placed.outer}
        vertical={dbl}
      />
    </span>
  );
}

export function BonesTable({ services, rules, prefix, strings, onGameEnd }: BonesTableProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        { en: { ...BONES_STRINGS.en, ...strings.en }, es: { ...BONES_STRINGS.es, ...strings.es } },
        locale,
      ),
    [locale, strings],
  );
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          LEVELS.includes((d as Saved).level) &&
          isValidBones((d as Saved).state, rules),
      }),
    [services, rules],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<BonesGame | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const stateRef = useLatest(state);
  const id = (s: string) => `${prefix}-${s}`;

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.phase !== 'over') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const human = (p: number) => mode === 'play' && p === 0;
  const isYou = human;
  const name = (p: number) => (isYou(p) ? t('you') : t('cpu', { n: mode === 'watch' ? p + 1 : p }));
  const say = (key: string, p: number, params: Record<string, string | number> = {}) =>
    t(isYou(p) ? `${key}.you` : key, { side: name(p), ...params });
  const tileName = (tile: number) => t('tile', { a: TILES[tile]![0], b: TILES[tile]![1] });

  const start = (g: BonesGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setSelected(null);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) =>
    start(newBones(rules, n, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const tm = window.setTimeout(
      () => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: BonesGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    const p = before.turn;
    setSelected(null);
    setHint(null);
    setState(next);
    const notes: string[] = [];
    if (action.startsWith('play:')) {
      notes.push(say('played', p, { tile: tileName(Number(action.split(':')[1])) }));
      svc.playSound(BONES_SOUNDS.play);
    } else if (action === 'draw') {
      notes.push(say('drew', p));
      svc.playSound(BONES_SOUNDS.draw);
    } else if (action === 'pass') {
      notes.push(say('passed', p));
      svc.playSound(BONES_SOUNDS.pass);
    }
    const ev = next.event;
    if (ev?.kind === 'fives') {
      notes.push(say('fives', ev.player, { n: ev.points }));
      svc.playSound(BONES_SOUNDS.score);
    } else if (ev && (ev.kind === 'domino' || ev.kind === 'blocked') && before.phase === 'play') {
      if (ev.fives) notes.push(say('fives', p, { n: ev.fives }));
      if (ev.winner === null) notes.push(t('blockedTie'));
      else notes.push(say(ev.kind, ev.winner, { n: ev.points }));
      svc.playSound(BONES_SOUNDS.hand);
    }
    if (next.phase === 'over' && next.winner !== null) {
      notes.push(say('won', next.winner, { n: next.scores[next.winner]! }));
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(won ? BONES_SOUNDS.win : BONES_SOUNDS.lose);
        svc.recordResult({
          outcome: won ? 'win' : 'loss',
          score: next.scores[0]!,
          mode: `${level}-${next.players}`,
        });
        onGameEnd(next, level, (a) => svc.unlockAchievement(a));
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
    setMessage(notes.join(' '));
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // Computer players (all of them in watch mode) act after a pause; watch mode deals on by itself.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over') return;
    if (state.phase === 'handOver') {
      if (mode !== 'watch') return;
      const tm = window.setTimeout(() => doAction('next'), 2500);
      return () => window.clearTimeout(tm);
    }
    if (human(state.turn)) return;
    const tm = window.setTimeout(() => {
      const g = stateRef.current;
      if (!g || g.phase !== 'play') return;
      const strong = mode === 'watch' ? g.turn === 0 : level === 'hard';
      doAction(strong ? plannerAction(g) : heavyFromView(g));
    }, 750);
    return () => window.clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && g.phase === 'play' && human(g.turn);
  const plays = g && myTurn ? playsFor(g, g.hands[0]!) : [];
  const playable = new Set(plays.map(([tile]) => tile));
  const armsFor = (tile: number) => plays.filter(([x]) => x === tile).map(([, arm]) => arm);
  const legal = g && myTurn ? legalActions(g) : [];

  const tapTile = (tile: number) => {
    if (!myTurn || !playable.has(tile)) return;
    const arms = armsFor(tile);
    if (arms.length === 1) doAction(arms[0]! < 0 ? `play:${tile}` : `play:${tile}:${arms[0]}`);
    else setSelected(tile === selected ? null : tile);
  };

  const showHint = () => {
    if (!g || !myTurn) return;
    servicesRef.current.playSound(BONES_SOUNDS.hint);
    const a = plannerAction(g);
    setHint(a);
    if (a.startsWith('play:')) {
      const [, tile, arm] = a.split(':');
      const fits = armsFor(Number(tile)).length > 1;
      setSelected(fits ? Number(tile) : null);
      setMessage(
        t('hint.play', {
          tile: tileName(Number(tile)),
          end: fits && arm !== undefined ? t(`end.${arm}`) : '',
        }),
      );
    } else setMessage(t(a === 'draw' ? 'hint.draw' : 'hint.pass'));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g) return false;
    const k = e.key.toLowerCase();
    if (k === 'enter' && g.phase === 'handOver') doAction('next');
    else if (!myTurn) return false;
    else if (k === 'd' && legal.includes('draw')) doAction('draw');
    else if (k === 'p' && legal.includes('pass')) doAction('pass');
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'over') {
      const kept = { state: cur, level };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g) {
    return (
      <div className={shared.menu} data-testid={id('menu')}>
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid={id('resume')}
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', { n: saved.state.players, h: saved.state.hand + 1 })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.players')}</legend>
            <div className={shared.segmented}>
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                  data-testid={id(`count-${n}`)}
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
                  data-testid={id(`level-${lv}`)}
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
              onClick={() => fresh('play', level, count, fixedSeed ?? randomSeed() >>> 0)}
              data-testid={id('start')}
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0)}
              data-testid={id('watch')}
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const layout = g.layout;
  const arms = layout ? openArms(rules, layout) : [];
  const targets = selected !== null ? armsFor(selected) : [];
  const hintArm = hint?.startsWith('play:') ? Number(hint.split(':')[2] ?? -1) : null;
  const endButton = (arm: number) =>
    targets.includes(arm) && selected !== null ? (
      <button
        key={`end-${arm}`}
        type="button"
        className={[styles.end, hintArm === arm ? styles.hinted : ''].join(' ')}
        onClick={() => doAction(`play:${selected}:${arm}`)}
        aria-label={t(`arm.${arm}`, { n: armEnd(layout!, arm) })}
        data-testid={id(`end-${arm}`)}
      >
        {armEnd(layout!, arm)}
      </button>
    ) : null;
  const revealed = g.phase !== 'play';
  const prompt =
    g.phase === 'over'
      ? ''
      : g.phase === 'handOver'
        ? ''
        : !myTurn
          ? t('thinking', { side: name(g.turn) })
          : selected !== null
            ? t('chooseEnd', { tile: tileName(selected) })
            : legal.includes('draw')
              ? t('mustDraw')
              : legal.includes('pass')
                ? t('mustPass')
                : !layout
                  ? g.leader === null
                    ? t('yourTurnForced')
                    : t('yourTurnFirst')
                  : t('yourTurn');

  return (
    <div className={shared.play} data-testid={id('table')}>
      <div className={styles.players}>
        {g.hands.map((h, p) => (
          <span
            key={p}
            className={[styles.chip, p === g.turn && g.phase === 'play' ? styles.current : ''].join(
              ' ',
            )}
            data-testid={id(`score-${p}`)}
          >
            <strong>
              {name(p)} · {g.scores[p]}
            </strong>
            <small>{h.length === 1 ? t('tiles.one') : t('tiles', { n: h.length })}</small>
          </span>
        ))}
      </div>
      <p className={styles.meta}>
        {t('target', { n: rules.target })}
        {rules.draw && ` · ${t('boneyard', { n: g.boneyard.length })}`}
      </p>
      <div className={styles.layout} aria-label={t('layout')} data-testid={id('layout')}>
        {layout ? (
          <>
            <div className={styles.line}>
              {arms.includes(1) && endButton(1)}
              {[...layout.arms[1]!].reverse().map((pl, i) => (
                <LaidTile key={`l${i}`} placed={pl} reverse />
              ))}
              <span className={[styles.laid, styles.centre].join(' ')}>
                <TileFace
                  a={TILES[layout.centre]![0]}
                  b={TILES[layout.centre]![1]}
                  vertical={isDouble(layout.centre)}
                />
              </span>
              {layout.arms[0]!.map((pl, i) => (
                <LaidTile key={`r${i}`} placed={pl} />
              ))}
              {arms.includes(0) && endButton(0)}
            </div>
            {[2, 3].map((arm) =>
              arms.includes(arm) || layout.arms[arm]!.length ? (
                <div key={arm} className={styles.line}>
                  <span className={styles.armLabel}>{arm === 2 ? '↑' : '↓'}</span>
                  {layout.arms[arm]!.map((pl, i) => (
                    <LaidTile key={i} placed={pl} />
                  ))}
                  {endButton(arm)}
                </div>
              ) : null,
            )}
          </>
        ) : (
          <span className={styles.empty}>
            {g.phase === 'play' && !myTurn ? t('thinking', { side: name(g.turn) }) : ''}
          </span>
        )}
      </div>
      <p className={shared.message} data-testid={id('message')} aria-live="polite">
        {message}
        {message && prompt ? ' ' : ''}
        {prompt}
      </p>
      {revealed && g.event && g.event.kind !== 'fives' && (
        <div className={styles.reveal} data-testid={id('reveal')}>
          {g.hands.map((h, p) => (
            <div key={p} className={styles.revealRow}>
              <span>
                {name(p)} · {t('handPips', { n: h.reduce((s, x) => s + pips(x), 0) })}
              </span>
              <span className={styles.small}>
                {h.map((x) => (
                  <TileFace key={x} a={TILES[x]![0]} b={TILES[x]![1]} />
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
      {mode === 'play' && (
        <div className={styles.hand} aria-label={t('hand')} data-testid={id('hand')}>
          {g.hands[0]!.map((x) => (
            <button
              key={x}
              type="button"
              className={[
                styles.handTile,
                playable.has(x) ? styles.playable : '',
                selected === x ? styles.selected : '',
                hint === `play:${x}` || hint?.startsWith(`play:${x}:`) ? styles.hinted : '',
              ].join(' ')}
              disabled={!playable.has(x)}
              onClick={() => tapTile(x)}
              aria-label={tileName(x)}
              aria-pressed={selected === x}
              data-testid={id(`tile-${x}`)}
              data-playable={playable.has(x) || undefined}
            >
              <TileFace a={TILES[x]![0]} b={TILES[x]![1]} vertical />
            </button>
          ))}
        </div>
      )}
      {targets.length > 1 && (
        <div className={shared.controls}>
          {targets.map((arm) => (
            <button
              key={arm}
              type="button"
              className={['btn', hintArm === arm ? 'btn-primary' : ''].join(' ')}
              onClick={() => doAction(`play:${selected}:${arm}`)}
              data-testid={id(`arm-${arm}`)}
            >
              {t(`arm.${arm}`, { n: armEnd(layout!, arm) })}
            </button>
          ))}
        </div>
      )}
      <div className={shared.controls}>
        {myTurn && legal.includes('draw') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('draw')}
            data-testid={id('draw')}
          >
            {t('draw')}
          </button>
        )}
        {myTurn && legal.includes('pass') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('pass')}
            data-testid={id('pass')}
          >
            {t('pass')}
          </button>
        )}
        {myTurn && (
          <button type="button" className="btn" onClick={showHint} data-testid={id('hint')}>
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && g.phase === 'handOver' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('next')}
            data-testid={id('next')}
          >
            {t('next')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.players, randomSeed() >>> 0)}
            data-testid={id('again')}
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid={id('menu-btn')}>
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
