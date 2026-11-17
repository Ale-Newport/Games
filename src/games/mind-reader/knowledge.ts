/**
 * The knowledge base: three domains of things to think of, each with yes/no questions (tags). An
 * entity has a tag when the honest answer is "yes"; otherwise "no". Original content: animals,
 * everyday objects, and public-domain characters from myth, folklore and classic literature.
 */
export interface Question {
  id: string;
  en: string;
  es: string;
}

export interface Entity {
  id: string;
  emoji: string;
  en: string;
  es: string;
  tags: string[];
}

export interface Domain {
  id: 'animals' | 'objects' | 'characters';
  questions: Question[];
  entities: Entity[];
}

function questions(text: string): Question[] {
  return text
    .trim()
    .split('\n')
    .map((l) => {
      const [id, en, es] = l.split('|');
      return { id: id!, en: en!, es: es! };
    });
}

function entities(text: string): Entity[] {
  return text
    .trim()
    .split('\n')
    .map((l) => {
      const [id, emoji, en, es, tags] = l.split('|');
      return { id: id!, emoji: emoji!, en: en!, es: es!, tags: tags!.trim().split(/\s+/) };
    });
}

const ANIMAL_Q = questions(`
mammal|Is it a mammal?|¿Es un mamífero?
bird|Is it a bird?|¿Es un ave?
fish|Is it a fish?|¿Es un pez?
reptile|Is it a reptile?|¿Es un reptil?
amphibian|Is it an amphibian?|¿Es un anfibio?
insect|Is it an insect?|¿Es un insecto?
invertebrate|Does it have no backbone?|¿Es un invertebrado?
pet|Do people keep it as a pet?|¿Se tiene como mascota?
farm|Is it a farm animal?|¿Es un animal de granja?
water|Does it live in water?|¿Vive en el agua?
sea|Does it live in the sea?|¿Vive en el mar?
flies|Can it fly?|¿Puede volar?
big|Is it bigger than a person?|¿Es más grande que una persona?
small|Is it smaller than a cat?|¿Es más pequeño que un gato?
carnivore|Does it eat other animals?|¿Come otros animales?
herbivore|Does it eat only plants?|¿Come solo plantas?
stripes|Does it have stripes?|¿Tiene rayas?
spots|Does it have spots?|¿Tiene manchas?
horns|Does it have horns or antlers?|¿Tiene cuernos o astas?
fur|Does it have fur?|¿Tiene pelo?
feathers|Does it have feathers?|¿Tiene plumas?
scales|Does it have scales?|¿Tiene escamas?
four_legs|Does it walk on four legs?|¿Camina a cuatro patas?
no_legs|Does it have no legs?|¿No tiene patas?
nocturnal|Is it active mostly at night?|¿Es sobre todo nocturno?
cold|Does it live where it is very cold?|¿Vive donde hace mucho frío?
africa|Does it live in Africa?|¿Vive en África?
jungle|Does it live in jungles?|¿Vive en la selva?
dangerous|Can it be dangerous to people?|¿Puede ser peligroso para las personas?
venomous|Is it venomous?|¿Es venenoso?
black_white|Is it black and white?|¿Es blanco y negro?
long_neck|Does it have a long neck?|¿Tiene el cuello largo?
hops|Does it hop or jump to move?|¿Se mueve saltando?
climbs|Does it climb trees?|¿Trepa a los árboles?
groups|Does it live in groups?|¿Vive en grupo?
tail|Does it have a long tail?|¿Tiene una cola larga?
shell|Does it have a shell?|¿Tiene caparazón o concha?
eggs|Does it lay eggs?|¿Pone huevos?
eaten|Do people commonly eat it?|¿Se come habitualmente?
fast|Is it famous for being fast?|¿Es famoso por ser rápido?
slow|Is it famous for being slow?|¿Es famoso por ser lento?
`);

