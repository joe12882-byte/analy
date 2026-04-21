import { LearningUnit } from '../types';

export const LEARNING_UNITS: LearningUnit[] = [
  // MODO PROFESIONAL
  {
    id: 'b-p1',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Hey, welcome in! What are we doing for you today?",
    phrase_es: "Hola, ¡bienvenido! ¿Qué te hacemos hoy?",
    phonetic_tactic: "Jei, uélcom in! Uat ar ui dúing for iu tudéi?",
    grammar_tag: "greeting",
    difficulty: 1,
    learning_tips: ["Usa 'we' en lugar de 'I' para incluir al cliente y sonar más amigable. (Present Continuous para planes inmediatos)"]
  },
  {
    id: 'b-p2',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Good morning. Welcome. How can I help you today?",
    phrase_es: "Buenos días. Bienvenido. ¿Cómo puedo ayudarte hoy?",
    phonetic_tactic: "Gud mórning. Uélcom. Jau can ái jelp iu tudéi?",
    grammar_tag: "modal-can",
    difficulty: 1,
    learning_tips: ["Saludo formal. 'How can I help' suena profesional y cercano."]
  },
  {
    id: 'b-p3',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "How would you like your haircut today?",
    phrase_es: "¿Cómo te gustaría tu corte hoy?",
    phonetic_tactic: "Jau wud iu láik iur jérkot tudéi?",
    grammar_tag: "would-like",
    difficulty: 1,
    learning_tips: ["'Would you like' es mucho más cortés que 'do you want'."]
  },
  {
    id: 'b-p4',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Just a trim or changing the style?",
    phrase_es: "¿Solo un despunte o cambiamos el estilo?",
    phonetic_tactic: "Yost a trim or chéinying de stáil?",
    grammar_tag: "or-question",
    difficulty: 1,
    learning_tips: ["Oferta binaria clara: así el cliente decide rápido."]
  },
  {
    id: 'b-p5',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "So you want a fade on the sides?",
    phrase_es: "¿Entonces quieres un degradado a los lados?",
    phonetic_tactic: "Sou iu uant a féid on de sáids?",
    grammar_tag: "confirmation",
    difficulty: 1,
    learning_tips: ["'Fade' = degradado. Palabra clave para confirmar estilo."]
  },
  {
    id: 'b-p6',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Low fade, right? Starting around here.",
    phrase_es: "Degradado bajo, ¿cierto? Empezando por aquí.",
    phonetic_tactic: "Lou féid, ráit? Stárting aráund jíer.",
    grammar_tag: "tag-question",
    difficulty: 3,
    learning_tips: ["Low/Mid/High fade indica dónde empieza el degradado."]
  },
  {
    id: 'b-p7',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Skin fade, so down to the skin?",
    phrase_es: "¿Degradado a piel, o sea hasta abajo?",
    phonetic_tactic: "Skin féid, sou dáun tu de skin?",
    grammar_tag: "confirmation",
    difficulty: 3,
    learning_tips: ["Confirma siempre antes de cortar a piel."]
  },
  {
    id: 'b-p8',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Just a taper on the back and sides?",
    phrase_es: "¿Solo un taper atrás y a los lados?",
    phonetic_tactic: "Yost a téiper on de bak and sáids?",
    grammar_tag: "taper",
    difficulty: 3,
    learning_tips: ["'Taper' = rebaja gradual sin degradado marcado."]
  },
  {
    id: 'b-p9',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Number 2 on the sides, got it.",
    phrase_es: "Del número 2 a los lados, entendido.",
    phonetic_tactic: "Námber tú on de sáids, gót it.",
    grammar_tag: "clipper-guard",
    difficulty: 1,
    learning_tips: ["Los números son las guardas. 'Got it' = entendido."]
  },
  {
    id: 'b-p10',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Do you want a lineup too?",
    phrase_es: "¿También quieres que te marque el contorno?",
    phonetic_tactic: "Du iu uant a láinop tu?",
    grammar_tag: "lineup",
    difficulty: 1,
    learning_tips: ["'Lineup' o 'edge up' = marcar contornos."]
  },
  {
    id: 'b-p11',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Do you have a picture I can see?",
    phrase_es: "¿Tienes una foto que pueda ver?",
    phonetic_tactic: "Du iu jáv a pícchur ái can sí?",
    grammar_tag: "question",
    difficulty: 1,
    learning_tips: ["Si no entiendes el slang, pide foto: evita errores."]
  },
  {
    id: 'b-p12',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "How's the length on the sides?",
    phrase_es: "¿Qué tal el largo a los lados?",
    phonetic_tactic: "Jáus de lenz on de sáids?",
    grammar_tag: "how-question",
    difficulty: 1,
    learning_tips: ["Chequeo de progreso. Usa 'length' = largo."]
  },
  {
    id: 'b-p13',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Too high, too low, or is this good?",
    phrase_es: "¿Muy alto, muy bajo, o así está bien?",
    phonetic_tactic: "Tu jái, tu lou, or is dis gud?",
    grammar_tag: "or-question",
    difficulty: 1,
    learning_tips: ["Opciones claras = decisiones rápidas."]
  },
  {
    id: 'b-p14',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Could you tilt your head down a bit?",
    phrase_es: "¿Podrías inclinar tu cabeza un poco hacia abajo?",
    phonetic_tactic: "Kud iu tilt iur jed daun a bit?",
    grammar_tag: "polite-request",
    difficulty: 1,
    learning_tips: ["Regla de oro: nunca digas 'Put your head down'. Siempre 'Could you…'."]
  },
  {
    id: 'b-p15',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Chin up for me, please.",
    phrase_es: "Barbilla arriba, por favor.",
    phonetic_tactic: "Chin op for mi, plíz.",
    grammar_tag: "polite-request",
    difficulty: 1,
    learning_tips: ["'For me' + 'please' hace sonar suave la orden."]
  },
  {
    id: 'b-p16',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "How would you like to pay today?",
    phrase_es: "¿Cómo te gustaría pagar hoy?",
    phonetic_tactic: "Jau wud iu láik tu péi tudéi?",
    grammar_tag: "would-like",
    difficulty: 1,
    learning_tips: ["Frase segura para pregunta incómoda del pago."]
  },
  {
    id: 'b-p17',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "That'll be $25.",
    phrase_es: "Serán $25.",
    phonetic_tactic: "Dátl bi tuenti-fáiv dólars.",
    grammar_tag: "future-contracted",
    difficulty: 1,
    learning_tips: ["'That will be' = precio total, común en EE.UU."]
  },
  {
    id: 'b-p18',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Would you like a receipt?",
    phrase_es: "¿Quieres un recibo?",
    phonetic_tactic: "Wud iu láik a risít?",
    grammar_tag: "would-like",
    difficulty: 1,
    learning_tips: ["Ofrece recibo SIEMPRE = profesionalismo."]
  },
  {
    id: 'b-p19',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "You're all set. Looks good!",
    phrase_es: "Listo. ¡Se ve bien!",
    phonetic_tactic: "Iur ol set. Luks gud!",
    grammar_tag: "idiom-all-set",
    difficulty: 1,
    learning_tips: ["'All set' = terminado. Muy usado en servicio."]
  },
  {
    id: 'b-p20',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Want to book your next appointment?",
    phrase_es: "¿Quieres agendar tu próxima cita?",
    phonetic_tactic: "Uánt tu buk iur nekst apóinment?",
    grammar_tag: "want-to",
    difficulty: 1,
    learning_tips: ["'Book' = reservar/agendar. Retiene clientes."]
  },
  {
    id: 'b-p21',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Thanks for coming in. Have a great day!",
    phrase_es: "Gracias por venir. ¡Que tengas un gran día!",
    phonetic_tactic: "Zénks for kóming in. Jáv a gréit déi!",
    grammar_tag: "farewell",
    difficulty: 1,
    learning_tips: ["Despedida profesional + deseo positivo."]
  },
  {
    id: 'b-p22',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Thanks, I appreciate it.",
    phrase_es: "Gracias, lo aprecio.",
    phonetic_tactic: "Zénks, ái aprísheit it.",
    grammar_tag: "tipping-culture",
    difficulty: 1,
    learning_tips: ["En EE.UU. agradece la propina así — no uses 'thank you so much', suena exagerado."]
  },

  // MODO SUPERVIVENCIA
  {
    id: 'b-s1',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "Sorry, can you say that again?",
    phrase_es: "Perdón, ¿puedes decir eso otra vez?",
    phonetic_tactic: "Sóri, can iu sei dat agén?",
    grammar_tag: "polite-request",
    difficulty: 1,
    learning_tips: ["Decir 'What?' a secas suena rudo. Siempre agrega 'Sorry'."]
  },
  {
    id: 'b-s2',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "Can you speak a little slower?",
    phrase_es: "¿Puedes hablar un poco más lento?",
    phonetic_tactic: "Can iu spik a lítl slóuer?",
    grammar_tag: "modal-can",
    difficulty: 1,
    learning_tips: ["Herramienta clave cuando no entiendes."]
  },
  {
    id: 'b-s3',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "I didn't catch that.",
    phrase_es: "No entendí eso.",
    phonetic_tactic: "Ái didnt kách dat.",
    grammar_tag: "idiom",
    difficulty: 1,
    learning_tips: ["'Catch' = captar/entender. Suena muy natural."]
  },
  {
    id: 'b-s4',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "Let me make sure I got this.",
    phrase_es: "Déjame asegurarme de que entendí.",
    phonetic_tactic: "Let mi méik shur ái gót dis.",
    grammar_tag: "let-me",
    difficulty: 3,
    learning_tips: ["Repetir para confirmar da profesionalismo."]
  },
  {
    id: 'b-s5',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "My bad. Let me fix that for you.",
    phrase_es: "Fue mi error. Déjame arreglarlo.",
    phonetic_tactic: "Mái bad. Let mi fiks dat for iu.",
    grammar_tag: "apology",
    difficulty: 1,
    learning_tips: ["'My bad' = versión casual de 'I'm sorry'. Humaniza el error."]
  },
  {
    id: 'b-s6',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "No charge for the fix.",
    phrase_es: "No cobro por el arreglo.",
    phonetic_tactic: "Nou charch for de fiks.",
    grammar_tag: "negation",
    difficulty: 1,
    learning_tips: ["Gesto que salva la relación con el cliente."]
  },
  {
    id: 'b-s7',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "Got it. You want a sharp lineup.",
    phrase_es: "Entendido. Quieres un contorno bien marcado.",
    phonetic_tactic: "Gót it. Iu uánt a sharp láinop.",
    grammar_tag: "slang-response",
    difficulty: 3,
    learning_tips: ["Cliente dice 'Keep it crispy' = líneas marcadas. Responde así."]
  },
  {
    id: 'b-s8',
    profession_id: 'barber',
    category: 'survival',
    phrase_en: "I got you. We'll clean it up nice.",
    phrase_es: "Te tengo. Lo dejaremos bien limpio.",
    phonetic_tactic: "Ái gót iu. Uil klin it op náis.",
    grammar_tag: "slang-response",
    difficulty: 3,
    learning_tips: ["'I got you' = confianza. Se usa muchísimo en servicios."]
  },

  // MODO SOCIAL
  {
    id: 'b-soc1',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "Busy day today?",
    phrase_es: "¿Día ocupado hoy?",
    phonetic_tactic: "Bízi déi tudéi?",
    grammar_tag: "small-talk",
    difficulty: 1,
    learning_tips: ["Rompehielos seguro: trabajo + tiempo."]
  },
  {
    id: 'b-soc2',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "You from around here?",
    phrase_es: "¿Eres de por aquí?",
    phonetic_tactic: "Iu from aráund jíer?",
    grammar_tag: "small-talk",
    difficulty: 1,
    learning_tips: ["Nota: se omite 'Are' al inicio (casual natural)."]
  },
  {
    id: 'b-soc3',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "Crazy weather we're having.",
    phrase_es: "Qué loco está el clima.",
    phonetic_tactic: "Kréizi wéder wir jáving.",
    grammar_tag: "small-talk",
    difficulty: 1,
    learning_tips: ["Tema 100% seguro en EE.UU."]
  },
  {
    id: 'b-soc4',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "Long time no see.",
    phrase_es: "Cuánto tiempo sin verte.",
    phonetic_tactic: "Long táim nou sí.",
    grammar_tag: "idiom",
    difficulty: 1,
    learning_tips: ["Idioma fijo (no cambies la gramática)."]
  },
  {
    id: 'b-soc5',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "Oh really?",
    phrase_es: "¿En serio?",
    phonetic_tactic: "Ou ríli?",
    grammar_tag: "filler",
    difficulty: 1,
    learning_tips: ["Respuesta segura: mantiene conversación sin opinar."]
  },
  {
    id: 'b-soc6',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "I hear you.",
    phrase_es: "Te entiendo.",
    phonetic_tactic: "Ái jíer iu.",
    grammar_tag: "empathy",
    difficulty: 1,
    learning_tips: ["Empatía sin comprometerte con la opinión."]
  },
  {
    id: 'b-soc7',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "This cut looks clean on you.",
    phrase_es: "Este corte se te ve limpio.",
    phonetic_tactic: "Dis kot luks klín on iu.",
    grammar_tag: "compliment",
    difficulty: 1,
    learning_tips: ["Cumplido sobre el corte, no sobre el cuerpo: siempre seguro."]
  },
  {
    id: 'b-soc8',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "Take it easy, man.",
    phrase_es: "Cuídate, hermano.",
    phonetic_tactic: "Téik it ízi, man.",
    grammar_tag: "farewell",
    difficulty: 1,
    learning_tips: ["Despedida casual masculina. Alternativa: 'Stay cool'."]
  },
  {
    id: 'b-soc9',
    profession_id: 'barber',
    category: 'social',
    phrase_en: "Drive safe.",
    phrase_es: "Maneja con cuidado.",
    phonetic_tactic: "Dráiv séif.",
    grammar_tag: "imperative",
    difficulty: 1,
    learning_tips: ["Despedida amistosa; apropiada para cualquier género."]
  }
];
