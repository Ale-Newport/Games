// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Blackjack UI', () => {
  it('bets with a chip, doubles on 11 and records the round (shoe 25)', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '25' } });
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'Bet 10' }));
    expect(screen.getByTestId('bj-value-0').textContent).toBe('11');
    fireEvent.click(screen.getByTestId('bj-hint'));
    expect(screen.getByTestId('bj-status').textContent).toBe('Basic strategy: Double');
    fireEvent.click(screen.getByTestId('bj-double'));
    expect(screen.getByTestId('bj-outcome-0')).toBeTruthy();
    expect(calls.results).toHaveLength(1);
    expect(calls.results[0]!.mode).toBe('blackjack');
    fireEvent.click(screen.getByTestId('bj-next'));
    expect(screen.getByRole('button', { name: 'Bet 500' })).toBeTruthy();
  });

  it('plays a natural and keys through insurance', async () => {
    const first = createTestServices({ launchParams: { deal: '21' } });
    render(<Game services={first.services} />);
    await act(async () => {});
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByTestId('bj-outcome-0').textContent).toBe('Blackjack!');
    expect(screen.getByTestId('bj-bankroll').textContent).toBe('1015');
    expect(first.calls.achievements).toContain('natural');
    cleanup();
    const second = createTestServices({ launchParams: { deal: '12' } });
    render(<Game services={second.services} />);
    await act(async () => {});
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByTestId('bj-status').textContent).toContain('Insurance?');
    fireEvent.keyDown(window, { key: 'n' });
    expect(screen.getByTestId('bj-stand')).toBeTruthy();
  });
});
