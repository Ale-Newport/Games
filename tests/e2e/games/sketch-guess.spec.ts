import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sketch & Guess: draw on your turn while bots guess', async ({ page }) => {
  await freshStart(page, '/game/sketch-guess');
  await expect(page.getByTestId('sg-start')).toBeEnabled({ timeout: 15_000 });
  await page.getByTestId('sg-bots-3').click();
  await page.getByTestId('sg-start').click();
  await page.getByTestId('sg-choose').locator('button').first().click();
  const pad = page.getByTestId('sg-pad');
  const box = (await pad.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3, { steps: 8 });
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, { steps: 8 });
  await page.mouse.up();
  await expect(pad).toHaveAttribute('data-strokes', '1');
  await expect(page.getByTestId('sg-chat').locator('li')).not.toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'sketch-guess');
});

test('Sketch & Guess: watch the bots play', async ({ page }) => {
  await freshStart(page, '/game/sketch-guess?mode=watch');
  await expect(page.getByTestId('sg-pad')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('sg-pad')).not.toHaveAttribute('data-strokes', '0', {
    timeout: 20_000,
  });
});
