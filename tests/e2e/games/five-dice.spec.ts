import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Five Dice: roll, hold, take a hint and score a box', async ({ page }) => {
  await freshStart(page, '/game/five-dice?deal=5');
  await page.getByTestId('fd-count-1').click();
  await page.getByTestId('fd-start').click();
  await page.getByTestId('fd-roll').click();
  await page.getByTestId('fd-die-0').click();
  await expect(page.getByTestId('fd-die-0')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('fd-roll').click();
  await page.getByTestId('fd-hint').click();
  await expect(page.getByTestId('fd-message')).toContainText('Suggested');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'five-dice');
  await page.getByTestId('fd-box-chance').click();
  await expect(page.getByTestId('fd-message')).toContainText('in Chance');
  await expect(page.getByTestId('fd-total-0')).not.toHaveText('0');
});

test('Five Dice: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/five-dice?mode=watch&deal=3');
  await expect(page.getByTestId('fd-message')).toContainText('scores', { timeout: 10_000 });
});
