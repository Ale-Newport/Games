// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { setOffsets } from '../RichEditor';

afterEach(cleanup);

const type = (text: string) => {
  const el = screen.getByTestId('pw-input');
  el.textContent = text;
  fireEvent.input(el);
};

describe('Password Rules UI', () => {
  it('reveals rules as they are met, formats characters and inserts emoji', async () => {
    const { services } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await act(async () => {});
    type('abc');
    expect(screen.getByTestId('pw-rule-length5').dataset.ok).toBe('false');
    expect(screen.getByTestId('pw-length').textContent).toBe('3');
    type('Abcde1!');
    expect(screen.getByTestId('pw-rule-special').dataset.ok).toBe('true');
    expect(screen.getByTestId('pw-rule-digits25').dataset.ok).toBe('false');
    expect(screen.getByTestId('pw-met').textContent).toMatch(/4 of 5/);
    type('Abcde1!996');
    expect(screen.getByTestId('pw-rule-month')).toBeTruthy();
    // Bold the "e": select it and press the toolbar button.
    const el = screen.getByTestId('pw-input');
    el.focus();
    setOffsets(el, 4, 5);
    document.dispatchEvent(new Event('selectionchange'));
    fireEvent.click(screen.getByTestId('pw-bold'));
    const bold = el.querySelector('span[data-b="1"]');
    expect(bold?.textContent).toBe('e');
    // Emoji buttons insert at the caret.
    setOffsets(el, 0, 0);
    document.dispatchEvent(new Event('selectionchange'));
    fireEvent.click(screen.getByTestId('pw-emoji-💪'));
    expect(el.textContent!.startsWith('💪Abcd')).toBe(true);
    expect(screen.getByTestId('pw-length').textContent).toBe('11');
  });
});
