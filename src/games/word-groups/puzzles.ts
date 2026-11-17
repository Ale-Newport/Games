/**
 * Original puzzles for #208 Word Groups. Each puzzle has four groups of four words, from the most
 * direct (level 0, yellow) to the trickiest (level 3, purple: wordplay and hidden links). Some
 * words deliberately fit two groups (red herrings), but every puzzle has exactly one way to split
 * the sixteen words. English and Spanish puzzles are written separately, since wordplay does not
 * translate. Format per group: `label|WORD,WORD,WORD,WORD`, listed from level 0 to level 3.
 */
export interface GroupSpec {
  label: string;
  words: [string, string, string, string];
}
export interface Puzzle {
  id: string;
  lang: 'en' | 'es';
  groups: [GroupSpec, GroupSpec, GroupSpec, GroupSpec];
}

function p(id: string, lang: 'en' | 'es', ...rows: [string, string, string, string]): Puzzle {
  const groups = rows.map((r) => {
    const [label, words] = r.split('|');
    return { label: label!, words: words!.split(',').map((w) => w.trim()) as GroupSpec['words'] };
  }) as Puzzle['groups'];
  return { id, lang, groups };
}

export const PUZZLES: Puzzle[] = [
  p(
    'en-1',
    'en',
    'Fruits|BANANA,GRAPE,LEMON,PLUM',
    'Shades of blue|NAVY,TEAL,COBALT,AZURE',
    'Parts of a tree|TRUNK,BRANCH,ROOT,BARK',
    '___ pie|APPLE,MUD,HUMBLE,CUSTARD',
  ),
  p(
    'en-2',
    'en',
    'Kitchen utensils|WHISK,LADLE,GRATER,SPATULA',
    'Card games|POKER,BRIDGE,SNAP,RUMMY',
    'Things with keys|PIANO,LOCK,KEYBOARD,MAP',
    'Hidden body parts|SHINE,CHIPS,HEARTH,KNEEL',
  ),
  p(
    'en-3',
    'en',
    'Planets|MARS,VENUS,SATURN,NEPTUNE',
    'Chemical elements|MERCURY,IRON,NEON,CARBON',
    'Roman gods|JUNO,CUPID,VULCAN,BACCHUS',
    'Cars named after animals|BEETLE,MUSTANG,JAGUAR,IMPALA',
  ),
  p(
    'en-4',
    'en',
    'Dog breeds|BEAGLE,POODLE,PUG,HUSKY',
    'Boxing punches|JAB,HOOK,UPPERCUT,CROSS',
    'Things you can pitch|TENT,BALL,IDEA,VOICE',
    '___bag|SAND,TEA,BEAN,HAND',
  ),
  p(
    'en-5',
    'en',
    'Wintry weather|SNOW,HAIL,SLEET,DRIZZLE',
    'Golf scores|BIRDIE,EAGLE,PAR,BOGEY',
    'Units of time|SECOND,MINUTE,DECADE,CENTURY',
    '___ check|RAIN,SPELL,REALITY,BODY',
  ),
  p(
    'en-6',
    'en',
    'Orchestra instruments|FLUTE,HARP,CELLO,OBOE',
    'Freshwater fish|PIKE,PERCH,CARP,TROUT',
    'Things with scales|MAP,PIANO,DRAGON,THERMOMETER',
    'Hidden numbers|OFTEN,WEIGHT,STONE,CANINE',
  ),
  p(
    'en-7',
    'en',
    'Breakfast foods|CEREAL,BACON,WAFFLE,PORRIDGE',
    'Ways to cook an egg|POACH,FRY,SCRAMBLE,BOIL',
    'Formal speeches|TOAST,EULOGY,LECTURE,SERMON',
    'Slang for steal|NICK,PINCH,LIFT,SWIPE',
  ),
  p(
    'en-8',
    'en',
    'Chess pieces|KING,QUEEN,BISHOP,ROOK',
    'Playing-card words|ACE,JACK,JOKER,SUIT',
    'Shakespeare tragedies|HAMLET,MACBETH,OTHELLO,LEAR',
    '___ crab|HERMIT,SPIDER,HORSESHOE,FIDDLER',
  ),
  p(
    'en-9',
    'en',
    'Colours named after fruit|ORANGE,LIME,PEACH,PLUM',
    'More colours|PURPLE,INDIGO,MAROON,TEAL',
    'Feeling unwell|ILL,QUEASY,POORLY,GREEN',
    'Cowardly|YELLOW,CHICKEN,TIMID,SPINELESS',
  ),
  p(
    'en-10',
    'en',
    'Racket sports|TENNIS,SQUASH,BADMINTON,PADEL',
    'Vegetables|PEPPER,CABBAGE,LEEK,MARROW',
    'Crush|MASH,PULP,CRUMPLE,FLATTEN',
    '___bone|FUNNY,WISH,BACK,JAW',
  ),
  p(
    'en-11',
    'en',
    'Trees|OAK,MAPLE,WILLOW,BIRCH',
    'Volcano words|LAVA,CRATER,MAGMA,VENT',
    'Things you can burn|CD,BRIDGE,CALORIE,CANDLE',
    'What a fire leaves|ASH,EMBER,CINDER,SOOT',
  ),
  p(
    'en-12',
    'en',
    'Shapes|CIRCLE,TRIANGLE,OVAL,HEXAGON',
    'Places in a town|MARKET,PARK,HARBOUR,PLAZA',
    'Uncool|SQUARE,CORNY,DATED,NAFF',
    'Hidden animals|SCATTER,BEARD,DOGMA,ANTIQUE',
  ),
  p(
    'en-13',
    'en',
    'Pasta|PENNE,FUSILLI,ORZO,RIGATONI',
    'Cheeses|BRIE,FETA,EDAM,GOUDA',
    'Sauces|PESTO,GRAVY,AIOLI,KETCHUP',
    'Dances|TANGO,WALTZ,SAMBA,SALSA',
  ),
  p(
    'en-14',
    'en',
    'Sea creatures|WHALE,SQUID,OCTOPUS,DOLPHIN',
    'Pool and snooker words|CUE,POCKET,BREAK,RACK',
    'Swindlers|SHARK,FRAUD,CROOK,HUSTLER',
    '___ tank|THINK,FISH,SEPTIC,GAS',
  ),
  p(
    'en-15',
    'en',
    'Birds|FINCH,CROW,WREN,STARLING',
    'Parts of a ship|DECK,MAST,HULL,KEEL',
    'Famous sidekicks|ROBIN,WATSON,SANCHO,CHEWBACCA',
    '___ bar|CANDY,SAND,CHOCOLATE,SNACK',
  ),
  p(
    'en-16',
    'en',
    'In a wallet|CASH,CARD,RECEIPT,PHOTO',
    'Laundry jobs|WASH,IRON,DRY,RINSE',
    'Poker moves|CALL,RAISE,FOLD,BET',
    '___mate|CHECK,ROOM,CLASS,SHIP',
  ),
  p(
    'es-1',
    'es',
    'Frutas|MANZANA,PERA,CIRUELA,MELÓN',
    'Colores|ROJO,VERDE,AZUL,GRANATE',
    'Partes de un libro|TAPA,LOMO,ÍNDICE,PRÓLOGO',
    'Pinchos de bar|BRAVAS,CROQUETAS,BOQUERONES,ALBÓNDIGAS',
  ),
  p(
    'es-2',
    'es',
    'Instrumentos de cuerda|GUITARRA,VIOLÍN,ARPA,LAÚD',
    'Peces|MERLUZA,ATÚN,SARDINA,LUBINA',
    'Banco de ___|ARENA,DATOS,NIEBLA,PRUEBAS',
    'Esconden un animal|PATOLOGÍA,OSADÍA,VACACIONES,LEONERA',
  ),
  p(
    'es-3',
    'es',
    'Muebles|SILLA,MESA,SOFÁ,ARMARIO',
    'Formas de cocinar|FREÍR,HERVIR,ASAR,GUISAR',
    'Signos del zodiaco|LEO,ARIES,VIRGO,TAURO',
    'Monedas|EURO,DÓLAR,PESO,LIBRA',
  ),
  p(
    'es-4',
    'es',
    'Deportes|FÚTBOL,TENIS,GOLF,RUGBY',
    'Palos de la baraja española|OROS,COPAS,ESPADAS,BASTOS',
    'Cartas de la baraja española|SOTA,CABALLO,REY,AS',
    'Tienen red|PORTERÍA,INTERNET,TELARAÑA,CANASTA',
  ),
  p(
    'es-5',
    'es',
    'Planetas|MARTE,VENUS,SATURNO,JÚPITER',
    'Días de la semana|LUNES,MIÉRCOLES,JUEVES,VIERNES',
    'Dioses romanos|JANO,MINERVA,VULCANO,CUPIDO',
    'Esconden un número|DOSIS,SEISMO,DIEZMO,TRESILLO',
  ),
  p(
    'es-6',
    'es',
    'Árboles|PINO,ROBLE,OLIVO,ABETO',
    'Partes de un árbol|RAÍZ,TRONCO,RAMA,HOJA',
    'Hoja de ___|CÁLCULO,RUTA,AFEITAR,SERVICIOS',
    'Formas del verbo haber|HAYA,HABÍA,HUBO,HABRÁ',
  ),
  p(
    'es-7',
    'es',
    'Animales de granja|VACA,CERDO,OVEJA,GALLINA',
    'Constelaciones|ORIÓN,CASIOPEA,PEGASO,ANDRÓMEDA',
    'Insultos con animal|BURRO,BESUGO,RATA,CABESTRO',
    'Estar como una ___|CABRA,MOTO,ROSA,SOPA',
  ),
  p(
    'es-8',
    'es',
    'Bebidas calientes|CAFÉ,TÉ,INFUSIÓN,CHOCOLATE',
    'Especias|CANELA,CLAVO,COMINO,PIMIENTA',
    'Postres|FLAN,NATILLAS,TIRAMISÚ,BROWNIE',
    'Tonos de marrón|AVELLANA,CAOBA,OCRE,TOSTADO',
  ),
  p(
    'es-9',
    'es',
    'Partes del cuerpo|BRAZO,PIERNA,RODILLA,TOBILLO',
    'Ríos de España|EBRO,TAJO,DUERO,GUADIANA',
    'Medidas antiguas|PALMO,PIE,CODO,LEGUA',
    'Brazo de ___|GITANO,MAR,PALANCA,HIERRO',
  ),
  p(
    'es-10',
    'es',
    'Herramientas|MARTILLO,SIERRA,ALICATES,DESTORNILLADOR',
    'Rangos militares|SARGENTO,TENIENTE,CORONEL,CAPITÁN',
    'Accidentes geográficos|VALLE,CABO,GOLFO,MESETA',
    'Llave ___|INGLESA,MAESTRA,ALLEN,DE PASO',
  ),
  p(
    'es-11',
    'es',
    'Meses|ENERO,MARZO,AGOSTO,NOVIEMBRE',
    'Signos de puntuación|COMA,PUNTO,GUION,PARÉNTESIS',
    'Juegos de mesa|PARCHÍS,AJEDREZ,OCA,CARTAS',
    'Empiezan por una nota musical|DOMINÓ,REMO,FAROLA,SOLAPA',
  ),
  p(
    'es-12',
    'es',
    'Profesiones|MÉDICO,BOMBERO,PANADERO,CARTERO',
    'En la cocina|SARTÉN,OLLA,CAZO,BATIDORA',
    'Accesorios|BOLSO,CARTERA,CINTURÓN,GAFAS',
    'Percusión|BOMBO,TAMBOR,PLATILLOS,CAJÓN',
  ),
];
