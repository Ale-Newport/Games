import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  waitForStoredProfile,
} from './helpers';

test('home shows available games and progress', async ({ page }) => {
  await freshStart(page);
  await expect(page.getByRole('heading', { name: 'Arcade AI Lab' })).toBeVisible();
  await expect(page.getByTestId('game-card-tic-tac-toe').first()).toBeVisible();
  await expect(page.getByText(/of 200 games available/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'home');
});

test('library search and category filters', async ({ page }) => {
  await freshStart(page, '/library');
  await expect(page.getByTestId('game-card-tic-tac-toe')).toBeVisible();
  await page.getByLabel('Search games').fill('noughts');
  await expect(page.getByTestId('game-card-tic-tac-toe')).toBeVisible();
  await page.getByLabel('Search games').fill('zzzz');
  await expect(page.getByText('No games match these filters.')).toBeVisible();
  await page.getByLabel('Search games').fill('');
  await page.getByRole('button', { name: 'Cards & Solitaire' }).click();
  await expect(page.getByTestId('game-card-tic-tac-toe')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('roadmap dashboard reflects the real 200-game roadmap', async ({ page }) => {
  await freshStart(page, '/roadmap');
  const counts = await Promise.all(
    ['COMPLETE', 'IN_PROGRESS', 'TESTING', 'TODO', 'BLOCKED'].map(async (s) =>
      Number(await page.getByTestId(`roadmap-count-${s}`).textContent()),
    ),
  );
  expect(counts.reduce((a, b) => a + b, 0)).toBe(200);
  await expect(page.getByRole('row')).toHaveCount(201);
});

test('direct navigation and refresh of a game URL work (hash routing)', async ({ page }) => {
  await freshStart(page, '/game/tic-tac-toe');
  await expect(page.getByTestId('mnk-menu')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('mnk-menu')).toBeVisible();
  await page.goto('./#/no-such-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('settings switch language and theme and persist', async ({ page }) => {
  await freshStart(page, '/settings');
  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
  await page.getByRole('button', { name: 'Claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('favorites persist across reloads', async ({ page }) => {
  await freshStart(page, '/library');
  await page
    .getByTestId('game-card-tic-tac-toe')
    .getByRole('button', { name: 'Add to favorites' })
    .click();
  await waitForStoredProfile(page, "p.favorites.includes('tic-tac-toe')");
  await page.reload();
  await expect(
    page
      .getByTestId('game-card-tic-tac-toe')
      .getByRole('button', { name: 'Remove from favorites' }),
  ).toBeVisible();
  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();
});

test('AI Lab runs a real evaluation in a worker and stores it in history', async ({ page }) => {
  await freshStart(page, '/ai-lab');
  await page.getByTestId('agent-a').selectOption('perfect');
  await page.getByTestId('agent-b').selectOption('random');
  await page.getByLabel('Games').selectOption('10');
  await page.getByTestId('run-evaluation').click();
  const report = page.getByTestId('evaluation-report');
  await expect(report).toBeVisible({ timeout: 20_000 });
  const perfectRow = report.getByRole('row').nth(1);
  await expect(perfectRow).toContainText('Perfect');
  // Perfect never loses: its losses column must be 0.
  await expect(perfectRow.getByRole('cell').nth(3)).toHaveText('0');
  await expect(page.getByText('Evaluation history')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'tic-tac-toe v1.0.0' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'ai-lab');
});
