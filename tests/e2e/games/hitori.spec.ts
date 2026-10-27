import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hitori: solve with hints', async ({ page }) => {
  await freshStart(page, '/game/hitori?deal=7');
  await page.getByTestId('hitori-start').click();
  await expect(page.getByTestId('hitori-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hitori');
  await page.getByTestId('hitori-board').locator('[data-cell="0"]').click();
  await expect(page.getByTestId('hitori-board').locator('[data-cell="0"]')).toHaveAttribute(
    'data-mark',
    '2',
  );
  await page.getByTestId('hitori-undo').click();
  for (let i = 0; i < 40; i++) {
    if (await page.getByTestId('hitori-again').isVisible()) break;
    await page.getByTestId('hitori-hint').click();
    await page.getByTestId('hitori-fill').click();
  }
  await expect(page.getByTestId('hitori-message')).toContainText('Solved in');
});

test('Hitori: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/hitori?mode=watch');
  await expect(page.getByTestId('hitori-message')).toContainText('The AI', { timeout: 8000 });
});
