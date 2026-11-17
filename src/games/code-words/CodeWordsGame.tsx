/**
 * The Code Words table: a menu (your role — operative or spymaster — and the rival spymaster's
 * skill, watch the AI), the 5×5 board of code words (the key shown to the spymaster), the current
 * clue and guesses left, the clue form for a human spymaster, the log, and the result.
 * Your team is red; bots play every other seat with the shared word vectors.
 */
import { Bot, Eye, Play, Send, SkipForward } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { randomSeed } from '../../core/game-engine/random';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { loadVectors, type Vectors } from '../shared/semantic/semantic';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { SKILLS, operativeGuess, spymasterClue } from './bots';
import styles from './CodeWords.module.css';
import {
  clueProblem,
  giveClue,
  guess,
  isValidState,
  newGame,
  pass,
  remaining,
  type CodeState,
} from './engine';
import { STRINGS } from './i18n';
import { CODE_SOUNDS } from './sounds';

type Role = 'operative' | 'spymaster' | 'watch';
type Skill = keyof typeof SKILLS;

interface Saved {
  role: Role;
  skill: Skill;
  state: CodeState | null;
}

export function CodeWordsGame({
  services,
  onFinish,
}: {
  services: GameServices;
  onFinish: (s: CodeState, role: Role, unlock: (id: string) => void) => void;
}) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const slot = useMemo(
    () =>
      services.saveSlot<Saved>({
        schema: 1,
        validate: (d: unknown): d is Saved =>
          typeof d === 'object' &&
          d !== null &&
          ((d as Saved).state === null || isValidState((d as Saved).state)),
      }),
    [services],
  );
  const [vectors, setVectors] = useState<Vectors | null>(null);
  const [role, setRole] = useState<Role>(
    services.launchParams.mode === 'watch' ? 'watch' : 'operative',
  );
  const [skill, setSkill] = useState<Skill>('normal');
  const [state, setStateRaw] = useState<CodeState | null>(null);
  const [resume, setResume] = useState<CodeState | null>(null);
  const [clueWord, setClueWord] = useState('');
  const [clueNumber, setClueNumber] = useState(1);
  const [problem, setProblem] = useState('');
  const stateRef = useRef<CodeState | null>(null);
  const setState = (s: CodeState | null) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  useEffect(() => {
    let alive = true;
    void loadVectors().then((v) => alive && setVectors(v));
    void slot.load().then((d) => {
      if (!alive || !d) return;
      setRole(services.launchParams.mode === 'watch' ? 'watch' : d.role);
      setSkill(d.skill);
      if (d.state?.status === 'playing') setResume(d.state);
    });
    return () => {
      alive = false;
    };
  }, [slot, services.launchParams.mode]);

  const save = (s: CodeState | null) =>
    void slot.save({ role, skill, state: s && s.status === 'playing' ? s : null });

  const apply = (next: CodeState) => {
    const before = stateRef.current;
    setState(next);
    if (role !== 'watch') save(next);
    const svc = servicesRef.current;
    if (before && next.log.length > before.log.length) {
      const last = next.log.at(-1)!;
      if (last.kind === 'guess') {
        const r = next.roles[last.index]!;
        svc.playSound(
          r === 'assassin'
            ? CODE_SOUNDS.assassin
            : r === last.team
              ? CODE_SOUNDS.agent
              : CODE_SOUNDS.miss,
        );
      } else if (last.kind === 'clue') svc.playSound(CODE_SOUNDS.clue);
    }
    if (before?.status === 'playing' && next.status === 'over') {
      svc.playSound(next.winner === 'red' ? CODE_SOUNDS.win : CODE_SOUNDS.lose);
      if (role !== 'watch') {
        svc.recordResult({
          outcome: next.winner === 'red' ? 'win' : 'loss',
          mode: `${role}:${skill}`,
        });
        onFinish(next, role, (id) => svc.unlockAchievement(id));
      }
    }
  };

  const start = (r: Role, resumeState?: CodeState) => {
    setRole(r);
    setProblem('');
    setClueWord('');
    const s = resumeState ?? newGame(randomSeed() >>> 0);
    setState(s);
    void slot.save({ role: r, skill, state: r === 'watch' ? null : s });
  };

  useEffect(() => {
    if (role === 'watch' && !state && vectors && services.launchParams.mode === 'watch') {
      const id = window.setTimeout(() => start('watch'), 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vectors]);

  // Bot seats: spymasters' clues and operatives' touches, one step at a time.
  useEffect(() => {
    const s = state;
    if (!s || !vectors || s.status !== 'playing') return;
    const humanSpymaster = role === 'spymaster' && s.turn === 'red' && s.phase === 'clue';
    const humanOperative = role === 'operative' && s.turn === 'red' && s.phase === 'guess';
    if (humanSpymaster || humanOperative) return;
    const id = window.setTimeout(
      () => {
        const cur = stateRef.current!;
        if (cur.phase === 'clue') {
          const lvl: Skill = cur.turn === 'red' ? 'normal' : skill;
          const c = spymasterClue(vectors, cur, cur.turn, SKILLS[lvl]);
          apply(giveClue(cur, c.word, c.number));
        } else {
          const g = operativeGuess(
            vectors,
            cur,
            cur.turn === 'red' ? 0.2 : skill === 'hard' ? 0.24 : skill === 'easy' ? 0.16 : 0.2,
          );
          apply(g === null ? pass(cur) : guess(cur, g));
        }
      },
      s.phase === 'clue' ? 1300 : 1000,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, vectors]);

  const sendClue = (e: FormEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s || !vectors) return;
    const p = clueProblem(s, clueWord, clueNumber, (w) => vectors.index.has(w));
    if (p) {
      setProblem(t(p === 'number' ? 'clue.bad-number' : `clue.${p}`));
      return;
    }
    setProblem('');
    setClueWord('');
    apply(giveClue(s, clueWord, clueNumber));
  };

  if (!vectors)
    return (
      <p className="muted" data-testid="cw-loading">
        {t('loading')}
      </p>
    );

  // ---------------------------------------------------------------- menu
  if (!state) {
    return (
      <div className={shared.menu} data-testid="cw-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {resume && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(role === 'watch' ? 'operative' : role, resume)}
              data-testid="cw-resume"
            >
              <Play size={16} /> <span>{t('menu.resume')}</span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.role')}</legend>
            <div className={shared.segmented}>
              {(['operative', 'spymaster'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  data-testid={`cw-role-${r}`}
                >
                  {t(`role.${r}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>
              {t(`role.${role === 'watch' ? 'operative' : role}.hint`)}
            </p>
          </fieldset>
          <fieldset className={shared.group}>
            <legend>{t('menu.rival')}</legend>
            <div className={shared.segmented}>
              {(['easy', 'normal', 'hard'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={skill === k}
                  onClick={() => setSkill(k)}
                  data-testid={`cw-skill-${k}`}
                >
                  {t(`skill.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <p className={shared.hintText}>{t('menu.english')}</p>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(role === 'watch' ? 'operative' : role)}
              data-testid="cw-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => start('watch')}
              data-testid="cw-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- board
  const s = state;
  const seeKey = role === 'spymaster' || s.status === 'over';
  const myOperativeTurn =
    role === 'operative' && s.turn === 'red' && s.phase === 'guess' && s.status === 'playing';
  const mySpymasterTurn =
    role === 'spymaster' && s.turn === 'red' && s.phase === 'clue' && s.status === 'playing';
  const statusLine =
    s.status === 'over'
      ? t(s.reason === 'assassin' ? 'end.assassin' : 'end.agents', { team: t(`team.${s.winner!}`) })
      : s.phase === 'clue'
        ? t('turn.clue', { team: t(`team.${s.turn}`) })
        : t('turn.guess', { team: t(`team.${s.turn}`), left: s.guessesLeft });

  return (
    <div className={styles.wrap} data-testid="cw-play">
      <div className={styles.bar}>
        <span className={styles.count} data-team="red" data-testid="cw-red">
          {remaining(s, 'red')}
        </span>
        <div className={styles.status} data-testid="cw-status" data-team={s.turn}>
          <span>{statusLine}</span>
          {s.clue && s.status === 'playing' && (
            <strong className={styles.clue} data-testid="cw-clue">
              {s.clue.word.toUpperCase()} · {s.clue.number}
            </strong>
          )}
        </div>
        <span className={styles.count} data-team="blue" data-testid="cw-blue">
          {remaining(s, 'blue')}
        </span>
      </div>
      <div className={styles.grid} role="grid" aria-label={t('board')}>
        {s.words.map((w, i) => {
          const open = s.revealed[i];
          return (
            <button
              key={w}
              type="button"
              className={styles.card}
              data-role={open || seeKey ? s.roles[i] : 'hidden'}
              data-open={open}
              disabled={!myOperativeTurn || open}
              onClick={() => apply(guess(stateRef.current!, i))}
              data-testid={`cw-card-${i}`}
            >
              {w}
            </button>
          );
        })}
      </div>
      {mySpymasterTurn && (
        <form className={styles.clueForm} onSubmit={sendClue} data-testid="cw-clue-form">
          <input
            className="input"
            value={clueWord}
            onChange={(e) => setClueWord(e.target.value)}
            placeholder={t('clue.placeholder')}
            maxLength={20}
            aria-label={t('clue.placeholder')}
            data-testid="cw-clue-word"
          />
          <select
            className="select"
            value={clueNumber}
            onChange={(e) => setClueNumber(Number(e.target.value))}
            aria-label={t('clue.number')}
            data-testid="cw-clue-number"
          >
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" data-testid="cw-clue-send">
            <Send size={16} /> {t('clue.send')}
          </button>
        </form>
      )}
      {problem && (
        <p className={styles.problem} role="alert" data-testid="cw-problem">
          {problem}
        </p>
      )}
      <div className={shared.controls}>
        {myOperativeTurn && s.guessedThisTurn > 0 && (
          <button
            type="button"
            className="btn"
            onClick={() => apply(pass(stateRef.current!))}
            data-testid="cw-pass"
          >
            <SkipForward size={16} /> {t('play.pass')}
          </button>
        )}
        {s.status === 'over' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start(role)}
            data-testid="cw-again"
          >
            <Play size={16} /> {t('end.again')}
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => setState(null)}
          data-testid="cw-menu-btn"
        >
          {t('play.menu')}
        </button>
        {role === 'spymaster' && <Eye size={18} aria-label={t('play.seeKey')} />}
      </div>
      <ol className={styles.log} data-testid="cw-log">
        {s.log
          .filter((e) => e.kind === 'clue')
          .map((e, k) =>
            e.kind === 'clue' ? (
              <li key={k} data-team={e.clue.team}>
                {t(`team.${e.clue.team}`)}: <strong>{e.clue.word}</strong> {e.clue.number}
              </li>
            ) : null,
          )}
      </ol>
    </div>
  );
}
