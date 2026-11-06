// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;
const play = (from: string, to: string) => {
  fireEvent.click(square(from));
  fireEvent.click(square(to));
};

afterEach(cleanup);

describe('Three-Check UI', () => {
  it('shows both check counters and updates them after a check', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe('Checks — White 0/3 · Black 0/3');
    play('e2', 'e4');
    play('d7', 'd6');
    play('f1', 'b5');
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Checks — White 1/3 · Black 0/3 · Check!',
    );
    expect(screen.getByTestId('move-list').textContent).toContain('Bb5+');
  });
});
