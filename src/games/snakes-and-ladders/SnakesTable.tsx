/**
 * The Snakes and Ladders table: a menu (game, number of players, computer or human opponents, new
 * game, resume, watch the AI), the 10×10 board with its ladders and snakes, the players' counters,
 * the dice (pick one in the Choice variant, with a hint from the planner), and computer turns
 * played with short pauses.
 */
import { Bot, Dices, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { naiveAction, plannedAction, turnsLeft } from './ai';
import { LADDERS, SIZE, SNAKES, cellOf, land } from './engine';
import { STRINGS } from './i18n';
import { act, isValidSnakes, newSnakes, type SnakesGame, type Variant } from './match';
import { SNAKES_SOUNDS } from './sounds';
import styles from './Snakes.module.css';

type Opponents = 'computer' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const VARIANTS: Variant[] = ['classic', 'choice'];
const COUNTS = [2, 3, 4];
const COLOURS = ['#e5484d', '#3e63dd', '#30a46c', '#f1c40f'];
const U = 40;

interface Saved {
  state: SnakesGame;
  opponents: Opponents;
}

const centre = (sq: number): [number, number] => {
  const [r, c] = cellOf(sq);
  return [c * U + U / 2, r * U + U / 2];
};

export function SnakesTable({ services }: { services: GameServices }) {
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
          ['computer', 'humans'].includes((d as Saved).opponents) &&
          isValidSnakes((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [variant, setVariant] = useState<Variant>('classic');
  const [count, setCount] = useState(2);
  const [opponents, setOpponents] = useState<Opponents>('computer');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SnakesGame | null>(null);
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

  const human = (p: number) => mode === 'play' && (opponents === 'humans' || p === 0);
  const isYou = (p: number) => mode === 'play' && opponents === 'computer' && p === 0;
  const name = (p: number) => t(`player.${p}`);
  const say = (key: string, p: number, params: Record<string, string | number> = {}) =>
    t(isYou(p) ? `${key}.you` : key, { side: name(p), ...params });

  const start = (g: SnakesGame, m: Mode, o: Opponents) => {
    setState(g);
    setMode(m);
    setOpponents(o);
    setVariant(g.variant);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, opponents: o });
  };
  const fresh = (m: Mode, v: Variant, n: number, o: Opponents, seed: number) =>
    start(newSnakes(v, n, seed), m, o);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'choice', 2, 'computer', fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: SnakesGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setState(next);
    if (action === 'roll') svc.playSound(SNAKES_SOUNDS.roll);
    const moved = next.last && next.last !== before.last ? next.last : null;
    if (moved) {
      const climbed = LADDERS[moved.reached] !== undefined;
      const slid = SNAKES[moved.reached] !== undefined;
      svc.playSound(
        climbed ? SNAKES_SOUNDS.ladder : slid ? SNAKES_SOUNDS.snake : SNAKES_SOUNDS.move,
      );
      setMessage(
        climbed
          ? say('ladder', moved.player, { from: moved.reached, to: moved.to })
          : slid
            ? say('snake', moved.player, { from: moved.reached, to: moved.to })
            : moved.from === moved.to
              ? say('overshoot', moved.player)
              : '',
      );
    }
    if (next.phase === 'over' && next.winner !== null) {
      setMessage(say('won', next.winner));
      if (mode === 'play') {
        if (opponents === 'computer') {
          const won = next.winner === 0;
          svc.playSound(won ? SNAKES_SOUNDS.win : SNAKES_SOUNDS.lose);
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score: next.pos[0]!,
            mode: `${next.variant}-${next.players}`,
          });
          if (won) {
            svc.unlockAchievement('first');
            if (next.variant === 'choice') svc.unlockAchievement('choice');
            if (next.snakes[0] === 0) svc.unlockAchievement('charmed');
            if (next.players === 4) svc.unlockAchievement('four');
          }
        } else svc.playSound(SNAKES_SOUNDS.win);
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, opponents });
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // Computer players (both in watch mode) act after a pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over' || human(state.turn)) return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        // In watch mode the planner (red) plays the naive big-step player (blue).
        if (g) doAction(mode === 'watch' && g.turn === 1 ? naiveAction(g) : plannedAction(g));
      },
      state.phase === 'roll' ? 600 : 700,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && human(g.turn) && g.phase !== 'over';

  const showHint = () => {
    if (!g || !myTurn || g.phase !== 'choose') return;
    servicesRef.current.playSound(SNAKES_SOUNDS.hint);
    const i = Number(plannedAction(g).slice(4));
    const e = turnsLeft();
    const to = land(g.pos[g.turn]!, g.dice![i]!);
    setHint(i);
    setMessage(t('hint.use', { die: g.dice![i]!, to, turns: e[to]!.toFixed(1) }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if ((k === 'r' || k === ' ') && g.phase === 'roll') doAction('roll');
    else if (
      (k === '1' || k === '2') &&
      g.phase === 'choose' &&
      (k === '1' || g.dice![0] !== g.dice![1])
    )
      doAction(`use:${Number(k) - 1}`);
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'over') {
      const kept = { state: cur, opponents };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g) {
    return (
      <div className={shared.menu} data-testid="sl-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.opponents)}
              data-testid="sl-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    variant: t(`variant.${saved.state.variant}`),
                    n: saved.state.players,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.variant')}</legend>
            <div className={shared.segmented}>
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={variant === v}
                  onClick={() => setVariant(v)}
                  data-testid={`sl-variant-${v}`}
                >
                  {t(`variant.${v}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`variant.${variant}.hint`)}</p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.players')}</legend>
            <div className={shared.segmented}>
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                  data-testid={`sl-count-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className={shared.segmented}>
              {(['computer', 'humans'] as Opponents[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={opponents === o}
                  onClick={() => setOpponents(o)}
                  data-testid={`sl-opp-${o}`}
                >
                  {t(`opponents.${o}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                fresh('play', variant, count, opponents, fixedSeed ?? randomSeed() >>> 0)
              }
              data-testid="sl-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                fresh('watch', 'choice', 2, 'computer', fixedSeed ?? randomSeed() >>> 0)
              }
              data-testid="sl-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const snakePath = (head: number, tail: number) => {
    const [x1, y1] = centre(head);
    const [x2, y2] = centre(tail);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = (y2 - y1) * 0.25;
    const dy = (x1 - x2) * 0.25;
    return `M${x1},${y1} Q${mx + dx},${my + dy} ${mx},${my} T${x2},${y2}`;
  };

  return (
    <div className={shared.play} data-testid="snakes">
      <div className={styles.bar}>
        {g.pos.map((sq, p) => (
          <span
            key={p}
            className={[styles.chip, p === g.turn && g.phase !== 'over' ? styles.current : ''].join(
              ' ',
            )}
            style={{ ['--c' as string]: COLOURS[p] }}
            data-testid={`sl-player-${p}`}
          >
            {name(p)}
            {isYou(p) ? ` (${t('you')})` : ''} · {sq}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${10 * U} ${10 * U}`}
        className={styles.board}
        role="img"
        aria-label={t('board')}
        data-testid="sl-board"
      >
        {Array.from({ length: SIZE }, (_, i) => i + 1).map((sq) => {
          const [r, c] = cellOf(sq);
          return (
            <g key={sq}>
              <rect
                x={c * U}
                y={r * U}
                width={U}
                height={U}
                className={(r + c) % 2 ? styles.dark : styles.light}
              />
              <text x={c * U + 3} y={r * U + 11} className={styles.num}>
                {sq}
              </text>
            </g>
          );
        })}
        {Object.entries(LADDERS).map(([foot, top]) => {
          const [x1, y1] = centre(Number(foot));
          const [x2, y2] = centre(top);
          const len = Math.hypot(x2 - x1, y2 - y1);
          const nx = ((y2 - y1) / len) * 7;
          const ny = (-(x2 - x1) / len) * 7;
          const rungs = Math.floor(len / 14);
          return (
            <g key={`l${foot}`} className={styles.ladder}>
              <line x1={x1 + nx} y1={y1 + ny} x2={x2 + nx} y2={y2 + ny} />
              <line x1={x1 - nx} y1={y1 - ny} x2={x2 - nx} y2={y2 - ny} />
              {Array.from({ length: rungs }, (_, k) => {
                const f = (k + 0.5) / rungs;
                const x = x1 + (x2 - x1) * f;
                const y = y1 + (y2 - y1) * f;
                return <line key={k} x1={x + nx} y1={y + ny} x2={x - nx} y2={y - ny} />;
              })}
            </g>
          );
        })}
        {Object.entries(SNAKES).map(([head, tail]) => {
          const [hx, hy] = centre(Number(head));
          return (
            <g key={`s${head}`} className={styles.snake}>
              <path d={snakePath(Number(head), tail)} />
              <circle cx={hx} cy={hy} r={6} className={styles.head} />
            </g>
          );
        })}
        {g.pos.map((sq, p) => {
          const [x, y] = sq === 0 ? [-U, 0] : centre(sq);
          if (sq === 0) return null;
          const off = (p - (g.players - 1) / 2) * 6;
          return (
            <circle
              key={`p${p}`}
              cx={x + off}
              cy={y + off / 2}
              r={9}
              fill={COLOURS[p]}
              className={styles.token}
              data-player={p}
              data-square={sq}
            />
          );
        })}
      </svg>
      <div className={styles.diceRow} data-testid="sl-dice">
        {(g.dice ?? (g.variant === 'choice' ? [0, 0] : [0])).map((d, i) => {
          const pickable = myTurn && g.phase === 'choose' && (i === 0 || g.dice![0] !== g.dice![1]);
          return (
            <button
              key={i}
              type="button"
              className={[styles.die, d ? '' : styles.idle, hint === i ? styles.pointed : ''].join(
                ' ',
              )}
              disabled={!pickable}
              onClick={() => doAction(`use:${i}`)}
              data-testid={`sl-die-${i}`}
              aria-label={pickable ? t('useDie', { n: d }) : t('die', { n: d || '–' })}
            >
              {d || '·'}
            </button>
          );
        })}
      </div>
      <p className={shared.message} data-testid="sl-message" aria-live="polite">
        {message ||
          (g.phase === 'roll'
            ? myTurn
              ? say('toRoll', g.turn)
              : t('thinking', { side: name(g.turn) })
            : g.phase === 'choose'
              ? myTurn
                ? t('pick')
                : t('thinking', { side: name(g.turn) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn && g.phase === 'roll' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('roll')}
            data-testid="sl-roll"
          >
            <Dices size={16} /> {t('roll')}
          </button>
        )}
        {myTurn && g.phase === 'choose' && (
          <button type="button" className="btn" onClick={showHint} data-testid="sl-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, g.variant, g.players, opponents, randomSeed() >>> 0)}
            data-testid="sl-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="sl-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && (
        <p className={shared.hintText}>{t(g.variant === 'choice' ? 'keys.choice' : 'keys')}</p>
      )}
    </div>
  );
}
