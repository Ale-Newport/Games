/**
 * An SVG world (or regional) map of Natural Earth shapes. Countries can be coloured by state and
 * clicked. Small countries get a dot so they stay clickable. Shapes load lazily.
 */
import type { GeoPermissibleObjects } from 'd3-geo';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useEffect, useMemo, useState } from 'react';
import { country, loadShapes, type Shapes } from './world';
import styles from './WorldMap.module.css';

export type CountryTone = 'found' | 'missed' | 'target' | 'wrong' | 'active' | 'muted';

/** Lon/lat boxes that frame each continent's main land (overseas territories fall outside). */
const BOXES: Record<string, [number, number, number, number]> = {
  eu: [-25, 34, 45, 71],
  af: [-26, -36, 58, 38],
  as: [25, -11, 150, 56],
  na: [-170, 6, -50, 72],
  sa: [-92, -56, -33, 14],
  oc: [110, -48, 180, 2],
};

/** A lon/lat rectangle (as a GeoJSON polygon) covering the given continents. */
export function regionBox(region: readonly string[]): GeoPermissibleObjects {
  const boxes = region.map((r) => BOXES[r]!).filter(Boolean);
  const x0 = Math.min(...boxes.map((b) => b[0]));
  const y0 = Math.min(...boxes.map((b) => b[1]));
  const x1 = Math.max(...boxes.map((b) => b[2]));
  const y1 = Math.max(...boxes.map((b) => b[3]));
  const ring: [number, number][] = [];
  for (let x = x0; x <= x1; x += (x1 - x0) / 8) ring.push([x, y0]);
  for (let y = y0; y <= y1; y += (y1 - y0) / 8) ring.push([x1, y]);
  for (let x = x1; x >= x0; x -= (x1 - x0) / 8) ring.push([x, y1]);
  for (let y = y1; y >= y0; y -= (y1 - y0) / 8) ring.push([x0, y]);
  ring.push(ring[0]!);
  return { type: 'Polygon', coordinates: [ring.reverse()] };
}

const W = 960;
const H = 520;

export function WorldMap({
  region,
  tones,
  onPick,
  label,
  testId = 'world-map',
}: {
  /** Continents to frame (all when empty). */
  region?: readonly string[];
  tones: Record<string, CountryTone | undefined>;
  onPick?: (iso2: string) => void;
  label: string;
  testId?: string;
}) {
  const [shapes, setShapes] = useState<Shapes | null>(null);
  useEffect(() => {
    let alive = true;
    void loadShapes().then((s) => alive && setShapes(s));
    return () => {
      alive = false;
    };
  }, []);

  const drawn = useMemo(() => {
    if (!shapes) return null;
    const inRegion = (id: string) => !region?.length || region.includes(country(id).continent);
    const projection = geoNaturalEarth1();
    if (region?.length)
      projection.fitExtent(
        [
          [12, 12],
          [W - 12, H - 12],
        ],
        regionBox(region),
      );
    else
      projection.fitExtent(
        [
          [6, 6],
          [W - 6, H - 6],
        ],
        { type: 'Sphere' },
      );
    const path = geoPath(projection);
    return shapes.collection.features.map((f) => {
      const id = String(f.id);
      const d = path(f) ?? '';
      const [[x0, y0], [x1, y1]] = path.bounds(f);
      const tiny = (x1 - x0) * (y1 - y0) < 40;
      const c = projection(shapes.centroid.get(id)!);
      return { id, d, tiny, cx: c?.[0] ?? 0, cy: c?.[1] ?? 0, inside: inRegion(id) };
    });
  }, [shapes, region]);

  if (!drawn) {
    return (
      <div className={styles.loading} data-testid={`${testId}-loading`}>
        …
      </div>
    );
  }

  return (
    <svg
      className={styles.map}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      data-testid={testId}
    >
      <rect width={W} height={H} className={styles.sea} />
      {drawn.map((c) => (
        <path
          key={c.id}
          d={c.d}
          className={styles.country}
          data-tone={tones[c.id] ?? (c.inside ? 'idle' : 'outside')}
          data-iso={c.id}
          onClick={onPick && c.inside ? () => onPick(c.id) : undefined}
        />
      ))}
      {drawn
        .filter((c) => c.tiny && c.inside)
        .map((c) => (
          <circle
            key={`dot-${c.id}`}
            cx={c.cx}
            cy={c.cy}
            r={5}
            className={styles.dot}
            data-tone={tones[c.id] ?? 'idle'}
            data-iso={c.id}
            onClick={onPick ? () => onPick(c.id) : undefined}
          />
        ))}
    </svg>
  );
}
