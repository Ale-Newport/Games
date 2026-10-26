import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Leduc poker: a hand to the public card against Nash', async ({ page }) => {
  await freshStart(page, '/game/leduc-poker?deal=1');
  await page.getByTestId('hu-start').click();
  await expect(page.getByTestId('hu-status')).toHaveText('Your move');
  await page.getByTestId('hu-coach').click();
  await expect(page.getByTestId('hu-check')).toContainText('%');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'leduc-poker');
  // Check or call until the hand ends.
  for (let k = 0; k < 8 && !(await page.getByTestId('hu-next').isVisible()); k++) {
    const check = page.getByTestId('hu-check');
    const call = page.getByTestId('hu-call');
    if (await check.isVisible()) await check.click();
    else if (await call.isVisible()) await call.click();
    await page.waitForTimeout(1000);
  }
  await expect(page.getByTestId('hu-next')).toBeVisible({ timeout: 5000 });
});

test('Leduc poker: watch Nash against Medium', async ({ page }) => {
  await freshStart(page, '/game/leduc-poker?mode=watch');
  await expect(page.getByTestId('hu-log')).not.toBeEmpty({ timeout: 6000 });
});
