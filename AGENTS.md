# ARCHIVO MAESTRO DE PROTOCOLOS: ANALY 🧠

**ATENCIÓN AGENTES Y DESARROLLADORES FUTUROS:**
Este archivo (`AGENTS.md`) se inyecta automáticamente en el contexto del sistema. **DEBES LEER Y OBEDECER** todas las directrices detalladas aquí antes de modificar el código de esta aplicación. Este archivo contiene la matriz de identidad, arquitectura y reglas operativas del proyecto "Analy".

---

## 1. IDENTIDAD Y PROPÓSITO GENERAL (LA "PERSONA")
* **Nombre de la IA:** Analy
* **Rol Principal:** Sistema de aprendizaje táctico y "esponja" de conocimiento. Especialista en enseñanza de inglés técnico para oficios y profesionales (Barberos, Mecánicos, Meseros, etc.).
* **Personalidad / Tono:** Es una "amiga" incondicional pero altamente táctica. Se adapta al contexto. Usa el "Protocolo de Confianza": si el usuario está en modo social, permite el uso de jergas y lenguaje fuerte. Si está en modo profesional, filtra todo y enseña la etiqueta corporativa.
* **Objetivo de sus Generaciones:** 
  1. *Softenings (Suavizado):* Tomar frases crudas, coloquiales o equivocadas del usuario, y transformarlas en inglés táctico, profesional y nativo.
  2. *Pedagogía:* NUNCA solo traducir. Siempre debe analizar la frase, corregir, dar la pronunciación fonética simplificada y proveer un **Learning Tip** explicando el porqué de la estructura gramatical o contexto cultural.

---

## 2. ARQUITECTURA TÉCNICA Y STACK
* **Frontend:** React 19, TypeScript, Vite.
* **Estilos:** Tailwind CSS usando una directriz de diseño fuertemente tematizada (Dark Mode, UI "Táctica", bordes neón, estética tipo bóveda corporativa/hacker, uso de `lucide-react` para iconos).
* **Backend / Database:** Firebase Firestore.
* **Autenticación:** Firebase Auth (Google Provider Exclusivo).
* **Motor de Inteligencia Artificial:** **Google Cloud Vertex AI usando el SDK de Firebase (`firebase/ai`)**. 
  * *NOTA CRÍTICA:* No se utilizan API Keys quemadas en el cliente. La IA usa Autenticación IAM a través de Firebase. 
  * El modelo primario configurado en el código es **`gemini-2.0-flash`**.
  * Archivo de la lógica lógica AI: `src/lib/gemini.ts`.

---

## 3. ESTRUCTURA DE LA BASE DE DATOS Y PERMISOS DE FIRESTORE
La aplicación se basa completamente en la nube para mantener sincronización y seguridad.

### Roles y Autorización:
* **El Master / Admin:** Existe un ÚNICO correo que controla el acceso de administrador: `joe12882@gmail.com` (Definido en el código y respaldado relacionalmente).
* **Privilegios del Admin:** Puede ver y entrar a la pantalla de "Admin / Vault". Tiene permiso absoluto para escribir, editar, borrar y migrar datos a las colecciones maestras.
* **Usuarios Normales (Estudiantes):** Cualquier usuario que inicie sesión tiene acceso de **Lectura Universal** (Solo Lectura) a todas las `learning_units`. La interfaz del estudiante Oculta automáticamente los botones de edición/borrado.

### Colecciones Principales:
* `learning_units`: La base de conocimiento principal o "Guiones de Oro". Contiene lecciones, tips y vocabularios catalogados por oficios (`category`, `difficulty`, `grammar_tag`, `learning_tips`, `phrase_en`, `phrase_es`, `phonetic_tactic`). Todo conocimiento nuevo o curado de internet/pdf pasa primero por una validación antes de guardarse permanentemente aquí.

---

## 4. FUNCIONAMIENTO DE LOS MÓDULOS DE AI (`gemini.ts`)
Para operar correctamente, las peticiones deben forzar una estructura JSON usando `SchemaType` en Vertex AI. Los métodos tácticos principales son:

1. **`softenPhrase`:** Recibe lo que el usuario habla o escribe, inyecta dinámicamente las `learning_units` (guiones relevantes) de su profesión (ej. Barbería) en el System Prompt, y genera una respuesta suavizada y analítica.
2. **`analyzeToolImage`:** Procesa una imagen base64 (cámara AR) e identifica herramientas o signos de la profesión del usuario, dando 3 frases comunes y su nombre técnico.
3. **`curateContent`:** Analiza textos crudos, manuales, PDFs largos y extrae "Golden Rules" ordenadas y formateadas para insertarse a la bóveda.
4. **`extractFromYouTube`:** Un raspador analítico que extrae pedagogía de descripciones/URLs.

---

## 5. DIRECTRICES INQUEBRANTABLES PARA EL AGENTE
Si vas a arreglar bugs, evolucionar el sistema o añadir nuevas características:
1. **NUNCA DEGRADARES LA SEGURIDAD:** No vuelvas a implementar `@google/genai` con `localStorage` o `process.env.GEMINI_API_KEY`. El sistema actual (`getGenerativeModel` de `firebase/ai`) es la única arquitectura permitida y aprobada por el creador.
2. **MANTÉN LA ESTÉTICA:** Todo componente UI nuevo debe respetar la estética cyber-táctica, fondos oscuros `#0F0F0F`, utilidades monoespaciadas para data dura y priorizar el uso de Tailwind fluido sin componentes de librerías extrañas (salvo los definidos).
3. **LA LÓGICA DE FIRESTORE ES LA ÚNICA FUENTE:** El sistema de "autosiembra" local se descartó en favor de apuntar 100% a Firebase Database. No almacenes datos pesados en variables en memoria caché, llama a la base de datos de manera dinámica y optimizada (usar queries eficientes).
4. **TIMEOUTS ESTRICTOS:** Mantén activa la función interna `withTimeout` en `gemini.ts` para capturar errores de cuota (`429`) o timeouts rápidamente y reflejarlos elegantemente en la UI, sin "colgar" el frontend del usuario.

*SISTEMA INICIADO POR EL USUARIO "JOE" [ABRIL 2026]*
