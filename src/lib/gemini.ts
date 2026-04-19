import { getGenerativeModel, SchemaType, HarmCategory, HarmBlockThreshold } from "firebase/ai";
import { collection, getDocs } from 'firebase/firestore';
import { db, vertexAI } from './firebase';

const withTimeout = <T>(promise: Promise<T>, ms: number = 20000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`TIMEOUT_EXCEEDED: El servidor de IA tardó demasiado (${ms}ms) o no hay cuota.`)), ms);
  });
  return Promise.race([promise, timeout]);
};

export async function softenPhrase(phrase: string, occupation: string = 'General User', activeCategory: string = 'professional', mode: 'client' | 'tutor' = 'client') {
  try {
    // Dynamic Context Loading (Optimization) - Fetch directly from Firebase
    let dbString = "{}";
    try {
      const colRef = collection(db, 'learning_units');
      const snapshot = await getDocs(colRef);
      const relevantUnits = snapshot.docs
        .map(d => d.data())
        .filter((g: any) => g.category === activeCategory);
      dbString = JSON.stringify(relevantUnits);
    } catch(err) {
      console.warn("Could not load from Firebase, AI will guess context.", err);
    }

    const model = getGenerativeModel(vertexAI, {
      model: "gemini-2.0-flash", 
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
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            softened: { 
              type: SchemaType.STRING, 
              description: "The professional English translation to speak to the client."
            },
            traduccion_literal: { 
              type: SchemaType.STRING, 
              description: "CRITICAL: A direct, literal word-by-word Spanish translation of the GENERATED 'softened' English phrase. Do NOT return the user's original input here. (Example: If softened is 'How's this looking?', this should be '¿Cómo se está viendo esto?')."
            },
            pronunciation: { type: SchemaType.STRING },
            significado: { type: SchemaType.STRING },
            insulto_filtrado: { type: SchemaType.BOOLEAN }
          },
          required: ["softened", "traduccion_literal", "pronunciation", "significado", "insulto_filtrado"]
        }
      }
    });

    const responseResult = await withTimeout(model.generateContent(`Soften this phrase: "${phrase}"`), 20000);
    const rawText = responseResult.response.text() || '';
    const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Gemini Error:", error?.message || error);
    return { errorMsg: String(error?.message || error) };
  }
}

export async function analyzeToolImage(base64Image: string) {
  try {
    const model = getGenerativeModel(vertexAI, {
      model: "gemini-2.0-flash",
      systemInstruction: `Identity the object in the image. It could be an everyday item, a professional tool, or a sign.
        Provide: toolName, briefUsage (what it is for), and 3 common English phrases used with this object.
        Return as JSON.`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            toolName: { type: SchemaType.STRING },
            briefUsage: { type: SchemaType.STRING },
            phrases: { 
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          },
          required: ["toolName", "briefUsage", "phrases"]
        }
      }
    });

    const responseResult = await withTimeout(model.generateContent([
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
      "Analyze this object for contextual learning."
    ]), 12000);

    return JSON.parse(responseResult.response.text());
  } catch (error) {
    console.error("Vision Gemini Error:", error);
    return null;
  }
}

export async function curateContent(input: string) {
  try {
    const model = getGenerativeModel(vertexAI, {
      model: "gemini-2.0-flash", // Reverted to 2.5 flash as 2.5 pro might not be fully available in some standard vertex firebase configurations yet
      systemInstruction: `Act as a master curator for 'Analy'. 
        Extract lessons, vocabulary, and grammar tips from the provided text.
        Categorize the extracted tips appropriately (e.g., 'Gramática', 'Barbería', 'Supervivencia', 'Jerga/Social').
        Return as a structured JSON object with an array 'extractedTips'.`,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            extractedTips: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  topic: { type: SchemaType.STRING },
                  content: { type: SchemaType.STRING },
                  category: { type: SchemaType.STRING }
                }
              }
            }
          }
        }
      }
    });

    const responseResult = await withTimeout(model.generateContent(input), 60000);
    return JSON.parse(responseResult.response.text());
  } catch (error) {
    console.error("Curation Error:", error);
    return null;
  }
}

export async function extractFromYouTube(url: string) {
  try {
    const model = getGenerativeModel(vertexAI, {
      model: "gemini-2.0-flash", // Reverted to 2.5 flash
      systemInstruction: `You are an expert English Pedagogy AI for the 'Analy' platform.
        You will receive a URL or description of a YouTube/TikTok/IG video.
        Your mission is to extract the best "Golden Phrases" (Tactical Phrases) from the context, strictly focusing on teaching English grammar, vocabulary, pronunciation, and cultural usage.
        For each phrase, provide:
        - phrase_en: The tactical softened English version.
        - phrase_es: The professional Spanish translation.
        - phonetic_tactic: A simple phonetic guide for Spanish speakers.
        - learning_tips: An array of strings explaining WHY it's said that way (grammar structure, vocabulary nuances, cultural context). MUST be highly educational.
        - grammar_tag: The main grammatical tag (e.g., 'Presente Simple', 'Verbos Modales', 'Phrasal Verbs').
        - difficulty: A number from 1 to 5 indicating the CEFR difficulty (1=A1, 5=C1/C2).
        - category: Auto-classified as 'professional', 'survival', or 'social'.
        Return an ARRAY of these objects in JSON format.`,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              phrase_en: { type: SchemaType.STRING },
              phrase_es: { type: SchemaType.STRING },
              phonetic_tactic: { type: SchemaType.STRING },
              learning_tips: { 
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              },
              grammar_tag: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              category: { type: SchemaType.STRING } 
            },
            required: ["phrase_en", "phrase_es", "phonetic_tactic", "learning_tips", "grammar_tag", "difficulty", "category"]
          }
        }
      }
    });

    const responseResult = await withTimeout(model.generateContent(`Extract pedagogical English intelligence from this source context: ${url}`), 60000);
    return JSON.parse(responseResult.response.text());
  } catch (error) {
    console.error("YouTube Logic Error:", error);
    return null;
  }
}
