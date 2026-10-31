/**
 * The riichi table: a menu (opponents, new game, resume, watch the AI); a status bar (round, honba,
 * riichi sticks, wall, dora indicators); the three other players with their scores, winds, riichi,
 * melds and discards; your discards, melds and hand; buttons for every call and declaration; hints
 * from the careful player; the hand's result (yaku, han and fu, payments) and the final standings.
 */
import { Bot, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameServices } from '../../core/game-engine/types';
import { createTranslator, type Locale } from '../../core/i18n';
import { useKeyboard } from '../../core/input/keyboard';
import { FaceArt, faceName } from '../shared/mjtiles/Face';
import shared from '../shared/sudoku/SudokuGame.module.css';
import { chooseAction, discardTable } from './ai';
import {
  act,
  decider,
  doraIndicators,
  isValidRiichi,
  legalActions,
  newRiichi,
  seatWind,
  waitsOf,
  type RiichiGame,
} from './engine';
import { STRINGS, yakuName } from './i18n';
import styles from './Riichi.module.css';
import { RIICHI_SOUNDS } from './sounds';
import { kindOf } from './tiles';

type Level = 'easy' | 'hard';
type Mode = 'menu' | 'play' | 'watch';
const LEVELS: Level[] = ['easy', 'hard'];

interface Saved {
  state: RiichiGame;
  level: Level;
}

function Tile({ tile, size = 'md', back }: { tile: number; size?: 'sm' | 'md'; back?: boolean }) {
  return (
    <span className={[styles.tile, styles[size], back ? styles.back : ''].join(' ')}>
      {!back && (
        <svg viewBox="0 0 30 40" aria-hidden="true">
          <FaceArt face={kindOf(tile)} />
        </svg>
      )}
    </span>
  );
}

