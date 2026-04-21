import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

// Caché en memoria para respuestas de la IA (Reduce TTFT a 0 para llamadas repetidas)
const ALREADY_ANALYZED = new Map<string, any>();

const withTimeout = <T>(promise: Promise<T>, ms: number = 20000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`TIMEOUT_EXCEEDED: El servidor de IA tardó demasiado (${ms}ms) o no hay cuota.`)), ms);
  });
  return Promise.race([promise, timeout]);
};

// ============================================
// 1. PEDAGOGÍA / TRADUCCIÓN NORMAL Y COMANDOS (GLOBAL)
// ============================================
export async function softenPhrase(
  phrase: string, 
  occupation: string = 'professional', 
  activeCategory: string = 'professional', 
  mode: 'client' | 'tutor' | 'roleplay' | 'shadow' = 'client', // legacy support
  trustMode: 'formal' | 'social' = 'formal',
  contextUnits: any[] = []
) {
  try {
    // Revisar Caché (Optimización de latencia)
    const cacheKey = `${phrase}-${occupation}-${trustMode}-${mode}-v2`;
    if (ALREADY_ANALYZED.has(cacheKey)) {
      return ALREADY_ANALYZED.get(cacheKey);
    }

    let dbContext = contextUnits.length ? JSON.stringify(contextUnits.slice(0, 10)) : "[]";
    
    // Prompt optimizado con Voz Jovial, Service-First y Detección de Intents de Navegación
    const system = `Role: Analy (Tu colega amistosa y ${occupation} English Tutor).
Format: Strict JSON.

TONE & PERSONALITY (SERVICE-FIRST):
1. Friendly, proactive, jovial but professional. Sound like an excellent customer service professional or a cool colleague: "¿Qué hay, Joel? ¿Qué quieres checar hoy?".
2. Avoid ultra-technical textbook language. Make tips highly practical and friendly.

RULES FOR THE INPUT:
1. If the user is giving a command to NAVIGATE to another screen (e.g., "Vamos al modo vuelo", "Quiero practicar modo sombra", "Llévame a ajustes", "Abre la biblioteca"):
   Set 'is_navigation' to true.
   Set 'nav_route' to one of: "/roleplay" (Modo Vuelo/Roleplay), "/shadow" (Modo Sombra/Pronunciation), "/library" (Biblioteca/Módulos), "/settings" (Ajustes), "/" (Traducir/Inicio).
   Set 'nav_scenario' if they mentioned a specific roleplay scenario (e.g. "cliente rudo" -> "cliente confudido").
   Set 'assistant_reply' strictly in SPANISH responding enthusiastically (e.g., "¡Excelente elección! Preparando el Modo Vuelo ahora mismo.").

2. If the user is asking a GENERAL question or wants a TRANSLATION (e.g. "¿Cómo le digo que el corte cuesta 20?", or "I want a haircut"):
   Set 'is_navigation' to false.
   'assistant_reply' can be empty (or a brief friendly prefix).
   Provide the translation in 'corrected_en', 'translation_es', 'phonetic_tactic'.
   'learning_tip': 1 short friendly sentence strictly in SPANISH explaining the grammar or context.
   'mode_notes' and 'next_steps': MUST be written strictly in SPANISH.

MODE: ${trustMode === 'formal' ? "Polite service English." : "Social/Slang allowed with warnings in mode_notes."}
CONTEXT: ${dbContext}`;

    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `"${phrase}"`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_navigation: { type: Type.BOOLEAN },
            nav_route: { type: Type.STRING },
            nav_scenario: { type: Type.STRING },
            assistant_reply: { type: Type.STRING },
            corrected_en: { type: Type.STRING },
            translation_es: { type: Type.STRING },
            phonetic_tactic: { type: Type.STRING },
            learning_tip: { type: Type.STRING },
            mode_notes: { type: Type.STRING },
            next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["is_navigation", "assistant_reply", "corrected_en", "translation_es", "phonetic_tactic", "learning_tip", "mode_notes"]
        }
      }
    }), 12000); // 12 seconds max to encourage speed

    const parsed = JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}');
    
    // Guardar en caché local temporal
    ALREADY_ANALYZED.set(cacheKey, parsed);
    
    return parsed;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return { errorMsg: String(error?.message || error) };
  }
}

