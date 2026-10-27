import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Slitherlink: draw a line and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/slitherlink?deal=7');
  await page.getByTestId('slither-start').click();
  await expect(page.getByTestId('slither-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'slitherlink');
  const box = (await page.getByTestId('slither-board').boundingBox())!;
  const u = box.width / 6; // 5 columns + padding
  // Drag from dot (0,0) to dot (2,0): two lines.
  await page.mouse.move(box.x + 0.5 * u, box.y + 0.5 * u);
  await page.mouse.down();
  await page.mouse.move(box.x + 1.5 * u, box.y + 0.5 * u, { steps: 3 });
  await page.mouse.move(box.x + 2.5 * u, box.y + 0.5 * u, { steps: 3 });
  await page.mouse.up();
  await expect(page.getByTestId('slither-board').locator('[data-value="1"]')).toHaveCount(2);
  await page.getByTestId('slither-undo').click();
  for (let i = 0; i < 120; i++) {
    if (await page.getByTestId('slither-again').isVisible()) break;
    await page.getByTestId('slither-hint').click();
    await page.getByTestId('slither-fill').click();
  }
  await expect(page.getByTestId('slither-message')).toContainText('Solved in');
});

test('Slitherlink: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/slitherlink?mode=watch');
  await expect(page.getByTestId('slither-message')).toContainText('The AI', { timeout: 8000 });
});
