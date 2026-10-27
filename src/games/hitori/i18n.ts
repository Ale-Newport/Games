import type { Dictionary, Locale } from '../../core/i18n';
import { SUDOKU_STRINGS } from '../shared/sudoku/i18n';

const HITORI: Record<Locale, Dictionary> = {
  en: {
    title: 'Hitori',
    'menu.subtitle':
      'Shade cells so no number repeats in a row or column, shaded cells never touch, and the rest stays connected.',
    'difficulty.easy': '5×5',
    'difficulty.medium': '7×7',
    'difficulty.hard': '8×8',
    'difficulty.expert': '10×10',
    'difficulty.easy.hint': 'A small grid; the basic patterns are enough.',
    'difficulty.medium.hint': 'Keeping the white cells connected starts to matter.',
    'difficulty.hard.hint': 'A larger grid with more repeats to untangle.',
    'difficulty.expert.hint': 'The big one: a hundred cells.',
    'select.cell':
      'Tap a cell to shade it; tap again to mark it kept, again to clear it. Unrepeated numbers never need shading.',
    shade: 'Shade',
    keep: 'Keep',
    clear: 'Clear',
    'mode.shade': 'Shade',
    'mode.keep': 'Keep',
    'mode.cycle': 'Cycle',
    'break.split': 'The white cells are cut into separate areas.',
    'hint.next-to-black': '{cell} touches a shaded cell, so it stays white.',
    'hint.twin-of-white': '{cell} repeats a kept {num} of its row or column: shade it.',
    'hint.sandwich':
      '{cell} sits between two {num}s: one of them is shaded, so {cell} must stay white.',
    'hint.adjacent-pair':
      'The two {num}s side by side cannot both be shaded, so the other {num} of that line, {cell}, is shaded.',
    'hint.connection': 'Shading {cell} would cut the white area in two: keep it.',
    'hint.shade': 'No simple step from here: shade {cell}.',
    'hint.keep': 'No simple step from here: keep {cell}.',
    'hint.wrongMarks': '{n} marks are not right (highlighted): clear them first.',
    'hint.wrongMark': 'The highlighted mark is not right: clear it first.',
    'cell.state.0': 'undecided',
    'cell.state.1': 'kept',
    'cell.state.2': 'shaded',
    'cell.hitori': '{cell}: {num}, {state}',
    solved: 'Solved in {time}! Mistakes {mistakes} · hints {hints}',
    'watch.done': 'The AI solved it in {steps} decisions.',
    keys: 'Keys: arrows move · Space shade · K keep · Backspace clear · U undo · R redo · H hint · P pause',
  },
  es: {
    title: 'Hitori',
    'menu.subtitle':
      'Sombrea casillas para que ningún número se repita en fila ni columna, las sombreadas no se toquen y el resto siga unido.',
    'difficulty.easy': '5×5',
    'difficulty.medium': '7×7',
    'difficulty.hard': '8×8',
    'difficulty.expert': '10×10',
    'difficulty.easy.hint': 'Una cuadrícula pequeña; bastan los patrones básicos.',
    'difficulty.medium.hint': 'Empieza a importar que las blancas sigan unidas.',
    'difficulty.hard.hint': 'Una cuadrícula mayor con más repeticiones que deshacer.',
    'difficulty.expert.hint': 'La grande: cien casillas.',
    'select.cell':
      'Toca una casilla para sombrearla; otra vez para marcarla como blanca y otra para borrarla.',
    shade: 'Sombrear',
    keep: 'Mantener',
    clear: 'Borrar',
    'mode.shade': 'Sombrear',
    'mode.keep': 'Mantener',
    'mode.cycle': 'Alternar',
    'break.split': 'Las casillas blancas han quedado separadas.',
    'hint.next-to-black': '{cell} toca una casilla sombreada, así que queda blanca.',
    'hint.twin-of-white': '{cell} repite un {num} blanco de su fila o columna: sombréala.',
    'hint.sandwich':
      '{cell} está entre dos {num}: uno de ellos se sombrea, así que {cell} debe quedar blanca.',
    'hint.adjacent-pair':
      'Los dos {num} juntos no pueden sombrearse ambos, así que el otro {num} de esa línea, {cell}, se sombrea.',
    'hint.connection': 'Sombrear {cell} partiría la zona blanca en dos: mantenla.',
    'hint.shade': 'No hay un paso sencillo desde aquí: sombrea {cell}.',
    'hint.keep': 'No hay un paso sencillo desde aquí: mantén {cell}.',
    'hint.wrongMarks': 'Hay {n} marcas incorrectas (resaltadas): bórralas primero.',
    'hint.wrongMark': 'La marca resaltada no es correcta: bórrala primero.',
    'cell.state.0': 'sin decidir',
    'cell.state.1': 'blanca',
    'cell.state.2': 'sombreada',
    'cell.hitori': '{cell}: {num}, {state}',
    solved: '¡Resuelto en {time}! Errores {mistakes} · pistas {hints}',
    'watch.done': 'La IA lo resolvió en {steps} decisiones.',
    keys: 'Teclas: flechas mover · Espacio sombrear · K mantener · Retroceso borrar · U deshacer · R rehacer · H pista · P pausa',
  },
};

export const STRINGS: Record<Locale, Dictionary> = {
  en: { ...SUDOKU_STRINGS.en, ...HITORI.en },
  es: { ...SUDOKU_STRINGS.es, ...HITORI.es },
};
