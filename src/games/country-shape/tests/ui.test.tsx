// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { randomGame } from '../engine';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Country Shape UI', () => {
  it('guesses with suggestions, wins and answers the bonus questions', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await screen.findByTestId('cs-menu');
    fireEvent.click(screen.getByTestId('cs-random'));
    const target = randomGame(5).target;
    const decoy = target === 'FR' ? 'DE' : 'FR';
    fireEvent.change(screen.getByTestId('cs-input'), {
      target: { value: decoy === 'FR' ? 'fran' : 'germ' },
    });
    fireEvent.mouseDown(screen.getByTestId(`cs-option-${decoy}`));
    expect(screen.getByTestId('cs-row-0').textContent).toMatch(/km/);
    const { country } = await import('../../shared/world/world');
    fireEvent.change(screen.getByTestId('cs-input'), {
      target: { value: country(target).name.en },
    });
    fireEvent.click(screen.getByTestId('cs-go'));
    expect(screen.getByTestId('cs-result').getAttribute('data-status')).toBe('won');
    fireEvent.click(screen.getByTestId(`cs-capital-${target}`));
    fireEvent.click(screen.getByTestId(`cs-flag-${target}`));
    expect(calls.achievements).toEqual(expect.arrayContaining(['first-shape', 'three-stars']));
    expect(calls.results[0]).toMatchObject({ outcome: 'win', score: 2 });
  });
});
