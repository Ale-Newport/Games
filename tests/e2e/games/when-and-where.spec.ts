import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('When & Where: look around, pin, pick a year and guess', async ({ page }) => {
  await freshStart(page, '/game/when-and-where?deal=3');
  await page.getByTestId('ww-timer-0').click();
  await page.getByTestId('ww-start').click();
  const pano = page.getByTestId('ww-pano');
  await expect(pano).toBeVisible();
  const box = (await pano.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  const map = page.getByTestId('ww-map');
  await expect(map).toBeVisible();
  const mb = (await map.boundingBox())!;
  await page.mouse.click(mb.x + mb.width * 0.52, mb.y + mb.height * 0.3);
  await expect(page.getByTestId('ww-pin')).toBeVisible();
  await page.getByTestId('ww-year-range').fill('1950');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'when-and-where');
  await page.getByTestId('ww-guess').click();
  await expect(page.getByTestId('ww-reveal')).toContainText('km');
});