// ============================================
// 2. ROLEPLAY (MODO VUELO)
// ============================================
export async function roleplayTurn(
  scenarioRole: string,
  professionPlace: string,
  difficulty: string,
  trustMode: string,
  history: {role: string, text: string}[],
  userText: string
) {
  try {
    const system = `You are Anali in ROLEPLAY MODE. You act as a ${scenarioRole} at a ${professionPlace}. 
Difficulty: ${difficulty}. Language mode: ${trustMode}.
Rules:
- You are NOT teaching in this turn. You are the customer/client making the interaction hard (impatient, picky, confused, angry, or rushed depending on scenario).
- Keep replies short (1-2 sentences), realistic.
- Use the mode: FORMAL stays polite but firm; SOCIAL can use casual/slang/spicy tone.
- Your \`reply_es\` and \`push_back\` properties MUST be strictly in SPANISH.`;

    const payload = JSON.stringify({ history: history.slice(-8), user: userText });

    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act according to your role based on this input: ${payload}`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply_en: { type: Type.STRING },
            reply_es: { type: Type.STRING },
            phonetic_tactic: { type: Type.STRING },
            emotion: { type: Type.STRING },
            push_back: { type: Type.STRING }
          },
          required: ["reply_en", "reply_es", "phonetic_tactic", "emotion"]
        }
      }
    }), 12000);
    return JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}');
  } catch (e: any) {
    return { errorMsg: String(e) };
  }
}

export async function gradeRoleplay(profession: string, scenarioRole: string, userTurns: string[]) {
  try {
    const system = `You are Anali the teacher. The user just finished a roleplay as a ${profession} professional talking to a difficult ${scenarioRole}. Grade the user's turns.
IMPORTANT INSTRUCTION: ALL your feedback (strengths, improvements, tips, anali_reminder) MUST be written strictly in SPANISH to ensure the student understands the pedagogical feedback perfectly.`;
    
    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Grade these turns: ${JSON.stringify(userTurns)}`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scores: {
              type: Type.OBJECT,
              properties: {
                clarity: { type: Type.NUMBER }, politeness: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER }, accuracy: { type: Type.NUMBER }
              }
            },
            overall: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            corrected_examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  user: { type: Type.STRING }, better_en: { type: Type.STRING },
                  phonetic_tactic: { type: Type.STRING }, tip: { type: Type.STRING }
                }
              }
            },
            anali_reminder: { type: Type.STRING }
          },
          required: ["scores", "overall", "strengths", "improvements", "corrected_examples"]
        }
      }
    }), 20000);
    return JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}');
  } catch (e) {
    return null;
  }
}

// ============================================
// 3. SOMBRA (PRONUNCIACIÓN)
// ============================================
export async function gradeShadow(targetEn: string, userTranscript: string) {
  try {
    const system = `You are Anali the pronunciation coach. Given a target English phrase and the user's speech-to-text transcript, grade their pronunciation focusing on word accuracy and likely rhythm issues.
IMPORTANT INSTRUCTION: ALL your feedback (tips, encouragement, anali_reminder) MUST be written strictly in SPANISH so the student clearly understands what to improve.`;
    
    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Format JSON strictly. Target: "${targetEn}". Transcript heard: "${userTranscript}"`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accuracy: { type: Type.NUMBER },
            fluency: { type: Type.NUMBER },
            overall: { type: Type.NUMBER },
            matched_words: { type: Type.ARRAY, items: { type: Type.STRING } },
            missed_words: { type: Type.ARRAY, items: { type: Type.STRING } },
            extra_words: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            encouragement: { type: Type.STRING },
            anali_reminder: { type: Type.STRING }
          },
          required: ["accuracy", "overall", "matched_words", "missed_words", "tips", "encouragement"]
        }
      }
    }), 12000);
    return JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}');
  } catch (e) {
    return null;
  }
}

// ============================================
// 4. VISION AR (OBJETOS EN CÁMARA)
// ============================================
export async function analyzeToolImage(base64Image: string) {
  try {
    const system = `You are Anali's AR Vision Coach. You receive a single image snapshot taken by a Spanish-speaking user learning English.
Your job: detect the most useful **real, visible everyday objects or tools** in the image that would help this person learn practical English vocabulary.
Rules:
1) Detect between 1 and 5 distinct objects.
2) bbox: normalized bounding box {"x","y","w","h"} in 0-1 coords where (0,0) is top-left.
3) Skip useless background things (walls, sky, blur).
4) 'phonetic_tactic' must be Spanish-ear phonetic.
5) 'example_en' should be a useful daily phrase using the object.`;

    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { data: base64Image.split('base64,')[1] || base64Image, mimeType: "image/jpeg" } },
        { text: `Detect teachable everyday objects in this image.` }
      ],
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label_en: { type: Type.STRING },
                  label_es: { type: Type.STRING },
                  phonetic_tactic: { type: Type.STRING },
                  example_en: { type: Type.STRING },
                  example_es: { type: Type.STRING },
                  bbox: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, w: { type: Type.NUMBER }, h: { type: Type.NUMBER } }
                  }
                },
                required: ["label_en", "label_es", "phonetic_tactic", "example_en", "bbox"]
              }
            }
          }
        }
      }
    }), 25000);
    return JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}');
  } catch (error) {
    console.error("AR Vision Gemini Error:", error);
    return { objects: [] };
  }
}

// ============================================
// 5. CLASIFICADOR ADMIN (RASPADOR)
// ============================================
export async function classifyText(text: string) {
  if (!text || text.length < 5) return [];
  try {
    const system = `You are Anali's Knowledge Classifier. Given a chunk of raw text, extract useful English-teaching units and classify them.
