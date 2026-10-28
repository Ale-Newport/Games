import type { Dictionary, Locale } from '../../core/i18n';
import { SUDOKU_STRINGS } from '../shared/sudoku/i18n';

const HASHI: Record<Locale, Dictionary> = {
  en: {
    title: 'Bridges',
    'menu.subtitle':
      'Join the islands with straight bridges: each island gets as many as its number, at most two per pair, no crossings, everything connected.',
    'difficulty.easy': '7×7',
    'difficulty.medium': '9×9',
    'difficulty.hard': '11×11',
    'difficulty.expert': '13×13',
    'difficulty.easy.hint': 'About ten islands.',
    'difficulty.medium.hint': 'About sixteen islands.',
    'difficulty.hard.hint': 'About two dozen islands.',
    'difficulty.expert.hint': 'About thirty islands.',
    'select.cell':
      'Tap the water between two islands to add a bridge (a third tap removes them), or tap one island and then another.',
    island: 'island {n} at {cell}',
    'hint.full': 'The {n} at {cell} needs every bridge it can still take: draw them.',
    'hint.at-least':
      'The {n} at {cell} cannot reach its number without a bridge to {other}: draw it.',
    'hint.guess': 'No simple step from here: add a bridge between {cell} and {other}.',
    'hint.wrongPair':
      'There are too many bridges between the highlighted islands: remove one first.',
    'hint.wrongPairs': '{n} places have too many bridges (highlighted): remove them first.',
    'hint.fill': 'Apply',
    'tech.full': 'full islands',
    'tech.at-least': 'forced bridges',
    'tech.done': 'finished islands',
    'tech.crossing': 'crossings',
    'tech.isolation': 'isolation',
    blocked: 'Another bridge is in the way.',
    'board.label': 'Bridges board, {islands} islands',
    solved: 'Solved in {time}! Mistakes {mistakes} · hints {hints}',
    'watch.done': 'The AI built every bridge in {steps} steps.',
    keys: 'Keys: U undo · R redo · H hint · Enter apply the hint · P pause',
  },
  es: {
    title: 'Puentes',
    'menu.subtitle':
      'Une las islas con puentes rectos: cada isla lleva tantos como su número, como mucho dos por pareja, sin cruces y todo conectado.',
    'difficulty.easy': '7×7',
    'difficulty.medium': '9×9',
    'difficulty.hard': '11×11',
    'difficulty.expert': '13×13',
    'difficulty.easy.hint': 'Unas diez islas.',
    'difficulty.medium.hint': 'Unas dieciséis islas.',
    'difficulty.hard.hint': 'Unas dos docenas de islas.',
    'difficulty.expert.hint': 'Unas treinta islas.',
    'select.cell':
      'Toca el agua entre dos islas para añadir un puente (el tercer toque los quita), o toca una isla y luego otra.',
    island: 'isla {n} en {cell}',
    'hint.full': 'El {n} de {cell} necesita todos los puentes que aún puede llevar: trázalos.',
    'hint.at-least': 'El {n} de {cell} no llega a su número sin un puente hacia {other}: trázalo.',
    'hint.guess': 'No hay un paso sencillo desde aquí: añade un puente entre {cell} y {other}.',
    'hint.wrongPair': 'Hay demasiados puentes entre las islas resaltadas: quita uno primero.',
    'hint.wrongPairs': 'Hay {n} sitios con demasiados puentes (resaltados): quítalos primero.',
    'hint.fill': 'Aplicar',
    'tech.full': 'islas llenas',
    'tech.at-least': 'puentes forzados',
    'tech.done': 'islas terminadas',
    'tech.crossing': 'cruces',
    'tech.isolation': 'aislamiento',
    blocked: 'Hay otro puente en medio.',
    'board.label': 'Tablero de puentes, {islands} islas',
    solved: '¡Resuelto en {time}! Errores {mistakes} · pistas {hints}',
    'watch.done': 'La IA construyó todos los puentes en {steps} pasos.',
    keys: 'Teclas: U deshacer · R rehacer · H pista · Intro aplicar la pista · P pausa',
  },
};

export const STRINGS: Record<Locale, Dictionary> = {
  en: { ...SUDOKU_STRINGS.en, ...HASHI.en },
  es: { ...SUDOKU_STRINGS.es, ...HASHI.es },
};
