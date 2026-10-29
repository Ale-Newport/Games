/** Water Sort levels on the shared tube-sorting core (`../shared/sorting`): whole runs pour. */
import type { SortRules, SortSpec } from '../shared/sorting/engine';

export * from '../shared/sorting/engine';
export * from '../shared/sorting/play';

export const SPECS: Record<string, SortSpec> = {
  easy: { colors: 4, empty: 2, capacity: 4 },
  medium: { colors: 7, empty: 2, capacity: 4 },
  hard: { colors: 10, empty: 2, capacity: 4 },
  expert: { colors: 12, empty: 2, capacity: 4 },
};

export const rulesFor = (spec: SortSpec): SortRules => ({ capacity: spec.capacity, pourAll: true });
