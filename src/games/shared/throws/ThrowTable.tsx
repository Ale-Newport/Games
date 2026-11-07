/**
 * The throw-duel table shared by #162 and #163: a menu (match length, opponent, new match, resume,
 * watch the AI); the score; both hands' last throws with the verb that settled the round; one button
 * per throw; the recent rounds; your throw counts; the computer's read revealed after each round;
 * hints that read the computer back.
 */
import { Bot, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../../core/game-engine/hooks';
import { randomSeed } from '../../../core/game-engine/random';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Dictionary, type Locale } from '../../../core/i18n';
import { useKeyboard } from '../../../core/input/keyboard';
import shared from '../sudoku/SudokuGame.module.css';
import { decide, type Level } from './ai';
import { act, beaters, isValidDuel, newDuel, outcome, type Duel } from './engine';
import { THROW_STRINGS } from './i18n';
import { ThrowArt, type ThrowIcon } from './Icons';
import { THROW_SOUNDS } from './sounds';
import styles from './Throws.module.css';

type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['random', 'frequency', 'markov', 'meta'];
const LENGTHS = [3, 5, 10];

interface Saved {
  state: Duel;
  level: Level;
}

export interface ThrowVariant {
  n: number;
  prefix: string;
  icons: ThrowIcon[];
  /** Throw names per locale, by index. */
  names: Record<Locale, string[]>;
  /** What happens when throw w beats throw l, keyed "w-l", per locale. */
  verbs: Record<Locale, Record<string, string>>;
  /** The game's own strings (`title`, `menu.subtitle`). */
  strings: Record<Locale, Dictionary>;
  onMatchEnd: (g: Duel, level: Level, unlock: (id: string) => void) => void;
}

