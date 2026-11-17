/**
 * Paints a scene's 360° street panorama onto a canvas (3,600 × 640 logical pixels). Everything is
 * drawn from the scene's clues and a seed: sky, terrain, a landmark, buildings in the local style
 * with shop signs in the local script, the ground, lamps, a flag, era-appropriate vehicles and
 * people, and weather.
 */
import { eraOf, type EraCues } from './era';
import type { Scene } from './scenes';

export const PW = 3600;
export const PH = 640;
const HORIZON = 400;
const STREET = 470;

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function rngFrom(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

type Ctx = CanvasRenderingContext2D;

const PALETTES: Record<Scene['style'], string[]> = {
  haussmann: ['#e8dcc4', '#ddd0b2', '#efe6d2', '#d9cba8'],
  brick: ['#9c4a35', '#8a3f2e', '#a8573e', '#7d3a2b', '#b56a4a'],
  canalhouse: ['#6b3a2a', '#3d2b24', '#8a5a3a', '#2f3f4f', '#7a2f2a'],
  colonial: ['#f2c14e', '#e98a6b', '#8fc1d4', '#f4e1b0', '#c9e3a6', '#f0a6b8'],
  adobe: ['#d9b48f', '#c99c6e', '#e3c39d', '#cfa57a'],
  pagoda: ['#8a2b2b', '#5c4033', '#a33a2a', '#6b4f3a'],
  concrete: ['#a7a9ac', '#8e9196', '#b9b6ae', '#9aa0a6'],
  towers: ['#6f8fae', '#7ea3c4', '#5b7894', '#a3b8c9', '#4f6d8a'],
  nordic: ['#d64545', '#f2c14e', '#3a7ca5', '#2a9d8f', '#f4f1de', '#e76f51'],
  whitewash: ['#f7f7f2', '#eeeeea', '#f3efe6'],
  tropical: ['#ffb4a2', '#9ad1d4', '#ffd166', '#06d6a0', '#f7f7f2'],
  shophouse: ['#c9ada7', '#9a8c98', '#d8c3a5', '#a3b18a', '#e0afa0'],
};

function sky(ctx: Ctx, s: Scene, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  const stops: Record<Scene['sky'], [string, string]> = {
    day:
      s.climate === 'desert'
        ? ['#7fb3d5', '#f2e2c4']
        : s.climate === 'cold'
          ? ['#9fb8c8', '#e3e9ee']
          : ['#4f8fd6', '#cfe6fb'],
    dusk: ['#3b2a63', '#f4a261'],
    night: ['#07102a', '#28335a'],
  };
  g.addColorStop(0, stops[s.sky][0]);
  g.addColorStop(1, stops[s.sky][1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PW, HORIZON + 10);
  if (s.sky === 'night') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 160; i++) ctx.fillRect(rand() * PW, rand() * HORIZON * 0.6, 1.5, 1.5);
    ctx.fillStyle = '#f5f1d8';
    ctx.beginPath();
    ctx.arc(2600, 90, 26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = s.sky === 'dusk' ? '#ffcf7a' : '#fff6c9';
    ctx.globalAlpha = s.sky === 'dusk' ? 0.9 : 0.7;
    ctx.beginPath();
    ctx.arc(
      s.sky === 'dusk' ? 900 : 2200,
      s.sky === 'dusk' ? HORIZON - 40 : 90,
      s.sky === 'dusk' ? 40 : 34,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 9; i++) {
      const x = rand() * PW;
      const y = 40 + rand() * 150;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(x + k * 28, y + (k % 2) * 6, 40, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function terrain(ctx: Ctx, s: Scene, rand: () => number) {
  const far = s.sky === 'night' ? '#1c2440' : s.climate === 'desert' ? '#c9a77d' : '#7d8f9e';
  if (s.hills === 'mountains' || s.hills === 'hills') {
    const peak = s.hills === 'mountains' ? 230 : 110;
    ctx.fillStyle = far;
    ctx.beginPath();
    ctx.moveTo(0, HORIZON);
    for (let x = 0; x <= PW; x += 60) {
      const y =
        HORIZON -
        peak * (0.35 + 0.65 * Math.abs(Math.sin(x / 520 + 1.3) * Math.sin(x / 210))) -
        rand() * (s.hills === 'mountains' ? 30 : 8);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(PW, HORIZON);
    ctx.fill();
    if (s.climate === 'cold' && s.hills === 'mountains') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let x = 0; x <= PW; x += 60) {
        const y =
          HORIZON - peak * (0.35 + 0.65 * Math.abs(Math.sin(x / 520 + 1.3) * Math.sin(x / 210)));
        if (y < HORIZON - peak * 0.7) ctx.fillRect(x - 18, y, 36, 14);
      }
    }
  }
  if (s.hills === 'sea' || s.ground === 'promenade') {
    // The sea fills the first third of the panorama.
    const g = ctx.createLinearGradient(0, HORIZON - 20, 0, STREET);
    g.addColorStop(0, s.sky === 'night' ? '#0d1b3a' : '#2f7fb5');
    g.addColorStop(1, s.sky === 'night' ? '#162a50' : '#5fa8d3');
    ctx.fillStyle = g;
    ctx.fillRect(0, HORIZON - 20, 1200, STREET - HORIZON + 20);
  }
}

function landmark(ctx: Ctx, s: Scene) {
  const x = 1800;
  const base = HORIZON + 10;
  const ink = s.sky === 'night' ? '#2a3150' : s.sky === 'dusk' ? '#4a3a5a' : '#6a7480';
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  switch (s.landmark) {
    case 'lattice-tower': {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 70, base);
      ctx.quadraticCurveTo(x - 20, base - 140, x - 6, base - 330);
      ctx.lineTo(x + 6, base - 330);
      ctx.quadraticCurveTo(x + 20, base - 140, x + 70, base);
      ctx.stroke();
      for (let y = base; y > base - 320; y -= 14) {
        const w = 70 * Math.pow((y - (base - 330)) / 330, 1.6);
        ctx.beginPath();
        ctx.moveTo(x - w, y);
        ctx.lineTo(x + w, y - 14);
        ctx.moveTo(x + w, y);
        ctx.lineTo(x - w, y - 14);
        ctx.stroke();
      }
      ctx.fillRect(x - 40, base - 110, 80, 8);
      ctx.fillRect(x - 24, base - 210, 48, 6);
      ctx.fillRect(x - 2, base - 360, 4, 30);
      break;
    }
    case 'onion-domes':
      for (const [dx, h, r, c] of [
        [-60, 150, 26, '#c0392b'],
        [0, 210, 36, '#2e86c1'],
        [60, 160, 24, '#27ae60'],
      ] as const) {
        ctx.fillStyle = s.sky === 'night' ? ink : '#d8cfc4';
        ctx.fillRect(x + dx - r * 0.7, base - h + r, r * 1.4, h - r);
        ctx.fillStyle = s.sky === 'night' ? ink : c;
        ctx.beginPath();
        ctx.moveTo(x + dx, base - h - r * 1.6);
        ctx.quadraticCurveTo(x + dx + r * 1.6, base - h - r * 0.2, x + dx, base - h + r);
        ctx.quadraticCurveTo(x + dx - r * 1.6, base - h - r * 0.2, x + dx, base - h - r * 1.6);
        ctx.fill();
      }
      break;
    case 'minaret':
      ctx.fillRect(x - 12, base - 260, 24, 260);
      ctx.fillRect(x - 20, base - 200, 40, 10);
      ctx.beginPath();
      ctx.moveTo(x - 14, base - 260);
      ctx.lineTo(x, base - 300);
      ctx.lineTo(x + 14, base - 260);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 110, base - 80, 70, Math.PI, 0);
      ctx.fill();
      break;
    case 'pagoda':
      for (let k = 0; k < 5; k++) {
        const y = base - k * 48;
        const w = 90 - k * 13;
        ctx.fillRect(x - w * 0.5, y - 40, w, 40);
        ctx.beginPath();
        ctx.moveTo(x - w * 0.9, y - 36);
        ctx.quadraticCurveTo(x, y - 62, x + w * 0.9, y - 36);
        ctx.lineTo(x + w * 0.6, y - 46);
        ctx.lineTo(x - w * 0.6, y - 46);
        ctx.fill();
      }
      ctx.fillRect(x - 2, base - 290, 4, 50);
      break;
    case 'pyramids':
      for (const [dx, h] of [
        [-120, 160],
        [60, 210],
        [220, 120],
      ] as const) {
        ctx.fillStyle = s.sky === 'night' ? ink : '#c9a467';
        ctx.beginPath();
        ctx.moveTo(x + dx - h, base);
        ctx.lineTo(x + dx, base - h);
        ctx.lineTo(x + dx + h, base);
        ctx.fill();
      }
      break;
    case 'clock-tower':
      ctx.fillRect(x - 22, base - 300, 44, 300);
      ctx.beginPath();
      ctx.moveTo(x - 26, base - 300);
      ctx.lineTo(x, base - 370);
      ctx.lineTo(x + 26, base - 300);
      ctx.fill();
      ctx.fillStyle = '#f5edd0';
      ctx.beginPath();
      ctx.arc(x, base - 262, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, base - 262);
      ctx.lineTo(x, base - 273);
      ctx.moveTo(x, base - 262);
      ctx.lineTo(x + 7, base - 262);
      ctx.stroke();
      break;
    case 'needle-tower':
      ctx.fillRect(x - 8, base - 330, 16, 330);
      ctx.beginPath();
      ctx.ellipse(x, base - 250, 34, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 2, base - 380, 4, 60);
      break;
    case 'supertall':
      ctx.beginPath();
      ctx.moveTo(x - 40, base);
      ctx.lineTo(x - 22, base - 260);
      ctx.lineTo(x - 8, base - 340);
      ctx.lineTo(x, base - 395);
      ctx.lineTo(x + 8, base - 340);
      ctx.lineTo(x + 22, base - 260);
      ctx.lineTo(x + 40, base);
      ctx.fill();
      break;
    case 'shell-roofs':
      ctx.fillStyle = s.sky === 'night' ? ink : '#f2f2ee';
      for (const [dx, h] of [
        [-80, 90],
        [-20, 120],
        [50, 100],
        [110, 70],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(x + dx - 40, base - 10);
        ctx.quadraticCurveTo(x + dx - 10, base - h, x + dx + 30, base - h + 6);
        ctx.lineTo(x + dx + 20, base - 10);
        ctx.fill();
      }
      ctx.fillStyle = ink;
      ctx.fillRect(x - 140, base - 12, 300, 12);
      break;
    case 'table-mountain':
      ctx.beginPath();
      ctx.moveTo(x - 360, base);
      ctx.lineTo(x - 260, base - 230);
      ctx.lineTo(x + 260, base - 236);
      ctx.lineTo(x + 380, base);
      ctx.fill();
      break;
    case 'sugarloaf':
      ctx.beginPath();
      ctx.moveTo(x - 160, base);
      ctx.bezierCurveTo(x - 120, base - 260, x + 40, base - 290, x + 120, base);
      ctx.fill();
      break;
    case 'volcano':
      ctx.beginPath();
      ctx.moveTo(x - 420, base);
      ctx.lineTo(x - 60, base - 200);
      ctx.lineTo(x + 40, base - 190);
      ctx.lineTo(x + 420, base);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,220,220,0.6)';
      ctx.beginPath();
      ctx.ellipse(x - 20, base - 230, 40, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'cathedral':
      ctx.fillRect(x - 70, base - 150, 140, 150);
      for (const dx of [-55, 55]) {
        ctx.fillRect(x + dx - 18, base - 240, 36, 100);
        ctx.beginPath();
        ctx.moveTo(x + dx - 20, base - 240);
        ctx.lineTo(x + dx, base - 290);
        ctx.lineTo(x + dx + 20, base - 240);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, base - 150, 40, Math.PI, 0);
      ctx.fill();
      break;
    case 'temple-columns':
      ctx.fillStyle = s.sky === 'night' ? ink : '#e9e2d0';
      ctx.fillRect(x - 130, base - 26, 260, 26);
      for (let k = 0; k < 8; k++) ctx.fillRect(x - 120 + k * 33, base - 140, 14, 114);
      ctx.fillRect(x - 130, base - 156, 260, 16);
      ctx.beginPath();
      ctx.moveTo(x - 130, base - 156);
      ctx.lineTo(x, base - 196);
      ctx.lineTo(x + 130, base - 156);
      ctx.fill();
      break;
    case 'arch':
      ctx.fillStyle = s.sky === 'night' ? ink : '#d9c49a';
      ctx.fillRect(x - 110, base - 190, 220, 190);
      ctx.fillStyle = s.sky === 'night' ? '#1c2440' : '#a9c7de';
      ctx.beginPath();
      ctx.moveTo(x - 46, base);
      ctx.lineTo(x - 46, base - 100);
      ctx.arc(x, base - 100, 46, Math.PI, 0);
      ctx.lineTo(x + 46, base);
      ctx.fill();
      ctx.fillStyle = s.sky === 'night' ? ink : '#d9c49a';
      for (const dx of [-90, 90]) {
        ctx.beginPath();
        ctx.arc(x + dx, base - 200, 20, Math.PI, 0);
        ctx.fill();
      }
      break;
    case 'wall':
      ctx.fillStyle = '#cfcfc8';
      ctx.fillRect(x - 600, STREET - 110, 1200, 110);
      ctx.fillStyle = '#b0b0a8';
      for (let k = 0; k < 24; k++) ctx.fillRect(x - 600 + k * 50, STREET - 110, 2, 110);
      ctx.fillStyle = '#d8d8d0';
      ctx.fillRect(x - 600, STREET - 120, 1200, 14);
      for (const [dx, c] of [
        [-420, '#e63946'],
        [-200, '#2a9d8f'],
        [60, '#f4a261'],
        [300, '#7b2cbf'],
      ] as const) {
        ctx.fillStyle = c;
        ctx.font = 'bold 34px system-ui, sans-serif';
        ctx.fillText('FREIHEIT', x + dx, STREET - 50);
      }
      break;
    default:
      break;
  }
}

function signFont(script: Scene['script']): string {
  if (script === 'han' || script === 'japanese' || script === 'korean')
    return '"Noto Sans CJK SC", "Hiragino Sans", "Microsoft YaHei", sans-serif';
  if (script === 'thai') return '"Noto Sans Thai", Thonburi, Tahoma, sans-serif';
  if (script === 'devanagari')
    return '"Noto Sans Devanagari", "Kohinoor Devanagari", Mangal, sans-serif';
  if (script === 'arabic') return '"Noto Naskh Arabic", "Geeza Pro", Tahoma, sans-serif';
  if (script === 'hebrew') return '"Noto Sans Hebrew", Arial, sans-serif';
  return 'Georgia, "Times New Roman", serif';
}

function building(
  ctx: Ctx,
  s: Scene,
  era: EraCues,
  x: number,
  w: number,
  rand: () => number,
  sign: string | null,
) {
  const pal = PALETTES[s.style];
  const colour = pal[Math.floor(rand() * pal.length)]!;
  const night = s.sky === 'night';
  const floors =
    s.style === 'towers'
      ? 8 + Math.floor(rand() * (s.year >= 1990 || s.landmark === 'supertall' ? 22 : 12))
      : s.style === 'concrete'
        ? 5 + Math.floor(rand() * 7)
        : s.style === 'adobe' || s.style === 'whitewash' || s.style === 'tropical'
          ? 2 + Math.floor(rand() * 2)
          : 3 + Math.floor(rand() * 3);
  const fh = s.style === 'towers' ? 13 : 34;
  const h = Math.min(STREET - 30, floors * fh + 40);
  const top = STREET - h;
  ctx.fillStyle = colour;
  ctx.fillRect(x, top, w, h);
  // Roofs.
  ctx.fillStyle =
    s.style === 'haussmann'
      ? '#6f7c87'
      : s.style === 'pagoda'
        ? '#3b3b3b'
        : s.style === 'colonial'
          ? '#b5523b'
          : '#5a4636';
  if (s.style === 'haussmann') {
    ctx.beginPath();
    ctx.moveTo(x - 4, top);
    ctx.lineTo(x + 10, top - 34);
    ctx.lineTo(x + w - 10, top - 34);
    ctx.lineTo(x + w + 4, top);
    ctx.fill();
    ctx.fillStyle = '#e8dcc4';
    for (let k = x + 16; k < x + w - 20; k += 30) ctx.fillRect(k, top - 26, 12, 18);
  } else if (s.style === 'canalhouse' || s.style === 'nordic') {
    ctx.fillStyle = s.style === 'nordic' ? '#3b3b3b' : colour;
    ctx.beginPath();
    ctx.moveTo(x, top);
    if (s.style === 'canalhouse') {
      ctx.lineTo(x + w * 0.2, top - 20);
      ctx.lineTo(x + w * 0.3, top - 20);
      ctx.lineTo(x + w * 0.3, top - 40);
      ctx.lineTo(x + w * 0.7, top - 40);
      ctx.lineTo(x + w * 0.7, top - 20);
      ctx.lineTo(x + w * 0.8, top - 20);
    } else ctx.lineTo(x + w / 2, top - w * 0.45);
    ctx.lineTo(x + w, top);
    ctx.fill();
  } else if (s.style === 'pagoda' || s.style === 'shophouse') {
    ctx.beginPath();
    ctx.moveTo(x - 12, top + 6);
    ctx.quadraticCurveTo(x + w / 2, top - 26, x + w + 12, top + 6);
    ctx.fill();
  } else if (s.style === 'colonial' || s.style === 'brick') {
    ctx.fillRect(x - 3, top - 8, w + 6, 10);
  }
  // Windows.
  const lit = night
    ? 'rgba(255, 214, 120, 0.9)'
    : s.style === 'towers'
      ? 'rgba(190, 220, 245, 0.8)'
      : 'rgba(40, 52, 66, 0.75)';
  const cols = Math.max(2, Math.floor(w / (s.style === 'towers' ? 16 : 30)));
  for (let f = 1; f < floors; f++) {
    const y = STREET - 50 - f * fh;
    if (y < top + 6) break;
    for (let c = 0; c < cols; c++) {
      const wx = x + 8 + (c * (w - 16)) / cols;
      const ww = (w - 16) / cols - (s.style === 'towers' ? 3 : 10);
      ctx.fillStyle = night && rand() < 0.4 ? 'rgba(40,52,66,0.85)' : lit;
      if (s.style === 'adobe' || s.style === 'whitewash') {
        ctx.beginPath();
        ctx.moveTo(wx, y + fh * 0.7);
        ctx.lineTo(wx, y + fh * 0.3);
        ctx.arc(wx + ww / 2, y + fh * 0.3, ww / 2, Math.PI, 0);
        ctx.lineTo(wx + ww, y + fh * 0.7);
        ctx.fill();
        if (s.style === 'whitewash') {
          ctx.fillStyle = '#2f6fb5';
          ctx.fillRect(wx - 2, y + fh * 0.7, ww + 4, 3);
        }
      } else ctx.fillRect(wx, y + 4, ww, fh * (s.style === 'towers' ? 0.6 : 0.55));
      if (s.style === 'haussmann' && f === 2) {
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(wx - 3, y + fh * 0.6, ww + 6, 3);
      }
    }
  }
  // Roof antennas and dishes.
  if (era.antennas && s.style !== 'pagoda' && rand() < 0.6) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    const ax = x + w * (0.3 + rand() * 0.4);
    ctx.beginPath();
    ctx.moveTo(ax, top);
    ctx.lineTo(ax, top - 30);
    for (let k = 0; k < 3; k++) {
      ctx.moveTo(ax - 12 + k * 2, top - 22 + k * 7);
      ctx.lineTo(ax + 12 - k * 2, top - 22 + k * 7);
    }
    ctx.stroke();
  }
  if (era.dishes && rand() < 0.4) {
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.8, top + 30, 8, 11, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // The shop on the ground floor.
  ctx.fillStyle = night ? 'rgba(255, 210, 120, 0.85)' : 'rgba(30, 40, 50, 0.7)';
  ctx.fillRect(x + 10, STREET - 44, w - 20, 40);
  if (sign) {
    const neon = night && s.extras.includes('neon');
    const vertical = (s.script === 'han' || s.script === 'japanese') && w > 60;
    ctx.save();
    ctx.font = `bold ${vertical ? 20 : 16}px ${signFont(s.script)}`;
    ctx.textAlign = 'center';
    if (s.script === 'arabic' || s.script === 'hebrew') ctx.direction = 'rtl';
    if (vertical) {
      const chars = [...sign];
      const sx = x + w - 18;
      ctx.fillStyle = neon ? '#ff3d7f' : '#b3261e';
      ctx.fillRect(sx - 14, STREET - 60 - chars.length * 24, 28, chars.length * 24 + 8);
      ctx.fillStyle = neon ? '#fff2a8' : '#fff';
      if (neon) ctx.shadowColor = '#ff3d7f';
      if (neon) ctx.shadowBlur = 12;
      chars.forEach((c, i) => ctx.fillText(c, sx, STREET - 58 - (chars.length - i - 1) * 24 - 4));
    } else {
      const sw = Math.min(w - 12, ctx.measureText(sign).width + 18);
      ctx.fillStyle = neon
        ? 'rgba(20,0,30,0.9)'
        : s.style === 'colonial' || s.style === 'tropical'
          ? '#fff8e7'
          : '#2b2b2b';
      ctx.fillRect(x + w / 2 - sw / 2, STREET - 70, sw, 24);
      ctx.fillStyle = neon
        ? '#7df9ff'
        : s.style === 'colonial' || s.style === 'tropical'
          ? '#7a2e1f'
          : '#f5e9c8';
      if (neon) ctx.shadowColor = '#7df9ff';
      if (neon) ctx.shadowBlur = 12;
      ctx.fillText(sign, x + w / 2, STREET - 52, w - 18);
    }
    ctx.restore();
  }
  // An awning.
  if (rand() < 0.5 && s.style !== 'towers') {
    ctx.fillStyle = ['#c0392b', '#2e86c1', '#27ae60', '#d4a017'][Math.floor(rand() * 4)]!;
    ctx.beginPath();
    ctx.moveTo(x + 8, STREET - 46);
    ctx.lineTo(x + w - 8, STREET - 46);
    ctx.lineTo(x + w - 2, STREET - 32);
    ctx.lineTo(x + 2, STREET - 32);
    ctx.fill();
  }
}

function ground(ctx: Ctx, s: Scene, era: EraCues) {
  const g = s.ground;
  ctx.fillStyle =
    g === 'snow'
      ? '#eef3f7'
      : g === 'dirt'
        ? '#b89b72'
        : g === 'square'
          ? '#c9c2b4'
          : era.paved
            ? '#4a4d52'
            : '#8f8676';
  ctx.fillRect(0, STREET, PW, PH - STREET);
  ctx.fillStyle = g === 'snow' ? '#dfe7ee' : '#b8b2a6';
  ctx.fillRect(0, STREET, PW, 18);
  if (g === 'canal') {
    const w = ctx.createLinearGradient(0, STREET + 30, 0, PH);
    w.addColorStop(0, '#3e6b6b');
    w.addColorStop(1, '#2a4d52');
    ctx.fillStyle = w;
    ctx.fillRect(0, STREET + 30, PW, PH - STREET - 30);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    for (let x = 0; x < PW; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, STREET + 80 + (x % 3) * 20);
      ctx.lineTo(x + 40, STREET + 80 + (x % 3) * 20);
      ctx.stroke();
    }
  } else if (g === 'street' && era.paved) {
    ctx.fillStyle = '#f2f2f2';
    for (let x = 0; x < PW; x += 120) ctx.fillRect(x, STREET + 90, 60, 5);
  } else if (g === 'square' || !era.paved) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let y = STREET + 24; y < PH; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(PW, y);
      ctx.stroke();
    }
  }
  if (g === 'promenade') {
    ctx.strokeStyle = '#e6e1d3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, STREET - 4);
    ctx.lineTo(1200, STREET - 4);
    ctx.stroke();
    for (let x = 0; x < 1200; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, STREET - 4);
      ctx.lineTo(x, STREET + 14);
      ctx.stroke();
    }
  }
}

