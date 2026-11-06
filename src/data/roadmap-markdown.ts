import {
  CATEGORY_NAMES,
  ROADMAP,
  type CategoryId,
  type PartStatus,
  type RoadmapEntry,
} from './roadmap';

const PART: Record<PartStatus, string> = { none: '—', partial: '◐', done: '✔' };

/** Renders ROADMAP.md from src/data/roadmap.ts. Never edit ROADMAP.md by hand. */
export function renderRoadmapMarkdown(entries: readonly RoadmapEntry[] = ROADMAP): string {
  const count = (status: RoadmapEntry['status']) =>
    entries.filter((e) => e.status === status).length;
  const lines: string[] = [
    '# Arcade AI Lab — 200-Game Roadmap',
    '',
    '<!-- GENERATED FILE: edit src/data/roadmap.ts and run `npm run roadmap`. -->',
    '',
    `**Complete:** ${count('COMPLETE')} / ${entries.length} · **In progress:** ${count('IN_PROGRESS')} · **Testing:** ${count('TESTING')} · **Blocked:** ${count('BLOCKED')} · **To do:** ${count('TODO')}`,
    '',
    'Status values: `TODO`, `IN_PROGRESS`, `TESTING`, `COMPLETE`, `BLOCKED`. Part columns: ✔ done, ◐ partial, — not started.',
    'A game is COMPLETE only when it meets [docs/game-standards.md](docs/game-standards.md).',
    '',
  ];
  const categories = [...new Set(entries.map((e) => e.category))] as CategoryId[];
  for (const category of categories) {
    lines.push(`## ${CATEGORY_NAMES[category]}`, '');
    lines.push(
      '| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |',
    );
    lines.push('|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|');
    for (const e of entries.filter((x) => x.category === category)) {
      lines.push(
        `| ${String(e.number).padStart(3, '0')} | ${e.name} | \`${e.id}\` | ${e.status} | ${PART[e.engine]} | ${PART[e.graphics]} | ${PART[e.content]} | ${PART[e.tests]} | ${PART[e.ai]} | ${e.completed ?? ''} | ${e.issues ?? ''} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
