/**
 * The Syllable Bomb table: a lobby (bots, prompt difficulty), then the players around a fizzing
 * bomb showing the prompt. On your turn type a word containing it; bots think and type theirs live.
 * Hearts show lives, your bonus alphabet shows the letters still to use, and the bomb explodes when
 * its hidden fuse runs out.
 */
import { Bot, Heart, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { loadWordList } from '../shared/semantic/semantic';
import shared from '../shared/sudoku/SudokuGame.module.css';
import styles from './Bomb.module.css';
import { botPlan } from './bots';
import { loadWords } from './dictionary';
import {
  BONUS_LETTERS,
  burn,
  newGame,
  playWord,
  wordProblem,
  type BombState,
  type Difficulty,
} from './engine';
import { STRINGS } from './i18n';
import { BOMB_SOUNDS } from './sounds';

interface Settings {
  bots: number;
  difficulty: Difficulty;
}

const BOT_NAMES = ['Blaze', 'Fuse', 'Spark', 'Boomer', 'Tick', 'Wick', 'Ember'];

export function BombGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: BombState, unlock: (id: string) => void) => void;
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
  const [watch, setWatch] = useState(services.launchParams.mode === 'watch');
  const watchRef = useLatest(watch);
  const [settings, setSettings] = useState<Settings>({ bots: 3, difficulty: 'mixed' });
  const [all, setAll] = useState<string[] | null>(null);
  const [common, setCommon] = useState<string[] | null>(null);
  const [state, setStateRaw] = useState<BombState | null>(null);
  const [typed, setTyped] = useState('');
  const [botTyping, setBotTyping] = useState('');
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(0);
  const stateRef = useRef<BombState | null>(null);
  const dict = useMemo(() => (all ? new Set(all) : null), [all]);
  const setState = (s: BombState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSettings(d));
    void loadWords().then((w) => alive && setAll(w));
    void loadWordList().then((w) => alive && setCommon(w.filter((x) => /^[a-z]{3,15}$/.test(x))));
    return () => {
      alive = false;
    };
  }, [slot]);

  const start = (spectate = watchRef.current) => {
    setWatch(spectate);
    void slot.save(settings);
    const rng = new Rng(randomSeed() >>> 0);
    const bots = Array.from(
      { length: Math.max(1, Math.min(7, settings.bots + (spectate ? 1 : 0))) },
      (_, i) => ({
        name: BOT_NAMES[i]!,
        bot: true,
        skill: {
          think: 1.2 + rng.float() * 2.2,
          cps: 4 + rng.float() * 6,
          breadth: 0.25 + rng.float() * 0.7,
        },
      }),
    );
    const players = spectate
      ? bots
      : [{ name: services.profileName || t('you'), bot: false }, ...bots];
    setMessage('');
    setTyped('');
    setBotTyping('');
    setState(newGame(players, settings.difficulty, randomSeed() >>> 0));
  };

  useEffect(() => {
    if (watch && !state && all && common) {
      const id = window.setTimeout(() => start(true), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, all, common]);

  const apply = (next: BombState) => {
    const before = stateRef.current;
    setState(next);
    const svc = servicesRef.current;
    if (next.event && next.event !== before?.event) {
      setBotTyping('');
      if (next.event.kind === 'boom') svc.playSound(BOMB_SOUNDS.boom);
      else svc.playSound(next.event.life ? BOMB_SOUNDS.life : BOMB_SOUNDS.word);
    }
    if (before?.status === 'playing' && next.status === 'over') {
      svc.playSound(BOMB_SOUNDS.end);
      if (!watchRef.current) {
        svc.recordResult({
          outcome: next.winner === 0 ? 'win' : 'loss',
          score: next.used.length,
          mode: `${next.difficulty}:${next.players.length}`,
        });
        onFinish(next, (id) => svc.unlockAchievement(id));
      }
    }
  };

  // The fuse: burns continuously while the game runs.
  useEffect(() => {
    if (!state || state.status !== 'playing') return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const s = stateRef.current;
      if (s && s.status === 'playing') apply(burn(s, dt));
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status]);

  // Bots: think, then type their word letter by letter.
  useEffect(() => {
    const s = state;
    if (!s || s.status !== 'playing' || !common || !all) return;
    const holder = s.players[s.holder]!;
    if (!holder.bot) return;
    const rng = new Rng((s.turns * 7919 + s.used.length + s.holder * 31) >>> 0);
    const plan = botPlan(s, common, all, rng);
    const timers: number[] = [];
    const typeStart =
      Math.max(0.3, plan.seconds - (plan.word?.length ?? 0) / (holder.skill?.cps ?? 6)) * 1000;
    if (plan.word) {
      const w = plan.word;
      for (let i = 1; i <= w.length; i++)
        timers.push(
          window.setTimeout(
            () => setBotTyping(w.slice(0, i)),
            typeStart + (i * 1000) / (holder.skill?.cps ?? 6),
          ),
        );
      timers.push(
        window.setTimeout(() => {
          const cur = stateRef.current;
          if (!cur || cur.holder !== s.holder || cur.turns !== s.turns || cur.status !== 'playing')
            return;
          setBotTyping('');
          apply(playWord(cur, w));
        }, plan.seconds * 1000),
      );
    }
    return () => timers.forEach((x) => window.clearTimeout(x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state?.holder,
    state?.turns,
    state?.status,
    state?.players.map((p) => p.lives).join(),
    common,
    all,
  ]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s || !dict || s.status !== 'playing' || s.players[s.holder]!.bot) return;
    const p = wordProblem(s, typed, (w) => dict.has(w));
    if (p) {
      setMessage(t(`problem.${p}`, { prompt: s.prompt.toUpperCase() }));
      setShake((n) => n + 1);
      servicesRef.current.playSound(BOMB_SOUNDS.bad);
      return;
    }
    setMessage('');
    setTyped('');
    const next = playWord(s, typed);
    if (next.event?.kind === 'word' && next.event.word.length >= 12)
      servicesRef.current.unlockAchievement('long-word');
    if (next.event?.kind === 'word' && next.event.life)
      servicesRef.current.unlockAchievement('bonus-life');
    apply(next);
  };

  if (!all || !common)
    return (
      <p className="muted" data-testid="sb-loading">
        {t('loading')}
      </p>
    );

  if (!state) {
    return (
      <div className={shared.menu} data-testid="sb-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          <fieldset className={shared.group}>
            <legend>{t('menu.room')}</legend>
            <div className={shared.segmented}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={settings.bots === n}
                  onClick={() => setSettings({ ...settings, bots: n })}
                  data-testid={`sb-bots-${n}`}
                >
                  {t('menu.bots', { n })}
                </button>
              ))}
            </div>
            <div className={shared.segmented}>
              {(['easy', 'medium', 'hard', 'mixed'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={settings.difficulty === d}
                  onClick={() => setSettings({ ...settings, difficulty: d })}
                  data-testid={`sb-diff-${d}`}
                >
                  {t(`diff.${d}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <p className={shared.hintText}>{t('menu.english')}</p>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(false)}
              data-testid="sb-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start(true)}
              data-testid="sb-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = state;
  const holder = s.players[s.holder]!;
  const myTurn = !holder.bot && s.status === 'playing';
  const me = watch ? null : s.players[0]!;
  const n = s.players.length;

  return (
    <div className={styles.wrap} data-testid="sb-play">
      <div className={styles.table}>
        {s.players.map((p, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          return (
            <div
              key={i}
              className={styles.seat}
              style={{ left: `${50 + 40 * Math.cos(a)}%`, top: `${50 + 40 * Math.sin(a)}%` }}
              data-holder={i === s.holder && s.status === 'playing'}
              data-out={p.lives <= 0}
              data-testid={`sb-seat-${i}`}
            >
              <strong>{p.bot ? `🤖 ${p.name}` : p.name}</strong>
              <span className={styles.hearts} aria-label={t('lives', { n: p.lives })}>
                {Array.from({ length: Math.max(0, p.lives) }, (_, k) => (
                  <Heart key={k} size={14} fill="currentColor" />
                ))}
              </span>
              {i === s.holder && p.bot && (
                <span className={styles.typing} data-testid="sb-bot-typing">
                  {botTyping}
                </span>
              )}
              {s.event?.kind === 'word' && s.event.player === i && (
                <span className={styles.lastWord}>{s.event.word}</span>
              )}
            </div>
          );
        })}
        <div
          className={styles.bomb}
          data-exploded={s.event?.kind === 'boom'}
          key={
            s.event?.kind === 'boom'
              ? `boom-${s.turns}-${s.players.map((p) => p.lives).join()}`
              : 'bomb'
          }
        >
          <span className={styles.spark} aria-hidden="true" />
          <span className={styles.prompt} data-testid="sb-prompt">
            {s.prompt.toUpperCase()}
          </span>
        </div>
      </div>
      {s.status === 'playing' ? (
        <form onSubmit={submit} className={styles.form}>
          <input
            key={shake}
            className={`input ${styles.input} ${shake ? styles.shake : ''}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={
              myTurn
                ? t('play.yourTurn', { prompt: s.prompt.toUpperCase() })
                : t('play.waiting', { name: holder.name })
            }
            disabled={!myTurn}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={t('play.input')}
            data-testid="sb-input"
          />
        </form>
      ) : (
        <div className={styles.result} data-testid="sb-result">
          <strong>
            {s.winner !== null
              ? t('end.winner', { name: s.players[s.winner]!.name })
              : t('end.none')}
          </strong>
          <span>{t('end.words', { n: s.used.length })}</span>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start()}
              data-testid="sb-again"
            >
              <Play size={16} /> {t('end.again')}
            </button>
            <button type="button" className="btn" onClick={() => setState(null)}>
              {t('end.lobby')}
            </button>
          </div>
        </div>
      )}
      <p className={styles.message} aria-live="polite" data-testid="sb-message">
        {message ||
          (s.event?.kind === 'boom'
            ? t('play.boom', { name: s.players[s.event.player]!.name })
            : s.event?.kind === 'word' && s.event.life
              ? t('play.life', { name: s.players[s.event.player]!.name })
              : '')}
      </p>
      {me && (
        <div className={styles.alphabet} aria-label={t('play.bonus')} data-testid="sb-alphabet">
          {[...BONUS_LETTERS].map((c) => (
            <span key={c} data-used={me.letters.includes(c)}>
              {c.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
