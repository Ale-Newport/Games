import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Accordion: deal six, close the row up, undo', async ({ page }) => {
  await freshStart(page, '/game/accordion?deal=1');
  for (let i = 0; i < 6; i++) await page.locator(`[data-pile-card="stock:${51 - i}"]`).click();
  await expect(page.getByTestId('sol-info')).toHaveText('Row 6 · Stock 46');
  await page.locator('[data-pile-card="p4:0"]').click();
  await page.locator('[data-pile-card="p3:0"]').click({ position: { x: 6, y: 6 } });
  await expect(page.getByTestId('sol-info')).toHaveText('Row 5 · Stock 46');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'accordion');
  await page.getByTestId('sol-undo').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Row 6 · Stock 46');
});

test('Accordion: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/accordion?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
