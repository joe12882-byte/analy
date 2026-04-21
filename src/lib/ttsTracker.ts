import { db } from './firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

export const TTS_FREE_LIMIT = 1000000;
export const TTS_BUDGET_LIMIT = 1312500;

export async function getTTSQuota(): Promise<{ used: number; monthId: string }> {
  const monthId = new Date().toISOString().slice(0, 7); // YYYY-MM
  const quotaRef = doc(db, 'system', `tts_quota_${monthId}`);
  
  try {
    const snap = await getDoc(quotaRef);
    if (!snap.exists()) {
      return { used: 0, monthId };
    }
    return { used: snap.data().used || 0, monthId };
  } catch (e) {
    console.error("Error al obtener cuota", e);
    return { used: 0, monthId }; 
  }
}

export async function trackTTSUsage(chars: number) {
  const monthId = new Date().toISOString().slice(0, 7); // YYYY-MM
  const quotaRef = doc(db, 'system', `tts_quota_${monthId}`);
  try {
    const snap = await getDoc(quotaRef);
    if (!snap.exists()) {
       await setDoc(quotaRef, { used: chars, monthId });
    } else {
       await setDoc(quotaRef, { used: increment(chars) }, { merge: true });
    }
  } catch (e) {
    console.error("Error al guardar cuota", e);
  }
}

export async function synthesizeGoogleCloudTTS(text: string, lang: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GCP_TTS_API_KEY;
  if (!apiKey) return null;

  const isSpanish = lang.toLowerCase().startsWith('es');
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const payload = {
    input: { ssml: `<speak>${safeText}<break time="250ms"/></speak>` },
    voice: {
      languageCode: isSpanish ? 'es-419' : 'en-US',
      name: isSpanish ? 'es-419-Neural2-A' : 'en-US-Neural2-F',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: 6.5,
      speakingRate: 0.85
    }
  };

  try {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
       console.error("Error de GC TTS:", res.status);
       return null;
    }
    const data = await res.json();
    return data.audioContent; // base64 string
  } catch (e) {
    console.error(e);
    return null;
  }
}

// IndexedDB para almacenar audios en base64 y no gastar cuota doblemente
export async function getCachedAudio(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('audio', 'readonly');
      const store = tx.objectStore('audio');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.base64 || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedAudio(key: string, base64: string) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve) => {
      const tx = db.transaction('audio', 'readwrite');
      const store = tx.objectStore('audio');
      store.put({ id: key, base64 });
      tx.oncomplete = () => resolve();
    });
  } catch {
    // ignore
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open('analy_tts_cache', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('audio')) {
        req.result.createObjectStore('audio', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
