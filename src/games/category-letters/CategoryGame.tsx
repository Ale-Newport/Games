/**
 * The Category Letters table: a menu (answer language, list size, timer, rounds, bots and their
 * skill, 1–4 humans sharing the device, alliteration bonus, full alphabet), the letter die roll,
 * the timed list, hand-overs between humans, the review with verdicts, duplicates and table votes,
 * running totals and the final ranking. "Watch the AI" lets an agent fill the list.
 */
import { Bot, Dices, Play, RotateCcw, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Rng, randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { pickAnswer } from './ai-adapter';
import {
  DEFAULT_SETTINGS,
  DIE,
  ALL_LETTERS,
  LIST_SIZES,
  MAX_BOTS,
  MAX_HUMANS,
  ROUND_COUNTS,
  TIMERS,
  categoryById,
  confirmRound,
  currentRound,
  humanIndexes,
  humansCanVote,
  isValidState,
  keyLetter,
  newGame,
  roundPoints,
  scoreRound,
  setVote,
  submitList,
  winners,
  type CLState,
  type Settings,
  type Skill,
  type Verdict,
} from './engine';
import { STRINGS } from './i18n';
import styles from './CategoryLetters.module.css';
import { CL_SOUNDS } from './sounds';

interface Saved {
  state: CLState | null;
  draft: string[];
  remainingMs: number;
  settings: Settings;
  names: string[];
}

type Stage = 'roll' | 'pass' | 'fill' | 'review';
type Mode = 'menu' | 'play' | 'watch';

const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.state === null || isValidState(s.state)) &&
    Array.isArray(s.draft) &&
    typeof s.remainingMs === 'number' &&
    typeof s.settings === 'object' &&
    Array.isArray(s.names)
  );
};