function lamp(ctx: Ctx, s: Scene, era: EraCues, x: number) {
  ctx.strokeStyle = '#222';
  ctx.fillStyle = '#222';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, STREET + 10);
  if (era.lamp === 'gas') {
    ctx.lineTo(x, STREET - 110);
    ctx.stroke();
    ctx.fillRect(x - 9, STREET - 130, 18, 22);
    ctx.fillStyle = s.sky === 'day' ? '#f7f3d0' : '#ffd977';
    ctx.fillRect(x - 6, STREET - 127, 12, 16);
  } else {
    ctx.lineTo(x, STREET - 150);
    ctx.quadraticCurveTo(x, STREET - 170, x + 30, STREET - 168);
    ctx.stroke();
    ctx.fillStyle = s.sky === 'day' ? '#ddd' : era.lamp === 'led' ? '#e8f4ff' : '#ffcf6b';
    ctx.beginPath();
    ctx.ellipse(x + 34, STREET - 164, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.sky !== 'day') {
    const g = ctx.createRadialGradient(x + 20, STREET - 150, 2, x + 20, STREET - 150, 90);
    g.addColorStop(0, 'rgba(255,220,140,0.45)');
    g.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 80, STREET - 250, 200, 220);
  }
}

function palm(ctx: Ctx, x: number) {
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x, STREET + 10);
  ctx.quadraticCurveTo(x + 18, STREET - 90, x + 8, STREET - 190);
  ctx.stroke();
  ctx.strokeStyle = '#2f8f46';
  ctx.lineWidth = 6;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, STREET - 190);
    ctx.quadraticCurveTo(
      x + 8 + Math.cos(a) * 40,
      STREET - 210 + Math.sin(a) * 10,
      x + 8 + Math.cos(a) * 70,
      STREET - 170 + Math.abs(Math.sin(a)) * 20,
    );
    ctx.stroke();
  }
}

