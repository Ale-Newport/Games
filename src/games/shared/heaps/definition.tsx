/** Two-player shell definition builder for the heap games (#041–#044). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import type { HeapsState, HeapsVariant } from './engine';
import { heapsTwoPlayerRules } from './environment';
import { createHeapsBoard, heapLetter } from './HeapsBoard';
import { HEAPS_STRINGS } from './i18n';

const TAKE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.16, lowpass: 3200 },
  { wave: 'triangle', freq: 700, freqEnd: 520, duration: 0.08, gain: 0.1 },
];

export function HeapsSeatIcon({ seat, size }: { seat: 0 | 1; size: number }) {
  const [hi, lo] = seat === 0 ? ['#fff5d6', '#d9a441'] : ['#ffffff', '#9aa3b5'];
  return (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <defs>
        <radialGradient id={`heap-seat-${seat}`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor={hi} />
          <stop offset="1" stopColor={lo} />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="8" fill={`url(#heap-seat-${seat})`} />
    </svg>
  );
}

export interface HeapsGameOptions {
  variant: HeapsVariant;
  env: GameEnvironment<HeapsState, string>;
  agents: AgentPreset<HeapsState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  onRoundEnd?: (event: RoundEndEvent<HeapsState>) => void;
}

export function createHeapsDefinition(
  o: HeapsGameOptions,
): TwoPlayerGameDefinition<HeapsState, string> {
  return {
    match: {
      rules: heapsTwoPlayerRules(o.variant),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: 'medium',
      defaultWatch: ['hard', 'medium'],
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...HEAPS_STRINGS.en, ...o.strings.en },
      es: { ...HEAPS_STRINGS.es, ...o.strings.es },
    },
    Board: createHeapsBoard(o.variant),
    SeatIcon: HeapsSeatIcon,
    hintAgent: 'hard',
    resignable: true,
    drawless: true,
    describeAction: (before, a, _after, t) => {
      const [where, amount] = a.split(':');
      return where === 'b'
        ? t('announce.takeBoth', { seat: t(`seat.${before.toMove}`), amount: Number(amount) })
        : t('announce.take', {
            seat: t(`seat.${before.toMove}`),
            amount: Number(amount),
            letter: heapLetter(Number(where)),
          });
    },
    actionSound: () => TAKE,
    statusInfo: (s, t) => (s.result ? null : t('info.goal')),
    describeResult: (s, t) => {
      if (!s.result) return null;
      // The player who made the last move: the winner in normal play, the loser in misère.
      const lastMover = o.variant.misere ? ((1 - s.result.winner) as 0 | 1) : s.result.winner;
      return t(o.variant.misere ? 'result.misere' : 'result.normal', {
        seat: t(`seat.${lastMover}`),
      });
    },
    onRoundEnd: o.onRoundEnd,
  };
}
