import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Draw Telephone: write, draw, describe and open the album', async ({ page }) => {
  await freshStart(page, '/game/draw-telephone');
  await expect(page.getByTestId('dt-start')).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId('dt-bots-2').click();
  await page.getByTestId('dt-start').click();
  await page.getByTestId('dt-ready').click();
  await page.getByTestId('dt-text').fill('A whale playing guitar');
  await page.getByTestId('dt-done').click();
  await page.getByTestId('dt-ready').click();
  await expect(page.getByTestId('dt-prompt')).toBeVisible();
  const box = (await page.getByTestId('dt-pad').boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 160, { steps: 6 });
  await page.mouse.up();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'draw-telephone');
  await page.getByTestId('dt-done').click();
  await page.getByTestId('dt-ready').click();
  await page.getByTestId('dt-text').fill('a fish');
  await page.getByTestId('dt-done').click();
  await expect(page.getByTestId('dt-album')).toBeVisible();
});
