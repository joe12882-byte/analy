import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey: 'AQ.Ab8RN6JFPtET8fywD7z2U-7Sp5_esfG7-XG7IWp95F9UvvNuaw'});
ai.models.generateContent({model: 'gemini-2.5-flash', contents: 'hello'}).then(r => console.log('OK:', r.text)).catch(e => console.log('ERROR:', e.message));
