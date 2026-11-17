/** The 360° view: drag (or use the arrow keys) to look around a painted street scene. */
import { useEffect, useRef, useState } from 'react';
import { flagUrl } from '../shared/world/world';
import { paint, PH, PW } from './painter';
import type { Scene } from './scenes';
import styles from './WhenWhere.module.css';

const VW = 960;
const VH = 540;

export function Panorama({ scene, label, hint }: { scene: Scene; label: string; hint: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const yaw = useRef(1600);
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const [moved, setMoved] = useState(false);

  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    const off = offRef.current;
    if (!ctx || !off) return;
    const sw = (PH * VW) / VH;
    const sx = ((yaw.current % PW) + PW) % PW;
    const first = Math.min(sw, PW - sx);
    ctx.drawImage(off, sx, 0, first, PH, 0, 0, (first / sw) * VW, VH);
    if (first < sw)
      ctx.drawImage(off, 0, 0, sw - first, PH, (first / sw) * VW, 0, ((sw - first) / sw) * VW, VH);
  };

  useEffect(() => {
    let alive = true;
    const off = document.createElement('canvas');
    off.width = PW;
    off.height = PH;
    offRef.current = off;
    const ctx = off.getContext('2d');
    const render = (img: HTMLImageElement | null) => {
      if (!ctx || !alive) return;
      paint(ctx, scene, img);
      draw();
    };
    render(null);
    if (scene.flag)
      void flagUrl(scene.iso2)
        .then((u) => {
          const img = new Image();
          img.onload = () => render(img);
          img.src = u;
        })
        .catch(() => undefined);
    yaw.current = 1500;
    return () => {
      alive = false;
    };
  }, [scene]);

  return (
    <div className={styles.pano}>
      <canvas
        ref={canvasRef}
        width={VW}
        height={VH}
        className={styles.panoCanvas}
        role="img"
        aria-label={label}
        tabIndex={0}
        data-testid="ww-pano"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, yaw: yaw.current };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const r = e.currentTarget.getBoundingClientRect();
          yaw.current = d.yaw - ((e.clientX - d.x) / (r.width || 1)) * ((PH * VW) / VH);
          if (!moved) setMoved(true);
          draw();
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            yaw.current += e.key === 'ArrowLeft' ? -120 : 120;
            if (!moved) setMoved(true);
            draw();
          }
        }}
      />
      {!moved && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
