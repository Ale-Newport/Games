import { Mic, MicOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { classify, loadModel, type Guess, type Model, type Stroke } from '../shared/doodle/doodle';
import { Sketchpad } from '../shared/doodle/Sketchpad';
import styles from './Doodle.module.css';
import {
  current,
  finishRound,
  giveUp,
  newGame,
  over,
  recognizes,
  ROUNDS,
  score,
  SECONDS,
  wordName,
  type Game,
} from './engine';
import { STRINGS } from './i18n';

interface Prefs {
  voice: boolean;
}
const isPrefs = (d: unknown): d is Prefs =>
  typeof d === 'object' && d !== null && typeof (d as Prefs).voice === 'boolean';

const SOUNDS: Record<string, SoundSpec> = {
  got: [
    { wave: 'triangle', freq: 784, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 1175, duration: 0.25, delay: 0.09, gain: 0.12 },
  ],
  miss: [{ wave: 'sine', freq: 330, freqEnd: 220, duration: 0.35, gain: 0.08 }],
  tick: [{ wave: 'square', freq: 1000, duration: 0.02, gain: 0.03 }],
};

type Phase = 'intro' | 'card' | 'drawing' | 'flash' | 'summary';

export function DoodleGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const slot = useMemo(
    () => services.saveSlot<Prefs>({ schema: 1, validate: isPrefs }),
    [services],
  );
  const [model, setModel] = useState<Model | null>(null);
  const [voice, setVoice] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [left, setLeft] = useState(SECONDS);
  const [flash, setFlash] = useState<'got' | 'miss' | null>(null);
  const startedAt = useRef(0);
  const servicesRef = useLatest(services);
  const gameRef = useLatest(game);
  const strokesRef = useLatest(strokes);
  const voiceRef = useLatest(voice);
  const lastSaid = useRef('');
  const name = (w: string) => wordName(w, lang);

  useEffect(() => {
    let alive = true;
    void loadModel().then((m) => alive && setModel(m));
    void slot.load().then((p) => alive && p && setVoice(p.voice));
    return () => {
      alive = false;
    };
  }, [slot]);

  const say = (text: string) => {
    if (!voiceRef.current || typeof window === 'undefined' || !('speechSynthesis' in window))
      return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'es' ? 'es-ES' : 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const end = (g: Game, kind: 'got' | 'miss') => {
    setGame(g);
    setFlash(kind);
    setPhase('flash');
    servicesRef.current.playSound(kind === 'got' ? SOUNDS.got! : SOUNDS.miss!);
    const word = g.rounds[g.rounds.length - 1]!.word;
    say(kind === 'got' ? t('got', { w: name(word) }) : t('miss'));
    setTimeout(() => {
      if (over(g)) {
        setPhase('summary');
        const svc = servicesRef.current;
        svc.recordResult({ outcome: 'complete', score: score(g), mode: 'classic' });
        if (score(g) >= 1) svc.unlockAchievement('first');
        if (score(g) === ROUNDS) svc.unlockAchievement('perfect');
        if (g.rounds.some((r) => r.recognized && r.ms < 4000)) svc.unlockAchievement('speedy');
      } else setPhase('card');
    }, 1600);
  };

  // While drawing: recognize every few hundred milliseconds and run the clock.
  useEffect(() => {
    if (phase !== 'drawing' || !model) return;
    const id = setInterval(() => {
      const g = gameRef.current;
      if (!g) return;
      const elapsed = performance.now() - startedAt.current;
      const remaining = Math.max(0, SECONDS - Math.floor(elapsed / 1000));
      setLeft(remaining);
      const s = strokesRef.current;
      const gs = s.length ? classify(model, s, 3) : [];
      setGuesses(gs);
      const word = current(g)!;
      if (gs.length && recognizes(gs, word)) {
        end(finishRound(g, s, gs, Math.round(elapsed)), 'got');
        return;
      }
      if (gs[0] && gs[0].label !== lastSaid.current && gs[0].p > 0.1) {
        lastSaid.current = gs[0].label;
        say(name(gs[0].label));
      }
      if (elapsed >= SECONDS * 1000) end(giveUp(g, s, gs), 'miss');
    }, 400);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, model]);

  const begin = () => {
    const seed =
      (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
    setGame(newGame(seed));
    setPhase('card');
  };

  const draw = () => {
    setStrokes([]);
    setGuesses([]);
    setLeft(SECONDS);
    setFlash(null);
    lastSaid.current = '';
    startedAt.current = performance.now();
    setPhase('drawing');
  };

  const toggleVoice = () => {
    const v = !voice;
    setVoice(v);
    void slot.save({ voice: v });
    if (!v && typeof window !== 'undefined' && 'speechSynthesis' in window)
      window.speechSynthesis.cancel();
  };

  const voiceButton = (
    <button
      type="button"
      className="btn btn-small"
      onClick={toggleVoice}
      aria-pressed={voice}
      data-testid="dr-voice"
    >
      {voice ? <Mic size={14} /> : <MicOff size={14} />} {t('voice')}
    </button>
  );

  if (phase === 'intro' || !game)
    return (
      <div className={styles.wrap} data-testid="dr-intro">
        <div className={styles.card}>
          <h2>{t('title')}</h2>
          <p>{t('intro')}</p>
          <div className={styles.row}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={begin}
              disabled={!model}
              data-testid="dr-start"
            >
              {t('start')}
            </button>
            {voiceButton}
          </div>
        </div>
      </div>
    );

  if (phase === 'summary')
    return (
      <div className={styles.wrap} data-testid="dr-summary">
        <h2>{t('summary', { n: score(game), m: ROUNDS })}</h2>
        <div className={styles.grid}>
          {game.rounds.map((r, i) => (
            <div key={i} className={styles.tile} data-testid={`dr-tile-${i}`}>
              <Sketchpad
                strokes={r.strokes}
                drawing={false}
                label={name(r.word)}
                autoFit
                testId={`dr-thumb-${i}`}
              />
              <span>
                {r.recognized ? '✔' : '✘'} {name(r.word)}
              </span>
              <small>
                {r.recognized ? t('tile.yes', { s: (r.ms / 1000).toFixed(1) }) : t('tile.no')}
              </small>
              {!r.recognized && r.guesses.length > 0 && (
                <small>
                  {t('tile.thought', { g: r.guesses.map((g) => name(g.label)).join(', ') })}
                </small>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={begin} data-testid="dr-again">
          {t('again')}
        </button>
      </div>
    );

  const word = current(game) ?? game.rounds[game.rounds.length - 1]!.word;
  if (phase === 'card')
    return (
      <div className={styles.wrap} data-testid="dr-card">
        <div className={styles.card}>
          <small>{t('round', { n: game.rounds.length + 1, m: ROUNDS })}</small>
          <div>{t('draw')}</div>
          <h2 data-testid="dr-word">{name(word)}</h2>
          <div>{t('in-time', { s: SECONDS })}</div>
          <button type="button" className="btn btn-primary" onClick={draw} data-testid="dr-go">
            {t('go')}
          </button>
        </div>
      </div>
    );

  const speech =
    flash === 'got'
      ? t('got', { w: name(word) })
      : flash === 'miss'
        ? t('miss')
        : guesses.filter((g) => g.p > 0.05).length === 0
          ? t('see.none')
          : (() => {
              const g = guesses.filter((x) => x.p > 0.05).map((x) => name(x.label));
              return g.length === 1
                ? t('see.one', { a: g[0]! })
                : g.length === 2
                  ? t('see.two', { a: g[0]!, b: g[1]! })
                  : t('see.three', { a: g[0]!, b: g[1]!, c: g[2]! });
            })();

  return (
    <div className={styles.wrap} data-testid="dr-play">
      <div className={styles.top}>
        <span className={styles.prompt}>
          {t('draw')}: <strong>{name(word)}</strong>
        </span>
        <span className={`${styles.timer} ${left <= 5 ? styles.low : ''}`} data-testid="dr-timer">
          0:{String(left).padStart(2, '0')}
        </span>
      </div>
      <Sketchpad
        strokes={strokes}
        onStrokes={setStrokes}
        drawing={phase === 'drawing'}
        label={t('pad')}
        testId="dr-pad"
      />
      <div
        className={`${styles.speech} ${flash === 'got' ? styles.got : flash === 'miss' ? styles.miss : ''}`}
        aria-live="polite"
        data-testid="dr-speech"
      >
        {speech}
      </div>
      <div className={styles.row}>
        <button
          type="button"
          className="btn"
          onClick={() => setStrokes([])}
          disabled={phase !== 'drawing'}
          data-testid="dr-clear"
        >
          {t('clear')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const g = gameRef.current;
            if (g && phase === 'drawing') end(giveUp(g, strokesRef.current, guesses), 'miss');
          }}
          disabled={phase !== 'drawing'}
          data-testid="dr-skip"
        >
          {t('skip')}
        </button>
        {voiceButton}
      </div>
    </div>
  );
}
