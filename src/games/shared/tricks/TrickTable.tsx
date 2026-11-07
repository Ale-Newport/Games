/**
 * The four-seat table shared by the trick-taking games: the player's hand fanned along the bottom
 * (playable cards raised, others dimmed when it is their turn, picked cards lifted), the three
 * opponents' hands as fans of card backs (face up when watching), each seat's plate, and the
 * current trick in the middle with every card pushed toward the seat that played it.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { Locale } from '../../../core/i18n';
import { cardName } from '../cards/cards';
import { CardView } from '../cards/CardView';
import type { Play } from './cards';
import styles from './TrickTable.module.css';

export interface TrickSeat {
  name: string;
  /** A short line under the name (score, tricks, bid). */
  detail: string;
  /** Cards in hand (the backs drawn for opponents). */
  cards: number[];
  active: boolean;
  /** Dealer, trump caller, a team colour… */
  badge?: string;
  team?: 0 | 1;
  /** Show this hand face up and larger (bridge's dummy). */
  open?: boolean;
  /** Cards of this (open) hand the player may tap now. */
  playable?: ReadonlySet<number>;
}

export interface TrickTableProps {
  seats: TrickSeat[];
  /** Seat 0's hand in display order. */
  hand: number[];
  /** Cards seat 0 may tap now (empty when it is not their turn). */
  playable: ReadonlySet<number>;
  /** Cards picked (for a pass), drawn lifted. */
  picked?: ReadonlySet<number>;
  /** Cards just received, outlined. */
  fresh?: ReadonlySet<number>;
  onCard?: (card: number) => void;
  /** Taps on an open hand of another seat (dummy), when it has playable cards. */
  onSeatCard?: (seat: number, card: number) => void;
  trick: readonly Play[];
  /** The seat that took the trick on display, if it is complete. */
  winner?: number | null;
  /** Show the opponents' hands face up (watch mode). */
  reveal?: boolean;
  locale: Locale;
  colorblind: boolean;
  still: boolean;
  /** Text and controls drawn in the middle of the table under the trick. */
  center?: ReactNode;
  labels: { hidden: string; hand: string };
}

const POSITIONS = ['south', 'west', 'north', 'east'] as const;

export function TrickTable(props: TrickTableProps) {
  const { seats, hand, playable, picked, fresh, onCard, trick, winner, reveal, locale } = props;
  const myTurn = playable.size > 0;
  return (
    <div className={`${styles.wrap} ${props.still ? styles.still : ''}`}>
      <div className={styles.table}>
        {seats.slice(1).map((seat, k) => {
          const i = k + 1;
          return (
            <div
              key={i}
              className={`${styles.opponent} ${styles[POSITIONS[i]!]} ${seat.active ? styles.active : ''}`}
              data-testid={`trick-seat-${i}`}
            >
              <div
                className={`${styles.backs} ${seat.open ? styles.open : ''}`}
                aria-label={`${seat.name}: ${seat.cards.length}`}
              >
                {seat.cards.map((c, j) =>
                  seat.open && seat.playable ? (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.back} ${seat.playable.size && !seat.playable.has(c) ? styles.dim : ''} ${seat.playable.has(c) ? styles.can : ''}`}
                      disabled={!seat.playable.has(c)}
                      aria-label={cardName(c, locale)}
                      onClick={() => props.onSeatCard?.(i, c)}
                      data-card={c}
                    >
                      <CardView card={c} faceUp fourColor={props.colorblind} />
                    </button>
                  ) : (
                    <div
                      key={reveal || seat.open ? c : j}
                      className={styles.back}
                      role={reveal || seat.open ? 'img' : undefined}
                      aria-label={reveal || seat.open ? cardName(c, locale) : undefined}
                    >
                      <CardView
                        card={c}
                        faceUp={!!reveal || !!seat.open}
                        fourColor={props.colorblind}
                      />
                    </div>
                  ),
                )}
              </div>
              <Plate seat={seat} />
            </div>
          );
        })}
        <div className={styles.center}>
          <div className={styles.trick} data-testid="trick-cards">
            {trick.map((p) => (
              <div
                key={`${p.seat}-${p.card}`}
                className={`${styles.played} ${styles[`from${POSITIONS[p.seat]}`]} ${winner === p.seat ? styles.taking : ''}`}
                role="img"
                aria-label={`${seats[p.seat]!.name}: ${cardName(p.card, locale)}`}
              >
                <CardView card={p.card} faceUp fourColor={props.colorblind} />
              </div>
            ))}
          </div>
          {props.center}
        </div>
      </div>
      <div
        className={`${styles.me} ${seats[0]!.active ? styles.active : ''}`}
        data-testid="trick-seat-0"
      >
        <Plate seat={seats[0]!} />
        <div
          className={styles.hand}
          style={{ '--count': hand.length } as CSSProperties}
          aria-label={props.labels.hand}
          data-testid="trick-hand"
        >
          {hand.map((c) => {
            const can = playable.has(c);
            return (
              <button
                key={c}
                type="button"
                className={[
                  styles.card,
                  myTurn && !can ? styles.dim : '',
                  can ? styles.can : '',
                  picked?.has(c) ? styles.picked : '',
                  fresh?.has(c) ? styles.fresh : '',
                ].join(' ')}
                disabled={!can}
                aria-pressed={picked ? picked.has(c) : undefined}
                aria-label={cardName(c, locale)}
                onClick={() => onCard?.(c)}
                data-card={c}
              >
                <CardView card={c} faceUp fourColor={props.colorblind} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Plate({ seat }: { seat: TrickSeat }) {
  return (
    <div className={styles.plate} data-team={seat.team}>
      <span className={styles.name}>
        {seat.name}
        {seat.badge && <span className={styles.badge}>{seat.badge}</span>}
      </span>
      <span className={styles.detail}>{seat.detail}</span>
    </div>
  );
}
