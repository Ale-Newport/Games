import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

// Lines cross inside the hexagon, so a line's center can sit under another line's touch area:
// clicks are dispatched on the line itself.
test('Sim: a closed triangle loses, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/sim');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const a of ['0-1', '3-4', '1-2', '3-5'])
    await page.locator(`[data-line="${a}"]`).dispatchEvent('click');
  await expect(page.locator('[data-line="0-2"]')).toHaveAttribute(
    'aria-label',
    'A–C, free — would close your triangle',
  );
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'sim');
  await page.locator('[data-line="0-2"]').dispatchEvent('click');
  await expect(page.getByTestId('mnk-status')).toContainText(/wins/);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-line][aria-label$=", free"]').first().dispatchEvent('click');
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