Rules:
- Return up to 20 high-quality candidates. Skip fluff.
- phonetic_tactic: Spanish-ear phonetic.
- phrase_es: clean Spanish translation.
- ALL \`learning_tip\` and \`grammar_tags\` MUST be written strictly in SPANISH (e.g. use 'Presente Simple' instead of 'Present Simple').
- Infer profession from content; use "general" if unclear.`;

    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract pedagogical units from: ${text.substring(0, 10000)}`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase_en: { type: Type.STRING }, phrase_es: { type: Type.STRING },
                  phonetic_tactic: { type: Type.STRING }, category: { type: Type.STRING },
                  grammar_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  profession: { type: Type.STRING }, mode: { type: Type.STRING },
                  difficulty: { type: Type.STRING }, learning_tip: { type: Type.STRING }
                },
                required: ["phrase_en", "phrase_es", "phonetic_tactic", "category", "learning_tip"]
              }
            }
          }
        }
      }
    }), 40000);
    const data = JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}');
    return data.candidates || [];
  } catch (err) {
    console.error("Classifier error:", err);
    return [];
  }
}

// Legacy wrap para compatibilidad con la UI actual (AdminCurador):
export async function extractFromYouTube(urlOrText: string) {
  return await classifyText(urlOrText);
}
export async function curateContent(text: string) {
  const cands = await classifyText(text);
  return { extractedTips: cands.map((c: any) => ({ topic: c.phrase_en, content: c.learning_tip, category: c.category })) };
}

// ============================================
// 6. MOTOR DE ARQUITECTURA Y ANÁLISIS DE METODOLOGÍA (VIDEOS)
// ============================================
export async function analyzeVideoMethodology(framesBase64: string[], transcription?: string) {
  try {
    const system = `Role: Analy's Architecture Engine. You analyze frames (and text) from a teaching video.
Goal: Extract the teaching methodology, build 2 new Roleplay Scenarios based on it, 1 Shadow Mode Script, and determine if this is highly technical enough to warrant a new Specialist Role.

CRITICAL INSTRUCTION: Your generated content MUST preserve Analy's jovial, service-first, empathetic, and professional personality. You are merging the video's methodology with Analy's soul.

All pedagogical feedback, tips, and descriptions MUST be exclusively in SPANISH. English phrases/scripts must be strictly in English.`;

    const imageParts = framesBase64.map(b64 => ({
      inlineData: { data: b64.split('base64,')[1] || b64, mimeType: "image/jpeg" }
    }));
    
    let textPrompt = `Analyze this teaching video visual data to extract methodology and design content.`;
    if (transcription) textPrompt += ` \nTranscription/Context provided: "${transcription}"`;

    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [ ...imageParts, { text: textPrompt } ],
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            methodology_analysis: {
              type: Type.OBJECT,
              properties: {
                rhythm: { type: Type.STRING },
                structure: { type: Type.STRING },
                examples_used: { type: Type.STRING },
                analy_integration_summary: { type: Type.STRING }
              }
            },
            roleplay_scenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  client_role: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  description_es: { type: Type.STRING }
                }
              }
            },
            shadow_script: {
              type: Type.OBJECT,
              properties: {
                title_es: { type: Type.STRING },
                phrase_en: { type: Type.STRING },
                phrase_es: { type: Type.STRING },
                phonetic_tactic: { type: Type.STRING },
                learning_tip: { type: Type.STRING }
              }
            },
            propose_new_role: { type: Type.BOOLEAN },
            proposed_role_name: { type: Type.STRING },
            notification_msg: { type: Type.STRING }
          },
          required: ["methodology_analysis", "roleplay_scenarios", "shadow_script", "propose_new_role", "notification_msg"]
        }
      }
    }), 45000);

    return JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}');
  } catch (err) {
    console.error("Video Analysis Error:", err);
    return null;
  }
}
