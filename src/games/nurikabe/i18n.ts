import type { Dictionary, Locale } from '../../core/i18n';
import { SUDOKU_STRINGS } from '../shared/sudoku/i18n';

const NURI: Record<Locale, Dictionary> = {
  en: {
    title: 'Nurikabe',
    'menu.subtitle':
      'Shade the sea: every island holds one number equal to its size, the sea is one connected stream, and it never pools in a 2×2 block.',
    'difficulty.easy': '5×5',
    'difficulty.medium': '6×6',
    'difficulty.hard': '7×7',
    'difficulty.expert': '8×8',
    'difficulty.easy.hint': 'A few islands of up to four cells.',
    'difficulty.medium.hint': 'More islands to fit together.',
    'difficulty.hard.hint': 'Many small islands.',
    'difficulty.expert.hint': 'The largest sea.',
    'select.cell': 'Tap a cell to shade it as sea; tap again to dot it as land, again to clear it.',
    'mode.cycle': 'Cycle',
    'mode.shade': 'Sea',
    'mode.keep': 'Land',
    'break.pool': 'The sea cannot fill a 2×2 block.',
    'hint.complete-island':
      'The island of {n} is complete: every cell around it is sea, starting with {cell}.',
    'hint.two-islands': '{cell} touches two different islands: it must be sea.',
    'hint.unreachable': 'No island can reach {cell}: it is sea.',
    'hint.pool': 'With three sea cells around it, {cell} must be land or the sea would pool.',
    'hint.island-exit': 'The island of {n} can only grow through {cell}.',
    'hint.sea-exit': 'This patch of sea can only join the rest through {cell}.',
    'hint.shade': 'No simple step from here: {cell} is sea.',
    'hint.keep': 'No simple step from here: {cell} is land.',
    'hint.wrongMarks': '{n} marks are not right (highlighted): clear them first.',
    'hint.wrongMark': 'The highlighted mark is not right: clear it first.',
    'cell.state.0': 'undecided',
    'cell.state.1': 'land',
    'cell.state.2': 'sea',
    'cell.hitori': '{cell}: {num} {state}',
    solved: 'Solved in {time}! Mistakes {mistakes} · hints {hints}',
    'watch.done': 'The AI found the sea in {steps} decisions.',
    keys: 'Keys: arrows move · Space sea · K land · Backspace clear · U undo · R redo · H hint · P pause',
  },
  es: {
    title: 'Nurikabe',
    'menu.subtitle':
      'Sombrea el mar: cada isla tiene un número igual a su tamaño, el mar es un único cauce conectado y nunca forma un charco de 2×2.',
    'difficulty.easy': '5×5',
    'difficulty.medium': '6×6',
    'difficulty.hard': '7×7',
    'difficulty.expert': '8×8',
    'difficulty.easy.hint': 'Pocas islas de hasta cuatro casillas.',
    'difficulty.medium.hint': 'Más islas que encajar.',
    'difficulty.hard.hint': 'Muchas islas pequeñas.',
    'difficulty.expert.hint': 'El mar más grande.',
    'select.cell':
      'Toca una casilla para sombrearla como mar; otra vez para marcarla como tierra y otra para borrarla.',
    'mode.cycle': 'Alternar',
    'mode.shade': 'Mar',
    'mode.keep': 'Tierra',
    'break.pool': 'El mar no puede llenar un bloque de 2×2.',
    'hint.complete-island':
      'La isla del {n} está completa: todo lo que la rodea es mar, empezando por {cell}.',
    'hint.two-islands': '{cell} toca dos islas distintas: tiene que ser mar.',
    'hint.unreachable': 'Ninguna isla llega hasta {cell}: es mar.',
    'hint.pool':
      'Con tres casillas de mar alrededor, {cell} tiene que ser tierra o el mar haría un charco.',
    'hint.island-exit': 'La isla del {n} solo puede crecer por {cell}.',
    'hint.sea-exit': 'Este trozo de mar solo puede unirse al resto por {cell}.',
    'hint.shade': 'No hay un paso sencillo desde aquí: {cell} es mar.',
    'hint.keep': 'No hay un paso sencillo desde aquí: {cell} es tierra.',
    'hint.wrongMarks': 'Hay {n} marcas incorrectas (resaltadas): bórralas primero.',
    'hint.wrongMark': 'La marca resaltada no es correcta: bórrala primero.',
    'cell.state.0': 'sin decidir',
    'cell.state.1': 'tierra',
    'cell.state.2': 'mar',
    'cell.hitori': '{cell}: {num} {state}',
    solved: '¡Resuelto en {time}! Errores {mistakes} · pistas {hints}',
    'watch.done': 'La IA encontró el mar en {steps} decisiones.',
    keys: 'Teclas: flechas mover · Espacio mar · K tierra · Retroceso borrar · U deshacer · R rehacer · H pista · P pausa',
  },
};

export const STRINGS: Record<Locale, Dictionary> = {
  en: { ...SUDOKU_STRINGS.en, ...NURI.en },
  es: { ...SUDOKU_STRINGS.es, ...NURI.es },
};
