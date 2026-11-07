import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Diving Swarm: fire, then stand still until the last ship falls', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/diving-swarm?deal=28');
  await page.getByTestId('ds-start').click();
  await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'diving-swarm');
  await expect(page.getByTestId('ds-again')).toBeVisible({ timeout: 80_000 });
  await expect(page.getByTestId('ds-overlay')).toContainText(/Game over/);
});

test('Diving Swarm: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/diving-swarm?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('ds-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});
