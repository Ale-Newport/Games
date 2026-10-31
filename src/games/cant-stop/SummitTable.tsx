/**
 * The Summit Rush table: a menu (players, opponents' level or all human, new game, resume, watch the
 * AI), the eleven columns with every player's markers, this turn's climbers and the claimed
 * summits, the four dice and the climbs they allow, roll and stop buttons, hints with the exact
 * chance of a bust, and computer turns played with short pauses.
 */
import { Bot, Dices, Flag, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { cautiousAction, strategistAction } from './ai';
import {
  COLUMNS,
  HEIGHT,
  act,
  bustChance,
  isValidSummit,
  newSummit,
  options,
  type SummitGame,
} from './engine';
import { STRINGS } from './i18n';
import styles from './Summit.module.css';
import { SUMMIT_SOUNDS } from './sounds';

type Level = 'easy' | 'hard' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard', 'humans'];
const COUNTS = [2, 3, 4];
const COLOURS = ['#e5484d', '#3e63dd', '#30a46c', '#f1c40f'];

interface Saved {
  state: SummitGame;
  level: Level;
}

export function SummitTable({ services }: { services: GameServices }) {
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
          isValidSummit((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [count, setCount] = useState(2);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<SummitGame | null>(null);
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
  const name = (p: number) => (isYou(p) ? t('you') : t(`colour.${p}`));
  const say = (key: string, p: number, params: Record<string, string | number> = {}) =>
    t(isYou(p) ? `${key}.you` : key, { side: name(p), ...params });

  const start = (g: SummitGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, seed: number) => start(newSummit(n, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: SummitGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    setHint(null);
    setState(next);
    const ev = next.event;
    if (action === 'roll')
      svc.playSound(ev?.kind === 'bust' ? SUMMIT_SOUNDS.bust : SUMMIT_SOUNDS.roll);
    else if (action === 'stop')
      svc.playSound(ev?.claimed.length ? SUMMIT_SOUNDS.claim : SUMMIT_SOUNDS.stop);
    else svc.playSound(SUMMIT_SOUNDS.climb);
    // A computer's plain rolls and climbs keep the last message (say, your stop) on screen.
    if (ev || human(before.turn))
      setMessage(
        ev?.kind === 'bust'
          ? say('bust', ev.player)
          : ev?.kind === 'stop'
            ? ev.claimed.length
              ? say('claimed', ev.player, { cols: ev.claimed.join(', ') })
              : say('stopped', ev.player)
            : '',
      );
    if (next.phase === 'over' && next.winner !== null) {
      setMessage(say('won', next.winner));
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(won ? SUMMIT_SOUNDS.win : SUMMIT_SOUNDS.lose);
        if (level !== 'humans') {
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score: Object.values(next.claimed).filter((p) => p === 0).length,
            mode: `${level}-${next.players}`,
          });
          if (won) {
            svc.unlockAchievement('first');
            if (level === 'hard') svc.unlockAchievement('hard');
            if (next.busts[0] === 0) svc.unlockAchievement('steady');
            if (Object.entries(next.claimed).some(([c, p]) => p === 0 && (c === '2' || c === '12')))
              svc.unlockAchievement('edge');
          }
        }
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // Computer players (all of them in watch mode) act after a pause.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over' || human(state.turn)) return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (g)
          doAction(
            (mode === 'watch' ? g.turn === 0 : level === 'hard')
              ? strategistAction(g)
              : cautiousAction(g),
          );
      },
      state.phase === 'roll' ? 700 : 900,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = !!g && human(g.turn) && g.phase !== 'over';
  const opts = g && g.phase === 'choose' ? options(g) : [];

  const showHint = () => {
    if (!g || !myTurn) return;
    servicesRef.current.playSound(SUMMIT_SOUNDS.hint);
    const a = strategistAction(g);
    setHint(a);
    if (a === 'stop' || a === 'roll')
      setMessage(
        t(a === 'stop' ? 'hint.stop' : 'hint.roll', { p: Math.round(bustChance(g) * 100) }),
      );
    else setMessage(t('hint.climb', { sums: a.slice(6).split(',').join(' + ') }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myTurn) return false;
    const k = e.key.toLowerCase();
    if ((k === 'r' || k === ' ') && g.phase === 'roll') doAction('roll');
    else if (k === 's' && g.phase === 'roll' && Object.keys(g.climbers).length) doAction('stop');
    else if (/^[1-6]$/.test(k) && g.phase === 'choose' && opts[Number(k) - 1])
      doAction(`climb:${opts[Number(k) - 1]!.join(',')}`);
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
      <div className={shared.menu} data-testid="sr-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid="sr-resume"
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
                  data-testid={`sr-count-${n}`}
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
                  data-testid={`sr-level-${lv}`}
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
              data-testid="sr-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', 2, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="sr-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const maxH = 13;
  return (
    <div className={shared.play} data-testid="summit">
      <div className={styles.players}>
        {Array.from({ length: g.players }, (_, p) => (
          <span
            key={p}
            className={[styles.chip, p === g.turn && g.phase !== 'over' ? styles.current : ''].join(
              ' ',
            )}
            style={{ ['--c' as string]: COLOURS[p] }}
            data-testid={`sr-player-${p}`}
          >
            {name(p)} · {Object.values(g.claimed).filter((x) => x === p).length}/3
          </span>
        ))}
      </div>
      <div className={styles.board} data-testid="sr-board" style={{ ['--rows' as string]: maxH }}>
        {COLUMNS.map((col) => {
          const owner = g.claimed[col];
          return (
            <div
              key={col}
              className={styles.column}
              style={owner !== undefined ? { ['--claim' as string]: COLOURS[owner] } : undefined}
              data-col={col}
            >
              <div className={[styles.cells, owner !== undefined ? styles.claimed : ''].join(' ')}>
                {Array.from({ length: HEIGHT[col]! }, (_, k) => {
                  const step = HEIGHT[col]! - k;
                  const here = g.marks.flatMap((m, p) => (m[col] === step ? [p] : []));
                  const climber = g.climbers[col] === step;
                  return (
                    <span key={k} className={styles.cell}>
                      {here.map((p) => (
                        <span key={p} className={styles.mark} style={{ background: COLOURS[p] }} />
                      ))}
                      {climber && <span className={styles.climber} data-climber={col} />}
                    </span>
                  );
                })}
              </div>
              <span className={styles.label}>{col}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.diceRow} data-testid="sr-dice">
        {(g.dice ?? []).map((d, i) => (
          <span key={i} className={styles.die}>
            {d}
          </span>
        ))}
      </div>
      <p className={shared.message} data-testid="sr-message" aria-live="polite">
        {message ||
          (myTurn
            ? g.phase === 'roll'
              ? t('toRoll')
              : t('pick')
            : g.phase !== 'over'
              ? t('thinking', { side: name(g.turn) })
              : '')}
      </p>
      <div className={shared.controls}>
        {myTurn &&
          g.phase === 'choose' &&
          opts.map((o, i) => (
            <button
              key={o.join(',')}
              type="button"
              className={['btn', hint === `climb:${o.join(',')}` ? 'btn-primary' : ''].join(' ')}
              onClick={() => doAction(`climb:${o.join(',')}`)}
              data-testid={`sr-opt-${i}`}
            >
              {t(o.length === 2 ? 'climb2' : 'climb1', { a: o[0]!, b: o[1] ?? '' })}
            </button>
          ))}
        {myTurn && g.phase === 'roll' && (
          <>
            <button
              type="button"
              className={['btn', hint === 'roll' || !hint ? 'btn-primary' : ''].join(' ')}
              onClick={() => doAction('roll')}
              data-testid="sr-roll"
            >
              <Dices size={16} /> {t('roll')}
            </button>
            {Object.keys(g.climbers).length > 0 && (
              <button
                type="button"
                className={['btn', hint === 'stop' ? 'btn-primary' : ''].join(' ')}
                onClick={() => doAction('stop')}
                data-testid="sr-stop"
              >
                <Flag size={16} /> {t('stop')}
              </button>
            )}
          </>
        )}
        {myTurn && (
          <button type="button" className="btn" onClick={showHint} data-testid="sr-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.players, randomSeed() >>> 0)}
            data-testid="sr-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="sr-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
