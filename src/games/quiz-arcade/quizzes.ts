/**
 * The #204 Quiz Arcade bank: original quizzes in the formats of the big quiz sites (type-in lists,
 * hint tables, click grids, pick-all and picture slideshows), in English and Spanish.
 */
import { item, type Quiz, type QuizItem } from '../shared/quiz/engine';

const L = (en: string, es: string) => ({ en, es });

const ELEMENTS =
  'H:hydrogen|hidrógeno;He:helium|helio;Li:lithium|litio;Be:beryllium|berilio;B:boron|boro;C:carbon|carbono;N:nitrogen|nitrógeno;O:oxygen|oxígeno;F:fluorine|flúor;Ne:neon|neón;Na:sodium|sodio;Mg:magnesium|magnesio;Al:aluminium/aluminum|aluminio;Si:silicon|silicio;P:phosphorus|fósforo;S:sulfur/sulphur|azufre;Cl:chlorine|cloro;Ar:argon|argón;K:potassium|potasio;Ca:calcium|calcio;Sc:scandium|escandio;Ti:titanium|titanio;V:vanadium|vanadio;Cr:chromium|cromo;Mn:manganese|manganeso;Fe:iron|hierro;Co:cobalt|cobalto;Ni:nickel|níquel;Cu:copper|cobre;Zn:zinc|zinc/cinc;Ga:gallium|galio;Ge:germanium|germanio;As:arsenic|arsénico;Se:selenium|selenio;Br:bromine|bromo;Kr:krypton|kriptón/criptón;Rb:rubidium|rubidio;Sr:strontium|estroncio;Y:yttrium|itrio;Zr:zirconium|circonio/zirconio;Nb:niobium|niobio;Mo:molybdenum|molibdeno;Tc:technetium|tecnecio;Ru:ruthenium|rutenio;Rh:rhodium|rodio;Pd:palladium|paladio;Ag:silver|plata;Cd:cadmium|cadmio;In:indium|indio;Sn:tin|estaño;Sb:antimony|antimonio;Te:tellurium|telurio;I:iodine|yodo;Xe:xenon|xenón;Cs:caesium/cesium|cesio;Ba:barium|bario;La:lanthanum|lantano;Ce:cerium|cerio;Pr:praseodymium|praseodimio;Nd:neodymium|neodimio;Pm:promethium|prometio;Sm:samarium|samario;Eu:europium|europio;Gd:gadolinium|gadolinio;Tb:terbium|terbio;Dy:dysprosium|disprosio;Ho:holmium|holmio;Er:erbium|erbio;Tm:thulium|tulio;Yb:ytterbium|iterbio;Lu:lutetium|lutecio;Hf:hafnium|hafnio;Ta:tantalum|tantalio;W:tungsten/wolfram|wolframio/tungsteno;Re:rhenium|renio;Os:osmium|osmio;Ir:iridium|iridio;Pt:platinum|platino;Au:gold|oro;Hg:mercury|mercurio;Tl:thallium|talio;Pb:lead|plomo;Bi:bismuth|bismuto;Po:polonium|polonio;At:astatine|astato;Rn:radon|radón;Fr:francium|francio;Ra:radium|radio;Ac:actinium|actinio;Th:thorium|torio;Pa:protactinium|protactinio;U:uranium|uranio;Np:neptunium|neptunio;Pu:plutonium|plutonio;Am:americium|americio;Cm:curium|curio;Bk:berkelium|berkelio;Cf:californium|californio;Es:einsteinium|einstenio;Fm:fermium|fermio;Md:mendelevium|mendelevio;No:nobelium|nobelio;Lr:lawrencium|laurencio;Rf:rutherfordium|rutherfordio;Db:dubnium|dubnio;Sg:seaborgium|seaborgio;Bh:bohrium|bohrio;Hs:hassium|hasio;Mt:meitnerium|meitnerio;Ds:darmstadtium|darmstatio;Rg:roentgenium|roentgenio;Cn:copernicium|copernicio;Nh:nihonium|nihonio;Fl:flerovium|flerovio;Mc:moscovium|moscovio;Lv:livermorium|livermorio;Ts:tennessine|teneso;Og:oganesson|oganesón';

const elements: QuizItem[] = ELEMENTS.split(';').map((e) => {
  const [sym, names] = e.split(':');
  return item(names!, L(sym!, sym!));
});

