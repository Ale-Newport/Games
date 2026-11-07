import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Bridges: solve with hints', async ({ page }) => {
  await freshStart(page, '/game/hashiwokakero?deal=7');
  await page.getByTestId('hashi-start').click();
  await expect(page.getByTestId('hashi-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hashiwokakero');
  for (let i = 0; i < 60; i++) {
    if (await page.getByTestId('hashi-again').isVisible()) break;
    await page.getByTestId('hashi-hint').click();
    await page.getByTestId('hashi-fill').click();
  }
  await expect(page.getByTestId('hashi-message')).toContainText('Solved in');
});

test('Bridges: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/hashiwokakero?mode=watch');
  await expect(page.getByTestId('hashi-message')).toContainText('The AI', { timeout: 8000 });
});