const ANIMALS = entities(`
dog|🐕|Dog|Perro|mammal pet fur four_legs carnivore groups tail
cat|🐈|Cat|Gato|mammal pet fur four_legs carnivore climbs tail nocturnal
horse|🐎|Horse|Caballo|mammal farm big fur four_legs herbivore groups tail fast
cow|🐄|Cow|Vaca|mammal farm big fur four_legs herbivore horns spots black_white groups tail eaten
pig|🐖|Pig|Cerdo|mammal farm fur four_legs eaten
sheep|🐑|Sheep|Oveja|mammal farm fur four_legs herbivore groups eaten
goat|🐐|Goat|Cabra|mammal farm fur four_legs herbivore horns groups
chicken|🐔|Chicken|Gallina|bird farm feathers eggs eaten groups
duck|🦆|Duck|Pato|bird farm feathers flies water eggs eaten groups
rabbit|🐇|Rabbit|Conejo|mammal pet small fur four_legs herbivore hops
hamster|🐹|Hamster|Hámster|mammal pet small fur four_legs nocturnal
goldfish|🐠|Goldfish|Pez de colores|fish pet small water scales eggs no_legs
parrot|🦜|Parrot|Loro|bird pet feathers flies climbs jungle eggs tail
lion|🦁|Lion|León|mammal big fur four_legs carnivore africa dangerous groups tail
tiger|🐅|Tiger|Tigre|mammal big fur four_legs carnivore stripes jungle dangerous tail
elephant|🐘|Elephant|Elefante|mammal big four_legs herbivore africa groups dangerous
giraffe|🦒|Giraffe|Jirafa|mammal big fur four_legs herbivore spots africa long_neck horns groups tail
zebra|🦓|Zebra|Cebra|mammal big fur four_legs herbivore stripes black_white africa groups tail
rhino|🦏|Rhinoceros|Rinoceronte|mammal big four_legs herbivore horns africa dangerous
hippo|🦛|Hippopotamus|Hipopótamo|mammal big four_legs herbivore africa water dangerous groups
monkey|🐒|Monkey|Mono|mammal fur climbs jungle groups tail
gorilla|🦍|Gorilla|Gorila|mammal big fur herbivore africa jungle groups
panda|🐼|Giant panda|Panda gigante|mammal big fur four_legs herbivore black_white climbs
polar_bear|🐻‍❄️|Polar bear|Oso polar|mammal big fur four_legs carnivore cold dangerous water
bear|🐻|Brown bear|Oso pardo|mammal big fur four_legs carnivore dangerous climbs
wolf|🐺|Wolf|Lobo|mammal fur four_legs carnivore groups dangerous nocturnal cold tail
fox|🦊|Fox|Zorro|mammal fur four_legs carnivore nocturnal tail
deer|🦌|Deer|Ciervo|mammal fur four_legs herbivore horns groups fast
kangaroo|🦘|Kangaroo|Canguro|mammal big fur herbivore hops groups tail
koala|🐨|Koala|Koala|mammal fur herbivore climbs nocturnal
sloth|🦥|Sloth|Perezoso|mammal fur herbivore climbs jungle slow
bat|🦇|Bat|Murciélago|mammal small fur flies nocturnal groups
mouse|🐁|Mouse|Ratón|mammal small fur four_legs nocturnal tail groups
squirrel|🐿️|Squirrel|Ardilla|mammal small fur four_legs herbivore climbs tail
cheetah|🐆|Cheetah|Guepardo|mammal fur four_legs carnivore spots africa fast tail
camel|🐪|Camel|Camello|mammal big fur four_legs herbivore long_neck groups
whale|🐋|Whale|Ballena|mammal big sea water no_legs groups
dolphin|🐬|Dolphin|Delfín|mammal big sea water no_legs carnivore groups fast
shark|🦈|Shark|Tiburón|fish big sea water no_legs carnivore dangerous fast
octopus|🐙|Octopus|Pulpo|invertebrate sea water carnivore eaten
jellyfish|🪼|Jellyfish|Medusa|invertebrate sea water no_legs venomous groups
crab|🦀|Crab|Cangrejo|invertebrate sea water shell carnivore eggs eaten
seal|🦭|Seal|Foca|mammal big sea water fur cold carnivore groups
penguin|🐧|Penguin|Pingüino|bird feathers sea water cold black_white carnivore eggs groups
eagle|🦅|Eagle|Águila|bird feathers flies carnivore eggs fast
owl|🦉|Owl|Búho|bird feathers flies carnivore nocturnal eggs
flamingo|🦩|Flamingo|Flamenco|bird feathers flies water long_neck eggs groups
ostrich|🦤|Ostrich|Avestruz|bird big feathers africa long_neck eggs fast
crocodile|🐊|Crocodile|Cocodrilo|reptile big scales four_legs carnivore water dangerous eggs tail africa
snake|🐍|Snake|Serpiente|reptile scales no_legs carnivore venomous dangerous eggs tail
turtle|🐢|Turtle|Tortuga|reptile scales four_legs shell water eggs slow
lizard|🦎|Lizard|Lagarto|reptile small scales four_legs eggs tail climbs
frog|🐸|Frog|Rana|amphibian small water four_legs hops eggs carnivore
bee|🐝|Bee|Abeja|insect small flies stripes groups venomous eggs
butterfly|🦋|Butterfly|Mariposa|insect small flies herbivore eggs
ant|🐜|Ant|Hormiga|insect small groups eggs
ladybug|🐞|Ladybug|Mariquita|insect small flies spots carnivore eggs
spider|🕷️|Spider|Araña|invertebrate small carnivore venomous eggs climbs
snail|🐌|Snail|Caracol|invertebrate small shell herbivore no_legs slow eggs
mosquito|🦟|Mosquito|Mosquito|insect small flies nocturnal eggs groups
salmon|🐟|Salmon|Salmón|fish water sea scales no_legs eggs eaten
`);

