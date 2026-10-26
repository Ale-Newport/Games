import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Gin rummy: draw and throw a card', async ({ page }) => {
  await freshStart(page, '/game/gin-rummy?deal=1');
  await page.getByTestId('gin-start').click();
  await page.getByTestId('gin-stock').click();
  await expect(page.getByTestId('gin-hand').locator('button')).toHaveCount(11);
  await page.getByTestId('gin-hint').click();
  await expect(page.getByTestId('gin-throw')).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'gin-rummy');
  await page.getByTestId('gin-throw').click();
  await expect(page.getByTestId('gin-hand').locator('button')).toHaveCount(10);
  await expect(page.getByTestId('gin-status')).toHaveText(
    'Draw from the stock or the discard pile',
    {
      timeout: 6000,
    },
  );
});

test('Gin rummy: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/gin-rummy?mode=watch');
  await expect(page.getByTestId('gin-opponent').locator('[role="img"]').first()).toBeVisible();
});
