import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Peg Solitaire: jump, undo and finish the English board with hints', async ({ page }) => {
  await freshStart(page, '/game/peg-solitaire');
  await page.getByTestId('pg-start').click();
  const hole = (h: number) => page.getByTestId('pg-board').locator(`[data-hole="${h}"]`);
  await hole(10).click();
  await hole(24).click();
  await expect(page.getByTestId('pg-left')).toHaveText('Pegs 31');
  await page.getByTestId('pg-undo').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'peg-solitaire');
  for (let i = 0; i < 40; i++) {
    if (!(await page.getByTestId('pg-hint').isVisible())) break;
    await page.getByTestId('pg-hint').click();
    await page.getByTestId('pg-apply').click();
  }
  await expect(page.getByTestId('pg-message')).toContainText('One peg left');
});

test('Peg Solitaire: the triangle and watching the AI', async ({ page }) => {
  await freshStart(page, '/game/peg-solitaire?mode=watch');
  await expect(page.getByTestId('pg-left')).not.toHaveText('Pegs 32', { timeout: 8000 });
});
