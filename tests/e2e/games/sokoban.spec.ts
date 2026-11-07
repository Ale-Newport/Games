import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sokoban: pick a warehouse, walk, restart and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/sokoban');
  await page.getByTestId('sk-level-0').click();
  await expect(page.getByTestId('sk-board')).toBeVisible();
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
    await page.keyboard.press(key);
  await expect(page.getByTestId('sk-moves')).not.toHaveText('Moves 0');
  await page.getByTestId('sk-restart').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'sokoban');
  for (let i = 0; i < 30; i++) {
    if (await page.getByTestId('sk-next').isVisible()) break;
    await page.getByTestId('sk-hint').click();
    await page.getByTestId('sk-apply').click();
  }
  await expect(page.getByTestId('sk-message')).toContainText('Done in');
  await page.getByTestId('sk-menu-btn').click();
  await expect(page.getByTestId('sk-level-0')).toHaveClass(/cleared/);
});

test('Sokoban: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/sokoban?mode=watch');
  await expect(page.getByTestId('sk-pushes')).not.toHaveText(/^Pushes 0\//, { timeout: 10_000 });
});