const OBJECT_Q = questions(`
electronic|Is it electronic?|¿Es electrónico?
power|Does it need electricity or batteries?|¿Necesita electricidad o pilas?
screen|Does it have a screen?|¿Tiene pantalla?
kitchen|Is it found in a kitchen?|¿Está en la cocina?
bathroom|Is it found in a bathroom?|¿Está en el baño?
bedroom|Is it found in a bedroom?|¿Está en el dormitorio?
office|Is it used in an office or school?|¿Se usa en una oficina o escuela?
outdoors|Is it mostly used outdoors?|¿Se usa sobre todo al aire libre?
furniture|Is it furniture?|¿Es un mueble?
wear|Do you wear it?|¿Se lleva puesto?
vehicle|Is it a vehicle?|¿Es un vehículo?
wheels|Does it have wheels?|¿Tiene ruedas?
big|Is it bigger than a person?|¿Es más grande que una persona?
small|Does it fit in a pocket?|¿Cabe en un bolsillo?
metal|Is it mostly made of metal?|¿Es principalmente de metal?
wood|Is it mostly made of wood?|¿Es principalmente de madera?
glass|Is it mostly made of glass?|¿Es principalmente de vidrio?
paper|Is it made of paper?|¿Es de papel?
fabric|Is it made of fabric?|¿Es de tela?
sharp|Is it sharp?|¿Es afilado?
round|Is it round?|¿Es redondo?
holds_liquid|Does it hold liquid?|¿Contiene líquido?
hot|Does it get hot?|¿Se calienta?
cold|Does it keep things cold?|¿Mantiene las cosas frías?
light|Does it give light?|¿Da luz?
sound|Does it make sound or music?|¿Hace sonido o música?
writing|Is it used for writing or drawing?|¿Sirve para escribir o dibujar?
sport|Is it used for sport or play?|¿Se usa para hacer deporte o jugar?
tool|Is it a tool?|¿Es una herramienta?
cleaning|Is it used for cleaning?|¿Se usa para limpiar?
eating|Do you use it to eat or drink?|¿Se usa para comer o beber?
time|Does it tell the time?|¿Da la hora?
soft|Is it soft?|¿Es blando?
opens|Does it open and close?|¿Se abre y se cierra?
communicate|Is it used to communicate?|¿Sirve para comunicarse?
mouth|Does it go in your mouth?|¿Se mete en la boca?
flies|Does it fly?|¿Vuela?
`);

