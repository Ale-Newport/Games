/** Secret words for #207 Word Warmth: everyday nouns, verbs and adjectives (all in the vocabulary). */
export const SECRETS =
  `ability accident account action adventure advice afraid agree alarm alive ancient angry animal
answer anxious apartment argue arrive attack attention audience autumn average awake balance bargain
beautiful believe benefit bitter blame blind borrow brave breathe brief bright broken budget build busy
calm career careful celebrate challenge champion chance change charity cheap chemistry choose clean clever
climate climb collect comfort common complain confident confuse connect courage create crowd cruel
curious damage danger dark decide deep defend delicate deliver describe design destroy develop difficult
discover distance divide dizzy doubt dream drive early earn easy economy education effort empty enemy
energy enjoy enormous escape evidence exact excited expensive experience explain explore fair faith famous
fancy fear fierce final flat float follow foreign forget forgive fortune freedom fresh friendly frozen
funny future gentle gather generous genius gift glory grateful greedy grief guilty habit happy harmony
harvest healthy heavy hidden history holiday honest hope horrible huge humble hungry identity imagine
improve innocent invent invite journey judge justice kind knowledge language laugh lazy lesson liberty
lonely loud loyal lucky luxury machine magic marry memory message mild miracle mistake modern moment
mystery narrow nature nervous noble noise normal obvious offer opinion ordinary patient peace perfect
permit pleasure polite poor popular power predict pretend pride private promise protect proud punish
quiet quick rare reason record relax remember repair rescue respect rich risk romance rough rumor
sacred safe scared science secret selfish serious shadow shallow share sharp shy silent simple sincere
skill slow smart smooth soft solve sorrow spirit splendid steady strange strength strict strong stupid
success sudden suffer summit support surprise survive sweet symbol talent teach tender terrible thick
thin thirsty tired tradition travel trust truth ugly victory violent visible voyage warm weak wealth
weird wild wisdom wonder worry young`
    .split(/\s+/)
    .filter(Boolean);

/**
 * Secret words for #207 Word Warmth in Spanish: everyday nouns, verbs and adjectives (all in the
 * Spanish vocabulary).
 */
export const SECRETS_ES =
  `abrazo abuelo accidente acuerdo adivinar admirar aire alegre alegría alma amable amargo amigo amor
ancho anciano animal antiguo aprender árbol arriesgar ataque aventura ayuda bailar bajo barato
batalla belleza beso bondad bonito borde brillante broma buscar caer calma calor cambio caminar
cansado cantar capaz carrera castigo celebrar cerca cielo claro cocinar comer compartir comprar
confianza conocer consejo contento correr costumbre crecer creer crisis cuento cuidado culpa curar
débil decidir defensa deseo despertar destino dinero dolor dormir dudar dulce duro elegir enemigo
enfadado enorme enseñar error escapar escribir esfuerzo esperanza espíritu éxito extraño fácil fama
familia famoso feliz fiesta fiel flor frágil frío fuerte fuerza futuro ganar generoso gente gigante
gloria gritar guerra hambre héroe historia hogar honesto honor huir humilde idea idioma imaginar
invierno joven jugar justicia lejos lento leyenda libertad libre limpio llorar lluvia loco lucha luz
madre magia malo mañana mar memoria mentira miedo milagro misterio moda montaña muerte música nacer
naturaleza noche nuevo obedecer océano odio olvidar orgullo paciencia padre paisaje palabra paz
peligro pensar perder perdón pobre poder poema premio primavera prisa promesa proteger pueblo puro
rápido raro recordar regalo reír respeto riesgo rico ruido sabio sabor salud salvaje sangre secreto
seguro silencio sombra sonrisa sorpresa sueño suerte tarde temer tesoro tierra tímido tormenta
trabajo tradición traición tranquilo triste valiente valor vecino veloz venganza verano verdad viaje
victoria vida viejo viento viajar volar voz`
    .split(/\s+/)
    .filter(Boolean);

/** The secret list for a vector language. */
export const secretsFor = (lang: 'en' | 'es'): readonly string[] =>
  lang === 'es' ? SECRETS_ES : SECRETS;
