import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string, i: number) => `[data-pile-card="${pile}:${i}"]`;

test('FreeCell: automatic ace, a move, a free cell, undo', async ({ page }) => {
  await freshStart(page, '/game/freecell?deal=2');
  await expect(page.locator(card('f0', 0))).toHaveAttribute('aria-label', 'ace of hearts');
  await page.locator(card('c0', 6)).click();
  await page.locator(card('c0', 6)).click();
  await expect(page.locator(card('c5', 6))).toHaveAttribute('aria-label', 'ten of spades');
  await page.locator(card('c1', 6)).click();
  await page.locator('[data-pile="r1"]').click();
  await expect(page.locator(card('r1', 0))).toHaveAttribute('aria-label', 'six of diamonds');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'freecell');
  // Undo takes back the move into the cell (and any automatic plays after it), not further.
  const before = Number(await page.getByTestId('sol-moves').textContent());
  await page.getByTestId('sol-undo').click();
  await expect(page.locator(card('c1', 6))).toHaveAttribute('aria-label', 'six of diamonds');
  expect(Number(await page.getByTestId('sol-moves').textContent())).toBeLessThan(before);
});

test('FreeCell: the solver plays a deal to the end', async ({ page }) => {
  await freshStart(page, '/game/freecell?mode=watch');
  await expect(page.getByTestId('sol-status')).toContainText('Watching');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
