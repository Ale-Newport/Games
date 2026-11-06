import type { Seat } from '../two-player/match';

/** Black (seat 0) or white (seat 1) stone, used as the shell's seat icon. */
export function StoneIcon({ seat, size }: { seat: Seat; size: number }) {
  return (
    <svg width={size + 4} height={size + 4} viewBox="0 0 100 100" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="44"
        fill={seat === 0 ? '#15171d' : '#f4f5f8'}
        stroke={seat === 0 ? '#5a5f6e' : '#9aa0ae'}
        strokeWidth="6"
      />
    </svg>
  );
}
