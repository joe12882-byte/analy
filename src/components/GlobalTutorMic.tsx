import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Loader2, Volume2, Sparkles, AlertCircle, Compass } from 'lucide-react';
import { softenPhrase } from '../lib/gemini';
import { useAuth } from './AuthProvider';

import { speak } from '../lib/speech';

export default function GlobalTutorMic() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Hide on Dashboard and Camera because they have their own specific mic logic
  if (location.pathname === '/' || location.pathname === '/camera') {
    return null;
  }

  const handleStartListening = () => {
    // Reset states
    setResult(null);
    setErrorMsg(null);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    // Prefer Spanish to understand the user's doubt, but allow English
    recognition.lang = 'es-ES';
    recognition.continuous = false; // One-shot
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      
      if (transcript.trim().length > 0) {
        setIsListening(false); // Stop UI listening immediately
        await processQuery(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setErrorMsg('Error al escuchar. Inténtalo de nuevo.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Speech API error", e);
      setIsListening(false);
    }
  };

  const processQuery = async (phrase: string) => {
    setIsProcessing(true);
    try {
      const trustMode = (localStorage.getItem('analy_trust_mode') || 'formal') as 'formal' | 'social';
      const output = await softenPhrase(phrase, profile?.occupation, 'general', 'tutor', trustMode);
      if (output && !output.errorMsg) {
        
        if (output.is_navigation) {
          // Speak enthusiastic reply
          if (output.assistant_reply) speak(output.assistant_reply);
          
          // Pre-configurar el escenario de roleplay si existe
          if (output.nav_scenario) {
            localStorage.setItem('analy_nav_scenario', output.nav_scenario);
          }

          // Mapear rutas de Gemini a las rutas reales de la app
          let targetPath = '/';
          if (output.nav_route === '/roleplay') targetPath = '/?mode=roleplay';
          else if (output.nav_route === '/shadow') targetPath = '/?mode=shadow';
          else if (output.nav_route === '/library' || output.nav_route === '/admin') targetPath = '/admin';
          else if (output.nav_route === '/settings') targetPath = '/settings';
          else if (output.nav_route === '/') targetPath = '/?mode=normal';

          // Navigate!
          navigate(targetPath);
          setResult({ ...output, original: phrase, successMsg: output.assistant_reply });
          setTimeout(() => closeModal(), 3500); 
          return;
        }

        setResult({ ...output, original: phrase });
        handleSpeak(output.corrected_en || output.softened || output.assistant_reply);
      } else {
        setErrorMsg(output?.errorMsg || 'No se pudo generar la respuesta.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión con Analí.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeak = (text: string) => {
    speak(text, 'en-US');
  };

  const closeModal = () => {
    setResult(null);
    setErrorMsg(null);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  return (
    <>
      {/* Global Botón Flotante */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
        <button
          onClick={handleStartListening}
          disabled={isListening || isProcessing}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all relative ${
            isListening 
              ? 'bg-rose-500 text-white border-4 border-rose-200 scale-110 animate-pulse' 
              : 'bg-teal-500 text-white border-2 border-white hover:bg-teal-600 hover:scale-105'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={24} />
          ) : isListening ? (
            <Mic size={24} className="animate-bounce" />
          ) : (
            <Mic size={24} />
          )}
        </button>
      </div>

      {/* Global Overlay Modal for Result */}
      <AnimatePresence>
        {(result || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-x-4 bottom-24 z-50 max-w-sm mx-auto"
          >
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[70vh]">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0">
                <div className="flex items-center gap-2 text-teal-600 font-bold uppercase tracking-widest text-[10px]">
                  <Sparkles size={14} /> Ficha Tutor
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 relative">
                {errorMsg && (
                  <div className="bg-rose-50 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-rose-500 shrink-0" size={18} />
                    <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
                  </div>
                )}

                {result && result.is_navigation ? (
                  <div className="bg-emerald-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 border border-emerald-100/50">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
                      <Compass size={32} />
                    </div>
                    <p className="text-lg font-black text-emerald-700">{result.successMsg}</p>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Redirigiendo...</p>
                  </div>
                ) : result ? (
                  <>
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase">Tú preguntaste:</p>
                       <p className="text-sm font-medium text-slate-700 italic">"{result.original}"</p>
                    </div>

                    <div className="bg-teal-50 p-4 rounded-2xl flex items-start justify-between border border-teal-100/50">
                      <div>
                        <div className="text-teal-600 font-black text-xl tracking-tight leading-tight">
                          {result.corrected_en || result.softened}
                        </div>
                        <div className="text-slate-500 text-xs mt-2 font-mono bg-white inline-block px-2 py-0.5 rounded shadow-sm">
                          👄 {result.phonetic_tactic}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); speak(result.corrected_en || result.softened); }} className="w-10 h-10 shrink-0 bg-white shadow-sm rounded-full flex items-center justify-center text-teal-500 active:scale-95 transition-transform hover:shadow-md border border-teal-50">
                        <Volume2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-2 pt-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Análisis Técnico</p>
                       <p className="text-sm text-slate-600">
                         {result.learning_tip}
                       </p>
                       {result.mode_notes && (
                         <div className="mt-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                           <p className="text-xs font-bold text-indigo-700">{result.mode_notes}</p>
                         </div>
                       )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
