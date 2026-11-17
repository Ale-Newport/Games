import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Word Groups: find a group and see one away', async ({ page }) => {
  await freshStart(page, '/game/word-groups');
  await page.getByTestId('wg2-lang-en').click();
  await page.getByTestId('wg2-pick-en-3').click();
  for (const w of ['JUNO', 'CUPID', 'VULCAN', 'BACCHUS'])
    await page.getByTestId(`wg2-tile-${w}`).click();
  await page.getByTestId('wg2-submit').click();
  await expect(page.getByTestId('wg2-bar-2')).toContainText('Roman gods');
  for (const w of ['MARS', 'VENUS', 'SATURN', 'IRON'])
    await page.getByTestId(`wg2-tile-${w}`).click();
  await page.getByTestId('wg2-submit').click();
  await expect(page.getByTestId('wg2-toast')).toContainText('One away');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'word-groups');
});
