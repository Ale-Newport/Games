/**
 * The decks. Countries come from the shared world data (2023 population estimates, areas). The
 * other decks are compiled here from common reference figures: summit heights in metres, river
 * lengths in kilometres (sources differ, so they are approximate) and typical adult body masses in
 * kilograms (approximate averages).
 */
import { COUNTRIES } from '../shared/world/world';

export type Category = 'population' | 'area' | 'mountains' | 'rivers' | 'animals';
export const CATEGORIES: Category[] = ['population', 'area', 'mountains', 'rivers', 'animals'];

export interface Item {
  id: string;
  cat: Category;
  en: string;
  es: string;
  value: number;
  /** A flag (ISO 3166 code) or an emoji. */
  flag?: string;
  emoji?: string;
}

const MOUNTAINS = `
Mount Everest|Monte Everest|8849
K2|K2|8611
Kangchenjunga|Kanchenjunga|8586
Lhotse|Lhotse|8516
Makalu|Makalu|8485
Cho Oyu|Cho Oyu|8188
Dhaulagiri|Dhaulagiri|8167
Manaslu|Manaslu|8163
Nanga Parbat|Nanga Parbat|8126
Annapurna|Annapurna|8091
Aconcagua|Aconcagua|6961
Ojos del Salado|Ojos del Salado|6893
Huascarán|Huascarán|6768
Illimani|Illimani|6438
Chimborazo|Chimborazo|6263
Denali|Denali|6190
Mount Logan|Monte Logan|5959
Cotopaxi|Cotopaxi|5897
Kilimanjaro|Kilimanjaro|5895
Mount Elbrus|Monte Elbrus|5642
Pico de Orizaba|Pico de Orizaba|5636
Mount Damavand|Monte Damavand|5610
Popocatépetl|Popocatépetl|5426
Mount Kenya|Monte Kenia|5199
Mount Ararat|Monte Ararat|5137
Mount Vinson|Monte Vinson|4892
Mont Blanc|Mont Blanc|4806
Matterhorn|Cervino|4478
Mount Whitney|Monte Whitney|4421
Mount Rainier|Monte Rainier|4392
Mount Elgon|Monte Elgon|4321
Mauna Kea|Mauna Kea|4207
Toubkal|Toubkal|4167
Mount Kinabalu|Monte Kinabalu|4095
Grossglockner|Grossglockner|3798
Mount Fuji|Monte Fuji|3776
Aoraki / Mount Cook|Aoraki / Monte Cook|3724
Teide|Teide|3715
Mulhacén|Mulhacén|3479
Aneto|Aneto|3404
Mount Etna|Etna|3357
Pico Duarte|Pico Duarte|3098
Zugspitze|Zugspitze|2962
Mount Olympus|Monte Olimpo|2918
Mount St. Helens|Monte Santa Helena|2549
Mount Sinai|Monte Sinaí|2285
Mount Kosciuszko|Monte Kosciuszko|2228
Ben Nevis|Ben Nevis|1345
Mount Vesuvius|Vesubio|1281
Table Mountain|Montaña de la Mesa|1085
`;

const RIVERS = `
Nile|Nilo|6650
Amazon|Amazonas|6400
Yangtze|Yangtsé|6300
Mississippi–Missouri|Misisipi-Misuri|6275
Yenisei|Yeniséi|5539
Yellow River|Río Amarillo|5464
Ob–Irtysh|Obi-Irtish|5410
Paraná|Paraná|4880
Congo|Congo|4700
Amur|Amur|4444
Lena|Lena|4400
Mekong|Mekong|4350
Mackenzie|Mackenzie|4241
Niger|Níger|4200
Murray–Darling|Murray-Darling|3672
Volga|Volga|3530
Yukon|Yukón|3190
Indus|Indo|3180
St. Lawrence|San Lorenzo|3058
Rio Grande|Río Bravo|3051
Brahmaputra|Brahmaputra|2900
Danube|Danubio|2850
Euphrates|Éufrates|2800
Zambezi|Zambeze|2574
Ganges|Ganges|2525
Colorado|Colorado|2330
Dnieper|Dniéper|2201
Orinoco|Orinoco|2140
Don|Don|1870
Tigris|Tigris|1850
Rhine|Rin|1230
Elbe|Elba|1094
Vistula|Vístula|1047
Tagus|Tajo|1007
Loire|Loira|1006
Ebro|Ebro|930
Douro|Duero|897
Seine|Sena|777
Po|Po|652
Shannon|Shannon|360
Thames|Támesis|346
Jordan|Jordán|251
`;

