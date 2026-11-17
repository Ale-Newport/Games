/**
 * A country's silhouette, drawn with an azimuthal equal-area projection centred on it (so its
 * shape is true, whatever its latitude) and scaled to fill the box.
 */
import { geoAzimuthalEqualArea, geoPath } from 'd3-geo';
import { useEffect, useState } from 'react';
import { centroidOf, loadShapes, type Shapes } from './world';

export function Silhouette({
  iso2,
  size = 300,
  className,
  label,
}: {
  iso2: string;
  size?: number;
  className?: string;
  label: string;
}) {
  const [shapes, setShapes] = useState<Shapes | null>(null);
  useEffect(() => {
    let alive = true;
    void loadShapes().then((s) => alive && setShapes(s));
    return () => {
      alive = false;
    };
  }, []);
  const f = shapes?.features.get(iso2);
  let d = '';
  if (f) {
    const [lon, lat] = centroidOf(iso2);
    const projection = geoAzimuthalEqualArea()
      .rotate([-lon, -lat])
      .fitExtent(
        [
          [size * 0.06, size * 0.06],
          [size * 0.94, size * 0.94],
        ],
        f,
      );
    d = geoPath(projection)(f) ?? '';
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={label}
      data-testid="silhouette"
      data-ready={d ? 'true' : 'false'}
    >
      {d && <path d={d} fill="currentColor" />}
    </svg>
  );
}
