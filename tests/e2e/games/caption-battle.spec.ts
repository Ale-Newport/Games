import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Caption Battle: caption a scene, rate the bots and see the gallery', async ({ page }) => {
  await freshStart(page, '/game/caption-battle');
  await page.getByTestId('cb-bots-3').click();
  await page.getByTestId('cb-start').click();
  await page.getByTestId('cb-ready').click();
  await page.getByTestId('cb-input').fill('when the meeting could have been an email');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'caption-battle');
  await page.getByTestId('cb-submit').click();
  await page.getByTestId('cb-ready').click();
  await page.getByTestId('cb-star-1-4').click();
  await page.getByTestId('cb-rate-submit').click();
  await expect(page.getByTestId('cb-results')).toContainText('★');
});
