/** What a year looks like in the street: the visual era cues the painter draws (and agents read). */
export type Vehicle = 'carriage' | 'vintage' | 'rounded' | 'boxy' | 'modern';
export type Clothing = 'victorian' | 'interwar' | 'midcentury' | 'seventies' | 'modern';

export interface EraCues {
  vehicle: Vehicle;
  lamp: 'gas' | 'electric' | 'led';
  clothing: Clothing;
  antennas: boolean;
  dishes: boolean;
  phones: boolean;
  paved: boolean;
}

export function eraOf(year: number): EraCues {
  return {
    vehicle:
      year < 1908
        ? 'carriage'
        : year < 1936
          ? 'vintage'
          : year < 1966
            ? 'rounded'
            : year < 1996
              ? 'boxy'
              : 'modern',
    lamp: year < 1905 ? 'gas' : year < 2010 ? 'electric' : 'led',
    clothing:
      year < 1915
        ? 'victorian'
        : year < 1946
          ? 'interwar'
          : year < 1966
            ? 'midcentury'
            : year < 1990
              ? 'seventies'
              : 'modern',
    antennas: year >= 1952 && year < 2005,
    dishes: year >= 1994,
    phones: year >= 2008,
    paved: year >= 1915,
  };
}

/** The middle year of the band each cue points at (used by the clue-reading agent). */
export const VEHICLE_YEARS: Record<Vehicle, [number, number]> = {
  carriage: [1850, 1907],
  vintage: [1908, 1935],
  rounded: [1936, 1965],
  boxy: [1966, 1995],
  modern: [1996, 2025],
};
