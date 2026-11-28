/**
 * Builds `src/games/one-star-landmarks/landmarks.json` for One-Star Landmarks (#240) from the
 * Wikidata download (tools/fetch-landmarks.ts, data CC0) and the written reviews.
 *
 * Rules: one coordinate per place (preferred rank, else the first statement); names from the
 * English / Spanish labels (falling back to the language-neutral label), with a few overrides for
 * the names people actually use; a region from the review's country; every reviewed place must be
 * found, or the build stops.
 *
 *   npx tsx tools/generate-landmarks.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REVIEWS } from '../src/games/one-star-landmarks/reviews';

const root = join(import.meta.dirname, '..');
const rows = (
  JSON.parse(readFileSync(join(root, '.cache', 'wikidata', 'landmarks-items.json'), 'utf8')) as {
    results: { bindings: Record<string, { value: string } | undefined>[] };
  }
).results.bindings;
const out = join(root, 'src', 'games', 'one-star-landmarks', 'landmarks.json');

/** Common names where Wikidata's label is the formal one. */
const NAMES: Record<string, [string, string]> = {
  Q48435: ['Sagrada Família', 'Sagrada Familia'],
  Q550: ['Champs-Élysées', 'Campos Elíseos'],
  Q42798: ['Borobudur', 'Borobudur'],
  Q62939: ['Burj Al Arab', 'Burj Al Arab'],
  Q28471: ['El Escorial', 'Monasterio de El Escorial'],
  Q11812902: ['Serengeti', 'Serengueti'],
  Q130958: ['Great Sphinx of Giza', 'Gran Esfinge de Guiza'],
  Q745608: ['Las Vegas Strip', 'Las Vegas Strip'],
};

const REGIONS: Record<string, string> = {};
const region = (r: string, countries: string) =>
  countries.split(',').forEach((c) => (REGIONS[c.trim()] = r));
region(
  'europe',
  'France, Italy, United Kingdom, Spain, Germany, Greece, Russia, Vatican City, Switzerland, Czech Republic, Austria, Croatia, Belgium, Portugal, Denmark, Ireland, Iceland, Turkey',
);
region(
  'americas',
  'United States, Canada, Mexico, Peru, Brazil, Argentina, Venezuela, Guatemala, Chile, Bolivia, Panama',
);
region(
  'asia',
  'China, India, Japan, Cambodia, Indonesia, Malaysia, Taiwan, Myanmar, United Arab Emirates, Iran, Jordan, Singapore, Nepal, Israel',
);
region('africa-oceania', 'Egypt, Tanzania, Zambia, Zimbabwe, Morocco, South Africa, Australia');

type Out = [
  qid: string,
  en: string,
  es: string,
  lat: number,
  lon: number,
  region: string,
  fame: number,
  about: string,
];
const result: Out[] = [];
for (const [qid, review] of Object.entries(REVIEWS)) {
  const rs = rows.filter((r) => r.item?.value.endsWith(`/${qid}`));
  if (!rs.length) throw new Error(`No Wikidata row for ${qid}`);
  const best = rs.find((r) => r.rank?.value.endsWith('PreferredRank')) ?? rs[0]!;
  const m = /point\(([-\d.eE]+) ([-\d.eE]+)\)/i.exec(best.coord!.value);
  if (!m) throw new Error(`Bad coordinate for ${qid}: ${best.coord?.value}`);
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  const en = NAMES[qid]?.[0] ?? best.en?.value ?? best.mul?.value;
  const es = NAMES[qid]?.[1] ?? best.es?.value ?? best.mul?.value ?? en;
  if (!en || !es) throw new Error(`No name for ${qid}`);
  const first = review.country[0].split('/')[0]!.trim();
  const reg = REGIONS[first];
  if (!reg) throw new Error(`No region for ${first} (${qid})`);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  result.push([
    qid,
    cap(en),
    cap(es),
    +lat.toFixed(4),
    +lon.toFixed(4),
    reg,
    Number(best.sl!.value),
    best.den?.value ?? '',
  ]);
}
result.sort((a, b) => a[1].localeCompare(b[1], 'en'));
const names = new Set(result.map((r) => r[1].toLowerCase()));
if (names.size !== result.length) throw new Error('Two places share an English name');
writeFileSync(out, JSON.stringify(result));
const per: Record<string, number> = {};
for (const r of result) per[r[5]] = (per[r[5]] ?? 0) + 1;
console.log(result.length, 'places', per);
