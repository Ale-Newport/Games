import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Doodle Recognizer: draw on the pad and see the guesses', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/doodle-recognizer?deal=4');
  await expect(page.getByTestId('dr-start')).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId('dr-start').click();
  await page.getByTestId('dr-go').click();
  const pad = page.getByTestId('dr-pad');
  const box = (await pad.boundingBox())!;
  // A circle with two ears.
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  for (let a = 0; a <= 360; a += 20) {
    const r = (a * Math.PI) / 180;
    await page.mouse.move(
      box.x + box.width * (0.5 + 0.2 * Math.cos(r + Math.PI)),
      box.y + box.height * (0.5 + 0.2 * Math.sin(r + Math.PI)),
    );
  }
  await page.mouse.up();
  await expect(page.getByTestId('dr-speech')).toContainText(/I see|I know/, { timeout: 5000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'doodle-recognizer');
  await page.getByTestId('dr-skip').click();
  await expect(page.getByTestId('dr-card')).toBeVisible({ timeout: 5000 });
});
