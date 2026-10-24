import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Bao: choose a pit and a direction, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/bao');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-pit="1"]').click();
  await expect(page.locator('[data-pit="2"]')).toHaveAttribute('aria-label', /sow this way/);
  await page.locator('[data-pit="2"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText("Player 2's turn");
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'bao');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-pit="3"]').click();
  await page.getByTestId('sow+').or(page.getByTestId('sow-')).first().click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 15000 });
});
