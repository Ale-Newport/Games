import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Seven Card Stud: antes, bring-in and later streets', async ({ page }) => {
  await freshStart(page, '/game/seven-card-stud?deal=5');
  await page.getByTestId('poker-opponents-2').click();
  await page.getByTestId('poker-start').click();
  await expect(page.getByTestId('poker-phase')).toHaveText('Third street');
  await expect(page.getByText('Ante 2 · Bring-in 10 · Bets 20/40')).toBeVisible();
  // Call or check until fourth street (or the hand ends).
  for (let k = 0; k < 15; k++) {
    if ((await page.getByTestId('poker-phase').textContent()) === 'Fourth street') break;
    if (await page.getByTestId('poker-next').isVisible()) break;
    const call = page.getByTestId('poker-call');
    if (await call.isVisible()) await call.click();
    await page.waitForTimeout(900);
  }
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'seven-card-stud');
});

test('Seven Card Stud: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/seven-card-stud?mode=watch');
  await expect(page.getByTestId('poker-seat-5')).toBeVisible();
  await expect(page.getByTestId('poker-phase')).toBeVisible();
});
