/** Two-player shell definition builder for the domino games (#047–#048). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import { createDominoBoard, cellName } from './DominoBoard';
import { cellsOf, type DominoState, type DominoVariant } from './engine';
import { dominoTwoPlayerRules } from './environment';
import { DOMINO_STRINGS } from './i18n';

const CLACK: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.2, lowpass: 3600 },
  { wave: 'triangle', freq: 880, freqEnd: 700, duration: 0.06, gain: 0.08 },
];

export function DominoSeatIcon({
  seat,
  size,
  vertical,
}: {
  seat: 0 | 1;
  size: number;
  vertical: boolean;
}) {
  const fill = seat === 0 ? '#2f6fd6' : '#e0603f';
  return (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      {vertical ? (
        <rect x="6" y="1" width="8" height="18" rx="2.5" fill={fill} />
      ) : (
        <rect x="1" y="6" width="18" height="8" rx="2.5" fill={fill} />
      )}
    </svg>
  );
}

export interface DominoGameOptions {
  variant: DominoVariant;
  env: GameEnvironment<DominoState, string>;
  agents: AgentPreset<DominoState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  onRoundEnd?: (event: RoundEndEvent<DominoState>) => void;
}

export function createDominoDefinition(
  o: DominoGameOptions,
): TwoPlayerGameDefinition<DominoState, string> {
  const v = o.variant;
  return {
    match: {
      rules: dominoTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: 'medium',
      defaultWatch: ['hard', 'medium'],
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...DOMINO_STRINGS.en, ...o.strings.en },
      es: { ...DOMINO_STRINGS.es, ...o.strings.es },
    },
    Board: createDominoBoard(v),
    SeatIcon: ({ seat, size }) => <DominoSeatIcon seat={seat} size={size} vertical={seat === 0} />,
    badge: `${v.rows}×${v.cols}`,
    hintAgent: 'medium',
    resignable: true,
    drawless: true,
    statusInfo: (s, t) => (s.result ? null : t(`info.goal.${s.toMove}`)),
    describeAction: (before, a, _after, t) => {
      const [p, q] = cellsOf(v, a)!;
      return t('announce.place', {
        seat: t(`seat.${before.toMove}`),
        a: cellName(v, p),
        b: cellName(v, q),
      });
    },
    actionSound: () => CLACK,
    describeResult: (s, t) =>
      s.result ? t('result.blocked', { seat: t(`seat.${1 - s.result.winner}`) }) : null,
    onRoundEnd: o.onRoundEnd,
  };
}
