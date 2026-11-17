// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { country } from '../../shared/world/world';
import { randomGame } from '../engine';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Hot & Cold Globe UI', () => {
  it('lists guesses by distance and finishes', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await screen.findByTestId('gl-menu');
    fireEvent.click(screen.getByTestId('gl-random'));
    const target = randomGame(3).target;
    for (const iso of ['FR', 'JP'].filter((x) => x !== target)) {
      fireEvent.change(screen.getByTestId('gl-input'), { target: { value: country(iso).name.en } });
      fireEvent.click(screen.getByTestId('gl-go'));
    }
    expect(screen.getByTestId('gl-closest').textContent).toMatch(/km/);
    fireEvent.change(screen.getByTestId('gl-input'), {
      target: { value: country(target).name.en },
    });
    fireEvent.click(screen.getByTestId('gl-go'));
    expect(screen.getByTestId('gl-result').getAttribute('data-status')).toBe('won');
    expect(calls.results[0]?.outcome).toBe('complete');
  });
});
