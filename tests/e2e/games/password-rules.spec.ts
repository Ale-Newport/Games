import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Password Rules: type until the sponsor rule, bold a vowel', async ({ page }) => {
  await freshStart(page, '/game/password-rules?deal=4');
  const field = page.getByTestId('pw-input');
  await field.click();
  await page.keyboard.type('Zorbo1!996');
  await expect(page.getByTestId('pw-rule-month')).toBeVisible();
  await page.keyboard.type('may');
  await expect(page.getByTestId('pw-rule-roman')).toBeVisible();
  await page.keyboard.type('V');
  await expect(page.getByTestId('pw-rule-roman35')).toBeVisible();
  await expect(page.getByTestId('pw-length')).toHaveText('14');
  // Select the first "o" and make it bold.
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  await page.getByTestId('pw-bold').click();
  await expect(field.locator('span[data-b="1"]')).toHaveText('o');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'password-rules');
});
