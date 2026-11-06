/** Two-player shell definition builder for the hunt games (#057–#058). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import type { HuntState, HuntVariant } from './engine';
import { huntTwoPlayerRules } from './environment';
import { HuntPiece, createHuntBoard, pointName } from './HuntBoard';
import { HUNT_STRINGS } from './i18n';

const STEP: SoundSpec = [{ wave: 'triangle', freq: 520, freqEnd: 600, duration: 0.06, gain: 0.1 }];
const JUMP: SoundSpec = [
  { wave: 'triangle', freq: 300, freqEnd: 700, duration: 0.12, gain: 0.12 },
  { wave: 'noise', freq: 0, duration: 0.06, delay: 0.1, gain: 0.16, lowpass: 2400 },
];

export interface HuntGameOptions {
  variant: HuntVariant;
  tiger: boolean;
  env: GameEnvironment<HuntState, string>;
  agents: AgentPreset<HuntState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  onRoundEnd?: (event: RoundEndEvent<HuntState>) => void;
}

export function createHuntDefinition(
  o: HuntGameOptions,
): TwoPlayerGameDefinition<HuntState, string> {
  const v = o.variant;
  return {
    match: {
      rules: huntTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: 'medium',
      defaultWatch: ['hard', 'medium'],
      // The prey always move first; players pick a side in the menu.
      fixedFirstSeat: 0,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...HUNT_STRINGS.en, ...o.strings.en },
      es: { ...HUNT_STRINGS.es, ...o.strings.es },
    },
    Board: createHuntBoard(v, o.tiger),
    SeatIcon: ({ seat, size }) => (
      <svg width={size + 4} height={size + 4} viewBox="-4.5 -4.5 9 9" aria-hidden="true">
        <HuntPiece kind={seat === 0 ? 'prey' : 'hunter'} tiger={o.tiger} />
      </svg>
    ),
    hintAgent: 'medium',
    resignable: true,
    // When stalling counts for the hunters, no game can end drawn.
    drawless: v.stalled === 'hunters',
    statusInfo: (s, t) => {
      if (s.result) return null;
      if (s.chain !== null) return t('info.chain');
      return t(s.toMove === 0 && s.inHand > 0 ? 'info.place' : `info.goal.${s.toMove}`);
    },
    describeAction: (before, a, after, t) => {
      const seat = t(`seat.${before.toMove}`);
      if (a === 'stop') return t('announce.stop', { seat });
      if (a.startsWith('+'))
        return t('announce.place', { seat, to: pointName(v, Number(a.slice(1))) });
      const [f, to] = a.split('-').map(Number) as [number, number];
      const args = { seat, from: pointName(v, f), to: pointName(v, to) };
      return t(after.captured > before.captured ? 'announce.jump' : 'announce.move', args);
    },
    actionSound: (after, _a, _mover, before) => (after.captured > before.captured ? JUMP : STEP),
    describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
    onRoundEnd: o.onRoundEnd,
  };
}
