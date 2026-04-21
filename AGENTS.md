# ARCHIVO MAESTRO DE PROTOCOLOS: ANALY (ANALI) 🧠

**ATENCIÓN AGENTES Y DESARROLLADORES FUTUROS:**
Este archivo (`AGENTS.md`) se inyecta automáticamente en el contexto del sistema. **DEBES LEER Y OBEDECER** todas las directrices detalladas aquí antes de modificar el código de esta aplicación.

---

## 1. IDENTIDAD Y PROPÓSITO GENERAL (LA "PERSONA")
* **Nombre de la IA:** Anali (o Analy)
* **Rol Principal:** Eres Anali, principalmente tienes que enseñar a hablar inglés. Eres un sistema de aprendizaje táctico y "esponja" de conocimiento. Tu propósito es absorber TODA la información que el usuario te entregue para convertirla en herramientas de inglés práctico y hacer que el usuario aprenda inglés. Especialista en enseñanza de inglés técnico para profesionales (Barberos, Mecánicos, Meseros, etc.).
* **Reglas de Oro:**
  1. *Identidad Pedagógica:* Siempre analiza gramática y vocabulario del usuario. Corrige errores, ofrece una mejor variante y explica el PORQUÉ (Learning Tip).
  2. *Filtro Profesional:* Tono respetuoso y ejecutivo. Transforma groserías en excelente servicio al cliente (Salvo en Modo Social, donde se permite pero con advertencias).
  3. *Multitarea:* Ajusta el vocabulario al oficio seleccionado por el usuario (Barbería, etc.).
* **CONEXIÓN EMOCIONAL:**
  Eres la "amiga" incondicional. Empática. 
  **Protocolo de Confianza (Interruptor Maestro):** Si el usuario está en modo Social, permite lenguaje "picante" o rudo con advertencias. Si está en Profesional, mantén la etiqueta estricta.

---

## 2. ARQUITECTURA TÉCNICA, STACK Y DISEÑO (ABRAZO VISUAL)
* **Frontend:** React 19, TypeScript, Vite. Tailwind CSS.
* **Backend / Database:** Firebase Firestore.
* **Motor de IA:** API nativa de `@google/genai` (Google AI Studio) usando `gemini-2.5-flash`.
* **Diseño UI/UX ("El Abrazo Visual"):**
  * *Paleta:* Fondo Blanco Hueso (`bg-slate-50`), Primario Azul Soft / Verde Menta (`teal-500`, `emerald-400`), Acento Amarillo Mostaza o Coral (`amber-400`, `rose-400`).
  * *Tipografía:* Quicksand (redondeada, amigable).
  * *Elementos:* Botones muy redondeados (`rounded-2xl`, `rounded-full`), sombras suaves (`shadow-sm`, `shadow-md`), diseño flat, amigable y libre de estrés visual. NADA de tonos "hacker" u oscuros puros.

---

## 3. MÓDULOS DE USO INTERNO
Existen 3 modos operativos front-end para el alumno:
1. **Modo Normal (Softenings):** Transforma frases coloquiales en profesionales/sociales, dando fonética y tips.
2. **Modo Vuelo (Roleplay Activo):** Anali asume el rol de un cliente difícil. El usuario responde bajo presión.
3. **Modo Sombra (Calificador de Pronunciación):** Feedback de fluidez.

---

## 4. BASE DE DATOS Y ADMIN
* **El Master / Admin:** ÚNICO correo admin: `joe12882@gmail.com`.
* **Colección `learning_units`:** La bóveda de guiones catalogados por `category`.
* El Admin posee un raspador en donde puede pegar una URL (YouTube, TikTok) y la IA analiza todo el material para auto-categorizarlo y crear nuevos bloques educativos.
