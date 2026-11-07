import type { Dictionary, Locale } from '../../core/i18n';
import { SUDOKU_STRINGS } from '../shared/sudoku/i18n';

const QUEENS: Record<Locale, Dictionary> = {
  en: {
    title: 'Royal Regions',
    'menu.subtitle':
      'Place one queen in every row, every column and every colored region. Queens may never touch, not even diagonally.',
    'difficulty.easy': '6×6',
    'difficulty.medium': '8×8',
    'difficulty.hard': '9×9',
    'difficulty.expert': '10×10',
    'difficulty.easy.hint': 'Last free cells and regions confined to one line.',
    'difficulty.medium.hint': 'Adds groups of regions sharing the same lines.',
    'difficulty.hard.hint': 'Adds cells whose queen would empty a row, column or region.',
    'difficulty.expert.hint': 'The largest grid, with every technique.',
    'tap.cycle': 'Tap: ✕ then queen',
    'tap.queen': 'Tap: queen',
    'auto.cross': 'Auto ✕ around queens',
    'select.cell': 'Tap a cell once for ✕ and twice for a queen; drag to cross several cells.',
    'cell.state.0': 'empty',
    'cell.state.1': 'crossed',
    'cell.state.2': 'queen',
    'cell.label': '{cell}, {region} region: {state}',
    'region.0': 'lavender',
    'region.1': 'peach',
    'region.2': 'sky',
    'region.3': 'mint',
    'region.4': 'lemon',
    'region.5': 'rose',
    'region.6': 'sand',
    'region.7': 'teal',
    'region.8': 'lilac',
    'region.9': 'slate',
    'line.row': 'row {n}',
    'line.col': 'column {n}',
    'line.region': 'the {region} region',
    clash: 'Two queens clash (highlighted): they share a row, column or region, or touch.',
    'hint.cross': 'The queen at {cell} rules out its row, column, region and the cells around it.',
    'hint.single': '{unit} has one free cell left: the queen goes on {cell}.',
    'hint.confinedRegion':
      'The {region} region fits only in {line}, so the other cells of {line} are ruled out.',
    'hint.confinedLine':
      'Every free cell of {line} is in the {region} region, so the rest of that region is ruled out.',
    'hint.groupRegions':
      'The {regions} regions fit only in {lines}: those lines belong to them, so their other cells are ruled out.',
    'hint.groupLines':
      '{lines} only have free cells in the {regions} regions: those regions belong to them, so their other cells are ruled out.',
    'hint.attack':
      'A queen on {cell} would leave {unit} without a free cell, so {cell} is ruled out.',
    'hint.wrongCell': 'The highlighted mark is not right: remove it first.',
    'hint.wrongCells': '{n} marks are not right (highlighted): remove them first.',
    'hint.none': 'No simple step from here: the queen of row {row} is on {cell}.',
    'hint.fill': 'Apply',
    and: ' and ',
    solved: 'Solved in {time}! Mistakes {mistakes} · hints {hints}',
    'watch.done': 'The AI solved it in {steps} steps.',
    keys: 'Keys: arrows move · Space cycle · Q queen · X cross · Backspace clear · U undo · R redo · H hint · P pause',
  },
  es: {
    title: 'Reinas por regiones',
    'menu.subtitle':
      'Coloca una reina en cada fila, cada columna y cada región de color. Las reinas nunca pueden tocarse, ni en diagonal.',
    'difficulty.easy': '6×6',
    'difficulty.medium': '8×8',
    'difficulty.hard': '9×9',
    'difficulty.expert': '10×10',
    'difficulty.easy.hint': 'Últimas casillas libres y regiones encerradas en una línea.',
    'difficulty.medium.hint': 'Añade grupos de regiones que comparten las mismas líneas.',
    'difficulty.hard.hint': 'Añade casillas cuya reina vaciaría una fila, columna o región.',
    'difficulty.expert.hint': 'La cuadrícula más grande, con todas las técnicas.',
    'tap.cycle': 'Toque: ✕ y luego reina',
    'tap.queen': 'Toque: reina',
    'auto.cross': '✕ automática alrededor de las reinas',
    'select.cell':
      'Toca una casilla una vez para ✕ y dos para una reina; arrastra para tachar varias.',
    'cell.state.0': 'vacía',
    'cell.state.1': 'tachada',
    'cell.state.2': 'reina',
    'cell.label': '{cell}, región {region}: {state}',
    'region.0': 'lavanda',
    'region.1': 'melocotón',
    'region.2': 'celeste',
    'region.3': 'menta',
    'region.4': 'limón',
    'region.5': 'rosa',
    'region.6': 'arena',
    'region.7': 'turquesa',
    'region.8': 'lila',
    'region.9': 'pizarra',
    'line.row': 'la fila {n}',
    'line.col': 'la columna {n}',
    'line.region': 'la región {region}',
    clash: 'Dos reinas chocan (resaltadas): comparten fila, columna o región, o se tocan.',
    'hint.cross':
      'La reina de {cell} descarta su fila, su columna, su región y las casillas de alrededor.',
    'hint.single': 'A {unit} le queda una casilla libre: la reina va en {cell}.',
    'hint.confinedRegion':
      'La región {region} solo cabe en {line}, así que las demás casillas de {line} quedan descartadas.',
    'hint.confinedLine':
      'Todas las casillas libres de {line} están en la región {region}, así que el resto de esa región queda descartado.',
    'hint.groupRegions':
      'Las regiones {regions} solo caben en {lines}: esas líneas son suyas y sus demás casillas quedan descartadas.',
    'hint.groupLines':
      '{lines} solo tienen casillas libres en las regiones {regions}: esas regiones son suyas y sus demás casillas quedan descartadas.',
    'hint.attack':
      'Una reina en {cell} dejaría a {unit} sin casillas libres, así que {cell} queda descartada.',
    'hint.wrongCell': 'La marca resaltada no es correcta: quítala primero.',
    'hint.wrongCells': 'Hay {n} marcas incorrectas (resaltadas): quítalas primero.',
    'hint.none': 'No hay un paso sencillo: la reina de la fila {row} está en {cell}.',
    'hint.fill': 'Aplicar',
    and: ' y ',
    solved: '¡Resuelto en {time}! Errores {mistakes} · pistas {hints}',
    'watch.done': 'La IA lo resolvió en {steps} pasos.',
    keys: 'Teclas: flechas mover · Espacio alternar · Q reina · X tachar · Retroceso borrar · U deshacer · R rehacer · H pista · P pausa',
  },
};

export const STRINGS: Record<Locale, Dictionary> = {
  en: { ...SUDOKU_STRINGS.en, ...QUEENS.en },
  es: { ...SUDOKU_STRINGS.es, ...QUEENS.es },
};
