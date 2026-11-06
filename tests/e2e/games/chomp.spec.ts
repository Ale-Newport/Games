import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Chomp: bite the bar, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/chomp');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.locator('[data-square="0,0"]')).toHaveAttribute(
    'aria-label',
    'A1, poisoned square',
  );
  const rows = await page.locator('[data-square$=",0"]').count();
  await page.locator(`[data-square="${rows - 2},2"]`).click();
  await expect(page.getByTestId('eat')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'chomp');
  await page.getByTestId('eat').click();
  await expect(page.locator(`[data-square="${rows - 1},3"]`)).toHaveAttribute(
    'aria-label',
    /eaten/,
  );
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-square][aria-disabled="false"]').last().click();
  await page.getByTestId('eat').click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|wins|win/, {
    timeout: 8000,
  });
});
