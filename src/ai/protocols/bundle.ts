import type { LocalizedText } from '../../core/i18n';
import type { Agent } from '../agents/types';
import type { GameEnvironment } from './types';

export type AgentKind = 'random' | 'heuristic' | 'search' | 'mcts' | 'solver' | 'learned';

/** A ready-to-use agent configuration for one game (e.g. the game's "Hard" computer opponent). */
export interface AgentPreset<S, A> {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  kind: AgentKind;
  create(): Agent<S, A>;
}

/** Everything AI tooling needs for one game. Must not import React, CSS or assets. */
export interface AiBundle<S, A> {
  env: GameEnvironment<S, A>;
  agents: AgentPreset<S, A>[];
  /** Id of an agent that plays perfectly (exact solver), if one exists. */
  exactOracleId?: string;
}
