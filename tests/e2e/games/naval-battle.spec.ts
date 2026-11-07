import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Naval Battle: random fleet, hinted shots, the computer replies', async ({ page }) => {
  await freshStart(page, '/game/naval-battle?deal=4');
  await page.getByTestId('nb-start').click();
  await page.getByTestId('nb-shuffle').click();
  await page.getByTestId('nb-begin').click();
  await page.getByTestId('nb-hint').click();
  await expect(page.getByTestId('nb-message')).toContainText('Suggested');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'naval-battle');
  await page.locator('[data-testid^="nb-enemy-"][class*="hinted"]').click();
  await expect(page.getByTestId('nb-message')).toContainText(/miss|hit|sunk/);
  // The computer fires back at your fleet.
  await expect(page.getByTestId('nb-message')).toContainText('Computer', { timeout: 5000 });
});

test('Naval Battle: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/naval-battle?mode=watch&deal=5');
  await expect(page.getByTestId('nb-message')).toContainText(/miss|hit|sunk/, { timeout: 8000 });
});