const OBJECTS = entities(`
phone|📱|Mobile phone|Teléfono móvil|electronic power screen small communicate time sound
laptop|💻|Laptop|Portátil|electronic power screen office opens communicate
television|📺|Television|Televisión|electronic power screen sound
fridge|🧊|Fridge|Frigorífico|electronic power kitchen big cold opens metal
oven|🔥|Oven|Horno|electronic power kitchen hot opens metal
microwave|📦|Microwave|Microondas|electronic power kitchen hot opens time
toaster|🍞|Toaster|Tostadora|electronic power kitchen hot metal
kettle|🫖|Kettle|Hervidor|electronic power kitchen hot holds_liquid
lamp|💡|Lamp|Lámpara|electronic power light bedroom
clock|🕰️|Clock|Reloj de pared|power time round
watch|⌚|Wristwatch|Reloj de pulsera|wear small time round power
camera|📷|Camera|Cámara|electronic power screen small
headphones|🎧|Headphones|Auriculares|electronic power sound wear
guitar|🎸|Guitar|Guitarra|wood sound
piano|🎹|Piano|Piano|big wood sound furniture
drum|🥁|Drum|Tambor|sound round
book|📕|Book|Libro|paper opens office
pencil|✏️|Pencil|Lápiz|wood writing office small sharp
pen|🖊️|Pen|Bolígrafo|writing office small
scissors|✂️|Scissors|Tijeras|metal sharp tool office opens small
knife|🔪|Knife|Cuchillo|metal sharp kitchen eating tool
fork|🍴|Fork|Tenedor|metal kitchen eating small sharp mouth
spoon|🥄|Spoon|Cuchara|metal kitchen eating small holds_liquid mouth
cup|☕|Cup|Taza|kitchen holds_liquid eating round
glass|🥛|Drinking glass|Vaso|glass kitchen holds_liquid eating round
bottle|🍾|Bottle|Botella|glass holds_liquid opens
plate|🍽️|Plate|Plato|kitchen eating round
pan|🍳|Frying pan|Sartén|metal kitchen hot round
chair|🪑|Chair|Silla|furniture wood
table|🪵|Table|Mesa|furniture wood big
bed|🛏️|Bed|Cama|furniture big soft bedroom fabric
sofa|🛋️|Sofa|Sofá|furniture big soft fabric
pillow|🛌|Pillow|Almohada|soft bedroom fabric
mirror|🪞|Mirror|Espejo|glass bathroom
toothbrush|🪥|Toothbrush|Cepillo de dientes|bathroom cleaning small mouth
soap|🧼|Soap|Jabón|bathroom cleaning small
towel|🧻|Towel|Toalla|bathroom fabric soft cleaning
bathtub|🛁|Bathtub|Bañera|bathroom big holds_liquid
broom|🧹|Broom|Escoba|cleaning wood tool
vacuum|🌀|Vacuum cleaner|Aspiradora|electronic power cleaning wheels sound
umbrella|☂️|Umbrella|Paraguas|outdoors opens fabric
hat|🎩|Hat|Sombrero|wear fabric
shoe|👟|Shoe|Zapato|wear outdoors
glasses|👓|Glasses|Gafas|wear glass small
backpack|🎒|Backpack|Mochila|wear fabric opens office
ball|⚽|Ball|Pelota|sport round outdoors
bicycle|🚲|Bicycle|Bicicleta|vehicle wheels metal outdoors sport
car|🚗|Car|Coche|vehicle wheels big metal power outdoors opens
bus|🚌|Bus|Autobús|vehicle wheels big metal power outdoors
airplane|✈️|Airplane|Avión|vehicle big metal power outdoors wheels flies
boat|⛵|Boat|Barco|vehicle big outdoors wood
skateboard|🛹|Skateboard|Monopatín|vehicle wheels sport wood outdoors
key|🔑|Key|Llave|metal small tool
hammer|🔨|Hammer|Martillo|metal wood tool
ladder|🪜|Ladder|Escalera de mano|tool big wood
candle|🕯️|Candle|Vela|light hot
flashlight|🔦|Torch|Linterna|electronic power light small
kite|🪁|Kite|Cometa|outdoors sport fabric flies
balloon|🎈|Balloon|Globo|round sport soft flies
door|🚪|Door|Puerta|wood big opens
window|🪟|Window|Ventana|glass opens big
envelope|✉️|Envelope|Sobre|paper office communicate opens
map|🗺️|Map|Mapa|paper outdoors
coin|🪙|Coin|Moneda|metal round small
dice|🎲|Dice|Dado|sport small
teddy|🧸|Teddy bear|Osito de peluche|soft fabric bedroom sport
`);

