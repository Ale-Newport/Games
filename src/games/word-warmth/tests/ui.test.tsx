// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => cleanup());

const submit = (w: string) => {
  fireEvent.change(screen.getByTestId('ww-input'), { target: { value: w } });
  fireEvent.click(screen.getByTestId('ww-submit'));
};

describe('Word Warmth UI', () => {
  it('shows the header, scores guesses and gives up', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await screen.findByTestId('ww-menu', undefined, { timeout: 15_000 });
    fireEvent.click(screen.getByTestId('ww-random'));
    expect(screen.getByTestId('ww-header').textContent).toMatch(/\d+\.\d\d/);
    submit('qqqq');
    expect(screen.getByTestId('ww-message').textContent).toMatch(/know/);
    submit('happiness');
    submit('stone');
    expect(screen.getByTestId('ww-table').querySelectorAll('tbody tr')).toHaveLength(3);
    fireEvent.click(screen.getByTestId('ww-giveup'));
    expect(screen.getByTestId('ww-result')).toBeTruthy();
    expect(calls.results[0]).toMatchObject({ outcome: 'loss' });
  });
});
