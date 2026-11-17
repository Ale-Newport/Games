/**
 * The Caption Battle table: a lobby (language, people on this device and their names, bots,
 * rounds), then per round: each person captions the picture behind a hand-over screen (with a live
 * preview and a clock) while bots pick lines; each person rates every other meme with 1–5 stars
 * while bots rate by their taste; a gallery of the round's memes with their stars and the podium.
 */
import { Play, Send, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import shared from '../shared/sudoku/SudokuGame.module.css';
import styles from './CaptionBattle.module.css';
import {
  ROUND_OPTIONS,
  botCaption,
  botRating,
  newGame,
  nextRound,
  round,
  roundScores,
  sceneOf,
  setCaption,
  setRating,
  totals,
  type BattleState,
} from './engine';
import { STRINGS } from './i18n';
import { CAPTION_SOUNDS } from './sounds';

interface Settings {
  lang: 'en' | 'es';
  humans: number;
  bots: number;
  rounds: number;
  names: string[];
}

const CAPTION_SECONDS = 75;

/** Splits a caption into up to four short lines; a slash puts text at the top and the bottom. */
function lines(text: string): { top: string[]; bottom: string[] } {
  const wrap = (t: string) => {
    const out: string[] = [];
    let cur = '';
    for (const w of t.trim().split(/\s+/)) {
      if ((cur + ' ' + w).trim().length > 22 && cur) {
        out.push(cur);
        cur = w;
      } else cur = (cur + ' ' + w).trim();
    }
    if (cur) out.push(cur);
    return out.slice(0, 3);
  };
  const [a, b] = text.split(' / ');
  return b !== undefined
    ? { top: wrap(a ?? ''), bottom: wrap(b) }
    : { top: [], bottom: wrap(text) };
}

export function Meme({ scene, caption, label }: { scene: string; caption: string; label: string }) {
  const { top, bottom } = lines(caption.toUpperCase());
  return (
    <svg
      viewBox="0 0 400 300"
      className={styles.meme}
      role="img"
      aria-label={`${label}: ${caption}`}
    >
      {sceneOf(scene).art}
      {top.map((l, i) => (
        <text key={`t${i}`} x="200" y={34 + i * 30} className={styles.memeText}>
          {l}
        </text>
      ))}
      {bottom.map((l, i) => (
        <text
          key={`b${i}`}
          x="200"
          y={286 - (bottom.length - 1 - i) * 30}
          className={styles.memeText}
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

export function CaptionGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: BattleState, unlock: (id: string) => void) => void;
}) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Settings>({
        schema: 1,
        validate: (d: unknown): d is Settings =>
          typeof d === 'object' && d !== null && typeof (d as Settings).bots === 'number',
      }),
    [services],
  );
  const watch = services.launchParams.mode === 'watch';
  const [settings, setSettings] = useState<Settings>({
    lang: locale === 'es' ? 'es' : 'en',
    humans: 1,
    bots: 4,
    rounds: 3,
    names: [],
  });
  const [state, setStateRaw] = useState<BattleState | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState('');
  const [stars, setStars] = useState<Record<number, number>>({});
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const stateRef = useRef<BattleState | null>(null);
  const draftRef = useLatest(draft);
  const setState = (s: BattleState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSettings(d));
    return () => {
      alive = false;
    };
  }, [slot]);

  const humanName = (i: number) =>
    settings.names[i] ||
    (i === 0 && services.profileName ? services.profileName : t('menu.player', { n: i + 1 }));
  const humansOf = (s: BattleState) => s.players.flatMap((p, i) => (p.bot ? [] : [i]));

  /** Lets bots act for the current phase, then finds the next person who still has to act. */
  const settle = (s: BattleState) => {
    let n = s;
    const r = round(n);
    if (n.phase === 'caption')
      n.players.forEach((p, i) => {
        if (p.bot && r.captions[i] === null) n = setCaption(n, i, botCaption(n, i));
      });
    if (n.phase === 'rate')
      n.players.forEach((p, i) => {
        if (!p.bot) return;
        n.players.forEach((_, a) => {
          if (a !== i && round(n).ratings[i]![a] === null)
            n = setRating(n, i, a, botRating(n, i, a));
        });
      });
    setState(n);
    setReady(false);
    setDraft('');
    setStars({});
    const rr = round(n);
    const todo = humansOf(n).find((i) =>
      n.phase === 'caption'
        ? rr.captions[i] === null
        : n.phase === 'rate'
          ? rr.ratings[i]!.some((v, a) => a !== i && v === null)
          : false,
    );
    setSeat(todo ?? null);
    if (n.phase === 'results') servicesRef.current.playSound(CAPTION_SOUNDS.results);
    if (n.phase === 'over') {
      servicesRef.current.playSound(CAPTION_SOUNDS.podium);
      if (!watch) {
        const sc = totals(n);
        const best = Math.max(...sc);
        servicesRef.current.recordResult({
          outcome: humansOf(n).some((i) => sc[i] === best) ? 'win' : 'loss',
          score: sc[0],
          mode: `players:${n.players.length}`,
        });
        onFinish(n, (id) => servicesRef.current.unlockAchievement(id));
      }
    }
  };

  const start = () => {
    void slot.save(settings);
    const humans = watch ? [] : Array.from({ length: settings.humans }, (_, i) => humanName(i));
    const bots = Math.max(watch ? 3 : 2, Math.min(6, settings.bots));
    settle(newGame(settings.lang, humans, bots, settings.rounds, randomSeed() >>> 0));
  };

  useEffect(() => {
    if (watch && !state) {
      const id = window.setTimeout(start, 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  const submitCaption = () => {
    const s = stateRef.current;
    if (!s || seat === null) return;
    servicesRef.current.playSound(CAPTION_SOUNDS.send);
    settle(setCaption(s, seat, draftRef.current));
  };

  const submitRatings = () => {
    const s = stateRef.current;
    if (!s || seat === null) return;
    let n = s;
    s.players.forEach((_, a) => {
      if (a !== seat) n = setRating(n, seat, a, stars[a] ?? 3);
    });
    servicesRef.current.playSound(CAPTION_SOUNDS.send);
    settle(n);
  };

  const beginSeat = () => {
    setDeadline(Date.now() + CAPTION_SECONDS * 1000);
    setNow(Date.now());
    setReady(true);
  };

  useEffect(() => {
    if (!ready || state?.phase !== 'caption') return;
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= deadline) {
        window.clearInterval(id);
        submitCaption();
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, deadline, state?.phase]);

  // Watch mode and results screens move on by themselves.
  useEffect(() => {
    if (!state || state.phase !== 'results') return;
    const id = window.setTimeout(() => settle(nextRound(stateRef.current!)), watch ? 3500 : 6000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase, state?.history.length]);

  // ---------------------------------------------------------------- lobby
  if (!state) {
    const seg = <K extends 'humans' | 'bots' | 'rounds'>(
      key: K,
      values: readonly number[],
      label: (v: number) => string,
    ) => (
      <div className={shared.segmented}>
        {values.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={settings[key] === v}
            onClick={() => setSettings({ ...settings, [key]: v })}
            data-testid={`cb-${key}-${v}`}
          >
            {label(v)}
          </button>
        ))}
      </div>
    );
    return (
      <div className={shared.menu} data-testid="cb-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          <fieldset className={shared.group}>
            <legend>{t('menu.lang')}</legend>
            <div className={shared.segmented}>
              {(['en', 'es'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={settings.lang === l}
                  onClick={() => setSettings({ ...settings, lang: l })}
                  data-testid={`cb-lang-${l}`}
                >
                  {l === 'en' ? 'English' : 'Español'}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.table')}</legend>
            {seg('humans', [1, 2, 3, 4], (v) => t('menu.humans', { n: v }))}
            {seg('bots', [2, 3, 4, 5, 6], (v) => t('menu.bots', { n: v }))}
            {seg('rounds', ROUND_OPTIONS, (v) => t('menu.rounds', { n: v }))}
            {settings.humans > 1 && (
              <div className={styles.names}>
                {Array.from({ length: settings.humans }, (_, i) => (
                  <input
                    key={i}
                    className="input"
                    value={humanName(i)}
                    maxLength={14}
                    aria-label={t('menu.player', { n: i + 1 })}
                    onChange={(e) => {
                      const names = Array.from({ length: 4 }, (_, j) => settings.names[j] ?? '');
                      names[i] = e.target.value;
                      setSettings({ ...settings, names });
                    }}
                  />
                ))}
              </div>
            )}
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={start}
              data-testid="cb-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const r = round(s);
  const sc = totals(s);

  // ---------------------------------------------------------------- podium
  if (s.phase === 'over') {
    const order = s.players.map((_, i) => i).sort((a, b) => sc[b]! - sc[a]!);
    return (
      <div className={styles.podium} data-testid="cb-podium">
        <h2>{t('end.title')}</h2>
        <ol>
          {order.map((i, k) => (
            <li key={i}>
              <span>{['🥇', '🥈', '🥉'][k] ?? `${k + 1}.`}</span>
              <strong>{s.players[i]!.name}</strong>
              <em>{sc[i]} ★</em>
            </li>
          ))}
        </ol>
        <div className={shared.menuActions}>
          <button type="button" className="btn btn-primary" onClick={start} data-testid="cb-again">
            <Play size={16} /> {t('end.again')}
          </button>
          <button type="button" className="btn" onClick={() => setState(null)}>
            {t('end.lobby')}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- results
  if (s.phase === 'results') {
    const rs = roundScores(r);
    const best = Math.max(...rs);
    return (
      <div className={styles.results} data-testid="cb-results">
        <h2>{t('results.title', { n: s.history.length, of: s.rounds })}</h2>
        <div className={styles.gallery}>
          {r.captions.map((c, i) => (
            <figure key={i} className={styles.card} data-best={rs[i] === best}>
              <Meme scene={r.scene} caption={c ?? ''} label={s.players[i]!.name} />
              <figcaption>
                <strong>{s.players[i]!.name}</strong> · {rs[i]} ★{rs[i] === best ? ` 🏆` : ''}
              </figcaption>
            </figure>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => settle(nextRound(s))}
          data-testid="cb-next"
        >
          {t('results.next')}
        </button>
      </div>
    );
  }

  if (seat === null) return <p className="muted">{t('play.bots')}</p>;
  const name = s.players[seat]!.name;

  if (!ready)
    return (
      <div className={shared.menu} data-testid="cb-pass">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('play.turn', { name })}</h2>
          <p className="muted">
            {t(s.phase === 'caption' ? 'play.passCaption' : 'play.passRate', { name })}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={beginSeat}
            data-testid="cb-ready"
          >
            {t('play.ready')}
          </button>
        </div>
      </div>
    );

  if (s.phase === 'caption') {
    const left = Math.max(0, Math.ceil((deadline - now) / 1000));
    return (
      <div className={styles.step} data-testid="cb-caption">
        <div className={styles.head}>
          <span>{t('results.title', { n: s.history.length, of: s.rounds })}</span>
          <span data-low={left <= 10}>⏱ {left}</span>
        </div>
        <Meme scene={r.scene} caption={draft} label={t('play.preview')} />
        <input
          className={`input ${styles.captionIn}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={90}
          placeholder={t('play.placeholder')}
          data-testid="cb-input"
          autoFocus
        />
        <p className={shared.hintText}>{t('play.slash')}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={submitCaption}
          data-testid="cb-submit"
        >
          <Send size={16} /> {t('play.submit')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.results} data-testid="cb-rate">
      <h2>{t('play.rateTitle', { name })}</h2>
      <div className={styles.gallery}>
        {r.captions.map((c, i) =>
          i === seat ? null : (
            <figure key={i} className={styles.card}>
              <Meme scene={r.scene} caption={c ?? ''} label={t('play.meme')} />
              <div className={styles.stars} role="radiogroup" aria-label={t('play.rate')}>
                {[1, 2, 3, 4, 5].map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={(stars[i] ?? 0) === k}
                    aria-label={`${k}`}
                    className={styles.star}
                    data-on={(stars[i] ?? 0) >= k}
                    onClick={() => setStars({ ...stars, [i]: k })}
                    data-testid={`cb-star-${i}-${k}`}
                  >
                    <Star size={22} />
                  </button>
                ))}
              </div>
            </figure>
          ),
        )}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={submitRatings}
        data-testid="cb-rate-submit"
      >
        <Send size={16} /> {t('play.submitRatings')}
      </button>
    </div>
  );
}
