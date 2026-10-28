import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Nurikabe: solve with hints', async ({ page }) => {
  await freshStart(page, '/game/nurikabe?deal=7');
  await page.getByTestId('nuri-start').click();
  await expect(page.getByTestId('nuri-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'nurikabe');
  await page.getByTestId('nuri-board').locator('[data-cell="0"]').click();
  await expect(page.getByTestId('nuri-board').locator('[data-cell="0"]')).toHaveAttribute(
    'data-mark',
    '2',
  );
  await page.getByTestId('nuri-undo').click();
  for (let i = 0; i < 40; i++) {
    if (await page.getByTestId('nuri-again').isVisible()) break;
    await page.getByTestId('nuri-hint').click();
    await page.getByTestId('nuri-fill').click();
  }
  await expect(page.getByTestId('nuri-message')).toContainText('Solved in');
});

test('Nurikabe: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/nurikabe?mode=watch');
  await expect(page.getByTestId('nuri-message')).toContainText('The AI', { timeout: 8000 });
});
