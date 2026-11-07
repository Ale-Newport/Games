/** 15-Puzzle levels on the shared sliding-puzzle core (`../shared/sliding`). */
import type { SlideSpec } from '../shared/sliding/play';

export * from '../shared/sliding/engine';
export * from '../shared/sliding/play';

export const SPECS: Record<string, SlideSpec> = {
  easy: { size: 4, walk: 30 },
  medium: { size: 4, walk: 70 },
  hard: { size: 4 },
};
