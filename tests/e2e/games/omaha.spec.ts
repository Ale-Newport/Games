import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Omaha: a full table, a hint, a call and the next hand', async ({ page }) => {
  await freshStart(page, '/game/omaha?deal=7');
  await page.getByTestId('poker-start').click();
  await expect(page.getByTestId('poker-seat-5')).toBeVisible();
  await expect(page.getByTestId('poker-call')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('poker-hint').click();
  await expect(page.getByTestId('poker-coach')).toContainText('Your chances');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'omaha');
  // Fold (or check) every turn until the hand ends, then deal the next one.
  for (let k = 0; k < 12 && !(await page.getByTestId('poker-next').isVisible()); k++) {
    const fold = page.getByTestId('poker-fold');
    if (await fold.isVisible()) await fold.click();
    else if (await page.getByTestId('poker-call').isVisible())
      await page.getByTestId('poker-call').click();
    await page.waitForTimeout(1200);
  }
  await page.getByTestId('poker-next').click({ timeout: 20000 });
  await expect(page.getByTestId('poker-hand')).toHaveText('2');
});

test('Omaha: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/omaha?mode=watch');
  await expect(page.getByTestId('poker-seat-0')).toBeVisible();
  await expect(page.getByTestId('poker-board').getByRole('img').first()).toBeVisible({
    timeout: 20000,
  });
});
