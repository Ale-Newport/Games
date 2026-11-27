/**
 * Closest Call screens: lobby (daily, custom line-up of people and computer contestants, resume,
 * record), the round (scoreboard, question, answers given so far, the answer box or a computer
 * thinking, then the target with everyone's arrows and points) and the final standings.
 */
import {
  BarChart3,
  CalendarDays,
  Copy,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Target as TargetIcon,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { LoadError } from '../../components/LoadError';
import { useAsset } from '../../core/assets/useAsset';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator, type Translator } from '../../core/i18n';
import { parseNumber } from '../order-of-magnitude/OrderOfMagnitudeGame';
import { dailyStreak } from '../shared/daily/daily';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { domain, question, type Bank } from '../rough-guess/engine';
import { formatValue, unitLabel } from '../rough-guess/format';
import styles from './ClosestCall.module.css';
import {
  botGuess,
  currentRound,
  dayNumber,
  guess,
  isGame,
  LEVELS,
  newDaily,
  newGame,
  nextRound,
  ratioOf,
  ringIndex,
  roundMultiplier,
  standings,
  turn,
  winners,
  type Game,
  type Player,
} from './engine';
import { STRINGS } from './i18n';
import { SOUNDS } from './sounds';
import { Target } from './Target';

interface Tally {
  games: number;
  wins: number;
  bulls: number;
  points: number;
}
interface Saved {
  game: Game | null;
  lineup: Player[];
  daily: { [day: string]: number };
  record: Tally;
}
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    (s.game === null || isGame(s.game)) &&
    Array.isArray(s.lineup) &&
    s.lineup.length >= 2 &&
    s.lineup.length <= 4 &&
    typeof s.daily === 'object' &&
    typeof s.record?.games === 'number'
  );
};

const loadBank = () =>
  Promise.all([
    import('../rough-guess/data.json'),
    import('../order-of-magnitude/questions.json'),
  ]).then(([r, m]) => ({ rough: r.default, mag: m.default }) as unknown as Bank);

const seatClass = (i: number) => styles[`seat${i}`];