export function RiichiTable({ services }: { services: GameServices }) {
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
          LEVELS.includes((d as Saved).level) &&
          isValidRiichi((d as Saved).state),
      }),
    [services],
  );
  const asked = Number(services.launchParams.deal);
  const fixedSeed = Number.isInteger(asked) && asked > 0 ? asked : null;
  const [mode, setMode] = useState<Mode>(services.launchParams.mode === 'watch' ? 'watch' : 'menu');
  const [level, setLevel] = useState<Level>('hard');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [state, setState] = useState<RiichiGame | null>(null);
  const [riichiMode, setRiichiMode] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const stateRef = useLatest(state);
  const loc: 'en' | 'es' = locale === 'es' ? 'es' : 'en';
  const tileName = (tile: number) => faceName(kindOf(tile), loc);
  const kindName = (k: number) => faceName(k, loc);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (!cancelled && d && d.state.phase !== 'over') setSaved(d);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const human = (p: number) => mode === 'play' && p === 0;
  const isYou = human;
  const name = (p: number) => (isYou(p) ? t('you') : t('cpu', { n: mode === 'watch' ? p + 1 : p }));
  const say = (key: string, p: number, params: Record<string, string | number> = {}) =>
    t(isYou(p) ? `${key}.you` : key, { side: name(p), ...params });

  const start = (g: RiichiGame, m: Mode, lv: Level) => {
    setState(g);
    setMode(m);
    setLevel(lv);
    setRiichiMode(false);
    setHint(null);
    setMessage('');
    if (m === 'play') void slot.save({ state: g, level: lv });
  };
  const fresh = (m: Mode, lv: Level, seed: number) => start(newRiichi(seed), m, lv);

  useEffect(() => {
    if (mode !== 'watch' || state) return;
    const id = window.setTimeout(() => fresh('watch', 'hard', fixedSeed ?? randomSeed() >>> 0), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commit = (next: RiichiGame, action: string) => {
    const before = stateRef.current;
    if (!before || next === before) return;
    const svc = servicesRef.current;
    const seat = decider(before);
    setRiichiMode(false);
    setHint(null);
    setState(next);
    const notes: string[] = [];
    if (action.startsWith('discard:') || action.startsWith('riichi:')) {
      if (action.startsWith('riichi:')) {
        notes.push(say('riichiDeclared', seat));
        svc.playSound(RIICHI_SOUNDS.riichi);
      } else svc.playSound(RIICHI_SOUNDS.discard);
      notes.push(say('discarded', seat, { tile: tileName(Number(action.split(':')[1])) }));
    } else if (action === 'pon' || action === 'kan' || action.startsWith('chi:')) {
      if (next.claim === null && next.phase === 'discard' && next.turn === seat) {
        notes.push(
          say('called', seat, {
            call: action === 'pon' ? t('pon') : action === 'kan' ? t('kanBtn') : 'Chi',
          }),
        );
        svc.playSound(RIICHI_SOUNDS.call);
      }
    } else if (action.startsWith('ankan:') || action.startsWith('kakan:')) {
      notes.push(say('kan', seat));
      svc.playSound(RIICHI_SOUNDS.call);
    } else if (action === 'next') svc.playSound(RIICHI_SOUNDS.deal);
    const r = next.result;
    if ((next.phase === 'handOver' || next.phase === 'over') && before.phase !== 'handOver' && r) {
      if (r.kind === 'draw') {
        notes.push(t('exhausted'));
        svc.playSound(RIICHI_SOUNDS.draw);
      } else {
        notes.push(
          r.kind === 'tsumo'
            ? say('tsumoWin', r.winner!)
            : say('ronWin', r.winner!, { from: name(r.from!) }),
        );
        svc.playSound(RIICHI_SOUNDS.win);
      }
    }
    if (next.phase === 'over' && next.winner !== null && before.phase !== 'over') {
      notes.push(say('won', next.winner, { n: next.scores[next.winner]! }));
      if (mode === 'play') {
        const rank = [...next.scores].sort((a, b) => b - a).indexOf(next.scores[0]!);
        svc.playSound(next.winner === 0 ? RIICHI_SOUNDS.gameWin : RIICHI_SOUNDS.gameLose);
        svc.recordResult({
          outcome: next.winner === 0 ? 'win' : 'loss',
          score: next.scores[0]!,
          mode: level,
        });
        svc.unlockAchievement('first');
        if (next.winner === 0) svc.unlockAchievement('top');
        if (rank <= 1) svc.unlockAchievement('podium');
        void slot.clear();
        setSaved(null);
      }
    } else if (mode === 'play') void slot.save({ state: next, level });
    // Hand achievements, as they happen.
    if (
      mode === 'play' &&
      r &&
      r.winner === 0 &&
      before.phase !== 'handOver' &&
      (next.phase === 'handOver' || next.phase === 'over')
    ) {
      if (r.score!.limit === 'mangan' || r.score!.basic >= 2000) svc.unlockAchievement('mangan');
    }
    if (notes.length || seat === 0) setMessage(notes.join(' '));
  };

  const doAction = (a: string) => {
    const g = stateRef.current;
    if (g) commit(act(g, a), a);
  };

  // Computer seats (all four in watch mode) act after a pause; watch mode deals on by itself.
  useEffect(() => {
    if (!state || mode === 'menu' || state.phase === 'over') return;
    if (state.phase === 'handOver') {
      if (mode !== 'watch') return;
      const id = window.setTimeout(() => doAction('next'), 3500);
      return () => window.clearTimeout(id);
    }
    if (human(decider(state))) return;
    const id = window.setTimeout(
      () => {
        const g = stateRef.current;
        if (!g || g.phase === 'handOver' || g.phase === 'over') return;
        doAction(chooseAction(g, mode === 'watch' ? decider(g) % 2 === 0 : level === 'hard'));
      },
      state.phase === 'claim' ? 350 : 650,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const g = state;
  const legal = g ? legalActions(g) : [];
  const myMove = !!g && (g.phase === 'discard' || g.phase === 'claim') && human(decider(g));
  const myDiscard = myMove && g.phase === 'discard';
  const riichiTiles = new Set(
    legal.filter((a) => a.startsWith('riichi:')).map((a) => Number(a.slice(7))),
  );
  const discardTiles = new Set(
    legal.filter((a) => a.startsWith('discard:')).map((a) => Number(a.slice(8))),
  );

  const tapTile = (tile: number) => {
    if (!myDiscard) return;
    if (riichiMode) {
      if (riichiTiles.has(tile)) doAction(`riichi:${tile}`);
      return;
    }
    if (discardTiles.has(tile)) doAction(`discard:${tile}`);
  };

  const showHint = () => {
    if (!g || !myMove) return;
    const a = chooseAction(g, true);
    servicesRef.current.playSound(RIICHI_SOUNDS.hint);
    setHint(a);
    if (a === 'tsumo' || a === 'ron') setMessage(t('hint.win'));
    else if (a === 'pass') setMessage(t('hint.pass'));
    else if (a === 'pon' || a === 'kan' || a.startsWith('chi:'))
      setMessage(
        t('hint.call', { call: a === 'pon' ? t('pon') : a === 'kan' ? t('kanBtn') : 'Chi' }),
      );
    else if (a.startsWith('discard:') || a.startsWith('riichi:')) {
      const tile = Number(a.split(':')[1]);
      const row = discardTable(g, 0).find((r) => r.kind === kindOf(tile));
      const after = {
        ...g,
        tiles: g.tiles.map((h, i) => (i === 0 ? h.filter((x) => x !== tile) : h)),
      };
      const ws = waitsOf(after, 0).map(kindName).join(', ');
      const threatened = [1, 2, 3].some((s) => g.riichi[s]);
      if (a.startsWith('riichi:'))
        setMessage(t('hint.riichi', { tile: tileName(tile), waits: ws }));
      else if (row && row.shanten === 0 && ws)
        setMessage(t('hint.ready', { tile: tileName(tile), waits: ws }));
      else if (threatened && row && row.shanten >= 1)
        setMessage(t('hint.fold', { tile: tileName(tile) }));
      else
        setMessage(
          t('hint.discard', { tile: tileName(tile), s: row?.shanten ?? 0, u: row?.ukeire ?? 0 }),
        );
    } else setMessage(a);
  };

  useKeyboard((e) => {
    if (mode !== 'play' || !g) return false;
    const k = e.key.toLowerCase();
    if (k === 'enter' && g.phase === 'handOver') doAction('next');
    else if (!myMove) return false;
    else if (k === 'h') showHint();
    else if (k === 'p' && legal.includes('pass')) doAction('pass');
    else return false;
    return true;
  });

  const toMenu = () => {
    const cur = stateRef.current;
    if (mode === 'play' && cur && cur.phase !== 'over') {
      const kept = { state: cur, level };
      setSaved(kept);
      void slot.save(kept);
    }
    setMode('menu');
    setState(null);
  };

  if (mode === 'menu' || !g) {
    return (
      <div className={shared.menu} data-testid="rm-menu">
        <div className={shared.menuCard}>
          <h2 className={shared.menuTitle}>{t('title')}</h2>
          <p className="muted">{t('menu.subtitle')}</p>
          {saved && (
            <button
              type="button"
              className={`btn ${shared.resume}`}
              onClick={() => start(saved.state, 'play', saved.level)}
              data-testid="rm-resume"
            >
              <RotateCcw size={16} />
              <span>
                {t('menu.resume')}
                <small>
                  {t('menu.resumeHint', { r: saved.state.round + 1, pts: saved.state.scores[0]! })}
                </small>
              </span>
            </button>
          )}
          <fieldset className={shared.group}>
            <legend>{t('menu.level')}</legend>
            <div className={shared.segmented}>
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  aria-pressed={level === lv}
                  onClick={() => setLevel(lv)}
                  data-testid={`rm-level-${lv}`}
                >
                  {t(`level.${lv}`)}
                </button>
              ))}
            </div>
            <p className={shared.hintText}>{t(`level.${level}.hint`)}</p>
          </fieldset>
          <div className={shared.menuActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fresh('play', level, fixedSeed ?? randomSeed() >>> 0)}
              data-testid="rm-start"
            >
              <Play size={16} /> {t('menu.new')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fresh('watch', 'hard', fixedSeed ?? randomSeed() >>> 0)}
              data-testid="rm-watch"
            >
              <Bot size={16} /> {t('menu.watch')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const me = 0;
  const showAll = mode === 'watch' || g.phase === 'handOver' || g.phase === 'over';
  const claimTile = g.phase === 'claim' ? g.claim!.tile : null;
  const prompt = (() => {
    if (g.phase === 'handOver' || g.phase === 'over') return '';
    if (!myMove) return t('thinking', { side: name(decider(g)) });
    if (g.phase === 'claim')
      return g.claim!.kind === 'chankan'
        ? t('chankanPrompt', { side: name(g.claim!.from), tile: tileName(g.claim!.tile) })
        : t('claimPrompt', { side: name(g.claim!.from), tile: tileName(g.claim!.tile) });
    if (riichiMode) return t('pickRiichi');
    return g.riichi[me] ? t('riichiTurn') : t('yourTurn');
  })();
  const myWaits =
    g.phase === 'claim' || (g.phase === 'discard' && g.turn !== me) ? waitsOf(g, me) : [];

  const seatPanel = (p: number) => (
    <div
      key={p}
      className={[
        styles.seat,
        p === decider(g) && g.phase !== 'handOver' ? styles.active : '',
      ].join(' ')}
      data-testid={`rm-seat-${p}`}
    >
      <div className={styles.seatHead}>
        <span className={styles.wind}>{t(`wind.${seatWind(g, p)}`)}</span>
        <strong>{name(p)}</strong>
        <span className={styles.points}>{g.scores[p]}</span>
        {g.riichi[p] && <span className={styles.riichiBadge}>{t('riichi')}</span>}
      </div>
      <div className={styles.row}>
        {g.melds[p]!.map((m, i) => (
          <span key={i} className={styles.meld}>
            {m.tiles.map((x, j) => (
              <Tile key={x} tile={x} size="sm" back={!m.open && (j === 0 || j === 3)} />
            ))}
          </span>
        ))}
        {p !== me && showAll && g.tiles[p]!.map((x) => <Tile key={x} tile={x} size="sm" />)}
        {p !== me && !showAll && <span className={styles.count}>{g.tiles[p]!.length}</span>}
      </div>
      <div className={styles.discards} data-testid={`rm-discards-${p}`}>
        {g.discards[p]!.map((d, i) => (
          <span
            key={i}
            className={[
              d.called ? styles.called : '',
              d.riichi ? styles.sideways : '',
              claimTile === d.tile ? styles.claimed : '',
            ].join(' ')}
          >
            <Tile tile={d.tile} size="sm" />
          </span>
        ))}
      </div>
    </div>
  );

  const r = g.result;
  return (
    <div className={shared.play} data-testid="riichi">
      <div className={styles.status} data-testid="rm-status">
        <span>{t('round', { r: g.round + 1 })}</span>
        <span>{t('honba', { n: g.honba })}</span>
        <span>{t('sticks', { n: g.sticks })}</span>
        <span data-testid="rm-wall">{t('wall', { n: g.wall.length })}</span>
        <span className={styles.dora} aria-label={t('dora')}>
          {doraIndicators(g).map((k, i) => (
            <Tile key={i} tile={k * 4} size="sm" />
          ))}
        </span>
      </div>
      <div className={styles.opponents}>{[3, 2, 1].map(seatPanel)}</div>
      {mode === 'play' ? (
        <div
          className={[
            styles.seat,
            styles.mine,
            decider(g) === me && g.phase !== 'handOver' ? styles.active : '',
          ].join(' ')}
        >
          <div className={styles.seatHead}>
            <span className={styles.wind}>{t(`wind.${seatWind(g, me)}`)}</span>
            <strong>{name(me)}</strong>
            <span className={styles.points}>{g.scores[me]}</span>
            {g.riichi[me] && <span className={styles.riichiBadge}>{t('riichi')}</span>}
            {myWaits.length > 0 && (
              <small className={styles.waits}>
                {t('waitsLabel', { waits: myWaits.map(kindName).join(', ') })}
              </small>
            )}
          </div>
          <div className={styles.discards} data-testid="rm-discards-0">
            {g.discards[me]!.map((d, i) => (
              <span
                key={i}
                className={[d.called ? styles.called : '', d.riichi ? styles.sideways : ''].join(
                  ' ',
                )}
              >
                <Tile tile={d.tile} size="sm" />
              </span>
            ))}
          </div>
          <div className={styles.row}>
            {g.melds[me]!.map((m, i) => (
              <span key={i} className={styles.meld}>
                {m.tiles.map((x, j) => (
                  <Tile key={x} tile={x} size="sm" back={!m.open && (j === 0 || j === 3)} />
                ))}
              </span>
            ))}
          </div>
          <div className={styles.hand} aria-label={t('hand')} data-testid="rm-hand">
            {(g.turn === me && g.drawn !== null
              ? [...g.tiles[me]!.filter((x) => x !== g.drawn), g.drawn]
              : g.tiles[me]!
            ).map((x) => {
              const ok = myDiscard && (riichiMode ? riichiTiles.has(x) : discardTiles.has(x));
              const hinted = hint === `discard:${x}` || hint === `riichi:${x}`;
              return (
                <button
                  key={x}
                  type="button"
                  className={[
                    styles.handTile,
                    x === g.drawn && g.turn === me ? styles.drawn : '',
                    ok ? styles.live : '',
                    hinted ? styles.hinted : '',
                  ].join(' ')}
                  disabled={!ok}
                  onClick={() => tapTile(x)}
                  aria-label={tileName(x)}
                  data-testid={`rm-tile-${x}`}
                  data-live={ok || undefined}
                >
                  <Tile tile={x} />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.opponents}>{seatPanel(0)}</div>
      )}
      <p className={shared.message} data-testid="rm-message" aria-live="polite">
        {message}
        {message && prompt ? ' ' : ''}
        {prompt}
      </p>
      {r && (g.phase === 'handOver' || g.phase === 'over') && (
        <div className={styles.result} data-testid="rm-result">
          {r.kind === 'draw' ? (
            <p>
              {t('exhausted')}{' '}
              {[0, 1, 2, 3]
                .map((p) => `${name(p)}: ${t(r.tenpai[p] ? 'tenpai' : 'noten')}`)
                .join(' · ')}
            </p>
          ) : (
            <>
              <div className={styles.row}>
                {r.hand.map((x, i) => (
                  <Tile key={i} tile={x} size="sm" />
                ))}
              </div>
              <ul className={styles.yaku}>
                {r.score!.yaku.map((y) => (
                  <li key={y.id}>
                    <span>{yakuName(y.id, locale as Locale)}</span>
                    <span>{y.han}</span>
                  </li>
                ))}
              </ul>
              <p>
                <strong>
                  {r.score!.yakuman
                    ? t('yakuman')
                    : `${t('hanFu', { han: r.score!.han, fu: r.score!.fu })}${r.score!.limit ? ` · ${t(`limit.${r.score!.limit}`)}` : ''}`}
                </strong>
              </p>
            </>
          )}
          <p className={styles.deltas}>
            {[0, 1, 2, 3].map((p) => (
              <span
                key={p}
                className={r.deltas[p]! > 0 ? styles.plus : r.deltas[p]! < 0 ? styles.minus : ''}
              >
                {name(p)} {r.deltas[p]! > 0 ? '+' : ''}
                {r.deltas[p]}
              </span>
            ))}
          </p>
          {g.phase === 'over' && (
            <ol className={styles.final} data-testid="rm-final">
              {[0, 1, 2, 3]
                .sort((a, b) => g.scores[b]! - g.scores[a]!)
                .map((p) => (
                  <li key={p}>
                    {name(p)} · {g.scores[p]}
                  </li>
                ))}
            </ol>
          )}
        </div>
      )}
      <div className={shared.controls}>
        {myMove &&
          legal
            .filter((a) => !a.startsWith('discard:') && !a.startsWith('riichi:'))
            .map((a) => {
              const label =
                a === 'tsumo'
                  ? t('tsumo')
                  : a === 'ron'
                    ? t('ron')
                    : a === 'pon'
                      ? t('pon')
                      : a === 'kan'
                        ? t('kanBtn')
                        : a === 'pass'
                          ? t('pass')
                          : a.startsWith('chi:')
                            ? t('chi', {
                                a: tileName(Number(a.slice(4).split(',')[0])),
                                b: tileName(Number(a.slice(4).split(',')[1])),
                              })
                            : a.startsWith('ankan:')
                              ? t('ankan', { tile: kindName(Number(a.slice(6))) })
                              : t('kakan', { tile: kindName(Number(a.slice(6))) });
              const primary = a === 'tsumo' || a === 'ron' || hint === a;
              return (
                <button
                  key={a}
                  type="button"
                  className={['btn', primary ? 'btn-primary' : ''].join(' ')}
                  onClick={() => doAction(a)}
                  data-testid={`rm-act-${a.split(':')[0]}`}
                >
                  {label}
                </button>
              );
            })}
        {myDiscard && riichiTiles.size > 0 && (
          <button
            type="button"
            className={['btn', riichiMode || hint?.startsWith('riichi:') ? 'btn-primary' : ''].join(
              ' ',
            )}
            aria-pressed={riichiMode}
            onClick={() => setRiichiMode((x) => !x)}
            data-testid="rm-riichi"
          >
            {t('riichi')}
          </button>
        )}
        {myMove && (
          <button type="button" className="btn" onClick={showHint} data-testid="rm-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
        )}
        {mode === 'play' && g.phase === 'handOver' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => doAction('next')}
            data-testid="rm-next"
          >
            {t('next')}
          </button>
        )}
        {(g.phase === 'over' || mode === 'watch') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fresh(mode, level, randomSeed() >>> 0)}
            data-testid="rm-again"
          >
            <Play size={16} /> {t('again')}
          </button>
        )}
        <button type="button" className="btn" onClick={toMenu} data-testid="rm-menu-btn">
          {t('menu')}
        </button>
      </div>
      {mode === 'play' && <p className={shared.hintText}>{t('keys')}</p>}
    </div>
  );
}
