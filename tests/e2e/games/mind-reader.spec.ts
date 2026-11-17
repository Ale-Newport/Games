import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Mind Reader: answer questions until it guesses', async ({ page }) => {
  await freshStart(page, '/game/mind-reader');
  await page.getByTestId('mr-domain-objects').click();
  await expect(page.getByTestId('mr-question')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'mind-reader');
  for (let i = 0; i < 50 && !(await page.getByTestId('mr-guess').isVisible()); i++) {
    await page.getByTestId(i % 3 ? 'mr-a-no' : 'mr-a-yes').click();
  }
  await expect(page.getByTestId('mr-guess')).toBeVisible();
  await page.getByTestId('mr-right').click();
  await expect(page.getByTestId('mr-won')).toBeVisible();
});
