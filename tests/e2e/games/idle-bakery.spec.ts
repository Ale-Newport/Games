import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Idle Bakery: click the cookie and buy a cursor', async ({ page }) => {
  await freshStart(page, '/game/idle-bakery?deal=1');
  const cookie = page.getByTestId('ib-cookie');
  for (let i = 0; i < 16; i++) await cookie.click();
  await expect(page.getByTestId('ib-cookies')).toContainText(/1[5-9] cookies/);
  await page.getByTestId('ib-buy-cursor').click();
  await expect(page.getByTestId('ib-cps')).toContainText('0.1');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'idle-bakery');
});
