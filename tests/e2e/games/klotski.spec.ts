import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sliding Blocks: tap a block and a spot, undo, and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/klotski?deal=5');
  await page.getByTestId('kl-start').click();
  const board = page.getByTestId('kl-board');
  await expect(board).toBeVisible();
  const blocks = board.locator('[data-block]');
  const count = await blocks.count();
  for (let i = 0; i < count; i++) {
    await blocks.nth(i).click();
    if ((await board.locator('[data-target]').count()) > 0) break;
  }
  await board.locator('[data-target]').first().click();
  await expect(page.getByTestId('kl-moves')).toHaveText('Moves 1');
  await page.getByTestId('kl-undo').click();
  await expect(page.getByTestId('kl-moves')).toHaveText('Moves 0');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'klotski');
  for (let i = 0; i < 40; i++) {
    if (await page.getByTestId('kl-again').isVisible()) break;
    await page.getByTestId('kl-hint').click();
    await page.getByTestId('kl-apply').click();
  }
  await expect(page.getByTestId('kl-message')).toContainText('Out in');
});

test('Sliding Blocks: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/klotski?mode=watch&deal=2');
  await expect(page.getByTestId('kl-message')).toContainText('The AI moves', { timeout: 8000 });
});
