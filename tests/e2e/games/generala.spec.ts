import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Generala: roll, hold, take a hint and score a box', async ({ page }) => {
  await freshStart(page, '/game/generala?deal=5');
  await page.getByTestId('gn-count-1').click();
  await page.getByTestId('gn-start').click();
  await page.getByTestId('gn-roll').click();
  await page.getByTestId('gn-die-0').click();
  await expect(page.getByTestId('gn-die-0')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('gn-roll').click();
  await page.getByTestId('gn-hint').click();
  await expect(page.getByTestId('gn-message')).toContainText('Suggested');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'generala');
  await page.getByTestId('gn-box-sixes').click();
  await expect(page.getByTestId('gn-message')).toContainText('in Sixes');
  await expect(page.getByTestId('gn-box-sixes')).toHaveCount(0);
});

test('Generala: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/generala?mode=watch&deal=3');
  await expect(page.getByTestId('gn-message')).toContainText('scores', { timeout: 10_000 });
});
