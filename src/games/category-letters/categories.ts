/**
 * Category bank for #203 Category Letters. Every survey answer sheet (#201/#202) doubles as a
 * category here (its answers in both languages become known answers), plus the classic categories
 * below, whose answers are listed separately per language because they are not translations of
 * each other (names, cities, words). Known answers validate automatically and feed the bots.
 */
import type { LocalizedText } from '../../core/i18n';

export interface ExtraCategory {
  id: string;
  name: LocalizedText;
  en: string;
  es: string;
}

export const EXTRA_CATEGORIES: readonly ExtraCategory[] = [
  {
    id: 'boy-name',
    name: { en: "A boy's name", es: 'Un nombre de chico' },
    en: 'aaron;adam;adrian;alan;albert;alex;alexander;andrew;anthony;arthur;ben;benjamin;bill;bob;brandon;brian;bruce;carl;carlos;charles;chris;christopher;colin;daniel;david;dennis;derek;dylan;edward;elliot;eric;ethan;felix;frank;fred;gabriel;gary;george;gordon;greg;harry;henry;hugo;ian;isaac;jack;jacob;jake;james;jason;jeff;jeremy;jim;joe;john;jonathan;jordan;joseph;josh;justin;keith;kevin;kyle;larry;leo;leon;liam;logan;louis;lucas;luke;mark;martin;matthew;max;michael;mike;nathan;neil;nick;noah;oliver;oscar;owen;patrick;paul;peter;philip;quentin;quincy;ralph;ray;richard;robert;roger;ronald;ryan;sam;samuel;scott;sean;simon;stephen;steve;ted;thomas;tim;tom;tony;tyler;victor;vincent;walter;wayne;william;xavier;zach;zachary',
    es: 'adrián;agustín;alberto;alejandro;alfonso;alonso;álvaro;andrés;ángel;antonio;arturo;bautista;benjamín;bernardo;bruno;carlos;césar;cristian;daniel;david;diego;eduardo;emilio;enrique;ernesto;esteban;fabián;federico;felipe;fernando;francisco;gabriel;gerardo;gonzalo;guillermo;gustavo;héctor;hernán;hugo;ignacio;iker;iván;jaime;javier;jesús;joaquín;jorge;josé;juan;julián;julio;leonardo;lorenzo;lucas;luis;manuel;marcos;mario;martín;mateo;matías;miguel;nicolás;óscar;pablo;pedro;rafael;ramón;raúl;ricardo;roberto;rodrigo;rubén;salvador;samuel;santiago;sergio;simón;teodoro;tomás;ulises;valentín;vicente;víctor;xavier;yago;zacarías',
  },
  {
    id: 'girl-name',
    name: { en: "A girl's name", es: 'Un nombre de chica' },
    en: 'abigail;ada;alice;amanda;amelia;amy;angela;anna;ava;barbara;beth;bella;carol;caroline;charlotte;chloe;claire;daisy;diana;donna;dorothy;elena;eleanor;elizabeth;ella;ellie;emily;emma;eva;fiona;florence;freya;gemma;grace;hannah;harriet;helen;holly;ida;irene;isabel;isabella;ivy;jane;jasmine;jennifer;jessica;jill;joan;julia;karen;kate;katherine;kelly;laura;lily;linda;lisa;lucy;mary;maria;megan;mia;molly;nancy;natalie;nina;nora;olivia;paula;penny;phoebe;quinn;rachel;rebecca;rose;ruby;ruth;sally;sarah;sophia;sophie;stella;susan;tara;tessa;una;ursula;valerie;vera;victoria;violet;wendy;willow;yasmin;yvonne;zoe',
    es: 'abril;adriana;alba;alejandra;alicia;ana;andrea;ángela;antonia;aurora;beatriz;belén;blanca;camila;carla;carmen;carolina;catalina;cecilia;claudia;cristina;daniela;diana;dolores;elena;elisa;elsa;emma;esther;eva;fátima;florencia;gabriela;gloria;guadalupe;helena;inés;irene;isabel;jimena;josefina;juana;julia;laura;leire;lola;lucía;luisa;luna;manuela;margarita;maría;marina;marta;mercedes;mónica;natalia;nerea;noelia;nuria;olga;paloma;patricia;paula;pilar;raquel;rocío;rosa;sandra;sara;silvia;sofía;susana;teresa;úrsula;valentina;valeria;verónica;victoria;violeta;ximena;yolanda;zoe',
  },
  {
    id: 'city',
    name: { en: 'A city', es: 'Una ciudad' },
    en: 'amsterdam;athens;atlanta;auckland;austin;baghdad;baltimore;bangkok;barcelona;beijing;berlin;bogota;boston;brisbane;brussels;budapest;buenos aires;cairo;calgary;cape town;caracas;chicago;copenhagen;dallas;delhi;denver;detroit;dubai;dublin;edinburgh;florence;frankfurt;geneva;glasgow;hamburg;havana;helsinki;hong kong;honolulu;houston;istanbul;jakarta;jerusalem;johannesburg;kabul;karachi;kyoto;kyiv;lagos;las vegas;leeds;lima;lisbon;liverpool;london;los angeles;lyon;madrid;manchester;manila;marseille;melbourne;miami;milan;montreal;moscow;mumbai;munich;nairobi;naples;new york;nice;oslo;osaka;ottawa;oxford;paris;perth;philadelphia;phoenix;prague;quebec;quito;rio de janeiro;rome;san francisco;santiago;seattle;seoul;seville;shanghai;singapore;stockholm;sydney;taipei;tokyo;toronto;utrecht;valencia;vancouver;venice;vienna;warsaw;washington;wellington;xian;yokohama;york;zagreb;zurich',
    es: 'alicante;almería;asunción;atenas;badajoz;barcelona;berlín;bilbao;bogotá;buenos aires;burgos;cádiz;caracas;cartagena;córdoba;cuenca;cusco;dublín;elche;estambul;florencia;gijón;granada;guadalajara;guayaquil;huelva;ibiza;jaén;jerez;la habana;la paz;león;lima;lisboa;londres;lugo;madrid;málaga;managua;medellín;mendoza;mérida;méxico;miami;milán;montevideo;moscú;múnich;murcia;nápoles;niza;nueva york;oaxaca;oporto;oslo;oviedo;palma;pamplona;panamá;parís;puebla;quito;roma;rosario;salamanca;san juan;san sebastián;santander;santiago;segovia;sevilla;sídney;tarragona;tegucigalpa;tijuana;tokio;toledo;toronto;úbeda;utrera;valencia;valladolid;valparaíso;venecia;viena;vigo;vitoria;washington;xalapa;yucatán;zamora;zaragoza;zúrich',
  },
  {
    id: 'round-things',
    name: { en: 'Something round', es: 'Algo redondo' },
    en: 'apple;ball;balloon;bagel;bubble;button;cake;circle;clock;coin;cookie;cup;disc;donut;dot;drum;egg;eye;ferris wheel;frisbee;globe;grape;hoop;lid;lollipop;marble;melon;moon;nest;olive;orange;pancake;pea;pearl;pizza;planet;plate;pupil;ring;roundabout;sphere;steering wheel;sun;target;tire;tomato;wheel;wreath;yoyo',
    es: 'aceituna;aguja de reloj;anillo;aro;arandela;balón;botón;burbuja;canica;círculo;cd;donut;esfera;estrella de mar;galleta;globo;guisante;huevo;lenteja;luna;manzana;melón;moneda;naranja;neumático;ojo;olivo;pelota;perla;pizza;planeta;plato;pompa;pupila;queso;reloj;rosquilla;rueda;sandía;sol;tambor;tapa;tarta;tomate;uva;volante;yoyó',
  },
  {
    id: 'cold-things',
    name: { en: 'Something cold', es: 'Algo frío' },
    en: 'antarctica;arctic;avalanche;blizzard;cooler;freezer;fridge;frost;glacier;hail;ice;ice cream;ice cube;iceberg;icicle;igloo;lemonade;milkshake;north pole;penguin;polar bear;popsicle;refrigerator;sleet;slush;smoothie;snow;snowball;snowflake;snowman;sorbet;south pole;tundra;winter;yeti',
    es: 'aguanieve;antártida;ártico;avalancha;batido;carámbano;congelador;cubito;escarcha;esquimal;frigorífico;glaciar;granizado;granizo;helado;hielo;iceberg;iglú;invierno;muñeco de nieve;nevera;nieve;oso polar;pingüino;polo;polo norte;polo sur;sorbete;témpano;tundra;ventisca;yeti',
  },
  {
    id: 'school-things',
    name: { en: 'Something in a school', es: 'Algo de un colegio' },
    en: 'backpack;bell;binder;blackboard;book;bus;calculator;chalk;classroom;compass;computer;crayon;desk;dictionary;eraser;exam;folder;globe;glue;gym;homework;janitor;keyboard;library;locker;lunchbox;map;marker;notebook;paper;pen;pencil;playground;principal;projector;protractor;ruler;scissors;sharpener;student;teacher;textbook;timetable;uniform;whiteboard',
    es: 'agenda;alumno;aula;bata;biblioteca;bolígrafo;borrador;calculadora;carpeta;compás;cuaderno;diccionario;director;escuadra;estuche;examen;folio;gimnasio;globo terráqueo;goma;lápiz;libro;mapa;mesa;mochila;ordenador;patio;pegamento;pizarra;profesor;proyector;recreo;regla;rotulador;sacapuntas;silla;taquilla;tiza;tijeras;transportador;uniforme',
  },
  {
    id: 'flying-things',
    name: { en: 'Something that flies', es: 'Algo que vuela' },
    en: 'airplane;airship;arrow;balloon;bat;bee;bird;blimp;butterfly;dragon;dragonfly;drone;eagle;fairy;fly;frisbee;glider;helicopter;hot air balloon;hummingbird;jet;kite;ladybug;mosquito;moth;owl;parachute;paper plane;parrot;pigeon;plane;rocket;satellite;seagull;shuttlecock;spaceship;superhero;swallow;ufo;wasp',
    es: 'abeja;águila;avión;avioneta;avispa;bumerán;búho;cohete;cometa;cuervo;dirigible;dragón;dron;flecha;gaviota;globo;golondrina;hada;halcón;helicóptero;libélula;loro;mariposa;mariquita;mosca;mosquito;murciélago;nave espacial;ovni;paloma;paracaídas;parapente;pájaro;planeador;polilla;satélite;superhéroe;volante de bádminton;zepelín',
  },
  {
    id: 'hobby',
    name: { en: 'A hobby', es: 'Una afición' },
    en: 'archery;baking;birdwatching;blogging;bowling;camping;chess;climbing;collecting;cooking;crochet;cycling;dancing;darts;drawing;embroidery;fishing;gaming;gardening;golf;hiking;juggling;karaoke;kayaking;knitting;magic;meditation;modelling;origami;painting;photography;piano;pottery;puzzles;quilting;reading;running;sailing;sewing;singing;skateboarding;skiing;stamp collecting;surfing;swimming;tennis;traveling;woodworking;writing;yoga',
    es: 'ajedrez;bailar;baloncesto;bordar;bucear;caminar;cantar;cerámica;ciclismo;cocinar;coleccionar;correr;costura;crucigramas;dibujar;escalada;escribir;esquiar;fotografía;ganchillo;golf;guitarra;jardinería;leer;magia;malabares;manualidades;meditar;modelismo;montañismo;nadar;origami;patinar;pescar;piano;pintar;puzles;repostería;senderismo;surf;tejer;tenis;teatro;videojuegos;viajar;yoga',
  },
  {
    id: 'hot-things',
    name: { en: 'Something hot', es: 'Algo caliente' },
    en: 'bonfire;candle;chili;coal;coffee;desert;dragon;ember;fire;fireplace;furnace;grill;heater;hot chocolate;iron;kettle;lava;lightbulb;magma;microwave;oven;pepper;radiator;sauna;soup;stove;summer;sun;tea;toaster;volcano',
    es: 'brasa;café;caldo;calefacción;chile;chimenea;desierto;estufa;fuego;guindilla;hervidor;hoguera;horno;infusión;lava;llama;magma;microondas;parrilla;plancha;radiador;sartén;sauna;sol;sopa;té;tostadora;vela;verano;volcán',
  },
  {
    id: 'tool',
    name: { en: 'A tool', es: 'Una herramienta' },
    en: 'anvil;axe;chisel;clamp;crowbar;drill;file;flashlight;glue gun;hacksaw;hammer;hoe;jack;jigsaw;ladder;level;mallet;nail gun;pickaxe;pliers;plunger;rake;sander;saw;scissors;screwdriver;shovel;sledgehammer;spade;spanner;stapler;tape measure;trowel;vice;wheelbarrow;wrench',
    es: 'alicates;azada;berbiquí;broca;carretilla;cepillo;cincel;cinta métrica;cizalla;destornillador;escalera;escoplo;espátula;formón;gato;hacha;lija;lima;linterna;llave inglesa;maza;martillo;mazo;nivel;pala;palanca;pico;pistola de silicona;rastrillo;serrucho;sierra;taladro;tenazas;tijeras;yunque',
  },
  {
    id: 'toy',
    name: { en: 'A toy or game', es: 'Un juguete o juego' },
    en: 'action figure;ball;balloon;blocks;board game;bubbles;cards;chess;dice;doll;dollhouse;dominoes;frisbee;jigsaw;jump rope;kite;lego;marbles;puppet;puzzle;robot;rocking horse;scooter;skateboard;slinky;spinning top;teddy bear;toy car;train set;trampoline;tricycle;water gun;yoyo',
    es: 'aro;balón;bloques;burbujas;canicas;cartas;cometa;comba;construcciones;cuerda;dados;dominó;muñeca;muñeco;oso de peluche;patinete;patines;peonza;pelota;peluche;pistola de agua;puzle;rompecabezas;robot;tablero;tren;triciclo;trompo;yoyó',
  },
  {
    id: 'verb',
    name: { en: 'An action word (verb)', es: 'Un verbo' },
    en: 'act;ask;bake;bounce;build;buy;carry;catch;climb;cook;crawl;cry;dance;dig;draw;dream;drink;drive;eat;fall;fly;give;grab;grow;hide;hop;hug;jog;juggle;jump;kick;kiss;knit;laugh;learn;lift;listen;march;nap;open;paint;play;pull;push;read;run;sail;scream;shout;sing;sit;skate;ski;sleep;smile;speak;swim;talk;think;throw;type;vote;walk;wash;wave;whisper;write;yawn;yell;zoom',
    es: 'abrir;andar;aprender;bailar;bajar;beber;besar;borrar;bucear;buscar;caminar;cantar;cerrar;cocinar;comer;comprar;conducir;correr;coser;crecer;dar;decir;dibujar;dormir;empujar;escribir;escuchar;esquiar;estudiar;ganar;gritar;hablar;jugar;lanzar;lavar;leer;llorar;llamar;mirar;nadar;oír;pagar;patinar;pensar;perder;pintar;querer;reír;saltar;soñar;subir;tirar;tocar;trabajar;usar;vender;ver;viajar;volar;votar;yacer;zarpar',
  },
  {
    id: 'adjective',
    name: { en: 'A word to describe a person', es: 'Un adjetivo para una persona' },
    en: 'active;angry;bold;brave;bright;busy;calm;careful;charming;cheerful;clever;clumsy;curious;eager;elegant;energetic;fair;friendly;funny;generous;gentle;grumpy;happy;honest;humble;jolly;kind;lazy;loud;loyal;lucky;mean;modest;moody;naughty;nervous;nice;patient;polite;proud;quiet;quick;rude;sad;shy;silly;smart;strong;sweet;tall;tidy;tough;upbeat;vain;wise;witty;young;zany;zealous',
    es: 'activo;agradable;alegre;alto;amable;atento;atrevido;bajo;bondadoso;bromista;callado;cariñoso;celoso;cobarde;culto;curioso;despistado;divertido;educado;egoísta;elegante;enérgico;feliz;fiel;fuerte;generoso;gracioso;gruñón;honesto;humilde;ingenioso;inteligente;joven;justo;leal;listo;maleducado;miedoso;modesto;nervioso;noble;optimista;orgulloso;paciente;perezoso;rápido;risueño;sabio;serio;simpático;sincero;tímido;tranquilo;travieso;triste;útil;valiente;vago;vanidoso;zalamero',
  },
  {
    id: 'fridge',
    name: { en: 'Something in a fridge', es: 'Algo de la nevera' },
    en: 'apple;bacon;beer;butter;carrot;celery;cheese;chicken;cream;cucumber;eggs;fish;grapes;ham;hummus;jam;jelly;juice;ketchup;leftovers;lemon;lettuce;mayonnaise;milk;mustard;olives;orange juice;pickles;pudding;salad;salami;sausage;soda;sour cream;spinach;steak;tofu;tomato;water;wine;yogurt',
    es: 'agua;aceitunas;bacon;batido;cerveza;chorizo;embutido;ensalada;filete;flan;fresas;huevos;jamón;kétchup;leche;lechuga;limón;mantequilla;margarina;mayonesa;mermelada;mostaza;nata;natillas;pepinillos;pescado;pimiento;pollo;queso;refresco;salchichas;salsa;sobras;tofu;tomate;uvas;vino;yogur;zanahoria;zumo',
  },
  {
    id: 'clothing',
    name: { en: 'Something you wear', es: 'Algo que te pones' },
    en: 'apron;belt;bikini;blazer;blouse;boots;bow tie;bra;cap;cape;cardigan;coat;costume;dress;earrings;gloves;gown;hat;helmet;hoodie;jacket;jeans;jumper;kilt;leggings;mittens;necklace;overalls;pajamas;poncho;raincoat;ring;robe;sandals;scarf;shirt;shoes;shorts;skirt;slippers;socks;suit;sweater;swimsuit;tie;tights;trousers;tshirt;tuxedo;uniform;vest;watch;wig',
    es: 'abrigo;anillo;bañador;bata;bermudas;bikini;blusa;botas;bufanda;calcetines;camisa;camiseta;capa;cazadora;chaleco;chaqueta;chándal;cinturón;collar;corbata;falda;gafas;gorra;gorro;guantes;impermeable;jersey;kimono;leggins;mallas;medias;mochila;pajarita;pantalón;pantalones;pendientes;peluca;pijama;poncho;pulsera;reloj;sandalias;sombrero;sudadera;traje;uniforme;vaqueros;vestido;zapatillas;zapatos',
  },
  {
    id: 'country',
    name: { en: 'A country', es: 'Un país' },
    en: 'afghanistan;albania;algeria;argentina;australia;austria;bangladesh;belgium;bolivia;brazil;bulgaria;cambodia;canada;chile;china;colombia;croatia;cuba;denmark;ecuador;egypt;england;estonia;ethiopia;fiji;finland;france;germany;ghana;greece;guatemala;haiti;honduras;hungary;iceland;india;indonesia;iran;iraq;ireland;israel;italy;jamaica;japan;jordan;kenya;korea;kuwait;laos;latvia;lebanon;libya;malaysia;mali;malta;mexico;monaco;mongolia;morocco;nepal;netherlands;new zealand;nicaragua;nigeria;norway;oman;pakistan;panama;paraguay;peru;philippines;poland;portugal;qatar;romania;russia;rwanda;saudi arabia;scotland;senegal;serbia;singapore;spain;sweden;switzerland;syria;thailand;tunisia;turkey;uganda;ukraine;uruguay;venezuela;vietnam;wales;yemen;zambia;zimbabwe',
    es: 'afganistán;albania;alemania;argelia;argentina;australia;austria;bélgica;bolivia;brasil;bulgaria;camboya;canadá;chile;china;colombia;corea;costa rica;croacia;cuba;dinamarca;ecuador;egipto;el salvador;escocia;eslovaquia;españa;estados unidos;estonia;etiopía;filipinas;finlandia;francia;gales;ghana;grecia;guatemala;haití;honduras;hungría;india;indonesia;inglaterra;irak;irán;irlanda;islandia;israel;italia;jamaica;japón;jordania;kenia;kuwait;laos;letonia;líbano;libia;malasia;malí;malta;marruecos;méxico;mónaco;mongolia;nepal;nicaragua;nigeria;noruega;nueva zelanda;omán;países bajos;pakistán;panamá;paraguay;perú;polonia;portugal;qatar;reino unido;rumanía;rusia;ruanda;senegal;serbia;singapur;siria;suecia;suiza;tailandia;túnez;turquía;ucrania;uganda;uruguay;venezuela;vietnam;yemen;yibuti;zambia;zimbabue',
  },
];
