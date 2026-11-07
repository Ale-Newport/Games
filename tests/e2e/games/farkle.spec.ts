import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Farkle: roll, follow a hint, set dice aside', async ({ page }) => {
  await freshStart(page, '/game/farkle?deal=4');
  await page.getByTestId('fk-count-1').click();
  await page.getByTestId('fk-start').click();
  let acted = 0;
  for (let i = 0; i < 20 && acted < 2; i++) {
    if (await page.getByTestId('fk-roll').isVisible()) await page.getByTestId('fk-roll').click();
    if (await page.getByTestId('fk-hint').isVisible()) {
      await page.getByTestId('fk-hint').click();
      await expect(page.getByTestId('fk-message')).toContainText('Suggested');
      if (acted === 0) {
        await expectNoHorizontalOverflow(page);
        await screenshot(page, 'farkle');
      }
      await page.getByTestId('fk-keep-roll').click();
      acted++;
    }
    await page.waitForTimeout(100);
  }
  expect(acted).toBe(2);
});

test('Farkle: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/farkle?mode=watch&deal=6');
  await expect(page.getByTestId('fk-dice').locator('button').first()).toBeVisible({
    timeout: 8000,
  });
});
