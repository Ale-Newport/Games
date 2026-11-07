/** 8-Puzzle levels on the shared sliding-puzzle core (`../shared/sliding`). */
import type { SlideSpec } from '../shared/sliding/play';

export * from '../shared/sliding/engine';
export * from '../shared/sliding/play';

export const SPECS: Record<string, SlideSpec> = {
  easy: { size: 3, walk: 12 },
  medium: { size: 3, walk: 40 },
  hard: { size: 3 },
};
