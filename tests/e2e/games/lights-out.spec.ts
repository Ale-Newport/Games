import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Lights Out: press, undo and switch everything off with hints', async ({ page }) => {
  await freshStart(page, '/game/lights-out?deal=5');
  await page.getByTestId('lo-start').click();
  const before = await page.getByTestId('lo-on').textContent();
  await page.getByTestId('lo-board').locator('[data-cell="12"]').click();
  await expect(page.getByTestId('lo-presses')).toHaveText('Presses 1');
  await page.getByTestId('lo-undo').click();
  await expect(page.getByTestId('lo-on')).toHaveText(before ?? '');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'lights-out');
  for (let i = 0; i < 30; i++) {
    if (await page.getByTestId('lo-again').isVisible()) break;
    await page.getByTestId('lo-hint').click();
    await page.getByTestId('lo-apply').click();
  }
  await expect(page.getByTestId('lo-message')).toContainText('All dark');
});

test('Lights Out: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/lights-out?mode=watch');
  await expect(page.getByTestId('lo-message')).toContainText('switched everything off', {
    timeout: 15_000,
  });
});
