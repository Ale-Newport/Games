import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Quiz Arcade: type elements, give up and see the missed answers', async ({ page }) => {
  await freshStart(page, '/game/quiz-arcade');
  await page.getByTestId('qz-lang-en').click();
  await page.getByTestId('qz-start-elements').click();
  for (const w of ['hydrogen', 'helium', 'oxygen', 'gold'])
    await page.getByTestId('qz-input').fill(w);
  await expect(page.getByTestId('qz-score')).toHaveText('4/118');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'quiz-arcade');
  await page.getByTestId('qz-giveup').click();
  await expect(page.getByTestId('qz-result')).toContainText('4/118');
});

test('Quiz Arcade: name a polygon in the slideshow', async ({ page }) => {
  await freshStart(page, '/game/quiz-arcade?quiz=polygons');
  await expect(page.getByTestId('qz-input')).toBeVisible();
  await page.getByTestId('qz-skip').click();
  await expect(page.getByTestId('qz-score')).toHaveText('0/10');
});
