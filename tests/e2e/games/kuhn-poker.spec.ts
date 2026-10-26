import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Kuhn poker: a hand against Nash with the coach', async ({ page }) => {
  await freshStart(page, '/game/kuhn-poker?deal=1');
  await page.getByTestId('hu-start').click();
  await expect(page.getByTestId('hu-status')).toHaveText('Your move');
  await page.getByTestId('hu-coach').click();
  await expect(page.getByTestId('hu-check')).toContainText('%');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'kuhn-poker');
  await page.getByTestId('hu-bet').click();
  await expect(page.getByTestId('hu-next')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('hu-ai-mix')).toContainText('in its spot');
  await page.getByTestId('hu-next').click();
  await expect(page.getByTestId('hu-hand')).toHaveText('2');
});

test('Kuhn poker: watch Nash against Medium', async ({ page }) => {
  await freshStart(page, '/game/kuhn-poker?mode=watch');
  await expect(page.getByTestId('hu-log')).not.toBeEmpty({ timeout: 6000 });
});
