/**
 * The quiz table shared by #204 Quiz Arcade and #205 World Quiz: a menu of quizzes grouped by
 * category with personal bests and a quiz of the day, then the quiz itself — countdown, score,
 * give up — in its format (type-in list or hint table, slideshow, click grid, pick-all, map), and a
 * results panel that reveals what was missed. "Watch the AI" lets an agent take the quiz.
 */
import { Bot, CalendarDays, Flag, Play, RotateCcw, SkipForward } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Rng, randomSeed } from '../../../core/game-engine/random';
import { useLatest } from '../../../core/game-engine/hooks';
import type { GameServices } from '../../../core/game-engine/types';
import { createTranslator, pickText, type Dictionary, type Locale } from '../../../core/i18n';
import shared from '../sudoku/SudokuGame.module.css';
import type { CountryTone } from '../world/WorldMap';
import { flagUrl } from '../world/world';
import {
  MAX_STRIKES,
  click,
  clickCountry,
  currentItem,
  foundCount,
  giveUp,
  isValidAttempt,
  newAttempt,
  percent,
  sequential,
  skip,
  targets,
  tick,
  total,
  typeAnswer,
  type Lang,
  type Quiz,
  type QuizState,
} from './engine';
import { QUIZ_STRINGS } from './i18n';
import styles from './QuizGame.module.css';
import { QUIZ_SOUNDS } from './sounds';

const WorldMap = lazy(() => import('../world/WorldMap').then((m) => ({ default: m.WorldMap })));

export interface QuizGameDef {
  quizzes: readonly Quiz[];
  strings: Record<Locale, Dictionary>;
  categories: Record<string, { en: string; es: string }>;
  onFinish: (
    q: Quiz,
    s: QuizState,
    unlock: (id: string) => void,
    bests: Record<string, number>,
  ) => void;
}

interface Saved {
  attempt: QuizState | null;
  bests: Record<string, number>;
}

