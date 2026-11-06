/** Two-player shell definition builder for the Morris family (#030–#032). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import type { MorrisState, MorrisVariant } from './engine';
import { morrisTwoPlayerRules } from './environment';
import { MORRIS_STRINGS } from './i18n';
import { createMorrisBoard, MorrisSeatIcon } from './MorrisBoard';

const PLACE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.24, lowpass: 2000 },
  { wave: 'sine', freq: 300, freqEnd: 220, duration: 0.06, gain: 0.12 },
];
const MILL: SoundSpec = [
  { wave: 'triangle', freq: 523, duration: 0.09, gain: 0.18 },
  { wave: 'triangle', freq: 784, duration: 0.16, delay: 0.08, gain: 0.18 },
];

export interface MorrisGameOptions {
  variant: MorrisVariant;
  env: GameEnvironment<MorrisState, string>;
  agents: AgentPreset<MorrisState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  onRoundEnd?: (event: RoundEndEvent<MorrisState>) => void;
}

const RESULT_KEYS: Record<string, string> = {
  'two-pieces': 'result.twoPieces',
  blocked: 'result.blocked',
  mill: 'result.mill',
  repetition: 'result.repetition',
  quiet: 'result.quiet',
};

export function createMorrisDefinition(
  o: MorrisGameOptions,
): TwoPlayerGameDefinition<MorrisState, string> {
  const v = o.variant;
  const pieces = (s: MorrisState, seat: 0 | 1) => s.board.filter((x) => x === seat + 1).length;
  return {
    match: {
      rules: morrisTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      // White always places first; players choose a color.
      fixedFirstSeat: 0,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...MORRIS_STRINGS.en, ...o.strings.en },
      es: { ...MORRIS_STRINGS.es, ...o.strings.es },
    },
    Board: createMorrisBoard(v),
    SeatIcon: MorrisSeatIcon,
    hintAgent: o.hintAgent,
    resignable: true,
    describeAction: (before, a, _after, t) =>
      t('announce.move', { seat: t(`seat.${before.toMove}`), move: a }),
    actionSound: (_after, a) => (a.includes('x') ? MILL : PLACE),
    statusInfo: (s, t) => {
      if (s.result) return null;
      if (s.inHand[0] + s.inHand[1] > 0) return t('info.place', { a: s.inHand[0], b: s.inHand[1] });
      const seat = s.toMove;
      if (v.flying && pieces(s, seat) === 3) return t('info.fly', { seat: t(`seat.${seat}`) });
      return t('info.move', { a: pieces(s, 0), b: pieces(s, 1) });
    },
    describeResult: (s, t) => {
      const r = s.result;
      if (!r) return null;
      const key = RESULT_KEYS[r.reason]!;
      if (r.kind === 'draw') return t(key);
      return t(key, { seat: t(`seat.${r.reason === 'mill' ? r.winner : 1 - r.winner}`) });
    },
    onRoundEnd: o.onRoundEnd,
  };
}
