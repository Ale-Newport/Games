/**
 * The Sketch & Guess table: a lobby (language, bots, drawing time, rounds), then turns in which a
 * drawer picks one of three words and draws while everyone else guesses in the chat. Bots draw by
 * replaying real human doodles and guess by running the doodle recognizer on the strokes drawn so
 * far. Shows the hint line with revealed letters, the clock, the scoreboard, turn results and the
 * final podium.
 */
import { Bot, Eraser, Play, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { classify, loadDoodles, loadModel, type Model, type Stroke } from '../shared/doodle/doodle';
import { Sketchpad, partialStrokes } from '../shared/doodle/Sketchpad';
import shared from '../shared/sudoku/SudokuGame.module.css';
import {
  DRAW_TIMES,
  MAX_BOTS,
  ROUNDS,
  chooseWord,
  displayWord,
  endTurn,
  hintLine,
  newGame,
  nextTurn,
  ranking,
  revealedCount,
  submitGuess,
  tick,
  type GuessResult,
  type Lang,
  type SketchState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './SketchGuess.module.css';
import { SKETCH_SOUNDS } from './sounds';

interface Settings {
  lang: Lang;
  bots: number;
  seconds: SketchState['seconds'];
  rounds: SketchState['rounds'];
}

interface ChatLine {
  id: number;
  who: string;
  text: string;
  kind: 'guess' | 'correct' | 'close' | 'system';
}

type Phase = 'lobby' | 'choose' | 'draw' | 'reveal' | 'podium';

export function SketchGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: SketchState, unlock: (id: string) => void) => void;
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
    bots: 4,
    seconds: 80,
    rounds: 2,
  });
  const [phase, setPhase] = useState<Phase>('lobby');
  const [state, setStateRaw] = useState<SketchState | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [doodle, setDoodle] = useState<Stroke[] | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [typed, setTyped] = useState('');
  const [model, setModel] = useState<Model | null>(null);
  const [doodles, setDoodles] = useState<Record<string, Stroke[][]> | null>(null);
  const stateRef = useRef<SketchState | null>(null);
  const strokesRef = useLatest(strokes);
  const doodleRef = useLatest(doodle);
  const phaseRef = useRef<Phase>('lobby');
  const chatId = useRef(0);
  const botLast = useRef<Record<number, number>>({});
  /** Guesses each bot already typed this turn (bots never repeat themselves). */
  const botSaid = useRef<Record<number, string[]>>({});
  const spectator = useRef(false);
  const [watching, setWatching] = useState(false);
  const setState = (s: SketchState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };
  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSettings(d));
    void loadModel().then((m) => alive && setModel(m));
    void loadDoodles().then((d) => alive && setDoodles(d));
    return () => {
      alive = false;
    };
  }, [slot]);

  const say = (who: string, text: string, kind: ChatLine['kind']) =>
    setChat((c) => [...c.slice(-60), { id: ++chatId.current, who, text, kind }]);

  const beginTurn = (s: SketchState) => {
    setStrokes([]);
    setDoodle(null);
    botLast.current = {};
    botSaid.current = {};
    setState(s);
    go('choose');
    const drawer = s.players[s.turn.drawer]!;
    say('', t('chat.choosing', { name: drawer.name }), 'system');
  };

  const start = (asSpectator: boolean) => {
    spectator.current = asSpectator;
    setWatching(asSpectator);
    void slot.save(settings);
    setChat([]);
    const s = newGame({
      lang: settings.lang,
      seconds: settings.seconds,
      rounds: settings.rounds,
      bots: settings.bots,
      humanName: asSpectator ? 'Watcher' : services.profileName || t('you'),
      seed: randomSeed() >>> 0,
    });
    beginTurn(
      asSpectator
        ? {
            ...s,
            players: s.players.map((p, i) =>
              i === 0 ? { ...p, bot: true, skill: { threshold: 0.45, delay: 2 } } : p,
            ),
          }
        : s,
    );
  };

  useEffect(() => {
    if (watch && phase === 'lobby' && model && doodles) {
      const id = window.setTimeout(() => start(true), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, model, doodles]);

  const pick = (word: string) => {
    const s = stateRef.current;
    if (!s || phaseRef.current !== 'choose') return;
    const next = chooseWord(s, word);
    setState(next);
    const drawer = next.players[next.turn.drawer]!;
    if (drawer.bot && doodles) {
      const list = doodles[word] ?? [];
      setDoodle(list.length ? new Rng(next.round * 31 + next.turnIndex).pick(list) : []);
    }
    servicesRef.current.playSound(SKETCH_SOUNDS.start);
    go('draw');
  };

  // Choosing: bots pick at once; the player has 15 seconds.
  useEffect(() => {
    if (phase !== 'choose' || !state) return;
    const drawer = state.players[state.turn.drawer]!;
    const auto = () => pick(new Rng(state.round * 7 + state.turnIndex).pick(state.turn.options));
    const id = window.setTimeout(auto, drawer.bot ? 1500 : 15000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state?.turnIndex, state?.round]);

  const finishTurn = () => {
    const s = stateRef.current;
    if (!s || phaseRef.current !== 'draw') return;
    const ended = endTurn(s);
    setState(ended);
    say('', t('chat.word', { word: displayWord(ended.turn.word!, ended.lang) }), 'system');
    servicesRef.current.playSound(
      ended.turn.guessed.length ? SKETCH_SOUNDS.turnEnd : SKETCH_SOUNDS.nobody,
    );
    go('reveal');
  };

  const guessFrom = (player: number, text: string) => {
    const s = stateRef.current;
    if (!s || phaseRef.current !== 'draw') return;
    const { state: next, result } = submitGuess(s, player, text);
    const who = s.players[player]!.name;
    const r: GuessResult = result;
    if (r === 'correct') {
      say(who, t('chat.guessed', { name: who }), 'correct');
      if (player === 0 && !spectator.current && next.turn.guessed.length === 1)
        servicesRef.current.unlockAchievement('first-guess');
      if (next.turn.done && next.turn.drawer === 0 && !spectator.current)
        servicesRef.current.unlockAchievement('artist');
      servicesRef.current.playSound(SKETCH_SOUNDS.correct);
      setState(next);
      if (next.turn.done) finishTurn();
    } else {
      say(who, text, r === 'close' ? 'close' : 'guess');
      if (r === 'close' && player === 0) say('', t('chat.close', { word: text }), 'system');
    }
  };

  // The clock, the bot drawer's hand and the bots' guesses.
  useEffect(() => {
    if (phase !== 'draw') return;
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      const next = tick(s, 0.25);
      setState(next);
      const word = next.turn.word!;
      const drawer = next.players[next.turn.drawer]!;
      const shown = drawer.bot
        ? partialStrokes(doodleRef.current ?? [], next.turn.elapsed / (next.seconds * 0.55))
        : strokesRef.current;
      if (model && shown.length) {
        next.players.forEach((p, i) => {
          if (!p.bot || i === next.turn.drawer || next.turn.guessed.some((g) => g.player === i))
            return;
          const last = botLast.current[i] ?? 0;
          if (next.turn.elapsed - last < p.skill!.delay) return;
          botLast.current[i] = next.turn.elapsed;
          const guesses = classify(model, shown, 3);
          const top = guesses[0]!;
          const rng = new Rng((i * 997 + Math.round(next.turn.elapsed * 4)) >>> 0);
          const said = (botSaid.current[i] ??= []);
          const fresh = guesses.filter((g) => !said.includes(g.label));
          const say1 = (label: string) => {
            said.push(label);
            guessFrom(i, displayWord(label, next.lang));
          };
          if (top.p >= p.skill!.threshold && !said.includes(top.label)) say1(top.label);
          else if (fresh.length && rng.chance(0.35)) say1(rng.pick(fresh).label);
        });
      }
      const last = stateRef.current!;
      if (last.turn.elapsed >= last.seconds || last.turn.done) finishTurn();
      void word;
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, model]);

  // Turn results, then the next turn or the podium.
  useEffect(() => {
    if (phase !== 'reveal') return;
    const id = window.setTimeout(() => {
      const s = stateRef.current!;
      const next = nextTurn(s);
      if (next.status === 'over') {
        setState(next);
        go('podium');
        const svc = servicesRef.current;
        svc.playSound(SKETCH_SOUNDS.podium);
        if (!spectator.current) {
          const won = ranking(next)[0] === 0;
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score: next.players[0]!.score,
            mode: `bots:${next.players.length - 1}`,
          });
          onFinish(next, (a) => svc.unlockAchievement(a));
        }
        return;
      }
      beginTurn(next);
    }, 4500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!typed.trim()) return;
    guessFrom(0, typed.trim());
    setTyped('');
  };

  // ---------------------------------------------------------------- lobby
  if (phase === 'lobby' || !state) {
    const seg = <K extends keyof Settings>(
      key: K,
      values: readonly Settings[K][],
      label: (v: Settings[K]) => string,
    ) => (
      <div className={shared.segmented}>
        {values.map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={settings[key] === v}
            onClick={() => setSettings({ ...settings, [key]: v })}
            data-testid={`sg-${String(key)}-${String(v)}`}
          >
            {label(v)}
          </button>
        ))}
      </div>
    );
    return (
      <div className={shared.menu} data-testid="sg-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          <fieldset className={shared.group}>
            <legend>{t('menu.words')}</legend>
            {seg('lang', ['en', 'es'] as const, (v) => (v === 'en' ? 'English' : 'Español'))}
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.room')}</legend>
            {seg(
              'bots',
              Array.from({ length: MAX_BOTS - 1 }, (_, i) => i + 2),
              (v) => t('menu.bots', { n: v }),
            )}
            {seg('seconds', DRAW_TIMES, (v) => `${v} s`)}
            {seg('rounds', ROUNDS, (v) => t('menu.rounds', { n: v }))}
          </fieldset>
          {!model || !doodles ? <p className={shared.hintText}>{t('menu.loading')}</p> : null}
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!model || !doodles}
              onClick={() => start(false)}
              data-testid="sg-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!model || !doodles}
              onClick={() => start(true)}
              data-testid="sg-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
          <p className={shared.hintText}>{t('menu.credit')}</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- game
  const s = state;
  const drawer = s.players[s.turn.drawer]!;
  const iDraw = s.turn.drawer === 0 && !watching;
  const word = s.turn.word;
  const remaining = Math.max(0, Math.ceil(s.seconds - s.turn.elapsed));
  const hint =
    word && (iDraw || phase !== 'draw')
      ? displayWord(word, s.lang).toUpperCase()
      : word
        ? hintLine(
            word,
            s.lang,
            revealedCount(word, s.lang, s.turn.elapsed / s.seconds),
            s.round * 101 + s.turnIndex,
          )
        : '';
  const shownStrokes = drawer.bot
    ? partialStrokes(doodle ?? [], phase === 'draw' ? s.turn.elapsed / (s.seconds * 0.55) : 1)
    : strokes;
  const order = ranking(s);

  if (phase === 'podium') {
    return (
      <div className={styles.podium} data-testid="sg-podium">
        <h2>{t('end.title')}</h2>
        <ol>
          {order.map((i, k) => (
            <li key={i} data-place={k + 1}>
              <span>{k < 3 ? ['🥇', '🥈', '🥉'][k] : `${k + 1}.`}</span>
              <strong>{s.players[i]!.name}</strong>
              <em>{s.players[i]!.score}</em>
            </li>
          ))}
        </ol>
        <div className={shared.menuActions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(watching)}
            data-testid="sg-again"
          >
            <Play size={16} /> {t('end.again')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setState(null);
              go('lobby');
            }}
            data-testid="sg-lobby"
          >
            {t('end.lobby')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.room} data-testid="sg-room">
      <div className={styles.top}>
        <span className={styles.clock} data-low={remaining <= 10} data-testid="sg-clock">
          ⏱ {phase === 'draw' ? remaining : s.seconds}
        </span>
        <span className={styles.hint} data-testid="sg-hint">
          {phase === 'choose' ? t('play.choosing', { name: drawer.name }) : hint}
        </span>
        <span>{t('play.round', { n: s.round, of: s.rounds })}</span>
      </div>
      <ol className={styles.scores} data-testid="sg-scores">
        {order.map((i) => {
          const p = s.players[i]!;
          const got = s.turn.guessed.some((g) => g.player === i);
          return (
            <li key={i} data-drawer={i === s.turn.drawer} data-guessed={got}>
              <span>{i === s.turn.drawer ? '✏️' : got ? '✅' : p.bot ? '🤖' : '🙂'}</span>
              <strong>{p.name}</strong>
              <em>
                {p.score}
                {phase === 'reveal' && s.turn.earned[i] ? ` +${s.turn.earned[i]}` : ''}
              </em>
            </li>
          );
        })}
      </ol>
      <div className={styles.board}>
        {phase === 'choose' && iDraw ? (
          <div className={styles.choose} data-testid="sg-choose">
            <p>{t('play.pick')}</p>
            {s.turn.options.map((w) => (
              <button
                key={w}
                type="button"
                className="btn btn-primary"
                onClick={() => pick(w)}
                data-testid={`sg-option-${w.replace(/ /g, '-')}`}
              >
                {displayWord(w, s.lang)}
              </button>
            ))}
          </div>
        ) : (
          <Sketchpad
            strokes={shownStrokes}
            onStrokes={setStrokes}
            drawing={iDraw && phase === 'draw'}
            autoFit={drawer.bot}
            label={t('play.canvas', { name: drawer.name })}
            testId="sg-pad"
          />
        )}
        {iDraw && phase === 'draw' && (
          <div className={shared.controls}>
            <button
              type="button"
              className="btn"
              onClick={() => setStrokes(strokes.slice(0, -1))}
              data-testid="sg-undo"
            >
              <Undo2 size={16} /> {t('play.undo')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setStrokes([])}
              data-testid="sg-clear"
            >
              <Eraser size={16} /> {t('play.clear')}
            </button>
          </div>
        )}
      </div>
      <div className={styles.chat}>
        <ul data-testid="sg-chat" aria-live="polite">
          {chat.map((c) => (
            <li key={c.id} data-kind={c.kind}>
              {c.who && <strong>{c.who}: </strong>}
              {c.kind === 'correct' ? '' : c.text}
              {c.kind === 'correct' && c.text}
            </li>
          ))}
        </ul>
        {!iDraw && !watching && (
          <form onSubmit={onSubmit} className={styles.chatForm}>
            <input
              className="input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t('play.guessHere')}
              disabled={phase !== 'draw' || s.turn.guessed.some((g) => g.player === 0)}
              maxLength={40}
              autoComplete="off"
              aria-label={t('play.guessHere')}
              data-testid="sg-input"
            />
          </form>
        )}
      </div>
    </div>
  );
}
