/**
 * Hangman word lists, written for this game: six categories in English and Spanish (Spanish
 * without accents; ñ is its own letter).
 */
import type { Lang } from '../word-guess/words';

export type { Lang };

export const CATEGORIES = ['animals', 'food', 'nature', 'home', 'jobs', 'sports'] as const;
export type Category = (typeof CATEGORIES)[number];

const split = (s: string) => s.split(' ');

export const WORDS: Record<Lang, Record<Category, readonly string[]>> = {
  en: {
    animals: split(
      'alligator antelope badger beaver buffalo butterfly camel cheetah chimpanzee crocodile ' +
        'dolphin donkey eagle elephant falcon flamingo giraffe goldfish gorilla hamster ' +
        'hedgehog hippopotamus jaguar jellyfish kangaroo koala leopard lizard lobster meerkat ' +
        'mongoose octopus ostrich otter panther parrot peacock pelican penguin porcupine rabbit ' +
        'raccoon reindeer rhinoceros salmon scorpion seahorse shark sparrow squirrel starfish ' +
        'tiger tortoise turtle vulture walrus weasel whale wolf zebra',
    ),
    food: split(
      'almond apricot avocado banana biscuit blueberry broccoli butter cabbage carrot ' +
        'cauliflower cheese cherry chocolate cinnamon coconut cookie cucumber dumpling eggplant ' +
        'garlic ginger grapefruit hazelnut honey lasagna lemonade lettuce mango marmalade ' +
        'meatball mushroom noodle oatmeal omelette onion pancake papaya peanut pepper pickle ' +
        'pineapple popcorn potato pretzel pumpkin raspberry risotto sandwich sausage spaghetti ' +
        'spinach strawberry tomato tortilla vanilla waffle walnut watermelon yogurt zucchini',
    ),
    nature: split(
      'avalanche blizzard canyon cliff cloud coral desert earthquake forest glacier harbor ' +
        'horizon hurricane island jungle lagoon lightning meadow meteor mountain ocean pebble ' +
        'prairie rainbow river sandstorm savanna snowflake stream sunrise sunset swamp thunder ' +
        'tornado tundra valley volcano waterfall wildfire',
    ),
    home: split(
      'armchair backpack balcony basket bathtub blanket bookcase bucket candle carpet ceiling ' +
        'chimney cupboard curtain cushion doorbell drawer envelope faucet fireplace garage ' +
        'hammer kettle ladder lantern mattress microwave mirror notebook padlock pillow ' +
        'scissors shelf sofa spoon staircase suitcase table teapot toaster toothbrush umbrella ' +
        'wardrobe window',
    ),
    jobs: split(
      'architect astronaut baker barber carpenter cashier chemist dentist designer detective ' +
        'doctor electrician engineer farmer firefighter florist gardener historian journalist ' +
        'judge lawyer librarian mechanic musician nurse painter pharmacist photographer pilot ' +
        'plumber poet professor sailor scientist sculptor surgeon tailor teacher translator ' +
        'veterinarian waiter writer',
    ),
    sports: split(
      'archery athletics badminton baseball basketball bowling boxing canoeing climbing ' +
        'cricket cycling diving fencing football golf gymnastics handball hockey javelin judo ' +
        'karate marathon rowing rugby sailing skating skiing snowboarding surfing swimming ' +
        'tennis triathlon volleyball wrestling',
    ),
  },
  es: {
    animals: split(
      'abeja aguila ardilla ballena buho burro caballo camello canguro cebra cerdo ciervo ' +
        'cocodrilo conejo delfin elefante foca gallina gato gorila hamster hipopotamo hormiga ' +
        'jabali jirafa koala langosta leon leopardo lobo loro mariposa mapache medusa mono ' +
        'murcielago oso oveja pajaro paloma pantera pato pelicano perro pinguino pulpo rana ' +
        'raton rinoceronte salmon serpiente tiburon tigre topo tortuga vaca zorro',
    ),
    food: split(
      'aceituna aguacate ajo albondiga almendra arroz avellana berenjena bizcocho brocoli ' +
        'calabaza canela caramelo cebolla cereza champiñon chocolate ciruela coliflor croqueta ' +
        'empanada ensalada espinaca fresa galleta garbanzo guisante helado lechuga lenteja ' +
        'limon macarron mandarina mango manzana mantequilla melocoton melon mermelada naranja ' +
        'nuez paella palomitas pepino pimiento piña platano queso sandia tomate tortilla uva ' +
        'yogur zanahoria',
    ),
    nature: split(
      'arcoiris arena arroyo bahia bosque cascada cielo colina cordillera costa desierto ' +
        'escarcha estrella glaciar granizo huracan isla lago laguna llanura luna meseta montaña ' +
        'neblina nube oceano pradera relampago rio roca selva sendero tormenta tornado trueno ' +
        'valle viento volcan',
    ),
    home: split(
      'almohada armario azotea balcon bañera bombilla buzon cajon cama chimenea cocina cojin ' +
        'cortina cuchara cuchillo escalera escoba espejo estante estufa grifo lampara lavadora ' +
        'maleta manta mesa microondas mochila nevera paraguas pasillo persiana plancha puerta ' +
        'sabana silla sillon sofa tejado tenedor tetera tijeras toalla ventana',
    ),
    jobs: split(
      'abogado actor agricultor albañil arquitecto astronauta bombero camarero carpintero ' +
        'cartero cientifico cirujano cocinero conductor dentista diseñador electricista ' +
        'enfermero escritor escultor farmaceutico fontanero fotografo granjero ingeniero ' +
        'jardinero juez maestro marinero mecanico medico musico panadero periodista piloto ' +
        'pintor policia profesor sastre traductor veterinario',
    ),
    sports: split(
      'ajedrez alpinismo atletismo baloncesto balonmano beisbol boxeo buceo ciclismo escalada ' +
        'esgrima esqui futbol gimnasia golf hockey judo karate maraton natacion patinaje ' +
        'piraguismo remo rugby surf tenis triatlon voleibol',
    ),
  },
};
