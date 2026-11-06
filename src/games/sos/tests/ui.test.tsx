// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('SOS UI', () => {
  it('writes the chosen letter, scores, and grants another turn', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(0));
    fireEvent.click(cell(2));
    fireEvent.click(screen.getByTestId('letter-O'));
    fireEvent.click(cell(1));
    expect(cell(1).getAttribute('aria-label')).toBe('b6, O');
    expect(screen.getByTestId('scores').textContent).toBe('SOS — Red 1 · Blue 0');
    expect(screen.getByTestId('status-info').textContent).toBe('Red scored and writes again');
  });
});
