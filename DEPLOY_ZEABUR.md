# Despliegue en Zeabur 🚀

Para desplegar Analí en Zeabur con éxito, sigue estos pasos:

### 1. Preparación en Zeabur
1. Crea un nuevo proyecto en [Zeabur](https://zeabur.com).
2. Conecta tu repositorio de GitHub o sube los archivos.
3. Zeabur detectará automáticamente que es un proyecto Node.js.

### 2. Variables de Entorno (IMPORTANTE)
Debes configurar estas variables en el panel de **Settings > Variables** de Zeabur:

| Variable | Descripción |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | Tu llave de Google AI Studio (Gemini). |
| `ELEVENLABS_API_KEY` | (Opcional) Tu llave de ElevenLabs para voz premium. |
| `ELEVENLABS_VOICE_ID` | (Opcional) ID de la voz a usar. |

### 3. Firebase Config
Asegúrate de que el archivo `firebase-applet-config.json` esté presente en la raíz. Si no quieres subirlo al repo, Zeabur permite subir archivos de configuración privados o puedes integrarlo en el código.

### 4. Comando de Inicio
Zeabur ejecutará automáticamente:
1. `npm install`
2. `npm run build`
3. `npm start` (que ahora usa `tsx server.ts` para soportar TypeScript).

### Notas Técnicas
- El servidor escucha en el puerto definido por la variable `PORT` que Zeabur asigna dinámicamente.
- En producción (`NODE_ENV=production`), el servidor sirve los archivos estáticos desde la carpeta `/dist`.

¡Listo! Con esto Analí debería estar volando en Zeabur.