const CHAR_Q = questions(`
human|Is the character a human?|¿Es un ser humano?
animal|Is the character an animal?|¿Es un animal?
male|Is the character male?|¿Es masculino?
myth|Does the character come from mythology?|¿Viene de la mitología?
greek|Is the character from Greek mythology?|¿Es de la mitología griega?
norse|Is the character from Norse mythology?|¿Es de la mitología nórdica?
egyptian|Is the character from Egyptian mythology?|¿Es de la mitología egipcia?
fairy_tale|Is the character from a fairy tale or folk tale?|¿Viene de un cuento popular o de hadas?
novel|Is the character from a novel?|¿Viene de una novela?
play|Is the character from a play?|¿Viene de una obra de teatro?
god|Is the character a god?|¿Es un dios?
magic|Does the character have magic or superpowers?|¿Tiene magia o superpoderes?
villain|Is the character a villain?|¿Es un villano?
hero|Is the character a hero?|¿Es un héroe?
royal|Is the character royalty?|¿Es de la realeza?
child|Is the character a child?|¿Es un niño o una niña?
monster|Is the character a monster?|¿Es un monstruo?
flies|Can the character fly?|¿Puede volar?
sea|Is the character linked to the sea?|¿Está ligado al mar?
sword|Does the character fight with a sword or weapon?|¿Lucha con espada u otra arma?
detective|Is the character a detective?|¿Es detective?
british|Does the character come from a British story?|¿Viene de una historia británica?
holiday|Is the character linked to a holiday?|¿Está ligado a una festividad?
wolf|Is a wolf part of the character’s story?|¿Aparece un lobo en su historia?
travels|Is the character famous for a long journey?|¿Es famoso por un largo viaje?
dies|Does the character die in the story?|¿Muere en la historia?
love|Is the character famous for a love story?|¿Es famoso por una historia de amor?
hat|Is the character known for a hat?|¿Se le conoce por un sombrero?
thief|Is the character a thief or outlaw?|¿Es un ladrón o un forajido?
undead|Is the character undead or not quite alive?|¿Es un no muerto o no del todo vivo?
cryptid|Has nobody proved the character exists?|¿Es una criatura cuya existencia no se ha probado?
hair|Is the character known for their hair?|¿Se le conoce por su pelo?
sleep|Does the character fall into an enchanted sleep?|¿Cae en un sueño encantado?
island|Is the character stranded on an island?|¿Queda atrapado en una isla?
snow|Does the character live among snow and ice?|¿Vive entre nieve y hielo?
`);

