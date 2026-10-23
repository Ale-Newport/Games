import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sprouts: draw a curve by dragging, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/sprouts');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  const spots = page.locator('[data-spot]');
  const count = await spots.count();
  const a = (await spots.nth(0).locator('circle').first().boundingBox())!;
  const b = (await spots.nth(1).locator('circle').first().boundingBox())!;
  const from = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++)
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 30, from.y + ((to.y - from.y) * i) / 30);
  await page.mouse.up();
  await expect(spots).toHaveCount(count + 1);
  await expect(spots.nth(0)).toHaveAttribute('aria-label', 'Spot 1, 2 lives left');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'sprouts');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 15000 });
  const fresh = page.locator('[data-spot]');
  await fresh.nth(0).focus();
  await page.keyboard.press('Enter');
  await fresh.nth(2).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|wins/, { timeout: 15000 });
});