function tree(ctx: Ctx, s: Scene, x: number) {
  ctx.fillStyle = '#5a3d2b';
  ctx.fillRect(x - 5, STREET - 70, 10, 80);
  ctx.fillStyle = s.climate === 'cold' ? '#3d5a4a' : '#3f7d3f';
  ctx.beginPath();
  ctx.arc(x, STREET - 95, 38, 0, Math.PI * 2);
  ctx.fill();
}

function car(ctx: Ctx, kind: EraCues['vehicle'] | 'cab', x: number, colour: string, dir: number) {
  const y = STREET + 70;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = colour;
  if (kind === 'carriage') {
    ctx.fillStyle = '#5a3d2b';
    ctx.fillRect(-10, -60, 90, 46);
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(-14, -66, 98, 8);
    // The horse.
    ctx.fillStyle = '#6b4a2b';
    ctx.beginPath();
    ctx.ellipse(-60, -40, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-98, -66, 14, 30);
    ctx.beginPath();
    ctx.ellipse(-100, -66, 14, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    for (const lx of [-82, -74, -46, -38]) ctx.fillRect(lx, -28, 5, 28);
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 4;
    for (const wx of [0, 70]) {
      ctx.beginPath();
      ctx.arc(wx, -8, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    const shape =
      kind === 'vintage'
        ? [-50, -40, 100, 26, -26, -64, 50, 26]
        : kind === 'rounded'
          ? [-60, -36, 120, 24, -32, -56, 64, 22]
          : kind === 'boxy'
            ? [-62, -34, 124, 22, -34, -54, 62, 20]
            : [-64, -32, 128, 22, -36, -52, 70, 20];
    const [bx, by, bw, bh, cx, cy, cw, ch] = shape as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    if (kind === 'rounded' || kind === 'modern') {
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch + 4, kind === 'rounded' ? 14 : 8);
      ctx.fill();
    } else {
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillRect(cx, cy, cw, ch + 4);
    }
    ctx.fillStyle = 'rgba(180, 210, 230, 0.8)';
    ctx.fillRect(cx + 5, cy + 4, cw / 2 - 8, ch - 4);
    ctx.fillRect(cx + cw / 2 + 2, cy + 4, cw / 2 - 8, ch - 4);
    ctx.fillStyle = '#1b1b1b';
    for (const wx of [bx + 22, bx + bw - 22]) {
      ctx.beginPath();
      ctx.arc(wx, by + bh + 2, kind === 'vintage' ? 13 : 11, 0, Math.PI * 2);
      ctx.fill();
    }
    if (kind === 'vintage') {
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (const wx of [bx + 22, bx + bw - 22])
        for (let a = 0; a < 6; a++) {
          ctx.beginPath();
          ctx.moveTo(wx, by + bh + 2);
          ctx.lineTo(wx + Math.cos(a) * 11, by + bh + 2 + Math.sin(a) * 11);
          ctx.stroke();
        }
    }
    if (kind === 'cab') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-10, cy - 8, 20, 8);
    }
  }
  ctx.restore();
}

