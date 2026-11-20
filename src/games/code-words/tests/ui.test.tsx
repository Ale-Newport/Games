// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Code Words UI', () => {
  it('lets the spymaster see the key, rejects a board word as a clue and accepts a real one', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('cw-menu', undefined, { timeout: 15_000 });
    fireEvent.click(screen.getByTestId('cw-role-spymaster'));
    fireEvent.click(screen.getByTestId('cw-start'));
    const cards = Array.from({ length: 25 }, (_, i) => screen.getByTestId(`cw-card-${i}`));
    expect(cards.every((c) => c.getAttribute('data-role') !== 'hidden')).toBe(true);
    // On a slow machine the opposing bots may still be playing: wait for our clue form, and
    // query it afresh each time (it re-renders when the turn changes).
    await screen.findByTestId('cw-clue-form', undefined, { timeout: 20_000 });
    // A word the bots have not revealed yet (revealed words are legal clues).
    const hidden = Array.from({ length: 25 }, (_, i) => screen.getByTestId(`cw-card-${i}`)).find(
      (c) => c.getAttribute('data-open') !== 'true',
    )!;
    fireEvent.change(screen.getByTestId('cw-clue-word'), {
      target: { value: hidden.textContent },
    });
    fireEvent.submit(screen.getByTestId('cw-clue-form'));
    expect((await screen.findByTestId('cw-problem')).textContent).toMatch(/board/);
    fireEvent.change(screen.getByTestId('cw-clue-word'), { target: { value: 'weather' } });
    fireEvent.submit(screen.getByTestId('cw-clue-form'));
    expect((await screen.findByTestId('cw-clue')).textContent).toContain('WEATHER');
  }, 45_000);

  it('hides the key from the operative', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('cw-menu', undefined, { timeout: 15_000 });
    fireEvent.click(screen.getByTestId('cw-start'));
    const roles = Array.from({ length: 25 }, (_, i) =>
      screen.getByTestId(`cw-card-${i}`).getAttribute('data-role'),
    );
    expect(roles.every((r) => r === 'hidden')).toBe(true);
  });
});
