import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Word Rank: a failed vector download shows an error, and Retry recovers', async ({ page }) => {
  let fail = true;
  await page.route(/vectors-[^/]*\.bin$/, (route) => (fail ? route.abort() : route.continue()));
  await freshStart(page, '/game/word-rank?deal=7');
  await expect(page.getByTestId('load-error')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('load-error')).toContainText('could not be downloaded');
  fail = false;
  await page.getByTestId('load-retry').click();
  await expect(page.getByTestId('wr-menu')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('load-error')).toHaveCount(0);
});

test('Word Rank in Spanish: Spanish words, without accents and in plural', async ({ page }) => {
  await freshStart(page, '/game/word-rank?deal=7', 'es');
  await expect(page.getByTestId('wr-menu')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('wr-menu')).toContainText('Las palabras son en español');
  await page.getByTestId('wr-random').click();
  for (const w of ['arboles', 'canción', 'perro']) {
    await page.getByTestId('wr-input').fill(w);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByTestId('wr-list').locator('li')).toHaveCount(3);
  // Shown with the vocabulary's own spelling.
  await expect(page.getByTestId('wr-guess-árbol')).toBeVisible();
  await page.getByTestId('wr-input').fill('house');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('wr-list').locator('li')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'word-rank-es');
});

test('Word Warmth in Spanish: similarity scores for Spanish guesses', async ({ page }) => {
  await freshStart(page, '/game/word-warmth?deal=3', 'es');
  await expect(page.getByTestId('ww-menu')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('ww-random').click();
  for (const w of ['casa', 'agua']) {
    await page.getByTestId('ww-input').fill(w);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByTestId('ww-guess-casa')).toBeVisible();
  await expect(page.getByTestId('ww-guess-agua')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('Code Words in Spanish: a Spanish board and a Spanish bot clue', async ({ page }) => {
  await freshStart(page, '/game/code-words', 'es');
  await expect(page.getByTestId('cw-menu')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('cw-role-operative').click();
  await page.getByTestId('cw-start').click();
  await expect(page.getByTestId('cw-card-0')).toBeVisible();
  await expect(page.getByTestId('cw-status')).toContainText(/Agentes Rojo/, { timeout: 30_000 });
  await expect(page.getByTestId('cw-clue')).toBeVisible();
  // Every card is a word of the Spanish pool: letters only, Spanish alphabet.
  const words = await page.locator('[data-testid^="cw-card-"]').allInnerTexts();
  expect(words).toHaveLength(25);
  for (const w of words) expect(w.trim().toLowerCase()).toMatch(/^[a-záéíóúüñ]+$/);
  await screenshot(page, 'code-words-es');
});
