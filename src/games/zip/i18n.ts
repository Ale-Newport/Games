import type { Dictionary, Locale } from '../../core/i18n';
import { SUDOKU_STRINGS } from '../shared/sudoku/i18n';

const TRAIL: Record<Locale, Dictionary> = {
  en: {
    title: 'Number Trail',
    'menu.subtitle':
      'Draw one trail through every cell, starting on 1 and passing the numbers in order to the last one. Walls cannot be crossed.',
    'difficulty.easy': '5×5',
    'difficulty.medium': '6×6',
    'difficulty.hard': '7×7',
    'difficulty.expert': '8×8',
    'difficulty.easy.hint': 'A short warm-up.',
    'difficulty.medium.hint': 'More room to go wrong.',
    'difficulty.hard.hint': 'Longer stretches between numbers.',
    'difficulty.expert.hint': 'The biggest grid.',
    'select.cell':
      'Drag from the end of the trail (it starts on 1); go back over it to undo, or tap any trail cell to cut back to it.',
    'cell.label': '{cell}{number}{state}',
    'cell.number': ', number {n}',
    'cell.on': ', on the trail',
    'cell.end': ', trail end',
    covered: '{n}/{total}',
    next: 'Next: {n}',
    blocked: 'The trail cannot go there.',
    'blocked.number': 'Pass {n} first.',
    'blocked.last': 'The last number ends the trail: cover every other cell first.',
    'hint.off': 'The trail leaves the solution after {cell}: go back to there.',
    'hint.forced':
      '{cell} has only two ways in left, one from the trail’s end: the trail must go there now.',
    'hint.number': 'Head for {n}: the trail continues to {cell}.',
    'hint.step': 'The trail continues to {cell}.',
    'hint.back': 'Go back',
    'hint.fill': 'Extend',
    solved: 'Solved in {time}! Hints {hints}',
    'watch.done': 'The AI drew the trail in {steps} steps.',
    keys: 'Keys: arrows extend · Backspace back one · H hint · P pause',
  },
  es: {
    title: 'Sendero numerado',
    'menu.subtitle':
      'Traza un único sendero por todas las casillas, desde el 1 y pasando por los números en orden hasta el último. No se pueden cruzar los muros.',
    'difficulty.easy': '5×5',
    'difficulty.medium': '6×6',
    'difficulty.hard': '7×7',
    'difficulty.expert': '8×8',
    'difficulty.easy.hint': 'Un calentamiento corto.',
    'difficulty.medium.hint': 'Más espacio para equivocarse.',
    'difficulty.hard.hint': 'Tramos más largos entre números.',
    'difficulty.expert.hint': 'La cuadrícula más grande.',
    'select.cell':
      'Arrastra desde el final del sendero (empieza en el 1); vuelve por encima para deshacer o toca una casilla del sendero para recortarlo hasta ella.',
    'cell.label': '{cell}{number}{state}',
    'cell.number': ', número {n}',
    'cell.on': ', en el sendero',
    'cell.end': ', final del sendero',
    covered: '{n}/{total}',
    next: 'Siguiente: {n}',
    blocked: 'El sendero no puede ir ahí.',
    'blocked.number': 'Pasa antes por el {n}.',
    'blocked.last': 'El último número cierra el sendero: cubre antes todas las demás casillas.',
    'hint.off': 'El sendero se sale de la solución después de {cell}: vuelve hasta ahí.',
    'hint.forced':
      'A {cell} solo le quedan dos entradas, una desde el final del sendero: el sendero debe ir ahí ahora.',
    'hint.number': 'Ve hacia el {n}: el sendero sigue por {cell}.',
    'hint.step': 'El sendero sigue por {cell}.',
    'hint.back': 'Volver',
    'hint.fill': 'Avanzar',
    solved: '¡Resuelto en {time}! Pistas {hints}',
    'watch.done': 'La IA trazó el sendero en {steps} pasos.',
    keys: 'Teclas: flechas avanzar · Retroceso volver una · H pista · P pausa',
  },
};

export const STRINGS: Record<Locale, Dictionary> = {
  en: { ...SUDOKU_STRINGS.en, ...TRAIL.en },
  es: { ...SUDOKU_STRINGS.es, ...TRAIL.es },
};
