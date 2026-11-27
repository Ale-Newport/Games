import { expect, type Page } from '@playwright/test';

/** Fails if the page scrolls horizontally (content escaping the viewport). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
}

/** Starts every test in English (or the given language) with sound off and a fresh profile. */
export async function freshStart(page: Page, path = '/', locale: 'en' | 'es' = 'en') {
  await page.addInitScript((locale) => {
    if (!sessionStorage.getItem('e2e-init')) {
      sessionStorage.setItem('e2e-init', '1');
      localStorage.setItem(
        'aal.settings',
        JSON.stringify({
          schema: 1,
          savedAt: 0,
          data: {
            theme: 'dark',
            locale,
            sound: false,
            volume: 0.5,
            motion: 'reduce',
            colorblind: false,
          },
        }),
      );
    }
  }, locale);
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

/**
 * Waits until some record stored in IndexedDB (a profile or a game save, at any depth of its
 * `data`) satisfies `predicate` — e.g. before reloading to test resume. The predicate runs in Node
 * (the page's CSP forbids evaluating code strings).
 */
export async function waitForStored(page: Page, predicate: (value: unknown) => boolean) {
  const matches = (v: unknown, depth = 0): boolean => {
    if (predicate(v)) return true;
    if (depth > 3 || typeof v !== 'object' || v === null) return false;
    return Object.values(v).some((x) => matches(x, depth + 1));
  };
  await expect
    .poll(
      async () => {
        const values = await page.evaluate(
          () =>
            new Promise<unknown[]>((resolve) => {
              const req = indexedDB.open('arcade-ai-lab');
              req.onsuccess = () => {
                const all = req.result.transaction('kv', 'readonly').objectStore('kv').getAll();
                all.onsuccess = () => resolve(all.result as unknown[]);
                all.onerror = () => resolve([]);
              };
              req.onerror = () => resolve([]);
            }),
        );
        return values.some((v) => matches(v));
      },
      { timeout: 5000 },
    )
    .toBe(true);
}

/** True for a saved session that has scored `count` rounds and waits on its next one. */
export const sessionAt = (count: number) => (v: unknown) => {
  const s = (
    v as {
      session?: {
        count?: number;
        status?: string;
        rounds?: { guess?: unknown; pred?: unknown; locked?: boolean; range?: unknown }[];
      };
    }
  )?.session;
  const last = s?.rounds?.at(-1);
  return (
    s?.count === count &&
    s.status === 'playing' &&
    !!last &&
    (last.guess === null || last.pred === null || last.locked === false || last.range === null)
  );
};
