/**
 * The Draw Telephone table: a lobby (language, people on this device with names, bots, time per
 * step), then each step in turn for every person on the device behind a hand-over screen — write a
 * sentence, draw what you received, or describe the drawing you received — while bots play their
 * seats. The album then replays every chain from first sentence to last.
 */
import { Bot, ChevronLeft, ChevronRight, Eraser, Play, Send, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { loadDoodles, loadModel, type Model, type Stroke } from '../shared/doodle/doodle';
import { Sketchpad } from '../shared/doodle/Sketchpad';
import { loadVectors, type Vectors } from '../shared/semantic/semantic';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { botDescribe, botDraw, botSentence } from './bots';
import {
  MAX_PLAYERS,
  chainFor,
  cleanText,
  handIn,
  newGame,
  received,
  stepKind,
  steps,
  type Entry,
  type Player,
  type TelephoneState,
} from './engine';
import { STRINGS } from './i18n';
import { TELEPHONE_SOUNDS } from './sounds';
import styles from './Telephone.module.css';

interface Settings {
  lang: 'en' | 'es';
  humans: number;
  bots: number;
  seconds: number;
  names: string[];
}

export function TelephoneGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: TelephoneState, unlock: (id: string) => void) => void;
}) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Settings>({
        schema: 1,
        validate: (d: unknown): d is Settings =>
          typeof d === 'object' && d !== null && typeof (d as Settings).humans === 'number',
      }),
    [services],
  );
  const watch = services.launchParams.mode === 'watch';
  const [settings, setSettings] = useState<Settings>({
    lang: locale === 'es' ? 'es' : 'en',
    humans: 1,
    bots: 4,
    seconds: 90,
    names: [],
  });
  const [state, setStateRaw] = useState<TelephoneState | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [albumChain, setAlbumChain] = useState(0);
  const [albumStep, setAlbumStep] = useState(0);
  const [model, setModel] = useState<Model | null>(null);
  const [doodles, setDoodles] = useState<Record<string, Stroke[][]> | null>(null);
  const [vectors, setVectors] = useState<Vectors | null>(null);
  const stateRef = useRef<TelephoneState | null>(null);
  const textRef = useLatest(text);
  const strokesRef = useLatest(strokes);
  const setState = (s: TelephoneState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSettings(d));
    void loadModel().then((m) => alive && setModel(m));
    void loadDoodles().then((d) => alive && setDoodles(d));
    void loadVectors().then((v) => alive && setVectors(v));
    return () => {
      alive = false;
    };
  }, [slot]);

  const humanName = (i: number) =>
    settings.names[i] ||
    (i === 0 && services.profileName ? services.profileName : t('menu.player', { n: i + 1 }));

  /** Bots hand in their seats for the current step. */
  const playBots = (s: TelephoneState): TelephoneState => {
    let next = s;
    s.players.forEach((p, i) => {
      if (!p.bot || next.done.includes(i) || next.step !== s.step) return;
      const rng = new Rng((i * 7919 + s.step * 104729 + randomSeed()) >>> 0);
      const kind = stepKind(s.step);
      const got = received(next, i);
      let entry: Entry;
      if (kind === 'write') entry = { kind: 'text', text: botSentence(s.lang, rng).text, by: i };
      else if (kind === 'draw')
        entry = {
          kind: 'drawing',
          strokes: botDraw(got?.kind === 'text' ? got.text : '', doodles ?? {}, vectors, rng),
          by: i,
        };
      else
        entry = {
          kind: 'text',
          text:
            got?.kind === 'drawing' && model ? botDescribe(model, got.strokes, s.lang, rng) : '…',
          by: i,
        };
      next = handIn(next, i, entry);
    });
    return next;
  };

  const nextSeat = (s: TelephoneState) =>
    s.players.findIndex((p, i) => !p.bot && !s.done.includes(i));

  const advance = (s: TelephoneState) => {
    let next = s;
    // Bots hand in at once; people follow one by one behind the hand-over screen.
    while (next.status === 'playing') {
      next = playBots(next);
      if (next.status !== 'playing' || nextSeat(next) >= 0) break;
    }
    setState(next);
    setText('');
    setStrokes([]);
    setReady(false);
    if (next.status === 'album') {
      setSeat(null);
      setAlbumChain(0);
      setAlbumStep(0);
      servicesRef.current.playSound(TELEPHONE_SOUNDS.album);
      if (!watch) {
        servicesRef.current.recordResult({
          outcome: 'complete',
          score: next.players.length,
          mode: `players:${next.players.length}`,
        });
        onFinish(next, (id) => servicesRef.current.unlockAchievement(id));
      }
      return;
    }
    setSeat(nextSeat(next));
  };

  const start = () => {
    void slot.save(settings);
    const humans = watch ? 0 : settings.humans;
    const bots = Math.max(3 - humans, Math.min(MAX_PLAYERS - humans, settings.bots));
    const players: Player[] = [
      ...Array.from({ length: humans }, (_, i) => ({ name: humanName(i), bot: false })),
      ...Array.from({ length: bots }, (_, i) => ({
        name: ['Pixel', 'Doodle', 'Inky', 'Scribbles', 'Crayon', 'Sketchy', 'Marker', 'Chalky'][i]!,
        bot: true,
      })),
    ];
    advance(newGame(settings.lang, players, settings.seconds));
  };

  useEffect(() => {
    if (watch && !state && model && doodles && vectors) {
      const id = window.setTimeout(start, 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, model, doodles, vectors]);

  const submit = () => {
    const s = stateRef.current;
    if (!s || seat === null) return;
    const kind = stepKind(s.step);
    const entry: Entry =
      kind === 'draw'
        ? { kind: 'drawing', strokes: strokesRef.current, by: seat }
        : { kind: 'text', text: cleanText(textRef.current, t('play.blank')), by: seat };
    servicesRef.current.playSound(TELEPHONE_SOUNDS.send);
    advance(handIn(s, seat, entry));
  };

  const stepSeconds = (st: TelephoneState) =>
    stepKind(st.step) === 'draw' ? st.seconds : Math.round(st.seconds / 2);

  const beginStep = () => {
    const s = stateRef.current;
    if (!s) return;
    const d = Date.now() + stepSeconds(s) * 1000;
    setDeadline(d);
    setNow(Date.now());
    setReady(true);
  };

  // Step clock for the person playing (drawing gets the full time, writing half).
  useEffect(() => {
    if (!ready || !deadline) return;
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= deadline) {
        window.clearInterval(id);
        submit();
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, deadline]);

  const left = Math.max(0, Math.ceil((deadline - now) / 1000));

  // ---------------------------------------------------------------- lobby
  if (!state) {
    const seg = <K extends 'humans' | 'bots' | 'seconds'>(
      key: K,
      values: number[],
      label: (v: number) => string,
    ) => (
      <div className={shared.segmented}>
        {values.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={settings[key] === v}
            onClick={() => setSettings({ ...settings, [key]: v })}
            data-testid={`dt-${key}-${v}`}
          >
            {label(v)}
          </button>
        ))}
      </div>
    );
    const loaded = !!model && !!doodles && !!vectors;
    return (
      <div className={shared.menu} data-testid="dt-menu">
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
                  data-testid={`dt-lang-${l}`}
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
            {seg('seconds', [60, 90, 120], (v) => `${v} s`)}
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
          {!loaded && <p className={shared.hintText}>{t('menu.loading')}</p>}
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!loaded}
              onClick={start}
              data-testid="dt-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
          </div>
          <p className={shared.hintText}>{t('menu.credit')}</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- album
  if (state.status === 'album') {
    const chain = state.chains[albumChain]!;
    return (
      <div className={styles.album} data-testid="dt-album">
        <h2>{t('album.title', { name: state.players[albumChain]!.name })}</h2>
        <ol className={styles.entries}>
          {chain.slice(0, albumStep + 1).map((e, k) => (
            <li key={k} className={styles.entry} data-kind={e.kind} data-testid={`dt-entry-${k}`}>
              <span className={styles.by}>{state.players[e.by]!.name}</span>
              {e.kind === 'text' ? (
                <p className={styles.bubble}>{e.text}</p>
              ) : (
                <Sketchpad
                  strokes={e.strokes}
                  drawing={false}
                  autoFit={state.players[e.by]!.bot}
                  label={t('album.drawing', { name: state.players[e.by]!.name })}
                  testId={`dt-album-pad-${k}`}
                />
              )}
            </li>
          ))}
        </ol>
        <div className={shared.controls}>
          {albumStep < chain.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAlbumStep((k) => k + 1)}
              data-testid="dt-album-next"
            >
              <ChevronRight size={16} /> {t('album.next')}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn"
                disabled={albumChain === 0}
                onClick={() => {
                  setAlbumChain((c) => c - 1);
                  setAlbumStep(0);
                }}
              >
                <ChevronLeft size={16} /> {t('album.prevChain')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={albumChain >= state.chains.length - 1}
                onClick={() => {
                  setAlbumChain((c) => c + 1);
                  setAlbumStep(0);
                }}
                data-testid="dt-album-chain"
              >
                {t('album.nextChain')} <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setState(null)}
                data-testid="dt-lobby"
              >
                {t('album.lobby')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- a person's step
  const kind = stepKind(state.step);
  const player = seat !== null ? state.players[seat]! : null;
  const got = seat !== null ? received(state, seat) : null;
  if (seat === null || !player) return <p className="muted">{t('play.bots')}</p>;
  if (!ready)
    return (
      <div className={shared.menu} data-testid="dt-pass">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('play.turn', { name: player.name })}</h2>
          <p className="muted">{t('play.pass', { name: player.name })}</p>
          <p>{t('play.step', { n: state.step + 1, of: steps(state) })}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={beginStep}
            data-testid="dt-ready"
          >
            {t('play.ready')}
          </button>
        </div>
      </div>
    );

  return (
    <div className={styles.step} data-testid={`dt-step-${kind}`}>
      <div className={styles.head}>
        <span>{t('play.step', { n: state.step + 1, of: steps(state) })}</span>
        <span className={styles.clock} data-low={left <= 10}>
          ⏱ {left}
        </span>
        <span>{t('play.chainOf', { name: state.players[chainFor(state, seat)]!.name })}</span>
      </div>
      {kind === 'write' && (
        <>
          <h2>{t('play.write')}</h2>
          <input
            className={`input ${styles.textIn}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={80}
            placeholder={t('play.writeHint')}
            data-testid="dt-text"
            autoFocus
          />
        </>
      )}
      {kind === 'draw' && got?.kind === 'text' && (
        <>
          <h2>{t('play.draw')}</h2>
          <p className={styles.bubble} data-testid="dt-prompt">
            {got.text}
          </p>
          <Sketchpad
            strokes={strokes}
            onStrokes={setStrokes}
            drawing
            label={t('play.canvas')}
            testId="dt-pad"
          />
          <div className={shared.controls}>
            <button type="button" className="btn" onClick={() => setStrokes(strokes.slice(0, -1))}>
              <Undo2 size={16} /> {t('play.undo')}
            </button>
            <button type="button" className="btn" onClick={() => setStrokes([])}>
              <Eraser size={16} /> {t('play.clear')}
            </button>
          </div>
        </>
      )}
      {kind === 'describe' && got?.kind === 'drawing' && (
        <>
          <h2>{t('play.describe')}</h2>
          <Sketchpad
            strokes={got.strokes}
            drawing={false}
            autoFit={state.players[got.by]!.bot}
            label={t('play.received')}
            testId="dt-received"
          />
          <input
            className={`input ${styles.textIn}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={80}
            placeholder={t('play.describeHint')}
            data-testid="dt-text"
            autoFocus
          />
        </>
      )}
      <button type="button" className="btn btn-primary" onClick={submit} data-testid="dt-done">
        <Send size={16} /> {t('play.done')}
      </button>
      {watch && <Bot size={16} aria-hidden="true" />}
    </div>
  );
}