const todayKey = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export const formatClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Polygon({ sides }: { sides: number }) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    return `${50 + 42 * Math.cos(a)},${52 + 42 * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className={styles.picture} aria-hidden="true">
      <polygon points={pts} className={styles.polygon} />
    </svg>
  );
}

function FlagImage({ iso2 }: { iso2: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void flagUrl(iso2).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [iso2]);
  return url ? (
    <img src={url} alt="" className={styles.flag} data-testid="qz-flag" />
  ) : (
    <div className={styles.flag} />
  );
}

export function QuizGame({ def, services }: { def: QuizGameDef; services: GameServices }) {
  const { locale } = services;
  const t = useMemo(
    () =>
      createTranslator(
        {
          en: { ...QUIZ_STRINGS.en, ...def.strings.en },
          es: { ...QUIZ_STRINGS.es, ...def.strings.es },
        },
        locale,
      ),
    [locale, def.strings],
  );
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          typeof (d as Saved).bests === 'object' &&
          ((d as Saved).attempt === null ||
            def.quizzes.some((q) => isValidAttempt((d as Saved).attempt, q))),
      }),
    [services, def.quizzes],
  );
  const byId = useMemo(() => new Map(def.quizzes.map((q) => [q.id, q])), [def.quizzes]);
  const asked = services.launchParams.quiz;
  const [mode, setMode] = useState<'menu' | 'play' | 'watch'>(
    services.launchParams.mode === 'watch' ? 'watch' : 'menu',
  );
  const [lang, setLang] = useState<Lang>(locale === 'es' ? 'es' : 'en');
  const [saved, setSaved] = useState<Saved>({ attempt: null, bests: {} });
  const [state, setStateRaw] = useState<QuizState | null>(null);
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState<{ index: number; ok: boolean } | null>(null);
  const [mapWrong, setMapWrong] = useState<string | null>(null);
  const stateRef = useRef<QuizState | null>(null);
  const savedRef = useLatest(saved);
  const inputRef = useRef<HTMLInputElement>(null);
  const setState = (s: QuizState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => alive && d && setSaved(d));
    return () => {
      alive = false;
    };
  }, [slot]);

  const quiz = state ? byId.get(state.quizId)! : null;

  const persist = (patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    setSaved(next);
    void slot.save(next);
  };

  const begin = (q: Quiz, m: 'play' | 'watch', resume?: QuizState) => {
    const s = resume ?? newAttempt(q, lang, randomSeed() >>> 0);
    setState(s);
    setMode(m);
    setTyped('');
    setFlash(null);
    if (m === 'play') persist({ attempt: s });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const dailyQuiz = def.quizzes[new Rng(todayKey()).int(def.quizzes.length)]!;

  useEffect(() => {
    if (mode === 'watch' && !state) {
      const q = (asked && byId.get(asked)) || dailyQuiz;
      const id = window.setTimeout(() => begin(q, 'watch'), 0);
      return () => window.clearTimeout(id);
    }
    if (mode === 'menu' && asked && byId.get(asked) && !state) {
      const id = window.setTimeout(() => begin(byId.get(asked)!, 'play'), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const finish = (q: Quiz, s: QuizState) => {
    const svc = servicesRef.current;
    svc.playSound(s.status === 'won' ? QUIZ_SOUNDS.win : QUIZ_SOUNDS.end);
    if (mode !== 'play') return;
    const pct = percent(q, s);
    const bests = {
      ...savedRef.current.bests,
      [q.id]: Math.max(savedRef.current.bests[q.id] ?? 0, pct),
    };
    persist({ attempt: null, bests });
    svc.recordResult({
      outcome: s.status === 'won' ? 'complete' : 'loss',
      score: pct,
      timeMs: s.elapsedMs,
      mode: q.id,
    });
    def.onFinish(q, s, (id) => svc.unlockAchievement(id), bests);
  };

  const apply = (next: QuizState) => {
    const q = byId.get(next.quizId)!;
    const before = stateRef.current;
    setState(next);
    if (before?.status === 'playing' && next.status !== 'playing') finish(q, next);
    else if (mode === 'play') persist({ attempt: next });
  };

  // Countdown.
  useEffect(() => {
    if (!state || state.status !== 'playing') return;
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (!s || s.status !== 'playing') return;
      apply(tick(byId.get(s.quizId)!, s, 250));
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status, state?.quizId]);

  const onType = (text: string) => {
    const s = stateRef.current;
    if (!s || !quiz) return;
    const { state: next, hit } = typeAnswer(quiz, s, text);
    if (hit !== null) {
      servicesRef.current.playSound(QUIZ_SOUNDS.hit);
      setTyped('');
      apply(next);
    } else setTyped(text);
  };

  const onClick = (index: number) => {
    const s = stateRef.current;
    if (!s || !quiz) return;
    const { state: next, correct } = click(quiz, s, index);
    servicesRef.current.playSound(correct ? QUIZ_SOUNDS.hit : QUIZ_SOUNDS.miss);
    setFlash({ index, ok: correct });
    window.setTimeout(() => setFlash(null), 350);
    apply(next);
  };

  const onMap = (iso2: string) => {
    const s = stateRef.current;
    if (!s || !quiz) return;
    const { state: next, correct } = clickCountry(quiz, s, iso2);
    servicesRef.current.playSound(correct ? QUIZ_SOUNDS.hit : QUIZ_SOUNDS.miss);
    if (!correct) {
      setMapWrong(iso2);
      window.setTimeout(() => setMapWrong(null), 500);
    }
    apply(next);
  };

  // Watch the AI: it "knows" ~85% of answers and gives them one by one.
  useEffect(() => {
    if (mode !== 'watch' || !state || state.status !== 'playing' || !quiz) return;
    const rng = new Rng(state.seed);
    const id = window.setInterval(() => {
      const s = stateRef.current!;
      if (s.status !== 'playing') return;
      if (quiz.format === 'pick') {
        const open = quiz.items.flatMap((it, i) =>
          !s.found[i] && (it.correct !== false || rng.chance(0.05)) ? [i] : [],
        );
        if (open.length) onClick(rng.pick(open));
        return;
      }
      const cur = currentItem(quiz, s);
      if (sequential(quiz)) {
        if (cur === null) return;
        if (!rng.chance(0.85)) {
          apply(skip(quiz, s));
          return;
        }
        if (quiz.format === 'map-click') onMap(quiz.items[cur]!.iso2!);
        else if (quiz.format === 'click') onClick(cur);
        else onType(quiz.items[cur]!.display[s.lang]);
        return;
      }
      const open = targets(quiz).filter((i) => !s.found[i]);
      if (!open.length) return;
      const pick = rng.pick(open);
      if (rng.chance(0.85)) onType(quiz.items[pick]!.display[s.lang]);
    }, 700);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state?.status, state?.quizId]);

  const toMenu = () => {
    setState(null);
    setMode('menu');
  };

  // ---------------------------------------------------------------- menu
  if (mode === 'menu' || !state || !quiz) {
    const groups = new Map<string, Quiz[]>();
    for (const q of def.quizzes) groups.set(q.category, [...(groups.get(q.category) ?? []), q]);
    const resume = saved.attempt && saved.attempt.status === 'playing' ? saved.attempt : null;
    return (
      <div className={styles.menu} data-testid="qz-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && byId.get(resume.quizId) && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => begin(byId.get(resume.quizId)!, 'play', resume)}
              data-testid="qz-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>{pickText(byId.get(resume.quizId)!.title, locale)}</small>
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
                  data-testid={`qz-lang-${l}`}
                >
                  {l === 'en' ? 'English' : 'Español'}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => begin(dailyQuiz, 'play')}
              data-testid="qz-daily"
            >
              <CalendarDays size={16} />{' '}
              {t('menu.daily', { title: pickText(dailyQuiz.title, locale) })}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => begin(dailyQuiz, 'watch')}
              data-testid="qz-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
        {[...groups].map(([cat, qs]) => (
          <section key={cat} className={styles.group}>
            <h3>{pickText(def.categories[cat] ?? { en: cat, es: cat }, locale)}</h3>
            <div className={styles.cards}>
              {qs.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={styles.quizCard}
                  onClick={() => begin(q, 'play')}
                  data-testid={`qz-start-${q.id}`}
                >
                  <strong>{pickText(q.title, locale)}</strong>
                  <span className="muted">{pickText(q.description, locale)}</span>
                  <span className={styles.meta}>
                    {t(`format.${q.format}`)} · {formatClock(q.seconds * 1000)} · {total(q)}
                    {saved.bests[q.id] !== undefined && (
                      <em data-testid={`qz-best-${q.id}`}>
                        {' '}
                        · {t('menu.best', { pct: saved.bests[q.id]! })}
                      </em>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------- quiz
  const s = state;
  const q = quiz;
  const over = s.status !== 'playing';
  const cur = currentItem(q, s);
  const shown = (i: number) => q.items[i]!.display[s.lang];
  const remaining = q.seconds * 1000 - s.elapsedMs;
  const cellState = (i: number) => (s.found[i] ? 'found' : over ? 'missed' : 'open');

  let body: React.ReactNode;
  const input = (
    <input
      ref={inputRef}
      className={`input ${styles.answer}`}
      value={typed}
      onChange={(e) => onType(e.target.value)}
      placeholder={t('play.type')}
      disabled={over || mode === 'watch'}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-label={t('play.type')}
      data-testid="qz-input"
    />
  );

  if (q.format === 'type') {
    body = (
      <>
        {input}
        {q.columns ? (
          <table className={styles.table} data-testid="qz-table">
            <thead>
              <tr>
                <th>{pickText(q.columns.hint, s.lang)}</th>
                <th>{pickText(q.columns.answer, s.lang)}</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((it, i) => (
                <tr key={i} data-state={cellState(i)}>
                  <td>{it.hint ? pickText(it.hint, s.lang) : ''}</td>
                  <td data-testid={`qz-cell-${i}`}>{s.found[i] || over ? shown(i) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul className={styles.blanks} data-testid="qz-table">
            {q.items.map((_, i) => (
              <li key={i} data-state={cellState(i)} data-testid={`qz-cell-${i}`}>
                {s.found[i] || over ? shown(i) : ''}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  } else if (q.format === 'map-type' || q.format === 'map-click') {
    const tones: Record<string, CountryTone> = {};
    q.items.forEach((it, i) => {
      if (!it.iso2) return;
      if (s.found[i]) tones[it.iso2] = 'found';
      else if (over) tones[it.iso2] = 'missed';
    });
    if (mapWrong) tones[mapWrong] = 'wrong';
    body = (
      <>
        {q.format === 'map-type' ? (
          input
        ) : (
          <p className={styles.prompt} data-testid="qz-prompt">
            {cur !== null ? t('play.clickCountry', { name: shown(cur) }) : ''}
          </p>
        )}
        <Suspense fallback={<div className={styles.mapLoading}>…</div>}>
          <WorldMap
            region={q.region}
            tones={tones}
            onPick={q.format === 'map-click' && !over && mode === 'play' ? onMap : undefined}
            label={pickText(q.title, s.lang)}
            testId="qz-map"
          />
        </Suspense>
        {q.format === 'map-type' && over && (
          <p className="muted" data-testid="qz-missed">
            {t('play.missed')}:{' '}
            {q.items.flatMap((_, i) => (s.found[i] ? [] : [shown(i)])).join(', ')}
          </p>
        )}
      </>
    );
  } else if (q.format === 'slideshow') {
    const it = cur !== null ? q.items[cur]! : null;
    body = (
      <div className={styles.slide}>
        {it?.picture?.kind === 'flag' && <FlagImage iso2={it.picture.iso2} />}
        {it?.picture?.kind === 'polygon' && <Polygon sides={it.picture.sides} />}
        {it?.hint && (
          <p className={styles.bigHint} data-testid="qz-prompt">
            {pickText(it.hint, s.lang)}
          </p>
        )}
        {!over && (
          <div className={styles.row}>
            {input}
            <button
              type="button"
              className="btn"
              onClick={() => apply(skip(q, s))}
              disabled={mode === 'watch'}
              data-testid="qz-skip"
            >
              <SkipForward size={16} /> {t('play.skip')}
            </button>
          </div>
        )}
        {over && (
          <ul className={styles.blanks}>
            {targets(q).map((i) => (
              <li key={i} data-state={cellState(i)}>
                {q.items[i]!.hint ? `${pickText(q.items[i]!.hint!, s.lang)} → ` : ''}
                {shown(i)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } else {
    // click / pick: a grid of tiles in a fixed shuffled order.
    const tiles = new Rng(s.seed ^ 0x5eed).shuffle(q.items.map((_, i) => i));
    body = (
      <>
        {q.format === 'click' ? (
          <p className={styles.prompt} data-testid="qz-prompt">
            {cur !== null && q.items[cur]!.hint ? pickText(q.items[cur]!.hint!, s.lang) : ''}
          </p>
        ) : (
          <p className={styles.prompt}>{t('play.strikes', { n: s.wrong, max: MAX_STRIKES })}</p>
        )}
        <div className={styles.tiles} data-testid="qz-tiles">
          {tiles.map((i) => {
            const it = q.items[i]!;
            const st = s.found[i]
              ? 'found'
              : over && (q.format === 'click' || it.correct !== false)
                ? 'missed'
                : flash?.index === i
                  ? flash.ok
                    ? 'found'
                    : 'wrong'
                  : 'open';
            return (
              <button
                key={i}
                type="button"
                className={styles.tile}
                data-state={st}
                disabled={over || s.found[i] || mode === 'watch'}
                onClick={() => onClick(i)}
                data-testid={`qz-tile-${i}`}
              >
                {shown(i)}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div className={styles.play} data-testid="qz-play">
      <div className={styles.header}>
        <h2>{pickText(q.title, s.lang)}</h2>
        <div className={styles.stats}>
          <span data-testid="qz-score">
            {foundCount(q, s)}/{total(q)}
          </span>
          <span className={styles.clock} data-low={remaining < 10_000} data-testid="qz-clock">
            {formatClock(remaining)}
          </span>
          {!over && mode === 'play' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => apply(giveUp(s))}
              data-testid="qz-giveup"
            >
              <Flag size={16} /> {t('play.giveUp')}
            </button>
          )}
        </div>
      </div>
      <p className="muted">{pickText(q.description, s.lang)}</p>
      {over && (
        <div className={styles.result} data-testid="qz-result" data-status={s.status}>
          <strong>
            {s.status === 'won'
              ? t('end.won')
              : s.status === 'timeout'
                ? t('end.timeout')
                : t('end.gaveUp')}
          </strong>{' '}
          {t('end.summary', {
            found: foundCount(q, s),
            total: total(q),
            pct: percent(q, s),
            time: formatClock(s.elapsedMs),
            wrong: s.wrong,
          })}
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => begin(q, mode === 'watch' ? 'watch' : 'play')}
              data-testid="qz-again"
            >
              <Play size={16} /> {t('end.again')}
            </button>
            <button type="button" className="btn" onClick={toMenu} data-testid="qz-menu-btn">
              {t('end.menu')}
            </button>
          </div>
        </div>
      )}
      {body}
      {!over && (
        <div className={shared.controls}>
          <button type="button" className="btn" onClick={toMenu} data-testid="qz-menu-btn">
            {t('end.menu')}
          </button>
        </div>
      )}
    </div>
  );
}
