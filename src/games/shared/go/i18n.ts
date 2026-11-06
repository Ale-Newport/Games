import type { Dictionary, Locale } from '../../../core/i18n';

/** Go strings layered over the shared goban strings. */
const en: Dictionary = {
  'action.pass': 'Pass',
  'hint.pass': 'Hint: pass',
  'announce.pass': '{seat} passed.',
  'info.captures': 'Captures — Black {b} · White {w} · komi {komi}',
  'info.capturesPassed': 'Captures — Black {b} · White {w} · the opponent passed: pass to end',
  'result.score': 'Area count: Black {b} – White {w} (komi {komi} included).',
  keys: 'Keys: arrows move · Enter place · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'action.pass': 'Pasar',
  'hint.pass': 'Pista: pasa',
  'announce.pass': '{seat} pasó.',
  'info.captures': 'Capturas — Negras {b} · Blancas {w} · komi {komi}',
  'info.capturesPassed': 'Capturas — Negras {b} · Blancas {w} · el rival pasó: pasa para terminar',
  'result.score': 'Recuento por área: Negras {b} – Blancas {w} (komi {komi} incluido).',
  keys: 'Teclas: flechas mover · Intro colocar · U deshacer · H pista · R reiniciar · N siguiente',
};

export const GO_STRINGS: Record<Locale, Dictionary> = { en, es };
