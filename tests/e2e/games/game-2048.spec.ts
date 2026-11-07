import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Merge to 2048: slide, undo and follow a hint', async ({ page }) => {
  await freshStart(page, '/game/game-2048?deal=4');
  await page.getByTestId('mg-start').click();
  const board = page.getByTestId('mg-board');
  await expect(board).toBeVisible();
  const before = await board.innerHTML();
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
    await page.keyboard.press(key);
    if ((await board.innerHTML()) !== before) break;
  }
  expect(await board.innerHTML()).not.toBe(before);
  await page.getByTestId('mg-undo').click();
  await expect(page.getByTestId('mg-undo')).toBeDisabled();
  await page.getByTestId('mg-hint').click();
  await page.getByTestId('mg-apply').click();
  await expect(page.getByTestId('mg-apply')).toBeHidden();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'game-2048');
});

test('Merge to 2048: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/game-2048?mode=watch');
  const board = page.getByTestId('mg-board');
  await expect(board).toBeVisible();
  const before = await board.innerHTML();
  await expect.poll(() => board.innerHTML(), { timeout: 8000 }).not.toBe(before);
});
