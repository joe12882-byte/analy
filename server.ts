import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Debug File System Structure
  app.get("/api/debug-fs", async (req, res) => {
    try {
      const { readdirSync, existsSync } = await import("fs");
      const structure: any = {};
      
      const checkDir = (dir: string, label: string) => {
        const fullPath = path.resolve(__dirname, dir);
        if (existsSync(fullPath)) {
          structure[label] = {
            path: fullPath,
            files: readdirSync(fullPath).slice(0, 50) // limit to 50
          };
        } else {
          structure[label] = "NOT_FOUND: " + fullPath;
        }
      };

      checkDir("dist", "dist_folder");
      checkDir("dist/assets", "dist_assets_folder");
      checkDir("public", "public_folder");
      checkDir("src/assets/images", "src_images_folder");

      res.json({
        cwd: process.cwd(),
        __dirname,
        structure
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Proxy para ElevenLabs (Oculta la API Key)
  app.post("/api/tts/elevenlabs", async (req, res) => {
    try {
      const { text } = req.body;
      const apiKey = process.env.ELEVENLABS_API_KEY;
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

      if (!apiKey) {
        return res.status(500).json({ error: "ELEVENLABS_API_KEY no configurada en el servidor." });
      }

      console.log(`[TTS] Generando audio para: "${text.substring(0, 30)}..."`);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.set("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error) {
      console.error("[TTS Error]:", error);
      res.status(500).json({ error: "Error interno procesando TTS" });
    }
  });

  // API Route: Verificar si el Plan A está disponible y si el Protocolo Escudo está activo
  app.get("/api/tts/status", async (req, res) => {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      // Importamos el db estabilizado directamente
      const { db } = await import("./src/lib/firebase.ts"); 
      
      const configSnap = await getDoc(doc(db, 'system', 'config'));
      const economyMode = configSnap.exists() ? !!configSnap.data().economy_mode : false;

      res.json({ 
        hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
        plan: process.env.ELEVENLABS_API_KEY ? "A" : "B",
        economyMode
      });
    } catch (err) {
      res.json({ 
        hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
        plan: "A",
        economyMode: false 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const publicPath = path.resolve(__dirname, 'public');
    
    // Serve static files from dist first (Vite build output)
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.mp4')) {
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Type', 'video/mp4');
        }
      }
    }));
    
    // Backup: serve from public directly if dist is missing something
    app.use(express.static(publicPath, {
      maxAge: '1d'
    }));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Analí Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
