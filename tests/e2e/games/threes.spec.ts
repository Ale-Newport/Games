import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Number Trios: slide, undo and follow a hint', async ({ page }) => {
  await freshStart(page, '/game/threes?deal=4');
  await page.getByTestId('tr-start').click();
  const board = page.getByTestId('tr-board');
  await expect(board).toBeVisible();
  const before = await board.innerHTML();
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
    await page.keyboard.press(key);
    if ((await board.innerHTML()) !== before) break;
  }
  expect(await board.innerHTML()).not.toBe(before);
  await page.getByTestId('tr-undo').click();
  await expect(page.getByTestId('tr-undo')).toBeDisabled();
  await page.getByTestId('tr-hint').click();
  await page.getByTestId('tr-apply').click();
  await expect(page.getByTestId('tr-apply')).toBeHidden();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'threes');
});

test('Number Trios: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/threes?mode=watch');
  const board = page.getByTestId('tr-board');
  await expect(board).toBeVisible();
  const before = await board.innerHTML();
  await expect.poll(() => board.innerHTML(), { timeout: 8000 }).not.toBe(before);
});