export function ThrowTable({
  services,
  variant,
}: {
  services: GameServices;
  variant: ThrowVariant;
}) {
  const { locale } = services;
  const loc: Locale = locale === 'es' ? 'es' : 'en';
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...THROW_STRINGS.en, ...variant.strings.en },
          es: { ...THROW_STRINGS.es, ...variant.strings.es },
        },
        locale,
      ),
    [locale, variant],
  );
  const { n, prefix } = variant;
  const names = variant.names[loc];
  const id = (s: string) => `${prefix}-${s}`;
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          LEVELS.includes((d as Saved).level) &&
          isValidDuel((d as Saved).state, n),
      }),
    [services, n],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('meta');
  const [length, setLength] = useState(5);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<Duel | null>(null);
  const [message, setMessage] = useState('');
  const [read, setRead] = useState<{ throw: number; read: boolean } | null>(null);
  const [showRead, setShowRead] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
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

  const start = (g: Duel, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setMessage('');
    setRead(null);
    setHint(null);
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, target: number, seed: number) =>
    start(newDuel(n, target, seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const tm = window.setTimeout(
      () => fresh('watch', 'meta', 10, fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const sideName = (seat: number) =>
    mode === 'watch' ? t(seat === 0 ? 'left' : 'right') : seat === 0 ? t('you') : t('cpu');
  const verb = (w: number, l: number) =>
    variant.verbs[loc][`${w}-${l}`] ?? `${names[w]} > ${names[l]}`;

  /** Plays one round: seat 0's throw `a`, then the computer's (decided from finished rounds only). */
  const round = (a: number) => {
    const g = stateRef.current;
    if (!g || g.phase === 'over') return;
    const svc = servicesRef.current;
    const plan = decide(g, 1, mode === 'watch' ? 'markov' : level);
    const next = act(act(g, `throw:${a}`), `throw:${plan.throw}`);
    setState(next);
    setRead(plan);
    setHint(null);
    const r = outcome(n, a, plan.throw);
    let text: string;
    if (r === 0) {
      text = t('roundTie', { name: names[a]! });
      svc.playSound(THROW_SOUNDS.tie);
    } else {
      const v = r === 1 ? verb(a, plan.throw) : verb(plan.throw, a);
      text =
        mode === 'watch'
          ? t('watchWin', { verb: v, side: sideName(r === 1 ? 0 : 1) })
          : t(r === 1 ? 'roundWin' : 'roundLose', { verb: v });
      svc.playSound(r === 1 ? THROW_SOUNDS.roundWin : THROW_SOUNDS.roundLose);
    }
    if (next.phase === 'over') {
      const [w0, w1] = next.wins;
      text += ` ${mode === 'watch' ? t('watchOver', { side: sideName(next.winner!), a: Math.max(w0, w1), b: Math.min(w0, w1) }) : t(next.winner === 0 ? 'matchWin' : 'matchLose', { a: w0, b: w1 })}`;
      if (mode === 'play') {
        svc.playSound(next.winner === 0 ? THROW_SOUNDS.win : THROW_SOUNDS.lose);
        svc.recordResult({
          outcome: next.winner === 0 ? 'win' : 'loss',
          score: w0 - w1,
          mode: `${level}-${next.target}`,
        });
        variant.onMatchEnd(next, level, (x) => svc.unlockAchievement(x));
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
    setMessage(text);
  };

  // Watch mode: the mind reader (left) against the pattern reader (right).
  useEffect(() => {
    if (mode !== 'watch' || !state || state.phase === 'over') return;
    const tm = window.setTimeout(() => {
      const g = stateRef.current;
      if (g) round(decide(g, 0, 'meta').throw);
    }, 900);
    return () => window.clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const canThrow = mode === 'play' && g?.phase === 'play';

  const showHint = () => {
    const cur = stateRef.current;
    if (!cur || !canThrow) return;
    servicesRef.current.playSound(THROW_SOUNDS.hint);
    // Read the computer the way the mind reader would read you.
    const plan = decide(cur, 0, 'meta');
    setHint(plan.throw);
    setMessage(t(plan.read ? 'hint.throw' : 'hint.random', { name: names[plan.throw]! }));
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !canThrow) return false;
    const k = e.key.toLowerCase();
    const d = Number(k);
    if (Number.isInteger(d) && d >= 1 && d <= n) {
      servicesRef.current.playSound(THROW_SOUNDS.shake);
      round(d - 1);
    } else if (k === 'h') showHint();
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
                  {t('menu.resumeHint', { a: saved.state.wins[0], b: saved.state.wins[1] })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.length')}</legend>
            <div className={shared.segmented}>
              {LENGTHS.map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={length === x}
                  onClick={() => setLength(x)}
                  data-testid={id(`length-${x}`)}
                >
                  {t(`length.${x}`)}
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
              onClick={() => fresh('play', level, length, fixedSeed ?? randomSeed() >>> 0)}
              data-testid={id('start')}
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'meta', 10, fixedSeed ?? randomSeed() >>> 0)}
              data-testid={id('watch')}
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const last = g.rounds.at(-1);
  const mine = Array.from({ length: n }, (_, i) => g.rounds.filter((r) => r.a === i).length);
  const most = Math.max(1, ...mine);
  return (
    <div className={shared.play} data-testid={id('table')}>
      <p className={styles.score} data-testid={id('score')}>
        <span>{sideName(0)}</span> <strong>{g.wins[0]}</strong> – <strong>{g.wins[1]}</strong>{' '}
        <span>{sideName(1)}</span>
      </p>
      <div className={styles.arena}>
        {[0, 1].map((seat) => {
          const x = last ? (seat === 0 ? last.a : last.b) : null;
          const r = last ? outcome(n, last.a, last.b) * (seat === 0 ? 1 : -1) : 0;
          return (
            <div
              key={`${seat}-${g.rounds.length}`}
              className={[styles.hand, r > 0 ? styles.won : r < 0 ? styles.lost : ''].join(' ')}
              data-testid={id(`hand-${seat}`)}
            >
              {x !== null ? (
                <ThrowArt icon={variant.icons[x]!} />
              ) : (
                <span className={styles.wait}>?</span>
              )}
              <small>{x !== null ? names[x] : sideName(seat)}</small>
            </div>
          );
        })}
      </div>
      <p className={shared.message} data-testid={id('message')} aria-live="polite">
        {message || (canThrow ? t('pick') : '')}
      </p>
      {mode === 'play' && read && last && (
        <p className={styles.read}>
          <button
            type="button"
            className={styles.link}
            onClick={() => setShowRead((s) => !s)}
            aria-expanded={showRead}
            data-testid={id('reveal')}
          >
            {t('reveal')}
          </button>
          {showRead && (
            <span data-testid={id('read')}>
              {read.read
                ? t('predicted', {
                    names: beatenBy(n, read.throw)
                      .map((i) => names[i])
                      .join(', '),
                  })
                : t('predicted.none')}
            </span>
          )}
        </p>
      )}
      {canThrow && (
        <div className={styles.throws}>
          {variant.icons.map((icon, i) => (
            <button
              key={icon}
              type="button"
              className={[styles.throw, hint === i ? styles.hinted : ''].join(' ')}
              onClick={() => {
                servicesRef.current.playSound(THROW_SOUNDS.shake);
                round(i);
              }}
              aria-label={names[i]}
              data-testid={id(`throw-${i}`)}
            >
              <ThrowArt icon={icon} />
              <span>{names[i]}</span>
            </button>
          ))}
        </div>
      )}
      <div className={styles.history} data-testid={id('history')}>
        {g.rounds.slice(-12).map((r, i) => {
          const res = outcome(n, r.a, r.b);
          return (
            <span
              key={i}
              className={[styles.pair, res > 0 ? styles.won : res < 0 ? styles.lost : ''].join(' ')}
            >
              <ThrowArt icon={variant.icons[r.a]!} />
              <ThrowArt icon={variant.icons[r.b]!} />
            </span>
          );
        })}
      </div>
      {mode === 'play' && g.rounds.length > 0 && (
        <div className={styles.stats} aria-label={t('stats')}>
          {mine.map((c, i) => (
            <span key={i} className={styles.bar}>
              <span className={styles.barFill} style={{ height: `${(c / most) * 100}%` }} />
              <small>
                {names[i]} {c}
              </small>
            </span>
          ))}
        </div>
      )}
      <div className={shared.controls}>
        {canThrow && (
          <button type="button" className="btn" onClick={showHint} data-testid={id('hint')}>
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, g.target, randomSeed() >>> 0)}
            data-testid={id('again')}
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid={id('menu-btn')}>
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys', { n })}</p>}
    </div>
  );
}

/** The throws a given throw beats. */
function beatenBy(n: number, x: number): number[] {
  return Array.from({ length: n }, (_, i) => i).filter((i) => beaters(n, i).includes(x));
}