const CHARACTERS = entities(`
zeus|⚡|Zeus|Zeus|male myth greek god magic royal flies
poseidon|🔱|Poseidon|Poseidón|male myth greek god magic sea sword
hercules|💪|Hercules|Hércules|human male myth greek hero sword magic
medusa|🐍|Medusa|Medusa|myth greek monster villain magic dies
odysseus|⛵|Odysseus|Ulises|human male myth greek hero travels sea royal sword
achilles|🛡️|Achilles|Aquiles|human male myth greek hero sword dies
icarus|🪶|Icarus|Ícaro|human male myth greek flies dies
pandora|📦|Pandora|Pandora|human myth greek
thor|🔨|Thor|Thor|male myth norse god magic hero sword
odin|👁️|Odin|Odín|male myth norse god magic royal
loki|🎭|Loki|Loki|male myth norse god magic villain
anubis|🐺|Anubis|Anubis|male myth egyptian god magic
ra|☀️|Ra|Ra|male myth egyptian god magic royal flies
king_arthur|👑|King Arthur|El rey Arturo|human male royal hero sword british fairy_tale
merlin|🧙|Merlin|Merlín|human male magic british fairy_tale hat
robin_hood|🏹|Robin Hood|Robin Hood|human male hero thief british fairy_tale sword hat
dracula|🧛|Count Dracula|El conde Drácula|male novel villain magic flies undead monster royal british dies
frankenstein|🧟|Frankenstein’s creature|La criatura de Frankenstein|male novel monster undead british
sherlock|🔍|Sherlock Holmes|Sherlock Holmes|human male novel detective british hat
watson|🩺|Doctor Watson|El doctor Watson|human male novel detective british
alice|🐇|Alice (in Wonderland)|Alicia (en el País de las Maravillas)|human child novel british travels
cheshire_cat|😸|The Cheshire Cat|El Gato de Cheshire|animal novel magic british
mad_hatter|🎩|The Mad Hatter|El Sombrerero Loco|human male novel british hat
peter_pan|🧚|Peter Pan|Peter Pan|human male child play novel magic flies hero british hat
captain_hook|🪝|Captain Hook|El capitán Garfio|human male play novel villain sea sword british hat dies
pinocchio|🤥|Pinocchio|Pinocho|male child novel magic
cinderella|👠|Cinderella|Cenicienta|human fairy_tale royal love
snow_white|🍎|Snow White|Blancanieves|human fairy_tale royal love sleep
red_riding_hood|🧺|Little Red Riding Hood|Caperucita Roja|human child fairy_tale wolf hat
big_bad_wolf|🐺|The Big Bad Wolf|El lobo feroz|animal male fairy_tale villain wolf dies
rapunzel|💇|Rapunzel|Rapunzel|human fairy_tale love royal hair
hansel|🍬|Hansel|Hansel|human male child fairy_tale
aladdin|🪔|Aladdin|Aladino|human male fairy_tale magic royal love thief
ali_baba|💰|Ali Baba|Alí Babá|human male fairy_tale thief
sinbad|🧭|Sinbad the Sailor|Simbad el marino|human male fairy_tale sea travels hero
don_quixote|🐴|Don Quixote|Don Quijote|human male novel travels sword hero dies
romeo|🌹|Romeo|Romeo|human male play love dies sword british
juliet|💌|Juliet|Julieta|human play love dies british
hamlet|💀|Hamlet|Hamlet|human male play royal dies sword british
macbeth|🗡️|Macbeth|Macbeth|human male play royal villain dies sword british
santa|🎅|Santa Claus|Papá Noel|human male holiday magic flies hat snow
tooth_fairy|🦷|The Tooth Fairy|El Ratoncito Pérez / Hada de los dientes|magic flies holiday
scrooge|💷|Ebenezer Scrooge|Ebenezer Scrooge|human male novel holiday british
oliver_twist|🥣|Oliver Twist|Oliver Twist|human male child novel british
moby_dick|🐋|Moby Dick|Moby Dick|animal male novel sea monster
captain_ahab|⚓|Captain Ahab|El capitán Ahab|human male novel sea dies travels
gulliver|🏝️|Gulliver|Gulliver|human male novel travels sea british
robinson_crusoe|🏚️|Robinson Crusoe|Robinson Crusoe|human male novel sea travels british island
jekyll|🧪|Dr Jekyll and Mr Hyde|El doctor Jekyll y míster Hyde|human male novel villain monster british dies
phileas_fogg|🎈|Phileas Fogg|Phileas Fogg|human male novel travels british hat
captain_nemo|🐙|Captain Nemo|El capitán Nemo|human male novel sea travels
mowgli|🐾|Mowgli|Mowgli|human male child novel wolf british
tarzan|🌿|Tarzan|Tarzán|human male novel hero
zorro|🦊|Zorro|El Zorro|human male novel hero sword hat thief
pied_piper|🎶|The Pied Piper|El flautista de Hamelín|human male fairy_tale magic hat
rumpelstiltskin|🧵|Rumpelstiltskin|Rumpelstiltskin|male fairy_tale magic villain
puss_in_boots|🐈|Puss in Boots|El Gato con Botas|animal male fairy_tale hero hat sword
jack_beanstalk|🌱|Jack (and the Beanstalk)|Jack (y las habichuelas mágicas)|human male child fairy_tale thief hero
goldilocks|🥣|Goldilocks|Ricitos de Oro|human child fairy_tale hair
bigfoot|👣|Bigfoot|Pie Grande|monster cryptid animal
nessie|🦕|The Loch Ness Monster|El monstruo del lago Ness|monster cryptid animal sea british
yeti|🏔️|The Yeti|El Yeti|monster cryptid animal snow
little_mermaid|🧜‍♀️|The Little Mermaid|La Sirenita|fairy_tale sea love magic royal
`);

export const DOMAINS: Record<Domain['id'], Domain> = {
  animals: { id: 'animals', questions: ANIMAL_Q, entities: ANIMALS },
  objects: { id: 'objects', questions: OBJECT_Q, entities: OBJECTS },
  characters: { id: 'characters', questions: CHAR_Q, entities: CHARACTERS },
};
export const DOMAIN_IDS = Object.keys(DOMAINS) as Domain['id'][];