export function CategoryGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: CLState, unlock: (id: string) => void) => void;
}) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;

  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    lang: locale === 'es' ? 'es' : 'en',
  });
  const [names, setNames] = useState<string[]>([]);
  const [resume, setResume] = useState<Saved | null>(null);
  const [state, setStateRaw] = useState<CLState | null>(null);
  const [stage, setStage] = useState<Stage>('roll');
  const [draft, setDraft] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [rolling, setRolling] = useState('');
  const stateRef = useRef<CLState | null>(null);
  const draftRef = useLatest(draft);
  const stageRef = useRef<Stage>('roll');
  const setState = (s: CLState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };
  const go = (st: Stage) => {
    stageRef.current = st;
    setStage(st);
  };

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (cancelled || !d) return;
      setSettings(d.settings);
      setNames(d.names);
      if (d.state && d.state.phase !== 'done') setResume(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const humanName = (i: number) =>
    names[i] ||
    (i === 0 && services.profileName ? services.profileName : t('menu.player', { n: i + 1 }));

  const persist = (s: CLState | null, d: string[], remainingMs: number) => {
    if (mode !== 'play' && s !== null) return;
    void slot.save({ state: s, draft: d, remainingMs, settings, names });
  };

  const beginFill = (s: CLState, remainingMs = s.settings.seconds * 1000) => {
    const round = currentRound(s);
    const who = humanIndexes(s)[s.filler]!;
    setDraft(round.answers[who]!.map((a) => a));
    setDeadline(Date.now() + remainingMs);
    setNow(Date.now());
    go('fill');
  };

  const afterRoll = (s: CLState, m: Mode) => {
    if (humanIndexes(s).length > 1 && m === 'play') go('pass');
    else beginFill(s);
  };

  const roll = (s: CLState, m: Mode) => {
    go('roll');
    const letter = currentRound(s).letter;
    servicesRef.current.playSound(CL_SOUNDS.roll);
    if (services.reducedMotion) {
      setRolling(letter);
      window.setTimeout(() => afterRoll(s, m), 600);
      return;
    }
    const pool = s.settings.allLetters ? ALL_LETTERS[s.settings.lang] : DIE[s.settings.lang];
    const rng = new Rng(s.seed ^ s.rounds.length);
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      if (n >= 14) {
        window.clearInterval(id);
        setRolling(letter);
        servicesRef.current.playSound(CL_SOUNDS.land);
        window.setTimeout(() => afterRoll(s, m), 900);
        return;
      }
      setRolling(rng.pick([...pool]));
    }, 90);
  };

  const start = (m: Mode) => {
    const humans = m === 'watch' ? 1 : settings.humans;
    const s = newGame(
      { ...settings, humans },
      fixedSeed ?? randomSeed() >>> 0,
      m === 'watch' ? ['AI'] : Array.from({ length: humans }, (_, i) => humanName(i)),
    );
    setState(s);
    setMode(m);
    void slot.save({ state: m === 'play' ? s : null, draft: [], remainingMs: 0, settings, names });
    roll(s, m);
  };

  useEffect(() => {
    if (mode === 'watch' && !state) {
      const id = window.setTimeout(() => start('watch'), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handIn = () => {
    const s = stateRef.current;
    if (!s || stageRef.current !== 'fill') return;
    const next = submitList(s, draftRef.current);
    setState(next);
    servicesRef.current.playSound(CL_SOUNDS.stop);
    persist(next, [], 0);
    if (next.phase === 'review') go('review');
    else go('pass');
  };

  // Timer for the fill stage.
  useEffect(() => {
    if (stage !== 'fill') return;
    let lastTick = -1;
    const id = window.setInterval(() => {
      const nowMs = Date.now();
      setNow(nowMs);
      const left = Math.ceil((deadline - nowMs) / 1000);
      if (left <= 10 && left > 0 && left !== lastTick) {
        lastTick = left;
        servicesRef.current.playSound(CL_SOUNDS.tick);
      }
      if (nowMs >= deadline) {
        window.clearInterval(id);
        servicesRef.current.playSound(CL_SOUNDS.buzzer);
        handIn();
      }
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, deadline]);

  // Save the draft as it is typed (so a reload resumes with the same time left).
  useEffect(() => {
    if (stage !== 'fill' || mode !== 'play' || !state) return;
    const id = window.setTimeout(
      () => persist(state, draft, Math.max(0, deadline - Date.now())),
      400,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Watch the AI fill its list, one answer at a time.
  useEffect(() => {
    if (mode !== 'watch' || stage !== 'fill' || !state) return;
    const rng = new Rng(state.seed + state.rounds.length * 101);
    let i = 0;
    const id = window.setInterval(() => {
      const s = stateRef.current!;
      if (i >= currentRound(s).categories.length) {
        window.clearInterval(id);
        window.setTimeout(handIn, 600);
        return;
      }
      const a = pickAnswer({ ...s, cursor: i }, rng, true);
      const idx = i;
      setDraft((d) => d.map((x, j) => (j === idx ? (a === 'skip' ? '' : a.slice(2)) : x)));
      i++;
    }, 650);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stage, state?.rounds.length]);

  const finishRound = () => {
    const s = stateRef.current!;
    const next = confirmRound(s);
    setState(next);
    if (next.phase === 'done') {
      const svc = servicesRef.current;
      svc.playSound(CL_SOUNDS.win);
      persist(null, [], 0);
      if (mode === 'play') {
        const w = winners(next);
        const humans = humanIndexes(next);
        const humanWon = w.some((i) => humans.includes(i));
        svc.recordResult({
          outcome: next.settings.bots > 0 ? (humanWon ? 'win' : 'loss') : 'complete',
          score: next.totals[0]!,
          mode: next.settings.bots > 0 ? `bots:${next.settings.skill}` : 'local',
        });
        onFinish(next, (id) => svc.unlockAchievement(id));
      }
      return;
    }
    persist(next, [], next.settings.seconds * 1000);
    roll(next, mode);
  };

  // Watch mode moves on from the review by itself.
  useEffect(() => {
    if (mode !== 'watch' || stage !== 'review' || state?.phase !== 'review') return;
    const id = window.setTimeout(finishRound, 4000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stage, state?.phase, state?.rounds.length]);

  const toMenu = () => {
    setMode('menu');
    setState(null);
  };

  // ---------------------------------------------------------------- menu
  if (mode === 'menu' || !state) {
    const set = (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      void slot.save({
        state: resume?.state ?? null,
        draft: resume?.draft ?? [],
        remainingMs: resume?.remainingMs ?? 0,
        settings: next,
        names,
      });
    };
    const seg = <T extends string | number>(
      key: keyof Settings,
      values: readonly T[],
      label: (v: T) => string,
    ) => (
      <div className={shared.segmented}>
        {values.map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={settings[key] === v}
            onClick={() => set({ [key]: v } as Partial<Settings>)}
            data-testid={`cl-${String(key)}-${String(v)}`}
          >
            {label(v)}
          </button>
        ))}
      </div>
    );
    const stats = services.getStats();
    return (
      <div className={shared.menu} data-testid="cl-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume?.state && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              data-testid="cl-resume"
              onClick={() => {
                const s = resume.state!;
                setState(s);
                setMode('play');
                setResume(null);
                if (s.phase === 'review') go('review');
                else if (resume.remainingMs > 0) {
                  beginFill(s, resume.remainingMs);
                  if (resume.draft.length) setDraft(resume.draft);
                } else afterRoll(s, 'play');
              }}
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', {
                    round: resume.state.rounds.length,
                    rounds: resume.state.settings.rounds,
                    letter: currentRound(resume.state).letter,
                  })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.lang')}</legend>
            {seg('lang', ['en', 'es'] as const, (v) => t(`lang.${v}`))}
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.list')}</legend>
            {seg('size', LIST_SIZES, (v) => t('menu.categories', { n: v }))}
            {seg(
              'seconds',
              TIMERS,
              (v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`,
            )}
            {seg('rounds', ROUND_COUNTS, (v) => t('menu.rounds', { n: v }))}
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.table')}</legend>
            {seg(
              'bots',
              Array.from({ length: MAX_BOTS + 1 }, (_, i) => i),
              (v) => t('menu.bots', { n: v }),
            )}
            {seg('skill', ['easy', 'normal', 'hard'] as Skill[], (v) => t(`skill.${v}`))}
            {seg(
              'humans',
              Array.from({ length: MAX_HUMANS }, (_, i) => i + 1),
              (v) => t('menu.humans', { n: v }),
            )}
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
                      const next = Array.from({ length: MAX_HUMANS }, (_, j) => names[j] ?? '');
                      next[i] = e.target.value;
                      setNames(next);
                    }}
                  />
                ))}
              </div>
            )}
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.alliteration}
                onChange={(e) => set({ alliteration: e.target.checked })}
                data-testid="cl-alliteration"
              />
              {t('menu.alliteration')}
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.allLetters}
                onChange={(e) => set({ allLetters: e.target.checked })}
                data-testid="cl-all-letters"
              />
              {t('menu.allLetters')}
            </label>
            <p className={shared.hintText}>
              {stats?.played
                ? t('menu.record', {
                    wins: stats.wins,
                    played: stats.played,
                    best: stats.bestScore ?? 0,
                  })
                : t('menu.unplayed')}
            </p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start('play')}
              data-testid="cl-start"
            >
              {settings.humans > 1 ? <Users size={16} /> : <Play size={16} />} {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start('watch')}
              data-testid="cl-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- game
  const s = state;
  const round = currentRound(s);
  const humans = humanIndexes(s);
  const playerName = (i: number) => s.players[i]!.name;
  const remaining = Math.max(0, deadline - now);
  const header = (
    <div className={styles.header}>
      <div
        className={styles.die}
        aria-label={t('play.letter', { letter: rolling || round.letter })}
        data-testid="cl-letter"
        data-rolling={stage === 'roll'}
      >
        {stage === 'roll' ? rolling || '?' : round.letter}
      </div>
      <div className={styles.headInfo}>
        <span>{t('play.round', { n: s.rounds.length, of: s.settings.rounds })}</span>
        {stage === 'fill' && (
          <span
            className={styles.clock}
            data-low={remaining < 10_000}
            data-testid="cl-clock"
            role="timer"
          >
            {Math.floor(Math.ceil(remaining / 1000) / 60)}:
            {String(Math.ceil(remaining / 1000) % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <ol className={styles.totals} data-testid="cl-totals">
        {s.players.map((p, i) => (
          <li key={i}>
            <span>{p.bot ? `🤖 ${p.name}` : p.name}</span>
            <strong>{s.totals[i]}</strong>
          </li>
        ))}
      </ol>
    </div>
  );

  if (s.phase === 'done') {
    const w = winners(s);
    const order = s.players.map((_, i) => i).sort((a, b) => s.totals[b]! - s.totals[a]!);
    return (
      <div className={styles.wrap} data-testid="cl-done">
        <div className={styles.card}>
          <h2>{t('end.title')}</h2>
          <p className={styles.big} data-testid="cl-winner">
            {w.length > 1
              ? t('end.tie', { names: w.map(playerName).join(' & ') })
              : t('end.winner', { name: playerName(w[0]!) })}
          </p>
          <ol className={styles.ranking}>
            {order.map((i) => (
              <li key={i}>
                <span>{s.players[i]!.bot ? `🤖 ${playerName(i)}` : playerName(i)}</span>
                <span className="muted">
                  {s.rounds.map((_, r) => roundPoints(s, r)[i]).join(' + ')}
                </span>
                <strong>{s.totals[i]}</strong>
              </li>
            ))}
          </ol>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(mode === 'watch' ? 'watch' : 'play')}
              data-testid="cl-again"
            >
              <Dices size={16} /> {t('end.again')}
            </button>
            <button type="button" className="btn" onClick={toMenu} data-testid="cl-menu-btn">
              {t('controls.menu')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'roll' || stage === 'pass') {
    const who = humans[s.filler] ?? 0;
    return (
      <div className={styles.wrap}>
        {header}
        {stage === 'pass' && (
          <div className={styles.card} data-testid="cl-pass">
            <h2>{t('play.turn', { name: playerName(who) })}</h2>
            <p className="muted">{t('play.pass', { name: playerName(who) })}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => beginFill(s)}
              data-testid="cl-ready"
            >
              {t('play.ready')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'fill') {
    const who = humans[s.filler] ?? 0;
    return (
      <div className={styles.wrap} data-testid="cl-fill">
        {header}
        <p className={styles.turn}>
          {humans.length > 1
            ? t('play.turn', { name: playerName(who) })
            : t('play.instructions', { letter: round.letter })}
        </p>
        <ol className={styles.list}>
          {round.categories.map((id, i) => {
            const value = draft[i] ?? '';
            const wrong = value.trim() !== '' && keyLetter(value) !== round.letter;
            return (
              <li key={id} className={styles.item}>
                <label htmlFor={`cl-in-${i}`}>
                  <span className={styles.num}>{i + 1}.</span>{' '}
                  {categoryById(id).name[s.settings.lang]}
                </label>
                <input
                  id={`cl-in-${i}`}
                  className={`input ${wrong ? styles.wrong : ''}`}
                  value={value}
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  readOnly={mode === 'watch'}
                  placeholder={`${round.letter}…`}
                  onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById(`cl-in-${i + 1}`)?.focus();
                    }
                  }}
                  data-testid={`cl-input-${i}`}
                />
              </li>
            );
          })}
        </ol>
        <div className={shared.controls}>
          {mode === 'play' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handIn}
              data-testid="cl-done-btn"
            >
              {t('play.done')}
            </button>
          )}
          <button type="button" className="btn" onClick={toMenu} data-testid="cl-menu-btn">
            {t('controls.menu')}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- review
  const scored = scoreRound(s);
  const pts = roundPoints(s);
  const chip = (v: Verdict) => t(`verdict.${v}`);
  return (
    <div className={styles.wrap} data-testid="cl-review">
      {header}
      <p className={styles.turn}>{t('review.help')}</p>
      <ol className={styles.reviewList}>
        {round.categories.map((id, c) => (
          <li key={id} className={styles.card}>
            <h3>
              {c + 1}. {categoryById(id).name[s.settings.lang]}
            </h3>
            <ul className={styles.answers}>
              {s.players.map((p, i) => {
                const answer = round.answers[i]![c]!;
                const sc = scored[i]![c]!;
                const unknown = sc.verdict === 'accepted' || sc.verdict === 'rejected';
                const canVote = unknown && mode === 'play' && humansCanVote(s, i);
                return (
                  <li key={i} data-verdict={sc.verdict} data-testid={`cl-answer-${i}-${c}`}>
                    <span className={styles.who}>{p.bot ? `🤖 ${p.name}` : p.name}</span>
                    <span className={styles.answer}>{answer || '—'}</span>
                    <span className={styles.chip} data-verdict={sc.verdict}>
                      {chip(sc.verdict)}
                    </span>
                    {canVote && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          const next = setVote(s, i, c, sc.verdict !== 'accepted');
                          setState(next);
                          persist(next, [], 0);
                        }}
                        data-testid={`cl-vote-${i}-${c}`}
                      >
                        {sc.verdict === 'accepted' ? t('review.reject') : t('review.accept')}
                      </button>
                    )}
                    <strong>{sc.points}</strong>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <div className={styles.card}>
        <p>{s.players.map((p, i) => `${p.name} +${pts[i]}`).join(' · ')}</p>
        <div className={shared.menuActions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={finishRound}
            data-testid="cl-next-round"
          >
            {s.rounds.length >= s.settings.rounds ? t('review.finish') : t('review.next')}
          </button>
          <button type="button" className="btn" onClick={toMenu}>
            {t('controls.menu')}
          </button>
        </div>
      </div>
    </div>
  );
}
