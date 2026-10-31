/**
 * Scoring a winning hand: yaku (with their han), fu, dora and the payment. Every decomposition of
 * the hand and every group the winning tile could complete is tried; the best payment counts.
 */
import { decompositions, isSevenPairs, isThirteenOrphans, type Group } from './hand';
import { doraOf, isDragon, isHonor, isTerminal, isYaochu, numOf, suitOf } from './tiles';

export interface Meld {
  type: 'chi' | 'pon' | 'kan';
  /** The lowest kind (chi) or the kind (pon, kan). */
  kind: number;
  /** Concealed kan (ankan) is the only closed meld. */
  open: boolean;
  tiles: number[];
}

export interface WinContext {
  /** Closed kinds as counts, the winning tile included. */
  counts: number[];
  melds: Meld[];
  win: number;
  tsumo: boolean;
  seatWind: number;
  roundWind: number;
  dealer: boolean;
  riichi: boolean;
  doubleRiichi: boolean;
  ippatsu: boolean;
  /** Last tile of the wall (tsumo) or its discard (ron). */
  last: boolean;
  rinshan: boolean;
  chankan: boolean;
  /** Tsumo on the first draw with no calls made yet (tenhou for the dealer, chiihou otherwise). */
  firstDraw: boolean;
  /** Dora kinds counted per tile: one per indicator. */
  doraIndicators: number[];
  uraIndicators: number[];
  /** Every tile id in the hand and melds, for counting dora. */
  allKinds: number[];
}

export interface Score {
  yaku: { id: string; han: number }[];
  han: number;
  fu: number;
  dora: number;
  /** Yakuman multiples (0 for an ordinary hand). */
  yakuman: number;
  /** Basic points (before the dealer/non-dealer multipliers). */
  basic: number;
  limit: 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman' | null;
}

interface Shape {
  kind: 'regular' | 'pairs' | 'orphans';
  pair: number;
  /** Closed sets and melds, with whether each is concealed. */
  sets: { type: 'chi' | 'pon' | 'kan'; kind: number; concealed: boolean }[];
  wait: 'ryanmen' | 'kanchan' | 'penchan' | 'shanpon' | 'tanki' | 'other';
}

/** The shapes the hand can be read as, with the group the winning tile completes. */
function shapes(ctx: WinContext): Shape[] {
  const out: Shape[] = [];
  const closedMelds = ctx.melds.map((m) => ({ type: m.type, kind: m.kind, concealed: !m.open }));
  if (!ctx.melds.length && isThirteenOrphans(ctx.counts))
    out.push({ kind: 'orphans', pair: -1, sets: [], wait: 'other' });
  if (!ctx.melds.length && isSevenPairs(ctx.counts))
    out.push({ kind: 'pairs', pair: -1, sets: [], wait: 'tanki' });
  for (const d of decompositions(ctx.counts, 4 - ctx.melds.length)) {
    const options: Shape[] = [];
    if (d.pair === ctx.win)
      options.push({
        kind: 'regular',
        pair: d.pair,
        sets: d.sets.map((s) => ({ ...s, concealed: true })),
        wait: 'tanki',
      });
    d.sets.forEach((s: Group, i) => {
      const sets = d.sets.map((x, j) => ({
        ...x,
        concealed: !(j === i && x.type === 'pon' && !ctx.tsumo),
      }));
      if (s.type === 'pon' && s.kind === ctx.win)
        options.push({ kind: 'regular', pair: d.pair, sets, wait: 'shanpon' });
      if (s.type === 'chi' && ctx.win >= s.kind && ctx.win <= s.kind + 2) {
        const pos = ctx.win - s.kind;
        const wait =
          pos === 1
            ? 'kanchan'
            : (pos === 0 && numOf(s.kind) === 7) || (pos === 2 && numOf(s.kind) === 1)
              ? 'penchan'
              : 'ryanmen';
        options.push({ kind: 'regular', pair: d.pair, sets, wait });
      }
    });
    for (const o of options) out.push({ ...o, sets: [...o.sets, ...closedMelds] });
  }
  return out;
}

