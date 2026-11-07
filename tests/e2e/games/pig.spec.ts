import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Pig: roll, take a hint, hold', async ({ page }) => {
  await freshStart(page, '/game/pig?deal=4');
  await page.getByTestId('pg-start').click();
  await expect(page.getByTestId('pg-roll')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('pg-hint').click();
  await expect(page.getByTestId('pg-message')).toContainText('chance to win');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'pig');
  for (let i = 0; i < 30; i++) {
    if (!(await page.getByTestId('pg-roll').isVisible())) {
      await page.waitForTimeout(400);
      continue;
    }
    const total = Number((await page.getByTestId('pg-turn').textContent())!.replace(/\D+/g, ''));
    if (total >= 10) {
      await page.getByTestId('pg-hold').click();
      break;
    }
    await page.getByTestId('pg-roll').click();
  }
  await expect(page.getByTestId('pg-message')).not.toHaveText('');
});

test('Pig: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/pig?mode=watch&deal=3');
  await expect(page.getByTestId('pg-turn')).not.toHaveText('Turn total: 0', { timeout: 8000 });
});
