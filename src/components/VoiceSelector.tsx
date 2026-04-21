import React, { useState, useEffect } from 'react';
import { Volume2, Settings2, RotateCcw, UserCircle2 } from 'lucide-react';
import { speak, VoiceSettings, setVoiceSettings } from '../lib/speech';

export default function VoiceSelector() {
  const [settings, setSettings] = useState<VoiceSettings>({ auto: true });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Cargar configuración de localStorage
    try {
      const data = localStorage.getItem('analy_voice_settings');
      if (data) {
        setSettings(JSON.parse(data));
      }
    } catch {}
  }, []);

  const handleSelect = (mode: string) => {
    const isAuto = mode === 'auto';
    const newSettings = { auto: isAuto };
    setSettings(newSettings);
    setVoiceSettings(newSettings);
  };

  const testVoice = async () => {
    setTesting(true);
    await speak("¡Hola Joel! Ya no soy un robot, ahora soy Analí y hablo como una niña para ayudarte a ser el mejor barbero. ¿A que ahora sí me escucho bien?", "es-ES");
    // Pseudo estado de 'hablando'
    setTimeout(() => setTesting(false), 8000); 
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
          <UserCircle2 size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Voz de Anali</h3>
          <p className="text-xs text-slate-500 font-medium">Personaliza el acento y tono de tu tutora</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Selecciona su voz</label>
          <div className="relative">
            <select
              value={settings.auto ? 'auto' : 'local'}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
            >
              <option value="auto">✨ Analí Premium (Voz de Niña)</option>
              <option value="local">🔋 Modo Ahorro (Voz Local)</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Settings2 size={16} />
            </div>
          </div>
          {!import.meta.env.VITE_GCP_TTS_API_KEY && settings.auto && (
            <p className="text-xs text-amber-500 mt-2 font-medium flex gap-1">
              Falta la clave API de GCP para premium, se usará la voz local como respaldo.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={testVoice}
            disabled={testing}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              testing 
                ? 'bg-pink-100 text-pink-400' 
                : 'bg-pink-500 text-white hover:bg-pink-400 hover:-translate-y-0.5 shadow-pink-500/20'
            }`}
          >
            <Volume2 size={18} className={testing ? 'animate-pulse' : ''} />
            {testing ? 'Hablando...' : 'Probar voz'}
          </button>
        </div>
      </div>
    </div>
  );
}
