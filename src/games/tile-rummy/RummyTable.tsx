/**
 * The Tile Rummy table: a menu (players, opponents, new game, resume, watch the AI); chips with
 * every rack's size and the pool; the table as an editable workspace on your turn — tap a tile
 * (from your rack or the table), then a set, "New set" or your rack to move it — with invalid sets
 * outlined; play, reset, draw, hints that lay the suggested play out for you; computer turns; the
 * final points.
 */
import { Bot, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { basicAction, plannerAction } from './ai';
import { act, encodePlay, isValidRummy, newRummy, playProblem, type RummyGame } from './engine';
import { STRINGS } from './i18n';
import { candidatePlays } from './plays';
import styles from './Rummy.module.css';
import { colourOf, isJoker, numberOf, readSet, setValue, sortKey } from './sets';
import { RUMMY_SOUNDS } from './sounds';

type Level = 'easy' | 'hard';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard'];
const COUNTS = [2, 3, 4];
const COLOURS = ['#d64545', '#2f6fd6', '#e08a1e', '#26262e'];

interface Saved {
  state: RummyGame;
  level: Level;
}

/** Tiles of a set in reading order: a run by the numbers it stands for, a group by colour. */
function ordered(set: number[]): number[] {
  const read = readSet(set);
  if (!read) return [...set].sort((a, b) => sortKey(a) - sortKey(b));
  if (read.kind === 'group') return [...set].sort((a, b) => sortKey(a) - sortKey(b));
  const plain = set.filter((t) => !isJoker(t));
  const jokers = set.filter(isJoker);
  return read.values.map((v) => plain.find((t) => numberOf(t) === v) ?? jokers.shift()!);
}

function TileView({ tile }: { tile: number }) {
  if (isJoker(tile))
    return (
      <span className={[styles.tile, styles.joker].join(' ')} aria-hidden="true">
        ★
      </span>
    );
  return (
    <span className={styles.tile} style={{ color: COLOURS[colourOf(tile)] }} aria-hidden="true">
      {numberOf(tile)}
    </span>
  );
}

export function RummyTable({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          LEVELS.includes((d as Saved).level) &&
          isValidRummy((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<RummyGame | null>(null);
  const [work, setWork] = useState<number[][] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [byNumber, setByNumber] = useState(false);
  const [message, setMessage] = useState('');
  const stateRef = useLatest(state);
  const tileName = (x: number) =>
    isJoker(x) ? t('joker') : t('tile', { colour: t(`colour.${colourOf(x)}`), n: numberOf(x) });

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

  const start = (g: RummyGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setWork(null);
    setSelected(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) => start(newRummy(n, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: RummyGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    const seat = before.turn;
    setState(next);
    setWork(null);
    setSelected(null);
    const notes: string[] = [];
    const ev = next.event;
    if (action === 'draw') {
      notes.push(say('drew', seat));
      svc.playSound(RUMMY_SOUNDS.draw);
    } else if (action === 'pass') notes.push(say('passed', seat));
    else if (ev?.kind === 'play') {
      notes.push(say('played', seat, { n: ev.tiles }));
      svc.playSound(RUMMY_SOUNDS.play);
    }
    if (next.phase === 'over' && next.winner !== null) {
      const out = next.racks[next.winner]!.length === 0;
      notes.push(say(out ? 'out' : 'blocked', next.winner));
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(won ? RUMMY_SOUNDS.win : RUMMY_SOUNDS.lose);
        svc.recordResult({
          outcome: won ? 'win' : 'loss',
          score: next.result![0]!,
          mode: `${level}-${next.players}`,
        });
        if (won) {
          svc.unlockAchievement('first');
          if (level === 'hard') svc.unlockAchievement('hard');
          if (out) svc.unlockAchievement('out');
          if (next.players === 4) svc.unlockAchievement('four');
        }
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

  // Computer players (all of them in watch mode) take their turns after a pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over' || human(state.turn)) return;
    const id = window.setTimeout(() => {
      const g = stateRef.current;
      if (!g || g.phase === 'over') return;
      const strong = mode === 'watch' ? g.turn === 0 : level === 'hard';
      doAction(strong ? plannerAction(g) : basicAction(g));
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && g.phase === 'play' && human(g.turn);
  const table = myTurn && work ? work : (g?.table ?? []);
  const original = new Set(g?.table.flat() ?? []);
  const myRack = g && mode === 'play' ? g.racks[0]! : [];
  const onTable = new Set(table.flat());
  const rack = myRack
    .filter((x) => !onTable.has(x))
    .sort((a, b) =>
      byNumber
        ? numberOf(a) * 10 + colourOf(a) - (numberOf(b) * 10 + colourOf(b))
        : sortKey(a) - sortKey(b),
    );
  const placedCount = table.flat().length - (g?.table.flat().length ?? 0);
  const problem = g && myTurn && work ? playProblem(g, work) : null;
  const meldValue =
    g && myTurn && work && !g.melded[0]
      ? work.filter((s) => s.every((x) => !original.has(x))).reduce((a, s) => a + setValue(s), 0)
      : 0;

  const edit = (f: (w: number[][]) => number[][]) => {
    const base = work ?? g!.table.map((s) => [...s]);
    setWork(f(base.map((s) => [...s])).filter((s) => s.length > 0));
    setSelected(null);
  };
  const removeTile = (w: number[][], x: number) => w.map((s) => s.filter((y) => y !== x));

  const tapTile = (x: number) => {
    if (!myTurn) return;
    servicesRef.current.playSound(RUMMY_SOUNDS.select);
    setSelected(selected === x ? null : x);
    if (selected !== x) setMessage(t('selected'));
  };
  const tapSet = (i: number) => {
    if (!myTurn || selected === null) return;
    const x = selected;
    edit((w) => {
      const cleaned = removeTile(w, x);
      cleaned[i] = [...cleaned[i]!, x];
      return cleaned;
    });
    servicesRef.current.playSound(RUMMY_SOUNDS.move);
    setMessage('');
  };
  const newSet = () => {
    if (!myTurn || selected === null) return;
    const x = selected;
    edit((w) => [...removeTile(w, x), [x]]);
    servicesRef.current.playSound(RUMMY_SOUNDS.move);
    setMessage('');
  };
  const toRack = () => {
    if (!myTurn || selected === null || original.has(selected)) return;
    const x = selected;
    edit((w) => removeTile(w, x));
    setMessage('');
  };
  const reset = () => {
    setWork(null);
    setSelected(null);
    setMessage('');
  };
  const playWork = () => {
    if (!g || !myTurn || !work || problem) return;
    doAction(encodePlay(work.map(ordered)));
  };
  const showHint = () => {
    if (!g || !myTurn) return;
    servicesRef.current.playSound(RUMMY_SOUNDS.hint);
    const best = candidatePlays(g.table, g.racks[0]!, g.melded[0]!)[0];
    if (!best) {
      setWork(null);
      setMessage(t('hint.draw'));
      return;
    }
    setWork(best.map((s) => [...s]));
    setSelected(null);
    setMessage(t('hint.play', { n: best.flat().length - g.table.flat().length }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if (k === 'enter') playWork();
    else if (k === 'd' && placedCount === 0) doAction(g.pool.length ? 'draw' : 'pass');
    else if (k === 'r') reset();
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
      <div className={shared.menu} data-testid="tr-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid="tr-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    n: saved.state.players,
                    t: saved.state.racks[0]!.length,
                  })}
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
              onClick={() => fresh('play', level, count, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="tr-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="tr-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const prompt =
    g.phase === 'over'
      ? ''
      : !myTurn
        ? t('thinking', { side: name(g.turn) })
        : work && problem && placedCount > 0
          ? t(`problem.${problem}`) + (problem === 'meld' ? ` (${meldValue})` : '')
          : work && !problem
            ? t('ready', { n: placedCount })
            : !g.melded[0]
              ? t('firstPlay', { n: meldValue })
              : t('yourTurn');

  return (
    <div className={shared.play} data-testid="tile-rummy">
      <div className={styles.players}>
        {g.racks.map((r, p) => (
          <span
            key={p}
            className={[styles.chip, p === g.turn && g.phase === 'play' ? styles.current : ''].join(
              ' ',
            )}
            data-testid={`tr-player-${p}`}
          >
            <strong>{name(p)}</strong> · {t('tiles', { n: r.length })}
            {g.result && <em> {g.result[p]! > 0 ? `+${g.result[p]}` : g.result[p]}</em>}
          </span>
        ))}
        <span className={styles.chip}>{t('pool', { n: g.pool.length })}</span>
      </div>
      <div className={styles.table} aria-label={t('table')} data-testid="tr-table">
        {table.map((s, i) => {
          const valid = readSet(s) !== null;
          return (
            <div
              key={i}
              className={[
                styles.set,
                valid ? '' : styles.invalid,
                selected !== null && myTurn ? styles.target : '',
              ].join(' ')}
              onClick={() => tapSet(i)}
              data-testid={`tr-set-${i}`}
            >
              {(myTurn && work ? s : ordered(s)).map((x) => (
                <button
                  key={x}
                  type="button"
                  className={[
                    styles.tileBtn,
                    selected === x ? styles.selected : '',
                    !original.has(x) ? styles.fresh : '',
                  ].join(' ')}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selected !== null && selected !== x) tapSet(i);
                    else tapTile(x);
                  }}
                  aria-label={tileName(x)}
                  data-testid={`tr-tile-${x}`}
                >
                  <TileView tile={x} />
                </button>
              ))}
            </div>
          );
        })}
        {myTurn && (
          <button
            type="button"
            className={[styles.newSet, selected !== null ? styles.target : ''].join(' ')}
            onClick={newSet}
            data-testid="tr-new-set"
          >
            + {t('newSet')}
          </button>
        )}
      </div>
      <p className={shared.message} data-testid="tr-message" aria-live="polite">
        {message}
        {message && prompt ? ' ' : ''}
        {prompt}
      </p>
      {mode === 'play' && (
        <div
          className={[
            styles.rack,
            selected !== null && !original.has(selected) ? styles.target : '',
          ].join(' ')}
          onClick={toRack}
          aria-label={t('rack')}
          data-testid="tr-rack"
        >
          {rack.map((x) => (
            <button
              key={x}
              type="button"
              className={[styles.tileBtn, selected === x ? styles.selected : ''].join(' ')}
              onClick={(e) => {
                e.stopPropagation();
                tapTile(x);
              }}
              disabled={!myTurn}
              aria-label={tileName(x)}
              data-testid={`tr-rack-${x}`}
            >
              <TileView tile={x} />
            </button>
          ))}
        </div>
      )}
      <div className={shared.controls}>
        {myTurn && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={playWork}
              disabled={!work || !!problem}
              data-testid="tr-play"
            >
              {t('play')}
            </button>
            {placedCount === 0 ? (
              <button
                type="button"
                className="btn"
                onClick={() => doAction(g.pool.length ? 'draw' : 'pass')}
                data-testid="tr-draw"
              >
                {g.pool.length ? t('draw') : t('pass')}
              </button>
            ) : (
              <button type="button" className="btn" onClick={reset} data-testid="tr-reset">
                {t('reset')}
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => setByNumber((b) => !b)}
              data-testid="tr-sort"
            >
              {t('sort', { mode: t(byNumber ? 'sort.number' : 'sort.colour') })}
            </button>
            <button type="button" className="btn" onClick={showHint} data-testid="tr-hint">
              <Lightbulb size={16} /> {t('hint')}
            </button>
          </>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.players, randomSeed() >>> 0)}
            data-testid="tr-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="tr-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
