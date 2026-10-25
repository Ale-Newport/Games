import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string, i: number) => `[data-pile-card="${pile}:${i}"]`;

test('Yukon: move a group, undo', async ({ page }) => {
  await freshStart(page, '/game/yukon?deal=1');
  const label = await page.locator(card('c3', 5)).getAttribute('aria-label');
  // Click the visible top edge of the fanned card.
  await page.locator(card('c3', 5)).click({ position: { x: 8, y: 4 } });
  await page.locator(card('c3', 5)).click({ position: { x: 8, y: 4 } });
  await expect(page.locator(card('c1', 6))).toHaveAttribute('aria-label', label!);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'yukon');
  await page.getByTestId('sol-undo').click();
  await expect(page.locator(card('c3', 5))).toHaveAttribute('aria-label', label!);
});

test('Yukon: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/yukon?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
