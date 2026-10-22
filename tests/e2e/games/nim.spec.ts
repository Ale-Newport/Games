import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Nim: take counters with a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/nim');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  const heap = page.locator('[data-counter^="0-"]');
  const n = await heap.count();
  await heap.first().click();
  await expect(page.getByTestId('take')).toHaveText(`Take ${n} from A`);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'nim');
  await page.getByTestId('take').click();
  await expect(heap).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  // Whoever starts, the human eventually gets a turn and can take one counter.
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  const any = page.locator('[data-counter][aria-disabled="false"]').last();
  await any.click();
  await page.getByTestId('take').click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|wins|win/, {
    timeout: 8000,
  });
});
