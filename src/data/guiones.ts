import { LearningUnit } from '../types';

export const LEARNING_UNITS: LearningUnit[] = [
  // ==========================================
  // BARBEO (BARBER)
  // ==========================================
  {
    id: 'b-p1',
    profession_id: 'barber',
    category: 'professional',
    phrase_en: "Hey, welcome in! What are we doing for you today?",
    phrase_es: "Hola, ¡bienvenido! ¿Qué te hacemos hoy?",
    phonetic_tactic: "Jei, uélcom in! Uat ar ui dúing for iu tudéi?",
    grammar_tag: "greeting",
    difficulty: 1,
    learning_tips: ["Usa 'we' en lugar de 'I' para incluir al cliente y sonar más amigable."]
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

  // ==========================================
  // MESEROS (WAITER) - GOLD SCRIPTS
  // ==========================================
  {
    id: 'w-p1',
    profession_id: 'waiter',
    category: 'professional',
    phrase_en: "Hi, welcome in! How many in your party?",
    phrase_es: "Hola, ¡bienvenidos! ¿Cuántos son?",
    phonetic_tactic: "Jai, uélcom in! Jau meni in ior párti?",
    grammar_tag: "greeting",
    difficulty: 1,
    learning_tips: ["Usa 'party' para referirte al grupo de personas."]
  },
  {
    id: 'w-p2',
    profession_id: 'waiter',
    category: 'professional',
    phrase_en: "Good evening. Do you have a reservation?",
    phrase_es: "Buenas noches. ¿Tienen reservación?",
    phonetic_tactic: "Gud ívning. Du iu jav a reservéishon?",
    grammar_tag: "question",
    difficulty: 1,
    learning_tips: ["Pregunta estándar al llegar. Muy educado."]
  },
  {
    id: 'w-p3',
    profession_id: 'waiter',
    category: 'professional',
    phrase_en: "Can I start you off with something to drink?",
    phrase_es: "¿Les traigo algo de tomar para empezar?",
    phonetic_tactic: "Can ai start iu of uid somzing tu drink?",
    grammar_tag: "offer",
    difficulty: 2,
    learning_tips: ["'Start you off' es una frase común para ofrecer bebidas al inicio."]
  },
  {
    id: 'w-p4',
    profession_id: 'waiter',
    category: 'professional',
    phrase_en: "Any allergies I should let the kitchen know about?",
    phrase_es: "¿Alguna alergia que deba avisar a cocina?",
    phonetic_tactic: "Eni álerchis ai shud let de kitchin nou abáut?",
    grammar_tag: "safety",
    difficulty: 3,
    learning_tips: ["Obligatorio y vital en servicio en USA para evitar demandas."]
  },
  {
    id: 'w-p5',
    profession_id: 'waiter',
    category: 'professional',
    phrase_en: "How would you like that cooked? Rare, medium, or well done?",
    phrase_es: "¿Término rojo, medio o bien cocido?",
    phonetic_tactic: "Jau wud iu laik dat cukt? Rer, mídiam, or uel dan?",
    grammar_tag: "options",
    difficulty: 3,
    learning_tips: ["Rare (Rojo), Medium (Medio), Well done (Bien cocido)."]
  },
  {
    id: 'w-s1',
    profession_id: 'waiter',
    category: 'survival',
    phrase_en: "I didn't catch that. Could you point to it on the menu?",
    phrase_es: "No entendí eso. ¿Podría señalarlo en el menú?",
    phonetic_tactic: "Ai didnt kach dat. Kud iu point tu it on de meniú?",
    grammar_tag: "clarification",
    difficulty: 2,
    learning_tips: ["Si no oyes bien, usa el apoyo visual del menú."]
  },
  {
    id: 'w-soc1',
    profession_id: 'waiter',
    category: 'social',
    phrase_en: "Celebrating anything tonight?",
    phrase_es: "¿Celebran algo hoy?",
    phonetic_tactic: "Selebréiting enizing tunáit?",
    grammar_tag: "conversation",
    difficulty: 2,
    learning_tips: ["Perfecto para generar propinas si hay una ocasión especial."]
  },

  // ==========================================
  // LIMPIEZA (CLEANING) - GOLD SCRIPTS
  // ==========================================
  {
    id: 'c-p1',
    profession_id: 'cleaning',
    category: 'professional',
    phrase_en: "Good morning! Housekeeping.",
    phrase_es: "¡Buenos días! Servicio de limpieza.",
    phonetic_tactic: "Gud mórning! Jauskíping",
    grammar_tag: "identification",
    difficulty: 1,
    learning_tips: ["Anuncia siempre quién eres antes de entrar o tocar."]
  },
  {
    id: 'c-p2',
    profession_id: 'cleaning',
    category: 'professional',
    phrase_en: "May I come in to clean your room?",
    phrase_es: "¿Puedo pasar a limpiar?",
    phonetic_tactic: "Mei ai cam in tu klin iur rum?",
    grammar_tag: "permission",
    difficulty: 1,
    learning_tips: ["Petición educada. Nunca entres sin preguntar."]
  },
  {
    id: 'c-p3',
    profession_id: 'cleaning',
    category: 'professional',
    phrase_en: "Is now a good time, or should I come back later?",
    phrase_es: "¿Ahora está bien o regreso después?",
    phonetic_tactic: "Is nau a gud taim, or shud ai cam bak léiter?",
    grammar_tag: "scheduling",
    difficulty: 2,
    learning_tips: ["Respeta la privacidad del huésped ofreciendo volver luego."]
  },
  {
    id: 'c-p4',
    profession_id: 'cleaning',
    category: 'professional',
    phrase_en: "I'm not allowed to move personal items or laptops.",
    phrase_es: "No tengo permitido mover objetos personales o laptops.",
    phonetic_tactic: "Ai am not aláud tu muv pérsonal áitems or láptops.",
    grammar_tag: "policy",
    difficulty: 3,
    learning_tips: ["Por seguridad y póliza, nunca toques las pertenencias."]
  },
  {
    id: 'c-s1',
    profession_id: 'cleaning',
    category: 'survival',
    phrase_en: "My English is basic, but I'll do my best to help you.",
    phrase_es: "Mi inglés es básico, pero haré lo posible por ayudar.",
    phonetic_tactic: "Mai ínglish is béisic, bat ail du mai best tu jelp iu.",
    grammar_tag: "honesty",
    difficulty: 2,
    learning_tips: ["Sé honesto sobre tu nivel; los huéspedes suelen ser comprensivos."]
  },
  {
    id: 'c-soc1',
    profession_id: 'cleaning',
    category: 'social',
    phrase_en: "Have a great day! Enjoy Atlanta!",
    phrase_es: "¡Que tenga buen día! ¡Disfrute Atlanta!",
    phonetic_tactic: "Jav a gréit déi! Enshói Atlánta!",
    grammar_tag: "closing",
    difficulty: 1,
    learning_tips: ["Menciona la ciudad donde están; genera cercanía."]
  },

  // ==========================================
  // MECÁNICO (MECHANIC) - GOLD SCRIPTS
  // ==========================================
  {
    id: 'm-p1',
    profession_id: 'mechanic',
    category: 'professional',
    phrase_en: "Hey, welcome in! What can we do for your car today?",
    phrase_es: "Hola, ¡bienvenido! ¿Qué podemos hacer por tu carro hoy?",
    phonetic_tactic: "Jei, uélcom in! Uat can ui du for ior car tudéi?",
    grammar_tag: "greeting",
    difficulty: 1,
    learning_tips: ["'We' suena a equipo profesional."]
  },
  {
    id: 'm-p2',
    profession_id: 'mechanic',
    category: 'professional',
    phrase_en: "We'll run a diagnostic, is that okay?",
    phrase_es: "Haremos un diagnóstico, ¿está bien?",
    phonetic_tactic: "Uil ran a daiagnóstic, is dat okéi?",
    grammar_tag: "proposal",
    difficulty: 2,
    learning_tips: ["Siempre pide autorización antes de hacer el diagnóstico."]
  },
  {
    id: 'm-p3',
    profession_id: 'mechanic',
    category: 'professional',
    phrase_en: "The frame is bent from the accident. We can't safely repair it.",
    phrase_es: "El chasis está doblado. No podemos repararlo de forma segura.",
    phonetic_tactic: "De fréim is bent from de áksident. Ui cant séifli ripér it.",
    grammar_tag: "bad-news",
    difficulty: 3,
    learning_tips: ["'Totaled' = pérdida total. Da noticias difíciles con calma."]
  },
  {
    id: 'm-s1',
    profession_id: 'mechanic',
    category: 'survival',
    phrase_en: "I completely understand you're frustrated.",
    phrase_es: "Entiendo perfectamente que estés frustrado.",
    phonetic_tactic: "Ai complítli anderstánd iur frostréited.",
    grammar_tag: "empathy",
    difficulty: 2,
    learning_tips: ["Validar el sentimiento del cliente calma los problemas."]
  }
];
