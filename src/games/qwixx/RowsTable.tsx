/**
 * The Colour Rows table: a menu (players, opponents' level or all human, new game, resume, watch
 * the AI), the six dice, the sheet of the player deciding (or yours against the computer) with the
 * numbers that can be crossed lit up, penalties and row scores, small sheets for the other players,
 * pass and roll buttons, hints, and computer decisions played with short pauses.
 */
import { Bot, Dices, Lightbulb, Lock, Play, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { carefulAction, plannerAction } from './ai';
import {
  CELLS,
  MAX_PENALTIES,
  ROWS,
  act,
  decider,
  isValidRows,
  markOptions,
  newRows,
  numberAt,
  rowScore,
  sheetScore,
  whiteSum,
  type RowsGame,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Rows.module.css';
import { ROWS_SOUNDS } from './sounds';

type Level = 'easy' | 'hard' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard', 'humans'];
const COUNTS = [1, 2, 3, 4];
export const ROW_COLOURS = ['#e5484d', '#f1c40f', '#30a46c', '#3e63dd'];

interface Saved {
  state: RowsGame;
  level: Level;
}

function Pips({ n }: { n: number }) {
  const spots: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [
      [0, 0],
      [2, 2],
    ],
    3: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    4: [
      [0, 0],
      [0, 2],
      [2, 0],
      [2, 2],
    ],
    5: [
      [0, 0],
      [0, 2],
      [1, 1],
      [2, 0],
      [2, 2],
    ],
    6: [
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 2],
      [2, 0],
      [2, 2],
    ],
  };
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true">
      {(spots[n] ?? []).map(([r, c], i) => (
        <circle key={i} cx={7 + c * 8} cy={7 + r * 8} r={3} />
      ))}
    </svg>
  );
}

