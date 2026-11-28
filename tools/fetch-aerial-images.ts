/**
 * Downloads the aerial photographs of Aerial Eye (#242) from Wikimedia Commons — a 640 px
 * thumbnail per file plus its author, licence and file page (Commons hosts only freely licensed
 * media) — shrinks them to 380 px JPEGs (macOS `sips`) in `src/games/aerial-eye/images/`, writes
 * the credits to `src/games/aerial-eye/credits.json`, and adds each photo's colour features
 * (mean RGB of a 3 × 3 grid, measured with Python Pillow) to `places.json`. Places whose photo
 * cannot be fetched are removed.
 *
 *   npx tsx tools/fetch-aerial-images.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const game = join(root, 'src', 'games', 'aerial-eye');
const cache = join(root, '.cache', 'commons-aerial');
const outDir = join(game, 'images');
mkdirSync(cache, { recursive: true });
mkdirSync(outDir, { recursive: true });

const UA = { 'User-Agent': 'arcade-games-data-builder/1.0 (offline dataset build)' };
type Row = (string | number | number[])[];
const places = JSON.parse(readFileSync(join(game, 'places.json'), 'utf8')) as Row[];

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
for (let i = 0; i < places.length; i += 40) {
  const batch = places.slice(i, i + 40);
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '640',
    titles: batch.map((p) => `File:${String(p[9])}`).join('|'),
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
    const title = (norm.get(p.title) ?? p.title).replace(/^File:/, '').replace(/_/g, ' ');
    infos.set(title, {
      thumb: ii.thumburl,
      page: ii.descriptionurl,
      artist: strip(m.Artist?.value) || 'Unknown author',
      license: strip(m.LicenseShortName?.value),
      licenseUrl: m.LicenseUrl?.value ?? '',
    });
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const credits: Record<
  string,
  { file: string; page: string; artist: string; license: string; licenseUrl: string }
> = {};
const kept: Row[] = [];
for (const p of places) {
  const qid = String(p[0]);
  const file = String(p[9]);
  const info = infos.get(file);
  // A licence is required: no licence name, no picture.
  if (!info || !info.license) continue;
  const raw = join(cache, `${qid}.img`);
  const jpg = join(outDir, `${qid}.jpg`);
  if (!existsSync(raw)) {
    const res = await fetch(info.thumb, { headers: UA });
    if (!res.ok) continue;
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!existsSync(jpg)) {
    try {
      execFileSync(
        'sips',
        ['-Z', '380', '-s', 'format', 'jpeg', '-s', 'formatOptions', '62', raw, '--out', jpg],
        { stdio: 'ignore' },
      );
    } catch {
      continue;
    }
  }
  credits[qid] = {
    file,
    page: info.page,
    artist: info.artist.slice(0, 120),
    license: info.license,
    licenseUrl: info.licenseUrl,
  };
  kept.push(p.slice(0, 10));
}

// Colour features: mean RGB of each cell of a 3 × 3 grid (27 numbers, 0–255).
const PY = `
import json, sys
from PIL import Image
out = {}
for path in sys.argv[1:]:
    im = Image.open(path).convert('RGB').resize((3, 3), Image.Resampling.BOX)
    out[path.rsplit('/', 1)[-1][:-4]] = [c for px in im.getdata() for c in px]
print(json.dumps(out))
`;
const files = kept.map((p) => join(outDir, `${String(p[0])}.jpg`));
const colours = JSON.parse(
  execFileSync('python3', ['-I', '-c', PY, ...files], { encoding: 'utf8', maxBuffer: 1 << 24 }),
) as Record<string, number[]>;
const rows = kept.filter((p) => colours[String(p[0])]).map((p) => [...p, colours[String(p[0])]!]);
writeFileSync(join(game, 'places.json'), JSON.stringify(rows));
writeFileSync(join(game, 'credits.json'), JSON.stringify(credits, null, 1) + '\n');
for (const f of readdirSync(outDir))
  if (f.endsWith('.jpg') && !credits[f.slice(0, -4)]) rmSync(join(outDir, f));
console.log(rows.length, 'pictures of', places.length);
