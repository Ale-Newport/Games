import type { GameProps } from '../../core/game-engine/types';
import { CodeBreakerGame } from './CodeBreakerGame';

export function Game({ services }: GameProps) {
  return <CodeBreakerGame services={services} />;
}
