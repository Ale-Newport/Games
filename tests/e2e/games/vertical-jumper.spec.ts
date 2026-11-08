import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Cloud Climber: bounce, then steer off the cloud and fall', async ({ page }) => {
  await freshStart(page, '/game/vertical-jumper?deal=1');
  await page.getByTestId('cc-start').click();
  await page.waitForTimeout(1500);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'vertical-jumper');
  await expect(page.getByTestId('cc-again')).toHaveCount(0);
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowLeft');
  await expect(page.getByTestId('cc-overlay')).toContainText('Fell from the clouds', {
    timeout: 15_000,
  });
});

test('Cloud Climber: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/vertical-jumper?mode=watch&deal=2');
  await expect
    .poll(
      async () => parseInt((await page.getByTestId('cc-hud-hud.height').textContent()) ?? '0', 10),
      {
        timeout: 20_000,
      },
    )
    .toBeGreaterThan(60);
});
