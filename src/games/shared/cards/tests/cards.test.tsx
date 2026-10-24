// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cardName, cardShort, isRed, makeCard, rankOf, shuffledDeck, suitOf } from '../cards';
import { CardView } from '../CardView';

describe('cards', () => {
  it('numbers cards by suit and rank', () => {
    const qh = makeCard(1, 12);
    expect([suitOf(qh), rankOf(qh), isRed(qh)]).toEqual([1, 12, true]);
    expect(cardShort(qh)).toBe('Q♥');
    expect(cardName(qh, 'en')).toBe('queen of hearts');
    expect(cardName(makeCard(3, 1), 'es')).toBe('as de tréboles');
    expect(isRed(makeCard(0, 5))).toBe(false);
  });

  it('shuffles reproducibly, with multi-deck and reduced-suit decks', () => {
    const a = shuffledDeck(11);
    expect(a).toHaveLength(52);
    expect(new Set(a).size).toBe(52);
    expect(shuffledDeck(11)).toEqual(a);
    expect(shuffledDeck(12)).not.toEqual(a);
    const two = shuffledDeck(5, 2);
    expect(new Set(two).size).toBe(104);
    const spadesOnly = shuffledDeck(5, 2, [0]);
    expect(spadesOnly).toHaveLength(104);
    expect(spadesOnly.every((c) => suitOf(c) === 0)).toBe(true);
    expect(new Set(spadesOnly).size).toBe(104);
  });

  it('draws faces with pips, court emblems and a back', () => {
    const face = render(<CardView card={makeCard(2, 7)} faceUp />);
    expect(face.container.querySelectorAll('path').length).toBeGreaterThanOrEqual(9);
    expect(face.container.textContent).toContain('7');
    face.unmount();
    const king = render(<CardView card={makeCard(0, 13)} faceUp fourColor />);
    expect(king.container.textContent).toContain('K');
    king.unmount();
    const back = render(<CardView card={0} faceUp={false} />);
    expect(back.container.textContent).toBe('');
  });
});