function person(ctx: Ctx, era: EraCues, x: number, rand: () => number) {
  const y = STREET + 18;
  const pal: Record<EraCues['clothing'], string[]> = {
    victorian: ['#2b2b2b', '#4a3b5a', '#3b4a3b'],
    interwar: ['#3a3a3a', '#5a4a3a', '#2f3e57'],
    midcentury: ['#3f5a7a', '#7a3f3f', '#6b6b4a'],
    seventies: ['#e07a1f', '#8bc34a', '#9c27b0', '#f4c20d'],
    modern: ['#1e88e5', '#212121', '#e53935', '#43a047', '#f5f5f5'],
  };
  const c = pal[era.clothing][Math.floor(rand() * pal[era.clothing].length)]!;
  const dress = rand() < 0.45;
  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath();
  ctx.arc(x, y - 66, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c;
  if (dress && (era.clothing === 'victorian' || era.clothing === 'interwar')) {
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 56);
    ctx.lineTo(x + 7, y - 56);
    ctx.lineTo(
      x + (era.clothing === 'victorian' ? 16 : 11),
      y - (era.clothing === 'victorian' ? 2 : 18),
    );
    ctx.lineTo(
      x - (era.clothing === 'victorian' ? 16 : 11),
      y - (era.clothing === 'victorian' ? 2 : 18),
    );
    ctx.fill();
  } else {
    ctx.fillRect(
      x - 7,
      y - 56,
      14,
      era.clothing === 'victorian' || era.clothing === 'interwar' ? 34 : 28,
    );
    ctx.fillStyle = era.clothing === 'seventies' ? '#3949ab' : '#2b2b2b';
    ctx.fillRect(x - 6, y - 26, 5, 26);
    ctx.fillRect(x + 1, y - 26, 5, 26);
    if (era.clothing === 'seventies') {
      ctx.fillRect(x - 9, y - 6, 8, 6);
      ctx.fillRect(x + 1, y - 6, 8, 6);
    }
  }
  if (
    era.clothing === 'victorian' ||
    era.clothing === 'interwar' ||
    (era.clothing === 'midcentury' && rand() < 0.5)
  ) {
    ctx.fillStyle = '#1b1b1b';
    if (era.clothing === 'victorian' && !dress) ctx.fillRect(x - 6, y - 90, 12, 16);
    ctx.fillRect(x - 11, y - 74, 22, 4);
  }
  if (era.phones && rand() < 0.6) {
    ctx.fillStyle = '#8fd3ff';
    ctx.fillRect(x + 6, y - 50, 5, 8);
  }
}