const list = (specs: string): QuizItem[] => specs.split(';').map((s) => item(s));
const hinted = (rows: [string, string, string][]): QuizItem[] =>
  rows.map(([hEn, hEs, spec]) => item(spec, L(hEn, hEs)));

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];
export function toRoman(n: number): string {
  let out = '';
  for (const [v, s] of ROMAN)
    while (n >= v) {
      out += s;
      n -= v;
    }
  return out;
}

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);

export const QUIZZES: Quiz[] = [
  {
    id: 'elements',
    category: 'science',
    title: L('Elements by symbol', 'Elementos por símbolo'),
    description: L(
      'Name all 118 chemical elements from their symbols.',
      'Nombra los 118 elementos químicos a partir de su símbolo.',
    ),
    format: 'type',
    seconds: 15 * 60,
    columns: { hint: L('Symbol', 'Símbolo'), answer: L('Element', 'Elemento') },
    items: elements,
  },
  {
    id: 'planets',
    category: 'science',
    title: L('Planets of the solar system', 'Planetas del sistema solar'),
    description: L('Name the eight planets.', 'Nombra los ocho planetas.'),
    format: 'type',
    seconds: 60,
    items: list(
      'mercury|mercurio;venus|venus;earth|tierra;mars|marte;jupiter|júpiter;saturn|saturno;uranus|urano;neptune|neptuno',
    ),
  },
  {
    id: 'continents-oceans',
    category: 'geography',
    title: L('Continents and oceans', 'Continentes y océanos'),
    description: L(
      'Name the seven continents and five oceans.',
      'Nombra los siete continentes y los cinco océanos.',
    ),
    format: 'type',
    seconds: 90,
    items: list(
      'africa|áfrica;antarctica|antártida;asia|asia;australia/oceania|australia/oceanía;europe|europa;north america|américa del norte/norteamérica;south america|américa del sur/sudamérica/suramérica;pacific/pacific ocean|pacífico/océano pacífico;atlantic/atlantic ocean|atlántico/océano atlántico;indian/indian ocean|índico/océano índico;arctic/arctic ocean|ártico/océano ártico;southern/southern ocean/antarctic ocean|antártico/océano antártico/océano austral',
    ),
  },
  {
    id: 'greek-gods',
    category: 'history',
    title: L('Olympian gods by domain', 'Dioses olímpicos por dominio'),
    description: L('Name the Greek god of each domain.', 'Nombra al dios griego de cada dominio.'),
    format: 'type',
    seconds: 3 * 60,
    columns: { hint: L('Domain', 'Dominio'), answer: L('God', 'Dios') },
    items: hinted([
      ['King of the gods, sky', 'Rey de los dioses, cielo', 'zeus|zeus'],
      ['Marriage, queen of the gods', 'Matrimonio, reina de los dioses', 'hera|hera'],
      ['The sea', 'El mar', 'poseidon|poseidón'],
      ['Wisdom, strategy', 'Sabiduría, estrategia', 'athena/athene|atenea'],
      ['The sun, music, prophecy', 'El sol, la música, la profecía', 'apollo|apolo'],
      ['The hunt, the moon', 'La caza, la luna', 'artemis|artemisa'],
      ['War', 'La guerra', 'ares|ares'],
      ['Love, beauty', 'El amor, la belleza', 'aphrodite|afrodita'],
      ['The forge, fire', 'La fragua, el fuego', 'hephaestus/hephaistos|hefesto'],
      ['Messengers, travellers', 'Mensajeros, viajeros', 'hermes|hermes'],
      ['Harvest, agriculture', 'La cosecha, la agricultura', 'demeter|deméter'],
      ['Wine, theatre', 'El vino, el teatro', 'dionysus/dionysos|dioniso/dionisio'],
    ]),
  },
  {
    id: 'rainbow',
    category: 'science',
    title: L('Colours of the rainbow', 'Colores del arcoíris'),
    description: L(
      'Name the seven traditional colours of the rainbow.',
      'Nombra los siete colores tradicionales del arcoíris.',
    ),
    format: 'type',
    seconds: 45,
    items: list(
      'red|rojo;orange|naranja/anaranjado;yellow|amarillo;green|verde;blue|azul;indigo|añil/índigo;violet|violeta',
    ),
  },
  {
    id: 'zodiac',
    category: 'culture',
    title: L('Signs of the zodiac', 'Signos del zodiaco'),
    description: L(
      'Name the twelve signs, given their symbols.',
      'Nombra los doce signos a partir de su símbolo.',
    ),
    format: 'type',
    seconds: 2 * 60,
    columns: { hint: L('Symbol', 'Símbolo'), answer: L('Sign', 'Signo') },
    items: hinted([
      ['♈ Ram', '♈ Carnero', 'aries|aries'],
      ['♉ Bull', '♉ Toro', 'taurus|tauro'],
      ['♊ Twins', '♊ Gemelos', 'gemini|géminis'],
      ['♋ Crab', '♋ Cangrejo', 'cancer|cáncer'],
      ['♌ Lion', '♌ León', 'leo|leo'],
      ['♍ Maiden', '♍ Doncella', 'virgo|virgo'],
      ['♎ Scales', '♎ Balanza', 'libra|libra'],
      ['♏ Scorpion', '♏ Escorpión', 'scorpio|escorpio/escorpión'],
      ['♐ Archer', '♐ Arquero', 'sagittarius|sagitario'],
      ['♑ Sea-goat', '♑ Cabra marina', 'capricorn|capricornio'],
      ['♒ Water-bearer', '♒ Aguador', 'aquarius|acuario'],
      ['♓ Fish', '♓ Peces', 'pisces|piscis'],
    ]),
  },
  {
    id: 'inventors',
    category: 'history',
    title: L('Inventors by invention', 'Inventores por invento'),
    description: L(
      'Who is best known for each invention or discovery?',
      '¿Quién es más conocido por cada invento o descubrimiento?',
    ),
    format: 'type',
    seconds: 4 * 60,
    columns: { hint: L('Invention', 'Invento'), answer: L('Inventor', 'Inventor') },
    items: hinted([
      [
        'Telephone (1876 patent)',
        'Teléfono (patente de 1876)',
        'bell/alexander graham bell|bell/graham bell/alexander graham bell',
      ],
      [
        'Movable-type printing press in Europe',
        'Imprenta de tipos móviles en Europa',
        'gutenberg/johannes gutenberg|gutenberg/johannes gutenberg',
      ],
      [
        'Theory of relativity',
        'Teoría de la relatividad',
        'einstein/albert einstein|einstein/albert einstein',
      ],
      ['Penicillin', 'Penicilina', 'fleming/alexander fleming|fleming/alexander fleming'],
      [
        'Laws of motion and gravitation',
        'Leyes del movimiento y la gravitación',
        'newton/isaac newton|newton/isaac newton',
      ],
      [
        'Radioactivity research, two Nobel prizes',
        'Radiactividad, dos premios Nobel',
        'curie/marie curie|curie/marie curie',
      ],
      [
        'Practical incandescent light bulb',
        'Bombilla incandescente práctica',
        'edison/thomas edison|edison/thomas edison',
      ],
      [
        'Alternating-current motor',
        'Motor de corriente alterna',
        'tesla/nikola tesla|tesla/nikola tesla',
      ],
      [
        'Theory of evolution by natural selection',
        'Evolución por selección natural',
        'darwin/charles darwin|darwin/charles darwin',
      ],
      [
        'First powered aeroplane flight (brothers)',
        'Primer vuelo propulsado (hermanos)',
        'wright/wright brothers|wright/hermanos wright',
      ],
      [
        'World Wide Web',
        'World Wide Web',
        'berners-lee/tim berners-lee|berners-lee/tim berners-lee',
      ],
      ['Dynamite', 'Dinamita', 'nobel/alfred nobel|nobel/alfred nobel'],
      ['Pasteurization', 'Pasteurización', 'pasteur/louis pasteur|pasteur/louis pasteur'],
      [
        'Periodic table',
        'Tabla periódica',
        'mendeleev/dmitri mendeleev|mendeléyev/mendeleiev/dmitri mendeléyev',
      ],
      [
        'Steam engine improvements (1769)',
        'Mejoras de la máquina de vapor (1769)',
        'watt/james watt|watt/james watt',
      ],
      [
        'Radio transmission (1890s)',
        'Transmisión por radio (década de 1890)',
        'marconi/guglielmo marconi|marconi/guglielmo marconi',
      ],
      [
        'Heliocentric model (1543)',
        'Modelo heliocéntrico (1543)',
        'copernicus/nicolaus copernicus|copérnico/nicolás copérnico',
      ],
      [
        'Telescope observations of Jupiter’s moons',
        'Lunas de Júpiter con telescopio',
        'galileo/galileo galilei|galileo/galileo galilei',
      ],
      [
        'Autogyro (1923)',
        'Autogiro (1923)',
        'de la cierva/juan de la cierva|de la cierva/juan de la cierva',
      ],
      [
        'Submarine Ictíneo (1859)',
        'Submarino Ictíneo (1859)',
        'monturiol/narcis monturiol|monturiol/narcís monturiol',
      ],
    ]),
  },
  {
    id: 'painters',
    category: 'culture',
    title: L('Painters by painting', 'Pintores por cuadro'),
    description: L('Who painted each famous work?', '¿Quién pintó cada obra famosa?'),
    format: 'type',
    seconds: 4 * 60,
    columns: { hint: L('Painting', 'Cuadro'), answer: L('Painter', 'Pintor') },
    items: hinted([
      [
        'Mona Lisa',
        'La Gioconda',
        'da vinci/leonardo/leonardo da vinci|da vinci/leonardo/leonardo da vinci',
      ],
      [
        'The Starry Night',
        'La noche estrellada',
        'van gogh/vincent van gogh|van gogh/vincent van gogh',
      ],
      ['Guernica', 'Guernica', 'picasso/pablo picasso|picasso/pablo picasso'],
      ['Las Meninas', 'Las meninas', 'velazquez/diego velazquez|velázquez/diego velázquez'],
      [
        'The Persistence of Memory',
        'La persistencia de la memoria',
        'dali/salvador dali|dalí/salvador dalí',
      ],
      [
        'The Birth of Venus',
        'El nacimiento de Venus',
        'botticelli/sandro botticelli|botticelli/sandro botticelli',
      ],
      ['The Scream', 'El grito', 'munch/edvard munch|munch/edvard munch'],
      [
        'Girl with a Pearl Earring',
        'La joven de la perla',
        'vermeer/johannes vermeer|vermeer/johannes vermeer',
      ],
      ['The Night Watch', 'La ronda de noche', 'rembrandt|rembrandt'],
      [
        'The Third of May 1808',
        'El tres de mayo de 1808',
        'goya/francisco de goya|goya/francisco de goya',
      ],
      ['The Kiss (1908)', 'El beso (1908)', 'klimt/gustav klimt|klimt/gustav klimt'],
      ['Impression, Sunrise', 'Impresión, sol naciente', 'monet/claude monet|monet/claude monet'],
      [
        'The Garden of Earthly Delights',
        'El jardín de las delicias',
        'bosch/hieronymus bosch|el bosco/bosco',
      ],
      ['The Creation of Adam', 'La creación de Adán', 'michelangelo|miguel ángel/miguel angel'],
      ['The Two Fridas', 'Las dos Fridas', 'kahlo/frida kahlo|kahlo/frida kahlo'],
      ['The Great Wave off Kanagawa', 'La gran ola de Kanagawa', 'hokusai|hokusai'],
      [
        'Nighthawks',
        'Nighthawks (Halcones nocturnos)',
        'hopper/edward hopper|hopper/edward hopper',
      ],
      [
        'The Son of Man (apple face)',
        'El hijo del hombre (la manzana)',
        'magritte/rene magritte|magritte/rené magritte',
      ],
    ]),
  },
  {
    id: 'world-cup',
    category: 'sport',
    title: L('Football World Cup winners', 'Campeones del Mundial de fútbol'),
    description: L(
      'Name the men’s World Cup winner of each year.',
      'Nombra al campeón del Mundial masculino de cada año.',
    ),
    format: 'type',
    seconds: 4 * 60,
    columns: { hint: L('Year', 'Año'), answer: L('Winner', 'Campeón') },
    items: (
      [
        [1930, 'uruguay|uruguay'],
        [1934, 'italy|italia'],
        [1938, 'italy|italia'],
        [1950, 'uruguay|uruguay'],
        [1954, 'west germany/germany|alemania occidental/alemania/rfa'],
        [1958, 'brazil|brasil'],
        [1962, 'brazil|brasil'],
        [1966, 'england|inglaterra'],
        [1970, 'brazil|brasil'],
        [1974, 'west germany/germany|alemania occidental/alemania/rfa'],
        [1978, 'argentina|argentina'],
        [1982, 'italy|italia'],
        [1986, 'argentina|argentina'],
        [1990, 'west germany/germany|alemania occidental/alemania/rfa'],
        [1994, 'brazil|brasil'],
        [1998, 'france|francia'],
        [2002, 'brazil|brasil'],
        [2006, 'italy|italia'],
        [2010, 'spain|españa'],
        [2014, 'germany|alemania'],
        [2018, 'france|francia'],
        [2022, 'argentina|argentina'],
      ] as [number, string][]
    ).map(([y, spec]) => item(spec, L(String(y), String(y)))),
  },
  {
    id: 'bones',
    category: 'science',
    title: L('Bones of the human body', 'Huesos del cuerpo humano'),
    description: L('Name 20 well-known bones.', 'Nombra 20 huesos conocidos.'),
    format: 'type',
    seconds: 3 * 60,
    items: list(
      'skull/cranium|cráneo;mandible/jawbone|mandíbula/maxilar inferior;clavicle/collarbone|clavícula;scapula/shoulder blade|escápula/omóplato;sternum/breastbone|esternón;rib|costilla;humerus|húmero;radius|radio;ulna|cúbito;carpal|carpo/carpiano;metacarpal|metacarpo/metacarpiano;phalanx/phalanges|falange;vertebra|vértebra;pelvis/hip bone|pelvis/cadera;sacrum|sacro;femur|fémur;patella/kneecap|rótula;tibia/shinbone|tibia;fibula|peroné;calcaneus/heel bone|calcáneo',
    ),
  },
  {
    id: 'roman-numerals',
    category: 'maths',
    title: L('Roman numerals', 'Números romanos'),
    description: L(
      'Type each Roman numeral in ordinary digits.',
      'Escribe cada número romano en cifras.',
    ),
    format: 'slideshow',
    shuffle: true,
    seconds: 2 * 60,
    items: [
      4, 9, 14, 19, 27, 40, 44, 49, 76, 90, 99, 144, 400, 499, 888, 1066, 1492, 1999, 2024, 3888,
    ].map((n) => item(`${n}|${n}`, L(toRoman(n), toRoman(n)))),
  },
  {
    id: 'polygons',
    category: 'maths',
    title: L('Name the polygon', 'Nombra el polígono'),
    description: L(
      'Name each regular polygon from its picture.',
      'Nombra cada polígono regular a partir de su dibujo.',
    ),
    format: 'slideshow',
    shuffle: true,
    seconds: 90,
    items: [
      [3, 'triangle/equilateral triangle|triángulo/triángulo equilátero'],
      [4, 'square|cuadrado'],
      [5, 'pentagon|pentágono'],
      [6, 'hexagon|hexágono'],
      [7, 'heptagon/septagon|heptágono'],
      [8, 'octagon|octógono/octágono'],
      [9, 'nonagon/enneagon|eneágono/nonágono'],
      [10, 'decagon|decágono'],
      [11, 'hendecagon/undecagon|endecágono/undecágono'],
      [12, 'dodecagon|dodecágono'],
    ].map(([n, spec]) =>
      item(spec as string, undefined, { picture: { kind: 'polygon', sides: n as number } }),
    ),
  },
  {
    id: 'planet-facts',
    category: 'science',
    title: L('Click the planet', 'Haz clic en el planeta'),
    description: L(
      'Click the planet that matches each fact.',
      'Haz clic en el planeta que corresponde a cada dato.',
    ),
    format: 'click',
    seconds: 90,
    items: hinted([
      ['Closest to the Sun', 'El más cercano al Sol', 'mercury|mercurio'],
      ['Hottest surface, thick clouds', 'La superficie más caliente, nubes densas', 'venus|venus'],
      ['The only one known to have life', 'El único con vida conocida', 'earth|tierra'],
      ['Home of Olympus Mons', 'Hogar del monte Olimpo', 'mars|marte'],
      ['Has the Great Red Spot', 'Tiene la Gran Mancha Roja', 'jupiter|júpiter'],
      ['Has the brightest rings', 'Tiene los anillos más brillantes', 'saturn|saturno'],
      ['Spins on its side', 'Gira tumbado de lado', 'uranus|urano'],
      ['Farthest from the Sun', 'El más lejano del Sol', 'neptune|neptuno'],
    ]),
  },
  {
    id: 'element-symbols-click',
    category: 'science',
    title: L('Click the symbol', 'Haz clic en el símbolo'),
    description: L(
      'Click the symbol of each common element.',
      'Haz clic en el símbolo de cada elemento común.',
    ),
    format: 'click',
    seconds: 2 * 60,
    items: [
      ['gold', 'oro', 'Au'],
      ['silver', 'plata', 'Ag'],
      ['iron', 'hierro', 'Fe'],
      ['lead', 'plomo', 'Pb'],
      ['sodium', 'sodio', 'Na'],
      ['potassium', 'potasio', 'K'],
      ['copper', 'cobre', 'Cu'],
      ['tin', 'estaño', 'Sn'],
      ['mercury', 'mercurio', 'Hg'],
      ['tungsten', 'wolframio', 'W'],
      ['helium', 'helio', 'He'],
      ['calcium', 'calcio', 'Ca'],
      ['zinc', 'zinc', 'Zn'],
      ['nitrogen', 'nitrógeno', 'N'],
      ['phosphorus', 'fósforo', 'P'],
      ['antimony', 'antimonio', 'Sb'],
    ].map(([en, es, sym]) => item(`${sym}|${sym}`, L(en!, es!))),
  },
  {
    id: 'pick-mammals',
    category: 'nature',
    title: L('Pick the mammals', 'Elige los mamíferos'),
    description: L(
      'Click every mammal. Three wrong clicks and you are out.',
      'Haz clic en todos los mamíferos. Tres fallos y quedas fuera.',
    ),
    format: 'pick',
    seconds: 90,
    items: [
      ...list(
        'whale|ballena;bat|murciélago;dolphin|delfín;platypus|ornitorrinco;kangaroo|canguro;hedgehog|erizo;seal|foca;human|ser humano/humano;koala|koala;manatee|manatí;echidna|equidna;walrus|morsa',
      ).map((x) => ({ ...x, correct: true })),
      ...list(
        'shark|tiburón;penguin|pingüino;crocodile|cocodrilo;salamander|salamandra;ostrich|avestruz;octopus|pulpo;tortoise|tortuga;eel|anguila;frog|rana;bee|abeja;seahorse|caballito de mar;flamingo|flamenco',
      ).map((x) => ({ ...x, correct: false })),
    ],
  },
  {
    id: 'pick-primes',
    category: 'maths',
    title: L('Pick the prime numbers', 'Elige los números primos'),
    description: L(
      'Click every prime number up to 50. Three wrong clicks and you are out.',
      'Haz clic en todos los primos hasta 50. Tres fallos y quedas fuera.',
    ),
    format: 'pick',
    seconds: 90,
    items: Array.from({ length: 49 }, (_, i) => i + 2).map((n) => ({
      ...item(`${n}|${n}`),
      correct: PRIMES.has(n),
    })),
  },
  {
    id: 'ancient-wonders',
    category: 'history',
    title: L('Seven Wonders of the Ancient World', 'Siete maravillas del mundo antiguo'),
    description: L('Name all seven.', 'Nómbralas todas.'),
    format: 'type',
    seconds: 2 * 60,
    items: list(
      'great pyramid/pyramid of giza/great pyramid of giza|gran pirámide/pirámide de giza/gran pirámide de guiza;hanging gardens/hanging gardens of babylon|jardines colgantes/jardines colgantes de babilonia;statue of zeus/statue of zeus at olympia|estatua de zeus/estatua de zeus en olimpia;temple of artemis/temple of artemis at ephesus|templo de artemisa/templo de artemisa en éfeso;mausoleum/mausoleum at halicarnassus|mausoleo/mausoleo de halicarnaso;colossus/colossus of rhodes|coloso/coloso de rodas;lighthouse/lighthouse of alexandria/pharos|faro/faro de alejandría',
    ),
  },
  {
    id: 'chess-pieces',
    category: 'culture',
    title: L('Chess pieces', 'Piezas de ajedrez'),
    description: L(
      'Name the six chess pieces from their symbols.',
      'Nombra las seis piezas del ajedrez por su símbolo.',
    ),
    format: 'type',
    seconds: 45,
    columns: { hint: L('Symbol', 'Símbolo'), answer: L('Piece', 'Pieza') },
    items: hinted([
      ['♔', '♔', 'king|rey'],
      ['♕', '♕', 'queen|dama/reina'],
      ['♖', '♖', 'rook/castle|torre'],
      ['♗', '♗', 'bishop|alfil'],
      ['♘', '♘', 'knight/horse|caballo'],
      ['♙', '♙', 'pawn|peón'],
    ]),
  },
];
