/** Seat icon for Hex: a small hexagon in the side's color. */
export function HexSeatIcon({ seat, size }: { seat: 0 | 1; size: number }) {
  return (
    <svg width={size + 4} height={size + 4} viewBox="0 0 100 100" aria-hidden="true">
      <polygon
        points="50,4 90,27 90,73 50,96 10,73 10,27"
        fill={seat === 0 ? '#d64545' : '#3a6fd8'}
        stroke={seat === 0 ? '#8f2020' : '#1d3f8a'}
        strokeWidth="8"
      />
    </svg>
  );
}
