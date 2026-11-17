import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    found: 'Discoveries {n} / {total}',
    search: 'Search {n} items…',
    'sort.time': 'Discovery order',
    'sort.name': 'Name',
    hint: 'Hint',
    clear: 'Clear',
    reset: 'Reset',
    'reset.confirm': 'Forget all discoveries and start again from the four basics?',
    empty:
      'Drag elements here from the list (or tap them), then drop one on another to combine them.',
    'toast.new': 'New discovery: {e}',
    'toast.made': '{e}',
    'toast.nothing': 'Nothing happens…',
    'hint.text': 'Try combining {e} with something.',
    'hint.none': 'Every reachable element has been found!',
    'hint.all': 'You found all {n} elements!',
    space: 'Crafting space',
    list: 'Discovered elements',
    'chip.help':
      '{e} — Enter to select, Enter on another to combine, D to duplicate, Delete to remove',
    'item.help': '{e} — Enter to place it on the crafting space',
  },
  es: {
    found: 'Descubrimientos {n} / {total}',
    search: 'Buscar entre {n} elementos…',
    'sort.time': 'Orden de descubrimiento',
    'sort.name': 'Nombre',
    hint: 'Pista',
    clear: 'Limpiar',
    reset: 'Reiniciar',
    'reset.confirm':
      '¿Olvidar todos los descubrimientos y empezar de nuevo con los cuatro básicos?',
    empty:
      'Arrastra elementos aquí desde la lista (o tócalos) y suelta uno sobre otro para combinarlos.',
    'toast.new': 'Nuevo descubrimiento: {e}',
    'toast.made': '{e}',
    'toast.nothing': 'No pasa nada…',
    'hint.text': 'Prueba a combinar {e} con algo.',
    'hint.none': '¡Has encontrado todos los elementos alcanzables!',
    'hint.all': '¡Has encontrado los {n} elementos!',
    space: 'Espacio de creación',
    list: 'Elementos descubiertos',
    'chip.help':
      '{e}: Intro para seleccionar, Intro sobre otro para combinar, D para duplicar, Supr para quitar',
    'item.help': '{e}: Intro para ponerlo en el espacio de creación',
  },
};
