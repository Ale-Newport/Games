import { useEffect, useMemo, useState } from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { isTypingTarget } from '../../core/input/keyboard';
import {
  answer,
  judge,
  learn,
  newSession,
  ranked,
  undo,
  type Answer,
  type Learned,
  type Session,
} from './engine';
import { STRINGS } from './i18n';
import { DOMAINS, DOMAIN_IDS, type Domain } from './knowledge';
import styles from './MindReader.module.css';
import { Seer } from './Seer';

interface Memory {
  learned: Partial<Record<Domain['id'], Learned>>;
  reader: number;
  you: number;
  taught: number;
}
const isMemory = (d: unknown): d is Memory =>
  typeof d === 'object' &&
  d !== null &&
  typeof (d as Memory).learned === 'object' &&
  typeof (d as Memory).reader === 'number';

const SOUNDS: Record<string, SoundSpec> = {
  ask: [{ wave: 'sine', freq: 520, duration: 0.05, gain: 0.04 }],
  guess: [
    { wave: 'sine', freq: 440, duration: 0.15, gain: 0.07 },
    { wave: 'sine', freq: 660, duration: 0.25, delay: 0.12, gain: 0.07 },
  ],
  won: [
    { wave: 'triangle', freq: 784, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 1047, duration: 0.3, delay: 0.1, gain: 0.12 },
  ],
  lost: [{ wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.4, gain: 0.1 }],
};

const KEYS: Record<string, Answer> = {
  y: 'yes',
  s: 'yes',
  n: 'no',
  d: 'unknown',
  p: 'probably',
  o: 'probably_not',
};
const ICON: Record<Domain['id'], string> = { animals: '🐾', objects: '🧰', characters: '📖' };

