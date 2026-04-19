import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { GUIONES } from "../data/guiones";

// Dynamic get of AI Client to support Custom API keys via local storage
const getAIClient = () => {
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('analy_custom_gemini_key') : null;
  // USER'S HARDCODED API KEY (as requested)
  const FALLBACK_KEY = 'AIzaSyDoPwXlJIViHJBQa1W7wwF_IHaye_LmNG8';
  const apiKey = customKey || process.env.GEMINI_API_KEY || FALLBACK_KEY;
  return new GoogleGenAI({ apiKey });
};

const withTimeout = <T>(promise: Promise<T>, ms: number = 20000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`TIMEOUT_EXCEEDED: El servidor de IA tardó demasiado (${ms}ms) o no hay cuota.`)), ms);
  });
  return Promise.race([promise, timeout]);
};

export async function softenPhrase(phrase: string, occupation: string = 'General User', activeCategory: string = 'professional', mode: 'client' | 'tutor' = 'client') {
  try {
    const ai = getAIClient();
    // Dynamic Context Loading (Optimization) - Filter by category instead of sending all
    const relevantGuiones = GUIONES.filter(g => g.category === activeCategory);
    const dbString = JSON.stringify(relevantGuiones);

    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are Analy, a tactful friend and expert professional translator for global workers.
        Your Active Database of "Guiones de Oro" (Focused on ${activeCategory}): ${dbString}
        CRITICAL: Prioritize these guiones when the user's input matches or relates to these professional, survival, or social situations.
        Filter out all negativity, insults, and complaints. Extract ONLY the technical or professional core instruction.
        Convert it into a professional, polite, and confident English version (Softening).
        Context: The user works as a ${occupation}.
        
        ${mode === 'client' 
          ? 'MODE: CLIENT COMMUNICATION. The user is asking you what to say to a client. Focus on the polite translation to say immediately. MUST set showClientCard to true.' 
          : 'MODE: STUDENT/TUTOR. The user wants to learn or asks a question. Act as a pedagogical English tutor. Give explanations, grammar tips, and constructive feedback in Spanish. MUST set showClientCard to false.'
        }`,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            softened: { 
              type: Type.STRING, 
              description: "The professional English translation to speak to the client."
            },
            traduccion_literal: { 
              type: Type.STRING, 
              description: "CRITICAL: A direct, literal word-by-word Spanish translation of the GENERATED 'softened' English phrase. Do NOT return the user's original input here. (Example: If softened is 'How's this looking?', this should be '¿Cómo se está viendo esto?')."
            },
            pronunciation: { type: Type.STRING },
            significado: { type: Type.STRING },
            insulto_filtrado: { type: Type.BOOLEAN }
          },
          required: ["softened", "traduccion_literal", "pronunciation", "significado", "insulto_filtrado"]
        }
      },
      contents: `Soften this phrase: "${phrase}"`
    }), 20000);

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Gemini Error:", error?.message || error);
    return { errorMsg: String(error?.message || error) };
  }
}

export async function analyzeToolImage(base64Image: string) {
  try {
    const ai = getAIClient();
    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `Identity the object in the image. It could be an everyday item, a professional tool, or a sign.
        Provide: toolName, briefUsage (what it is for), and 3 common English phrases used with this object.
        Return as JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            toolName: { type: Type.STRING },
            briefUsage: { type: Type.STRING },
            phrases: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["toolName", "briefUsage", "phrases"]
        }
      },
      contents: [
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
        { text: "Analyze this object for contextual learning." }
      ]
    }), 12000);

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Vision Gemini Error:", error);
    return null;
  }
}

export async function curateContent(input: string) {
  try {
    const ai = getAIClient();
    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-pro", // Switching to Pro for complex extraction/PDF logic
      config: {
        temperature: 0.2, // Alta precisión analítica
        topP: 0.8,        // Reducción de variadas para respuestas lógicas directas
        topK: 40,         // Enfocado en tokens de alta probabilidad
        systemInstruction: `Act as a master curator for 'Analy'. 
        Extract lessons, vocabulary, and grammar tips from the provided text.
        Categorize the extracted tips appropriately (e.g., 'Gramática', 'Barbería', 'Supervivencia', 'Jerga/Social').
        Return as a structured JSON object with an array 'extractedTips'.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  content: { type: Type.STRING },
                  category: { type: Type.STRING }
                }
              }
            }
          }
        }
      },
      contents: input
    }), 60000); // 60s timeout extended for large context window (PDFs/Long text)

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Curation Error:", error);
    return null;
  }
}

export async function extractFromYouTube(url: string) {
  try {
    const ai = getAIClient();
    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-pro", // Switching to Pro for deep link/video analysis
      config: {
        temperature: 0.2, // Alta precisión analítica
        topP: 0.8,
        topK: 40,
        systemInstruction: `You are an expert Content Curator for the 'Analy' platform.
        You will receive a URL or description of a YouTube/TikTok/IG video (Lesson or Class).
        Your mission is to extract the best "Golden Phrases" (Tactical Phrases) for workers.
        Auto-classify the content into one of these relevant categories based on the content (e.g., 'professional', 'survival', 'social', 'grammar', 'barbería' or suggest a new short one).
        For each phrase, provide:
        - spanish: The lesson/phrase in Spanish.
        - english: The tactical softened English version.
        - pronunciation: A simple phonetic guide for Spanish speakers.
        - significado: Why this phrase is useful in a work context.
        - category: The auto-classified category string.
        Return an ARRAY of these objects in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              spanish: { type: Type.STRING },
              english: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
              significado: { type: Type.STRING },
              category: { type: Type.STRING } // Removed fixed enum to allow smart sponge categorization
            },
            required: ["spanish", "english", "pronunciation", "significado", "category"]
          }
        }
      },
      contents: `Extract tactical intelligence and auto-categorize from this source context: ${url}`
    }), 60000); // 60s timeout extended for deep video context window

    return JSON.parse(response.text);
  } catch (error) {
    console.error("YouTube Logic Error:", error);
    return null;
  }
}
