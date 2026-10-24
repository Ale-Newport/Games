import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Gale',
  'menu.subtitle':
    'Build bridges between your dots to span the board — and block your rival’s crossing.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Measures its network one move ahead, often at random.',
  'difficulty.medium.hint': 'Shannon’s resistance measure, two moves ahead.',
  'difficulty.hard.hint': 'Deeper search for about a second.',
  'seat.0': 'Orange',
  'seat.1': 'Teal',
  'menu.name0': 'Orange player',
  'menu.name1': 'Teal player',
  'menu.agent0': 'Orange agent',
  'menu.agent1': 'Teal agent',
  'board.label': 'Gale board',
  'slot.free': 'free',
  'slot.taken.0': 'Orange bridge',
  'slot.taken.1': 'Teal bridge',
  'info.goal.0': 'Orange links top to bottom',
  'info.goal.1': 'Teal links left to right',
  'announce.bridge': '{seat} builds a bridge at {slot}.',
  'result.connected': 'The winner’s bridges span the board.',
  keys: 'Keys: arrows move · Enter build a bridge · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'menu.title': 'Gale',
  'menu.subtitle':
    'Tiende puentes entre tus puntos para cruzar el tablero y corta el paso al rival.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Mide su red una jugada por delante, a menudo al azar.',
  'difficulty.medium.hint': 'La medida de resistencia de Shannon, a dos jugadas.',
  'difficulty.hard.hint': 'Búsqueda más profunda durante un segundo.',
  'seat.0': 'Naranja',
  'seat.1': 'Turquesa',
  'menu.name0': 'Jugador naranja',
  'menu.name1': 'Jugador turquesa',
  'menu.agent0': 'Agente naranja',
  'menu.agent1': 'Agente turquesa',
  'board.label': 'Tablero de Gale',
  'slot.free': 'libre',
  'slot.taken.0': 'puente naranja',
  'slot.taken.1': 'puente turquesa',
  'info.goal.0': 'Naranja une arriba con abajo',
  'info.goal.1': 'Turquesa une izquierda con derecha',
  'announce.bridge': '{seat} tiende un puente en {slot}.',
  'result.connected': 'Los puentes del ganador cruzan el tablero.',
  keys: 'Teclas: flechas mover · Intro tender un puente · U deshacer · H pista · R reiniciar · N siguiente',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
