import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Crazy Eights: play a card or draw', async ({ page }) => {
  await freshStart(page, '/game/crazy-eights?deal=2');
  await page.getByTestId('eights-opponents-3').click();
  await page.getByTestId('eights-start').click();
  await expect(page.getByTestId('eights-opponent-3')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'crazy-eights');
  const playable = page.getByTestId('eights-hand').locator('button:not([disabled])');
  if (await playable.count()) {
    await playable.first().click();
    if (await page.getByTestId('eights-suits').isVisible())
      await page.getByTestId('eights-suit-0').click();
    await expect(page.getByTestId('eights-hand').locator('button')).toHaveCount(4);
  } else {
    await page.getByTestId('eights-draw').click();
    await expect(page.getByTestId('eights-hand').locator('button')).toHaveCount(6);
  }
});

test('Crazy Eights: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/crazy-eights?mode=watch');
  await expect(page.getByTestId('eights-opponent-3')).toBeVisible();
});
