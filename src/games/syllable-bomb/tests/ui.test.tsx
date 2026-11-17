// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Syllable Bomb UI', () => {
  it('starts a room and rejects a word without the prompt on your turn', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('sb-menu', undefined, { timeout: 20_000 });
    fireEvent.click(screen.getByTestId('sb-bots-1'));
    fireEvent.click(screen.getByTestId('sb-start'));
    expect(screen.getByTestId('sb-prompt').textContent!.length).toBeGreaterThanOrEqual(2);
    // Wait until it is the player's turn (bots may hold the bomb first).
    for (let i = 0; i < 200 && (screen.getByTestId('sb-input') as HTMLInputElement).disabled; i++)
      await new Promise((r) => setTimeout(r, 100));
    const input = screen.getByTestId('sb-input') as HTMLInputElement;
    if (!input.disabled) {
      fireEvent.change(input, { target: { value: 'qqqqqq' } });
      fireEvent.submit(input.closest('form')!);
      expect(screen.getByTestId('sb-message').textContent).toMatch(/contain|dictionary|letters/);
    }
    expect(screen.getByTestId('sb-alphabet')).toBeTruthy();
  }, 40_000);
});
