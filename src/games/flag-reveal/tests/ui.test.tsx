// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { country } from '../../shared/world/world';
import { randomGame } from '../engine';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Flag Reveal UI', () => {
  it('lifts a tile on a miss and wins on the right country', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await screen.findByTestId('fr-menu');
    fireEvent.click(screen.getByTestId('fr-random'));
    const target = randomGame(6).target;
    const decoy = target === 'FR' ? 'DE' : 'FR';
    fireEvent.change(screen.getByTestId('fr-input'), { target: { value: country(decoy).name.en } });
    fireEvent.click(screen.getByTestId('fr-go'));
    const open = [0, 1, 2, 3, 4, 5].filter(
      (i) => screen.getByTestId(`fr-tile-${i}`).getAttribute('data-open') === 'true',
    );
    expect(open).toHaveLength(1);
    fireEvent.change(screen.getByTestId('fr-input'), {
      target: { value: country(target).name.es },
    });
    fireEvent.click(screen.getByTestId('fr-go'));
    expect(screen.getByTestId('fr-result').getAttribute('data-status')).toBe('won');
    expect(calls.results[0]).toMatchObject({ outcome: 'win', score: 2 });
  });
});
