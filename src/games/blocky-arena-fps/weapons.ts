/** Weapon statistics (steps at 60 per second). */
export type WeaponId = 'rifle' | 'sniper' | 'pistol';

export interface Weapon {
  id: WeaponId;
  mag: number;
  /** Steps between shots. */
  rate: number;
  auto: boolean;
  damage: number;
  head: number;
  /** Spread (radians) from the hip, when aiming, extra when moving, bloom per shot and its cap. */
  hip: number;
  aimed: number;
  moving: number;
  bloom: number;
  bloomMax: number;
  /** Upward kick per shot (radians). */
  kick: number;
  reload: number;
  range: number;
  /** Field-of-view zoom when aiming. */
  zoom: number;
}

export const WEAPONS: Record<WeaponId, Weapon> = {
  rifle: {
    id: 'rifle',
    mag: 30,
    rate: 6,
    auto: true,
    damage: 22,
    head: 1.5,
    hip: 0.012,
    aimed: 0.003,
    moving: 0.03,
    bloom: 0.005,
    bloomMax: 0.05,
    kick: 0.01,
    reload: 90,
    range: 80,
    zoom: 1.4,
  },
  sniper: {
    id: 'sniper',
    mag: 3,
    rate: 50,
    auto: false,
    damage: 90,
    head: 1.5,
    hip: 0.12,
    aimed: 0,
    moving: 0.06,
    bloom: 0,
    bloomMax: 0,
    kick: 0.05,
    reload: 105,
    range: 120,
    zoom: 3.5,
  },
  pistol: {
    id: 'pistol',
    mag: 10,
    rate: 12,
    auto: false,
    damage: 20,
    head: 1.6,
    hip: 0.015,
    aimed: 0.006,
    moving: 0.02,
    bloom: 0.01,
    bloomMax: 0.04,
    kick: 0.02,
    reload: 60,
    range: 60,
    zoom: 1.2,
  },
};

export type Loadout = 'rifleman' | 'marksman';
export const LOADOUTS: Record<Loadout, [WeaponId, WeaponId]> = {
  rifleman: ['rifle', 'pistol'],
  marksman: ['sniper', 'pistol'],
};
