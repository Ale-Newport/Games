import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Nonogram: paint by dragging and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/nonogram?deal=7');
  await page.getByTestId('nono-start').click();
  await expect(page.getByTestId('nono-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'nonogram');
  const a = await page.getByTestId('nono-board').locator('[data-cell="0"]').boundingBox();
  const b = await page.getByTestId('nono-board').locator('[data-cell="2"]').boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByTestId('nono-board').locator('[data-cell="1"]')).toHaveAttribute(
    'data-value',
    '1',
  );
  await page.getByTestId('nono-undo').click();
  for (let i = 0; i < 80; i++) {
    if (await page.getByTestId('nono-again').isVisible()) break;
    await page.getByTestId('nono-hint').click();
    await page.getByTestId('nono-fill').click();
  }
  await expect(page.getByTestId('nono-message')).toContainText('Solved in');
});

test('Nonogram: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/nonogram?mode=watch');
  await expect(page.getByTestId('nono-message')).toContainText('The AI', { timeout: 8000 });
});