export function MindReaderGame({ services }: GameProps) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const slot = useMemo(
    () => services.saveSlot<Memory>({ schema: 1, validate: isMemory }),
    [services],
  );
  const [memory, setMemory] = useState<Memory>({ learned: {}, reader: 0, you: 0, taught: 0 });
  const [session, setSession] = useState<Session | null>(null);
  const [taughtAs, setTaughtAs] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const servicesRef = useLatest(services);
  const sessionRef = useLatest(session);
  const learned = session ? (memory.learned[session.domain] ?? {}) : {};

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => !cancelled && d && setMemory(d));
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const remember = (m: Memory) => {
    setMemory(m);
    void slot.save(m);
  };

  const step = (next: Session) => {
    const prev = sessionRef.current;
    setSession(next);
    const svc = servicesRef.current;
    if (next.phase === 'guessing' && prev?.phase !== 'guessing') svc.playSound(SOUNDS.guess!);
    else if (next.phase === 'asking') svc.playSound(SOUNDS.ask!);
    if (next.phase === 'won' && prev?.phase !== 'won') {
      svc.playSound(SOUNDS.won!);
      svc.recordResult({ outcome: 'loss', score: next.answers.length, mode: next.domain });
      if (next.answers.length <= 10) svc.unlockAchievement('open-book');
      remember({
        ...memory,
        reader: memory.reader + 1,
        learned: {
          ...memory.learned,
          [next.domain]: learn(memory.learned[next.domain] ?? {}, next, next.guess!),
        },
      });
    }
    if (next.phase === 'lost' && prev?.phase !== 'lost') {
      svc.playSound(SOUNDS.lost!);
      svc.recordResult({ outcome: 'win', score: next.answers.length, mode: next.domain });
      svc.unlockAchievement('stumped');
      remember({ ...memory, you: memory.you + 1 });
    }
  };

  const reply = (a: Answer) => {
    const s = sessionRef.current;
    if (s?.phase === 'asking') step(answer(s, a, learned));
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const s = sessionRef.current;
      if (!s) return;
      const k = e.key.toLowerCase();
      if (s.phase === 'asking' && KEYS[k]) {
        e.preventDefault();
        reply(KEYS[k]);
      } else if (s.phase === 'asking' && e.key === 'Backspace') {
        e.preventDefault();
        step(undo(s, learned));
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const start = (d: Domain['id']) => {
    setTaughtAs(null);
    setQuery('');
    step(newSession(d, memory.learned[d] ?? {}));
  };

  if (!session)
    return (
      <div className={styles.wrap} data-testid="mr-menu">
        <div className={styles.seer}>
          <Seer confidence={0} mood="think" />
        </div>
        <div className={styles.panel}>
          <h2>{t('title')}</h2>
          <p>{t('intro')}</p>
          <div className={styles.domains}>
            {DOMAIN_IDS.map((d) => (
              <button
                key={d}
                type="button"
                className={styles.domain}
                onClick={() => start(d)}
                data-testid={`mr-domain-${d}`}
              >
                <span aria-hidden="true">{ICON[d]}</span>
                {t(`domain.${d}`)}
                <small>{t(`domain.${d}.hint`)}</small>
              </button>
            ))}
          </div>
          <p className="muted">{t('record', { r: memory.reader, y: memory.you })}</p>
        </div>
      </div>
    );

  const d = DOMAINS[session.domain];
  const name = (id: string) => {
    const e = d.entities.find((x) => x.id === id)!;
    return `${locale === 'es' ? e.es : e.en}`;
  };
  const top = ranked(session, learned)[0]?.[1] ?? 0;
  const mood =
    session.phase === 'won'
      ? 'happy'
      : session.phase === 'lost'
        ? 'sad'
        : session.phase === 'guessing' || top > 0.6
          ? 'sure'
          : 'think';
  const question = session.question ? d.questions.find((q) => q.id === session.question)! : null;
  const guessed = session.guess ? d.entities.find((e) => e.id === session.guess)! : null;
  const q = query.trim().toLowerCase();

  return (
    <div className={styles.wrap} data-testid="mr-play">
      <div className={styles.seer}>
        <Seer confidence={top} mood={mood} />
      </div>
      <div className={styles.panel}>
        {session.phase === 'asking' && question && (
          <>
            <div className={styles.bubble} data-testid="mr-question" aria-live="polite">
              <small>{t('question', { n: session.answers.length + 1 })}</small>
              {locale === 'es' ? question.es : question.en}
            </div>
            <div className={styles.answers}>
              {(['yes', 'no', 'unknown', 'probably', 'probably_not'] as Answer[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`btn ${a === 'yes' || a === 'no' ? 'btn-primary' : ''}`}
                  onClick={() => reply(a)}
                  data-testid={`mr-a-${a}`}
                >
                  {t(`a.${a}`)}
                </button>
              ))}
            </div>
            <div className={styles.row}>
              <button
                type="button"
                className="btn"
                disabled={!session.answers.length}
                onClick={() => step(undo(session, learned))}
                data-testid="mr-back"
              >
                {t('back')}
              </button>
            </div>
            <div aria-label={t('confidence')}>
              <small className="muted">{t('confidence')}</small>
              <div className={styles.meter}>
                <div style={{ width: `${Math.round(top * 100)}%` }} />
              </div>
            </div>
            <small className="muted">{t('keys')}</small>
          </>
        )}
        {session.phase === 'guessing' && guessed && (
          <>
            <div className={styles.bubble}>{t('think')}</div>
            <div className={styles.guess} data-testid="mr-guess">
              <span aria-hidden="true">{guessed.emoji}</span>
              {name(guessed.id)}
            </div>
            <div className={styles.row}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => step(judge(session, true, learned))}
                data-testid="mr-right"
              >
                {t('right')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => step(judge(session, false, learned))}
                data-testid="mr-wrong"
              >
                {t('wrong')}
              </button>
            </div>
          </>
        )}
        {session.phase === 'won' && (
          <div className={styles.bubble} data-testid="mr-won">
            {t('won', { n: session.answers.length })}
          </div>
        )}
        {session.phase === 'lost' && (
          <>
            <div className={styles.bubble} data-testid="mr-lost">
              {taughtAs ? t('thanks', { e: name(taughtAs) }) : t('lost')}
            </div>
            {!taughtAs && (
              <>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search')}
                  aria-label={t('search')}
                  data-testid="mr-search"
                />
                <div className={styles.pick}>
                  {d.entities
                    .filter(
                      (e) => !q || e.en.toLowerCase().includes(q) || e.es.toLowerCase().includes(q),
                    )
                    .map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className="btn btn-small"
                        onClick={() => {
                          setTaughtAs(e.id);
                          const taught = memory.taught + 1;
                          if (taught >= 5) servicesRef.current.unlockAchievement('teacher');
                          remember({
                            ...memory,
                            taught,
                            learned: {
                              ...memory.learned,
                              [session.domain]: learn(
                                memory.learned[session.domain] ?? {},
                                session,
                                e.id,
                              ),
                            },
                          });
                        }}
                        data-testid={`mr-teach-${e.id}`}
                      >
                        {e.emoji} {locale === 'es' ? e.es : e.en}
                      </button>
                    ))}
                </div>
              </>
            )}
          </>
        )}
        {(session.phase === 'won' || session.phase === 'lost') && (
          <div className={styles.row}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => start(session.domain)}
              data-testid="mr-again"
            >
              {t('again')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setSession(null)}
              data-testid="mr-menu-btn"
            >
              {t('menu')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
