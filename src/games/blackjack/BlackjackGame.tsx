/** The Blackjack table: chips to bet, the dealer and the player's hands, actions and hints. */
import { Bot, Lightbulb, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { cardName } from '../shared/cards/cards';
import { CardView } from '../shared/cards/CardView';
import { CARD_SOUNDS } from '../shared/solitaire/sounds';
import { basicStrategyAction } from './ai';
import {
  BETS,
  DECKS,
  START_BANKROLL,
  applyBlackjackAction,
  createBlackjack,
  handValue,
  isValidBlackjackState,
  legalBlackjackActions,
  roundNet,
  type BlackjackState,
} from './engine';
import { STRINGS } from './i18n';
import styles from './BlackjackGame.module.css';

interface Saved {
  state: BlackjackState;
  streak: number;
}

const WATCH_BET = 25;

export function BlackjackGame({ services }: GameProps) {
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
          typeof (d as Saved).streak === 'number' &&
          isValidBlackjackState((d as Saved).state),
      }),
    [services],
  );
  const slotRef = useLatest(slot);
  const [watch, setWatch] = useState(services.launchParams.mode === 'watch');
  const [paused, setPaused] = useState(false);
  // A shoe number in the URL (?deal=123) replays that shoe; otherwise a random one.
  const asked = Number(services.launchParams.deal);
  const fixedShoe = Number.isInteger(asked) && asked > 0;
  const [state, setState] = useState<BlackjackState>(() =>
    createBlackjack(fixedShoe ? asked : randomSeed() >>> 0),
  );
  const [streak, setStreak] = useState(0);
  const [advice, setAdvice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const stateRef = useLatest(state);
  const streakRef = useLatest(streak);

  useEffect(() => {
    if (watch || fixedShoe) return;
    let cancelled = false;
    void slotRef.current.load().then((saved) => {
      if (cancelled || !saved) return;
      setState(saved.state);
      setStreak(saved.streak);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** "7/17" while a soft hand can still change; just the best total once the round is over. */
  const totalText = (cards: readonly number[], final = false) => {
    const v = handValue(cards);
    return v.soft && v.total < 21 && !final ? `${v.total - 10}/${v.total}` : String(v.total);
  };

  /** Records a settled round: statistics, achievements, streak. */
  const record = (s: BlackjackState) => {
    const svc = servicesRef.current;
    const net = roundNet(s);
    svc.playSound(net > 0 ? CARD_SOUNDS.win : net < 0 ? CARD_SOUNDS.lose : CARD_SOUNDS.place);
    const sign = net > 0 ? '+' : net < 0 ? '−' : '';
    setAnnouncement(t('round.net', { sign, n: Math.abs(net) }));
    if (watch) return;
    svc.recordResult({
      outcome: net > 0 ? 'win' : net < 0 ? 'loss' : 'draw',
      score: s.bankroll,
      mode: 'blackjack',
    });
    const nextStreak = net > 0 ? streakRef.current + 1 : net < 0 ? 0 : streakRef.current;
    setStreak(nextStreak);
    if (s.hands.some((h) => h.outcome === 'blackjack')) svc.unlockAchievement('natural');
    if (s.hands.some((h) => h.doubled && h.outcome === 'win')) svc.unlockAchievement('double-down');
    if (s.hands.length > 1 && s.hands.every((h) => h.outcome === 'win'))
      svc.unlockAchievement('split-sweep');
    if (nextStreak >= 5) svc.unlockAchievement('hot-streak');
    if (s.bankroll >= 2 * START_BANKROLL) svc.unlockAchievement('high-roller');
    void slotRef.current.save({ state: s, streak: nextStreak });
  };

  const act = (a: string) => {
    const before = stateRef.current;
    if (!legalBlackjackActions(before).includes(a)) {
      servicesRef.current.playSound(CARD_SOUNDS.invalid);
      return;
    }
    const next = applyBlackjackAction(before, a);
    setAdvice(null);
    servicesRef.current.playSound(a.startsWith('bet:') ? CARD_SOUNDS.draw : CARD_SOUNDS.place);
    if (a.startsWith('bet:')) {
      setAnnouncement(
        t('announce.deal', {
          you: totalText(next.hands[0]!.cards),
          up: cardName(next.dealer[0]!, locale),
        }),
      );
    } else if (a === 'hit' || a === 'double') {
      const h = before.hands[before.active]!;
      const after = next.hands[before.active]!;
      const card = after.cards[after.cards.length - 1]!;
      if (after.cards.length > h.cards.length)
        setAnnouncement(
          t('announce.card', { card: cardName(card, locale), total: totalText(after.cards) }),
        );
    }
    if (a === 'next' && next.refills > before.refills)
      setAnnouncement(t('refill', { n: START_BANKROLL }));
    setState(next);
    if (next.phase === 'settled' && before.phase !== 'settled') record(next);
    else if (!watch) void slotRef.current.save({ state: next, streak: streakRef.current });
  };

  // Watch AI: basic strategy plays round after round with a fixed bet.
  useEffect(() => {
    if (!watch || paused) return;
    const id = window.setTimeout(
      () => {
        const s = stateRef.current;
        if (s.phase === 'bet') act(`bet:${Math.min(WATCH_BET, s.bankroll)}`);
        else act(basicStrategyAction(s));
      },
      state.phase === 'settled' ? 1600 : 650,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, paused, state]);

  const legal = legalBlackjackActions(state);
  const human = !watch;
  const showHint = () => {
    if (state.phase !== 'play' && state.phase !== 'insurance') return;
    servicesRef.current.playSound(CARD_SOUNDS.hint);
    setAdvice(basicStrategyAction(state));
  };

  useKeyboard((e) => {
    if (!human) return false;
    const k = e.key.toLowerCase();
    if (state.phase === 'bet' && /^[1-6]$/.test(k)) {
      act(`bet:${BETS[Number(k) - 1]}`);
      return true;
    }
    const map: Record<string, string> = {
      h: 'hit',
      s: 'stand',
      d: 'double',
      p: 'split',
      i: 'insure',
    };
    if (map[k]) {
      act(map[k]!);
      return true;
    }
    if (k === 'n' || k === 'enter') {
      act(state.phase === 'insurance' ? 'no-insure' : 'next');
      return true;
    }
    if (k === 'b') {
      showHint();
      return true;
    }
    return false;
  });

  const cardWidth = 'clamp(48px, 13vw, 84px)';
  const dealerShown = state.revealed ? state.dealer : state.dealer.slice(0, 1);
  const status = watch
    ? t('phase.watch')
    : state.phase === 'bet'
      ? t('place-bet')
      : state.phase === 'insurance'
        ? t('phase.insurance')
        : state.phase === 'play'
          ? t('phase.play')
          : announcement;
  const shoeLeft = Math.round((1 - state.dealt / (52 * DECKS)) * 100);

  return (
    <div className={styles.play} data-testid="blackjack">
      <div className={styles.stats}>
        <span>
          {t('bankroll')} <strong data-testid="bj-bankroll">{state.bankroll}</strong>
        </span>
        <span>
          {t('rounds')} <strong>{state.rounds}</strong>
        </span>
        <span>
          {t('shoe')} <strong>{shoeLeft}%</strong>
        </span>
      </div>
      <div
        className={`${styles.table} ${services.reducedMotion ? styles.still : ''}`}
        style={{ '--card-w': cardWidth } as CSSProperties}
      >
        <div className={styles.area} data-testid="bj-dealer">
          <span className={styles.label}>
            {t('dealer')}
            {state.dealer.length > 0 && (
              <span className={styles.value} data-testid="bj-dealer-value">
                {totalText(dealerShown, state.revealed)}
              </span>
            )}
          </span>
          <div className={styles.cards}>
            {state.dealer.map((c, i) => {
              const up = i === 0 || state.revealed;
              return (
                <div
                  key={`${state.rounds}-d${i}`}
                  className={styles.card}
                  role="img"
                  aria-label={up ? cardName(c, locale) : t('card.hole')}
                >
                  <CardView card={c} faceUp={up} fourColor={services.colorblind} />
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.hands}>
          {state.hands.map((h, i) => (
            <div
              key={i}
              className={`${styles.hand} ${state.phase === 'play' && i === state.active ? styles.active : ''}`}
              data-testid={`bj-hand-${i}`}
            >
              <span className={styles.label}>
                {state.hands.length > 1 ? t('hand', { n: i + 1 }) : t('you')}
                <span className={styles.value} data-testid={`bj-value-${i}`}>
                  {totalText(h.cards, h.done || state.phase === 'settled')}
                </span>
              </span>
              <div className={styles.cards}>
                {h.cards.map((c, k) => (
                  <div
                    key={`${state.rounds}-${i}-${k}`}
                    className={styles.card}
                    role="img"
                    aria-label={cardName(c, locale)}
                  >
                    <CardView card={c} faceUp fourColor={services.colorblind} />
                  </div>
                ))}
              </div>
              <span className={styles.betChip}>{t('bet', { n: h.bet })}</span>
              {h.outcome && (
                <span className={styles.outcome} data-o={h.outcome} data-testid={`bj-outcome-${i}`}>
                  {handValue(h.cards).total > 21 ? t('bust') : t(`outcome.${h.outcome}`)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.status} data-testid="bj-status">
        {advice ? t('advice', { move: t(advice) }) : status}
      </div>
      <div className={styles.controls}>
        {human &&
          state.phase === 'bet' &&
          BETS.map((b) => (
            <button
              key={b}
              type="button"
              className={styles.chip}
              data-v={b}
              disabled={b > state.bankroll}
              onClick={() => act(`bet:${b}`)}
              aria-label={t('bet', { n: b })}
            >
              {b}
            </button>
          ))}
        {human && state.phase === 'insurance' && (
          <>
            <button
              type="button"
              className={`btn ${advice === 'insure' ? styles.advised : ''}`}
              disabled={!legal.includes('insure')}
              onClick={() => act('insure')}
            >
              {t('insure', { n: state.hands[0]!.bet / 2 })}
            </button>
            <button
              type="button"
              className={`btn btn-primary ${advice === 'no-insure' ? styles.advised : ''}`}
              onClick={() => act('no-insure')}
            >
              {t('no-insure')}
            </button>
          </>
        )}
        {human &&
          state.phase === 'play' &&
          (['hit', 'stand', 'double', 'split'] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={`btn ${a === 'stand' ? 'btn-primary' : ''} ${advice === a ? styles.advised : ''}`}
              disabled={!legal.includes(a)}
              data-action={a}
              onClick={(e) => act(e.currentTarget.dataset.action!)}
              data-testid={`bj-${a}`}
            >
              {t(a)}
            </button>
          ))}
        {human && state.phase === 'settled' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act('next')}
            data-testid="bj-next"
          >
            {t('next')}
          </button>
        )}
        {human && (state.phase === 'play' || state.phase === 'insurance') && (
          <button type="button" className="btn" onClick={showHint} data-testid="bj-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {watch && (
          <button type="button" className="btn" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play size={16} /> : <Pause size={16} />} {t(paused ? 'resume' : 'pause')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setWatch((w) => !w);
            setPaused(false);
            setAdvice(null);
            if (!watch) setState(createBlackjack(randomSeed() >>> 0));
            else
              void slotRef.current.load().then((saved) => {
                setState(saved ? saved.state : createBlackjack(randomSeed() >>> 0));
                setStreak(saved ? saved.streak : 0);
              });
          }}
          data-testid="bj-watch"
        >
          {watch ? <Play size={16} /> : <Bot size={16} />} {t(watch ? 'play' : 'watch')}
        </button>
      </div>
      <p className={styles.keys}>{t('keys')}</p>
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
