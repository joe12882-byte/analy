import React, { useState, useEffect } from 'react';
import { Volume2, Settings2, RotateCcw, Check, UserCircle2, BrainCircuit, ShieldCheck, ExternalLink } from 'lucide-react';
import { initVoices, getFemaleVoices, speak, VoiceSettings, setVoiceSettings } from '../lib/speech';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { safeStorage } from '../lib/storage';

export default function VoiceSelector() {
  const { profile } = useAuth();
  const isMaster = profile?.email === 'joe12882@gmail.com';
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({ auto: true });
  const [testing, setTesting] = useState(false);
  const [quota, setQuota] = useState<number | null>(null);
  const [hasElevenLabs, setHasElevenLabs] = useState(false);

  useEffect(() => {
    // Verificar si el Plan A está configurado en el servidor
    const checkTTSStatus = async () => {
      try {
        const res = await fetch('/api/tts/status');
        const data = await res.json();
        setHasElevenLabs(data.hasElevenLabs);
      } catch {
        setHasElevenLabs(false);
      }
    };
    checkTTSStatus();

    // Escuchar cuota si es Master
    let unsub = () => {};
    if (isMaster && hasElevenLabs) {
      const monthId = new Date().toISOString().slice(0, 7);
      unsub = onSnapshot(doc(db, 'system', `elevenlabs_quota_${monthId}`), (snap) => {
        if (snap.exists()) setQuota(snap.data().used);
      }, (err) => {
        if (err.code !== 'cancelled' && !err.message.includes('idle stream')) {
          console.error("Quota sync error:", err);
        }
      });
    }

    // Cargar voces al montar
    const loadVoices = async () => {
      await initVoices();
      const engVoices = await getFemaleVoices('en'); // Centrado en voces para enseñar inglés
      setVoices(engVoices);
    };
    
    // Cargar configuración de localStorage
    const data = safeStorage.getItem('analy_voice_settings');
    if (data) {
      try {
        setSettings(JSON.parse(data));
      } catch {}
    }

    loadVoices();
    return () => unsub();
  }, [isMaster, hasElevenLabs]);

  const handleSelect = (voiceURI: string) => {
    const newSettings = { auto: false, selectedVoiceURI: voiceURI };
    if (voiceURI === 'auto') {
      newSettings.auto = true;
      delete newSettings.selectedVoiceURI;
    }
    setSettings(newSettings);
    setVoiceSettings(newSettings);
  };

  const testVoice = async () => {
    setTesting(true);
    const phrase = hasElevenLabs && settings.auto 
      ? "Hola Joel, soy tu Plan A. Escucha los matices de mi voz y mis respiraciones. Estoy aquí para que hablemos inglés de verdad."
      : "Hi, I am Anali. Let me help you speak English with confidence.";
    
    await speak(phrase, hasElevenLabs && settings.auto ? "es-MX" : "en-US");
    setTimeout(() => setTesting(false), 5000); 
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5 relative overflow-hidden">
      {settings.auto && hasElevenLabs && (
        <div className="absolute top-0 right-0 p-2">
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-bl-2xl font-black text-[8px] uppercase tracking-tighter">
            <ShieldCheck size={10} /> Plan A Activo
          </div>
        </div>
      )}

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
          <div className="flex items-center justify-between mb-2 px-1">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Selecciona su voz</label>
             {settings.auto && hasElevenLabs && (
               <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                 <BrainCircuit size={10} /> ElevenLabs AI
               </span>
             )}
          </div>
          
          <div className="relative">
            <select
              value={settings.auto ? 'auto' : settings.selectedVoiceURI || 'auto'}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
            >
              <option value="auto">🔥 {hasElevenLabs ? 'Voz Humana (ElevenLabs)' : 'IA Automática (Recomendada)'}</option>
              {voices.length > 0 && <optgroup label={`Voces Locales (${voices.length})`}>
                {voices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </optgroup>}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Settings2 size={16} />
            </div>
          </div>
          
          {hasElevenLabs && settings.auto && isMaster && (
            <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uso del Mes</span>
                <span className="text-[9px] font-mono text-slate-500">{(quota || 0).toLocaleString()} chars</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, ((quota || 0) / 10000) * 100)}%` }} 
                />
              </div>
            </div>
          )}

          {!hasElevenLabs && settings.auto && (
            <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
               <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                 Usando Plan B (Voz local). Para activar la voz con respiración humana, el Master debe configurar la clave de ElevenLabs en los secretos.
               </p>
            </div>
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
          
          {!settings.auto && (
            <button
              onClick={() => handleSelect('auto')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              <RotateCcw size={18} />
              Restablecer
            </button>
          )}
        </div>

        {isMaster && (
          <div className="pt-4 mt-2 border-t border-slate-50">
            <a 
              href="https://elevenlabs.io/app/voice-lab" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-500 transition-colors"
            >
              <ExternalLink size={12} /> Configurar Voice ID en ElevenLabs
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
