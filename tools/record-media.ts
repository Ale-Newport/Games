/**
 * Records the README media from the real production build:
 *   docs/media/demo.gif            the animated demo at the top of README.md
 *   docs/media/screenshot-*.png    README screenshots
 *   docs/media/social-preview.png  GitHub social preview (1280×640)
 *   public/og-image.png            the same image, served for Open Graph / Twitter cards
 *
 * Usage: npm run build && npm run media   (needs ffmpeg on PATH and `npx playwright install chromium`)
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const OUT = 'docs/media';
const VIEWPORT = { width: 1200, height: 750 };

const settings = {
  schema: 1,
  savedAt: 0,
  data: {
    theme: 'dark',
    locale: 'en',
    sound: false,
    volume: 0.5,
    motion: 'full',
    colorblind: false,
  },
};

async function startPreview() {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return server;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  server.kill();
  throw new Error('vite preview did not start (run `npm run build` first)');
}

async function prepare(page: Page) {
  await page.addInitScript((s) => {
    localStorage.setItem('aal.settings', JSON.stringify(s));
  }, settings);
}

const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function go(page: Page, hash: string) {
  await page.goto(`${BASE}#${hash}`);
  await page.waitForLoadState('networkidle');
  // Games are lazy chunks: wait for the game itself, not its loading screen.
  await page.getByText('Loading game').waitFor({ state: 'hidden', timeout: 15_000 });
  // Two-player games open on their menu; watch mode starts with one click.
  const start = page.getByTestId('start-match');
  if (hash.includes('mode=watch') && (await start.isVisible())) await start.click();
}

/** The demo: library → AI playing several genres → AI Lab evaluation. */
async function recordDemo(videoDir: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: videoDir, size: VIEWPORT },
  });
  const page = await context.newPage();
  await prepare(page);

  await go(page, '/');
  await wait(page, 1500);
  await go(page, '/library');
  await wait(page, 700);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 260);
    await wait(page, 260);
  }
  await wait(page, 400);

  for (const [hash, ms] of [
    ['/game/klondike-draw-1?mode=watch', 3200],
    ['/game/chess?mode=watch', 3600],
    ['/game/asteroids?mode=watch&deal=5', 2800],
    ['/game/backgammon?mode=watch&deal=5', 2800],
  ] as const) {
    await go(page, hash);
    await wait(page, ms);
  }

  await go(page, '/ai-lab');
  await page.getByTestId('agent-a').selectOption('perfect');
  await page.getByTestId('agent-b').selectOption('random');
  await page.getByTestId('lab-games').selectOption('10');
  await wait(page, 500);
  await page.getByTestId('run-evaluation').click();
  await page.getByTestId('evaluation-report').waitFor({ timeout: 30_000 });
  await page.getByTestId('evaluation-report').scrollIntoViewIfNeeded();
  await wait(page, 2200);

  await context.close();
  await browser.close();
  const [video] = readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (!video) throw new Error('no video recorded');
  return join(videoDir, video);
}

