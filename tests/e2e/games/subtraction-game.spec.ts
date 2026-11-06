import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Subtraction Game: take up to three, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/subtraction-game');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  const heap = page.locator('[data-counter^="0-"]');
  const n = await heap.count();
  await expect(page.locator('[data-counter][aria-disabled="false"]')).toHaveCount(3);
  await page.locator(`[data-counter="0-${n - 2}"]`).click();
  await expect(page.getByTestId('take')).toHaveText('Take 2 from A');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'subtraction-game');
  await page.getByTestId('take').click();
  await expect(heap).toHaveCount(n - 2);
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
