/**
 * The one-star reviews of One-Star Landmarks (#240), written for this game — none is copied from a
 * real review site. Each place has three lines, from vague to revealing, in English and Spanish,
 * plus its country (or countries) as shown on the reveal. Keyed by Wikidata id; coordinates and
 * names come from Wikidata (`tools/generate-landmarks.ts`).
 *
 * House rules for the writing: grumble about queues, weather, stairs, prices and expectations —
 * never about people, faith or history's victims; never name the place, its city or its country.
 */
export interface Review {
  country: [en: string, es: string];
  en: [string, string, string];
  es: [string, string, string];
}

export const REVIEWS: Record<string, Review> = {
  Q12501: {
    country: ['China', 'China'],
    en: [
      'Walked for three hours and it just kept going. Who approved this budget?',
      'Endless steps up and down hills, little towers every few hundred metres, nowhere to sit.',
      'Was told you could see it from space. You cannot. I checked with an astronaut.',
    ],
    es: [
      'Tres horas andando y no se acababa nunca. ¿Quién aprobó este presupuesto?',
      'Escalones sin fin subiendo y bajando colinas, torrecitas cada pocos cientos de metros y ni un banco.',
      'Me dijeron que se veía desde el espacio. No se ve. Se lo pregunté a un astronauta.',
    ],
  },
  Q243: {
    country: ['France', 'Francia'],
    en: [
      'Paid a fortune to queue for a lift. Then queued for another lift.',
      'Basically a giant metal lattice. The sparkly lights at night are on a timer, so it is not even excited to see you.',
      'Built for a world fair and they never took it down. The view is nice, but you can’t see the tower from up there.',
    ],
    es: [
      'Pagué una fortuna por hacer cola para un ascensor. Luego, cola para otro ascensor.',
      'Básicamente una celosía de hierro gigante. Las lucecitas de la noche van con temporizador: ni siquiera se alegra de verte.',
      'La hicieron para una exposición universal y nunca la quitaron. Las vistas, bien, pero desde arriba no se ve la torre.',
    ],
  },
  Q7296: {
    country: ['Tanzania', 'Tanzania'],
    en: [
      'Six days of walking uphill to watch the sun come up. It also comes up at sea level.',
      'Started in a rainforest, ended in a freezer. Packing for this was impossible.',
      'Highest point of an entire continent and there is not one café at the top. Snow on the equator is just showing off.',
    ],
    es: [
      'Seis días subiendo para ver salir el sol. A nivel del mar también sale.',
      'Empecé en una selva y acabé en un congelador. Imposible hacer la maleta.',
      'El punto más alto de todo un continente y arriba no hay ni un café. Nieve en el ecuador: puro postureo.',
    ],
  },
  Q9141: {
    country: ['India', 'India'],
    en: [
      'Had to take my shoes off or wear little covers. My socks deserved better.',
      'Very white, very symmetrical, very far from the car park. Everyone takes the same photo on the same bench.',
      'A tomb. A gorgeous marble tomb built out of love, fine, but still a tomb, and the river behind it was not even blue.',
    ],
    es: [
      'Tuve que quitarme los zapatos o ponerme unas fundas. Mis calcetines merecían más.',
      'Muy blanco, muy simétrico, muy lejos del aparcamiento. Todo el mundo hace la misma foto en el mismo banco.',
      'Una tumba. Una preciosa tumba de mármol hecha por amor, vale, pero tumba al fin y al cabo, y el río de detrás ni siquiera era azul.',
    ],
  },
  Q19675: {
    country: ['France', 'Francia'],
    en: [
      'Needed a map for the map. Lost my group in the first hour and never saw them again.',
      'Entered through a glass pyramid, which was the most modern thing in the building by about four hundred years.',
      'Queued forty minutes to see a tiny portrait behind bulletproof glass and a sea of phones. She was not even smiling properly.',
    ],
    es: [
      'Necesitaba un plano para el plano. Perdí al grupo en la primera hora y no los volví a ver.',
      'Se entra por una pirámide de cristal, que era lo más moderno del edificio por unos cuatrocientos años.',
      'Cuarenta minutos de cola para ver un retrato diminuto tras un cristal blindado y un mar de móviles. Ni siquiera sonreía bien.',
    ],
  },
  Q7350: {
    country: ['Panama', 'Panamá'],
    en: [
      'Watched a ship go up some steps of water for an hour. The ship did all the work.',
      'Huge locks, huge ships, tiny viewing platform. The gates opened slower than my bank.',
      'Two oceans and they make you choose which side to look at. Did not see a single shortcut being taken by anyone fun.',
    ],
    es: [
      'Estuve una hora viendo a un barco subir unos escalones de agua. El barco hizo todo el trabajo.',
      'Esclusas enormes, barcos enormes, mirador diminuto. Las compuertas abrían más despacio que mi banco.',
      'Dos océanos y te obligan a elegir a qué lado mirar. No vi a nadie divertido tomar el atajo.',
    ],
  },
  Q9202: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Took a ferry to an island to look at a lady who did not look back.',
      'The stairs inside are a narrow spiral of regret. The crown has tiny windows and no air.',
      'Green from head to toe, holding up a torch nobody has been allowed to climb to for a century. A gift from abroad and nobody kept the receipt.',
    ],
    es: [
      'Cogí un ferri a una isla para mirar a una señora que no me miró.',
      'La escalera interior es una espiral estrecha de arrepentimiento. La corona tiene ventanitas y nada de aire.',
      'Verde de pies a cabeza, con una antorcha a la que nadie puede subir desde hace un siglo. Un regalo del extranjero y nadie guardó el tique.',
    ],
  },
  Q676203: {
    country: ['Peru', 'Perú'],
    en: [
      'Woke up at four to catch a bus to catch a view that was mostly cloud.',
      'Old stone terraces on top of a mountain. A llama photobombed me and was not sorry.',
      'The famous green peak behind the ruins only showed up after I had left. Lost city? They should have kept it lost.',
    ],
    es: [
      'Me levanté a las cuatro para coger un autobús para ver unas vistas que eran casi todo nube.',
      'Terrazas de piedra antiguas en lo alto de una montaña. Una llama se me coló en la foto y no se disculpó.',
      'El famoso pico verde detrás de las ruinas apareció cuando ya me había ido. ¿Ciudad perdida? Mejor haberla dejado perdida.',
    ],
  },
  Q10285: {
    country: ['Italy', 'Italia'],
    en: [
      'Half of it is missing. You would think in two thousand years someone would finish it.',
      'A big oval of arches. Hot, crowded, and a man dressed as a soldier charged me for a photo.',
      'No lions, no gladiators, no thumbs up or down. Just pigeons and the gift shop.',
    ],
    es: [
      'Falta la mitad. En dos mil años ya podían haberlo terminado.',
      'Un óvalo grande de arcos. Calor, gente y un señor vestido de soldado me cobró por una foto.',
      'Ni leones, ni gladiadores, ni pulgares arriba o abajo. Solo palomas y la tienda de recuerdos.',
    ],
  },
  Q39231: {
    country: ['Japan', 'Japón'],
    en: [
      'Climbed all night in a single-file queue of headlamps. Felt like a very slow conga.',
      'From a distance it is a perfect cone with a white cap. Up close it is gravel. So much gravel.',
      'Spent a week trying to photograph it from a lake with a pagoda. Clouds every single day. Rude volcano.',
    ],
    es: [
      'Subí toda la noche en una fila india de linternas frontales. Como una conga muy lenta.',
      'De lejos es un cono perfecto con gorrito blanco. De cerca es grava. Muchísima grava.',
      'Una semana intentando fotografiarlo desde un lago con una pagoda. Nubes todos los días. Volcán maleducado.',
    ],
  },
  Q12495: {
    country: ['United Arab Emirates', 'Emiratos Árabes Unidos'],
    en: [
      'Fastest lift I have ever been in. My ears are still somewhere on the way up.',
      'The observation deck is not even at the top. There is a lot of building above you, just showing off.',
      'Tallest thing on the planet, in the middle of a desert, next to a shopping mall with an aquarium. Too much.',
    ],
    es: [
      'El ascensor más rápido en el que he estado. Mis oídos siguen por ahí, subiendo.',
      'El mirador ni siquiera está arriba del todo. Hay un montón de edificio por encima, presumiendo.',
      'Lo más alto del planeta, en mitad de un desierto, junto a un centro comercial con acuario. Demasiado.',
    ],
  },
  Q10288: {
    country: ['Greece', 'Grecia'],
    en: [
      'Under scaffolding. Has apparently been under scaffolding since before I was born.',
      'Columns, columns and more columns on top of a big rock. The marble is slippery as ice.',
      'Lots of the original sculptures are in a museum in another country. Felt like visiting a house after the removal van.',
    ],
    es: [
      'Con andamios. Por lo visto lleva con andamios desde antes de que yo naciera.',
      'Columnas, columnas y más columnas encima de una roca grande. El mármol resbala como el hielo.',
      'Muchas de las esculturas originales están en un museo de otro país. Como visitar una casa después de la mudanza.',
    ],
  },
  Q43473: {
    country: ['Cambodia', 'Camboya'],
    en: [
      'Got up at four for the sunrise with a thousand other people and their selfie sticks.',
      'Enormous stone temple surrounded by a moat. The steps to the top are basically a ladder.',
      'Its towers are on the national flag, so I had already seen it on every T-shirt in town. Spoilers.',
    ],
    es: [
      'Me levanté a las cuatro para el amanecer junto a otras mil personas y sus palos de selfi.',
      'Templo de piedra enorme rodeado de un foso. Los escalones de arriba son básicamente una escalera de mano.',
      'Sus torres salen en la bandera nacional, así que ya lo había visto en todas las camisetas del pueblo. Spoiler.',
    ],
  },
  Q39671: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Some rocks in a field. You are not allowed to touch the rocks.',
      'Drove past it on the motorway for free and then paid to see it from slightly closer. Same rocks.',
      'Came for the summer solstice. Nobody could tell me what it was for. The builders left no instructions at all.',
    ],
    es: [
      'Unas piedras en un prado. No se pueden tocar las piedras.',
      'La vi gratis desde la autopista y luego pagué por verla un poco más cerca. Mismas piedras.',
      'Vine en el solsticio de verano. Nadie supo decirme para qué servía. Los constructores no dejaron instrucciones.',
    ],
  },
  Q524: {
    country: ['Italy', 'Italia'],
    en: [
      'Walked up to a crater and looked into a hole. The hole looked back. Nothing happened.',
      'Dusty path, wind, a man selling walking sticks. The bay below was the best part.',
      'Famous for burying two whole towns once. Has done nothing since. Overrated as a threat.',
    ],
    es: [
      'Subí a un cráter y miré un agujero. El agujero me miró. No pasó nada.',
      'Sendero polvoriento, viento y un señor vendiendo bastones. La bahía de abajo era lo mejor.',
      'Famoso por sepultar dos ciudades enteras una vez. Desde entonces, nada. Sobrevalorado como amenaza.',
    ],
  },
  Q34221: {
    country: ['Canada / United States', 'Canadá / Estados Unidos'],
    en: [
      'Got soaked through a plastic poncho that cost more than my lunch.',
      'Lots of water falling off a ledge, loudly. The boat ride is basically a car wash with tickets.',
      'Two countries share it and both sides told me their view was better. The casino town around it is a lot.',
    ],
    es: [
      'Acabé empapado con un chubasquero de plástico que costaba más que la comida.',
      'Mucha agua cayendo por un borde, con mucho ruido. El barco es básicamente un túnel de lavado con entrada.',
      'Lo comparten dos países y en los dos lados me dijeron que su vista era la mejor. El pueblo de casinos de alrededor, excesivo.',
    ],
  },
  Q12512: {
    country: ['Vatican City', 'Ciudad del Vaticano'],
    en: [
      'Dress code at the door. My shorts and I were turned away the first time.',
      'Climbed hundreds of steps inside a dome, the last bit leaning sideways like a funhouse.',
      'The biggest church I have seen, in the smallest country I have visited. The square outside is round, which is confusing.',
    ],
    es: [
      'Código de vestimenta en la puerta. A mis pantalones cortos y a mí nos echaron la primera vez.',
      'Cientos de escalones por dentro de una cúpula, el último tramo inclinado como una casa de la risa.',
      'La iglesia más grande que he visto, en el país más pequeño que he visitado. La plaza de fuera es redonda, qué lío.',
    ],
  },
  Q583: {
    country: ['France / Italy', 'Francia / Italia'],
    en: [
      'Paid for a cable car to stand in a cloud. Could have stayed home in November.',
      'There is a glass box hanging over the drop. I did not go in the glass box.',
      'Highest peak in the region and two countries argue about where exactly the summit belongs. Pick one.',
    ],
    es: [
      'Pagué un teleférico para quedarme dentro de una nube. Para eso me quedo en casa en noviembre.',
      'Hay una caja de cristal colgando sobre el vacío. No entré en la caja de cristal.',
      'El pico más alto de la zona y dos países discuten a quién pertenece exactamente la cumbre. Que elijan uno.',
    ],
  },
  Q37200: {
    country: ['Egypt', 'Egipto'],
    en: [
      'Crawled up a narrow tunnel bent double to reach an empty room. Somebody took everything.',
      'Massive pile of stone blocks on the edge of a busy city. A camel man would not let me go.',
      'Last surviving wonder of the ancient world, and the smooth white casing fell off ages ago. Not finished, just old.',
    ],
    es: [
      'Subí doblado por un túnel estrecho para llegar a una sala vacía. Alguien se lo había llevado todo.',
      'Un montón descomunal de bloques de piedra al borde de una ciudad ajetreada. El señor del camello no me dejaba ir.',
      'La última maravilla del mundo antiguo que queda, y el revestimiento blanco se cayó hace siglos. No está sin terminar: está vieja.',
    ],
  },
  Q16990: {
    country: ['Italy', 'Italia'],
    en: [
      'Black sand everywhere. In my shoes, my bag, my sandwich.',
      'Took a jeep over old lava fields to look at smoke. The smoke smelled of eggs.',
      'Biggest active volcano on its island and it erupted the week after I left. Typical.',
    ],
    es: [
      'Arena negra por todas partes. En los zapatos, en la mochila, en el bocadillo.',
      'Un todoterreno por campos de lava vieja para ver humo. El humo olía a huevo.',
      'El volcán activo más grande de su isla y entró en erupción la semana después de irme. Típico.',
    ],
  },
  Q2981: {
    country: ['France', 'Francia'],
    en: [
      'Spent years under repair. The cranes were the tallest thing in the photo.',
      'Two square towers, rose windows, and stone monsters on the roof sticking their tongues out at me.',
      'On an island in the middle of a river in a capital. Kept waiting for a bell-ringer to show up. Nobody did.',
    ],
    es: [
      'Años en obras. Las grúas eran lo más alto de la foto.',
      'Dos torres cuadradas, rosetones y monstruos de piedra en el tejado sacándome la lengua.',
      'En una isla en mitad del río de una capital. Esperé a que apareciera un campanero. No apareció nadie.',
    ],
  },
  Q9188: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Waited in a corridor of velvet ropes that looped back on itself eleven times.',
      'Art deco lobby, very shiny, very slow lifts. The wind on the deck took my hat.',
      'No giant ape on the spire. False advertising from the films. Also no longer the tallest in town.',
    ],
    es: [
      'Esperé en un pasillo de cordones de terciopelo que daba once vueltas sobre sí mismo.',
      'Vestíbulo art déco, muy brillante, ascensores muy lentos. El viento del mirador se llevó mi gorro.',
      'Ni rastro del simio gigante en la aguja. Publicidad engañosa de las películas. Y ya ni es el más alto de la ciudad.',
    ],
  },
  Q43332: {
    country: ['Italy', 'Italia'],
    en: [
      'An entire town and not one open shop. Every house was missing its roof.',
      'Ruts in the stone streets, stepping stones, mosaics of dogs telling you to beware. The dogs were not there.',
      'The mountain in the background ruined everything once and still looks smug about it.',
    ],
    es: [
      'Un pueblo entero y ni una tienda abierta. A todas las casas les faltaba el tejado.',
      'Surcos en las calles de piedra, pasaderas y mosaicos de perros avisando de que cuidado. No había perros.',
      'La montaña del fondo lo arruinó todo una vez y todavía tiene cara de satisfecha.',
    ],
  },
  Q39054: {
    country: ['Italy', 'Italia'],
    en: [
      'It is crooked. Nobody fixed it. They charge you to climb it anyway.',
      'Everyone on the lawn doing the same pose, pushing the air. I pushed the air too, it did not help.',
      'A bell tower that started tilting before it was even finished. Builders should have checked the ground first.',
    ],
    es: [
      'Está torcida. Nadie la arregló. Y encima te cobran por subir.',
      'Todo el mundo en el césped haciendo la misma pose, empujando el aire. Yo también empujé. No sirvió.',
      'Un campanario que se empezó a inclinar antes de terminarlo. Los albañiles debieron mirar el suelo primero.',
    ],
  },
  Q5788: {
    country: ['Jordan', 'Jordania'],
    en: [
      'Walked down a narrow gorge for half an hour, dodging horse carts going much too fast.',
      'The pink stone façade at the end is lovely, but you cannot go inside. It is basically a very good door.',
      'Felt like I was in an adventure film, minus the treasure. The monastery is eight hundred steps further. Of course it is.',
    ],
    es: [
      'Media hora bajando por un desfiladero estrecho, esquivando carros de caballos que iban demasiado rápido.',
      'La fachada de piedra rosa del final es preciosa, pero no se puede entrar. Es básicamente una puerta muy buena.',
      'Me sentí en una película de aventuras, sin el tesoro. El monasterio está ochocientos escalones más allá. Cómo no.',
    ],
  },
  Q118841: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'It is a very big hole. Looked at it for ten minutes. Still a hole.',
      'Layers of red rock and a river so far down it looks like a thread. The mules smelled.',
      'Drove five hours across a desert, stood at the rim, said "huh". The glass skywalk is extra.',
    ],
    es: [
      'Es un agujero muy grande. Lo miré diez minutos. Seguía siendo un agujero.',
      'Capas de roca roja y un río tan abajo que parece un hilo. Las mulas olían.',
      'Cinco horas conduciendo por el desierto, me asomé al borde y dije «vaya». La pasarela de cristal se paga aparte.',
    ],
  },
  Q351: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'The ground smells like rotten eggs and the signs tell you not to touch the pretty water.',
      'A bison blocked the road for forty minutes. The rangers said this is normal.',
      'Waited for a geyser that goes off "about every hour and a half". It went off while I was in the toilet.',
    ],
    es: [
      'El suelo huele a huevo podrido y los carteles te dicen que no toques el agua bonita.',
      'Un bisonte cortó la carretera cuarenta minutos. Los guardas dijeron que es normal.',
      'Esperé a un géiser que salta «más o menos cada hora y media». Saltó mientras yo estaba en el baño.',
    ],
  },
  Q43278: {
    country: ['Zambia / Zimbabwe', 'Zambia / Zimbabue'],
    en: [
      'Could not see a thing for the spray. Got rained on from below, which should not be possible.',
      'A curtain of water over a mile wide dropping into a narrow gorge. Monkeys stole my crisps.',
      'The locals call it the smoke that thunders, and they are right, it is mostly smoke. A bridge between two countries hangs over the gorge.',
    ],
    es: [
      'No vi nada por la espuma. Me llovió desde abajo, cosa que no debería ser posible.',
      'Una cortina de agua de más de un kilómetro de ancho cayendo a un desfiladero estrecho. Los monos me robaron las patatas.',
      'Allí lo llaman el humo que truena, y tienen razón: casi todo es humo. Un puente entre dos países cuelga sobre el cañón.',
    ],
  },
  Q44440: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Walked across in a gale. My umbrella is now part of the bay.',
      'It is not even gold, it is orange. And the fog hid the top half all day.',
      'A famous suspension bridge with a toll for driving one way only. The island prison was visible, the bridge was not.',
    ],
    es: [
      'Lo crucé andando con un vendaval. Mi paraguas ahora forma parte de la bahía.',
      'Ni siquiera es dorado, es naranja. Y la niebla tapó la mitad de arriba todo el día.',
      'Un puente colgante famoso con peaje en un solo sentido. La isla de la cárcel se veía; el puente, no.',
    ],
  },
  Q48435: {
    country: ['Spain', 'España'],
    en: [
      'Still under construction. Has been since the eighteen-hundreds. Contractors, am I right?',
      'Looks like a sandcastle that melted. Inside, the coloured light was nice, I will admit that.',
      'Eighteen towers planned, the tallest still going up. The architect died long before it was finished and they are still working from his models.',
    ],
    es: [
      'Todavía en obras. Desde el siglo diecinueve. Albañiles, ya se sabe.',
      'Parece un castillo de arena que se derritió. Dentro, la luz de colores estaba bien, lo reconozco.',
      'Dieciocho torres previstas y la más alta aún creciendo. El arquitecto murió mucho antes de terminarla y siguen trabajando con sus maquetas.',
    ],
  },
  Q5859: {
    country: ['Mexico', 'México'],
    en: [
      'Not allowed to climb the pyramid anymore. Just stand at the bottom and look up, like a peasant.',
      'Clap at the base and it echoes back like a bird. Two hundred people clapping at once is not an echo, it is a migraine.',
      'At the equinox a shadow snake slides down the steps. I came the week after. No snake.',
    ],
    es: [
      'Ya no se puede subir a la pirámide. Te quedas abajo mirando hacia arriba, como un plebeyo.',
      'Das una palmada al pie y el eco suena como un pájaro. Doscientas personas aplaudiendo a la vez no es un eco, es una migraña.',
      'En el equinoccio una serpiente de sombra baja por los escalones. Fui la semana siguiente. Ni serpiente.',
    ],
  },
  Q6373: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Free entry, then a donation box staring at you with sad eyes.',
      'Huge glass roof over a courtyard, then room after room of things from other places.',
      'Saw a stone with three scripts on it surrounded by forty people. Also mummies. So many mummies.',
    ],
    es: [
      'Entrada gratis y luego una hucha de donativos mirándote con ojos tristes.',
      'Un techo de cristal enorme sobre un patio y luego sala tras sala de cosas de otros sitios.',
      'Vi una piedra con tres escrituras rodeada de cuarenta personas. Y momias. Muchísimas momias.',
    ],
  },
  Q2946: {
    country: ['France', 'Francia'],
    en: [
      'A palace with seven hundred rooms and not a single comfy chair.',
      'The hall of mirrors was a hall of phones. The gardens are so big you need a little train.',
      'A king moved the whole court out of the capital to here. The fountains only run on certain days. Not mine.',
    ],
    es: [
      'Un palacio con setecientas habitaciones y ni una silla cómoda.',
      'La galería de los espejos era una galería de móviles. Los jardines son tan grandes que necesitas un trenecito.',
      'Un rey se trajo aquí a toda la corte desde la capital. Las fuentes solo funcionan ciertos días. Los míos no.',
    ],
  },
  Q80290: {
    country: ['China', 'China'],
    en: [
      'Gate, courtyard, hall. Gate, courtyard, hall. Repeat for three hours.',
      'Red walls, yellow roofs, a moat, and not one shady spot in the entire place.',
      'Emperors lived here for five centuries and commoners were not allowed in. Now everyone is, at the same time.',
    ],
    es: [
      'Puerta, patio, salón. Puerta, patio, salón. Repetir tres horas.',
      'Muros rojos, tejados amarillos, un foso y ni un rincón con sombra en todo el recinto.',
      'Aquí vivieron emperadores cinco siglos y la gente corriente no podía entrar. Ahora entra todo el mundo a la vez.',
    ],
  },
  Q38954: {
    country: ['Spain', 'España'],
    en: [
      'Need a permit to walk to the very top. Found out at the top of the cable car.',
      'Moonscape of lava, strange flowers and a hotel in the middle of nowhere. Very windy.',
      'Highest mountain of its country and it is on an island off Africa. Geography is confusing.',
    ],
    es: [
      'Hace falta un permiso para subir al pico. Me enteré arriba del teleférico.',
      'Paisaje lunar de lava, flores raras y un parador en mitad de la nada. Mucho viento.',
      'La montaña más alta de su país y está en una isla frente a África. La geografía es un lío.',
    ],
  },
  Q41116: {
    country: ['Russia', 'Rusia'],
    en: [
      'It is a big square. The name made me expect a colour. It is mostly grey.',
      'Cobblestones that destroy suitcases, a department store with a glass roof and a mausoleum with a long queue.',
      'A red brick wall along one side, the colourful onion domes at the end. Freezing in winter, of course.',
    ],
    es: [
      'Es una plaza grande. Por el nombre esperaba un color. Casi todo es gris.',
      'Adoquines que destrozan maletas, unos grandes almacenes con techo de cristal y un mausoleo con mucha cola.',
      'Una muralla de ladrillo rojo a un lado y las cúpulas de colores al fondo. En invierno, un congelador, claro.',
    ],
  },
  Q42798: {
    country: ['Indonesia', 'Indonesia'],
    en: [
      'Walk round each level clockwise, they said. I walked round nine levels. Dizzy.',
      'Hundreds of stone panels with carvings, then dozens of little stone bells at the top with statues hidden inside.',
      'Got up at four for a sunrise over volcanoes. Misty. On an island famous for its coffee, which was the highlight.',
    ],
    es: [
      'Dar la vuelta a cada nivel en el sentido de las agujas del reloj, dijeron. Di nueve vueltas. Mareado.',
      'Cientos de relieves de piedra y arriba docenas de campanitas de piedra con estatuas escondidas dentro.',
      'Me levanté a las cuatro para ver amanecer sobre volcanes. Niebla. En una isla famosa por su café, que fue lo mejor.',
    ],
  },
  Q36332: {
    country: ['Argentina / Brazil', 'Argentina / Brasil'],
    en: [
      'Coatis mugged me for a sandwich. Nobody warned me about the coatis.',
      'Hundreds of waterfalls in a jungle horseshoe. The walkways are wet, the people are wet, I am wet.',
      'One country has the view, the other has the walkways over the "throat of the devil". Needed two visas worth of patience.',
    ],
    es: [
      'Los coatíes me atracaron por un bocadillo. Nadie me avisó de los coatíes.',
      'Cientos de cascadas en una herradura de selva. Las pasarelas mojadas, la gente mojada, yo mojado.',
      'Un país tiene las vistas y el otro las pasarelas sobre la «garganta del diablo». Hacía falta paciencia para dos visados.',
    ],
  },
  Q45178: {
    country: ['Australia', 'Australia'],
    en: [
      'Went to a concert, could not stop thinking about the roof.',
      'Looks like sails, or shells, or a stack of plates depending on who you ask. Tiles up close are not even white.',
      'Took years longer and cost many times more than planned. The architect quit and never saw it finished. Harbour view is good.',
    ],
    es: [
      'Fui a un concierto y no podía dejar de pensar en el tejado.',
      'Parecen velas, o conchas, o una pila de platos, según a quién preguntes. De cerca las tejas ni son blancas.',
      'Tardaron años de más y costó muchas veces lo previsto. El arquitecto dimitió y nunca lo vio acabado. La vista del puerto, buena.',
    ],
  },
  Q131013: {
    country: ['Greece', 'Grecia'],
    en: [
      'A hill of slippery marble in forty-degree heat. Bring water. Bring more water.',
      'Temples, a theatre, statues of women holding up a roof with their heads. The originals are in a museum.',
      'Overlooks the whole capital. Every photo had the same cranes in it. The city cats were the best part.',
    ],
    es: [
      'Una colina de mármol resbaladizo a cuarenta grados. Trae agua. Trae más agua.',
      'Templos, un teatro y estatuas de mujeres sujetando un tejado con la cabeza. Las originales están en un museo.',
      'Domina toda la capital. En todas las fotos salían las mismas grúas. Los gatos de la ciudad, lo mejor.',
    ],
  },
  Q47476: {
    country: ['Spain', 'España'],
    en: [
      'Tickets sold out three weeks ahead. Saw it from a hill across the valley instead.',
      'Courtyards with fountains, carved ceilings like honeycomb, a garden of tidy hedges.',
      'Red fortress-palace above a southern city with snowy mountains behind. Everyone wants the lion fountain photo.',
    ],
    es: [
      'Entradas agotadas con tres semanas de antelación. La vi desde un mirador al otro lado del valle.',
      'Patios con fuentes, techos tallados como panales y un jardín de setos muy ordenados.',
      'Palacio-fortaleza rojo sobre una ciudad del sur con montañas nevadas detrás. Todos quieren la foto de la fuente de los leones.',
    ],
  },
  Q83497: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Smaller than in the films. Much smaller than in the films.',
      'Four giant faces carved into a mountain. You look at them from a terrace with an ice cream.',
      'Four presidents and not one of them waved back. Drove for hours through nothing to get here.',
    ],
    es: [
      'Más pequeño que en las películas. Mucho más pequeño que en las películas.',
      'Cuatro caras gigantes talladas en una montaña. Las miras desde una terraza con un helado.',
      'Cuatro presidentes y ninguno me devolvió el saludo. Horas conduciendo por la nada para llegar aquí.',
    ],
  },
  Q42182: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Stood at a fence for an hour to watch men in tall hats swap places.',
      'Big grey-beige building with a balcony. The guards are not allowed to laugh. I tried.',
      'The flag tells you if the monarch is home. I was not invited in either way.',
    ],
    es: [
      'Una hora pegado a una verja para ver a unos señores con gorros altos cambiarse de sitio.',
      'Un edificio grande gris claro con balcón. Los guardias no pueden reírse. Lo intenté.',
      'La bandera te dice si el monarca está en casa. En cualquier caso no me invitaron a pasar.',
    ],
  },
  Q550: {
    country: ['France', 'Francia'],
    en: [
      'Paid twelve euros for a coffee and the waiter seemed annoyed I had ordered it.',
      'A very long, very wide avenue of shops I cannot afford, ending at a big arch in a roundabout.',
      'The cycling race finishes here every summer. The rest of the year it is traffic and luxury handbags.',
    ],
    es: [
      'Doce euros por un café y el camarero parecía molesto de que lo hubiera pedido.',
      'Una avenida larguísima y anchísima de tiendas que no me puedo permitir, que acaba en un arco gigante en una rotonda.',
      'Aquí termina la gran carrera ciclista cada verano. El resto del año: tráfico y bolsos de lujo.',
    ],
  },
  Q134140: {
    country: ['Egypt', 'Egipto'],
    en: [
      'Bus left at three in the morning in a convoy across the desert. Slept through the desert.',
      'Four enormous seated statues on the front of a temple cut into a cliff. One of them has lost his head.',
      'The whole thing was cut up and moved uphill so a lake would not drown it. Sun lines up inside twice a year. Not my day.',
    ],
    es: [
      'El autobús salió a las tres de la mañana en convoy por el desierto. Me dormí todo el desierto.',
      'Cuatro estatuas sentadas enormes en la fachada de un templo excavado en la roca. A una se le cayó la cabeza.',
      'Lo cortaron entero y lo subieron colina arriba para que no lo ahogara un lago. El sol entra alineado dos días al año. No era el mío.',
    ],
  },
  Q33910: {
    country: ['Australia', 'Australia'],
    en: [
      'Flew for hours to see a rock. Flies everywhere. In my mouth, specifically.',
      'Changes colour at sunset, they said. It went from orange to slightly darker orange.',
      'A giant red rock in the exact middle of a continent. You are asked not to climb it and they are right.',
    ],
    es: [
      'Horas de avión para ver una piedra. Moscas por todas partes. En la boca, concretamente.',
      'Cambia de color al atardecer, dijeron. Pasó de naranja a naranja un poco más oscuro.',
      'Una roca roja gigante justo en mitad de un continente. Te piden que no la escales y tienen razón.',
    ],
  },
  Q79961: {
    country: ['Brazil', 'Brasil'],
    en: [
      'Took a little train up a mountain to stand in a cloud with outstretched arms.',
      'Everyone lying on the floor to fit the whole statue in the photo. The floor was dirty.',
      'Watches over a beach city with a sugarloaf-shaped mountain nearby. When the cloud lifted, it was magical. For eleven seconds.',
    ],
    es: [
      'Un trenecito monte arriba para estar dentro de una nube con los brazos abiertos.',
      'Todo el mundo tumbado en el suelo para que la estatua entera saliera en la foto. El suelo estaba sucio.',
      'Vigila una ciudad de playas con un monte con forma de pan de azúcar al lado. Cuando se levantó la nube, magia. Once segundos.',
    ],
  },
  Q4152: {
    country: ['Germany', 'Alemania'],
    en: [
      'Walked uphill for forty minutes behind a horse carriage. You know what horses do.',
      'The inside tour lasted thirty minutes and half the rooms were never finished.',
      'Looks exactly like a fairytale castle because a famous cartoon studio copied it. The king who built it barely lived in it.',
    ],
    es: [
      'Cuarenta minutos cuesta arriba detrás de un coche de caballos. Ya sabes lo que hacen los caballos.',
      'La visita interior duró treinta minutos y la mitad de las salas nunca se terminaron.',
      'Parece un castillo de cuento porque un famoso estudio de dibujos lo copió. El rey que lo construyó casi no vivió en él.',
    ],
  },
  Q80299: {
    country: ['Venezuela', 'Venezuela'],
    en: [
      'Three days of planes, boats and mud to look at some water.',
      'The water falls so far it turns to mist before it reaches the bottom. So technically it never arrives.',
      'Tallest waterfall in the world, off a flat-topped mountain in the jungle, named after a pilot who crashed on top. Inspiring.',
    ],
    es: [
      'Tres días de avionetas, barcas y barro para ver un poco de agua.',
      'El agua cae desde tan alto que se convierte en niebla antes de llegar abajo. Técnicamente nunca llega.',
      'La cascada más alta del mundo, desde una montaña de cima plana en la selva, con el nombre de un piloto que se estrelló arriba. Inspirador.',
    ],
  },
  Q1374: {
    country: ['Switzerland / Italy', 'Suiza / Italia'],
    en: [
      'Paid for a mountain train to a viewpoint. The mountain hid behind a cloud and sulked.',
      'A pyramid of rock with a crooked tip. The village below has no cars, so I walked everywhere with my suitcase.',
      'It is on a chocolate wrapper. That is how I recognised it. Tasted better on the wrapper.',
    ],
    es: [
      'Pagué un tren de montaña hasta un mirador. La montaña se escondió tras una nube, enfurruñada.',
      'Una pirámide de roca con la punta torcida. El pueblo de abajo no tiene coches, así que fui a todas partes arrastrando la maleta.',
      'Sale en el envoltorio de un chocolate. Así la reconocí. En el envoltorio sabía mejor.',
    ],
  },
  Q5933: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'No photos allowed inside. My memory is not that good.',
      'Gothic church full of tombs and plaques; I stepped on at least three poets by accident.',
      'Every royal wedding and coronation on telly happens here. It looked bigger on telly.',
    ],
    es: [
      'No se pueden hacer fotos dentro. Mi memoria no da para tanto.',
      'Una iglesia gótica llena de tumbas y placas; pisé sin querer a por lo menos tres poetas.',
      'Todas las bodas reales y coronaciones de la tele son aquí. En la tele parecía más grande.',
    ],
  },
  Q2943: {
    country: ['Vatican City', 'Ciudad del Vaticano'],
    en: [
      'Walked through two kilometres of corridors to reach one room. A man kept shushing everyone.',
      'You crane your neck for twenty minutes at a painted ceiling. My neck has not forgiven me.',
      'Two fingers almost touching, painted by a sculptor who did not want the job. The cardinals vote in here; they can keep it.',
    ],
    es: [
      'Dos kilómetros de pasillos para llegar a una sala. Un señor mandaba callar a todo el mundo.',
      'Veinte minutos con el cuello torcido mirando un techo pintado. Mi cuello no me lo ha perdonado.',
      'Dos dedos a punto de tocarse, pintados por un escultor que no quería el encargo. Los cardenales votan aquí; para ellos.',
    ],
  },
  Q47672: {
    country: ['China', 'China'],
    en: [
      'Thousands of soldiers and not one of them said hello.',
      'Rows and rows of clay figures in a hangar, all with different faces. The shop sells small ones for a lot.',
      'Farmers digging a well found them. Made for an emperor’s tomb that they still have not opened. Open it!',
    ],
    es: [
      'Miles de soldados y ni uno me saludó.',
      'Filas y filas de figuras de barro en un hangar, todas con caras distintas. En la tienda venden pequeñas, carísimas.',
      'Las encontraron unos campesinos cavando un pozo. Hechas para la tumba de un emperador que aún no han abierto. ¡Ábranla!',
    ],
  },
  Q83063: {
    country: ['Malaysia', 'Malasia'],
    en: [
      'Booked a time slot, still waited. Air conditioning was the highlight.',
      'Two identical silver towers joined by a skybridge halfway up. You only get to the bridge and one floor near the top.',
      'Were once the tallest buildings in the world. A shopping mall at the bottom, a fountain show at night.',
    ],
    es: [
      'Reservé franja horaria y aun así esperé. Lo mejor, el aire acondicionado.',
      'Dos torres plateadas idénticas unidas por una pasarela a media altura. Solo te dejan la pasarela y una planta cerca de arriba.',
      'Fueron los edificios más altos del mundo. Un centro comercial abajo y espectáculo de fuentes por la noche.',
    ],
  },
  Q10257: {
    country: ['France / United Kingdom', 'Francia / Reino Unido'],
    en: [
      'It is a tunnel. Dark the whole way. No fish visible. Zero stars if I could.',
      'Drove my car onto a train, sat in my car on the train, drove off the train. Thirty-five minutes of beige.',
      'Under the sea between two countries that argue about everything. Was hoping for windows.',
    ],
    es: [
      'Es un túnel. Oscuro todo el rato. Ni un pez. Cero estrellas si pudiera.',
      'Metí el coche en un tren, me quedé sentado en el coche en el tren y salí del tren. Treinta y cinco minutos de beis.',
      'Bajo el mar entre dos países que discuten por todo. Esperaba ventanas.',
    ],
  },
  Q133423: {
    country: ['Egypt', 'Egipto'],
    en: [
      'The ticket includes three tombs. The one I wanted cost extra.',
      'Hot, dusty valley of holes in the hills. Inside, painted corridors and no photos without another ticket.',
      'Only one of the pharaohs was found with his treasure, and his gold mask is in a museum a long way away.',
    ],
    es: [
      'La entrada incluye tres tumbas. La que yo quería se pagaba aparte.',
      'Un valle caluroso y polvoriento lleno de agujeros en los cerros. Dentro, pasillos pintados y sin fotos salvo con otra entrada.',
      'Solo encontraron a un faraón con su tesoro, y su máscara de oro está en un museo muy lejos.',
    ],
  },
  Q155174: {
    country: ['Brazil', 'Brasil'],
    en: [
      'Toured an empty stadium. Shouted "goal" alone. Nobody shouted back.',
      'Huge bowl, seats in a few colours, a tunnel the players walk through. The hot dogs were cold.',
      'Two World Cup finals here, and the host country lost the first one to a small neighbour. Still bitter on its behalf.',
    ],
    es: [
      'Visité un estadio vacío. Grité «gol» solo. Nadie me contestó.',
      'Un cuenco enorme, gradas de varios colores y el túnel por donde salen los jugadores. Los perritos, fríos.',
      'Dos finales de Mundial aquí, y la anfitriona perdió la primera contra un vecino pequeño. Todavía me duele por ellos.',
    ],
  },
  Q159848: {
    country: ['Spain', 'España'],
    en: [
      'Stadium tour, museum, shop. The shop was the biggest part.',
      'Steep stands, no roof, building works everywhere. My seat was so high I saw the planes better than the players.',
      'Biggest football stadium in its continent, home of a blue-and-red team with a motto about being more than a club.',
    ],
    es: [
      'Visita al estadio, museo y tienda. La tienda era lo más grande.',
      'Gradas empinadas, sin techo y obras por todas partes. Mi asiento estaba tan alto que veía mejor los aviones que a los jugadores.',
      'El estadio de fútbol más grande de su continente, casa de un equipo azulgrana con un lema sobre ser más que un club.',
    ],
  },
  Q160236: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Spent so long in the armour rooms I missed the rest. There is a lot of rest.',
      'Giant steps outside where everyone sits eating hot dogs. An entire ancient temple inside a glass room.',
      'Every spring there is a famous gala and celebrities walk up the stairs in silly outfits. I walked up in trainers.',
    ],
    es: [
      'Pasé tanto rato en las salas de armaduras que me perdí el resto. Hay muchísimo resto.',
      'Una escalinata enorme fuera donde todo el mundo come perritos. Un templo antiguo entero dentro de una sala de cristal.',
      'Cada primavera hay una gala famosa y los famosos suben la escalera con trajes ridículos. Yo la subí en zapatillas.',
    ],
  },
  Q160409: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Got lost in a park. A park! In the middle of a city!',
      'A big rectangle of trees, lakes and joggers surrounded by tall buildings. Horse carriages, pretzel carts, a castle.',
      'Every film shot here has someone ice skating. I fell over on the ice. Nobody filmed it, thankfully.',
    ],
    es: [
      'Me perdí en un parque. ¡Un parque! ¡En mitad de una ciudad!',
      'Un gran rectángulo de árboles, lagos y gente corriendo, rodeado de rascacielos. Coches de caballos, puestos de pretzels y un castillo.',
      'En todas las películas rodadas aquí alguien patina sobre hielo. Yo me caí en el hielo. Menos mal que nadie lo grabó.',
    ],
  },
  Q41225: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Waited for it to chime on the hour. Was it right? I had no way to check.',
      'A tall clock tower by a river, attached to a very long building full of shouting.',
      'Turns out the famous name is the bell, not the tower. I felt lied to by every postcard.',
    ],
    es: [
      'Esperé a que diera la hora. ¿Iba en hora? No tenía cómo comprobarlo.',
      'Una torre del reloj alta junto a un río, pegada a un edificio larguísimo lleno de gritos.',
      'Resulta que el nombre famoso es el de la campana, no el de la torre. Me sentí engañado por todas las postales.',
    ],
  },
  Q62378: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'A moving walkway past some jewellery. It moved too fast. I wanted to look at the jewellery.',
      'Stone keep, thick walls, guards in red and black uniforms telling grim stories with jokes.',
      'If the ravens ever leave, the kingdom falls, apparently. They clip the wings. That feels like cheating.',
    ],
    es: [
      'Una cinta transportadora junto a unas joyas. Iba demasiado deprisa. Yo quería mirar las joyas.',
      'Torre de piedra, muros gruesos y guardias de uniforme rojo y negro contando historias tétricas con chistes.',
      'Si los cuervos se van algún día, cae el reino, dicen. Les cortan las alas. Eso es hacer trampa.',
    ],
  },
  Q180402: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Needed a reservation to drive into nature. Nature has a booking system now.',
      'Granite walls, tall waterfalls in spring, a smooth rock face half cut away like a dome.',
      'People climb the giant rock face for days, sleeping on the wall. I sat in the meadow and that was enough.',
    ],
    es: [
      'Necesité reserva para entrar en coche en la naturaleza. La naturaleza ahora tiene sistema de reservas.',
      'Paredes de granito, cascadas altas en primavera y una roca lisa cortada por la mitad como una cúpula.',
      'Hay gente que escala la pared gigante durante días, durmiendo colgada. Yo me senté en la pradera y me bastó.',
    ],
  },
  Q4176: {
    country: ['Germany', 'Alemania'],
    en: [
      'Five hundred and something steps up a spiral. My legs filed a complaint.',
      'Two enormous black spires right outside the main train station. You cannot miss it, but you cannot photograph it either.',
      'Took over six hundred years to finish. Locals call it their pride. I call it my calves.',
    ],
    es: [
      'Quinientos y pico escalones en espiral. Mis piernas presentaron una queja.',
      'Dos agujas negras enormes justo delante de la estación de tren principal. Imposible no verla; imposible fotografiarla entera.',
      'Tardaron más de seiscientos años en terminarla. Allí dicen que es su orgullo. Yo digo que son mis gemelos.',
    ],
  },
  Q64436: {
    country: ['France', 'Francia'],
    en: [
      'To reach it you go through a tunnel under the busiest roundabout I have ever seen.',
      'A giant arch with twelve avenues coming out of it like a star. The roundabout has no lanes, only courage.',
      'Built for a short emperor’s victories. There is an eternal flame underneath. The view of the tower is better than the arch.',
    ],
    es: [
      'Para llegar pasas por un túnel bajo la rotonda con más tráfico que he visto nunca.',
      'Un arco gigante con doce avenidas saliendo como una estrella. La rotonda no tiene carriles, solo valor.',
      'Lo hicieron para las victorias de un emperador bajito. Debajo hay una llama eterna. La vista de la torre, mejor que el arco.',
    ],
  },
  Q82425: {
    country: ['Germany', 'Alemania'],
    en: [
      'It is a gate. You can walk through it. Then you are on the other side. That is it.',
      'Six big columns with a chariot and four horses on top. People in costumes asking for money for photos.',
      'For years nobody could walk through it at all, because of a wall. Now you can. Still just a gate.',
    ],
    es: [
      'Es una puerta. Puedes pasar por ella. Luego estás al otro lado. Ya está.',
      'Seis columnas grandes con un carro y cuatro caballos encima. Gente disfrazada pidiendo dinero por las fotos.',
      'Durante años nadie podía cruzarla, por culpa de un muro. Ahora sí. Sigue siendo una puerta.',
    ],
  },
  Q83125: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Waited two hours for the road to lift. It lifted for a tiny sailing boat. Felt robbed.',
      'Two towers with a glass floor walkway between them. Looking down at buses made me sick.',
      'Everyone calls it by the wrong name. The other bridge, the plain one, is the one with the famous rhyme.',
    ],
    es: [
      'Dos horas esperando a que se levantara la calzada. Se levantó para un velero diminuto. Me sentí estafado.',
      'Dos torres con una pasarela de suelo de cristal entre ellas. Mirar los autobuses desde arriba me mareó.',
      'Todo el mundo lo llama por el nombre equivocado. El otro puente, el sencillo, es el de la canción infantil.',
    ],
  },
  Q130958: {
    country: ['Egypt', 'Egipto'],
    en: [
      'Smaller than expected and missing its nose. Asked a riddle, got no answer.',
      'A lion body with a human head lying in a pit in the sand. Everyone pretends to kiss it in photos.',
      'Sits in front of the big pyramids watching the sunrise. At night there is a light show narrated by the statue itself. Cringe.',
    ],
    es: [
      'Más pequeña de lo esperado y sin nariz. Le hice un acertijo y no contestó.',
      'Un cuerpo de león con cabeza humana tumbado en un foso en la arena. Todo el mundo finge besarla en las fotos.',
      'Está delante de las grandes pirámides mirando el amanecer. Por la noche hay un espectáculo de luces narrado por la propia estatua. Qué vergüenza.',
    ],
  },
  Q42646: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Planes from the nearby airport fly overhead every ninety seconds. Very regal.',
      'A round tower on a mound, long walls, a chapel and a dolls’ house the size of a car.',
      'The oldest lived-in castle in the world, on the river west of the capital. The royals were out. I checked.',
    ],
    es: [
      'Los aviones del aeropuerto de al lado pasan por encima cada noventa segundos. Muy regio.',
      'Una torre redonda sobre un montículo, murallas largas, una capilla y una casa de muñecas del tamaño de un coche.',
      'El castillo habitado más antiguo del mundo, junto al río al oeste de la capital. La familia real no estaba. Lo comprobé.',
    ],
  },
  Q71229: {
    country: ['China', 'China'],
    en: [
      'The air is so thin I needed a sit-down every twenty steps.',
      'White and red walls stacked up a hill, golden roofs, timed tickets of exactly one hour.',
      'A thousand rooms on the roof of the world, former home of a famous monk. I got a headache from the altitude.',
    ],
    es: [
      'El aire es tan fino que necesitaba sentarme cada veinte escalones.',
      'Muros blancos y rojos apilados en una colina, tejados dorados y entradas con hora de una hora exacta.',
      'Mil habitaciones en el techo del mundo, antiguo hogar de un monje famoso. La altura me dio dolor de cabeza.',
    ],
  },
  Q83101: {
    country: ['Taiwan', 'Taiwán'],
    en: [
      'There is a giant golden ball hanging inside to stop it swaying. It still swayed. Or I did.',
      'Looks like a stack of takeaway boxes or bamboo segments. The lift tells you how fast it is going. Very proud lift.',
      'Fireworks shoot off it every New Year. Was briefly the tallest in the world and its name is a number.',
    ],
    es: [
      'Dentro cuelga una bola dorada gigante para que no se balancee. Se balanceó igual. O yo.',
      'Parece una pila de cajas de comida para llevar o trozos de bambú. El ascensor te dice a qué velocidad va. Ascensor muy orgulloso.',
      'Cada Nochevieja lanzan fuegos artificiales desde ella. Fue un tiempo la más alta del mundo y su nombre es un número.',
    ],
  },
  Q125006: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Walked across with ten thousand people and a hundred cyclists ringing bells at me.',
      'Stone towers with pointed arches and a web of cables. The wooden walkway is above the cars.',
      'Joins two boroughs, one of which everyone moved to for the coffee. The skyline view is good, I will give it one star for that.',
    ],
    es: [
      'Lo crucé con diez mil personas y cien ciclistas tocándome el timbre.',
      'Torres de piedra con arcos apuntados y una telaraña de cables. La pasarela de madera va por encima de los coches.',
      'Une dos distritos, uno de ellos famoso porque todo el mundo se mudó por el café. Las vistas, bien: una estrella por eso.',
    ],
  },
  Q28471: {
    country: ['Spain', 'España'],
    en: [
      'A palace, monastery and library in one, and every room was the same shade of grey granite.',
      'Long corridors, a room of kings’ tombs stacked like drawers, a library with the books facing backwards.',
      'Built by a king in the hills outside the capital to celebrate a battle. Shaped like a grill, they say. I did not see a grill.',
    ],
    es: [
      'Palacio, monasterio y biblioteca a la vez, y todas las salas del mismo gris granito.',
      'Pasillos larguísimos, una sala de tumbas de reyes apiladas como cajones y una biblioteca con los libros al revés.',
      'Lo construyó un rey en la sierra de las afueras de la capital para celebrar una batalla. Dicen que tiene forma de parrilla. Yo no vi ninguna parrilla.',
    ],
  },
  Q57357: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Walked for six days along a wall that is mostly a ditch now.',
      'Little forts every mile, lots of sheep, lots of wind. The wall is waist high where it exists.',
      'Romans built it across a whole country to keep the northerners out. Did not keep the rain out.',
    ],
    es: [
      'Seis días caminando junto a un muro que ahora es casi todo zanja.',
      'Fortines cada milla, muchas ovejas y mucho viento. El muro llega a la cintura donde queda algo.',
      'Los romanos lo levantaron de lado a lado de un país para que no entraran los del norte. La lluvia sí entró.',
    ],
  },
  Q134883: {
    country: ['Canada', 'Canadá'],
    en: [
      'Paid to lie on a glass floor and look down. Did not enjoy it, did not get a refund.',
      'A needle with a doughnut halfway up. A revolving restaurant that revolves very slowly.',
      'You can walk around the outside of it on a ledge, tied to a rail. Over a lake that looks like a sea. Hard no.',
    ],
    es: [
      'Pagué por tumbarme en un suelo de cristal y mirar hacia abajo. No lo disfruté y no me devolvieron el dinero.',
      'Una aguja con un dónut a media altura. Un restaurante giratorio que gira muy despacio.',
      'Puedes darle la vuelta por fuera sobre una cornisa, atado a un raíl. Sobre un lago que parece un mar. Ni hablar.',
    ],
  },
  Q160112: {
    country: ['Spain', 'España'],
    en: [
      'No photos inside. A guard followed me for a whole room in case I tried.',
      'Room after room of kings with long chins, saints and very dark paintings by one deaf painter.',
      'There is a famous painting of a princess and her maids where the painter put himself in. Show-off.',
    ],
    es: [
      'No se pueden hacer fotos. Un vigilante me siguió una sala entera por si acaso.',
      'Sala tras sala de reyes con barbilla larga, santos y cuadros muy oscuros de un pintor sordo.',
      'Hay un cuadro famoso de una princesa con sus damas donde el pintor se metió a sí mismo. Fanfarrón.',
    ],
  },
  Q129846: {
    country: ['Russia', 'Rusia'],
    en: [
      'Looks like a cake. Inside it is a maze of tiny chapels and narrow stairs.',
      'Every dome a different colour and pattern, twisted like ice cream. Very hard to photograph without a crowd.',
      'Stands at the end of the famous big square. Legend says the architect was blinded so he could never build anything better.',
    ],
    es: [
      'Parece una tarta. Dentro es un laberinto de capillitas y escaleras estrechas.',
      'Cada cúpula de un color y un dibujo, retorcidas como un helado. Imposible fotografiarla sin gente.',
      'Está al fondo de la famosa plaza grande. Dice la leyenda que cegaron al arquitecto para que no hiciera nada mejor.',
    ],
  },
  Q170495: {
    country: ['Turkey', 'Turquía'],
    en: [
      'Separate ticket for the harem. Separate queue for the treasury. Separate patience for both.',
      'Courtyards, tiled rooms and a dagger with three huge emeralds behind glass and a scrum of people.',
      'The sultans lived here for centuries on a point where a strait meets a golden horn. The terrace view is the best part.',
    ],
    es: [
      'Entrada aparte para el harén. Cola aparte para el tesoro. Paciencia aparte para los dos.',
      'Patios, salas de azulejos y una daga con tres esmeraldas enormes tras un cristal y una melé de gente.',
      'Los sultanes vivieron aquí siglos, en una punta donde un estrecho se junta con un cuerno de oro. Lo mejor, la terraza.',
    ],
  },
  Q29317: {
    country: ['Myanmar', 'Myanmar'],
    en: [
      'Over two thousand temples. I saw maybe nine before my e-bike died.',
      'A dusty plain full of brick temples and pagodas, with hot-air balloons drifting over at dawn.',
      'The balloons cost a fortune and I got the one balloon that went the wrong way. The temples did look nice from the ground.',
    ],
    es: [
      'Más de dos mil templos. Vi unos nueve antes de que se muriera la batería de mi bici eléctrica.',
      'Una llanura polvorienta llena de templos y pagodas de ladrillo, con globos aerostáticos flotando al amanecer.',
      'Los globos cuestan una fortuna y me tocó el único que fue en la dirección equivocada. Desde el suelo los templos se veían bien.',
    ],
  },
  Q160659: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Thirty minutes in a glass pod going round once. Felt like a very slow washing machine.',
      'A giant bicycle wheel on a riverbank. Could see a parliament, a palace and a lot of grey.',
      'Was supposed to be temporary for a millennium party. Still here, still turning, still not fast.',
    ],
    es: [
      'Treinta minutos en una cápsula de cristal dando una sola vuelta. Como una lavadora muy lenta.',
      'Una rueda de bicicleta gigante en la orilla de un río. Se veía un parlamento, un palacio y mucho gris.',
      'Iba a ser temporal para una fiesta de fin de milenio. Sigue aquí, sigue girando, sigue sin ir rápido.',
    ],
  },
  Q18068: {
    country: ['Italy', 'Italia'],
    en: [
      'Walked on the roof among dozens of spikes. The pigeons had better seats.',
      'White-pink marble lace with a forest of statues. The square in front is full of people feeding birds.',
      'Took six centuries to finish, next to a fancy glass-roofed shopping arcade where you spin on a bull for luck.',
    ],
    es: [
      'Paseé por el tejado entre docenas de pináculos. Las palomas tenían mejores asientos.',
      'Un encaje de mármol blanco rosado con un bosque de estatuas. La plaza de delante, llena de gente dando de comer a los pájaros.',
      'Tardaron seis siglos en terminarla, al lado de una galería de tiendas elegantes con techo de cristal donde giras sobre un toro para tener suerte.',
    ],
  },
  Q181185: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Ninety minutes in a queue for a two-minute ride. Then the same again. All day.',
      'A castle, a fake mountain with a bobsled, people in big animal costumes who are not allowed to talk.',
      'The very first park of its kind, opened by the man behind a famous cartoon mouse. The churros were the best part and they were twelve dollars.',
    ],
    es: [
      'Noventa minutos de cola para una atracción de dos. Y otra vez lo mismo. Todo el día.',
      'Un castillo, una montaña falsa con trineo y gente con disfraces de animales que no puede hablar.',
      'El primerísimo parque de su clase, abierto por el hombre detrás de un famoso ratón de dibujos. Lo mejor, los churros, a doce dólares.',
    ],
  },
  Q62939: {
    country: ['United Arab Emirates', 'Emiratos Árabes Unidos'],
    en: [
      'Could not even get past the gate without a restaurant booking.',
      'A hotel shaped like a sail on its own little island. Everything inside is gold, including the iPad.',
      'Calls itself a seven-star hotel, which is not a thing. There is a helipad where they once played tennis.',
    ],
    es: [
      'No pude pasar ni de la verja sin reserva en un restaurante.',
      'Un hotel con forma de vela en su propia islita. Todo dentro es dorado, incluido el iPad.',
      'Dice que es de siete estrellas, cosa que no existe. Tiene un helipuerto donde una vez jugaron al tenis.',
    ],
  },
  Q11812902: {
    country: ['Tanzania', 'Tanzania'],
    en: [
      'Bounced around in a jeep for eight hours. My spine is now shorter.',
      'Endless grass, a few flat-topped trees, and a lion who slept the entire time.',
      'Came for the great migration of a million wildebeest. They had migrated. Somewhere else.',
    ],
    es: [
      'Ocho horas dando botes en un todoterreno. Ahora mi columna es más corta.',
      'Hierba infinita, unas acacias de copa plana y un león que durmió todo el rato.',
      'Vine por la gran migración de un millón de ñus. Habían migrado. A otro sitio.',
    ],
  },
  Q54109: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Security check, then a film, then a guide who walked very fast.',
      'A white dome on a hill at the end of a long lawn of museums. The rotunda has a painting on the ceiling.',
      'The lawmakers of a whole country meet here and I did not see a single one. Lunch at the cafeteria was fine.',
    ],
    es: [
      'Control de seguridad, luego una película y luego una guía que andaba muy rápido.',
      'Una cúpula blanca en una colina al final de un largo césped de museos. La rotonda tiene un cuadro en el techo.',
      'Aquí se reúnen los legisladores de todo un país y no vi a ninguno. La comida de la cafetería, normal.',
    ],
  },
  Q11274: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'You cannot go up. You can stand in the lobby and look at the lifts. That is the tour.',
      'Shiny steel crown with triangle windows and eagle gargoyles. The prettiest skyscraper, if you like that sort of thing.',
      'Named after a car company and decorated like hubcaps. Briefly the tallest building in the world before a rival nearby.',
    ],
    es: [
      'No se puede subir. Puedes quedarte en el vestíbulo mirando los ascensores. Esa es la visita.',
      'Corona de acero brillante con ventanas triangulares y gárgolas de águila. El rascacielos más bonito, si te va eso.',
      'Lleva el nombre de una marca de coches y está decorado como tapacubos. Fue un rato el edificio más alto del mundo, hasta que un vecino lo superó.',
    ],
  },
  Q182147: {
    country: ['Russia', 'Rusia'],
    en: [
      'Three million objects and my feet gave up after about eleven.',
      'A long green-and-white palace on a river embankment, staircases of gold, rooms of malachite.',
      'Has its own team of cats living in the basement. The cats were the only ones not queuing.',
    ],
    es: [
      'Tres millones de objetos y mis pies se rindieron hacia el undécimo.',
      'Un palacio larguísimo verde y blanco junto a un río, escaleras doradas y salas de malaquita.',
      'Tiene su propio equipo de gatos viviendo en el sótano. Los gatos eran los únicos que no hacían cola.',
    ],
  },
  Q188754: {
    country: ['Japan', 'Japón'],
    en: [
      'Took off my shoes, climbed six floors of very steep wooden stairs in socks. Slippery.',
      'Bright white walls and layered roofs like a bird spreading its wings. Empty inside, just floorboards.',
      'Survived wars and earthquakes without burning down, unlike most of its kind. The cherry blossom crowds were less lucky.',
    ],
    es: [
      'Me quité los zapatos y subí seis plantas de escaleras de madera empinadísimas en calcetines. Resbaladizas.',
      'Muros de un blanco brillante y tejados escalonados como un ave con las alas abiertas. Dentro, vacío: solo tablones.',
      'Sobrevivió a guerras y terremotos sin arder, a diferencia de casi todos los de su clase. La gente de los cerezos en flor tuvo menos suerte.',
    ],
  },
  Q181172: {
    country: ['Guatemala', 'Guatemala'],
    en: [
      'Howler monkeys woke me at four. Not by choice, the jungle just does that.',
      'Steep stone temples poking out above the rainforest canopy. Climbing the wooden stairs was a workout.',
      'The view from the top was in a famous space film, as a rebel base. I did not see any spaceships.',
    ],
    es: [
      'Los monos aulladores me despertaron a las cuatro. No por gusto: la selva hace eso.',
      'Templos de piedra empinados asomando por encima de las copas de la selva. Subir las escaleras de madera fue un entrenamiento.',
      'La vista desde arriba salió en una famosa película espacial, como base rebelde. No vi naves.',
    ],
  },
  Q209217: {
    country: ['Zimbabwe', 'Zimbabue'],
    en: [
      'Hot climb up a hill of boulders to see more boulders.',
      'Curving dry-stone walls built without any mortar at all, and a tall conical tower with no door.',
      'The ruins gave their name to the whole country. The soapstone bird on the flag came from here.',
    ],
    es: [
      'Subida calurosa por una colina de rocas para ver más rocas.',
      'Muros curvos de piedra seca sin nada de argamasa y una torre cónica alta sin puerta.',
      'Las ruinas dieron nombre a todo el país. El pájaro de esteatita de la bandera salió de aquí.',
    ],
  },
  Q51252: {
    country: ['Italy', 'Italia'],
    en: [
      'Booked a slot, queued anyway, then queued inside for one painting.',
      'Long corridor of statues and room after room of saints, babies with wings and gold backgrounds.',
      'There is a famous painting of a goddess standing on a shell. Everyone stood in front of the shell.',
    ],
    es: [
      'Reservé hora, hice cola igual y luego cola dentro para un solo cuadro.',
      'Un pasillo larguísimo de estatuas y sala tras sala de santos, bebés con alas y fondos dorados.',
      'Hay un cuadro famoso de una diosa de pie sobre una concha. Todo el mundo estaba delante de la concha.',
    ],
  },
  Q5471: {
    country: ['Italy', 'Italia'],
    en: [
      'Paid a fortune for a box seat behind a pillar. Heard everything, saw a pillar.',
      'Plain outside, red velvet and gold inside, six tiers of boxes like a wedding cake.',
      'One of the most famous opera houses in the world, in a northern fashion city. The season opens on a saint’s day in December.',
    ],
    es: [
      'Pagué una fortuna por un palco detrás de una columna. Lo oí todo; vi una columna.',
      'Sencillo por fuera, terciopelo rojo y oro por dentro, seis pisos de palcos como una tarta de boda.',
      'Uno de los teatros de ópera más famosos del mundo, en una ciudad del norte muy de moda. La temporada abre un día de santo en diciembre.',
    ],
  },
  Q99236: {
    country: ['France', 'Francia'],
    en: [
      'Drove across it in thirty seconds. Paid a toll for thirty seconds.',
      'White pylons with fans of cables, standing above the clouds on misty mornings.',
      'The tallest bridge in the world by its masts, across a river valley in the south. The visitor centre had the better view.',
    ],
    es: [
      'Lo crucé en coche en treinta segundos. Peaje por treinta segundos.',
      'Pilones blancos con abanicos de cables, por encima de las nubes las mañanas de niebla.',
      'El puente más alto del mundo por sus mástiles, sobre el valle de un río del sur. El centro de visitantes tenía mejor vista.',
    ],
  },
  Q129143: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Fountains, a big column and pigeons. The pigeons were banned, the people were not.',
      'Four huge bronze lions you are not supposed to climb. Everyone climbs them.',
      'An admiral on top of a column so tall you cannot see his face. There is an empty plinth that gets a new modern art piece every few years.',
    ],
    es: [
      'Fuentes, una columna grande y palomas. Prohibieron las palomas; a la gente no.',
      'Cuatro leones de bronce enormes a los que no te puedes subir. Todo el mundo se sube.',
      'Un almirante en lo alto de una columna tan alta que no se le ve la cara. Hay un pedestal vacío que cada pocos años estrena obra moderna.',
    ],
  },
  Q11259: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Bright screens everywhere, at three in the morning. My eyes are still adjusting.',
      'People dressed as cartoon characters, a man in his underpants with a guitar, a red staircase to sit on.',
      'A ball drops here on New Year’s Eve. People wait twelve hours for it in the cold with no toilets. Not for me.',
    ],
    es: [
      'Pantallas brillantes por todas partes a las tres de la mañana. Mis ojos todavía se están adaptando.',
      'Gente disfrazada de dibujos animados, un señor en calzoncillos con una guitarra y una escalera roja para sentarse.',
      'En Nochevieja baja una bola. La gente la espera doce horas al frío y sin baños. Para mí no.',
    ],
  },
  Q213360: {
    country: ['South Africa', 'Sudáfrica'],
    en: [
      'Cable car closed for wind. Walked up instead. Took four hours. Cable car reopened when I got to the top.',
      'A mountain with a perfectly flat top, sometimes covered with a cloud they call the tablecloth.',
      'Looks down on a harbour city at the far tip of a continent. Funny little furry animals at the top that are related to elephants.',
    ],
    es: [
      'Teleférico cerrado por viento. Subí andando. Cuatro horas. Lo reabrieron justo cuando llegué arriba.',
      'Una montaña con la cima perfectamente plana, a veces cubierta por una nube a la que llaman el mantel.',
      'Domina una ciudad portuaria en la punta de un continente. Arriba hay unos bichitos peludos y graciosos que son parientes de los elefantes.',
    ],
  },
  Q57965: {
    country: ['Japan', 'Japón'],
    en: [
      'Two observation decks, two tickets. The higher one was in a cloud.',
      'A very tall slim tower, pale blue-white, lit in different colours each night.',
      'The tallest tower in the world, by a river in a giant capital. On clear days you can see a famous volcano. It was not clear.',
    ],
    es: [
      'Dos miradores, dos entradas. El de arriba estaba dentro de una nube.',
      'Una torre altísima y delgada, de un blanco azulado, iluminada de un color distinto cada noche.',
      'La torre más alta del mundo, junto a un río de una capital gigantesca. Los días despejados se ve un volcán famoso. No estaba despejado.',
    ],
  },
  Q125445: {
    country: ['China', 'China'],
    en: [
      'Early morning park full of people dancing and playing cards. I was not invited.',
      'A round hall with a triple blue roof on a white marble terrace. Round, then square, then round again.',
      'Emperors came here to pray for good harvests. There is a wall where whispers travel. Nobody whispered to me.',
    ],
    es: [
      'Un parque a primera hora lleno de gente bailando y jugando a las cartas. No me invitaron.',
      'Un salón redondo con un triple tejado azul sobre una terraza de mármol blanco. Redondo, luego cuadrado, luego redondo otra vez.',
      'Los emperadores venían a rezar por las buenas cosechas. Hay un muro por el que viajan los susurros. A mí nadie me susurró.',
    ],
  },
  Q173527: {
    country: ['Greece', 'Grecia'],
    en: [
      'The palace has been "reconstructed" with concrete and paint. So I mostly saw concrete.',
      'Red columns that are thinner at the bottom, which feels wrong. Dolphins painted on a wall.',
      'Supposedly where the labyrinth with the bull-man was. Not much of a maze. Found the exit in five minutes.',
    ],
    es: [
      'El palacio está «reconstruido» con hormigón y pintura. Así que vi sobre todo hormigón.',
      'Columnas rojas más finas por abajo, que parece estar mal. Delfines pintados en una pared.',
      'Se supone que aquí estaba el laberinto del hombre-toro. Poco laberinto. Encontré la salida en cinco minutos.',
    ],
  },
  Q189849: {
    country: ['Croatia', 'Croacia'],
    en: [
      'Walked in single file on wooden boardwalks for six hours. Overtaking is impossible.',
      'Sixteen lakes in a row, each spilling into the next. The water is a colour I did not think was legal.',
      'Swimming is forbidden. I just wanted to put my feet in. A ranger blew a whistle at me.',
    ],
    es: [
      'Seis horas en fila india por pasarelas de madera. Adelantar, imposible.',
      'Dieciséis lagos seguidos, cada uno derramándose en el siguiente. El agua es de un color que no creía legal.',
      'Prohibido bañarse. Solo quería meter los pies. Un guarda me pitó con un silbato.',
    ],
  },
  Q191739: {
    country: ['Italy', 'Italia'],
    en: [
      'Climbed four hundred and sixty-three steps between two shells of a dome. Claustrophobic.',
      'Green, white and pink marble stripes everywhere, a bell tower next door with even more steps.',
      'The red-tiled dome was the biggest in the world for centuries and nobody knew how to build it until one goldsmith worked it out.',
    ],
    es: [
      'Subí cuatrocientos sesenta y tres escalones entre las dos capas de una cúpula. Claustrofóbico.',
      'Rayas de mármol verde, blanco y rosa por todas partes y un campanario al lado con todavía más escalones.',
      'La cúpula de tejas rojas fue la más grande del mundo durante siglos y nadie sabía construirla hasta que un orfebre dio con ello.',
    ],
  },
  Q178114: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Tickets went in four minutes. Looked at it from the bottom.',
      'A giant white stone pencil in the middle of a lawn. The colour changes a third of the way up.',
      'They ran out of money halfway and the new stone did not match. Reflects nicely in a long pool, if the ducks allow.',
    ],
    es: [
      'Las entradas se agotaron en cuatro minutos. Lo vi desde abajo.',
      'Un lápiz gigante de piedra blanca en mitad de un césped. A un tercio de altura cambia de color.',
      'Se quedaron sin dinero a la mitad y la piedra nueva no pegaba. Se refleja bonito en un estanque largo, si los patos te dejan.',
    ],
  },
  Q54495: {
    country: ['Australia', 'Australia'],
    en: [
      'Paid a lot to climb an arch in a grey jumpsuit, clipped to a wire. They took my phone away.',
      'A big steel coat-hanger across a harbour. The trains rattle across it right next to you.',
      'The fireworks on New Year’s Eve go off from it. Next to a building with white sails that gets all the attention.',
    ],
    es: [
      'Pagué un dineral por escalar un arco con un mono gris, enganchado a un cable. Me quitaron el móvil.',
      'Una gran percha de acero sobre una bahía. Los trenes pasan traqueteando justo a tu lado.',
      'En Nochevieja los fuegos artificiales salen de él. Al lado de un edificio con velas blancas que se lleva toda la atención.',
    ],
  },
  Q179199: {
    country: ['Spain', 'España'],
    en: [
      'The building is the art, they said. The art inside was a giant rusty steel maze.',
      'Wavy titanium panels like fish scales on a riverbank. A huge dog made of flowers by the door.',
      'Turned a grey industrial port city in the north into a tourist spot overnight. There is a giant spider outside too.',
    ],
    es: [
      'El edificio es la obra de arte, decían. Dentro, el arte era un laberinto gigante de acero oxidado.',
      'Paneles de titanio ondulados como escamas de pez junto a una ría. En la puerta, un perro gigante de flores.',
      'Convirtió de la noche a la mañana una ciudad portuaria industrial y gris del norte en destino turístico. Fuera también hay una araña gigante.',
    ],
  },
  Q185382: {
    country: ['Italy', 'Italia'],
    en: [
      'Could not get within ten metres. Threw a coin over someone’s head. Hit someone’s head.',
      'Marble sea god with horses bursting out of a palace wall into a tiny square. Water very blue.',
      'One coin means you come back to the city, two means romance, three means marriage. I threw zero. They collect thousands a day.',
    ],
    es: [
      'No pude acercarme a menos de diez metros. Tiré una moneda por encima de una cabeza. Le di a una cabeza.',
      'Un dios del mar de mármol con caballos saliendo de la fachada de un palacio a una placita. Agua muy azul.',
      'Una moneda, vuelves a la ciudad; dos, romance; tres, boda. Yo tiré cero. Recogen miles al día.',
    ],
  },
  Q2620036: {
    country: ['Peru', 'Perú'],
    en: [
      'Paid for a tiny plane that tipped left and right for half an hour. Lost my breakfast.',
      'Giant drawings scratched into a desert: a monkey, a spider, a hummingbird. Only visible from the air.',
      'Nobody knows why they were made. Some people say aliens. My pilot said aliens. I said can we land.',
    ],
    es: [
      'Pagué una avioneta que se inclinó a un lado y a otro media hora. Perdí el desayuno.',
      'Dibujos gigantes rascados en un desierto: un mono, una araña, un colibrí. Solo se ven desde el aire.',
      'Nadie sabe por qué los hicieron. Hay quien dice que extraterrestres. Mi piloto dijo extraterrestres. Yo dije que si podíamos aterrizar.',
    ],
  },
  Q309436: {
    country: ['Morocco', 'Marruecos'],
    en: [
      'Walked across a river on sandbags. One sandbag was a lie.',
      'A village of mud-brick towers and walls climbing a hill, the same colour as the desert.',
      'Half the epic films and fantasy series in history were shot here. Kept expecting someone with a sword.',
    ],
    es: [
      'Crucé un río sobre sacos de arena. Uno de los sacos era mentira.',
      'Un pueblo de torres y murallas de adobe trepando por una colina, del mismo color que el desierto.',
      'Aquí se rodaron la mitad de las películas épicas y series de fantasía de la historia. Esperaba ver a alguien con una espada.',
    ],
  },
  Q4519: {
    country: ['Iran', 'Irán'],
    en: [
      'One of the biggest squares in the world and the horse carriages still nearly ran me over.',
      'Blue tiled domes on two sides, a palace with a terrace, a bazaar arch at the end. Gorgeous, sadly.',
      'Its name says it is half the world. Not half. Maybe a sixth. On the old polo ground the goalposts are still there.',
    ],
    es: [
      'Una de las plazas más grandes del mundo y aun así los coches de caballos casi me atropellan.',
      'Cúpulas de azulejo azul a dos lados, un palacio con terraza y el arco de un bazar al fondo. Preciosa, por desgracia.',
      'Su nombre dice que es la mitad del mundo. La mitad no. Un sexto, quizá. En lo que fue campo de polo siguen las porterías.',
    ],
  },
  Q513: {
    country: ['China / Nepal', 'China / Nepal'],
    en: [
      'Spent eight weeks and a small house’s worth of money to stand in a queue at the top.',
      'Base camp is a village of tents on a glacier. The top is a small pile of snow covered in prayer flags.',
      'Tallest mountain on the planet, on the border of two countries. Yaks carried my bags and judged me silently.',
    ],
    es: [
      'Ocho semanas y el precio de una casita para hacer cola en la cima.',
      'El campamento base es un pueblo de tiendas sobre un glaciar. La cima es un montoncito de nieve lleno de banderas de oración.',
      'La montaña más alta del planeta, en la frontera de dos países. Los yaks me llevaron las bolsas y me juzgaron en silencio.',
    ],
  },
  Q47611: {
    country: ['Turkey', 'Turquía'],
    en: [
      'Marble street so polished by feet it is basically an ice rink in sandals.',
      'A two-storey library façade, a giant theatre and ancient public toilets in a row. No privacy then either.',
      'Once had one of the seven wonders, a temple to a huntress. Now one column remains, with a stork on top.',
    ],
    es: [
      'Una calle de mármol tan pulida por los pies que con sandalias es una pista de hielo.',
      'La fachada de dos pisos de una biblioteca, un teatro gigante y letrinas públicas antiguas en fila. Tampoco había intimidad entonces.',
      'Aquí estuvo una de las siete maravillas, un templo a una cazadora. Ahora queda una columna, con una cigüeña encima.',
    ],
  },
  Q194057: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Drove up to see the mountain and it was hidden by the mountain’s own weather.',
      'A huge snowy volcano with flower meadows at its feet. Marmots whistled at me. Rudely.',
      'Can be seen from a rainy coffee city on the one clear day a year. Locals just say "the mountain is out".',
    ],
    es: [
      'Subí en coche a ver la montaña y la tapaba el clima de la propia montaña.',
      'Un volcán nevado enorme con prados de flores a los pies. Las marmotas me silbaron. Con muy malos modos.',
      'Se ve desde una ciudad lluviosa y cafetera el único día despejado del año. Allí dicen «ha salido la montaña».',
    ],
  },
  Q205131: {
    country: ['China', 'China'],
    en: [
      'Queued two hours to walk down a cliff staircase next to a foot.',
      'A seated figure carved into a red cliff where three rivers meet. Its toenails are bigger than me.',
      'The biggest stone statue of its kind in the world, carved over ninety years. The boat view is quicker.',
    ],
    es: [
      'Dos horas de cola para bajar una escalera en un acantilado junto a un pie.',
      'Una figura sentada tallada en un acantilado rojo donde se juntan tres ríos. Sus uñas son más grandes que yo.',
      'La estatua de piedra más grande de su clase en el mundo, tallada durante noventa años. Desde el barco se ve antes.',
    ],
  },
  Q204871: {
    country: ['Czech Republic', 'República Checa'],
    en: [
      'Could not cross it at midday for the crowd. Crossed at six in the morning with the other photographers.',
      'A stone bridge lined with thirty dark statues, a tower at each end, a castle on the hill above.',
      'Touch the shiny bronze plaque for luck, they said. Everybody had touched it. It was not lucky for me.',
    ],
    es: [
      'A mediodía no se podía cruzar de tanta gente. Lo crucé a las seis de la mañana con los demás fotógrafos.',
      'Un puente de piedra con treinta estatuas oscuras, una torre en cada punta y un castillo en la colina de arriba.',
      'Toca la placa de bronce brillante para tener suerte, dijeron. La había tocado todo el mundo. A mí no me dio suerte.',
    ],
  },
  Q193369: {
    country: ['Czech Republic', 'República Checa'],
    en: [
      'A castle that is mostly courtyards and a church. Where are the turrets?',
      'Biggest ancient castle complex in the world. A tiny street of little coloured houses where a writer lived.',
      'Watched the changing of the guard, then walked down hundreds of steps to a bridge full of statues.',
    ],
    es: [
      'Un castillo que es casi todo patios y una catedral. ¿Dónde están los torreones?',
      'El mayor conjunto de castillo antiguo del mundo. Una callejuela de casitas de colores donde vivió un escritor.',
      'Vi el cambio de guardia y luego bajé cientos de escalones hasta un puente lleno de estatuas.',
    ],
  },
  Q131330: {
    country: ['Austria', 'Austria'],
    en: [
      'The audio guide was longer than the palace. And the palace is long.',
      'A huge yellow summer palace, a hill with a colonnade on top, and a maze I got stuck in.',
      'An empress with very long hair lived here. The oldest zoo in the world is in the garden. Nice pandas.',
    ],
    es: [
      'La audioguía era más larga que el palacio. Y el palacio es largo.',
      'Un palacio de verano amarillo enorme, una colina con una columnata arriba y un laberinto en el que me quedé atrapado.',
      'Aquí vivió una emperatriz con el pelo larguísimo. En el jardín está el zoo más antiguo del mundo. Pandas majos.',
    ],
  },
  Q172988: {
    country: ['Italy', 'Italia'],
    en: [
      'No bags allowed, the bag storage is somewhere else, the queue was in a flood.',
      'Gold mosaics on every surface, five domes, four bronze horses on the balcony.',
      'Stands on a square that floods at high tide. They put out little tables to walk on. I fell off one.',
    ],
    es: [
      'No se puede entrar con mochila, la consigna está en otro sitio y la cola estaba inundada.',
      'Mosaicos dorados en todas las superficies, cinco cúpulas y cuatro caballos de bronce en el balcón.',
      'Está en una plaza que se inunda con la marea alta. Ponen unas mesitas para andar por encima. Me caí de una.',
    ],
  },
  Q189883: {
    country: ['Italy', 'Italia'],
    en: [
      'Room after room of enormous paintings of old men in red robes looking pleased with themselves.',
      'Pink and white diamond-patterned walls on top of a row of arches. Prison cells across a little bridge.',
      'Prisoners crossed that bridge and sighed at their last view of the lagoon. I sighed at the ticket price.',
    ],
    es: [
      'Sala tras sala de cuadros enormes de señores mayores con túnicas rojas muy satisfechos de sí mismos.',
      'Muros con rombos rosas y blancos encima de una fila de arcos. Las celdas, al otro lado de un puentecito.',
      'Los presos cruzaban ese puente y suspiraban al ver la laguna por última vez. Yo suspiré al ver el precio.',
    ],
  },
  Q14452: {
    country: ['Chile', 'Chile'],
    en: [
      'Five hours on a plane over nothing but sea, to the most remote inhabited place I have ever been.',
      'Giant stone heads all over the island, mostly with their backs to the ocean. Rude.',
      'Hundreds of statues with long faces and some with red stone hats. They have bodies underground, apparently. Did not see the bodies.',
    ],
    es: [
      'Cinco horas de avión sobre nada más que mar, al lugar habitado más remoto en el que he estado.',
      'Cabezas de piedra gigantes por toda la isla, casi todas de espaldas al océano. Qué maleducadas.',
      'Cientos de estatuas de cara alargada, algunas con sombreros de piedra roja. Dicen que tienen cuerpo bajo tierra. No vi los cuerpos.',
    ],
  },
  Q106187: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'Wet rocks by the sea. Slipped on a wet rock by the sea.',
      'Tens of thousands of hexagonal stone columns like a honeycomb going into the waves.',
      'Legend says a giant built it to walk across the sea to fight another giant. The visitor centre car park costs a giant amount.',
    ],
    es: [
      'Rocas mojadas junto al mar. Me resbalé en una roca mojada junto al mar.',
      'Decenas de miles de columnas de piedra hexagonales, como un panal metiéndose en las olas.',
      'La leyenda dice que un gigante lo construyó para cruzar el mar y pelearse con otro gigante. El aparcamiento cuesta un dineral gigante.',
    ],
  },
  Q180901: {
    country: ['Belgium', 'Bélgica'],
    en: [
      'Escalators inside metal balls. Felt like being inside a pinball machine, without the fun.',
      'Nine shiny spheres joined by tubes, shaped like a crystal of iron blown up enormously.',
      'Built for a world fair in a city better known for waffles, chocolate and a tiny statue of a boy doing his business.',
    ],
    es: [
      'Escaleras mecánicas dentro de bolas de metal. Como estar dentro de una máquina de pinball, pero sin gracia.',
      'Nueve esferas brillantes unidas por tubos, con la forma de un cristal de hierro ampliado muchísimas veces.',
      'Lo hicieron para una exposición universal en una ciudad más conocida por los gofres, el chocolate y la estatuilla de un niño haciendo pis.',
    ],
  },
  Q212867: {
    country: ['Spain', 'España'],
    en: [
      'You need a timed ticket for the nice bit of a park. A park.',
      'Gingerbread houses, a long wavy bench covered in broken tiles, and a mosaic lizard everyone queues to touch.',
      'Was meant to be a housing estate on a hill and only two houses sold. Same architect as the unfinished church down the road.',
    ],
    es: [
      'Necesitas entrada con hora para la parte bonita de un parque. De un parque.',
      'Casitas de cuento, un banco ondulado larguísimo cubierto de azulejos rotos y un lagarto de mosaico con cola para tocarlo.',
      'Iba a ser una urbanización en una colina y solo se vendieron dos casas. El mismo arquitecto que la iglesia sin terminar de más abajo.',
    ],
  },
  Q7343: {
    country: ['Australia', 'Australia'],
    en: [
      'Two hours on a boat being seasick to look at fish through a mask that leaked.',
      'Visible from space, unlike some walls I could mention. Had to wear a full-body suit against jellyfish.',
      'The biggest living structure on the planet, off a north-eastern coast. Fewer colourful fish than the cartoon promised.',
    ],
    es: [
      'Dos horas mareado en un barco para ver peces a través de unas gafas que hacían agua.',
      'Se ve desde el espacio, al contrario que ciertas murallas. Tuve que ponerme un traje entero contra las medusas.',
      'La mayor estructura viva del planeta, frente a una costa del noreste. Menos peces de colores de los que prometía la película de dibujos.',
    ],
  },
  Q76122: {
    country: ['Bolivia', 'Bolivia'],
    en: [
      'White as far as you can see. Forgot sunglasses. Saw purple for a day.',
      'A flat salt plain so big the horizon disappears. Everyone takes silly perspective photos with a toy dinosaur.',
      'In the rainy season it becomes a giant mirror of the sky. Came in the dry season. Just salt, at nearly four thousand metres.',
    ],
    es: [
      'Blanco hasta donde alcanza la vista. Olvidé las gafas de sol. Lo vi todo morado un día.',
      'Una llanura de sal tan grande que desaparece el horizonte. Todo el mundo hace fotos de perspectiva tontas con un dinosaurio de juguete.',
      'En época de lluvias se convierte en un espejo gigante del cielo. Fui en la seca. Solo sal, a casi cuatro mil metros.',
    ],
  },
  Q367943: {
    country: ['Argentina', 'Argentina'],
    en: [
      'Waited three hours on a cold walkway for a chunk of ice to fall. It fell while I was buying a coffee.',
      'A wall of blue ice seventy metres high, creaking and cracking like an old house.',
      'One of the few glaciers in the world that is not shrinking, in the far south near a town named after a berry bush. Stubborn ice.',
    ],
    es: [
      'Tres horas en una pasarela helada esperando a que cayera un trozo de hielo. Cayó mientras compraba un café.',
      'Una pared de hielo azul de setenta metros de alto que cruje y se agrieta como una casa vieja.',
      'Uno de los pocos glaciares del mundo que no encoge, en el sur del todo, cerca de un pueblo con nombre de arbusto de bayas. Hielo testarudo.',
    ],
  },
  Q244947: {
    country: ['Spain', 'España'],
    en: [
      'Arches. Then more arches. Then a roast suckling pig restaurant right underneath.',
      'Two tiers of granite arches across a city square, held together with no mortar at all.',
      'The Romans built it to carry water and the devil supposedly finished it in one night. The devil did a good job.',
    ],
    es: [
      'Arcos. Luego más arcos. Luego un restaurante de cochinillo justo debajo.',
      'Dos pisos de arcos de granito cruzando una plaza, sin nada de argamasa.',
      'Lo hicieron los romanos para traer agua y dicen que el diablo lo terminó en una noche. El diablo hizo buen trabajo.',
    ],
  },
  Q215003: {
    country: ['Portugal', 'Portugal'],
    en: [
      'Very small tower with a very large queue. The spiral staircase is one-way with a traffic light.',
      'White stone, little rope carvings and a rhinoceros head on the wall, standing in a river.',
      'Explorers sailed out from here to find sea routes. Better custard tarts a five-minute walk away.',
    ],
    es: [
      'Torre muy pequeña con cola muy grande. La escalera de caracol es de sentido único con semáforo.',
      'Piedra blanca, cuerdas talladas y una cabeza de rinoceronte en la pared, en mitad de un río.',
      'Desde aquí zarpaban los exploradores en busca de rutas por mar. A cinco minutos andando, mejores pasteles de nata.',
    ],
  },
  Q180376: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Hiked an hour up a dry hill to stand behind a fence and see the back of some letters.',
      'Nine giant white letters on a hillside. You are not allowed near them. A helicopter watches.',
      'Originally an advert for a housing estate with four more letters. Below it: a city of films and traffic.',
    ],
    es: [
      'Una hora subiendo un cerro seco para quedarme detrás de una valla viendo el reverso de unas letras.',
      'Nueve letras blancas gigantes en una ladera. No te puedes acercar. Un helicóptero vigila.',
      'Al principio era el anuncio de una urbanización y tenía cuatro letras más. Debajo, una ciudad de películas y atascos.',
    ],
  },
  Q212065: {
    country: ['United Kingdom', 'Reino Unido'],
    en: [
      'A cannon fires at one o’clock every day. Nobody warned me. I dropped my scone.',
      'A fortress on top of an extinct volcano, with a cobbled street running down to a palace.',
      'The crown jewels of a northern kingdom and a stone that kings were crowned on. Bagpipes at the gate. All day.',
    ],
    es: [
      'Todos los días a la una disparan un cañón. Nadie me avisó. Se me cayó el scone.',
      'Una fortaleza encima de un volcán extinto, con una calle empedrada que baja hasta un palacio.',
      'Las joyas de la corona de un reino del norte y una piedra sobre la que se coronaba a los reyes. Gaitas en la puerta. Todo el día.',
    ],
  },
  Q214619: {
    country: ['Denmark', 'Dinamarca'],
    en: [
      'Smaller than my nephew. Walked forty minutes in the wind for this.',
      'A little bronze statue of a girl with a fish tail, sitting on a rock by a grey harbour.',
      'From a sad fairy tale by a famous local writer. Has lost her head twice to vandals. Kept it the day I visited.',
    ],
    es: [
      'Más pequeña que mi sobrino. Cuarenta minutos andando con viento para esto.',
      'Una estatuilla de bronce de una chica con cola de pez, sentada en una roca junto a un puerto gris.',
      'Sale de un cuento triste de un escritor famoso de allí. Le han cortado la cabeza dos veces. El día que fui la tenía.',
    ],
  },
  Q210722: {
    country: ['Brazil', 'Brasil'],
    en: [
      'Two cable cars to the top of a rock. The second one was full of monkeys looking for snacks.',
      'A smooth granite dome rising straight out of a bay, next to beaches full of volleyball.',
      'Named because it looks like a loaf of something sweet. Faces a giant statue with open arms across the city.',
    ],
    es: [
      'Dos teleféricos hasta lo alto de una roca. En el segundo había monos buscando comida.',
      'Una cúpula de granito lisa que sale recta de una bahía, junto a playas llenas de voleibol.',
      'Se llama así porque parece un pan de algo dulce. Frente a ella, al otro lado de la ciudad, una estatua gigante con los brazos abiertos.',
    ],
  },
  Q23883: {
    country: ['Israel / Jordan / Palestine', 'Israel / Jordania / Palestina'],
    en: [
      'Got water in my eye. It was the worst pain of my life. Do not get it in your eye.',
      'Floated on my back reading a newspaper, like everyone. Then covered myself in black mud, like everyone.',
      'The lowest point on land on Earth, so salty nothing lives in it. The name tells you that much.',
    ],
    es: [
      'Me entró agua en un ojo. El peor dolor de mi vida. Que no te entre en el ojo.',
      'Floté boca arriba leyendo el periódico, como todos. Luego me embadurné de barro negro, como todos.',
      'El punto más bajo de tierra firme del planeta, tan salado que nada vive en él. El nombre ya lo avisa.',
    ],
  },
  Q239477: {
    country: ['Ireland', 'Irlanda'],
    en: [
      'Wind so strong I was blown back to the car park. Twice.',
      'Two hundred metres of dark cliffs dropping straight into the Atlantic, full of puffins and fog.',
      'Was in a film about a boy wizard, as a cave. The rain here has rain inside it.',
    ],
    es: [
      'Un viento tan fuerte que me devolvió al aparcamiento. Dos veces.',
      'Doscientos metros de acantilados oscuros cayendo en vertical al Atlántico, llenos de frailecillos y niebla.',
      'Salió en una película de un niño mago, como cueva. Aquí la lluvia lleva lluvia dentro.',
    ],
  },
  Q271466: {
    country: ['Iceland', 'Islandia'],
    en: [
      'Paid to go up a church tower to look at very colourful roofs in the rain.',
      'Concrete stepped like basalt columns, a huge organ inside, a statue of a Viking explorer outside.',
      'Tallest church in a small capital near the Arctic Circle. Took forty years to build. Midnight sun kept me awake.',
    ],
    es: [
      'Pagué por subir a la torre de una iglesia para ver tejados de colores bajo la lluvia.',
      'Hormigón escalonado como columnas de basalto, un órgano enorme dentro y fuera la estatua de un explorador vikingo.',
      'La iglesia más alta de una pequeña capital cerca del círculo polar. Tardaron cuarenta años. El sol de medianoche no me dejó dormir.',
    ],
  },
  Q5317: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'The rotating glass floor turned so slowly I thought I was dizzy.',
      'A tower that looks like a flying saucer on stilts, built for a world fair about the future.',
      'Rainy coffee city, snowy volcano in the background, invisible behind clouds as usual.',
    ],
    es: [
      'El suelo de cristal giratorio iba tan despacio que creí que me mareaba.',
      'Una torre que parece un platillo volante sobre zancos, construida para una exposición universal sobre el futuro.',
      'Ciudad lluviosa y cafetera, volcán nevado al fondo, invisible tras las nubes como siempre.',
    ],
  },
  Q548679: {
    country: ['Singapore', 'Singapur'],
    en: [
      'The famous swimming pool is for hotel guests only. Looked at it from the outside, like a peasant.',
      'Three towers with a giant surfboard balanced on top. A casino, a mall, a canal with little boats.',
      'Light show over the bay every night, metal supertrees in a garden nearby. A city-state that fines you for chewing gum.',
    ],
    es: [
      'La famosa piscina es solo para clientes del hotel. La miré desde fuera, como un plebeyo.',
      'Tres torres con una tabla de surf gigante encima. Un casino, un centro comercial y un canal con barquitas.',
      'Espectáculo de luces sobre la bahía cada noche y superárboles metálicos en un jardín cercano. Una ciudad-estado que multa por mascar chicle.',
    ],
  },
  Q2027162: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Squeezed into a tiny egg-shaped pod with four strangers for a four-minute ride up a curve.',
      'A giant stainless-steel arch by a muddy river, as tall as it is wide. The windows at the top are tiny.',
      'Celebrates the pioneers who set off west from here. On a hot day the steel is too bright to look at.',
    ],
    es: [
      'Encajado en una cápsula diminuta con forma de huevo con cuatro desconocidos, cuatro minutos subiendo por una curva.',
      'Un arco gigante de acero inoxidable junto a un río embarrado, tan alto como ancho. Las ventanas de arriba son minúsculas.',
      'Homenajea a los pioneros que partían de aquí hacia el oeste. En un día de calor el acero brilla tanto que no se puede mirar.',
    ],
  },
  Q745608: {
    country: ['United States', 'Estados Unidos'],
    en: [
      'Walked one block. It took an hour and cost me a hundred dollars somehow.',
      'A fake volcano, a fake canal with gondolas, a fake tower, fountains dancing to music. All in a desert.',
      'Gambling, buffets and weddings by someone dressed as a famous singer. No clocks anywhere. Lost a day.',
    ],
    es: [
      'Anduve una manzana. Tardé una hora y no sé cómo me costó cien dólares.',
      'Un volcán falso, un canal falso con góndolas, una torre falsa y fuentes que bailan con música. Todo en un desierto.',
      'Apuestas, bufés y bodas oficiadas por alguien disfrazado de cantante famoso. Ni un reloj. Perdí un día.',
    ],
  },
};
