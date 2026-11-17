import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Theme Strands: drag a theme word through the grid', async ({ page }) => {
  await freshStart(page, '/game/theme-strands');
  await page.getByTestId('ts-lang-en').click();
  await page.getByTestId('ts-pick-en-desserts').click();
  await expect(page.getByTestId('ts-clue')).toHaveText('Sweet tooth');
  const path = [4, 3, 2, 7]; // TART in the generated grid
  // Tap each letter, waiting for it to join the trace, then tap the last one again to submit.
  for (const c of path) {
    const cell = page.getByTestId(`ts-cell-${c}`);
    await cell.click();
    await expect(cell).toHaveAttribute('data-state', 'trace');
  }
  await page.getByTestId(`ts-cell-${path.at(-1)}`).click();
  await expect(page.getByTestId('ts-count')).toContainText('1 of');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'theme-strands');
});
