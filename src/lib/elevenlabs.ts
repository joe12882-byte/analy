/**
 * Servicio para integrar ElevenLabs TTS vía Proxy de Servidor (Seguro)
 */

export async function synthesizeElevenLabsTTS(text: string): Promise<string | null> {
  try {
    const response = await fetch('/api/tts/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('Proxy TTS Error:', await response.text());
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return base64;
  } catch (error) {
    console.error('Error fetching TTS from proxy:', error);
    return null;
  }
}

