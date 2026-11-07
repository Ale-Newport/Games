import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Traffic Jam: slide with the keys, undo, and free the red car with hints', async ({
  page,
}) => {
  await freshStart(page, '/game/traffic-jam?deal=11');
  await page.getByTestId('tj-start').click();
  await expect(page.getByTestId('tj-board')).toBeVisible();
  for (let i = 0; i < 12; i++) {
    if ((await page.getByTestId('tj-moves').textContent()) !== 'Moves 0') break;
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'])
      await page.keyboard.press(key);
    if ((await page.getByTestId('tj-moves').textContent()) === 'Moves 0')
      await page.keyboard.press('Tab');
  }
  await expect(page.getByTestId('tj-moves')).not.toHaveText('Moves 0');
  await page.getByTestId('tj-undo').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'traffic-jam');
  for (let i = 0; i < 40; i++) {
    if (await page.getByTestId('tj-again').isVisible()) break;
    await page.getByTestId('tj-hint').click();
    await page.getByTestId('tj-apply').click();
  }
  await expect(page.getByTestId('tj-message')).toContainText('Out in');
});

test('Traffic Jam: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/traffic-jam?mode=watch');
  await expect(page.getByTestId('tj-message')).toContainText('Slide the', { timeout: 8000 });
});