export function ClosestCallGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const servicesRef = useLatest(services);
  const asset = useAsset(loadBank);
  const bank = asset.value;
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const you = services.profileName || t('you');
  const defaultLineup: Player[] = [
    { name: you, bot: null },
    { name: 'Ada', bot: 'normal' },
    { name: 'Bruno', bot: 'normal' },
  ];
  const [saved, setSaved] = useState<Saved>({
    game: null,
    lineup: defaultLineup,
    daily: {},
    record: { games: 0, wins: 0, bulls: 0, points: 0 },
  });
  const [loaded, setLoaded] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [draft, setDraft] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedRef = useLatest(saved);
  const gameRef = useLatest(game);
  const botRng = useRef(new Rng(randomSeed()));
  const today = dayNumber();

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => {
      if (!alive) return;
      if (d) setSaved(d);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [slot]);

  const persist = (patch: Partial<Saved>) => {
    const n = { ...savedRef.current, ...patch };
    savedRef.current = n;
    setSaved(n);
    void slot.save(n);
  };

  const onSettled = (g: Game) => {
    const r = currentRound(g);
    if (!r.points || !bank) return;
    const q = question(bank, r.key);
    const humans = g.players.map((p, i) => (p.bot ? -1 : i)).filter((i) => i >= 0);
    const svc = servicesRef.current;
    const best = Math.max(...humans.map((i) => r.points![i]!));
    svc.playSound(best >= 8 ? SOUNDS.great! : best > 0 ? SOUNDS.good! : SOUNDS.poor!);
    let bulls = 0;
    for (const i of humans) if (ringIndex(ratioOf(r.guesses[i]!, q.value)) === 0) bulls++;
    if (bulls) svc.unlockAchievement('bullseye');
    let record = { ...savedRef.current.record, bulls: savedRef.current.record.bulls + bulls };
    let daily = savedRef.current.daily;
    if (g.status === 'done') {
      const w = winners(g);
      const humanWon = humans.some((i) => w.includes(i));
      const solo = humans.length === 1;
      const me = humans[0]!;
      svc.recordResult({
        outcome: solo ? (humanWon ? (w.length > 1 ? 'draw' : 'win') : 'loss') : 'complete',
        score: solo ? g.scores[me] : Math.max(...humans.map((i) => g.scores[i]!)),
        mode:
          g.mode === 'daily'
            ? 'daily'
            : solo
              ? `vs:${g.players
                  .filter((p) => p.bot)
                  .map((p) => p.bot)
                  .join('-')}`
              : 'local',
      });
      record = {
        games: record.games + 1,
        wins: record.wins + (solo && humanWon ? 1 : 0),
        bulls: record.bulls,
        points: record.points + (solo ? g.scores[me]! : 0),
      };
      if (solo && humanWon) {
        svc.unlockAchievement('first-win');
        if (g.players.some((p) => p.bot === 'hard')) svc.unlockAchievement('beat-hard');
        if (g.players.length === 4 && w.length === 1) svc.unlockAchievement('full-house');
      }
      if (solo && g.scores[me]! >= 60) svc.unlockAchievement('sharpshooter');
      if (g.mode === 'daily') {
        daily = { ...daily, [g.day]: g.scores[0]! };
        if (dailyStreak(daily, today) >= 7) svc.unlockAchievement('week');
      }
    }
    persist({ game: g, record, daily });
  };

  const apply = (g: Game) => {
    setGame(g);
    if (currentRound(g).points && !currentRound(gameRef.current ?? g).points) onSettled(g);
    else persist({ game: g });
  };

  // Computer contestants answer after a short pause.
  useEffect(() => {
    if (!game || !bank) return;
    const p = turn(game);
    if (p < 0 || !game.players[p]!.bot) return;
    const id = setTimeout(
      () => {
        const g = gameRef.current;
        if (!g || turn(g) !== p) return;
        const v = botGuess(g, bank, g.players[p]!.bot!, botRng.current);
        servicesRef.current.playSound(SOUNDS.thud!);
        apply(guess(g, bank, v));
      },
      services.reducedMotion ? 250 : 900,
    );
    return () => clearTimeout(id);
  });

  if (asset.error) return <LoadError onRetry={asset.retry} />;
  if (!bank || !loaded)
    return (
      <p className={styles.loading} data-testid="cc-loading">
        {t('loading')}
      </p>
    );

  const start = (g: Game) => {
    setDraft(null);
    setTyped('');
    setInvalid(false);
    setCopied(false);
    setGame(g);
    persist({ game: g });
  };
  const seedFor = () =>
    (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;

  if (!game)
    return (
      <Lobby
        t={t}
        saved={saved}
        today={today}
        copied={copied}
        onResume={() => saved.game && start(saved.game)}
        onDaily={() => {
          const g = saved.game;
          if (g && g.mode === 'daily' && g.day === today && g.status === 'playing') return start(g);
          start(newDaily(bank, today, you));
        }}
        onCustom={(lineup) => {
          persist({ lineup });
          start(newGame(bank, lineup, seedFor()));
        }}
        onShare={(text) =>
          void navigator.clipboard?.writeText(text).then(
            () => setCopied(true),
            () => setCopied(false),
          )
        }
      />
    );

  const r = currentRound(game);
  const q = question(bank, r.key);
  const d = domain(bank, q);
  const p = turn(game);
  const settled = r.points !== null;
  // Four significant figures: contestants often answer within 1 % of one another.
  const fmt = (v: number) => formatValue(q, v, locale, t, 4);
  const human = p >= 0 && !game.players[p]!.bot;
  const value = draft ?? Math.pow(10, (d[0] + d[1]) / 2);
  const clampV = (v: number) => Math.min(Math.pow(10, d[1]), Math.max(Math.pow(10, d[0]), v));

  const submit = () => {
    if (!human) return;
    let v = value;
    if (typed.trim()) {
      const parsed = parseNumber(typed, locale);
      const l = parsed === null ? NaN : Math.log10(parsed);
      if (parsed === null || l < d[0] || l > d[1]) {
        setInvalid(true);
        return;
      }
      v = parsed;
    }
    servicesRef.current.playSound(SOUNDS.thud!);
    setDraft(null);
    setTyped('');
    setInvalid(false);
    apply(guess(game, bank, v));
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!human || (e.target as HTMLElement).tagName === 'INPUT') return;
    const f = e.shiftKey ? 1.5 : 1.05;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setDraft(clampV(value * f));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setDraft(clampV(value / f));
    else if (e.key === 'Enter') submit();
    else return;
    e.preventDefault();
  };

  const order = Array.from(
    { length: game.players.length },
    (_, k) => (r.first + k) % game.players.length,
  );
  const ranking = standings(game);

  return (
    <div className={styles.wrap} data-testid="cc-play" onKeyDown={key}>
      <ol className={styles.board} data-testid="cc-board">
        {game.players.map((pl, i) => (
          <li key={i} className={seatClass(i)} data-turn={i === p} data-testid={`cc-seat-${i}`}>
            <span className={styles.dot} />
            <span className={styles.pname}>
              {pl.name}
              {pl.bot && <small> · {t(`level.${pl.bot}`)}</small>}
            </span>
            <b data-testid={`cc-score-${i}`}>{game.scores[i]}</b>
          </li>
        ))}
      </ol>
      <div className={styles.card}>
        <div className={styles.bar}>
          <span data-testid="cc-round">{t('play.round', { n: game.rounds.length })}</span>
          {roundMultiplier(game.rounds.length - 1) > 1 && (
            <span className={styles.double}>{t('play.double')}</span>
          )}
        </div>
        <div className={styles.head}>
          <span className={styles.kind}>{t(`k.${q.kind}`)}</span>
          <h3 className={styles.name} data-testid="cc-subject">
            {q.subject[lang]}
          </h3>
          <p className={styles.question}>{t(`q.${q.kind}`, { year: q.year })}</p>
          <p className={styles.unit}>
            {unitLabel(q, t)}
            {q.year && q.kind !== 'price' ? ` · ${t('year', { year: q.year })}` : ''}
          </p>
        </div>

        <ul className={styles.given} data-testid="cc-given">
          {order.map((i) => {
            const g = r.guesses[i];
            const pts = r.points?.[i];
            return (
              <li key={i} className={seatClass(i)} data-done={g !== null}>
                <span className={styles.dot} />
                <span>{game.players[i]!.name}</span>
                <b data-testid={`cc-guess-${i}`}>{g == null ? (i === p ? '…' : '—') : fmt(g)}</b>
                {pts !== undefined && (
                  <span className={styles.pts} data-testid={`cc-pts-${i}`}>
                    {t('play.points', { n: pts })}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {settled ? (
          <div className={styles.reveal} data-testid="cc-reveal">
            <p className={styles.answer} data-testid="cc-answer">
              {t('play.answerWas', { value: fmt(q.value) })}
            </p>
            <Target
              label={t('target')}
              arrows={game.players.map((pl, i) => ({
                seat: i,
                name: pl.name,
                ratio: ratioOf(r.guesses[i]!, q.value),
                over: r.guesses[i]! > q.value,
              }))}
            />
            <p className={styles.rings}>{t('rings')}</p>
            {game.status === 'done' ? (
              <div className={styles.final} data-testid="cc-final">
                <h3>
                  {winners(game).length > 1
                    ? t('end.tie')
                    : t('end.win', { name: game.players[ranking[0]!]!.name })}
                </h3>
                <ol>
                  {ranking.map((i, k) => (
                    <li key={i} className={seatClass(i)}>
                      <span>{t(`place.${k + 1}`)}</span> {game.players[i]!.name}{' '}
                      <b>{game.scores[i]}</b>
                    </li>
                  ))}
                </ol>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => start(newGame(bank, game.players, seedFor()))}
                    data-testid="cc-again"
                  >
                    <RotateCcw size={16} /> {t('end.again')}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setGame(null);
                      persist({ game: null });
                    }}
                    data-testid="cc-menu"
                  >
                    {t('end.menu')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                autoFocus
                onClick={() => start(nextRound(game, bank))}
                data-testid="cc-next"
              >
                {t('play.next')}
              </button>
            )}
          </div>
        ) : human ? (
          <div className={styles.answerBox} tabIndex={0} data-testid="cc-answer-box">
            <p className={styles.turn} data-testid="cc-turn">
              {t('play.turn', { name: game.players[p]!.name })}
            </p>
            <div className={styles.dial}>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(clampV(value / 1.5))}
                aria-label="÷1.5"
                data-testid="cc-down"
              >
                <Minus size={16} />
              </button>
              <strong data-testid="cc-value">{fmt(value)}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => setDraft(clampV(value * 1.5))}
                aria-label="×1.5"
                data-testid="cc-up"
              >
                <Plus size={16} />
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(((Math.log10(value) - d[0]) / (d[1] - d[0])) * 1000)}
              onChange={(e) =>
                setDraft(Math.pow(10, d[0] + (Number(e.target.value) / 1000) * (d[1] - d[0])))
              }
              aria-label={t('play.answer')}
              className={styles.slider}
              data-testid="cc-slider"
            />
            <label className={styles.typed}>
              <span>{t('play.type')}</span>
              <input
                type="text"
                inputMode="decimal"
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setInvalid(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                }}
                data-testid="cc-typed"
              />
            </label>
            {invalid && (
              <p className={styles.warn} role="alert">
                {t('play.invalid')}
              </p>
            )}
            <p className={styles.keys}>{t('play.keys')}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              data-testid="cc-submit"
            >
              <TargetIcon size={16} /> {t('play.submit')}
            </button>
          </div>
        ) : (
          <p className={styles.thinking} data-testid="cc-thinking">
            {t('play.thinking', { name: game.players[p]!.name })}
          </p>
        )}
      </div>
    </div>
  );
}