function extras(ctx: Ctx, s: Scene, era: EraCues, rand: () => number) {
  const has = (e: string) => s.extras.includes(e as never);
  if (has('tram')) {
    const x = 2350;
    const y = STREET + 70;
    ctx.fillStyle = s.year < 1950 ? '#7a1f1f' : s.year < 1990 ? '#d8b23a' : '#e8e8e8';
    ctx.beginPath();
    ctx.roundRect(x, y - 90, 220, 76, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,210,230,0.85)';
    for (let k = 0; k < 6; k++) ctx.fillRect(x + 12 + k * 34, y - 78, 26, 30);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 110, y - 90);
    ctx.lineTo(x + 140, y - 150);
    ctx.moveTo(0, y - 152);
    ctx.lineTo(PW, y - 152);
    ctx.stroke();
  }
  if (has('cable-car')) {
    const x = 2300;
    const y = STREET + 70;
    ctx.fillStyle = '#b03a2e';
    ctx.fillRect(x, y - 80, 160, 64);
    ctx.fillStyle = '#e8d8b0';
    ctx.fillRect(x + 6, y - 74, 148, 24);
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(x - 6, y - 88, 172, 10);
  }
  if (has('double-decker')) {
    const x = 1300;
    const y = STREET + 70;
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.roundRect(x, y - 130, 200, 116, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,210,230,0.85)';
    for (let k = 0; k < 5; k++) {
      ctx.fillRect(x + 12 + k * 38, y - 118, 30, 26);
      ctx.fillRect(x + 12 + k * 38, y - 70, 30, 26);
    }
    ctx.fillStyle = '#1b1b1b';
    for (const wx of [x + 34, x + 166]) {
      ctx.beginPath();
      ctx.arc(wx, y - 12, 13, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has('rickshaw') || has('tuk-tuk')) {
    const x = 2900;
    const y = STREET + 70;
    if (has('tuk-tuk')) {
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.roundRect(x, y - 60, 80, 44, 14);
      ctx.fill();
      ctx.fillStyle = '#f9a825';
      ctx.fillRect(x - 4, y - 66, 88, 10);
    } else {
      ctx.fillStyle = '#5a3d2b';
      ctx.fillRect(x, y - 56, 54, 34);
      ctx.strokeStyle = '#5a3d2b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y - 30);
      ctx.lineTo(x - 50, y - 26);
      ctx.stroke();
    }
    ctx.fillStyle = '#1b1b1b';
    for (const wx of has('tuk-tuk') ? [x + 10, x + 70] : [x + 27]) {
      ctx.beginPath();
      ctx.arc(wx, y - 12, has('tuk-tuk') ? 9 : 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has('gondola')) {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(1500, STREET + 120);
    ctx.quadraticCurveTo(1600, STREET + 140, 1720, STREET + 104);
    ctx.lineTo(1720, STREET + 118);
    ctx.quadraticCurveTo(1600, STREET + 156, 1490, STREET + 128);
    ctx.fill();
    ctx.fillRect(1690, STREET + 40, 4, 70);
  }
  if (has('boats')) {
    for (const x of [300, 760]) {
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath();
      ctx.moveTo(x, HORIZON + 30);
      ctx.lineTo(x + 70, HORIZON + 30);
      ctx.lineTo(x + 58, HORIZON + 44);
      ctx.lineTo(x + 8, HORIZON + 44);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 34, HORIZON + 28);
      ctx.lineTo(x + 34, HORIZON - 30);
      ctx.lineTo(x + 60, HORIZON + 22);
      ctx.fill();
    }
  }
  if (has('camel')) {
    const x = 3100;
    const y = STREET + 60;
    ctx.fillStyle = '#b98b55';
    ctx.beginPath();
    ctx.ellipse(x, y - 60, 46, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - 6, y - 82, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 36, y - 100, 12, 40);
    ctx.beginPath();
    ctx.ellipse(x + 50, y - 102, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const lx of [-30, -16, 18, 30]) ctx.fillRect(x + lx, y - 44, 6, 44);
  }
  const bikes = has('bicycles') ? 3 : 0;
  for (let i = 0; i < bikes; i++) {
    const x = 400 + i * 900 + rand() * 200;
    const y = STREET + 40;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    for (const wx of [x, x + 46]) {
      ctx.beginPath();
      ctx.arc(wx, y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20, y - 24);
    ctx.lineTo(x + 46, y);
    ctx.moveTo(x + 20, y - 24);
    ctx.lineTo(x + 40, y - 26);
    ctx.stroke();
    person(ctx, era, x + 22, rand);
  }
  if (has('scooters'))
    for (const x of [1000, 3300]) {
      const y = STREET + 50;
      ctx.fillStyle = s.year < 1970 ? '#9fd3c7' : '#d84315';
      ctx.beginPath();
      ctx.roundRect(x, y - 28, 50, 20, 8);
      ctx.fill();
      ctx.fillStyle = '#1b1b1b';
      for (const wx of [x + 6, x + 44]) {
        ctx.beginPath();
        ctx.arc(wx, y - 4, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
}

/** Paint the whole panorama. `flag` is the country flag image when the scene shows one. */
export function paint(ctx: Ctx, s: Scene, flag: HTMLImageElement | null) {
  const rand = rngFrom(hash(s.id));
  const era = eraOf(s.year);
  sky(ctx, s, rand);
  terrain(ctx, s, rand);
  landmark(ctx, s);
  ground(ctx, s, era);
  // Buildings round the panorama, leaving the sea (and the landmark) visible where there is one.
  const open = (x: number) =>
    ((s.hills === 'sea' || s.ground === 'promenade') && x < 1200) ||
    (s.landmark !== 'none' &&
      s.landmark !== 'wall' &&
      Math.abs(x - 1800) <
        (s.landmark === 'table-mountain' || s.landmark === 'volcano' ? 380 : 200));
  let x = 0;
  let k = 0;
  while (x < PW) {
    const w =
      (s.style === 'towers' ? 110 : s.style === 'canalhouse' ? 70 : 120) + Math.floor(rand() * 60);
    if (!open(x) && !open(x + w)) {
      building(ctx, s, era, x, w, rand, k % 2 === 0 ? s.signs[(k / 2) % s.signs.length]! : null);
      k++;
    }
    x +=
      w +
      (s.style === 'canalhouse' || s.style === 'haussmann' || s.style === 'shophouse'
        ? 0
        : 6 + Math.floor(rand() * 16));
  }
  // Street furniture.
  for (let lx = 150; lx < PW; lx += 420)
    if (!(s.ground === 'canal' && lx > 1300 && lx < 1900)) lamp(ctx, s, era, lx);
  if (s.extras.includes('palms')) for (const px of [520, 1260, 2050, 3020]) palm(ctx, px);
  else if (s.climate === 'temperate' && s.style !== 'towers')
    for (const tx of [700, 2700]) tree(ctx, s, tx);
  if (flag) {
    const fx = 3350;
    ctx.fillStyle = '#ddd';
    ctx.fillRect(fx, STREET - 260, 5, 270);
    ctx.drawImage(flag, fx + 5, STREET - 258, 84, 63);
  }
  // Traffic and people.
  if (s.ground !== 'canal') {
    const colours = ['#1f3a93', '#8e1b1b', '#2e7d32', '#424242', '#e0e0e0', '#c49a2c'];
    for (let i = 0; i < 4; i++) {
      const cx = 200 + i * 850 + rand() * 300;
      const kind =
        s.extras.includes('yellow-cabs') && i % 2 === 0
          ? 'cab'
          : s.extras.includes('classic-cars') && era.vehicle === 'modern'
            ? 'rounded'
            : era.vehicle;
      car(
        ctx,
        kind === 'cab' ? 'cab' : kind,
        cx,
        kind === 'cab'
          ? '#f2c300'
          : s.extras.includes('classic-cars')
            ? ['#3fb6c8', '#e85d75', '#f2c14e', '#7bc67b'][i]!
            : colours[i % colours.length]!,
        i % 2 ? -1 : 1,
      );
    }
  }
  for (let i = 0; i < 14; i++) person(ctx, era, 80 + i * 250 + rand() * 120, rand);
  extras(ctx, s, era, rand);
  if (s.extras.includes('snowfall')) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 500; i++) ctx.fillRect(rand() * PW, rand() * PH, 3, 3);
  }
  if (s.climate === 'desert' && s.sky === 'day') {
    ctx.fillStyle = 'rgba(240, 200, 140, 0.12)';
    ctx.fillRect(0, 0, PW, PH);
  }
}
