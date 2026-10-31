/**
 * The Mahjong solitaire table: a menu (layout, new deal, resume, watch the AI), the stacked tiles
 * drawn with depth, free tiles that select and pair on a tap, blocked tiles that refuse with a
 * message, hints from the strategist, undo, limited shuffles, a clock and the tiles left.
 */
import { Bot, Lightbulb, Play, RotateCcw, Shuffle, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { strategistAction, visibleFaces } from './ai';
import {
  act,
  freePairs,
  freeSlots,
  isValidMahjong,
  layoutById,
  LAYOUTS,
  matches,
  newMahjong,
  tilesLeft,
  type MahjongGame,
} from './engine';
import { FaceArt, faceName } from '../shared/mjtiles/Face';
import { STRINGS } from './i18n';
import styles from './Mahjong.module.css';
import { MAHJONG_SOUNDS } from './sounds';

type Mode = 'menu' | 'play' | 'watch';

interface Saved {
  state: MahjongGame;
  undos: number;
  hints: number;
  elapsed: number;
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function MahjongTable({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' && d !== null && isValidMahjong((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [layout, setLayout] = useState(LAYOUTS[0]!.id);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<MahjongGame | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [message, setMessage] = useState('');
  const [undos, setUndos] = useState(0);
  const [hints, setHints] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useLatest(state);
  const name = (f: number) => faceName(f, locale === 'es' ? 'es' : 'en');

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.phase === 'play') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  // The clock runs while a deal is being played.
  useEffect(() => {
    if (mode !== 'play' || state?.phase !== 'play') return;
    const id = window.setInterval(() => setElapsed((e) => e + 1000), 1000);
    return () => window.clearInterval(id);
  }, [mode, state?.phase]);

  const start = (g: MahjongGame, m: Mode, extra?: Partial<Saved>) => {
    setState(g);
    setMode(m);
    setSelected(null);
    setHint(null);
    setMessage('');
    setUndos(extra?.undos ?? 0);
    setHints(extra?.hints ?? 0);
    setElapsed(extra?.elapsed ?? 0);
  };
  const fresh = (m: Mode, layoutId: string, seed: number) => start(newMahjong(layoutId, seed), m);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'crossroads', fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const persist = (g: MahjongGame, u = undos, h = hints) => {
    if (mode === 'play') void slot.save({ state: g, undos: u, hints: h, elapsed });
  };

  const commit = (next: MahjongGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setSelected(null);
    setHint(null);
    setState(next);
    if (action === 'shuffle') {
      svc.playSound(MAHJONG_SOUNDS.shuffle);
      setMessage(t('shuffled', { n: next.shuffles }));
    } else {
      svc.playSound(MAHJONG_SOUNDS.pair);
      setMessage(t('removed'));
    }
    if (next.phase === 'won') {
      setMessage(t('won', { n: next.faces.length / 2, time: clock(elapsed) }));
      if (mode === 'play') {
        svc.playSound(MAHJONG_SOUNDS.win);
        svc.recordResult({ outcome: 'complete', timeMs: elapsed, mode: next.layout });
        svc.unlockAchievement('first');
        if (next.layout === 'pyramid') svc.unlockAchievement('pyramid');
        if (next.shuffles === 3 && undos === 0) svc.unlockAchievement('pure');
        if (hints === 0) svc.unlockAchievement('unaided');
        void slot.clear();
        setSaved(null);
      }
    } else if (next.phase === 'stuck') {
      setMessage(t('stuck'));
      if (mode === 'play') {
        svc.playSound(MAHJONG_SOUNDS.stuck);
        svc.recordResult({ outcome: 'fail', mode: next.layout });
      }
    } else if (!freePairs(next).length) setMessage(t('noPairs'));
    if (next.phase !== 'won') persist(next);
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // The computer plays the watch mode.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.phase !== 'play') return;
    const id = window.setTimeout(() => {
      const g = stateRef.current;
      if (g) doAction(strategistAction(g));
    }, 500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const def = g ? layoutById(g.layout) : null;
  const free = useMemo(() => new Set(g ? freeSlots(g) : []), [g]);
  const seen = useMemo(() => (g ? visibleFaces(g) : []), [g]);
  const canPlay = mode === 'play' && g?.phase === 'play';

  const tap = (i: number) => {
    if (!g || !canPlay) return;
    const svc = servicesRef.current;
    if (!free.has(i)) {
      svc.playSound(MAHJONG_SOUNDS.blocked);
      setMessage(t('blocked'));
      return;
    }
    if (selected === null || selected === i) {
      setSelected(selected === i ? null : i);
      svc.playSound(MAHJONG_SOUNDS.select);
      setMessage(selected === i ? '' : t('picked', { face: name(g.faces[i]!) }));
      return;
    }
    if (matches(g.faces[selected]!, g.faces[i]!)) {
      const [a, b] = selected < i ? [selected, i] : [i, selected];
      doAction(`pair:${a},${b}`);
    } else {
      svc.playSound(MAHJONG_SOUNDS.blocked);
      setSelected(i);
      setMessage(`${t('noMatch')} ${t('picked', { face: name(g.faces[i]!) })}`);
    }
  };

  const showHint = () => {
    if (!g || !canPlay) return;
    const a = strategistAction(g);
    servicesRef.current.playSound(MAHJONG_SOUNDS.hint);
    if (!a.startsWith('pair:')) {
      setMessage(t('noPairs'));
      return;
    }
    const [x, y] = a.slice(5).split(',').map(Number) as [number, number];
    setHint([x, y]);
    setSelected(null);
    setHints((h) => h + 1);
    setMessage(t('hint.pair', { face: name(g.faces[x]!) }));
  };

  const undo = () => {
    if (!g || mode !== 'play' || !g.history.length) return;
    let back = newMahjong(g.layout, g.seed);
    for (const a of g.history.slice(0, -1)) back = act(back, a);
    setState(back);
    setSelected(null);
    setHint(null);
    setUndos((u) => u + 1);
    setMessage('');
    servicesRef.current.playSound(MAHJONG_SOUNDS.undo);
    persist(back, undos + 1);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g) return false;
    const k = e.key.toLowerCase();
    if (k === 'h') showHint();
    else if (k === 'u') undo();
    else if (k === 's' && g.phase === 'play' && g.shuffles > 0) doAction('shuffle');
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase === 'play') {
      const kept = { state: cur, undos, hints, elapsed };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g || !def) {
    return (
      <div className={shared.menu} data-testid="mj-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved)}
              data-testid="mj-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>{t('menu.resumeHint', { n: tilesLeft(saved.state) })}</small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.layout')}</legend>
            <div className={shared.segmented}>
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={layout === l.id}
                  onClick={() => setLayout(l.id)}
                  data-testid={`mj-layout-${l.id}`}
                >
                  {t(`layout.${l.id}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', layout, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="mj-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', layout, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="mj-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cols = Math.max(...def.slots.map((s) => s.x)) + 1;
  const rows = Math.max(...def.slots.map((s) => s.y)) + 1;
  const layers = Math.max(...def.slots.map((s) => s.z)) + 1;
  const order = def.slots
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.z - b.s.z || a.s.y - b.s.y || a.s.x - b.s.x);

  return (
    <div className={shared.play} data-testid="mahjong">
      <p className={styles.status} data-testid="mj-status">
        <span data-testid="mj-left">{t('left', { n: tilesLeft(g) })}</span> ·{' '}
        <span>{t('pairs', { n: freePairs(g).length })}</span>
        {mode === 'play' && <> · {clock(elapsed)}</>}
      </p>
      <div className={styles.frame}>
        <div
          className={styles.board}
          style={{
            ['--cols' as string]: cols,
            ['--rows' as string]: rows,
            ['--layers' as string]: layers,
          }}
          aria-label={t('board')}
          data-testid="mj-board"
        >
          {order.map(({ s, i }) => {
            const f = g.faces[i]!;
            if (f < 0) return null;
            const isFreeTile = free.has(i);
            const hidden = seen[i] === -2;
            return (
              <button
                key={i}
                type="button"
                className={[
                  styles.tile,
                  isFreeTile ? styles.free : '',
                  selected === i ? styles.selected : '',
                  hint && (hint[0] === i || hint[1] === i) ? styles.hinted : '',
                ].join(' ')}
                style={{
                  ['--x' as string]: s.x,
                  ['--y' as string]: s.y,
                  ['--z' as string]: s.z,
                  zIndex: s.z * 1000 + s.y * 30 + s.x,
                }}
                onClick={() => tap(i)}
                aria-label={
                  hidden
                    ? undefined
                    : t('tile', {
                        face: name(f),
                        state: t(isFreeTile ? 'state.free' : 'state.blocked'),
                      })
                }
                aria-hidden={hidden || undefined}
                tabIndex={hidden ? -1 : undefined}
                data-testid={`mj-tile-${i}`}
                data-free={isFreeTile || undefined}
                data-face={hidden ? undefined : f}
              >
                <svg viewBox="0 0 30 40" aria-hidden="true">
                  <FaceArt face={f} />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
      <p className={shared.message} data-testid="mj-message" aria-live="polite">
        {message || (canPlay ? t('pick') : '')}
      </p>
      <div className={shared.controls}>
        {canPlay && (
          <button type="button" className="btn" onClick={showHint} data-testid="mj-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && g.phase !== 'won' && (
          <button
            type="button"
            className="btn"
            onClick={undo}
            disabled={!g.history.length}
            data-testid="mj-undo"
          >
            <Undo2 size={16} /> {t('undo')}
          </button>
        )}
        {canPlay && (
          <button
            type="button"
            className={['btn', !freePairs(g).length ? 'btn-primary' : ''].join(' ')}
            onClick={() => doAction('shuffle')}
            disabled={g.shuffles === 0}
            data-testid="mj-shuffle"
          >
            <Shuffle size={16} /> {t('shuffle', { n: g.shuffles })}
          </button>
        )}
        {(g.phase !== 'play' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, g.layout, randomSeed() >>> 0)}
            data-testid="mj-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="mj-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
