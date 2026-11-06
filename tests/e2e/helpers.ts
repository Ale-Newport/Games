import { expect, type Page } from '@playwright/test';

/** Fails if the page scrolls horizontally (content escaping the viewport). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
}

/** Starts every test in English with sound off and a fresh profile. */
export async function freshStart(page: Page, path = '/') {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-init')) {
      sessionStorage.setItem('e2e-init', '1');
      localStorage.setItem(
        'aal.settings',
        JSON.stringify({
          schema: 1,
          savedAt: 0,
          data: {
            theme: 'dark',
            locale: 'en',
            sound: false,
            volume: 0.5,
            motion: 'reduce',
            colorblind: false,
          },
        }),
      );
    }
  });
  await page.goto(`./#${path}`);
}

export async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${test_project(page)}.png`,
    fullPage: true,
  });
}

function test_project(page: Page): string {
  const width = page.viewportSize()?.width ?? 0;
  return width < 600 ? 'mobile' : 'desktop';
}

/** Waits until the active profile stored in IndexedDB satisfies `predicate` (persistence check). */
export async function waitForStoredProfile(page: Page, predicate: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          (pred) =>
            new Promise<boolean>((resolve) => {
              const req = indexedDB.open('arcade-ai-lab');
              req.onsuccess = () => {
                const tx = req.result.transaction('kv', 'readonly');
                const all = tx.objectStore('kv').getAll();
                all.onsuccess = () => {
                  const profiles = (all.result as { data?: unknown }[])
                    .map((r) => r?.data)
                    .filter((d) => d && typeof d === 'object' && 'favorites' in (d as object));
                  const test = new Function('p', `return ${pred}`) as (p: unknown) => boolean;
                  resolve(profiles.some((p) => test(p)));
                };
              };
              req.onerror = () => resolve(false);
            }),
          predicate,
        ),
      { timeout: 5000 },
    )
    .toBe(true);
}
