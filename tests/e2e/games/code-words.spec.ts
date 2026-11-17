import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Code Words: the bot spymaster gives a clue and the operative touches a word', async ({
  page,
}) => {
  await freshStart(page, '/game/code-words');
  await expect(page.getByTestId('cw-menu')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('cw-role-operative').click();
  await page.getByTestId('cw-start').click();
  await expect(page.getByTestId('cw-card-0')).toBeVisible();
  // Wait until it is red's turn to guess (blue may start).
  await expect(page.getByTestId('cw-status')).toContainText(/Red operatives|Agentes Rojo/, {
    timeout: 30_000,
  });
  await expect(page.getByTestId('cw-clue')).toBeVisible();
  const card = page.locator('[data-testid^="cw-card-"]:not([disabled])').first();
  await card.click();
  await expect(page.locator('[data-open="true"]').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'code-words');
});
