import { db } from './firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { safeStorage } from './storage';

/**
 * Rastrear el uso de caracteres para evitar sorpresas en la factura
 */
export async function trackElevenLabsUsage(chars: number) {
  const monthId = new Date().toISOString().slice(0, 7); // YYYY-MM
  const quotaRef = doc(db, 'system', `elevenlabs_quota_${monthId}`);
  try {
    const snap = await getDoc(quotaRef);
    if (!snap.exists()) {
       await setDoc(quotaRef, { used: chars, monthId });
    } else {
       await setDoc(quotaRef, { used: increment(chars) }, { merge: true });
    }
  } catch (e) {
    console.error("Error al guardar cuota ElevenLabs", e);
  }
}

/**
 * Cache simple en IndexedDB o LocalStorage para no repetir llamadas a la API de pago
 */
export async function getCachedAudio(key: string): Promise<string | null> {
  return safeStorage.getItem(key);
}

export async function setCachedAudio(key: string, base64: string): Promise<void> {
    // Solo guardamos si es razonablemente corto para localStorage (5MB limit total)
    if (base64.length < 100000) { 
      safeStorage.setItem(key, base64);
    }
}
