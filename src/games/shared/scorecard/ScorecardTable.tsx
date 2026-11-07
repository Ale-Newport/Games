/**
 * The scorecard dice table shared by Five Dice and Generala: a menu (players, opponents' level or
 * all human, solo, new game, resume, watch the AI), five dice that can be held between rolls, the
 * scorecard with what the current hand would score in each open box (tap one to score it), hints
 * from the turn planner, and computer turns played with short pauses.
 */
import { Bot, Dices, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import shared from '../sudoku/SudokuGame.module.css';
import {
  act,
  handOf,
  isValidDiceGame,
  newDiceGame,
  totals,
  winners,
  type DiceGame,
  type ScoreRules,
} from './game';
import { SCORECARD_STRINGS } from './i18n';
import { plannedAction, simpleAction, type Planning } from './planner';
import { SCORECARD_SOUNDS } from './sounds';
import styles from './ScorecardTable.module.css';

type Level = 'easy' | 'hard' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard', 'humans'];
const COUNTS = [1, 2, 3, 4];
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

interface Saved {
  state: DiceGame;
  level: Level;
}

export interface ScorecardTableProps {
  services: GameServices;
  rules: ScoreRules;
  planning: Planning;
  prefix: string;
  /** Title, subtitle and box labels (`box.<id>`), plus any overrides. */
  strings: Record<Locale, Dictionary>;
  /** Game-specific achievements when the person finishes a game (won against the computer or not). */
  onFinished?: (
    g: DiceGame,
    ctx: { won: boolean; vsComputer: boolean; total: number; unlock: (id: string) => void },
  ) => void;
}

export function ScorecardTable({
  services,
  rules,
  planning,
  prefix,
  strings,
  onFinished,
}: ScorecardTableProps) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...SCORECARD_STRINGS.en, ...strings.en },
          es: { ...SCORECARD_STRINGS.es, ...strings.es },
        },
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
          isValidDiceGame(rules, (d as Saved).state),
      }),
    [services, rules],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<DiceGame | null>(null);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [hint, setHint] = useState<string | null>(null);
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

  const human = (p: number) => mode === 'play' && (level === 'humans' || p === 0);
  const isYou = (p: number) => mode === 'play' && level !== 'humans' && p === 0;
  const name = (p: number, g: DiceGame) =>
    g.players === 1
      ? t('you')
      : isYou(p)
        ? t('you')
        : t(level === 'humans' || mode === 'watch' ? 'player' : 'cpu', { n: p + 1 });

  const start = (g: DiceGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setHeld([false, false, false, false, false]);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) => start(newDiceGame(n, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: DiceGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setState(next);
    if (action.startsWith('roll:')) {
      svc.playSound(SCORECARD_SOUNDS.roll);
      setHeld(
        action
          .slice(5)
          .split('')
          .map((x) => x === '1'),
      );
      setMessage('');
    } else {
      const box = action.slice(6);
      const score = next.cards[before.turn]![box]!;
      svc.playSound(score > 0 ? SCORECARD_SOUNDS.score : SCORECARD_SOUNDS.zero);
      setHeld([false, false, false, false, false]);
      setMessage(
        t(isYou(before.turn) || before.players === 1 ? 'scored.you' : 'scored', {
          side: name(before.turn, before),
          box: t(`box.${box}`),
          n: score,
        }),
      );
    }
    if (next.phase === 'over') {
      const tot = totals(rules, next);
      const win = winners(rules, next);
      const instant = next.instant !== null;
      setMessage(
        next.players === 1
          ? t('over.solo', { n: tot[0]! })
          : win.length > 1
            ? t('over.tie', { n: tot[win[0]!]! })
            : t(
                isYou(win[0]!)
                  ? instant
                    ? 'over.instant.you'
                    : 'over.won.you'
                  : instant
                    ? 'over.instant'
                    : 'over.won',
                {
                  side: name(win[0]!, next),
                  n: tot[win[0]!]!,
                },
              ),
      );
      if (mode === 'play') {
        const vsComputer = level !== 'humans' && next.players > 1;
        const won = next.players === 1 || (win.length === 1 && win[0] === 0);
        svc.playSound(won ? SCORECARD_SOUNDS.win : SCORECARD_SOUNDS.lose);
        if (level !== 'humans' || next.players === 1) {
          svc.recordResult({
            outcome:
              next.players === 1 ? 'complete' : won ? 'win' : win.includes(0) ? 'draw' : 'loss',
            score: tot[0]!,
            mode: next.players === 1 ? 'solo' : `${level}-${next.players}`,
          });
          onFinished?.(next, {
            won,
            vsComputer,
            total: tot[0]!,
            unlock: (id) => svc.unlockAchievement(id),
          });
        }
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(rules, g, a), a);
  };

  // Computer players (all of them in watch mode) act after a pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over' || human(state.turn)) return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (!g) return;
        const strong = mode === 'watch' ? g.turn === 0 : level === 'hard';
        doAction(strong ? plannedAction(rules, planning, g) : simpleAction(rules, g));
      },
      state.rolls === 0 ? 500 : 900,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && human(g.turn) && g.phase !== 'over';
  const hand = g ? handOf(g) : null;

  const rollNow = () => {
    if (!g || !myTurn || g.rolls >= 3) return;
    doAction(`roll:${g.rolls === 0 ? '00000' : held.map((h) => (h ? '1' : '0')).join('')}`);
  };
  const scoreBox = (box: string) => {
    if (!g || !myTurn || !hand || !rules.openBoxes(g.cards[g.turn]!, hand).includes(box)) return;
    doAction(`score:${box}`);
  };
  const showHint = () => {
    if (!g || !myTurn || g.rolls === 0) return;
    servicesRef.current.playSound(SCORECARD_SOUNDS.hint);
    const a = plannedAction(rules, planning, g);
    setHint(a);
    if (a.startsWith('score:')) setMessage(t('hint.score', { box: t(`box.${a.slice(6)}`) }));
    else {
      const keep = a
        .slice(5)
        .split('')
        .flatMap((x, i) => (x === '1' ? [g.dice![i]!] : []));
      setMessage(keep.length ? t('hint.keep', { dice: keep.join(' ') }) : t('hint.rerollAll'));
      setHeld(
        a
          .slice(5)
          .split('')
          .map((x) => x === '1'),
      );
    }
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if (k === 'r' || k === ' ') rollNow();
    else if (/^[1-5]$/.test(k) && g.rolls > 0 && g.rolls < 3)
      setHeld((h) => h.map((x, i) => (i === Number(k) - 1 ? !x : x)));
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
      <div className={shared.menu} data-testid={`${prefix}-menu`}>
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid={`${prefix}-resume`}
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    n: saved.state.players,
                    total: totals(rules, saved.state)[0]!,
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
                  data-testid={`${prefix}-count-${n}`}
                >
                  {n === 1 ? t('solo') : n}
                </button>
              ))}
            </div>
          </fieldset>
          {count > 1 && (
            <fieldset className={shared.group}>
              <legend>{t('menu.level')}</legend>
              <div className={shared.segmented}>
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    aria-pressed={level === lv}
                    onClick={() => setLevel(lv)}
                    data-testid={`${prefix}-level-${lv}`}
                  >
                    {t(`level.${lv}`)}
                  </button>
                ))}
              </div>
              <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
            </fieldset>
          )}
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                fresh(
                  'play',
                  count === 1 ? 'humans' : level,
                  count,
                  fixedSeed ?? randomSeed() >>> 0,
                )
              }
              data-testid={`${prefix}-start`}
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0)}
              data-testid={`${prefix}-watch`}
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tot = totals(rules, g);
  const card = g.cards[g.turn]!;
  const open = hand ? rules.openBoxes(card, hand) : [];
  const upperSum = (p: number) => rules.upper.reduce((n, b) => n + (g.cards[p]![b] ?? 0), 0);
  return (
    <div className={shared.play} data-testid={prefix}>
      <div className={styles.diceRow} data-testid={`${prefix}-dice`}>
        {(g.dice ?? [0, 0, 0, 0, 0]).map((d, i) => {
          const canHold = myTurn && g.rolls > 0 && g.rolls < 3;
          return (
            <button
              key={i}
              type="button"
              className={[
                styles.die,
                held[i] && g.rolls > 0 ? styles.held : '',
                d ? '' : styles.blank,
              ].join(' ')}
              onClick={() => canHold && setHeld((h) => h.map((x, j) => (j === i ? !x : x)))}
              disabled={!canHold}
              aria-pressed={held[i] && g.rolls > 0}
              aria-label={d ? t(held[i] ? 'die.held' : 'die', { n: d }) : t('die.none')}
              data-testid={`${prefix}-die-${i}`}
            >
              <svg viewBox="-12 -12 24 24" className={styles.face}>
                {d
                  ? PIPS[d]!.map(([x, y], k) => <circle key={k} cx={x * 6} cy={y * 6} r={2.2} />)
                  : null}
              </svg>
            </button>
          );
        })}
      </div>
      <p className={shared.message} data-testid={`${prefix}-message`} aria-live="polite">
        {message ||
          (myTurn
            ? g.rolls === 0
              ? t('toRoll')
              : g.rolls < 3
                ? t('pick', { n: 3 - g.rolls })
                : t('mustScore')
            : t('thinking', { side: name(g.turn, g) }))}
      </p>
      <div className={shared.controls}>
        {myTurn && g.rolls < 3 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={rollNow}
            data-testid={`${prefix}-roll`}
          >
            <Dices size={16} /> {t(g.rolls === 0 ? 'roll' : 'reroll', { n: 3 - g.rolls })}
          </button>
        )}
        {myTurn && g.rolls > 0 && (
          <button type="button" className="btn" onClick={showHint} data-testid={`${prefix}-hint`}>
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.players, randomSeed() >>> 0)}
            data-testid={`${prefix}-again`}
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid={`${prefix}-menu-btn`}>
          {t('menu')}
        </button>
      </div>
      <table className={styles.card} data-testid={`${prefix}-card`}>
        <thead>
          <tr>
            <th />
            {g.cards.map((_, p) => (
              <th key={p} className={p === g.turn && g.phase !== 'over' ? styles.current : ''}>
                {name(p, g)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.boxes.map((box) => {
            const can = myTurn && open.includes(box);
            const preview = can && hand ? rules.scoreFor(card, box, hand, g.rolls === 1) : null;
            return (
              <tr
                key={box}
                className={rules.upper[rules.upper.length - 1] === box ? styles.split : ''}
              >
                <th scope="row">{t(`box.${box}`)}</th>
                {g.cards.map((c, p) => (
                  <td key={p}>
                    {c[box] !== undefined ? (
                      c[box]
                    ) : p === g.turn && preview !== null ? (
                      <button
                        type="button"
                        className={[
                          styles.preview,
                          hint === `score:${box}` ? styles.pointed : '',
                        ].join(' ')}
                        onClick={() => scoreBox(box)}
                        data-testid={`${prefix}-box-${box}`}
                        aria-label={t('scoreIn', { box: t(`box.${box}`), n: preview })}
                      >
                        {preview}
                      </button>
                    ) : (
                      ''
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr className={styles.sum}>
            <th scope="row">{t('upper')}</th>
            {g.cards.map((_, p) => (
              <td key={p}>{upperSum(p)}</td>
            ))}
          </tr>
          <tr className={styles.total}>
            <th scope="row">{t('total')}</th>
            {tot.map((v, p) => (
              <td key={p} data-testid={`${prefix}-total-${p}`}>
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
