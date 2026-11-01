/**
 * The Naval Battle table: a menu (opponent, place your fleet, resume, watch the AI); a placement
 * board (pick a ship, tap its bow cell, rotate, random fleet); then enemy waters to fire at and your
 * own fleet with the computer's shots, coordinates A–J × 1–10, the ships still afloat, hints from the
 * analyst, and computer shots after a pause.
 */
import { Bot, Lightbulb, Play, RotateCcw, RotateCw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed, seedRng } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { analystShot, hunterShot } from './ai';
import {
  act,
  afloat,
  FLEET,
  isValidNaval,
  newNaval,
  randomFleet,
  shipCells,
  SIZE,
  type NavalGame,
  type Ship,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Naval.module.css';
import { NAVAL_SOUNDS } from './sounds';

type Level = 'easy' | 'hard';
type Mode = 'menu' | 'place' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard'];

interface Saved {
  state: NavalGame;
  level: Level;
}

export const cellName = (c: number) => `${'ABCDEFGHIJ'[Math.floor(c / SIZE)]}${(c % SIZE) + 1}`;

export function NavalTable({ services }: { services: GameServices }) {
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
          isValidNaval((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<NavalGame | null>(null);
  const [placing, setPlacing] = useState<(Ship | null)[]>(FLEET.map(() => null));
  const [current, setCurrent] = useState(0);
  const [vertical, setVertical] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const stateRef = useLatest(state);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.phase !== 'over') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const start = (g: NavalGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => start(newNaval(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard'),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const sideName = (seat: number) =>
    mode === 'watch' ? t(seat === 0 ? 'left' : 'right') : seat === 0 ? t('you') : t('cpu');

  const fire = (cell: number) => {
    const g = stateRef.current;
    if (!g || g.phase !== 'play') return;
    const next = act(g, `fire:${cell}`);
    if (next === g) return;
    const svc = servicesRef.current;
    setState(next);
    setHint(null);
    const l = next.last!;
    svc.playSound(
      l.result === 'miss'
        ? NAVAL_SOUNDS.splash
        : l.result === 'hit'
          ? NAVAL_SOUNDS.hit
          : NAVAL_SOUNDS.sunk,
    );
    let text = t(l.result, { side: sideName(l.seat), cell: cellName(cell), n: l.ship ?? 0 });
    if (next.phase === 'over') {
      const n = Object.keys(next.shots[next.winner!]).length;
      text += ` ${mode === 'watch' ? t('watchOver', { side: sideName(next.winner!), n }) : t(next.winner === 0 ? 'won' : 'lost', { n })}`;
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(won ? NAVAL_SOUNDS.win : NAVAL_SOUNDS.lose);
        svc.recordResult({ outcome: won ? 'win' : 'loss', score: won ? 100 - n : 0, mode: level });
        if (won) {
          svc.unlockAchievement('first');
          if (level === 'hard') svc.unlockAchievement('hard');
          if (n <= 50) svc.unlockAchievement('sharp');
          if (next.fleets[0].every((s) => s.cells.some((x) => !(x in next.shots[1]))))
            svc.unlockAchievement('untouched');
        }
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
    // The computer's reply follows your own shot's result.
    if (mode === 'play' && l.seat === 1) setMessage((m) => (m ? `${m} ${text}` : text));
    else setMessage(text);
  };

  // Computer shots (both sides in watch mode) after a pause.
  useEffect(() => {
    if (
      !state ||
      state.phase !== 'play' ||
      (mode !== 'watch' && (mode !== 'play' || state.turn === 0))
    )
      return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (!g || g.phase !== 'play') return;
        const strong = mode === 'watch' ? g.turn === 0 : level === 'hard';
        fire(strong ? analystShot(g) : hunterShot(g));
      },
      mode === 'watch' ? 450 : 700,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = mode === 'play' && g?.phase === 'play' && g.turn === 0;

  const showHint = () => {
    if (!g || !myTurn) return;
    const c = analystShot(g);
    servicesRef.current.playSound(NAVAL_SOUNDS.hint);
    setHint(c);
    setMessage(t('hint.cell', { cell: cellName(c) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !myTurn) return false;
    if (e.key.toLowerCase() === 'h') {
      showHint();
      return true;
    }
    return false;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase === 'play') {
      const kept = { state: cur, level };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  // Placement.
  const occupied = (except: number) =>
    new Set(placing.flatMap((s, i) => (s && i !== except ? s.cells : [])));
  const place = (cell: number) => {
    const at = placing.findIndex((s) => s?.cells.includes(cell));
    if (at >= 0) {
      // Pick a placed ship up again.
      setPlacing((p) => p.map((s, i) => (i === at ? null : s)));
      setCurrent(at);
      return;
    }
    const cells = shipCells(cell, FLEET[current]!, vertical);
    if (!cells || cells.some((x) => occupied(current).has(x))) {
      servicesRef.current.playSound(NAVAL_SOUNDS.splash);
      return;
    }
    servicesRef.current.playSound(NAVAL_SOUNDS.place);
    const next = placing.map((s, i) => (i === current ? { cells } : s));
    setPlacing(next);
    const free = next.findIndex((s) => s === null);
    if (free >= 0) setCurrent(free);
  };
  const shuffleFleet = () => {
    const [fleet] = randomFleet(seedRng(randomSeed() >>> 0));
    setPlacing(fleet);
  };

  if (mode === 'menu' || (mode !== 'place' && !g)) {
    return (
      <div className={shared.menu} data-testid="nb-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid="nb-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    a: FLEET.length - afloat(saved.state, 1).length,
                    b: FLEET.length - afloat(saved.state, 0).length,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  aria-pressed={level === lv}
                  onClick={() => setLevel(lv)}
                  data-testid={`nb-level-${lv}`}
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
              onClick={() => {
                setPlacing(FLEET.map(() => null));
                setCurrent(0);
                setMode('place');
              }}
              data-testid="nb-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(newNaval(fixedSeed ?? randomSeed() >>> 0), 'watch', 'hard')}
              data-testid="nb-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'place') {
    const taken = new Map<number, number>();
    placing.forEach((s, i) => s?.cells.forEach((x) => taken.set(x, i)));
    const ready = placing.every(Boolean);
    return (
      <div className={shared.play} data-testid="nb-place">
        <h3 className={styles.heading}>{t('placeTitle')}</h3>
        <p className={shared.hintText}>{t('placeHelp')}</p>
        <div className={styles.ships}>
          {FLEET.map((n, i) => (
            <button
              key={i}
              type="button"
              className={[
                styles.shipBtn,
                current === i ? styles.current : '',
                placing[i] ? styles.placed : '',
              ].join(' ')}
              onClick={() => setCurrent(i)}
              aria-pressed={current === i}
              data-testid={`nb-ship-${i}`}
            >
              {t('ship', { n })}
            </button>
          ))}
        </div>
        <Grid
          onCell={place}
          label={t('yourFleet')}
          render={(c) => (taken.has(c) ? (styles.ship ?? '') : '')}
          testid="nb-place-grid"
          name={(c) => cellName(c)}
        />
        <div className={shared.controls}>
          <button
            type="button"
            className="btn"
            onClick={() => setVertical((v) => !v)}
            data-testid="nb-rotate"
          >
            <RotateCw size={16} /> {t('rotate', { dir: t(vertical ? 'vertical' : 'horizontal') })}
          </button>
          <button type="button" className="btn" onClick={shuffleFleet} data-testid="nb-shuffle">
            <Shuffle size={16} /> {t('shuffle')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            onClick={() =>
              start(newNaval(fixedSeed ?? randomSeed() >>> 0, placing as Ship[]), 'play', level)
            }
            data-testid="nb-begin"
          >
            {t('start')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setMode('menu')}
            data-testid="nb-menu-btn"
          >
            {t('menu')}
          </button>
        </div>
      </div>
    );
  }

  const game = g!;
  const shotClass = (r: string | undefined) =>
    r === 'miss' ? styles.miss : r === 'hit' ? styles.hit : r === 'sunk' ? styles.sunk : '';
  const ownShips = new Set(game.fleets[0].flatMap((s) => s.cells));
  // The enemy fleet shows once the battle is over, or all along to a spectator.
  const enemyShipsShown = new Set(
    game.phase === 'over' || mode === 'watch' ? game.fleets[1].flatMap((s) => s.cells) : [],
  );
  const left = afloat(game, 0);
  return (
    <div className={shared.play} data-testid="naval">
      <p className={styles.status}>
        {t('afloat', { ships: left.join(' · ') || '—' })} ·{' '}
        {t('shots', { n: Object.keys(game.shots[0]).length })}
      </p>
      <Grid
        onCell={(c) => myTurn && fire(c)}
        label={mode === 'watch' ? t('leftWaters') : t('enemyWaters')}
        render={(c) =>
          [
            shotClass(game.shots[0][c]),
            enemyShipsShown.has(c) && !(c in game.shots[0]) ? styles.reveal : '',
            hint === c ? styles.hinted : '',
            myTurn && !(c in game.shots[0]) ? styles.open : '',
          ].join(' ')
        }
        testid="nb-enemy"
        name={(c) =>
          t('cell', {
            cell: cellName(c),
            state: game.shots[0][c] ? t(`state.${game.shots[0][c]}`) : '',
          })
        }
        disabled={(c) => !myTurn || c in game.shots[0]}
      />
      <p className={shared.message} data-testid="nb-message" aria-live="polite">
        {message}
        {message ? ' ' : ''}
        {game.phase === 'play'
          ? myTurn
            ? t('yourTurn')
            : mode === 'play'
              ? t('thinking')
              : ''
          : ''}
      </p>
      <Grid
        small
        label={mode === 'watch' ? t('rightWaters') : t('yourFleet')}
        render={(c) => [ownShips.has(c) ? styles.ship : '', shotClass(game.shots[1][c])].join(' ')}
        testid="nb-own"
        name={(c) => cellName(c)}
      />
      <div className={shared.controls}>
        {myTurn && (
          <button type="button" className="btn" onClick={showHint} data-testid="nb-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(game.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              mode === 'watch'
                ? start(newNaval(randomSeed() >>> 0), 'watch', 'hard')
                : (setPlacing(FLEET.map(() => null)), setCurrent(0), setMode('place'))
            }
            data-testid="nb-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="nb-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}

function Grid({
  onCell,
  render,
  label,
  testid,
  name,
  disabled,
  small,
}: {
  onCell?: (c: number) => void;
  render: (c: number) => string;
  label: string;
  testid: string;
  name: (c: number) => string;
  disabled?: (c: number) => boolean;
  small?: boolean;
}) {
  return (
    <div className={[styles.gridWrap, small ? styles.small : ''].join(' ')}>
      <div className={styles.gridLabel}>{label}</div>
      <div className={styles.grid} role="grid" aria-label={label} data-testid={testid}>
        <span />
        {Array.from({ length: SIZE }, (_, i) => (
          <span key={`c${i}`} className={styles.axis}>
            {i + 1}
          </span>
        ))}
        {Array.from({ length: SIZE }, (_, r) => [
          <span key={`r${r}`} className={styles.axis}>
            {'ABCDEFGHIJ'[r]}
          </span>,
          ...Array.from({ length: SIZE }, (_, k) => {
            const c = r * SIZE + k;
            return onCell ? (
              <button
                key={c}
                type="button"
                className={[styles.cell, render(c)].join(' ')}
                onClick={() => onCell(c)}
                disabled={disabled?.(c)}
                aria-label={name(c)}
                data-testid={`${testid}-${c}`}
              />
            ) : (
              <span
                key={c}
                className={[styles.cell, render(c)].join(' ')}
                aria-label={name(c)}
                data-testid={`${testid}-${c}`}
              />
            );
          }),
        ])}
      </div>
    </div>
  );
}
