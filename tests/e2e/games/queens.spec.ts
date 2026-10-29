import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Royal Regions: cross, crown, and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/queens?deal=9');
  await page.getByTestId('qn-start').click();
  const board = page.getByTestId('qn-board');
  await board.locator('[data-cell="0"]').click();
  await expect(board.locator('[data-cell="0"]')).toHaveAttribute('data-mark', '1');
  await board.locator('[data-cell="0"]').click();
  await expect(board.locator('[data-cell="0"]')).toHaveAttribute('data-mark', '2');
  await page.getByTestId('qn-undo').click();
  await page.getByTestId('qn-undo').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'queens');
  for (let i = 0; i < 80; i++) {
    if (await page.getByTestId('qn-again').isVisible()) break;
    await page.getByTestId('qn-hint').click();
    if (await page.getByTestId('qn-fill').isVisible()) await page.getByTestId('qn-fill').click();
  }
  await expect(page.getByTestId('qn-message')).toContainText('Solved in');
});

test('Royal Regions: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/queens?mode=watch&deal=4');
  await expect(page.getByTestId('qn-board').locator('[data-mark="2"]').first()).toBeVisible({
    timeout: 10_000,
  });
});
