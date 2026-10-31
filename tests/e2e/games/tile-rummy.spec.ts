import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Tile Rummy: move tiles, take a hint, play or draw', async ({ page }) => {
  await freshStart(page, '/game/tile-rummy?deal=2');
  await page.getByTestId('tr-start').click();
  const first = page.locator('[data-testid^="tr-rack-"]').first();
  await first.click();
  await page.getByTestId('tr-new-set').click();
  await expect(page.getByTestId('tr-set-0')).toBeVisible();
  await page.getByTestId('tr-reset').click();
  await page.getByTestId('tr-hint').click();
  await expect(page.getByTestId('tr-message')).toContainText('Suggested');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'tile-rummy');
  if (await page.getByTestId('tr-play').isEnabled()) await page.getByTestId('tr-play').click();
  else await page.getByTestId('tr-draw').click();
  await expect(page.getByTestId('tr-player-1')).toHaveClass(/current/);
});

test('Tile Rummy: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/tile-rummy?mode=watch&deal=5');
  await expect(page.getByTestId('tr-message')).toContainText(/plays|draws/, { timeout: 10000 });
});
