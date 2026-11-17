import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hot & Cold Globe: guesses light up the globe and the list', async ({ page }) => {
  await freshStart(page, '/game/globe-hot-cold?deal=8');
  await page.getByTestId('gl-random').click();
  await expect(page.getByTestId('gl-globe')).toHaveAttribute('data-ready', 'true', {
    timeout: 10_000,
  });
  for (const c of ['Brazil', 'Japan']) {
    await page.getByTestId('gl-input').fill(c);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByTestId('gl-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('gl-closest')).toContainText('km');
  const box = await page.getByTestId('gl-globe').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 80, box!.y + box!.height / 2);
  await page.mouse.up();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'globe-hot-cold');
});
