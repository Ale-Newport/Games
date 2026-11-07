// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Euchre UI', () => {
  it('shows the upcard, takes a bidding hint, passes and plays a card', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('euchre-start'));
    expect(screen.getByTestId('euchre-upcard')).toBeTruthy();
    expect(screen.getByTestId('euchre-status').textContent).toMatch(/^Order the dealer to take/);
    fireEvent.click(screen.getByTestId('euchre-hint'));
    expect(screen.getByTestId('euchre-hint-text').textContent).toMatch(
      /^Medium would (pass|order up)\.$/,
    );
    fireEvent.click(screen.getByTestId('euchre-pass'));
    for (let k = 0; k < 8; k++) {
      await settle(1000);
      if (screen.queryByTestId('euchre-pass')) fireEvent.click(screen.getByTestId('euchre-pass'));
      const names = screen.queryAllByTestId(/^euchre-name-/);
      if (names.length) fireEvent.click(names[0]!);
    }
    expect(screen.getByTestId('euchre-trump').textContent).toMatch(/^Trump /);
    for (
      let k = 0;
      k < 4 && !screen.getByTestId('trick-hand').querySelector('button:not([disabled])');
      k++
    )
      await settle(1000);
    const playable = [
      ...screen.getByTestId('trick-hand').querySelectorAll('button:not([disabled])'),
    ];
    expect(playable.length).toBeGreaterThan(0);
    fireEvent.click(playable[0]!);
    expect(screen.getByTestId('trick-hand').querySelectorAll('button')).toHaveLength(4);
    expect(calls.saves.length).toBeGreaterThan(0);
  });
});
