/** Secret words for #206 Word Rank: common, concrete English nouns (every one is in the vector vocabulary). */
export const SECRETS =
  `apple airport anchor angel ant arm army arrow art baby bag bakery ball balloon banana band bank
barn basket bath battery beach bean bear beard bed bee beer bell belt bench bicycle bird birthday blanket
boat body bone book boot bottle bowl box brain bread brick bride bridge broom brother bucket butter button
cabin cactus cake camera camp candle candy canoe captain car card carpet castle cat cave chair cheese chef
cherry chicken child chimney chocolate church circus city cloud clown coast coat coffee coin comet computer
cookie corn cotton cow crab crown cup curtain dance desert desk diamond dinner doctor dog doll dolphin door
dragon dream dress drum duck eagle ear earth egg elephant engine eye factory farm feather fence festival
field fire fish flag flower flute fog forest fork fountain fox frog fruit garden garlic ghost gift
glass glove gold grape grass guitar hair hammer hand harbor hat heart helmet hero highway hill honey horse
hospital hotel house ice island jacket jewel jungle kettle key king kitchen kite knife ladder lake lamp
lemon letter library light lion lizard lock map market mask meadow medicine mirror money monkey moon
mountain mouse museum music needle nest newspaper night nose ocean office onion orange owl paint palace
paper parade park party pencil penguin pepper piano picnic pig pillow pilot pirate pizza planet plate
pocket poem police pond potato prison pumpkin puzzle queen rabbit radio rain rainbow restaurant ribbon
rice ring river road robot rocket roof rose sailor salad salt sand sandwich school scissors sea seed shark
sheep shell ship shirt shoe shop shower singer sister skeleton skirt sky snake snow soap soccer sock soldier
soup spider spoon star station statue storm street sugar summer sun swan sword table tail teacher tea
telephone tent theater thunder ticket tiger toast tomato tooth tower town toy tractor train treasure tree
truck tunnel turtle umbrella valley vampire village violin volcano wallet war watch water wave wedding
whale wheel window wine winter witch wolf wood wool worm zebra`
    .split(/\s+/)
    .filter(Boolean);

/**
 * Secret words for #206 Word Rank in Spanish: common, concrete nouns (every one is in the Spanish
 * vector vocabulary).
 */
export const SECRETS_ES =
  `abeja abrigo aceite aceituna aeropuerto agua águila aguja ajo ala alfombra almohada ancla anillo
araña árbol arena armario arroz ascensor avión azúcar azulejo balcón ballena balón banco bandera
bañera barba barco barril bastón basura batería baúl bebé biblioteca bicicleta bigote billete
bolígrafo bolsa bolsillo bombero bosque bota botella botón brazo bruja bufanda búho burro caballo
cabeza cabra cacao cactus cadena café caja cajón calcetín calle cama camello camino camión camisa
campana campo canasta cangrejo canoa caracol cárcel carne carretera carta casa casco castillo
cebolla cebra cereza cerdo cerebro cerveza chaqueta chimenea chocolate cielo cine cinturón ciudad
clavo coche cocina cocodrilo cohete cola colchón collar columpio cometa conejo copa corazón corbata
cordero corona cuadro cuchara cuchillo cuerda cueva dedo delfín desierto diamante diente dinosaurio
dragón ducha elefante enfermera escalera escoba escuela espada espejo esponja estación estatua
estrella estufa faro fábrica flecha flor foca fresa fruta fuego fuente galleta gallina gallo garaje
gato gigante globo gorra gorila granja grifo guante guitarra gusano hacha helado helicóptero hielo
hierba hoja hormiga horno hospital hotel huevo hueso iglesia isla jabón jardín jarra jaula jirafa
joya juguete ladrillo lago lámpara lápiz leche lechuga león libro limón llave lluvia lobo loro luna
maleta manzana mapa máquina mar mariposa martillo mesa miel mochila moneda mono montaña moto muñeca
murciélago museo naranja nave nariz nido nieve nube oficina ojo ola oreja oro oso oveja palacio
pájaro pala palmera pan pantalón papel paraguas parque pastel patata pato payaso peine pelota pera
perro pez piano pie piedra pimienta pingüino pintura piña pirata piscina pizza planeta plátano plato
playa pluma policía pollo puente puerta pulpo queso radio rana ratón regalo reloj rey río robot rosa
rueda sal sandía sartén selva serpiente silla sobre sofá sol sombrero sopa submarino tambor taza
teatro tejado teléfono tenedor tiburón tienda tigre tetera cepillo tomate toro torre tortuga tractor
tren trigo trompeta uva vaca vaso vela velero ventana vestido violín volcán zanahoria zapato zorro`
    .split(/\s+/)
    .filter(Boolean);

/** The secret list for a vector language. */
export const secretsFor = (lang: 'en' | 'es'): readonly string[] =>
  lang === 'es' ? SECRETS_ES : SECRETS;
