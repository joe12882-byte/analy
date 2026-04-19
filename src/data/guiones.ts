import { LearningUnit } from '../types';

export const LEARNING_UNITS: LearningUnit[] = [
  // MODO PROFESIONAL
  { 
    id: 'p1', 
    profession_id: 'barber',
    category: 'professional', 
    phrase_es: 'Hola, ¡bienvenido! ¿Qué te hacemos hoy?', 
    phrase_en: 'Hey, welcome in! What are we doing for you today?', 
    phonetic_tactic: 'Jei, uélcom in! Uat ar ui dúing for iu tudéi?', 
    learning_tips: ['Usa "we" (nosotros) en "What are we doing" para incluir al cliente y sonar más colaborativo.', 'Gramática: Present Continuous para planes inmediatos.'], 
    grammar_tag: 'Present Continuous',
    difficulty: 2
  },
  { 
    id: 'p3', 
    profession_id: 'barber',
    category: 'professional', 
    phrase_es: '¿Cómo te gustaría tu corte hoy?', 
    phrase_en: 'How would you like your haircut today?', 
    phonetic_tactic: 'Jáu ud iú láik iór jér-kat tudéi?', 
    learning_tips: ['"Would you like" es la forma más educada y profesional de preguntar qué desea el cliente.'],
    grammar_tag: 'Modal Verbs (Would)',
    difficulty: 2
  },
  { 
    id: 'p5', 
    profession_id: 'barber',
    category: 'professional', 
    phrase_es: '¿Solo un despunte o cambiamos el estilo?', 
    phrase_en: 'Just a trim or changing the style?', 
    phonetic_tactic: 'Dzsást éi trim ór chéin-dzsing dza stáil?', 
    learning_tips: ['Vocabulario clave: "Trim" significa despunte o recorte de mantenimiento.'],
    grammar_tag: 'Vocabulario Técnico',
    difficulty: 1
  },
  { 
    id: 'p6', 
    profession_id: 'barber',
    category: 'professional', 
    phrase_es: '¿Entonces quieres un degradado a los lados?', 
    phrase_en: 'So you want a fade on the sides?', 
    phonetic_tactic: 'Só iú uánt éi féid ón dza sáids?', 
    learning_tips: ['"Fade" se usa para cualquier tipo de degradado.', 'Preposición: "on the sides" siempre usa ON.'],
    grammar_tag: 'Preposiciones',
    difficulty: 1
  },
  { 
    id: 'p9', 
    profession_id: 'barber',
    category: 'professional', 
    phrase_es: '¿Podrías inclinar tu cabeza un poco hacia abajo?', 
    phrase_en: 'Could you tilt your head down a bit?', 
    phonetic_tactic: 'Cú-d iú tilt iór jed dáun éi bit?', 
    learning_tips: ['Regla de oro: Nunca digas "Put your head down", suena a orden agresiva. Usa "tilt" (inclinar).'],
    grammar_tag: 'Formas de Cortesía',
    difficulty: 3
  },

  // MODO SUPERVIVENCIA
  { 
    id: 's1', 
    profession_id: 'barber',
    category: 'survival', 
    phrase_es: 'Perdón, ¿puedes decir eso otra vez?', 
    phrase_en: 'Sorry, can you say that again?', 
    phonetic_tactic: 'Só-ri, cán iú séi dát a-guén?', 
    learning_tips: ['Nota cultural: En Estados Unidos no se estila decir "What?". Es descortés.', 'Gramática: "Can you" es perfecto para pedir favores informales al cliente.'],
    grammar_tag: 'Modales (Can)',
    difficulty: 1
  },
  { 
    id: 's2', 
    profession_id: 'barber',
    category: 'survival', 
    phrase_es: 'Entendido. Quieres un contorno bien marcado', 
    phrase_en: 'Got it. You want a sharp lineup', 
    phonetic_tactic: 'Gát it. Iú uánt éi shárp láin-ap', 
    learning_tips: ['Slang: Un cliente pedirá un "crispy lineup". Tú respondes confirmando "sharp" para afirmar limpieza en el corte.'],
    grammar_tag: 'Jerga Profesional',
    difficulty: 3
  },
  { 
    id: 's5', 
    profession_id: 'barber',
    category: 'survival', 
    phrase_es: 'Fue mi error. Déjame arreglarlo', 
    phrase_en: 'My bad. Let me fix that for you', 
    phonetic_tactic: 'Mái bád. lét mí fiks dát fór iú', 
    learning_tips: ['"My bad" asume la culpa de manera súper natural. Seguida de Let me, muestras total control de la situación.'],
    grammar_tag: 'Phrasal/Slang',
    difficulty: 2
  },

  // MODO SOCIAL
  { 
    id: 'soc1', 
    profession_id: 'barber',
    category: 'social', 
    phrase_es: '¿Día ocupado hoy?', 
    phrase_en: 'Busy day today?', 
    phonetic_tactic: 'Bí-si déi tudéi?', 
    learning_tips: ['A esto se le llama "Small talk". Los americanos suelen omitir el verbo "Is it a" y van directo al grano.'],
    grammar_tag: 'Reducción de Pronombres',
    difficulty: 2
  },
  { 
    id: 'soc3', 
    profession_id: 'barber',
    category: 'social', 
    phrase_es: 'Listo, te ves muy bien', 
    phrase_en: 'You\'re all set, looking sharp', 
    phonetic_tactic: 'Iúr ól sét, lú-king shárp', 
    learning_tips: ['"You\'re all set" es la frase estándar de Estados Unidos para decir que el servicio terminó.', '"Looking sharp" es el mejor cumplido para la apariencia de un hombre.'],
    grammar_tag: 'Expresiones Idiomáticas',
    difficulty: 3
  }
];
