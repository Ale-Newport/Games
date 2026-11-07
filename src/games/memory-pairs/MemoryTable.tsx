/**
 * The Memory Pairs table: a menu (grid size, solo or a computer opponent, new game, resume, watch
 * the AI); the cards, face down until turned, a mismatched pair shown for a moment before turning
 * back; pairs and turns per player; hints from perfect memory; computer turns after short pauses.
 */
import { Bot, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { memoryFlip, MEMORY } from './ai';
import { act, isValidMemory, newMemory, SIZES, winners, type MemoryGame } from './engine';
import { CardFace, faceName } from './Faces';
import { STRINGS } from './i18n';
import styles from './Memory.module.css';
import { MEMORY_SOUNDS } from './sounds';

type Opp = 'solo' | 'forgetful' | 'attentive' | 'perfect';
type Mode = 'menu' | 'play' | 'watch';
const OPPS: Opp[] = ['solo', 'forgetful', 'attentive', 'perfect'];
const SIZE_IDS = ['small', 'medium', 'large'];

interface Saved {
  state: MemoryGame;
  opp: Opp;
}

export function MemoryTable({ services }: { services: GameServices }) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const loc: 'en' | 'es' = locale === 'es' ? 'es' : 'en';
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          OPPS.includes((d as Saved).opp) &&
          isValidMemory((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [size, setSize] = useState('small');
  const [opp, setOpp] = useState<Opp>('attentive');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<MemoryGame | null>(null);
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

  const start = (g: MemoryGame, m: Mode, o: Opp) => {
    setState(g);
    setMode(m);
    setOpp(o);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, opp: o });
  };
  const fresh = (m: Mode, o: Opp, s: string, seed: number) =>
    start(newMemory(s, o === 'solo' ? 1 : 2, seed), m, o);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(
      () => fresh('watch', 'perfect', 'small', fixedSeed ?? randomSeed() >>> 0),
      0,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const isYou = (p: number) => mode === 'play' && p === 0;
  const name = (p: number) =>
    mode === 'watch' ? t(p === 0 ? 'left' : 'right') : p === 0 ? t('you') : t('cpu');

  const flip = (i: number) => {
    const g = stateRef.current;
    if (!g) return;
    const next = act(g, `flip:${i}`);
    if (next === g) return;
    const svc = servicesRef.current;
    setState(next);
    setHint(null);
    if (next.open !== null) {
      svc.playSound(MEMORY_SOUNDS.flip);
      setMessage('');
    } else {
      const [a, b] = next.last!;
      const matched = next.taken[a] && next.taken[b];
      svc.playSound(matched ? MEMORY_SOUNDS.match : MEMORY_SOUNDS.miss);
      setMessage(
        matched
          ? t(isYou(g.turn) ? 'match.you' : 'match', {
              side: name(g.turn),
              face: faceName(next.faces[a]!, loc),
            })
          : t('miss'),
      );
    }
    if (next.phase === 'over') {
      const solo = next.players === 1;
      const [a, b] = next.pairs as [number, number];
      const ws = winners(next);
      let text: string;
      if (solo) text = t('soloDone', { n: next.turns[0]! });
      else if (mode === 'watch')
        text =
          ws.length > 1
            ? t('watchTie', { a, b })
            : t('watchOver', { side: name(ws[0]!), a: Math.max(a, b), b: Math.min(a, b) });
      else text = ws.length > 1 ? t('tie', { a, b }) : t(ws[0] === 0 ? 'won' : 'lost', { a, b });
      setMessage(text);
      if (mode === 'play') {
        const won = solo || (ws.length === 1 && ws[0] === 0);
        svc.playSound(won ? MEMORY_SOUNDS.win : MEMORY_SOUNDS.lose);
        svc.recordResult(
          solo
            ? { outcome: 'complete', score: next.turns[0]!, mode: `solo-${next.size}` }
            : {
                outcome: ws.length > 1 ? 'draw' : won ? 'win' : 'loss',
                score: a - b,
                mode: `${opp}-${next.size}`,
              },
        );
        svc.unlockAchievement('first');
        if (!solo && won && opp === 'perfect') svc.unlockAchievement('perfect');
        const pairsCount = next.faces.length / 2;
        if (solo && next.turns[0]! <= Math.round(pairsCount * 1.6)) svc.unlockAchievement('sharp');
        if (next.size === 'large') svc.unlockAchievement('large');
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, opp });
  };

  // Computer flips (both players in watch mode).
  useEffect(() => {
    if (
      !state ||
      state.phase !== 'play' ||
      mode === 'menu' ||
      (mode === 'play' && (state.players === 1 || state.turn === 0))
    )
      return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (!g || g.phase !== 'play') return;
        const span =
          mode === 'watch'
            ? g.turn === 0
              ? MEMORY.forgetful
              : MEMORY.perfect
            : MEMORY[opp as Exclude<Opp, 'solo'>];
        flip(memoryFlip(g, span));
      },
      state.open === null ? 1000 : 700,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const myTurn = mode === 'play' && g?.phase === 'play' && (g.players === 1 || g.turn === 0);

  const showHint = () => {
    if (!g || !myTurn) return;
    const i = memoryFlip(g, MEMORY.perfect);
    servicesRef.current.playSound(MEMORY_SOUNDS.hint);
    setHint(i);
    const known = g.known[i] !== undefined;
    if (g.open === null)
      setMessage(known ? t('hint.pair', { face: faceName(g.faces[i]!, loc) }) : t('hint.new'));
    else setMessage(known ? t('hint.twin') : t('hint.new'));
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
    if (mode === 'play' && cur && cur.phase !== 'over') {
      const kept = { state: cur, opp };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g) {
    return (
      <div className={shared.menu} data-testid="mp-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.opp)}
              data-testid="mp-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', { n: saved.state.taken.filter((x) => !x).length / 2 })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.size')}</legend>
            <div className={shared.segmented}>
              {SIZE_IDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  data-testid={`mp-size-${s}`}
                >
                  {t(`size.${s}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.opponent')}</legend>
            <div className={shared.segmented}>
              {OPPS.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={opp === o}
                  onClick={() => setOpp(o)}
                  data-testid={`mp-opp-${o}`}
                >
                  {t(`opp.${o}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`opp.${opp}.hint`)}</p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', opp, size, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="mp-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'perfect', size, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="mp-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [rows, cols] = SIZES[g.size]!;
  const faceUp = (i: number) =>
    g.taken[i] || g.open === i || (g.last !== null && g.last.includes(i));
  return (
    <div className={shared.play} data-testid="memory">
      <div className={styles.players}>
        {g.pairs.map((p, i) => (
          <span
            key={i}
            className={[
              styles.chip,
              g.players > 1 && g.turn === i && g.phase === 'play' ? styles.current : '',
            ].join(' ')}
            data-testid={`mp-player-${i}`}
          >
            <strong>{g.players === 1 ? t('you') : name(i)}</strong> ·{' '}
            {p === 1 ? t('pairs.one') : t('pairs', { n: p })} ·{' '}
            {g.turns[i] === 1 ? t('turns.one') : t('turns', { n: g.turns[i]! })}
          </span>
        ))}
      </div>
      <div
        className={styles.grid}
        style={{ ['--cols' as string]: cols, ['--rows' as string]: rows }}
        data-testid="mp-grid"
      >
        {g.faces.map((f, i) => {
          const up = faceUp(i);
          return (
            <button
              key={i}
              type="button"
              className={[
                styles.card,
                up ? styles.up : '',
                g.taken[i] ? styles.taken : '',
                hint === i ? styles.hinted : '',
              ].join(' ')}
              onClick={() => myTurn && flip(i)}
              disabled={!myTurn || g.taken[i] || g.open === i}
              aria-label={up ? faceName(f, loc) : t('card', { n: i + 1 })}
              data-testid={`mp-card-${i}`}
              data-up={up || undefined}
            >
              <span className={styles.inner}>
                <span className={styles.back} />
                <span className={styles.front}>{up && <CardFace face={f} />}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className={shared.message} data-testid="mp-message" aria-live="polite">
        {message}
        {message && g.phase === 'play' ? ' ' : ''}
        {g.phase === 'play'
          ? myTurn
            ? g.open === null
              ? t('yourTurn')
              : t('second')
            : mode === 'play'
              ? t('thinking')
              : ''
          : ''}
      </p>
      <div className={shared.controls}>
        {myTurn && (
          <button type="button" className="btn" onClick={showHint} data-testid="mp-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, opp, g.size, randomSeed() >>> 0)}
            data-testid="mp-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="mp-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
