/**
 * Helpers for games that fetch bundled data files (word vectors, dictionaries, models) on demand.
 */

/** `fetch` that rejects on HTTP errors instead of handing an error page to a parser. */
export async function fetchChecked(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }
  return response;
}

/**
 * Memoizes an async loader: every caller shares one in-flight or settled result, but a failure
 * is not cached, so the next call (for example after reopening the game) tries again.
 */
export function memoizeUntilFailure<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
}
