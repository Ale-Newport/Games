// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { memoizeUntilFailure } from './load';
import { useAsset } from './useAsset';

afterEach(() => cleanup());

describe('useAsset', () => {
  it('exposes a failure and loads again on retry', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const raw = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue('words');
    const load = memoizeUntilFailure(raw);
    const { result } = renderHook(() => useAsset(load));
    expect(result.current.value).toBeNull();
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.value).toBeNull();
    act(() => result.current.retry());
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.value).toBe('words'));
    expect(raw).toHaveBeenCalledTimes(2);
  });

  it('loads again when the key changes and never shows a stale value', async () => {
    const { result, rerender } = renderHook(
      ({ lang }: { lang: string }) => useAsset(async () => `vectors-${lang}`, lang),
      { initialProps: { lang: 'en' } },
    );
    await waitFor(() => expect(result.current.value).toBe('vectors-en'));
    rerender({ lang: 'es' });
    expect(result.current.value).toBeNull();
    await waitFor(() => expect(result.current.value).toBe('vectors-es'));
  });
});
