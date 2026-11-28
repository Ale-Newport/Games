/**
 * The Land Baron table: a menu (players, opponents or all human, game length, new game, resume,
 * watch the AI, record), the board, the phase prompt and its buttons (roll, bail, pardon, buy,
 * auction bids, end), the selected space with its rents and its build / sell / mortgage / redeem
 * buttons, a trade builder, answers to offers, every player's cash and worth, hints and the log.
 * Computer seats act after short pauses.
 */
import { Bot, Dices, Lightbulb, Minus, Play, Plus, RotateCcw, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { Rng, randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator, type Locale, type Translator } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { decide, type Style } from './ai';
import { BAIL, COUNCIL, GROUPS, LUCK, OWNABLE, SPACES } from './board';
import { BaronBoard } from './BaronBoard';
import {
  act,
  canBuild,
  canMortgage,
  canRedeem,
  canSell,
  currentPlayer,
  houseCost,
  isLegal,
  isValidBaron,
  legalActions,
  MAX_OFFERS,
  mortgageValue,
  newBaron,
  offerOk,
  price,
  redeemCost,
  tradable,
  worth,
  type Action,
  type Baron,
  type LogEntry,
} from './engine';
import { STRINGS } from './i18n';
import styles from './LandBaron.module.css';
import { SOUNDS } from './sounds';

type Level = 'speculator' | 'baron' | 'humans';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['speculator', 'baron', 'humans'];
const LENGTHS = [0, 30, 60];
interface Tally {
  played: number;
  won: number;
  best: number;
}
interface Saved {
  state: Baron | null;
  level: Level;
  record: Tally;
}
const EMPTY: Tally = { played: 0, won: 0, best: 0 };
const isSaved = (d: unknown): d is Saved => {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Saved;
  return (
    LEVELS.includes(s.level) &&
    (s.state === null || isValidBaron(s.state)) &&
    typeof s.record?.played === 'number'
  );
};

export function BaronTable({ services }: { services: GameServices }) {
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
  const [level, setLevel] = useState<Level>('baron');
  const [count, setCount] = useState(3);
  const [length, setLength] = useState(60);
  const [saved, setSaved] = useState<Saved>({ state: null, level: 'baron', record: EMPTY });
  const [state, setState] = useState<Baron | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<Action | null>(null);
  const [partner, setPartner] = useState<number | null>(null);
  const [give, setGive] = useState<number[]>([]);
  const [get, setGet] = useState<number[]>([]);
  const [cash, setCash] = useState(0);
  const stateRef = useLatest(state);
  const savedRef = useLatest(saved);
  const rngRef = useMemo(() => ({ rng: new Rng(randomSeed()) }), []);

  useEffect(() => {
    let alive = true;
    void slot.load().then((d) => {
      if (alive && d) {
        setSaved(d);
        setLevel(d.level);
      }
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

  const isHuman = (p: number) => mode === 'play' && (level === 'humans' || p === 0);
  const isYou = (p: number) => mode === 'play' && level !== 'humans' && p === 0;
  const name = (p: number) => (p < 0 ? '—' : isYou(p) ? t('you') : t(`colour.${p}`));
  const sname = (i: number) => SPACES[i]!.name[locale];

  const clearTrade = () => {
    setPartner(null);
    setGive([]);
    setGet([]);
    setCash(0);
  };
  const start = (g: Baron, m: Mode, lv: Level) => {
    setState(g);
    stateRef.current = g;
    setMode(m);
    setLevel(lv);
    setSelected(null);
    setHint(null);
    clearTrade();
    if (m === 'play') persist({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, n: number, limit: number) =>
    start(newBaron(n, fixedSeed ?? randomSeed() >>> 0, limit), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'baron', 4, 60), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: Baron, a: Action) => {
    const before = stateRef.current;
    if (!before) return;
    const svc = servicesRef.current;
    stateRef.current = next;
    setState(next);
    setHint(null);
    if (a.t === 'roll') svc.playSound(next.card ? SOUNDS.card : SOUNDS.roll);
    else if (a.t === 'buy' || (a.t === 'pass' && next.phase.k !== 'auction'))
      svc.playSound(SOUNDS.buy);
    else if (a.t === 'build') svc.playSound(SOUNDS.build);
    else if (a.t === 'answer' && a.accept) svc.playSound(SOUNDS.trade);
    if (mode === 'play' && level !== 'humans') {
      if (next.houses.some((h, s) => h === 5 && next.owner[s] === 0))
        svc.unlockAchievement('hotel');
      if (
        GROUPS.some((_, k) =>
          OWNABLE.filter((s) => SPACES[s]!.group === k).every((s) => next.owner[s] === 0),
        )
      )
        svc.unlockAchievement('district');
      if (next.out.some((o, p) => o && !before.out[p] && p !== 0))
        svc.unlockAchievement('bankrupter');
    }
    if (next.phase.k === 'over' && next.winner !== null) {
      if (mode === 'play') {
        const won = next.winner === 0;
        svc.playSound(level === 'humans' || won ? SOUNDS.win : SOUNDS.lose);
        if (level !== 'humans') {
          const score = worth(next, 0);
          svc.recordResult({
            outcome: won ? 'win' : 'loss',
            score,
            mode: `${level}-${next.players}-${next.limit}`,
          });
          if (won) {
            svc.unlockAchievement('first-win');
            if (level === 'baron') svc.unlockAchievement('baron-win');
          }
          const rec = savedRef.current.record;
          persist({
            state: null,
            record: {
              played: rec.played + 1,
              won: rec.won + (won ? 1 : 0),
              best: Math.max(rec.best, score),
            },
          });
        } else persist({ state: null });
      }
    } else if (mode === 'play') persist({ state: next });
  };

  const doAction = (a: Action) => {
    const g = stateRef.current;
    if (!g || !isLegal(g, a)) return false;
    commit(act(g, a), a);
    if (a.t === 'offer' || a.t === 'end') clearTrade();
    return true;
  };

  const g = state;
  const seat = g ? currentPlayer(g) : -1;
  const myMove = !!g && seat >= 0 && isHuman(seat);

  useEffect(() => {
    if (!g || mode === 'menu' || g.phase.k === 'over' || isHuman(seat)) return;
    const style: Style =
      mode === 'watch' ? (seat % 2 === 0 ? 'baron' : 'speculator') : (level as Style);
    const k = g.phase.k;
    const delay = k === 'auction' ? 260 : k === 'roll' ? 600 : 420;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur) doAction(decide(cur, style, rngRef.rng));
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, mode]);

  const showHint = () => {
    if (!g || !myMove) return;
    servicesRef.current.playSound(SOUNDS.hint);
    const a = decide(g, 'baron', new Rng(g.round * 977 + g.log.length));
    setHint(a);
    if ('at' in a) setSelected(a.at);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g || !myMove) return false;
    const k = e.key.toLowerCase();
    if (k === 'r' && g.phase.k === 'roll') doAction({ t: 'roll' });
    else if (k === 'e' && g.phase.k === 'main') doAction({ t: 'end' });
    else if (k === 'b' && g.phase.k === 'buy') doAction({ t: 'buy' });
    else if (k === 'a' && g.phase.k === 'buy') doAction({ t: 'decline' });
    else if (k === 'h') showHint();
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase.k !== 'over') persist({ state: cur, level });
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g)
    return (
      <Menu
        t={t}
        saved={saved}
        level={level}
        count={count}
        length={length}
        setLevel={setLevel}
        setCount={setCount}
        setLength={setLength}
        onStart={() => fresh('play', level, count, length)}
        onWatch={() => fresh('watch', 'baron', 4, 60)}
        onResume={() => saved.state && start(saved.state, 'play', saved.level)}
      />
    );

  const ph = g.phase;
  const legal = myMove ? legalActions(g) : [];
  const has = (tt: Action['t']) => legal.some((a) => a.t === tt);

  let prompt: string;
  const who = name(seat);
  const you = myMove;
  switch (ph.k) {
    case 'over':
      prompt = t(isYou(g.winner!) ? 'prompt.over.you' : 'prompt.over', {
        who: name(g.winner!),
        n: worth(g, g.winner!),
      });
      break;
    case 'roll':
      prompt =
        g.lockup[seat]! >= 0 && you
          ? t('prompt.lockup', { bail: BAIL })
          : you
            ? t(g.dice && g.doubles > 0 ? 'prompt.again' : 'prompt.roll.you')
            : t('prompt.roll', { who });
      break;
    case 'buy':
      prompt = you
        ? t('prompt.buy', { space: sname(ph.at), price: price(ph.at) })
        : t('prompt.buy.cpu', { who, space: sname(ph.at) });
      break;
    case 'auction':
      prompt = t(you ? 'prompt.auction.you' : 'prompt.auction', {
        space: sname(ph.at),
        bid: ph.bid,
        by: ph.high === null ? '' : isYou(ph.high) ? t('by.you') : t('by', { who: name(ph.high) }),
        who,
      });
      break;
    case 'debt':
      prompt = t(you ? 'prompt.debt.you' : 'prompt.debt', { who, n: g.debts[0]!.amount });
      break;
    case 'offer':
      prompt = t('prompt.offer', {
        from: name(ph.from),
        to: name(ph.to),
        desc: describeOffer(t, locale, ph.give, ph.get, ph.cash, name(ph.from)),
      });
      break;
    default:
      prompt = you ? t('prompt.main.you') : t('prompt.main', { who });
  }

  const describe = (a: Action): string => {
    switch (a.t) {
      case 'roll':
        return t('btn.roll');
      case 'bail':
        return t('btn.bail', { n: BAIL });
      case 'pardon':
        return t('btn.pardon');
      case 'buy':
        return t('btn.buy', { n: ph.k === 'buy' ? price(ph.at) : 0 });
      case 'decline':
        return t('btn.decline');
      case 'bid':
        return t('btn.bid', { n: a.n });
      case 'pass':
        return t('btn.pass');
      case 'build':
        return `${t('btn.build', { n: houseCost(a.at) })} · ${sname(a.at)}`;
      case 'sell':
        return `${t('btn.sell', { n: Math.floor(houseCost(a.at) / 2) })} · ${sname(a.at)}`;
      case 'mortgage':
        return `${t('btn.mortgage', { n: mortgageValue(a.at) })} · ${sname(a.at)}`;
      case 'redeem':
        return `${t('btn.redeem', { n: redeemCost(a.at) })} · ${sname(a.at)}`;
      case 'offer':
        return `${t('btn.offer', { who: name(a.to) })}: ${describeOffer(t, locale, a.give, a.get, a.cash, t('you'))}`;
      case 'answer':
        return t(a.accept ? 'btn.accept' : 'btn.refuse');
      case 'end':
        return t('btn.end');
    }
  };

  const me = myMove ? seat : mode === 'play' && level !== 'humans' ? 0 : seat;
  const sel = selected;
  const selOwner = sel !== null ? g.owner[sel] : null;
  const canAssets =
    myMove && (ph.k === 'main' || ph.k === 'roll' || ph.k === 'debt' || ph.k === 'buy');

  return (
    <div className={styles.table} data-testid="lb-table">
      <p className={styles.prompt} aria-live="polite" data-testid="lb-prompt">
        {prompt}
      </p>
      <div className={styles.layout}>
        <BaronBoard
          g={g}
          t={t}
          locale={locale}
          selected={sel}
          hint={hint && 'at' in hint ? hint.at : null}
          onPick={(i) => setSelected(i === sel ? null : i)}
        />
        <div className={styles.side}>
          {ph.k === 'over' ? (
            <section className={styles.panel} data-testid="lb-over">
              <h3>
                <Trophy size={16} /> {prompt}
              </h3>
              <ol className={styles.final}>
                {g.out
                  .map((_, p) => p)
                  .sort((a, b) => worth(g, b) - worth(g, a))
                  .map((p) => (
                    <li key={p}>
                      {name(p)} — ¤{worth(g, p)}
                    </li>
                  ))}
              </ol>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fresh(mode, level, g.players, g.limit)}
                  data-testid="lb-again"
                >
                  <Play size={16} /> {t('btn.again')}
                </button>
                <button type="button" className="btn" onClick={toMenu} data-testid="lb-menu-btn">
                  {t('btn.menu')}
                </button>
              </div>
            </section>
          ) : (
            myMove && (
              <section className={styles.panel} data-testid="lb-controls">
                <div className={styles.actions}>
                  {has('roll') && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => doAction({ t: 'roll' })}
                      data-testid="lb-roll"
                    >
                      <Dices size={16} /> {t('btn.roll')}
                    </button>
                  )}
                  {has('bail') && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => doAction({ t: 'bail' })}
                      data-testid="lb-bail"
                    >
                      {t('btn.bail', { n: BAIL })}
                    </button>
                  )}
                  {has('pardon') && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => doAction({ t: 'pardon' })}
                      data-testid="lb-pardon"
                    >
                      {t('btn.pardon')}
                    </button>
                  )}
                  {ph.k === 'buy' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!has('buy')}
                        onClick={() => doAction({ t: 'buy' })}
                        data-testid="lb-buy"
                      >
                        {t('btn.buy', { n: price(ph.at) })}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => doAction({ t: 'decline' })}
                        data-testid="lb-decline"
                      >
                        {t('btn.decline')}
                      </button>
                    </>
                  )}
                  {ph.k === 'auction' &&
                    legal
                      .filter((a): a is Extract<Action, { t: 'bid' }> => a.t === 'bid')
                      .map((a) => (
                        <button
                          key={a.n}
                          type="button"
                          className="btn"
                          onClick={() => doAction(a)}
                          data-testid={`lb-bid-${a.n - ph.bid}`}
                        >
                          {t('btn.bid', { n: a.n })}
                        </button>
                      ))}
                  {ph.k === 'auction' && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => doAction({ t: 'pass' })}
                      data-testid="lb-pass"
                    >
                      {t('btn.pass')}
                    </button>
                  )}
                  {ph.k === 'offer' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={
                          !has('answer') || !legal.some((a) => a.t === 'answer' && a.accept)
                        }
                        onClick={() => doAction({ t: 'answer', accept: true })}
                        data-testid="lb-accept"
                      >
                        {t('btn.accept')}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => doAction({ t: 'answer', accept: false })}
                        data-testid="lb-refuse"
                      >
                        {t('btn.refuse')}
                      </button>
                    </>
                  )}
                  {has('end') && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => doAction({ t: 'end' })}
                      data-testid="lb-end"
                    >
                      {t('btn.end')}
                    </button>
                  )}
                  <button type="button" className="btn" onClick={showHint} data-testid="lb-hint">
                    <Lightbulb size={16} /> {t('btn.hint')}
                  </button>
                </div>
                {hint && (
                  <p className={styles.small} data-testid="lb-hint-text">
                    {t('hint.say', { move: describe(hint) })}
                  </p>
                )}
                {ph.k === 'debt' && (
                  <div className={styles.actions} data-testid="lb-raise">
                    {legal.map((a) => (
                      <button
                        key={JSON.stringify(a)}
                        type="button"
                        className={styles.chip}
                        onClick={() => doAction(a)}
                      >
                        {describe(a)}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )
          )}

          <section className={styles.panel} data-testid="lb-space">
            <h3>{t('panel.space')}</h3>
            {sel === null ? (
              <p className={styles.small}>{t('space.pick')}</p>
            ) : (
              <SpaceInfo g={g} t={t} locale={locale} at={sel} name={name} />
            )}
            {sel !== null && canAssets && selOwner === seat && (
              <div className={styles.actions}>
                {canBuild(g, seat, sel) && ph.k !== 'debt' && ph.k !== 'buy' && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => doAction({ t: 'build', at: sel })}
                    data-testid="lb-build"
                  >
                    {t('btn.build', { n: houseCost(sel) })}
                  </button>
                )}
                {canSell(g, seat, sel) && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => doAction({ t: 'sell', at: sel })}
                    data-testid="lb-sell"
                  >
                    {t('btn.sell', { n: Math.floor(houseCost(sel) / 2) })}
                  </button>
                )}
                {canMortgage(g, seat, sel) && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => doAction({ t: 'mortgage', at: sel })}
                    data-testid="lb-mortgage"
                  >
                    {t('btn.mortgage', { n: mortgageValue(sel) })}
                  </button>
                )}
                {canRedeem(g, seat, sel) && ph.k !== 'debt' && ph.k !== 'buy' && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => doAction({ t: 'redeem', at: sel })}
                    data-testid="lb-redeem"
                  >
                    {t('btn.redeem', { n: redeemCost(sel) })}
                  </button>
                )}
              </div>
            )}
          </section>

          {myMove && ph.k === 'main' && g.offers < MAX_OFFERS && (
            <section className={styles.panel} data-testid="lb-trade">
              <h3>{t('panel.trade')}</h3>
              <div className={styles.actions}>
                <span className={styles.small}>{t('trade.with')}</span>
                {g.out.map((o, q) =>
                  o || q === seat ? null : (
                    <button
                      key={q}
                      type="button"
                      className={styles.chip}
                      aria-pressed={partner === q}
                      style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                      onClick={() => {
                        setPartner(q);
                        setGet([]);
                      }}
                      data-testid={`lb-partner-${q}`}
                    >
                      {name(q)}
                    </button>
                  ),
                )}
              </div>
              {partner !== null && (
                <>
                  <PropPicker
                    t={t}
                    locale={locale}
                    label={t('trade.give')}
                    items={OWNABLE.filter((s) => tradable(g, seat, s))}
                    value={give}
                    onChange={setGive}
                    id="give"
                  />
                  <PropPicker
                    t={t}
                    locale={locale}
                    label={t('trade.get')}
                    items={OWNABLE.filter((s) => tradable(g, partner, s))}
                    value={get}
                    onChange={setGet}
                    id="get"
                  />
                  <div className={styles.cash}>
                    <span className={styles.small}>{t('trade.cash')}</span>
                    {[-50, -10].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={styles.step}
                        onClick={() => setCash(cash + d)}
                        aria-label={String(d)}
                        data-testid={`lb-cash-${d}`}
                      >
                        <Minus size={12} />
                        {Math.abs(d)}
                      </button>
                    ))}
                    <input
                      type="number"
                      className={styles.cashInput}
                      value={cash}
                      step={10}
                      onChange={(e) => setCash(Math.trunc(Number(e.target.value) || 0))}
                      aria-label={t('trade.cash')}
                      data-testid="lb-cash"
                    />
                    {[10, 50].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={styles.step}
                        onClick={() => setCash(cash + d)}
                        aria-label={`+${d}`}
                        data-testid={`lb-cash-${d}`}
                      >
                        <Plus size={12} />
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className={styles.small}>{t('trade.left', { n: MAX_OFFERS - g.offers })}</p>
                  <button
                    type="button"
                    className="btn"
                    disabled={!offerOk(g, partner, give, get, cash)}
                    onClick={() => doAction({ t: 'offer', to: partner, give, get, cash })}
                    data-testid="lb-offer"
                  >
                    {t('btn.offer', { who: name(partner) })}
                  </button>
                </>
              )}
            </section>
          )}

          <section className={styles.panel}>
            <h3>{t('panel.players')}</h3>
            <ol className={styles.players} data-testid="lb-players">
              {g.out.map((o, q) => (
                <li
                  key={q}
                  className={styles.player}
                  data-current={q === seat}
                  data-out={o}
                  data-me={q === me}
                  style={{ ['--pc' as string]: `var(--player-${q + 1})` }}
                  data-testid={`lb-player-${q}`}
                >
                  <span className={styles.swatch} aria-hidden />
                  <strong>{name(q)}</strong>
                  <b className={styles.money}>¤{g.cash[q]}</b>
                  <small>
                    {o
                      ? t('table.out')
                      : [
                          t('table.worth', { n: worth(g, q) }),
                          (() => {
                            const n = OWNABLE.filter((s) => g.owner[s] === q).length;
                            return t(n === 1 ? 'table.props.one' : 'table.props', { n });
                          })(),
                          g.lockup[q]! >= 0 ? t('table.lockup') : '',
                          g.pardons[q]!.length ? t('table.pardon') : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                  </small>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.panel}>
            <h3>{t('panel.log')}</h3>
            <ol className={styles.log} data-testid="lb-log">
              {g.log
                .slice(-8)
                .reverse()
                .map((e, i) => (
                  <li key={g.log.length - i}>{logLine(e)}</li>
                ))}
            </ol>
          </section>
          <p className={styles.small}>{t('keys')}</p>
          {ph.k !== 'over' && (
            <div className={styles.actions}>
              <button type="button" className="btn" onClick={toMenu} data-testid="lb-to-menu">
                {t('btn.menu')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function logLine(e: LogEntry): string {
    const w = 'p' in e && e.p !== null ? name(e.p) : '';
    const mine = 'p' in e && e.p !== null && isYou(e.p);
    /** The “you” form of a line when its subject is the player at this device. */
    const L = (key: string, params: { [k: string]: string | number } = {}) =>
      t(mine ? `${key}.you` : key, { who: w, ...params });
    switch (e.k) {
      case 'roll':
        if (e.lockup === 'free') return L('log.free');
        if (e.lockup === 'stay') return L('log.stay');
        return L('log.roll', { a: e.dice[0], b: e.dice[1], to: sname(e.to) });
      case 'start':
        return L('log.start');
      case 'buy':
        return L('log.buy', { at: sname(e.at), n: e.price });
      case 'auction':
        return e.p === null
          ? t('log.unsold', { at: sname(e.at) })
          : L('log.auction', { at: sname(e.at), n: e.price });
      case 'rent':
        return isYou(e.to)
          ? t('log.rent.paid', { who: w, n: e.n, at: sname(e.at) })
          : L('log.rent', { n: e.n, to: name(e.to), at: sname(e.at) });
      case 'tax':
        return L('log.tax', { n: e.n });
      case 'card': {
        const c = (e.deck === 'luck' ? LUCK : COUNCIL).find((x) => x.id === e.id)!;
        return L('log.card', { text: c.text[locale] });
      }
      case 'lockup':
        return L('log.lockup');
      case 'out':
        return L('log.out');
      case 'build':
        return L('log.build', {
          at: sname(e.at),
          level: e.level === 5 ? t('space.hotel') : t('space.houses', { n: e.level }),
        });
      case 'sell':
        return L('log.sell', { at: sname(e.at) });
      case 'mortgage':
        return L(e.on ? 'log.mortgage' : 'log.redeem', { at: sname(e.at) });
      case 'trade':
        if (!e.ok && isYou(e.to)) return t('log.trade.no.yours', { who: w });
        return L(e.ok ? 'log.trade.ok' : 'log.trade.no', { to: name(e.to) });
      case 'bail':
        return L('log.bail');
      case 'win':
        return L('log.win');
    }
  }
}

function describeOffer(
  t: Translator,
  locale: Locale,
  give: number[],
  get: number[],
  cash: number,
  from: string,
) {
  const list = (xs: number[]) =>
    xs.length ? xs.map((s) => SPACES[s]!.name[locale]).join(', ') : t('trade.none');
  const g =
    [list(give), cash > 0 ? `¤${cash}` : '']
      .filter((x) => x && x !== t('trade.none'))
      .join(' + ') || t('trade.none');
  const w =
    [list(get), cash < 0 ? `¤${-cash}` : '']
      .filter((x) => x && x !== t('trade.none'))
      .join(' + ') || t('trade.none');
  return `${from}: ${g} ⇄ ${w}`;
}

function SpaceInfo({
  g,
  t,
  locale,
  at,
  name,
}: {
  g: Baron;
  t: Translator;
  locale: Locale;
  at: number;
  name: (p: number) => string;
}) {
  const sp = SPACES[at]!;
  const o = g.owner[at];
  return (
    <div
      className={styles.info}
      data-testid="lb-info"
      style={{
        ['--band' as string]: sp.kind === 'lot' ? GROUPS[sp.group!]!.colour : 'transparent',
      }}
    >
      <strong>{sp.name[locale]}</strong>
      {sp.kind === 'lot' && <small>{GROUPS[sp.group!]![locale]}</small>}
      {sp.price !== undefined && (
        <span>
          {t('space.price', { n: sp.price })} ·{' '}
          {o === null || o === undefined ? t('space.unowned') : t('space.owner', { who: name(o) })}
          {g.mortgaged[at] ? ` · ${t('space.mortgaged')}` : ''}
        </span>
      )}
      {sp.kind === 'lot' && (
        <>
          <span>{t('space.rents', { list: sp.rent!.join(' / ') })}</span>
          <span>{t('space.house', { n: sp.houseCost! })}</span>
          {g.houses[at]! > 0 && (
            <span>
              {g.houses[at] === 5 ? t('space.hotel') : t('space.houses', { n: g.houses[at]! })}
            </span>
          )}
        </>
      )}
      {sp.kind === 'ferry' && <span>{t('space.ferry')}</span>}
      {sp.kind === 'works' && <span>{t('space.works')}</span>}
      {sp.tax !== undefined && <span>{t('space.tax', { n: sp.tax })}</span>}
    </div>
  );
}

function PropPicker({
  t,
  locale,
  label,
  items,
  value,
  onChange,
  id,
}: {
  t: Translator;
  locale: Locale;
  label: string;
  items: number[];
  value: number[];
  onChange: (v: number[]) => void;
  id: string;
}) {
  return (
    <div className={styles.picker}>
      <span className={styles.small}>{label}</span>
      {items.length === 0 && <span className={styles.small}>{t('trade.none')}</span>}
      {items.map((s) => (
        <button
          key={s}
          type="button"
          className={styles.chip}
          aria-pressed={value.includes(s)}
          style={{
            ['--band' as string]:
              SPACES[s]!.kind === 'lot' ? GROUPS[SPACES[s]!.group!]!.colour : '#999',
          }}
          onClick={() => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s])}
          data-testid={`lb-${id}-${s}`}
        >
          {SPACES[s]!.name[locale]}
        </button>
      ))}
    </div>
  );
}

function Menu({
  t,
  saved,
  level,
  count,
  length,
  setLevel,
  setCount,
  setLength,
  onStart,
  onWatch,
  onResume,
}: {
  t: Translator;
  saved: Saved;
  level: Level;
  count: number;
  length: number;
  setLevel: (l: Level) => void;
  setCount: (n: number) => void;
  setLength: (n: number) => void;
  onStart: () => void;
  onWatch: () => void;
  onResume: () => void;
}) {
  const r = saved.record;
  return (
    <div className={shared.menu} data-testid="lb-menu">
      <div className={shared.menuCard}>
        <h2 className={shared.menuTitle}>{t('title')}</h2>
        <p className="muted">{t('menu.subtitle')}</p>
        {saved.state && (
          <button
            type="button"
            className={`btn ${shared.resume}`}
            onClick={onResume}
            data-testid="lb-resume"
          >
            <RotateCcw size={16} />
            <span>
              {t('menu.resume')}
              <small>
                {t('menu.resumeHint', { n: saved.state.players, r: saved.state.round + 1 })}
              </small>
            </span>
          </button>
        )}
        <fieldset className={shared.group}>
          <legend>{t('menu.players')}</legend>
          <div className={shared.segmented}>
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                data-testid={`lb-count-${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className={shared.group}>
          <legend>{t('menu.level')}</legend>
          <div className={shared.segmented}>
            {LEVELS.map((lv) => (
              <button
                key={lv}
                type="button"
                aria-pressed={level === lv}
                onClick={() => setLevel(lv)}
                data-testid={`lb-level-${lv}`}
              >
                {t(`level.${lv}`)}
              </button>
            ))}
          </div>
          <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
        </fieldset>
        <fieldset className={shared.group}>
          <legend>{t('menu.length')}</legend>
          <div className={shared.segmented}>
            {LENGTHS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={length === n}
                onClick={() => setLength(n)}
                data-testid={`lb-length-${n}`}
              >
                {t(`length.${n}`)}
              </button>
            ))}
          </div>
          <p className={shared.hintText}>{t('length.hint')}</p>
        </fieldset>
        <div className={shared.menuActions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStart}
            data-testid="lb-start"
          >
            <Play size={16} /> {t('menu.new')}
          </button>
          <button type="button" className="btn" onClick={onWatch} data-testid="lb-watch">
            <Bot size={16} /> {t('menu.watch')}
          </button>
        </div>
        <dl className={styles.record} data-testid="lb-record">
          <div>
            <dt>{t('record.played')}</dt>
            <dd>{r.played}</dd>
          </div>
          <div>
            <dt>{t('record.won')}</dt>
            <dd>{r.won}</dd>
          </div>
          <div>
            <dt>{t('record.best')}</dt>
            <dd>{r.best}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
