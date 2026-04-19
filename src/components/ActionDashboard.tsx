import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ChevronRight, Search, Mic, Zap, Shield, Heart, Loader2, Sparkles, X, Save, Info, ArrowRight, Database } from 'lucide-react';
import { UserProfile, LearningUnit } from '../types';
import { softenPhrase } from '../lib/gemini';
import { LEARNING_UNITS as LOCAL_LEARNING_UNITS } from '../data/guiones';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthProvider';

// ... (scripts eliminados)

export default function ActionDashboard() {
  const [activeTab, setActiveTab] = useState<'professional' | 'survival' | 'social'>('professional');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [isListeningAnaly, setIsListeningAnaly] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [softenedResult, setSoftenedResult] = useState<any>(null);
  
  const { user, profile: userProfile } = useAuth();
  
  const [learningUnits, setLearningUnits] = useState<LearningUnit[]>([]);
  const [dbStatus, setDbStatus] = useState<'loading' | 'migrating' | 'ready'>('loading');

  useEffect(() => {
    const fetchUnits = async () => {
      // Need Firebase Auth session established
      if (!user) return;
      try {
        const colRef = collection(db, 'learning_units');
        const snapshot = await getDocs(colRef);
        
        if (snapshot.empty) {
// ...
             // Base de datos vacía - Proceso de auto-siembra para administradores
           if (userProfile?.role === 'master' || user.email === 'joe12882@gmail.com') { // <-- The auto seed condition
             setDbStatus('migrating');
             
             // 1. Crear profesión inicial explícitamente primero porque las reglas lo dictan "exists(...)".
             await setDoc(doc(db, 'professions', 'barber'), { 
                name: 'Barbería Profesional', 
                icon: 'Scissors' 
             });
             
             // 2. Insertar los Guiones de Oro
             for (const unit of LOCAL_LEARNING_UNITS) {
               const { id, ...dataToSave } = unit; 
               if (id) {
                 await setDoc(doc(db, 'learning_units', id), dataToSave);
               }
             }

             // 3. Obtener de nuevo tras migración
             const newSnap = await getDocs(colRef);
             const imported = newSnap.docs.map(d => ({ id: d.id, ...d.data() } as LearningUnit));
             setLearningUnits(imported);
             setDbStatus('ready');
           } else {
             // Es un usuario normal pero la DB está vacía
             setLearningUnits([]);
             setDbStatus('ready');
           }
        } else {
          // Poblado normal de Firebase
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LearningUnit));
          setLearningUnits(data);
          setDbStatus('ready');
        }
      } catch (err) {
        console.error("Error al cargar learning_units:", err);
        setDbStatus('ready');
      }
    };
    
    fetchUnits();
  }, [user, userProfile]);

  const filteredScripts = learningUnits.filter(s => 
    s.category === activeTab && 
    (s.phrase_en.toLowerCase().includes(searchQuery.toLowerCase()) || s.phrase_es.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveToLibrary = () => {
    if (!softenedResult) return;
    
    const newEntry: any = {
      id: crypto.randomUUID(),
      topic: softenedResult.softened.substring(0, 30),
      content: `EN: ${softenedResult.softened}\nES (Literal): ${softenedResult.traduccion_literal}\nOriginal: ${softenedResult.original}\nSignificado: ${softenedResult.significado}\nPronunciación: ${softenedResult.pronunciation}`,
      category: 'Táctico',
      sourceType: 'text',
      date: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('analy_local_intel') || '[]');
    localStorage.setItem('analy_local_intel', JSON.stringify([newEntry, ...existing]));
    alert('Guardado con éxito en tu ESTANTE');
  };

  const recognitionRef = React.useRef<any>(null);
  const isAnalyActiveRef = React.useRef(false);

  const startSpeechAPI = (onResult: (text: string, isFinal: boolean) => void, onEnd: () => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("El reconocimiento de voz no es compatible con este navegador.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let isFinalResult = false;
      
      // SOLUCIÓN 3: Iteración correcta para evitar arrastrar basura vieja
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinalResult = true;
      }
      
      // Aseguramos que pasamos texto limpio
      if (fullTranscript.trim().length > 0) {
         onResult(fullTranscript, isFinalResult);
      }
    };

    recognition.onspeechend = () => {
      console.log("Analy: Fin de emisión de voz detectado.");
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Ignorar el error de "no-speech" o "aborted" (generado al hacer .stop() intencional)
        return; 
      }
      console.error("Speech Recognition Error:", event.error);
      setIsListeningSearch(false);
      setIsListeningAnaly(false);
    };

    recognition.onend = onEnd;
    recognition.start();
    return recognition;
  };

  const handleSearchMic = () => {
    if (isListeningSearch) {
      recognitionRef.current?.stop();
      setIsListeningSearch(false);
      return;
    }

    setIsListeningSearch(true);
    recognitionRef.current = startSpeechAPI(
      (text) => setSearchQuery(text),
      () => setIsListeningSearch(false)
    );
  };

  const [showClientView, setShowClientView] = useState(false);

  const startListeningLoop = () => {
    setInterimTranscript('🛡️ Esperando comando... (Di "Analy, ...")');
    recognitionRef.current = startSpeechAPI(
      (text, isFinal) => {
        const lowerText = text.toLowerCase();
        const wakeWords = ['analy', 'analí', 'anali', 'analee', 'annaly', 'ana lee', 'ana li', 'anna lee', 'analeigh'];
        
        let earliestIndex = -1;
        let bestTrigger = '';
        
        wakeWords.forEach(w => {
          const idx = lowerText.indexOf(w);
          if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
            earliestIndex = idx;
            bestTrigger = w;
          }
        });

        if (earliestIndex !== -1) {
          const phrase = lowerText.substring(earliestIndex + bestTrigger.length).trim();
          
          if (isFinal) {
            if (phrase.length > 2) {
              setInterimTranscript(`Activando: "${phrase}"...`);
              isAnalyActiveRef.current = false; // Prevent auto-restart while processing
              recognitionRef.current?.stop(); 
              processIntention(phrase);
            } else {
              setInterimTranscript('Analy: ¿Qué necesitas? (Te escucho)');
            }
          } else {
            setInterimTranscript(`Analy: escuchando... ${phrase}`);
          }
        } else {
          if (isFinal) {
             setInterimTranscript('🛡️ Esperando comando... (Di "Analy, ...")');
          } else {
             setInterimTranscript('[Omitiendo ruido de fondo...]');
          }
        }
      },
      () => {
        // Lógica de Auto-Recuperación real
        if (isAnalyActiveRef.current) {
          setTimeout(() => {
            if (isAnalyActiveRef.current) {
               startListeningLoop();
            }
          }, 100);
        } else {
          setIsListeningAnaly(false);
          setInterimTranscript('');
        }
      }
    );
  };

  const handleAnalyMic = () => {
    if (isListeningAnaly) {
      isAnalyActiveRef.current = false;
      recognitionRef.current?.stop();
      setIsListeningAnaly(false);
      setSoftenedResult(null);
      setInterimTranscript('');
      return;
    }

    isAnalyActiveRef.current = true;
    setIsListeningAnaly(true);
    startListeningLoop();
  };

  const processIntention = async (phrase: string) => {
    setIsProcessing(true);
    setInterimTranscript('Conectando al motor Analy...'); 
    
    // Mejorar la detección limpiando prefijos (Analy, Analí, etc.) y signos de puntuación
    const lowerPhrase = phrase.trim().toLowerCase();
    const cleanPhrase = lowerPhrase.replace(/^(analy|analí|anali|analee|annaly|ana lee|ana li)[\s,:-]*/, '');
    const mode: 'client' | 'tutor' = cleanPhrase.startsWith('dile') ? 'client' : 'tutor';
    
    try {
      const result = await softenPhrase(phrase, userProfile?.occupation, activeTab, mode);
      if (result && !result.errorMsg) {
        if (result.insulto_filtrado) {
          try {
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
          } catch (vErr) {
            console.warn("Vibration not supported");
          }
        }

        // Forzamos la lógica del frontend como capa de seguridad en caso de que la IA ignore el booleano
        const isClientView = mode === 'client' || !!result.showClientCard;

        setSoftenedResult({
          ...result,
          original: phrase,
          showClientCard: isClientView // Homogenizar para el render
        });
        
        // Show client view securely
        setShowClientView(isClientView);
        
        speak(result.softened, true); // Pasar bandera para auto-reanudar
        setInterimTranscript(''); // Limpiar si es exitoso
      } else {
        const errorDetail = String(result?.errorMsg || '');
        if (errorDetail.includes('429') || errorDetail.includes('depleted') || errorDetail.includes('RESOURCE_EXHAUSTED')) {
          setInterimTranscript(`😅 Ups, nos quedamos sin créditos en Google. ¡Dile al profe que recargue!`);
        } else if (errorDetail.includes('TIMEOUT_EXCEEDED')) {
          setInterimTranscript(`⏳ Tómate tu tiempo... el servidor está un poco lento. Intenta de nuevo.`);
        } else {
          setInterimTranscript(`🙌 ¡Sigue intentando, vas por buen camino! Hubo un pequeño error: ${errorDetail.substring(0, 30)}...`);
        }
        setTimeout(() => {
          isAnalyActiveRef.current = true;
          startListeningLoop();
        }, 5000);
      }
    } catch (err: any) {
      const errMsg = String(err.message || '');
      if (errMsg.includes('TIMEOUT_EXCEEDED')) {
        setInterimTranscript(`⏳ Tómate tu tiempo... Analy está tardando en procesar.`);
      } else {
        setInterimTranscript(`🌟 ¡No te rindas! Hemos tenido una pequeña pausa en la red.`);
      }
      setTimeout(() => {
        isAnalyActiveRef.current = true;
        startListeningLoop();
      }, 5000);
    }
    
    setIsProcessing(false);
  };

  // Se añadió el parámetro resumeListening para volver a escuchar tras hablar
  const speak = (text: string, resumeListening: boolean = false) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    const femaleVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Zira') || 
      v.name.includes('Google US English') || 
      v.name.includes('Microsoft Sabina') ||
      v.name.includes('Female')
    );

    if (femaleVoice) {
      utterance.voice = femaleVoice;
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
    } else {
      utterance.pitch = 1.2;
      utterance.rate = 0.9;
    }
    
    utterance.lang = 'en-US';
    
    if (resumeListening) {
      utterance.onend = () => {
        // Al terminar de hablar, reintegra la escucha si no fue desactivada manualmente
        isAnalyActiveRef.current = true;
        setIsListeningAnaly(true);
        startListeningLoop();
      };
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery) {
      const exists = learningUnits.some(s => 
        s.phrase_es.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.phrase_en.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (!exists) {
        processIntention(searchQuery);
      }
    }
  };

  const tabIcons = {
    professional: <Zap size={14} />,
    survival: <Shield size={14} />,
    social: <Heart size={14} />
  };

  const tabLabels = {
    professional: 'Profesional',
    survival: 'Supervivencia',
    social: 'Social'
  };

  return (
    <div className="p-4 space-y-6 min-h-[85vh]">
      {/* Client View Fullscreen Overlay */}
      <AnimatePresence>
        {showClientView && softenedResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center p-8"
          >
            <div className="flex-1 w-full flex items-center justify-center">
              <h1 className="text-4xl md:text-5xl font-black text-[#3B82F6] text-center leading-tight tracking-tight">
                "{softenedResult.softened}"
              </h1>
            </div>
            <div className="pb-12 w-full max-w-md space-y-4">
              <button 
                onClick={() => setShowClientView(false)}
                className="w-full py-5 text-center bg-white shadow-xl shadow-blue-900/5 hover:bg-slate-50 border border-slate-100 rounded-3xl text-slate-700 font-bold tracking-wide transition-all flex items-center justify-center gap-2"
              >
                Cerrar y Ver Notas Tutor <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Voice Input */}
      <div className="space-y-4">
        <div className={`relative transition-all duration-300 ${isListeningSearch ? 'listening-pulse' : ''} rounded-xl`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Escribe o dicta lo que quieras decir..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-12 pr-12 text-sm tracking-wide focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button 
            onClick={handleSearchMic}
            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all ${isListeningSearch ? 'text-blue-500 scale-125' : 'text-slate-400 hover:text-blue-500'}`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {/* Master Details Display (Only shows when client view is false) */}
        <AnimatePresence>
          {!showClientView && softenedResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotate: -1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotate: 1 }}
              className="analy-card p-6 border border-amber-200/40 bg-[#FFFDF5] shadow-[2px_4px_16px_rgba(0,0,0,0.05)] relative overflow-hidden group"
            >
              <button 
                onClick={() => setSoftenedResult(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-xs font-bold text-amber-700 tracking-wide">Notas de tu Tutor Analy 💛</span>
              </div>

              <div className="space-y-6">
                <div className="bg-white/60 p-4 rounded-xl border border-amber-100/50">
                  <div className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-wider">Dijiste (Original)</div>
                  <p className="text-sm font-medium text-slate-700">"{softenedResult.original}"</p>
                </div>

                <div className="space-y-2 px-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] text-blue-500 uppercase font-black tracking-wider">Traducción Pro (EN)</div>
                    {softenedResult.insulto_filtrado && (
                      <div className="text-[9px] bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full font-black flex items-center gap-1">
                        <Shield size={10} />
                        Filtro Activo
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-800 leading-tight">
                    {softenedResult.softened}
                  </div>
                  <div className="text-sm text-blue-500/80 font-medium italic">
                    👄 {softenedResult.pronunciation}
                  </div>
                </div>

                <div className="px-2">
                   <div className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-wider">Significa Literalmente (ES)</div>
                   <p className="text-base text-slate-600 font-medium">"{softenedResult.traduccion_literal}"</p>
                </div>

                {softenedResult.showClientCard === false && softenedResult.tutorFeedback && (
                  <div className="mt-4 p-5 rounded-2xl border border-blue-100 bg-blue-50 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-2xl" />
                     <p className="text-sm text-blue-900 leading-relaxed font-medium">{softenedResult.tutorFeedback}</p>
                  </div>
                )}

                {(!softenedResult.tutorFeedback || softenedResult.showClientCard !== false) && (
                  <div className="px-2">
                     <div className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-wider">Consejo</div>
                     <p className="text-sm text-slate-600 leading-relaxed">{softenedResult.significado}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    onClick={() => speak(softenedResult.softened, false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-blue-500 text-white shadow-xl shadow-blue-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Volume2 size={16} /> Escuchar
                  </button>
                  <button 
                    onClick={handleSaveToLibrary}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-white border border-slate-200 text-slate-600 shadow-sm rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    <Save size={16} /> Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-3 gap-2">
        {(['professional', 'survival', 'social'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-1 rounded-2xl flex flex-col items-center gap-2 transition-all border ${
              activeTab === tab 
                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm scale-105' 
                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
            }`}
          >
            {tabIcons[tab]}
            <span className="text-[10px] font-bold tracking-wide">
              {tabLabels[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista Táctica */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Resultados: {tabLabels[activeTab]}
          </h2>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
            {dbStatus === 'loading' || dbStatus === 'migrating' ? '...' : filteredScripts.length} Unidades
          </span>
        </div>

        <AnimatePresence mode="wait">
          {dbStatus === 'loading' || dbStatus === 'migrating' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50"
            >
              <Database className="animate-pulse text-blue-500" size={48} strokeWidth={1} />
              <p className="text-[10px] uppercase font-black text-blue-600 tracking-widest">
                {dbStatus === 'migrating' 
                  ? 'Migrando base de datos a Firebase...' 
                  : 'Sincronizando con Servidor...'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-3"
            >
              {filteredScripts.length > 0 ? (
                filteredScripts.map((script) => (
                  <ScriptCard key={script.id} script={script} onSpeak={speak} />
                ))
              ) : (
                <div className="py-20 text-center space-y-2 opacity-10">
                  <Search className="mx-auto" size={48} strokeWidth={1} />
                  <p className="text-[10px] uppercase font-black tracking-widest">Sin Coincidencias Tácticas</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Tactical Assistant - Analy Wake Word */}
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isListeningAnaly && (
            <motion.div 
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-blue-500 text-white px-4 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-wide shadow-xl flex flex-col gap-2 max-w-[200px] border-4 border-white"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>Analy escuchando...</span>
              </div>
              {interimTranscript && (
                <div className="text-[10px] normal-case font-medium opacity-90 border-t border-blue-400 pt-2 italic line-clamp-2">
                  "{interimTranscript}"
                </div>
              )}
              {!interimTranscript && (
                <div className="text-[9px] normal-case opacity-80 pt-1 font-medium">
                  Dí: "Analy, [lo que necesites]"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className={`absolute inset-0 bg-blue-400 rounded-full filter blur-[30px] transition-all duration-1000 ${isListeningAnaly ? 'opacity-40 scale-150' : 'opacity-0 scale-100'}`} />
          
          {/* Ondas sutiles si Analy está activa */}
          {isListeningAnaly && (
            <>
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-300 rounded-full filter blur-md"
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -inset-2 border-2 border-blue-200/50 rounded-full"
              />
            </>
          )}

          <motion.button
            onClick={handleAnalyMic}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-4 border-white relative z-10 ${
              isListeningAnaly ? 'bg-blue-500 text-white shadow-blue-500/30' : 'bg-slate-50 text-blue-500 hover:bg-slate-100'
            }`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={28} /> : (isListeningAnaly ? <X size={28} /> : <Mic size={28} />)}
          </motion.button>
          
          {!isListeningAnaly && !isProcessing && (
             <div className="absolute -top-1 w-4 h-4 bg-emerald-400 border-4 border-white rounded-full right-1 animate-pulse" />
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide text-center w-full">
          {isListeningAnaly ? 'DETENER ANALY' : 'INICIAR ANALY'}
        </div>
      </div>
    </div>
  );
}

function ScriptCard({ script, onSpeak }: { script: LearningUnit; onSpeak: (text: string) => void; key?: React.Key }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`analy-card overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-100 shadow-md translate-y-[-2px]' : 'hover:shadow-sm'}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5 flex items-center justify-between cursor-pointer bg-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-wide leading-none flex items-center gap-2">
              {script.grammar_tag} • Dificultad {script.difficulty}/5
            </h3>
          </div>
          <p className="font-bold text-slate-700 text-[15px] tracking-tight">{script.phrase_es}</p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
          isExpanded ? "bg-blue-50 text-blue-500 border-blue-100" : "text-slate-400 border-slate-100"
        )}>
           <ChevronRight 
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-90 text-blue-600' : ''}`} 
            size={16} 
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 space-y-4"
          >
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-xl flex items-start justify-between relative group">
                <div className="space-y-2">
                   <div className="text-[#00F0FF] font-black text-lg leading-tight selection:bg-[#00F0FF] selection:text-[#0F0F0F]">
                    {script.phrase_en}
                  </div>
                  <div className="text-gray-500 text-[11px] mono-display flex items-center gap-2 italic">
                    <Volume2 size={12} className="text-[#00F0FF]" />
                    {script.phonetic_tactic}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onSpeak(script.phrase_en); }}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-all active:scale-90"
                >
                  <Volume2 size={18} />
                </button>
              </div>
              
              {script.learning_tips && script.learning_tips.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 mb-1 text-orange-600 font-bold uppercase tracking-wider text-[10px]">
                    <Sparkles size={12} />
                    <span>Learning Tips (Analy)</span>
                  </div>
                  <ul className="text-[11px] text-orange-900 leading-relaxed font-medium list-disc list-inside space-y-1">
                    {script.learning_tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}