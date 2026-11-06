import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test("Wythoff's Game: take from both heaps, then the CPU replies", async ({ page }) => {
  await freshStart(page, '/game/wythoff');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  const a = await page.locator('[data-counter^="0-"]').count();
  const b = await page.locator('[data-counter^="1-"]').count();
  await page.getByTestId('both').check();
  await page.locator(`[data-counter="0-${a - 3}"]`).click();
  await expect(page.getByTestId('take')).toHaveText('Take 3 from both');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'wythoff');
  await page.getByTestId('take').click();
  await expect(page.locator('[data-counter^="0-"]')).toHaveCount(a - 3);
  await expect(page.locator('[data-counter^="1-"]')).toHaveCount(b - 3);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-counter][aria-disabled="false"]').last().click();
  await page.getByTestId('take').click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|wins|win/, {
    timeout: 8000,
  });
});
