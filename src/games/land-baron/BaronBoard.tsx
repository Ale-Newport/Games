/**
 * The Land Baron board: the 36 spaces round a 10 × 10 grid (Start in the bottom-right corner, play
 * running clockwise from there along the bottom), each with its district colour band, name, price,
 * owner, buildings, mortgage stripes and the players' tokens. The centre shows the dice and the
 * last card drawn. Every space is a button that shows its details beside the board.
 */
import type { Locale, Translator } from '../../core/i18n';
import { COUNCIL, GROUPS, LUCK, SPACES } from './board';
import type { Baron } from './engine';
import styles from './LandBaron.module.css';

/** Grid cell (row, column), 1-based, of space i. */
export function cellOf(i: number): [number, number] {
  if (i <= 9) return [10, 10 - i];
  if (i <= 18) return [10 - (i - 9), 1];
  if (i <= 27) return [1, 1 + (i - 18)];
  return [1 + (i - 27), 10];
}

const ICON: Record<string, string> = {
  start: '➜',
  luck: '?',
  council: '⚖',
  tax: '¤',
  ferry: '⛴',
  works: '⚙',
  lockup: '▦',
  plaza: '✿',
  arrest: '⚑',
};

export function BaronBoard({
  g,
  t,
  locale,
  selected,
  hint,
  onPick,
}: {
  g: Baron;
  t: Translator;
  locale: Locale;
  selected: number | null;
  hint: number | null;
  onPick: (i: number) => void;
}) {
  const card = g.card
    ? (g.card.deck === 'luck' ? LUCK : COUNCIL).find((c) => c.id === g.card!.id)
    : null;
  return (
    <div className={styles.board} role="group" aria-label={t('aria.board')} data-testid="lb-board">
      {SPACES.map((sp, i) => {
        const [r, c] = cellOf(i);
        const owner = g.owner[i];
        const h = g.houses[i]!;
        const here = g.pos.map((p, q) => (p === i && !g.out[q] ? q : -1)).filter((q) => q >= 0);
        const side = i < 9 ? 'b' : i < 18 ? 'l' : i < 27 ? 't' : 'r';
        return (
          <button
            key={i}
            type="button"
            className={styles.space}
            style={{
              gridRow: r,
              gridColumn: c,
              ['--band' as string]: sp.kind === 'lot' ? GROUPS[sp.group!]!.colour : 'transparent',
              ['--own' as string]:
                owner === null || owner === undefined
                  ? 'transparent'
                  : `var(--player-${owner + 1})`,
            }}
            data-kind={sp.kind}
            data-side={side}
            data-corner={i % 9 === 0}
            data-owned={owner !== null && owner !== undefined}
            data-mortgaged={g.mortgaged[i]}
            data-selected={selected === i}
            data-hint={hint === i}
            aria-label={sp.name[locale]}
            aria-pressed={selected === i}
            onClick={() => onPick(i)}
            data-testid={`lb-space-${i}`}
          >
            {sp.kind === 'lot' && <span className={styles.band} />}
            <span className={styles.sname}>
              {sp.kind !== 'lot' && <b className={styles.icon}>{ICON[sp.kind]}</b>}
              {sp.name[locale]}
            </span>
            {sp.price !== undefined && <span className={styles.price}>¤{sp.price}</span>}
            {sp.tax !== undefined && <span className={styles.price}>¤{sp.tax}</span>}
            {h > 0 && (
              <span className={styles.houses} data-hotel={h === 5}>
                {h === 5 ? 'H' : '■'.repeat(h)}
              </span>
            )}
            {here.length > 0 && (
              <span className={styles.tokens}>
                {here.map((q) => (
                  <i
                    key={q}
                    style={{ background: `var(--player-${q + 1})` }}
                    data-turn={q === g.turn}
                    data-testid={`lb-token-${q}`}
                  />
                ))}
              </span>
            )}
          </button>
        );
      })}
      <div className={styles.centre}>
        <strong className={styles.logo}>{t('title')}</strong>
        <div
          className={styles.dice}
          data-testid="lb-dice"
          aria-label={g.dice ? t('dice', { a: g.dice[0], b: g.dice[1] }) : undefined}
        >
          {g.dice && (
            <>
              <span className={styles.die}>{g.dice[0]}</span>
              <span className={styles.die}>{g.dice[1]}</span>
            </>
          )}
        </div>
        {card && (
          <p className={styles.card} data-deck={g.card!.deck} data-testid="lb-card">
            {card.text[locale]}
          </p>
        )}
      </div>
    </div>
  );
}
