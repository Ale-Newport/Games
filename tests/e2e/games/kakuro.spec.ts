import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Kakuro: solve with hints', async ({ page }) => {
  await freshStart(page, '/game/kakuro?deal=7');
  await page.getByTestId('kakuro-start').click();
  await expect(page.getByTestId('kakuro-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'kakuro');
  for (let i = 0; i < 60; i++) {
    if (await page.getByTestId('kakuro-again').isVisible()) break;
    await page.getByTestId('kakuro-hint').click();
    await page.getByTestId('kakuro-fill').click();
  }
  await expect(page.getByTestId('kakuro-message')).toContainText('Solved in');
});

test('Kakuro: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/kakuro?mode=watch');
  await expect(page.getByTestId('kakuro-message')).toContainText('The AI', { timeout: 8000 });
});
