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

/** A profile record as stored in IndexedDB (only the fields tests look at). */
export interface StoredProfile {
  favorites: string[];
}

/**
 * Waits until a profile stored in IndexedDB satisfies `predicate` (persistence check). The
 * profiles are read in the page and the predicate runs in Node: the production build's
 * Content-Security-Policy (rightly) forbids evaluating code strings in the page.
 */
export async function waitForStoredProfile(
  page: Page,
  predicate: (profile: StoredProfile) => boolean,
) {
  await expect
    .poll(
      async () => {
        const profiles = await page.evaluate(
          () =>
            new Promise<StoredProfile[]>((resolve) => {
              const req = indexedDB.open('arcade-ai-lab');
              req.onsuccess = () => {
                const tx = req.result.transaction('kv', 'readonly');
                const all = tx.objectStore('kv').getAll();
                all.onsuccess = () => {
                  resolve(
                    (all.result as { data?: unknown }[])
                      .map((r) => r?.data)
                      .filter(
                        (d): d is StoredProfile => !!d && typeof d === 'object' && 'favorites' in d,
                      ),
                  );
                };
                all.onerror = () => resolve([]);
              };
              req.onerror = () => resolve([]);
            }),
        );
        return profiles.some(predicate);
      },
      { timeout: 5000 },
    )
    .toBe(true);
}
