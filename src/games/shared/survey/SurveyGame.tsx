/**
 * The survey table shared by #201 Rare Answer Dive and #202 Crowd Answer Climb: a menu (answer
 * language, today's run, unlimited runs, local party for 2–6 players, watch the AI, resume), the
 * 3-second preview and 25-second answer clock for each of seven prompts, instant feedback on
 * rejected answers, a reveal of each accepted answer's band and points, the gauge (ocean or sky)
 * and an end screen with the full answer sheets, prize facts and a spoiler-free share line.
 */
import { Bot, CalendarDays, Copy, PartyPopper, Play, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Rng, randomSeed } from '../../../core/game-engine/random';
import { useLatest } from '../../../core/game-engine/hooks';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, type Translator } from '../../../core/i18n';
import shared from '../sudoku/SudokuGame.module.css';
import {
  MAX_PLAYERS,
  PREVIEW_SECONDS,
  PROMPTS_PER_RUN,
  SECONDS_PER_PROMPT,
  CLIMB_TRIES,
  applyAction,
  currentSheet,
  isValidSurveyState,
  newRun,
  playerScore,
  progressUnits,
  shareGlyphs,
  sheetById,
  submitText,
  type Answer,
  type Lang,
  type Match,
  type Polarity,
  type RunKind,
  type SurveyState,
} from './engine';
import { knowledgeMove } from './environment';
import { STRINGS } from './i18n';
import { Scene } from './Scene';
import { BANDS, type Band } from './sheets';
import { SURVEY_SOUNDS } from './sounds';
import styles from './SurveyGame.module.css';

export interface SurveyDefinition {
  polarity: Polarity;
  /** Unlocks achievements for a finished run (solo player 0, or every party player). */
  onFinish: (s: SurveyState, unlock: (id: string) => void, streak: number) => void;
}

interface Saved {
  run: SurveyState | null;
  names: string[];
  /** Daily scores by YYYYMMDD key, per language. */
  daily: Record<string, number>;
  lastDaily: SurveyState | null;
}

type Phase = 'pass' | 'preview' | 'answer' | 'reveal';
type Mode = 'menu' | 'play' | 'watch';

export const todayKey = (d = new Date()) =>
  d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

const dailyKey = (day: number, lang: Lang) => `${day}:${lang}`;

/** Consecutive days with a finished daily run, ending today (or yesterday). */
export function dailyStreak(daily: Record<string, number>, today: number): number {
  const days = new Set(Object.keys(daily).map((k) => Number(k.split(':')[0])));
  const d = new Date(Math.floor(today / 10000), Math.floor((today % 10000) / 100) - 1, today % 100);
  if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(todayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.run === null || isValidSurveyState(s.run)) &&
    (s.lastDaily === null || isValidSurveyState(s.lastDaily)) &&
    Array.isArray(s.names) &&
    typeof s.daily === 'object' &&
    s.daily !== null
  );
};

function bandLabel(t: Translator, polarity: Polarity, band: Band | null) {
  return band ? t(`${polarity}.band.${band}`) : '—';
}

