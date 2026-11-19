import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Endless Craft: drag water onto fire to make steam', async ({ page }) => {
  await freshStart(page, '/game/endless-craft');
  await expect(page.getByTestId('ec-count')).toContainText(/\b4 \/ \d+/);
  const water = page.getByTestId('ec-chip-water');
  const fire = page.getByTestId('ec-chip-fire');
  const from = (await water.boundingBox())!;
  const to = (await fire.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 40, from.y + 10, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByTestId('ec-toast')).toContainText('Steam');
  await expect(page.getByTestId('ec-count')).toContainText(/\b5 \/ \d+/);
  // Drag a new element out of the list onto the space.
  const item = page.getByTestId('ec-item-earth');
  const space = (await page.getByTestId('ec-space').boundingBox())!;
  const ib = (await item.boundingBox())!;
  await page.mouse.move(ib.x + ib.width / 2, ib.y + ib.height / 2);
  await page.mouse.down();
  await page.mouse.move(space.x + space.width * 0.3, space.y + space.height * 0.25, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId('ec-chip-earth')).toHaveCount(2);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'endless-craft');
});
