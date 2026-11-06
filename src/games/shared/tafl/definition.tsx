/** Two-player shell definition builder for the tafl games (#055–#056). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import type { TaflState, TaflVariant } from './engine';
import { taflTwoPlayerRules } from './environment';
import { TAFL_STRINGS } from './i18n';
import { KingPiece, createTaflBoard, squareName } from './TaflBoard';

const SLIDE: SoundSpec = [{ wave: 'triangle', freq: 300, freqEnd: 380, duration: 0.09, gain: 0.1 }];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.08, gain: 0.2, lowpass: 2200 },
  { wave: 'triangle', freq: 260, freqEnd: 180, duration: 0.12, gain: 0.12 },
];

const pieces = (s: TaflState) => s.board.filter(Boolean).length;

export interface TaflGameOptions {
  variant: TaflVariant;
  env: GameEnvironment<TaflState, string>;
  agents: AgentPreset<TaflState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  onRoundEnd?: (event: RoundEndEvent<TaflState>) => void;
}

export function createTaflDefinition(
  o: TaflGameOptions,
): TwoPlayerGameDefinition<TaflState, string> {
  const v = o.variant;
  return {
    match: {
      rules: taflTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: 'medium',
      defaultWatch: ['hard', 'medium'],
      // The attackers always move first; players pick a side in the menu.
      fixedFirstSeat: 0,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...TAFL_STRINGS.en, ...o.strings.en },
      es: { ...TAFL_STRINGS.es, ...o.strings.es },
    },
    Board: createTaflBoard(v),
    SeatIcon: ({ seat, size }) =>
      seat === 1 ? (
        <span style={{ display: 'inline-grid', width: size + 4, height: size + 4 }}>
          <KingPiece />
        </span>
      ) : (
        <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="#2a221b" stroke="#8a6d3b" strokeWidth="1.2" />
        </svg>
      ),
    badge: `${v.size}×${v.size}`,
    wideLayout: v.size >= 11,
    hintAgent: 'medium',
    resignable: true,
    statusInfo: (s, t) => (s.result ? null : t(`info.goal.${s.toMove}`)),
    describeAction: (before, a, after, t) => {
      const [f, to] = a.split('-').map(Number) as [number, number];
      const n = pieces(before) - pieces(after);
      const args = {
        seat: t(`seat.${before.toMove}`),
        from: squareName(v, f),
        to: squareName(v, to),
        n,
      };
      return t(n ? 'announce.capture' : 'announce.move', args);
    },
    actionSound: (after, _a, _mover, before) => (pieces(before) > pieces(after) ? CAPTURE : SLIDE),
    describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
    onRoundEnd: o.onRoundEnd,
  };
}
