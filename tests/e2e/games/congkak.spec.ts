import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Congkak: sow a pit, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/congkak');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-pit="1"]').click();
  await expect(page.locator('[data-pit="1"]')).toHaveAttribute(
    'aria-label',
    'South pit 2, 0 seeds',
  );
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'congkak');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-pit="1"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|sows again/, {
    timeout: 10000,
  });
});
