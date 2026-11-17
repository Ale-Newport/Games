// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Sketch & Guess UI', () => {
  it('opens a room, shows the word choice or a bot drawing, and takes chat guesses', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('sg-menu');
    const start = screen.getByTestId('sg-start') as HTMLButtonElement;
    for (let i = 0; i < 100 && start.disabled; i++) await new Promise((r) => setTimeout(r, 100));
    fireEvent.click(screen.getByTestId('sg-bots-2'));
    fireEvent.click(start);
    expect(screen.getByTestId('sg-room')).toBeTruthy();
    // Player 0 draws first: pick a word.
    const options = await screen.findByTestId('sg-choose');
    fireEvent.click(options.querySelector('button')!);
    expect(screen.getByTestId('sg-pad')).toBeTruthy();
    expect(screen.getByTestId('sg-hint').textContent!.length).toBeGreaterThan(1);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.getByTestId('sg-clock').textContent).toMatch(/\d+/);
  });
});
