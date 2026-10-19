import { useSyncExternalStore } from 'react';

/**
 * Hash-based routing (#/game/chess). GitHub Pages cannot rewrite unknown paths to index.html,
 * but the hash never reaches the server, so direct links and refreshes always work.
 */
export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart = '/', queryPart = ''] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { path, segments, query: new URLSearchParams(queryPart) };
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

const getHash = () => window.location.hash;

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return parseHash(hash);
}

export function href(path: string, query?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) if (value) params.set(key, value);
  const qs = params.toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

export function navigate(
  path: string,
  query?: Record<string, string | undefined>,
  replace = false,
): void {
  const target = href(path, query);
  if (replace) window.location.replace(target);
  else window.location.hash = target.slice(1);
}
