import { synthesizeElevenLabsTTS } from './elevenlabs';
import { getCachedAudio, setCachedAudio, trackElevenLabsUsage } from './ttsTracker';

import { safeStorage } from './storage';

export type VoiceSettings = {
  selectedVoiceURI?: string;
  auto: boolean;
};

// Configuración persistente...
const getSettings = (): VoiceSettings => {
  return safeStorage.parseJSON<VoiceSettings>('analy_voice_settings', { auto: true });
};

export const setVoiceSettings = (settings: VoiceSettings) => {
  safeStorage.setItem('analy_voice_settings', JSON.stringify(settings));
};

// Listas de filtro para Anali
const FEMALE_WHITELIST = [
  // Apple / macOS / iOS
  'samantha', 'victoria', 'allison', 'ava', 'karen', 'moira', 'tessa', 'fiona', 'kate', 'serena',
  // Google / Android / Chrome
  'google us english female', 'google uk english female',
  // Microsoft / Windows
  'zira', 'aria', 'jenny', 'libby', 'michelle', 'sonia', 'clara', 'emma',
  // Spanish
  'paulina', 'monica', 'helena', 'lucia', 'elena', 'ximena'
];

const MALE_BLACKLIST = [
  'alex', 'daniel', 'fred', 'david', 'diego', 'jorge', 'carlos'
];

let voicesCache: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

export const initVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve([]);
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesCache = voices;
      voicesLoaded = true;
      return resolve(voices);
    }

    // Chrome/Safari necesitan este evento async
    window.speechSynthesis.onvoiceschanged = () => {
      voicesCache = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(voicesCache);
    };

    // Fallback polling de 2 segundos por si el evento falla
    setTimeout(() => {
      if (!voicesLoaded) {
        voicesCache = window.speechSynthesis.getVoices();
        voicesLoaded = true;
        resolve(voicesCache);
      }
    }, 2000);
  });
};

export const getFemaleVoices = async (langPrefix: string = 'en'): Promise<SpeechSynthesisVoice[]> => {
  let voices = voicesCache.length > 0 ? voicesCache : await initVoices();
  
  return voices.filter(v => {
    // 1. Filtrar por el prefijo de idioma (ej. 'en' o 'es')
    if (!v.lang.toLowerCase().startsWith(langPrefix.toLowerCase())) return false;
    
    const name = v.name.toLowerCase();
    
    // 2. Descartar masculinos explícitos
    if (MALE_BLACKLIST.some(male => name.includes(male))) return false;
    
    // 3. Incluir explícitos femeninos o que tengan "female" en el nombre
    if (name.includes('female')) return true;
    if (FEMALE_WHITELIST.some(female => name.includes(female))) return true;
    
    // Fallback: Si no está en blacklist ni whitelist, podría ser neutro, lo omitimos para ser estrictos 
    // y mantener calidad, PERO lo dejamos si es lo único que hay (manejado en getBestVoice)
    return false;
  });
};

export const getBestVoice = async (lang: string = 'en-US'): Promise<SpeechSynthesisVoice | null> => {
  const settings = getSettings();
  let voices = voicesCache.length > 0 ? voicesCache : await initVoices();
  const exactLangPrefix = lang.split('-')[0];

  // 1. Preferencia del usuario
  if (!settings.auto && settings.selectedVoiceURI) {
    const userVoice = voices.find(v => v.voiceURI === settings.selectedVoiceURI);
    if (userVoice) return userVoice;
  }

  // 2. Automático: Intentar encontrar voz femenina robusta
  const femaleVoices = await getFemaleVoices(exactLangPrefix);
  
  if (femaleVoices.length > 0) {
    // Intentar que el locale coincida exactamente (ej. en-US vs en-GB), sino cualquiera
    const exactLocaleVoice = femaleVoices.find(v => v.lang.replace('_', '-') === lang.replace('_', '-'));
    if (exactLocaleVoice) return exactLocaleVoice;
    return femaleVoices[0];
  }

  // 3. Fallback: Cualquier voz del idioma que no sea claramente masculina
  const langVoices = voices.filter(v => v.lang.startsWith(exactLangPrefix));
  const neutra = langVoices.find(v => !MALE_BLACKLIST.some(m => v.name.toLowerCase().includes(m)));
  
  if (neutra) return neutra;
  
  // 4. Último recurso
  return langVoices[0] || voices[0] || null;
};

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

export const speak = async (text: string, lang: string = 'en-US', forcePlanA: boolean = false): Promise<any> => {
  const settings = getSettings();
  
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (activeUtterance) {
     activeUtterance.onend = null;
     activeUtterance = null;
  }

  // Verificar estado Plan A asíncronamente o desde un estado cargado
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/tts/status');
      return await res.json();
    } catch {
       return { hasElevenLabs: false };
    }
  };

  const status = await checkStatus();

  // PLAN A: ElevenLabs (Solo si se solicita explícitamente forcePlanA y el usuario es Master)
  const profile = safeStorage.parseJSON<any>('analy_user_profile', null);
  const isMaster = profile?.role === 'master' || profile?.email === 'joe12882@gmail.com';

  if (forcePlanA && status.hasElevenLabs && isMaster) {
    const hashStr = Math.abs(Array.from(text).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)).toString();
    const cacheKey = `tts_el_${text.length}_${hashStr}`;
    
    let audioContent = await getCachedAudio(cacheKey);

    if (!audioContent) {
      try {
        audioContent = await synthesizeElevenLabsTTS(text);
        if (audioContent) {
          setCachedAudio(cacheKey, audioContent).catch(() => {});
          trackElevenLabsUsage(text.length).catch(() => {});
        }
      } catch (err) {
        console.warn("Fallo transparente en ElevenLabs, usando Plan B", err);
      }
    }

    if (audioContent) {
      activeAudio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      const playable = { onend: null as (() => void) | null, lang };
      
      activeAudio.onended = () => {
         if (playable.onend) playable.onend();
         activeAudio = null;
      };
      
      try {
        await activeAudio.play();
        return playable;
      } catch (e) {
        console.warn("Audio interactivo bloqueado, saltando a Plan B", e);
        activeAudio = null;
      }
    }
  }

  // PLAN B: Navegador (Sistema local gratuito)
  if (!window.speechSynthesis) return null;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  const voice = await getBestVoice(lang);
  if (voice) {
    utterance.voice = voice;
    // Si es voz de Google o similar, podemos ajustar pitch/rate para sonar más joven
    if (voice.name.toLowerCase().includes('google')) {
      utterance.pitch = 1.3; // Más agudo = más joven
      utterance.rate = 1.0;  // Velocidad normal para claridad
    } else {
      utterance.pitch = 1.2;
      utterance.rate = 0.95;
    }
  } else {
    utterance.pitch = 1.3;
  }
  
  if (lang.startsWith('en')) {
    utterance.rate = 0.9;
  }

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return utterance;
};
