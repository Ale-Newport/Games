import { writeFileSync } from 'node:fs';
import { renderRoadmapMarkdown } from '../src/data/roadmap-markdown';

writeFileSync(new URL('../ROADMAP.md', import.meta.url), renderRoadmapMarkdown());
console.log('ROADMAP.md regenerated.');
