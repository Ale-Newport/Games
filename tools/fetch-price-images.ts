/**
 * Downloads the Wikimedia Commons pictures of Price Check (#237) items: a 320 px thumbnail per
 * file plus its author, licence and file page (Commons hosts only freely licensed media). The
 * thumbnails are shrunk to 240 px JPEGs (macOS `sips`) into `src/games/price-check/images/`, and
 * the credits go to `src/games/price-check/credits.json` — shown with every picture.
 *
 *   npx tsx tools/fetch-price-images.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const game = join(root, 'src', 'games', 'price-check');
const cache = join(root, '.cache', 'commons');
const outDir = join(game, 'images');
mkdirSync(cache, { recursive: true });
mkdirSync(outDir, { recursive: true });

const UA = { 'User-Agent': 'arcade-games-data-builder/1.0 (offline dataset build)' };
const items = (JSON.parse(readFileSync(join(game, 'items.json'), 'utf8')) as { items: string[][] })
  .items;
const wanted = items.filter((i) => i[9]).map((i) => ({ id: i[0]!, file: i[9]! }));

const strip = (html = '') =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

interface Info {
  thumb: string;
  page: string;
  artist: string;
  license: string;
  licenseUrl: string;
}
const infos = new Map<string, Info>();
for (let i = 0; i < wanted.length; i += 40) {
  const batch = wanted.slice(i, i + 40);
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '320',
    titles: batch.map((b) => `File:${b.file}`).join('|'),
  }).toString();
  const res = (await (await fetch(url, { headers: UA })).json()) as {
    query: {
      normalized?: { from: string; to: string }[];
      pages: Record<
        string,
        {
          title: string;
          imageinfo?: {
            thumburl: string;
            descriptionurl: string;
            extmetadata: Record<string, { value: string }>;
          }[];
        }
      >;
    };
  };
  const norm = new Map((res.query.normalized ?? []).map((n) => [n.to, n.from]));
  for (const p of Object.values(res.query.pages)) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const m = ii.extmetadata;
    const title = norm.get(p.title) ?? p.title;
    infos.set(title.replace(/^File:/, ''), {
      thumb: ii.thumburl,
      page: ii.descriptionurl,
      artist: strip(m.Artist?.value) || 'Unknown author',
      license: strip(m.LicenseShortName?.value) || 'see file page',
      licenseUrl: m.LicenseUrl?.value ?? '',
    });
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const credits: Record<
  string,
  { file: string; page: string; artist: string; license: string; licenseUrl: string }
> = {};
let saved = 0;
for (const w of wanted) {
  const info = infos.get(w.file) ?? infos.get(w.file.replace(/_/g, ' '));
  if (!info) continue;
  const raw = join(cache, `${w.id}.img`);
  const jpg = join(outDir, `${w.id}.jpg`);
  if (!existsSync(raw)) {
    const res = await fetch(info.thumb, { headers: UA });
    if (!res.ok) continue;
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!existsSync(jpg)) {
    try {
      execFileSync(
        'sips',
        ['-Z', '240', '-s', 'format', 'jpeg', '-s', 'formatOptions', '70', raw, '--out', jpg],
        { stdio: 'ignore' },
      );
    } catch {
      continue;
    }
  }
  credits[w.id] = {
    file: w.file,
    page: info.page,
    artist: info.artist.slice(0, 120),
    license: info.license,
    licenseUrl: info.licenseUrl,
  };
  saved++;
}
writeFileSync(join(game, 'credits.json'), JSON.stringify(credits, null, 1) + '\n');
// Prune pictures of items no longer in the list (this tool's own output only).
for (const f of readdirSync(outDir))
  if (f.endsWith('.jpg') && !credits[f.slice(0, -4)]) rmSync(join(outDir, f));
console.log(saved, 'pictures of', wanted.length);
