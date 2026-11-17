import { writeFileSync } from 'node:fs';
import { renderRoadmapMarkdown } from '../src/data/roadmap-markdown';

writeFileSync(new URL('../docs/ROADMAP.md', import.meta.url), renderRoadmapMarkdown());
console.log('docs/ROADMAP.md regenerated.');
