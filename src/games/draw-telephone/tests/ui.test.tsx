// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Draw Telephone UI', () => {
  it('plays every step for one person with bots and opens the album', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('dt-menu');
    fireEvent.click(screen.getByTestId('dt-bots-2'));
    const start = screen.getByTestId('dt-start');
    for (let i = 0; i < 100 && (start as HTMLButtonElement).disabled; i++)
      await new Promise((r) => setTimeout(r, 100));
    fireEvent.click(start);
    for (let step = 0; step < 3; step++) {
      fireEvent.click(await screen.findByTestId('dt-ready'));
      const text = screen.queryByTestId('dt-text');
      if (text)
        fireEvent.change(text, { target: { value: step === 0 ? 'A cat in space' : 'a cat' } });
      fireEvent.click(screen.getByTestId('dt-done'));
    }
    expect(await screen.findByTestId('dt-album')).toBeTruthy();
    expect(screen.getByTestId('dt-entry-0').textContent).toContain('A cat in space');
    expect(calls.achievements).toContain('first-album');
  }, 30_000);
});