function Lobby({
  t,
  saved,
  today,
  copied,
  onResume,
  onDaily,
  onCustom,
  onShare,
}: {
  t: Translator;
  saved: Saved;
  today: number;
  copied: boolean;
  onResume: () => void;
  onDaily: () => void;
  onCustom: (lineup: Player[]) => void;
  onShare: (text: string) => void;
}) {
  const [lineup, setLineup] = useState<Player[]>(saved.lineup);
  const done = saved.daily[today];
  const r = saved.record;
  const resumable = saved.game?.status === 'playing' ? saved.game : null;
  const set = (i: number, patch: Partial<Player>) =>
    setLineup(lineup.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  return (
    <div className={shared.menu}>
      <div className={shared.menuCard} data-testid="cc-lobby">
        <div>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className={shared.hintText}>{t('subtitle')}</p>
        </div>
        {resumable && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="cc-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>{t('menu.resumeHint', { n: resumable.rounds.length })}</small>
            </span>
          </button>
        )}
        <section className={styles.modeCard}>
          <h3>
            <CalendarDays size={18} /> {t('menu.daily', { n: today + 1 })}
          </h3>
          <p className={shared.hintText}>{t('menu.dailyHint')}</p>
          {done !== undefined ? (
            <div className={shared.menuActions}>
              <strong data-testid="cc-daily-done">{t('menu.dailyDone', { score: done })}</strong>
              <button
                type="button"
                className="btn"
                onClick={() => onShare(`${t('title')} #${today + 1} — ${done}`)}
              >
                <Copy size={16} /> {copied ? t('menu.copied') : t('menu.share')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDaily}
              data-testid="cc-daily"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
          )}
        </section>
        <section className={styles.modeCard}>
          <h3>
            <UserPlus size={18} /> {t('menu.custom')}
          </h3>
          <p className={shared.hintText}>{t('menu.customHint')}</p>
          <ol className={styles.lineup}>
            {lineup.map((p, i) => (
              <li key={i} className={seatClass(i)}>
                <span className={styles.dot} />
                <div className={shared.segmented}>
                  <button
                    type="button"
                    aria-pressed={p.bot === null}
                    onClick={() => set(i, { bot: null })}
                    data-testid={`cc-person-${i}`}
                  >
                    {t('menu.person')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={p.bot !== null}
                    onClick={() => set(i, { bot: p.bot ?? 'normal' })}
                    data-testid={`cc-computer-${i}`}
                  >
                    {t('menu.computer')}
                  </button>
                </div>
                {p.bot ? (
                  <select
                    value={p.bot}
                    onChange={(e) => set(i, { bot: e.target.value as Player['bot'] })}
                    aria-label={t('menu.level')}
                    data-testid={`cc-level-${i}`}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {t(`level.${l}`)}
                      </option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="text"
                  value={p.name}
                  maxLength={16}
                  onChange={(e) => set(i, { name: e.target.value })}
                  aria-label={t('menu.name')}
                  data-testid={`cc-name-${i}`}
                />
                {lineup.length > 2 && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setLineup(lineup.filter((_, k) => k !== i))}
                    aria-label={t('menu.remove')}
                    data-testid={`cc-remove-${i}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ol>
          <div className={shared.menuActions}>
            {lineup.length < 4 && (
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setLineup([
                    ...lineup,
                    { name: ['Ada', 'Bruno', 'Chiara', 'Dev'][lineup.length]!, bot: 'normal' },
                  ])
                }
                data-testid="cc-add"
              >
                <UserPlus size={16} /> {t('menu.add')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                onCustom(lineup.map((p, i) => ({ ...p, name: p.name.trim() || `P${i + 1}` })))
              }
              data-testid="cc-start"
            >
              <Play size={16} /> {t('menu.start')}
            </button>
          </div>
        </section>
        <section className={styles.modeCard} data-testid="cc-record">
          <h3>
            <BarChart3 size={18} /> {t('menu.stats')}
          </h3>
          <dl className={styles.stats}>
            <div>
              <dt>{t('stats.games')}</dt>
              <dd>{r.games}</dd>
            </div>
            <div>
              <dt>{t('stats.wins')}</dt>
              <dd>{r.wins}</dd>
            </div>
            <div>
              <dt>{t('stats.bulls')}</dt>
              <dd>{r.bulls}</dd>
            </div>
            <div>
              <dt>{t('stats.avg')}</dt>
              <dd>{r.games ? Math.round(r.points / r.games) : '—'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