const ANIMALS = `
Blue whale|Ballena azul|140000|🐋
Orca|Orca|5000|🐬
African elephant|Elefante africano|6000|🐘
White rhinoceros|Rinoceronte blanco|2300|🦏
Hippopotamus|Hipopótamo|1500|🦛
Walrus|Morsa|1200|🦭
Giraffe|Jirafa|1200|🦒
Great white shark|Tiburón blanco|1100|🦈
American bison|Bisonte americano|900|🦬
Cow|Vaca|700|🐄
Horse|Caballo|500|🐎
Moose|Alce|500|🫎
Dromedary camel|Dromedario|500|🐪
Saltwater crocodile|Cocodrilo marino|500|🐊
Leatherback sea turtle|Tortuga laúd|500|🐢
Polar bear|Oso polar|450|🐻‍❄️
Zebra|Cebra|350|🦓
Grizzly bear|Oso pardo|300|🐻
Bottlenose dolphin|Delfín mular|300|🐬
Tiger|Tigre|220|🐅
Lion|León|190|🦁
Gorilla|Gorila|160|🦍
Ostrich|Avestruz|110|🦤
Domestic pig|Cerdo|100|🐖
Giant panda|Panda gigante|100|🐼
Red kangaroo|Canguro rojo|85|🦘
Komodo dragon|Dragón de Komodo|80|🦎
Human|Ser humano|70|🧑
Sheep|Oveja|70|🐑
Green anaconda|Anaconda verde|70|🐍
Chimpanzee|Chimpancé|50|🐒
Cheetah|Guepardo|50|🐆
Goat|Cabra|50|🐐
Gray wolf|Lobo gris|40|🐺
Emperor penguin|Pingüino emperador|30|🐧
Koala|Koala|9|🐨
Bald eagle|Águila calva|5|🦅
Sloth|Perezoso|5|🦥
House cat|Gato doméstico|4.5|🐈
Common octopus|Pulpo común|3|🐙
Chicken|Gallina|2.5|🐔
Rabbit|Conejo|2|🐇
Hamster|Hámster|0.12|🐹
House mouse|Ratón doméstico|0.02|🐁
Hummingbird|Colibrí|0.004|🐦
`;

function rows(text: string, cat: Category, emoji?: string): Item[] {
  return text
    .trim()
    .split('\n')
    .map((line, i) => {
      const [en, es, value, e] = line.split('|');
      return { id: `${cat}-${i}`, cat, en: en!, es: es!, value: Number(value), emoji: e ?? emoji };
    });
}

/** Countries with at least half a million people. */
const BIG = COUNTRIES.filter((c) => c.population >= 500);

export const ITEMS: Record<Category, Item[]> = {
  population: BIG.map((c) => ({
    id: `population-${c.iso2}`,
    cat: 'population',
    en: c.name.en,
    es: c.name.es,
    value: c.population * 1000,
    flag: c.iso2,
  })),
  area: BIG.map((c) => ({
    id: `area-${c.iso2}`,
    cat: 'area',
    en: c.name.en,
    es: c.name.es,
    value: c.area,
    flag: c.iso2,
  })),
  mountains: rows(MOUNTAINS, 'mountains', '🏔️'),
  rivers: rows(RIVERS, 'rivers', '🏞️'),
  animals: rows(ANIMALS, 'animals'),
};

export const BY_ID = new Map(
  Object.values(ITEMS).flatMap((list) => list.map((i) => [i.id, i] as const)),
);