export function RowsTable({ services }: { services: GameServices }) {
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
          isValidRows((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<RowsGame | null>(null);
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
  const name = (p: number) =>
    isYou(p)
      ? t('you')
      : mode === 'play' && level !== 'humans'
        ? t('cpu', { n: p })
        : t('player', { n: p + 1 });
  const say = (key: string, p: number, params: Record<string, string | number> = {}) =>
    t(isYou(p) ? `${key}.you` : key, { side: name(p), ...params });

  const start = (g: RowsGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) => start(newRows(n, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: RowsGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    const seat = decider(before);
    setHint(null);
    setState(next);
    const notes: string[] = [];
    if (action.startsWith('mark:')) {
      const [, r, n] = action.split(':');
      notes.push(say('marked', seat, { n: n!, row: t(`row.${r}`) }));
      svc.playSound(ROWS_SOUNDS.mark);
    } else if (action === 'pass') {
      notes.push(say('passed', seat));
      svc.playSound(ROWS_SOUNDS.pass);
    } else svc.playSound(ROWS_SOUNDS.roll);
    const ev = next.event;
    if (ev && before.phase !== 'roll' && (next.phase === 'roll' || next.phase === 'over')) {
      if (ev.penalty !== null) {
        notes.push(say('penalty', ev.penalty));
        svc.playSound(ROWS_SOUNDS.penalty);
      }
      for (const r of ev.locked) notes.push(t('locked', { row: t(`row.${r}`) }));
      if (ev.locked.length) svc.playSound(ROWS_SOUNDS.lock);
    }
    if (next.phase === 'over') {
      const scores = next.sheets.map(sheetScore);
      const top = Math.max(...scores);
      const winners = scores.flatMap((s, p) => (s === top ? [p] : []));
      const solo = next.players === 1;
      notes.push(
        solo
          ? t('solo', { n: scores[0]! })
          : winners.length > 1
            ? t('tie', { n: top })
            : say('won', winners[0]!, { n: top }),
      );
      if (mode === 'play') {
        const won = solo || (winners.length === 1 && winners[0] === 0);
        if (!solo) svc.playSound(won ? ROWS_SOUNDS.win : ROWS_SOUNDS.lose);
        if (level !== 'humans' || solo) {
          svc.recordResult({
            outcome: solo ? 'complete' : won ? 'win' : winners.includes(0) ? 'draw' : 'loss',
            score: scores[0]!,
            mode: solo ? 'solo' : `${level}-${next.players}`,
          });
          svc.unlockAchievement('first');
          if (scores[0]! >= 100) svc.unlockAchievement('century');
          if (next.sheets[0]!.locks.some(Boolean)) svc.unlockAchievement('lock');
          if (won && !solo) svc.unlockAchievement('beat');
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

  // Computer players (all of them in watch mode) decide after a pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over' || human(decider(state))) return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (!g) return;
        const strong = mode === 'watch' ? decider(g) === 0 : level === 'hard';
        doAction(strong ? plannerAction(g) : carefulAction(g));
      },
      state.phase === 'roll' ? 600 : 750,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const seat = g ? decider(g) : 0;
  const myTurn = !!g && g.phase !== 'over' && human(seat);
  // The sheet on show: yours against the computer, otherwise the deciding player's.
  const shown = g ? (mode === 'play' && level !== 'humans' ? 0 : g.phase === 'over' ? 0 : seat) : 0;
  const live = myTurn && g && shown === seat ? markOptions(g) : [];
  const isLive = (r: number, n: number) => live.some(([lr, ln]) => lr === r && ln === n);

  const showHint = () => {
    if (!g || !myTurn) return;
    servicesRef.current.playSound(ROWS_SOUNDS.hint);
    const a = plannerAction(g);
    setHint(a);
    if (a.startsWith('mark:')) {
      const [, r, n] = a.split(':');
      setMessage(t('hint.mark', { n: n!, row: t(`row.${r}`) }));
    } else setMessage(t(a === 'roll' ? 'hint.roll' : 'hint.pass'));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if ((k === 'r' || k === ' ') && g.phase === 'roll') doAction('roll');
    else if (k === 'p' && g.phase !== 'roll') doAction('pass');
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
    const levelHint = count === 1 ? t('level.solo.hint') : t(`level.${level}.hint`);
    return (
      <div className={shared.menu} data-testid="cr-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid="cr-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>{t('menu.resumeHint', { n: saved.state.players })}</small>
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
                  data-testid={`cr-count-${n}`}
                >
                  {n}
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
                    data-testid={`cr-level-${lv}`}
                  >
                    {t(`level.${lv}`)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <p className={shared.hintText}>{levelHint}</p>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', level, count, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="cr-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="cr-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sheet = g.sheets[shown]!;
  const prompt =
    g.phase === 'over'
      ? ''
      : !myTurn
        ? t('thinking', { side: name(seat) })
        : g.phase === 'roll'
          ? isYou(seat)
            ? t('toRoll')
            : t('toRoll.other', { side: name(seat) })
          : g.phase === 'white'
            ? seat === g.active
              ? t('white', { n: whiteSum(g.dice!) })
              : t('whiteOther', { side: name(g.active), n: whiteSum(g.dice!) })
            : t(g.activeMarked ? 'colour' : 'colourRisk');

  return (
    <div className={shared.play} data-testid="colour-rows">
      <div className={styles.players}>
        {g.sheets.map((s, p) => (
          <span
            key={p}
            className={[
              styles.chip,
              p === g.active && g.phase !== 'over' ? styles.current : '',
              p === seat && g.phase !== 'over' ? styles.deciding : '',
            ].join(' ')}
            data-testid={`cr-score-${p}`}
          >
            {name(p)} · {sheetScore(s)}
            {s.penalties > 0 && <small> {'✕'.repeat(s.penalties)}</small>}
          </span>
        ))}
      </div>
      <div className={styles.dice} data-testid="cr-dice">
        {g.dice ? (
          <>
            {g.dice.white.map((d, i) => (
              <span
                key={`w${i}`}
                className={[styles.die, styles.white].join(' ')}
                aria-label={t('die', { colour: t('dc.white'), n: d })}
              >
                <Pips n={d} />
              </span>
            ))}
            {g.dice.colour.map((d, r) =>
              d === null ? null : (
                <span
                  key={`c${r}`}
                  className={[styles.die, g.phase === 'white' ? styles.idle : ''].join(' ')}
                  style={{ ['--c' as string]: ROW_COLOURS[r] }}
                  aria-label={t('die', { colour: t(`dc.${r}`), n: d })}
                >
                  <Pips n={d} />
                </span>
              ),
            )}
          </>
        ) : (
          <span className={styles.placeholder}>{g.phase === 'over' ? '' : t('roll')}</span>
        )}
      </div>
      <p className={shared.message} data-testid="cr-message" aria-live="polite">
        {message}
        {message && prompt ? ' ' : ''}
        {prompt}
      </p>
      <div
        className={styles.sheet}
        data-testid="cr-sheet"
        aria-label={isYou(shown) ? t('sheetOf.you') : t('sheetOf', { side: name(shown) })}
      >
        {Array.from({ length: ROWS }, (_, r) => {
          const marks = sheet.marks[r]!;
          const last = marks.length ? marks[marks.length - 1]! : -1;
          return (
            <div
              key={r}
              className={[styles.row, g.locked[r] ? styles.lockedRow : ''].join(' ')}
              style={{ ['--c' as string]: ROW_COLOURS[r] }}
            >
              {Array.from({ length: CELLS }, (_, pos) => {
                const n = numberAt(r, pos);
                const crossed = marks.includes(pos);
                const can = isLive(r, n);
                const hinted = hint === `mark:${r}:${n}`;
                return (
                  <button
                    key={pos}
                    type="button"
                    className={[
                      styles.cell,
                      crossed ? styles.crossed : '',
                      !crossed && pos < last ? styles.skipped : '',
                      can ? styles.live : '',
                      hinted ? styles.hinted : '',
                    ].join(' ')}
                    disabled={!can}
                    onClick={() => doAction(`mark:${r}:${n}`)}
                    aria-label={t('cell', { n, row: t(`row.${r}`) })}
                    aria-pressed={crossed}
                    data-testid={`cr-cell-${r}-${n}`}
                    data-live={can || undefined}
                  >
                    {n}
                    {crossed && (
                      <X className={styles.cross} size={22} strokeWidth={3} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
              <span
                className={[styles.lock, sheet.locks[r] ? styles.crossed : ''].join(' ')}
                aria-label={t('lock', { row: t(`row.${r}`) })}
              >
                <Lock size={13} />
                {sheet.locks[r] && (
                  <X className={styles.cross} size={20} strokeWidth={3} aria-hidden="true" />
                )}
              </span>
              <span className={styles.rowScore}>{rowScore(sheet, r)}</span>
            </div>
          );
        })}
        <div className={styles.footer}>
          <span>{t('penalties')}</span>
          {Array.from({ length: MAX_PENALTIES }, (_, i) => (
            <span
              key={i}
              className={[styles.penalty, i < sheet.penalties ? styles.taken : ''].join(' ')}
              data-testid={i < sheet.penalties ? 'cr-penalty' : undefined}
            >
              {i < sheet.penalties ? '✕' : ''}
            </span>
          ))}
          <strong className={styles.total}>{t('total', { n: sheetScore(sheet) })}</strong>
        </div>
      </div>
      <div className={shared.controls}>
        {myTurn && g.phase === 'roll' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('roll')}
            data-testid="cr-roll"
          >
            <Dices size={16} /> {t('roll')}
          </button>
        )}
        {myTurn && g.phase !== 'roll' && (
          <button
            type="button"
            className={['btn', hint === 'pass' ? 'btn-primary' : ''].join(' ')}
            onClick={() => doAction('pass')}
            data-testid="cr-pass"
          >
            {t('pass')}
          </button>
        )}
        {myTurn && (
          <button type="button" className="btn" onClick={showHint} data-testid="cr-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.players, randomSeed() >>> 0)}
            data-testid="cr-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="cr-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
