import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Color Links: draw a path, clear, and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/flow?deal=3');
  await page.getByTestId('fl-start').click();
  await expect(page.getByTestId('fl-linked')).toHaveText('Pairs 0/5');
  await page.getByTestId('fl-hint').click();
  await expect(page.getByTestId('fl-linked')).toHaveText('Pairs 1/5');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'flow');
  await page.getByTestId('fl-clear').click();
  await expect(page.getByTestId('fl-linked')).toHaveText('Pairs 0/5');
  for (let i = 0; i < 8; i++) {
    if (await page.getByTestId('fl-again').isVisible()) break;
    await page.getByTestId('fl-hint').click();
  }
  await expect(page.getByTestId('fl-message')).toContainText('All linked');
});

test('Color Links: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/flow?mode=watch');
  await expect(page.getByTestId('fl-message')).toContainText('linked every pair', {
    timeout: 20_000,
  });
});
