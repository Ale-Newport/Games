// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('World Quiz UI', () => {
  it('fills the map as countries are typed and reveals the rest on giving up', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('qz-lang-en'));
    fireEvent.click(screen.getByTestId('qz-start-countries-sa'));
    const input = screen.getByTestId('qz-input');
    for (const w of ['Brazil', 'Perú', 'chile']) fireEvent.change(input, { target: { value: w } });
    expect(screen.getByTestId('qz-score').textContent).toBe('3/12');
    await screen.findByTestId('qz-map', undefined, { timeout: 5000 });
    expect(document.querySelector('[data-iso="BR"]')!.getAttribute('data-tone')).toBe('found');
    fireEvent.click(screen.getByTestId('qz-giveup'));
    expect(document.querySelector('[data-iso="AR"]')!.getAttribute('data-tone')).toBe('missed');
    expect(screen.getByTestId('qz-missed').textContent).toContain('Argentina');
    expect(calls.results[0]).toMatchObject({ score: 25, mode: 'countries-sa' });
  });
});