function evaluate(ctx: WinContext, sh: Shape): Score | null {
  const menzen = ctx.melds.every((m) => !m.open);
  const yaku: { id: string; han: number }[] = [];
  const ykm: { id: string; n: number }[] = [];
  const add = (id: string, closed: number, open = closed) => {
    const h = menzen ? closed : open;
    if (h > 0) yaku.push({ id, han: h });
  };
  const all = ctx.allKinds;
  const sets = sh.sets;
  const pons = sets.filter((s) => s.type !== 'chi');
  const chis = sets.filter((s) => s.type === 'chi');
  const groupKinds = (s: Shape['sets'][number]) =>
    s.type === 'chi' ? [s.kind, s.kind + 1, s.kind + 2] : [s.kind];
  const isYakuhai = (k: number) => isDragon(k) || k === ctx.seatWind || k === ctx.roundWind;

  // Yakuman.
  if (sh.kind === 'orphans') ykm.push({ id: 'kokushi', n: 1 });
  if (sh.kind === 'regular') {
    const concealedPons = pons.filter((s) => s.concealed).length;
    if (concealedPons === 4) ykm.push({ id: 'suuankou', n: 1 });
    const dragonPons = pons.filter((s) => isDragon(s.kind)).length;
    if (dragonPons === 3) ykm.push({ id: 'daisangen', n: 1 });
    const windPons = pons.filter((s) => s.kind >= 27 && s.kind <= 30).length;
    if (windPons === 4) ykm.push({ id: 'daisuushi', n: 1 });
    else if (windPons === 3 && sh.pair >= 27 && sh.pair <= 30) ykm.push({ id: 'shousuushi', n: 1 });
    if (pons.filter((s) => s.type === 'kan').length === 4) ykm.push({ id: 'suukantsu', n: 1 });
  }
  if (all.every(isHonor)) ykm.push({ id: 'tsuuiisou', n: 1 });
  if (all.every(isTerminal)) ykm.push({ id: 'chinroutou', n: 1 });
  if (all.every((k) => k === 32 || (suitOf(k) === 1 && [2, 3, 4, 6, 8].includes(numOf(k)))))
    ykm.push({ id: 'ryuuiisou', n: 1 });
  if (menzen && !ctx.melds.length && sh.kind === 'regular') {
    const suit = suitOf(ctx.win);
    if (suit < 3 && all.every((k) => suitOf(k) === suit)) {
      const base = suit * 9;
      const need = [3, 1, 1, 1, 1, 1, 1, 1, 3];
      if (need.every((n, i) => ctx.counts[base + i]! >= n)) ykm.push({ id: 'chuuren', n: 1 });
    }
  }
  if (ctx.firstDraw && ctx.tsumo) ykm.push({ id: ctx.dealer ? 'tenhou' : 'chiihou', n: 1 });
  if (ykm.length) {
    const n = ykm.reduce((a, y) => a + y.n, 0);
    return {
      yaku: ykm.map((y) => ({ id: y.id, han: 13 * y.n })),
      han: 13 * n,
      fu: 0,
      dora: 0,
      yakuman: n,
      basic: 8000 * n,
      limit: 'yakuman',
    };
  }

  // Ordinary yaku.
  if (ctx.doubleRiichi) add('double-riichi', 2, 0);
  else if (ctx.riichi) add('riichi', 1, 0);
  if (ctx.ippatsu) add('ippatsu', 1, 0);
  if (ctx.tsumo && menzen) add('menzen-tsumo', 1, 0);
  if (all.every((k) => !isYaochu(k))) add('tanyao', 1);
  const pinfu =
    menzen &&
    sh.kind === 'regular' &&
    chis.length === 4 &&
    !isYakuhai(sh.pair) &&
    sh.wait === 'ryanmen';
  if (pinfu) add('pinfu', 1, 0);
  if (sh.kind === 'regular' && menzen) {
    const keys = chis.map((s) => s.kind).sort((a, b) => a - b);
    let same = 0;
    for (let i = 0; i + 1 < keys.length; i++)
      if (keys[i] === keys[i + 1]) {
        same++;
        i++;
      }
    if (same === 2) add('ryanpeikou', 3, 0);
    else if (same === 1) add('iipeikou', 1, 0);
  }
  for (const s of pons) {
    if (isDragon(s.kind)) add(`yakuhai-${s.kind}`, 1);
    if (s.kind === ctx.seatWind) add('seat-wind', 1);
    if (s.kind === ctx.roundWind) add('round-wind', 1);
  }
  if (ctx.last) add(ctx.tsumo ? 'haitei' : 'houtei', 1);
  if (ctx.rinshan) add('rinshan', 1);
  if (ctx.chankan) add('chankan', 1);
  if (sh.kind === 'pairs') add('chiitoitsu', 2, 0);
  if (sh.kind === 'regular') {
    for (let n = 0; n < 9; n++) {
      if ([0, 1, 2].every((s) => chis.some((c) => c.kind === s * 9 + n))) add('sanshoku', 2, 1);
      if ([0, 1, 2].every((s) => pons.some((c) => c.kind === s * 9 + n))) add('sanshoku-doukou', 2);
    }
    for (let s = 0; s < 3; s++)
      if ([0, 3, 6].every((n) => chis.some((c) => c.kind === s * 9 + n))) add('ittsu', 2, 1);
    if (pons.length === 4) add('toitoi', 2);
    if (pons.filter((s) => s.concealed).length === 3) add('sanankou', 2);
    if (pons.filter((s) => s.type === 'kan').length === 3) add('sankantsu', 2);
    const groups = [...sets.map(groupKinds), [sh.pair]];
    const allTerm = groups.every((g) => g.some(isTerminal));
    const allYaochu = groups.every((g) => g.some(isYaochu));
    if (chis.length && allTerm) add('junchan', 3, 2);
    else if (chis.length && allYaochu) add('chanta', 2, 1);
    if (pons.filter((s) => isDragon(s.kind)).length === 2 && isDragon(sh.pair))
      add('shousangen', 2);
  }
  if (sh.kind !== 'orphans' && all.every(isYaochu) && !all.every(isHonor)) add('honroutou', 2);
  const suits = new Set(all.filter((k) => !isHonor(k)).map(suitOf));
  if (suits.size === 1) {
    if (all.some(isHonor)) add('honitsu', 3, 2);
    else add('chinitsu', 6, 5);
  }
  if (!yaku.length) return null;

  // Fu.
  let fu: number;
  if (sh.kind === 'pairs') fu = 25;
  else if (pinfu && ctx.tsumo) fu = 20;
  else {
    fu = 20;
    if (menzen && !ctx.tsumo) fu += 10;
    if (ctx.tsumo) fu += 2;
    for (const s of pons) {
      let f = 2;
      if (isYaochu(s.kind)) f *= 2;
      if (s.concealed) f *= 2;
      if (s.type === 'kan') f *= 4;
      fu += f;
    }
    if (isDragon(sh.pair)) fu += 2;
    if (sh.pair === ctx.seatWind) fu += 2;
    if (sh.pair === ctx.roundWind) fu += 2;
    if (sh.wait === 'kanchan' || sh.wait === 'penchan' || sh.wait === 'tanki') fu += 2;
    fu = Math.ceil(fu / 10) * 10;
    if (fu === 20) fu = 30;
  }

  let dora = 0;
  for (const ind of ctx.doraIndicators) dora += all.filter((k) => k === doraOf(ind)).length;
  if (ctx.riichi || ctx.doubleRiichi)
    for (const ind of ctx.uraIndicators) dora += all.filter((k) => k === doraOf(ind)).length;
  if (dora) yaku.push({ id: 'dora', han: dora });
  const han = yaku.reduce((a, y) => a + y.han, 0);
  let basic = fu * 2 ** (han + 2);
  let limit: Score['limit'] = null;
  if (han >= 13) [basic, limit] = [8000, 'yakuman'];
  else if (han >= 11) [basic, limit] = [6000, 'sanbaiman'];
  else if (han >= 8) [basic, limit] = [4000, 'baiman'];
  else if (han >= 6) [basic, limit] = [3000, 'haneman'];
  else if (han >= 5 || basic > 2000) [basic, limit] = [2000, 'mangan'];
  return { yaku, han, fu, dora, yakuman: 0, basic, limit };
}

/** The best score of a winning hand, or null when it has no yaku. */
export function scoreHand(ctx: WinContext): Score | null {
  let best: Score | null = null;
  for (const sh of shapes(ctx)) {
    const s = evaluate(ctx, sh);
    if (s && (!best || s.basic > best.basic || (s.basic === best.basic && s.han > best.han)))
      best = s;
  }
  return best;
}

const up100 = (n: number) => Math.ceil(n / 100) * 100;

/** Payments for a win: what each seat pays (negative) or receives, before honba and riichi sticks. */
export function payments(
  basic: number,
  winner: number,
  dealerSeat: number,
  from: number | null,
): number[] {
  const out = [0, 0, 0, 0];
  if (from !== null) {
    const p = up100(basic * (winner === dealerSeat ? 6 : 4));
    out[from] = -p;
    out[winner] = p;
    return out;
  }
  for (let s = 0; s < 4; s++) {
    if (s === winner) continue;
    const p = up100(basic * (winner === dealerSeat || s === dealerSeat ? 2 : 1));
    out[s] = -p;
    out[winner]! += p;
  }
  return out;
}