export function SurveyGame({ def, services }: { def: SurveyDefinition; services: GameServices }) {
  const { locale, polarity } = { locale: services.locale, polarity: def.polarity };
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const tp = (key: string, params?: Record<string, string | number>) =>
    t(`${polarity}.${key}`, params);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;

  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [lang, setLang] = useState<Lang>(locale === 'es' ? 'es' : 'en');
  const [players, setPlayers] = useState(2);
  const [saved, setSaved] = useState<Saved>({ run: null, names: [], daily: {}, lastDaily: null });
  const [run, setRunState] = useState<SurveyState | null>(null);
  const [phase, setPhaseState] = useState<Phase>('preview');
  const [deadline, setDeadlineState] = useState(0);
  // The clock reads these refs so a tick never acts on a stale phase or deadline.
  const phaseRef = useRef<Phase>('preview');
  const deadlineRef = useRef(0);
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };
  const setDeadline = (d: number) => {
    deadlineRef.current = d;
    setDeadlineState(d);
  };
  const [now, setNow] = useState(() => Date.now());
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; bad: boolean } | null>(null);
  const [shake, setShake] = useState(0);
  const [reveal, setReveal] = useState<{
    prompt: number;
    player: number;
    answer: Answer;
    match: Match | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const runRef = useRef<SurveyState | null>(null);
  const setRun = (r: SurveyState | null) => {
    runRef.current = r;
    setRunState(r);
  };
  const savedRef = useLatest(saved);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTick = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d) setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const names = (n: number) =>
    Array.from(
      { length: n },
      (_, i) =>
        saved.names[i] ??
        (i === 0 && services.profileName
          ? services.profileName
          : t('menu.playerName', { n: i + 1 })),
    );

  const persist = (patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    setSaved(next);
    void slot.save(next);
  };

  const beginTurn = (s: SurveyState, m: Mode) => {
    setTyped('');
    setFeedback(null);
    setReveal(null);
    lastTick.current = -1;
    if (s.players > 1 && m === 'play') {
      setPhase('pass');
      return;
    }
    setPhase('preview');
    setDeadline(Date.now() + PREVIEW_SECONDS * 1000);
    setNow(Date.now());
  };

  const start = (s: SurveyState, m: Mode) => {
    setRun(s);
    setMode(m);
    setLang(s.lang);
    setCopied(false);
    beginTurn(s, m);
    if (m === 'play') persist({ run: s });
  };

  const fresh = (kind: RunKind, m: Mode = 'play') =>
    start(
      newRun({
        polarity,
        lang,
        kind,
        seed: fixedSeed ?? randomSeed() >>> 0,
        day: todayKey(),
        players,
      }),
      m,
    );

  // Watch mode opened from a link starts at once.
  useEffect(() => {
    if (mode !== 'watch' || run) return;
    const id = window.setTimeout(() => fresh('unlimited', 'watch'), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const finishRun = (s: SurveyState) => {
    const svc = servicesRef.current;
    svc.playSound(SURVEY_SOUNDS.end);
    if (mode !== 'play') return;
    const score = playerScore(s, 0);
    let daily = savedRef.current.daily;
    let lastDaily = savedRef.current.lastDaily;
    if (s.kind === 'daily' && s.day !== null) {
      daily = { ...daily, [dailyKey(s.day, s.lang)]: score };
      lastDaily = s;
    }
    persist({ run: null, daily, lastDaily });
    svc.recordResult({ outcome: 'complete', score, mode: s.kind });
    def.onFinish(s, (id) => svc.unlockAchievement(id), dailyStreak(daily, todayKey()));
  };

  const commit = (next: SurveyState, match: Match | null) => {
    const prev = runRef.current!;
    const answer = next.answers[prev.prompt]![prev.player]!;
    const svc = servicesRef.current;
    if (answer.band === 'f') svc.playSound(SURVEY_SOUNDS.prize);
    else if (answer.band)
      svc.playSound(polarity === 'rare' ? SURVEY_SOUNDS.ping : SURVEY_SOUNDS.whoosh);
    else svc.playSound(SURVEY_SOUNDS.timeout);
    setRun(next);
    setReveal({ prompt: prev.prompt, player: prev.player, answer, match });
    setPhase('reveal');
    setFeedback(null);
    if (mode === 'play') persist({ run: next.status === 'done' ? null : next });
    if (next.status === 'done') finishRun(next);
  };

  const submit = (text: string) => {
    const s = runRef.current;
    if (!s || phaseRef.current !== 'answer' || s.status !== 'playing' || !text.trim()) return;
    const { state, match } = submitText(s, text);
    if (match) {
      commit(state, match);
      return;
    }
    servicesRef.current.playSound(SURVEY_SOUNDS.miss);
    setShake((n) => n + 1);
    setTyped('');
    if (state.prompt !== s.prompt || state.player !== s.player || state.status !== s.status) {
      commit(state, null); // a climb ran out of tries
      return;
    }
    setRun(state);
    const left = CLIMB_TRIES - state.misses;
    setFeedback({
      bad: true,
      text:
        polarity === 'rare'
          ? tp('miss')
          : left === 1
            ? t('common.missLast')
            : t('common.miss', { left }),
    });
    if (mode === 'play') persist({ run: state });
  };

  const next = () => {
    const s = runRef.current;
    if (!s) return;
    if (s.status === 'done') {
      setReveal(null);
      return;
    }
    beginTurn(s, mode);
  };

  // The clock: preview → answer → timeout.
  useEffect(() => {
    if (!run || run.status !== 'playing' || (phase !== 'preview' && phase !== 'answer')) return;
    const id = window.setInterval(() => {
      const nowMs = Date.now();
      setNow(nowMs);
      const s = runRef.current;
      const ph = phaseRef.current;
      if (!s || s.status !== 'playing' || (ph !== 'preview' && ph !== 'answer')) return;
      if (nowMs >= deadlineRef.current) {
        if (ph === 'preview') {
          setPhase('answer');
          setDeadline(nowMs + SECONDS_PER_PROMPT * 1000);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        } else {
          setFeedback(null);
          commit(applyAction(s, 'timeout'), null);
        }
        return;
      }
      const left = Math.ceil((deadlineRef.current - nowMs) / 1000);
      if (ph === 'answer' && left <= 5 && left !== lastTick.current) {
        lastTick.current = left;
        servicesRef.current.playSound(SURVEY_SOUNDS.tick);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, phase]);

  // Watch the AI: it "types" its answer a moment into the clock.
  useEffect(() => {
    if (mode !== 'watch' || !run) return;
    if (phase === 'reveal') {
      const id = window.setTimeout(next, 2600);
      return () => window.clearTimeout(id);
    }
    if (phase === 'answer' && run.status === 'playing') {
      const rng = new Rng((run.seed ^ (run.prompt * 7919)) >>> 0);
      const action = knowledgeMove(run, rng, 'buff');
      const name =
        action === 'timeout'
          ? ''
          : currentSheet(run).entries[Number(action.slice(2))]!.name[run.lang];
      let i = 0;
      const id = window.setInterval(() => {
        i++;
        setTyped(name.slice(0, i));
        if (i >= name.length) {
          window.clearInterval(id);
          window.setTimeout(() => {
            const s = runRef.current;
            if (!s || s.prompt !== run.prompt) return;
            if (action === 'timeout') commit(applyAction(s, 'timeout'), null);
            else
              commit(applyAction(s, action, name), {
                entry: Number(action.slice(2)),
                fuzzy: false,
              });
          }, 350);
        }
      }, 90);
      return () => window.clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, run?.prompt, run?.player, run?.status, phase]);

  const toMenu = () => {
    setMode('menu');
    setRun(null);
    setReveal(null);
  };

  // ---------------------------------------------------------------- menu
  if (mode === 'menu' || !run) {
    const stats = services.getStats();
    const today = todayKey();
    const doneToday = saved.daily[dailyKey(today, lang)];
    const streak = dailyStreak(saved.daily, today);
    const resumable = saved.run && saved.run.status === 'playing' ? saved.run : null;
    return (
      <div className={shared.menu} data-testid="sv-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{tp('title')}</h2>
          <p className="muted">{tp('subtitle')}</p>
          {resumable && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(resumable, 'play')}
              data-testid="sv-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>{t('menu.resumeHint', { n: resumable.prompt + 1 })}</small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.lang')}</legend>
            <div className={shared.segmented}>
              {(['en', 'es'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  data-testid={`sv-lang-${l}`}
                >
                  {t(`lang.${l}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>
              {stats?.completions
                ? t('menu.streak', { streak, best: stats.bestScore ?? 0 })
                : t('menu.unplayed')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            {doneToday === undefined ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => fresh('daily')}
                data-testid="sv-daily"
              >
                <CalendarDays size={16} /> {tp('daily')}
              </button>
            ) : (
              <p className={shared.hintText} data-testid="sv-daily-done">
                {t('menu.dailyDone', { score: doneToday })}
              </p>
            )}
            <button
              type="button"
              className={doneToday === undefined ? 'btn' : 'btn btn-primary'}
              onClick={() => fresh('unlimited')}
              data-testid="sv-unlimited"
            >
              <Shuffle size={16} /> {t('menu.unlimited')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('unlimited', 'watch')}
              data-testid="sv-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
          <fieldset className={shared.group}>
            <legend>{t('menu.party')}</legend>
            <div className={styles.partyRow}>
              <label>
                {t('menu.players')}{' '}
                <select
                  className="select"
                  value={players}
                  onChange={(e) => setPlayers(Number(e.target.value))}
                  data-testid="sv-players"
                >
                  {Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn"
                onClick={() => fresh('party')}
                data-testid="sv-party"
              >
                <PartyPopper size={16} /> {t('menu.party')}
              </button>
            </div>
            <div className={styles.names}>
              {names(players).map((n, i) => (
                <input
                  key={i}
                  className="input"
                  value={n}
                  aria-label={t('menu.playerName', { n: i + 1 })}
                  maxLength={16}
                  onChange={(e) => {
                    const list = names(MAX_PLAYERS);
                    list[i] = e.target.value;
                    persist({ names: list });
                  }}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- play
  const s = run;
  const playerNames = s.players > 1 ? names(s.players) : [services.profileName || ''];
  const done = s.status === 'done' && !reveal;
  const activePlayer = reveal ? reveal.player : s.player;
  const score = playerScore(s, activePlayer);
  const value = progressUnits(polarity, score);
  const promptIndex = reveal ? reveal.prompt : Math.min(s.prompt, PROMPTS_PER_RUN - 1);
  const sheet = sheetById(s.prompts[promptIndex]!);
  const remaining = Math.max(0, deadline - now);
  const fraction =
    phase === 'answer' ? remaining / (SECONDS_PER_PROMPT * 1000) : phase === 'preview' ? 1 : 0;

  if (done) {
    const ranking = Array.from({ length: s.players }, (_, p) => ({
      p,
      score: playerScore(s, p),
    })).sort((a, b) => b.score - a.score);
    const share = () => {
      const lines = [
        `${tp('title')}${s.day ? ` ${String(s.day).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}` : ''}`,
        shareGlyphs(s),
        `${tp('units', { value: value.toLocaleString() })} · ${t('end.score', { score: playerScore(s, 0) })}`,
      ];
      void navigator.clipboard?.writeText(lines.join('\n')).then(
        () => setCopied(true),
        () => setCopied(false),
      );
    };
    return (
      <div className={styles.layout} data-testid="sv-end">
        <Scene polarity={polarity} value={progressUnits(polarity, playerScore(s, 0))} t={t} />
        <div className={styles.main}>
          <div className={styles.card}>
            <h2 className={styles.question}>{t('end.title')}</h2>
            {s.players > 1 ? (
              <>
                <p className={styles.big} data-testid="sv-winner">
                  {ranking[0]!.score === ranking[1]?.score
                    ? t('end.tie')
                    : t('end.winner', { name: playerNames[ranking[0]!.p]! })}
                </p>
                <ol className={styles.ranking}>
                  {ranking.map((r) => (
                    <li key={r.p}>
                      <span>{playerNames[r.p]}</span>
                      <strong>{r.score}</strong>
                      <small>
                        {tp('units', { value: progressUnits(polarity, r.score).toLocaleString() })}
                      </small>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <>
                <p className={styles.big} data-testid="sv-total">
                  {polarity === 'rare'
                    ? t('rare.endDepth', { value: value.toLocaleString() })
                    : t('common.endAltitude', { value: value.toLocaleString() })}
                </p>
                <p className="muted">{t('end.score', { score: playerScore(s, 0) })}</p>
                <p className={styles.glyphs} aria-hidden="true">
                  {shareGlyphs(s)}
                </p>
              </>
            )}
            <div className={shared.menuActions}>
              {s.players === 1 && (
                <button type="button" className="btn" onClick={share} data-testid="sv-share">
                  <Copy size={16} /> {copied ? t('end.copied') : t('end.share')}
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => fresh(s.kind === 'party' ? 'party' : 'unlimited', mode)}
                data-testid="sv-again"
              >
                <Play size={16} /> {t('end.again')}
              </button>
              <button type="button" className="btn" onClick={toMenu} data-testid="sv-menu-btn">
                {t('end.menu')}
              </button>
            </div>
          </div>
          <ol className={styles.review} data-testid="sv-review">
            {s.prompts.map((id, i) => {
              const sh = sheetById(id);
              return (
                <li key={id} className={styles.card}>
                  <h3>{sh.q[s.lang]}</h3>
                  {playerNames.map((name, p) => {
                    const a = s.answers[i]![p];
                    return (
                      <p key={p} className={styles.reviewLine}>
                        {s.players > 1 && <span className={styles.who}>{name}</span>}
                        <span>
                          {a?.entry != null ? sh.entries[a.entry]!.name[s.lang] : t('end.noAnswer')}
                        </span>
                        <span className={styles.band} data-band={a?.band ?? 'none'}>
                          {bandLabel(t, polarity, a?.band ?? null)}
                        </span>
                        <strong>{a?.points ?? 0}</strong>
                      </p>
                    );
                  })}
                  <details>
                    <summary>{t('end.sheet')}</summary>
                    {BANDS.map((b) => (
                      <p key={b} className={styles.sheetLine}>
                        <span className={styles.band} data-band={b}>
                          {bandLabel(t, polarity, b)}
                        </span>{' '}
                        {sh.entries
                          .filter((e) => e.band === b)
                          .map((e) => e.name[s.lang])
                          .join(', ')}
                      </p>
                    ))}
                    <p className={styles.fact}>
                      <strong>{t('end.fact')}:</strong> {sh.fact[s.lang]}
                    </p>
                  </details>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(typed);
  };

  return (
    <div className={styles.layout} data-testid={`sv-play-${polarity}`}>
      <Scene polarity={polarity} value={value} t={t} />
      <div className={styles.main}>
        <div className={styles.bar}>
          <span>{t('play.question', { n: promptIndex + 1 })}</span>
          {s.players > 1 && (
            <span data-testid="sv-turn">
              {t('play.turn', { name: playerNames[activePlayer]! })}
            </span>
          )}
          <span data-testid="sv-score">{tp('units', { value: value.toLocaleString() })}</span>
        </div>
        {phase === 'pass' ? (
          <div className={styles.card} data-testid="sv-pass">
            <h2 className={styles.question}>{t('play.turn', { name: playerNames[s.player]! })}</h2>
            <p className="muted">{t('play.pass', { name: playerNames[s.player]! })}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPhase('preview');
                setDeadline(Date.now() + PREVIEW_SECONDS * 1000);
                setNow(Date.now());
              }}
              data-testid="sv-ready"
            >
              {t('play.imReady')}
            </button>
          </div>
        ) : (
          <div className={styles.card}>
            <h2 className={styles.question} data-testid="sv-question">
              {sheet.q[s.lang]}
            </h2>
            <div
              className={styles.timer}
              role="timer"
              aria-label={`${Math.ceil(remaining / 1000)} s`}
              data-phase={phase}
            >
              <div
                className={styles.timerFill}
                style={{ transform: `scaleX(${fraction})` }}
                data-low={phase === 'answer' && remaining < 5000}
              />
              <span>
                {phase === 'preview'
                  ? t('play.ready')
                  : phase === 'answer'
                    ? `${Math.ceil(remaining / 1000)}`
                    : ''}
              </span>
            </div>
            {phase === 'reveal' && reveal ? (
              <div className={styles.reveal} data-testid="sv-reveal" aria-live="polite">
                {reveal.answer.entry !== null ? (
                  <>
                    <p className={styles.answerName}>
                      {sheet.entries[reveal.answer.entry]!.name[s.lang]}
                    </p>
                    {reveal.match?.fuzzy && (
                      <p className="muted">
                        {t('play.typo', { name: sheet.entries[reveal.answer.entry]!.name[s.lang] })}
                      </p>
                    )}
                    <p>
                      <span className={styles.band} data-band={reveal.answer.band ?? 'none'}>
                        {bandLabel(t, polarity, reveal.answer.band)}
                      </span>{' '}
                      <strong className={styles.points} data-testid="sv-points">
                        {t('play.points', { points: reveal.answer.points })}
                      </strong>{' '}
                      <span className="muted">
                        ({tp('units', { value: progressUnits(polarity, reveal.answer.points) })})
                      </span>
                    </p>
                    <p className="muted">{tp(`bandHint.${reveal.answer.band!}`)}</p>
                    {reveal.answer.band === 'f' && (
                      <p className={styles.fact}>{sheet.fact[s.lang]}</p>
                    )}
                  </>
                ) : (
                  <p className={styles.answerName} data-testid="sv-timeout">
                    {reveal.answer.misses >= CLIMB_TRIES && polarity === 'common'
                      ? t('play.outOfTries')
                      : t('play.timeout')}{' '}
                    <strong className={styles.points}>+0</strong>
                  </p>
                )}
                {mode === 'play' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={next}
                    data-testid="sv-next"
                  >
                    {s.status === 'done' ? t('play.finish') : t('play.next')}
                  </button>
                )}
              </div>
            ) : (
              <form className={styles.answerRow} onSubmit={onSubmit}>
                <input
                  ref={inputRef}
                  key={shake}
                  className={`input ${styles.answerInput} ${shake ? styles.shake : ''}`}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={t('play.placeholder')}
                  disabled={phase !== 'answer' || mode === 'watch'}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={40}
                  aria-label={t('play.placeholder')}
                  data-testid="sv-input"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={phase !== 'answer' || mode === 'watch'}
                  data-testid="sv-go"
                >
                  {tp('go')}
                </button>
              </form>
            )}
            <p
              className={`${styles.feedback} ${feedback?.bad ? styles.bad : ''}`}
              aria-live="polite"
              data-testid="sv-feedback"
            >
              {mode === 'watch' && phase === 'answer' ? t('play.watching') : (feedback?.text ?? '')}
            </p>
          </div>
        )}
        <div className={styles.progress} aria-hidden="true">
          {s.prompts.map((id, i) => {
            const a = s.answers[i]![activePlayer];
            return (
              <span
                key={id}
                className={styles.pip}
                data-band={a ? (a.band ?? 'none') : i === promptIndex ? 'current' : 'todo'}
              />
            );
          })}
        </div>
        <div className={shared.controls}>
          <button type="button" className="btn" onClick={toMenu} data-testid="sv-menu-btn">
            {t('controls.menu')}
          </button>
        </div>
      </div>
    </div>
  );
}
