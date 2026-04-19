export interface GuionItem {
  id: string;
  title: string;
  category: 'professional' | 'survival' | 'social';
  spanish: string;
  english: string;
  pronunciation: string;
  note?: string;
  context?: string;
}

export const GUIONES: GuionItem[] = [
  // MODO PROFESIONAL
  { id: 'p1', category: 'professional', title: 'Bienvenida', spanish: 'Hola, ¡bienvenido! ¿Qué te hacemos hoy?', english: 'Hey, welcome in! What are we doing for you today?', pronunciation: 'Jei, uélcom in! Uat ar ui dúing for iu tudéi?', note: 'Usa "we" para incluir al cliente.', context: 'Ingreso' },
  { id: 'p2', category: 'professional', title: 'Bienvenida formal', spanish: 'Buenos días. Bienvenido. ¿Cómo puedo ayudarte hoy?', english: 'Good morning. Welcome. How can I help you today?', pronunciation: 'Gud mórning. Uélcom. Jau can ái jelp iu tudéi?', context: 'Ingreso' },
  { id: 'p3', category: 'professional', title: 'Preguntar el corte', spanish: '¿Cómo te gustaría tu corte hoy?', english: 'How would you like your haircut today?', pronunciation: 'Jáu ud iú láik iór jér-kat tudéi?', context: 'Servicio' },
  { id: 'p4', category: 'professional', title: 'Preguntar corte (alternativa)', spanish: '¿Qué hacemos hoy?', english: 'What are we doing today?', pronunciation: 'Uát ar ui dúing tudéi?', context: 'Servicio' },
  { id: 'p5', category: 'professional', title: '¿Despunte o cambio?', spanish: '¿Solo un despunte o cambiamos el estilo?', english: 'Just a trim or changing the style?', pronunciation: 'Dzsást éi trim ór chéin-dzsing dza stáil?', context: 'Servicio' },
  { id: 'p6', category: 'professional', title: 'Vocabulario Fade', spanish: '¿Entonces quieres un degradado a los lados?', english: 'So you want a fade on the sides?', pronunciation: 'Só iú uánt éi féid ón dza sáids?', note: 'Vocabulario clave: Fade = Degradado.', context: 'Vocabulario' },
  { id: 'p7', category: 'professional', title: 'Vocabulario Lineup', spanish: '¿También quieres que te marque el contorno?', english: 'Do you want a lineup too?', pronunciation: 'Du iú uánt éi láin-ap tú?', note: 'Vocabulario clave: Lineup = Contorno.', context: 'Vocabulario' },
  { id: 'p8', category: 'professional', title: 'Chequear largo', spanish: '¿Qué tal el largo a los lados?', english: 'How\'s the length on the sides?', pronunciation: 'Jáus dza lengz ón dza sáids?', context: 'Durante el corte' },
  { id: 'p9', category: 'professional', title: 'Mover cabeza', spanish: '¿Podrías inclinar tu cabeza un poco hacia abajo?', english: 'Could you tilt your head down a bit?', pronunciation: 'Cú-d iú tilt iór jed dáun éi bit?', note: 'Regla de oro: Nunca digas \'Put your head down\'. Suena a orden.', context: 'Durante el corte' },
  { id: 'p10', category: 'professional', title: 'Pago', spanish: '¿Cómo te gustaría pagar hoy?', english: 'How would you like to pay today?', pronunciation: 'Jáu ud iú láik tzu péi tudéi?', note: 'En EE.UU. la propina es normal.', context: 'Final' },
  { id: 'p11', category: 'professional', title: 'Despedida', spanish: 'Listo. ¡Se ve bien!', english: 'You\'re all set. Looks good!', pronunciation: 'Iúr ól sét. Lúks gud!', note: 'Incluye frases como "Have a great day" o "Drive safe".', context: 'Final' },

  // MODO SUPERVIVENCIA
  { id: 's1', category: 'survival', title: 'No entiendes', spanish: 'Perdón, ¿puedes decir eso otra vez?', english: 'Sorry, can you say that again?', pronunciation: 'Só-ri, cán iú séi dát a-guén?', note: 'Nota cultural: No digas "What?" a secas.', context: 'Clarificación' },
  { id: 's2', category: 'survival', title: 'Slang del cliente (Crispy)', spanish: 'Entendido. Quieres un contorno bien marcado', english: 'Got it. You want a sharp lineup', pronunciation: 'Gát it. Iú uánt éi shárp láin-ap', note: 'Respuesta a "Keep it crispy".', context: 'Slang' },
  { id: 's3', category: 'survival', title: 'Slang del cliente (Fresh)', spanish: 'Te tengo. Lo dejaremos bien limpio', english: 'I got you. We\'ll clean it up nice', pronunciation: 'Ái gát iú. Uíl clíin it áp náis', note: 'Respuesta a "Make me look fresh".', context: 'Slang' },
  { id: 's4', category: 'survival', title: 'Necesitas tiempo', spanish: 'Dame un segundo', english: 'Give me one second', pronunciation: 'Gív mí uán sé-kond', note: 'Mientras dices esto, sigues cortando.', context: 'Gestión de flujo' },
  { id: 's5', category: 'survival', title: 'Error', spanish: 'Fue mi error. Déjame arreglarlo', english: 'My bad. Let me fix that for you', pronunciation: 'Mái bád. lét mí fiks dát fór iú', note: 'Esenciales: "My bad" y "No charge for fix".', context: 'Gestión de errores' },

  // MODO SOCIAL
  { id: 'soc1', category: 'social', title: 'Rompehielos', spanish: '¿Día ocupado hoy?', english: 'Busy day today?', pronunciation: 'Bí-si déi tudéi?', note: 'Regla de oro: Pregunta + silencio.', context: 'Social' },
  { id: 'soc2', category: 'social', title: 'Respuestas seguras', spanish: '¿En serio? Te entiendo.', english: 'Oh really? I hear you.', pronunciation: 'Óu rí-li? Ái jíer iú.', note: 'Combina frases para conectar.', context: 'Social' },
  { id: 'soc3', category: 'social', title: 'Cumplidos', spanish: 'Listo, te ves muy bien', english: 'You\'re all set, looking sharp', pronunciation: 'Iúr ól sét, lú-king shárp', note: 'Evita comentarios sobre cuerpo/familia.', context: 'Social' },
  { id: 'soc4', category: 'social', title: 'Cerrar', spanish: 'Siempre es bueno ponernos al día', english: 'Always good catching up', pronunciation: 'Ól-uéis gud ká-ching áp', note: 'Evita temas de riesgo (Política, religión, dinero).', context: 'Social' }
];