function toGif(video: string, gif: string) {
  // Drop the blank first frames, then a two-pass palette for clean colors at a small size.
  const filters = 'fps=10,scale=760:-1:flags=lanczos';
  const palette = join(tmpdir(), 'arcade-palette.png');
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-ss',
    '0.6',
    '-i',
    video,
    '-vf',
    `${filters},palettegen=max_colors=128:stats_mode=diff`,
    palette,
  ]);
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-ss',
    '0.6',
    '-i',
    video,
    '-i',
    palette,
    '-lavfi',
    `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    gif,
  ]);
  rmSync(palette, { force: true });
}

async function screenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await prepare(page);
  const shots: [string, string, number][] = [
    ['home', '/', 800],
    ['library', '/library', 800],
    ['chess', '/game/chess?mode=watch', 6000],
    ['solitaire', '/game/spider-2-suits?mode=watch', 3500],
    ['arcade', '/game/invaders?mode=watch&deal=5', 3000],
    ['puzzle', '/game/nonogram?mode=watch', 3000],
  ];
  for (const [name, hash, ms] of shots) {
    await go(page, hash);
    await wait(page, ms);
    await page.screenshot({ path: `${OUT}/screenshot-${name}.png` });
  }
  await go(page, '/ai-lab');
  await page.getByTestId('agent-a').selectOption('perfect');
  await page.getByTestId('agent-b').selectOption('random');
  await page.getByTestId('lab-games').selectOption('10');
  await page.getByTestId('run-evaluation').click();
  await page.getByTestId('evaluation-report').waitFor({ timeout: 30_000 });
  await wait(page, 500);
  await page.screenshot({ path: `${OUT}/screenshot-ai-lab.png`, fullPage: false });
  await browser.close();
}

/** Social preview: the real preview art of 18 games around the title. */
async function socialPreview() {
  const ids = [
    'chess',
    'go-19x19',
    'klondike-draw-1',
    'asteroids',
    'sokoban',
    'backgammon',
    'twisty-cube-3x3',
    'four-in-a-row',
    'snake',
    'mahjong-solitaire',
    'nonogram',
    'texas-holdem',
    'platformer',
    'reversi-8x8',
    'game-2048',
    'shogi',
    'invaders',
    'word-guess',
  ];
  const art = ids.map(
    (id) =>
      `data:image/svg+xml;base64,${readFileSync(`src/games/${id}/assets/preview.svg`).toString('base64')}`,
  );
  const fonts = (pkg: string, file: string) =>
    `data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64')}`;
  const html = `<!doctype html><html><head><style>
    @font-face { font-family: 'Press Start 2P'; src: url(${fonts('press-start-2p', 'press-start-2p-latin-400-normal.woff2')}); }
    @font-face { font-family: 'Chakra Petch'; font-weight: 600; src: url(${fonts('chakra-petch', 'chakra-petch-latin-600-normal.woff2')}); }
    * { box-sizing: border-box; margin: 0; }
    body { width: 1280px; height: 640px; overflow: hidden; background: #0b0616; font-family: 'Chakra Petch'; }
    .grid { position: absolute; inset: -30px; display: grid; grid-template-columns: repeat(6, 1fr);
      gap: 18px; padding: 18px; transform: rotate(-4deg) scale(1.08); opacity: .5; }
    .grid img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px;
      border: 2px solid #3b2a6b; }
    .veil { position: absolute; inset: 0; background: radial-gradient(ellipse at center,
      rgba(11,6,22,.96) 0%, rgba(11,6,22,.9) 42%, rgba(11,6,22,.35) 100%); }
    .card { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center; color: #f4ecff; gap: 26px; }
    h1 { font-family: 'Press Start 2P'; font-size: 64px; letter-spacing: 2px;
      text-shadow: 4px 4px 0 #ff3d8b, -3px -2px 0 #2de2e6; }
    p { font-size: 34px; color: #d9cdf5; }
    .chips { display: flex; gap: 14px; }
    .chips span { font-size: 22px; padding: 8px 18px; border-radius: 999px; border: 2px solid #ff3d8b;
      color: #fff; background: rgba(255,61,139,.15); }
  </style></head><body>
    <div class="grid">${[...art, ...art].map((src) => `<img src="${src}">`).join('')}</div>
    <div class="veil"></div>
    <div class="card">
      <h1>ARCADE AI LAB</h1>
      <p>230 fully playable browser games &middot; one AI research interface</p>
      <div class="chips"><span>Open source</span><span>No sign-up</span><span>TypeScript</span><span>Play free</span></div>
    </div>
  </body></html>`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/social-preview.png` });
  await page.screenshot({ path: 'public/og-image.png' });
  await browser.close();
}

mkdirSync(OUT, { recursive: true });
const server = await startPreview();
try {
  const videoDir = mkdtempSync(join(tmpdir(), 'arcade-demo-'));
  const video = await recordDemo(videoDir);
  toGif(video, `${OUT}/demo.gif`);
  rmSync(videoDir, { recursive: true, force: true });
  await screenshots();
  await socialPreview();
  console.log(`Media written to ${OUT}/ and public/og-image.png`);
} finally {
  server.kill();
}
