/** Janggi rules (shared engine), random setups per round and achievement predicates. */
import { SETUPS, type JanggiState } from '../shared/xiangqi/janggi';

export { RULES_VERSION, RULESET_ID } from './rules-meta';

/** Each side's horse/elephant order is drawn at random for a new round (players' choice in real play). */
export const randomSetupSeed = () => Math.floor(Math.random() * 16);

/** Horse/elephant orders of both sides, as shown in the status line (e.g. "EHEH"). */
export function setupsOf(s: JanggiState): [string, string] {
  const back = s.startPlacement.split('/');
  const read = (rank: string, mirrored: boolean) => {
    const files = [...rank.replace(/\d/g, (d) => '.'.repeat(Number(d)))];
    const order = [files[1], files[2], files[6], files[7]].map((x) =>
      x!.toLowerCase() === 'n' ? 'H' : 'E',
    );
    return (mirrored ? order.reverse() : order).join('');
  };
  const cho = read(back[9]!, false);
  const han = read(back[0]!, true);
  if (!SETUPS.includes(cho as never) || !SETUPS.includes(han as never))
    throw new Error('Bad setup');
  return [cho, han];
}

export function feats(s: JanggiState, seat: 0 | 1) {
  const last = s.notation[s.notation.length - 1] ?? '';
  const mated =
    s.result?.kind === 'win' && s.result.reason === 'checkmate' && s.result.winner === seat;
  return {
    cannonMate: mated && last.startsWith('C'),
    pointsWin: s.result?.kind === 'win' && s.result.reason === 'points' && s.result.winner === seat,
  };
}
