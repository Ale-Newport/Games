// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Caption Battle UI', () => {
  it('captions, rates and shows the round results', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('cb-menu');
    fireEvent.click(screen.getByTestId('cb-bots-2'));
    fireEvent.click(screen.getByTestId('cb-start'));
    fireEvent.click(screen.getByTestId('cb-ready'));
    fireEvent.change(screen.getByTestId('cb-input'), {
      target: { value: 'me when the deploy works first time' },
    });
    fireEvent.click(screen.getByTestId('cb-submit'));
    fireEvent.click(screen.getByTestId('cb-ready'));
    expect(screen.getByTestId('cb-rate')).toBeTruthy();
    fireEvent.click(screen.getByTestId('cb-star-1-5'));
    fireEvent.click(screen.getByTestId('cb-rate-submit'));
    expect(screen.getByTestId('cb-results').textContent).toContain('★');
  });
});
