import { useCallback, useEffect, useState } from 'react';
import { useLatest } from '../game-engine/hooks';

export interface AssetState<T> {
  /** The loaded value, or null while loading or after a failure. */
  value: T | null;
  /** The failure, or null. */
  error: unknown;
  /** Loads again after a failure (the loaders do not cache failures). */
  retry: () => void;
}

/**
 * Loads data a game needs (word vectors, models, dictionaries) and exposes the failure so the
 * game can offer a retry instead of waiting forever. `key` identifies what is loaded (for
 * example a language): changing it loads the new data.
 */
export function useAsset<T>(load: () => Promise<T>, key = ''): AssetState<T> {
  const loadRef = useLatest(load);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    attempt: number;
    value: T | null;
    error: unknown;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    loadRef.current().then(
      (value) => {
        if (alive) setResult({ key, attempt, value, error: null });
      },
      (error: unknown) => {
        console.warn('Game data failed to load', error);
        if (alive) setResult({ key, attempt, value: null, error });
      },
    );
    return () => {
      alive = false;
    };
  }, [key, attempt, loadRef]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const current = result && result.key === key && result.attempt === attempt ? result : null;
  return { value: current?.value ?? null, error: current?.error ?? null, retry };
}
