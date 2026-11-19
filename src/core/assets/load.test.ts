import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChecked, memoizeUntilFailure } from './load';

describe('fetchChecked', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('ok', { status: 200 })),
    );
    await expect((await fetchChecked('/a.txt')).text()).resolves.toBe('ok');
  });

  it('rejects HTTP errors with the URL and status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('missing', { status: 404 })),
    );
    await expect(fetchChecked('/a.txt')).rejects.toThrow('Failed to load /a.txt: HTTP 404');
  });
});

describe('memoizeUntilFailure', () => {
  it('shares one result between callers', async () => {
    const load = vi.fn(async () => 42);
    const get = memoizeUntilFailure(load);
    const [a, b] = await Promise.all([get(), get()]);
    expect(a).toBe(42);
    expect(b).toBe(42);
    await get();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure instead of caching it', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('data');
    const get = memoizeUntilFailure(load);
    await expect(get()).rejects.toThrow('offline');
    await expect(get()).resolves.toBe('data');
    await expect(get()).resolves.toBe('data');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
