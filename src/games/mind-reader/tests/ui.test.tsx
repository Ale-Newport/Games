// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { DOMAINS } from '../knowledge';

afterEach(cleanup);

/** Answer honestly for an entity by reading each question's text. */
function honest(id: string) {
  const d = DOMAINS.animals;
  const e = d.entities.find((x) => x.id === id)!;
  const text = screen.getByTestId('mr-question').textContent!;
  const q = d.questions.find((x) => text.endsWith(x.en))!;
  return e.tags.includes(q.id) ? 'yes' : 'no';
}

describe('Mind Reader UI', () => {
  it('reads an honest player’s mind, and learns when it is beaten', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mr-domain-animals'));
    // Back undoes an answer.
    const first = screen.getByTestId('mr-question').textContent;
    fireEvent.click(screen.getByTestId('mr-a-yes'));
    fireEvent.click(screen.getByTestId('mr-back'));
    expect(screen.getByTestId('mr-question').textContent).toBe(first);
    for (let i = 0; i < 60 && !screen.queryByTestId('mr-guess'); i++)
      fireEvent.click(screen.getByTestId(`mr-a-${honest('penguin')}`));
    expect(screen.getByTestId('mr-guess').textContent).toMatch(/Penguin/);
    fireEvent.click(screen.getByTestId('mr-right'));
    expect(screen.getByTestId('mr-won')).toBeTruthy();
    expect(calls.results.at(-1)).toMatchObject({ outcome: 'loss', mode: 'animals' });
    // Now beat it: keep saying it is wrong.
    fireEvent.click(screen.getByTestId('mr-again'));
    for (let i = 0; i < 200 && !screen.queryByTestId('mr-lost'); i++) {
      if (screen.queryByTestId('mr-wrong')) fireEvent.click(screen.getByTestId('mr-wrong'));
      else fireEvent.keyDown(window, { key: 'd' });
    }
    expect(screen.getByTestId('mr-lost').textContent).toMatch(/beat me/);
    fireEvent.change(screen.getByTestId('mr-search'), { target: { value: 'snail' } });
    fireEvent.click(screen.getByTestId('mr-teach-snail'));
    expect(screen.getByTestId('mr-lost').textContent).toMatch(/remember that Snail/);
    expect(calls.achievements).toContain('stumped');
    fireEvent.click(screen.getByTestId('mr-menu-btn'));
    expect(screen.getByTestId('mr-menu').textContent).toMatch(
      /guessed right 1 times · you stumped me 1 times/,
    );
  });
});
