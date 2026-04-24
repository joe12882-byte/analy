import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ChevronRight, Search, Mic, Zap, Shield, Heart, Loader2, Sparkles, X, Save, ArrowRight, Database, Plane, Accessibility, Utensils, Wrench } from 'lucide-react';
import { UserProfile, LearningUnit } from '../types';
import { softenPhrase } from '../lib/gemini';
import { LEARNING_UNITS as LOCAL_LEARNING_UNITS } from '../data/guiones';
import { collection, getDocs, setDoc, doc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { safeStorage } from '../lib/storage';
import { useOutletContext, useNavigate } from 'react-router-dom';
import RoleplayMode from './RoleplayMode';
import { speak as globalSpeak } from '../lib/speech';
import ShadowMode from './ShadowMode';
import StudentHistory from './StudentHistory';
import AnaliAvatar, { AnaliEmotion } from './AnaliAvatar';
import CoachMark from './CoachMark';
import { History, TrendingUp } from 'lucide-react';

const PROFESSION_MAP: Record<string, string> = {
  'Barbero': 'barber',
  'Mecánico': 'mechanic',
  'Mesero': 'waiter',
  'Limpieza': 'cleaning',
  'Construcción': 'construction',
  'Usuario General': 'general',
  'Otro': 'other'
};

export default function ActionDashboard() {
  const { trustMode } = useOutletContext<{ trustMode: 'formal' | 'social' }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Modos visuales: normal (softening), roleplay (vuelo), shadow (pronunciación), history (progreso)
  const [learningMode, setLearningMode] = useState<'normal' | 'roleplay' | 'shadow' | 'history'>('normal');

  const [activeTab, setActiveTab] = useState<'professional' | 'survival' | 'social'>('professional');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [isListeningAnaly, setIsListeningAnaly] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [softenedResult, setSoftenedResult] = useState<any>(null);
  
  const { user, profile: userProfile, updateProfile } = useAuth();
  
  const [learningUnits, setLearningUnits] = useState<LearningUnit[]>([]);
  const [dbStatus, setDbStatus] = useState<'loading' | 'migrating' | 'ready'>('loading');
  const [selectedOccupation, setSelectedOccupation] = useState<string>(userProfile?.occupation || 'Barbero');

  // Tutorial State
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  const isMaster = userProfile?.role === 'master' || user?.email === 'joe12882@gmail.com';

  useEffect(() => {
    // Check for "Translate" mode tutorial first time
    if (!safeStorage.getItem('tutorial_normal_seen')) {
      setActiveTutorial('normal');
    }
  }, []);

  const dismissTutorial = (id: string) => {
    safeStorage.setItem(`tutorial_${id}_seen`, 'true');
    setActiveTutorial(null);
  };

  useEffect(() => {
    if (learningMode !== 'normal') {
      if (!safeStorage.getItem(`tutorial_${learningMode}_seen`)) {
        setActiveTutorial(learningMode);
      }
    }
  }, [learningMode]);

  useEffect(() => {
    if (userProfile?.occupation) {
      setSelectedOccupation(userProfile.occupation);
    }
  }, [userProfile?.occupation]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!user || !selectedOccupation) {
        setDbStatus('ready');
        return;
      }
      try {
        const mappedProfession = PROFESSION_MAP[selectedOccupation] || 'general';
        const colRef = collection(db, 'learning_units');
        
        // Dynamic fetch based on user profession
        const q = query(colRef, where("profession_id", "==", mappedProfession));
        const snapshot = await getDocs(q);
        
        // Cargar seeds siempre si es master para actualizar (limitado en producción real, útil aquí)
        // O cargar si la BD está vacía y estamos en 'barber' o 'general' que tienen seeds
        const needsSeeding = snapshot.empty && (userProfile?.role === 'master' || user.email === 'joe12882@gmail.com');
        
        if (needsSeeding) {
           setDbStatus('migrating');
           
           // Limpiar datos existentes para evitar duplicados de IDs antiguos (sólo para la prof en question)
           const allSnap = await getDocs(colRef);
           if (!allSnap.empty) {
             for (const docSnap of allSnap.docs) {
               if (docSnap.data().profession_id === mappedProfession) {
                 await deleteDoc(doc(db, 'learning_units', docSnap.id));
               }
             }
           }

           await setDoc(doc(db, 'professions', 'barber'), { name: 'Barbería Profesional', icon: 'Scissors' });
           await setDoc(doc(db, 'professions', 'waiter'), { name: 'Mesero / Restaurante', icon: 'Utensils' });
           await setDoc(doc(db, 'professions', 'mechanic'), { name: 'Mecánico Automotriz', icon: 'Wrench' });
           await setDoc(doc(db, 'professions', 'cleaning'), { name: 'Limpieza / Housekeeping', icon: 'Sparkles' });
           for (const unit of LOCAL_LEARNING_UNITS) {
             const { id, ...dataToSave } = unit; 
             if (id) {
               await setDoc(doc(db, 'learning_units', id), dataToSave);
             }
           }
           const newSnap = await getDocs(q);
           const imported = newSnap.docs.map(d => ({ id: d.id, ...d.data() } as LearningUnit));
           setLearningUnits(imported);
           setDbStatus('ready');
        } else {
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
  }, [user, selectedOccupation, userProfile]);

  const handleOccupationChange = async (newOcc: string) => {
    setSelectedOccupation(newOcc);
    if (!isMaster) {
      await updateProfile({ occupation: newOcc });
    }
  };

  const filteredScripts = learningUnits.filter(s => 
    s.category === activeTab && 
    (s.phrase_en.toLowerCase().includes(searchQuery.toLowerCase()) || s.phrase_es.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveToLibrary = async () => {
    if (!softenedResult || !user) return;
    try {
      const colRef = collection(db, 'users', user.uid, 'library');
      const newEntry = {
        topic: (softenedResult.corrected_en || softenedResult.softened).substring(0, 30),
        content: `EN: ${softenedResult.corrected_en || softenedResult.softened}\nES (Literal): ${softenedResult.translation_es || softenedResult.traduccion_literal}\nOriginal: ${softenedResult.original}\nTip: ${softenedResult.learning_tip || softenedResult.significado}\nPronunciación: ${softenedResult.phonetic_tactic || softenedResult.pronunciation}`,
        category: 'Táctico',
        sourceType: 'text',
        original: softenedResult.original,
        date: serverTimestamp()
      };
      
      const { addDoc } = await import('firebase/firestore');
      await addDoc(colRef, newEntry);
      
      alert('¡Guardado en tu Bóveda Personal!');
    } catch (err) {
      console.error("Save error:", err);
      // Fallback local if firebase fails
      const localEntry = {
        id: crypto.randomUUID(),
        topic: (softenedResult.corrected_en || softenedResult.softened).substring(0, 30),
        content: `EN: ${softenedResult.corrected_en || softenedResult.softened}\nES (Literal): ${softenedResult.translation_es || softenedResult.traduccion_literal}\nOriginal: ${softenedResult.original}\nTip: ${softenedResult.learning_tip || softenedResult.significado}\nPronunciación: ${softenedResult.phonetic_tactic || softenedResult.pronunciation}`,
        category: 'Táctico',
        sourceType: 'text',
        date: new Date().toISOString()
      };
      const existing = safeStorage.parseJSON<any[]>('analy_local_intel', []);
      safeStorage.setItem('analy_local_intel', JSON.stringify([localEntry, ...existing]));
      alert('Guardado localmente (Sin conexión)');
    }
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
    recognition.lang = learningMode === 'shadow' ? 'en-US' : 'es-ES'; // Si está en shadow, escucha en inglés
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let isFinalResult = false;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinalResult = true;
      }
      if (fullTranscript.trim().length > 0) {
         onResult(fullTranscript, isFinalResult);
      }
    };

    recognition.onspeechend = () => console.log("Fin de voz");
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error(event.error);
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

  const [cardView, setCardView] = useState<'client' | 'tutor'>('client');
  
  const startListeningLoop = () => {
    setInterimTranscript('🛡️ Micrófono Always-On... (Di "Anali, ...")');
    recognitionRef.current = startSpeechAPI(
      (text, isFinal) => {
        const lowerText = text.toLowerCase();
        
        // Atajo Guardar
        if (lowerText.includes('guardar en analí') || lowerText.includes('guardar en anali')) {
           setInterimTranscript('Guardando en bóveda...');
           handleSaveToLibrary();
           setSoftenedResult(null); // Clean UI
           return;
        }

        const wakeWords = ['analy', 'analí', 'anali', 'analee', 'annaly', 'ana lee', 'ana li', 'ana ley', 'anna lee', 'analeigh'];
        let lastMatchIndex = -1;
        let lastTrigger = '';
        
        wakeWords.forEach(w => {
          const idx = lowerText.lastIndexOf(w);
          if (idx !== -1 && idx > lastMatchIndex) {
            lastMatchIndex = idx;
            lastTrigger = w;
          }
        });

        if (lastMatchIndex !== -1) {
          let phrase = lowerText.substring(lastMatchIndex + lastTrigger.length).trim();
          
          if (isFinal) {
            if (phrase.length > 2) {
              setInterimTranscript(`Procesando: "${phrase}"...`);
              isAnalyActiveRef.current = false; 
              recognitionRef.current?.stop(); 
              
              const clientTriggers = ['dile', 'dile a', 'dile al', 'pregúntale', 'preguntale', 'show', 'muéstrale', 'muestrale', 'say to', 'tell'];
              let forceClientMode = clientTriggers.some(t => phrase.toLowerCase().trim().startsWith(t));
              
              processIntention(phrase, learningMode, forceClientMode);
            } else {
              setInterimTranscript('Anali: ¿Sí? Te escucho...');
            }
          } else {
             setInterimTranscript(`Escuchando: ${phrase}`);
          }
        } else {
          if (isFinal) setInterimTranscript('🛡️ Micrófono Always-On... (Di "Anali, ...")');
        }
      },
      () => {
        if (isAnalyActiveRef.current) {
          setTimeout(() => {
            if (isAnalyActiveRef.current) startListeningLoop();
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

  const processIntention = async (phrase: string, forceMode?: 'normal' | 'roleplay' | 'shadow' | 'history', forceClientMode?: boolean) => {
    setIsProcessing(true);
    setInterimTranscript('Conectando a Anali...'); 

    try {
      if (profile?.uid) {
        const { doc, updateDoc, increment } = await import('firebase/firestore');
        const userRef = doc(db, 'users', profile.uid);
        updateDoc(userRef, {
          conversations_count: increment(1),
          last_login: new Date()
        }).catch(() => {});
      }
    } catch (e) {}

    const cleanPhrase = phrase
      .replace(/^(analy|analí|anali|analee|annaly|ana lee|ana li|ana ley|anna lee|analeigh)[\s,:-]*/i, '')
      .replace(/^(dile al?|dile|pregúntale|preguntale|muéstrale|muestrale|show|say to|tell)[\s,:-]*/i, '')
      .trim();
    
    let targetMode: 'client' | 'tutor' | 'roleplay' | 'shadow' = 'tutor';
    
    if (forceMode === 'roleplay') targetMode = 'roleplay';
    else if (forceMode === 'shadow') targetMode = 'shadow';
    else if (forceClientMode) targetMode = 'client';
    
    try {
      const result = await softenPhrase(cleanPhrase, userProfile?.occupation, activeTab, targetMode, trustMode);
      
      if (result && !result.errorMsg) {
        if (result.is_navigation) {
           speak(result.assistant_reply || 'Vale, te llevo ahí.');
           if (result.nav_scenario) {
              safeStorage.setItem('analy_nav_scenario', result.nav_scenario);
           }
           
           if (result.nav_route === '/roleplay') {
              setLearningMode('roleplay');
              setSoftenedResult(null);
           } else if (result.nav_route === '/shadow') {
              setLearningMode('shadow');
              setSoftenedResult(null);
           } else if (result.nav_route === '/') {
              setLearningMode('normal');
              setSoftenedResult(null);
           } else {
              if (result.nav_route === '/library' || result.nav_route === '/admin') navigate('/admin');
              else if (result.nav_route === '/settings') navigate('/settings');
              else navigate(result.nav_route);
           }
           
           setInterimTranscript('');
           setIsProcessing(false);
           return;
        }

        if (result.mode_notes && result.mode_notes.length > 5) {
          try {
            if ('vibrate' in navigator) navigator.vibrate([100]);
          } catch (vErr) {}
        }

        setSoftenedResult({
          ...result,
          original: cleanPhrase,
          viewMode: targetMode 
        });
        
        setCardView(forceClientMode ? 'client' : 'tutor');
        speak(result.corrected_en || result.softened); 
        setInterimTranscript(''); 
      }
    } catch(err) {} 
    setIsProcessing(false);
  };

  const speak = async (text: string, resumeListening: boolean = false, forcePlanA: boolean = false) => {
    const utterance = await globalSpeak(text, 'en-US', forcePlanA);
    if (resumeListening && utterance) {
      utterance.onend = () => {
        isAnalyActiveRef.current = true;
        setIsListeningAnaly(true);
        startListeningLoop();
      };
    }
  };

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery) {
      processIntention(searchQuery, learningMode);
    }
  };

  const tabIcons = { professional: <Zap size={14} />, survival: <Shield size={14} />, social: <Heart size={14} /> };
  const tabLabels = { professional: 'Profesional', survival: 'Supervivencia', social: 'Social' };

  return (
    <div className="p-4 space-y-6 min-h-[85vh]">
       {/* Tutoriales Guiados */}
       <CoachMark 
         id="normal"
         isVisible={activeTutorial === 'normal'}
         title="Modo Traductor Táctico"
         message="¡Hola! Aquí puedes decirme cualquier frase en español y yo la convertiré en un inglés profesional impecable para tu trabajo. ¡Pruébame dictando con el micrófono!"
         onClose={() => dismissTutorial('normal')}
         emotion="happy"
       />

       <CoachMark 
         id="roleplay"
         isVisible={activeTutorial === 'roleplay'}
         title="Modo Vuelo (Simulación)"
         message="¡Abróchate el cinturón! Aquí yo actuaré como un cliente difícil de tu área. Tú debes responderme en inglés para ganar puntos de confianza. ¡Sin miedo!"
         onClose={() => dismissTutorial('roleplay')}
         emotion="thinking"
       />

       <CoachMark 
         id="shadow"
         isVisible={activeTutorial === 'shadow'}
         title="Modo Especialista"
         message="Aquí perfeccionaremos tu oído. Escucha mis guiones y repítelos. Te calificaré la pronunciación para que suenes como todo un profesional."
         onClose={() => dismissTutorial('shadow')}
         emotion="success"
       />

       <CoachMark 
         id="history"
         isVisible={activeTutorial === 'history'}
         title="Bóveda de Memoria"
         message="Aquí guardo todo tu progreso. Puedes revisar las frases que has aprendido y ver cuánto has avanzado en tu camino al éxito."
         onClose={() => dismissTutorial('history')}
         emotion="happy"
       />

       {/* Selector de Profesión para Master */}
       {isMaster && (
         <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-2">Panel Master: Ver Oficio</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {Object.keys(PROFESSION_MAP).map((prof) => (
                  <button
                    key={prof}
                    onClick={() => handleOccupationChange(prof)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      selectedOccupation === prof 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {prof}
                  </button>
                ))}
              </div>
            </div>
         </div>
       )}

       {/* Selector de Modo Superior */}
       <div className="flex bg-white/50 p-1.5 rounded-full border border-slate-200">
         <button 
           onClick={() => setLearningMode('normal')}
           className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1 ${learningMode === 'normal' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500'}`}
         >
           <Zap size={14} /> Traducir
         </button>
         <button 
           onClick={() => setLearningMode('roleplay')}
           className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1 ${learningMode === 'roleplay' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500'}`}
         >
           <Plane size={14} /> Modo Vuelo
         </button>
         <button 
           onClick={() => setLearningMode('shadow')}
           className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1 ${learningMode === 'shadow' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}
         >
           <Accessibility size={14} /> Especialista
         </button>
         <button 
           onClick={() => setLearningMode('history')}
           className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1 ${learningMode === 'history' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}
         >
           <History size={14} /> Memoria
         </button>
       </div>

      {/* Contenido Condicional según Modo */}
      {learningMode === 'normal' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <AnaliAvatar 
               emotion={isProcessing ? 'thinking' : (isListeningSearch ? 'neutral' : 'neutral')} 
               size="md" 
               className="shrink-0"
             />
             <div className={`flex-1 relative transition-all duration-300 ${isListeningSearch ? 'listening-pulse' : ''} rounded-xl`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder={
                  learningMode === 'normal' ? "Escribe o dicta lo que quieras decir..." : 
                  learningMode === 'roleplay' ? "Háblale a tu cliente difícil..." : "Pronuncia en inglés para medirte..."
                }
                className="w-full bg-white border border-slate-200 rounded-3xl py-5 pl-12 pr-12 text-sm font-medium focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
              <button 
                onClick={handleSearchMic}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all p-2 rounded-full ${isListeningSearch ? 'bg-teal-100 text-teal-600 scale-110' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {softenedResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="analy-card p-6 border border-slate-100 bg-white relative overflow-hidden group shadow-lg"
              >
                <button 
                  onClick={() => setSoftenedResult(null)} 
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={16} />
                </button>
                
                <div className="flex items-start gap-4 mb-4">
                  <AnaliAvatar emotion="success" size="md" className="shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={16} className={cardView === 'client' ? "text-indigo-500" : "text-teal-500"} />
                      <span className={`text-xs font-bold tracking-wide ${cardView === 'client' ? "text-indigo-600" : "text-teal-600"}`}>
                        {cardView === 'client' ? "Mostrando al Cliente:" : "Feedback Tutor:"}
                      </span>
                    </div>
                  </div>
                </div>

                {cardView === 'client' ? (
                   <div className="space-y-6">
                      <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 text-center">
                         <h2 className="text-4xl font-black text-slate-800 leading-tight mb-2">
                           {softenedResult.corrected_en || softenedResult.softened}
                         </h2>
                         <p className="text-sm font-medium text-slate-500">
                           {softenedResult.translation_es || softenedResult.traduccion_literal}
                         </p>
                      </div>
                      
                      <button 
                        onClick={() => setCardView('tutor')} 
                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-md"
                      >
                        <Sparkles size={16} /> Ver Análisis Pedagógico
                      </button>
                   </div>
                ) : (
                  <div className="space-y-5">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-black mb-1">Tú dijiste:</div>
                      <p className="text-sm font-medium text-slate-700">"{softenedResult.original}"</p>
                    </div>

                    <div className="px-2">
                      <div className="text-2xl font-black text-slate-800 leading-tight">
                        {softenedResult.corrected_en || softenedResult.softened}
                      </div>
                      <div className="text-sm text-teal-500 font-medium italic mt-1">
                        👄 {softenedResult.phonetic_tactic || softenedResult.pronunciation}
                      </div>
                    </div>

                    <div className="px-2 border-t border-slate-100 pt-4">
                       <div className="text-[10px] text-slate-400 uppercase font-black mb-1">
                         Explicación / Feedback
                       </div>
                       <p 
                         className="text-sm text-slate-600 leading-relaxed font-medium bg-teal-50/50 p-3 rounded-xl border border-teal-100/50 cursor-pointer hover:bg-teal-100/50 transition-colors"
                         onClick={() => speak(softenedResult.learning_tip || softenedResult.significado, false, true)}
                         title="Haz clic para escuchar con voz Premium"
                       >
                         {softenedResult.learning_tip || softenedResult.significado}
                       </p>
                       {softenedResult.mode_notes && (
                         <p className="text-xs text-amber-500 mt-2 italic flex items-center gap-1"><Sparkles size={12}/> {softenedResult.mode_notes}</p>
                       )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={() => speak(softenedResult.corrected_en || softenedResult.softened)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 active:scale-95 transition-all">
                        <Volume2 size={16} /> Escuchar
                      </button>
                      <button onClick={() => { handleSaveToLibrary(); setSoftenedResult(null); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all">
                        <Save size={16} /> Guardar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {learningMode === 'roleplay' && (
        <RoleplayMode userProfile={userProfile} trustMode={trustMode} />
      )}

      {learningMode === 'shadow' && (
        <ShadowMode userProfile={userProfile} learningUnits={learningUnits} />
      )}

      {learningMode === 'history' && user && (
        <StudentHistory userId={user.uid} />
      )}

       {learningMode === 'normal' && (
        <div className="grid grid-cols-3 gap-2">
          {(['professional', 'survival', 'social'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 rounded-2xl flex flex-col items-center gap-1.5 transition-all border ${
                activeTab === tab 
                  ? 'bg-teal-50 border-teal-200 text-teal-600 shadow-sm scale-105' 
                  : 'bg-white text-slate-400 border-slate-100'
              }`}
            >
              {tabIcons[tab]}
              <span className="text-[10px] font-bold tracking-wide">{tabLabels[tab]}</span>
            </button>
          ))}
        </div>
       )}

      {learningMode === 'normal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 flex-1">
               Guiones: {tabLabels[activeTab]}
            </h2>
          </div>
          <AnimatePresence mode="wait">
            {dbStatus === 'ready' ? (
              <motion.div key={activeTab} className="space-y-3">
                {filteredScripts.length > 0 ? (
                  filteredScripts.map((script) => (
                    <ScriptCard key={script.id} script={script} onSpeak={speak} />
                  ))
                ) : (
                  <div className="py-20 text-center space-y-2">
                    {learningUnits.length === 0 ? (
                      <div className="opacity-70 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Database size={24} />
                         </div>
                         <h3 className="text-lg font-black text-slate-700 mb-2">Contenido de {selectedOccupation} en desarrollo.</h3>
                         <p className="text-sm font-bold text-slate-500">¡Próximamente! Analí está procesando y aprendiendo vocabulario técnico para esta profesión. Mientras tanto, puedes usar el Traductor Global arriba.</p>
                      </div>
                    ) : (
                      <div className="opacity-50">
                        <Search className="mx-auto text-slate-300" size={48} strokeWidth={1} />
                        <p className="text-xs font-bold text-slate-400 mt-2">Sin guiones encontrados para tu búsqueda</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="py-10 text-center"><Loader2 className="animate-spin text-teal-500 mx-auto" size={30} /></div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Botón Flotante Central Anali */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isListeningAnaly && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x:0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-teal-500 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-xl max-w-[200px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>Anali escuchando...</span>
              </div>
              <div className="text-[10px] font-medium opacity-90 italic">
                {interimTranscript || `Dí: "Anali, [frase]"`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={handleAnalyMic}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all relative ${isListeningAnaly ? 'bg-teal-500 text-white border-4 border-teal-200 scale-110' : 'bg-white text-teal-500 border border-slate-100 hover:bg-slate-50'}`}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={28} /> : (isListeningAnaly ? <X size={28} /> : <div className="relative"><Mic size={28} /> <div className="absolute top-0 right-0 w-2 h-2 bg-rose-400 rounded-full border border-white"></div></div>)}
        </button>
      </div>
    </div>
  );
}

interface ScriptCardProps {
  script: LearningUnit;
  onSpeak: (text: string, resumeListening?: boolean, forcePlanA?: boolean) => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ script, onSpeak }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className={`bg-white border rounded-2xl transition-all duration-300 ${isExpanded ? 'border-teal-200 shadow-md translate-y-[-2px]' : 'border-slate-100 hover:border-slate-200'}`} onClick={() => setIsExpanded(!isExpanded)}>
      <div className="p-4 flex items-center justify-between cursor-pointer">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase">{script.grammar_tag}</div>
          <p className="font-bold text-slate-800 text-sm">{script.phrase_es}</p>
        </div>
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isExpanded ? "bg-teal-50 text-teal-600 border-teal-100" : "text-slate-400 border-slate-100"}`}>
           <ChevronRight className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} size={16} />
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4 space-y-4">
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl flex items-start justify-between">
                <div>
                  <div className="text-teal-600 font-bold text-base">{script.phrase_en}</div>
                  <div className="text-slate-500 text-xs mt-1">👄 {script.phonetic_tactic}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onSpeak(script.phrase_en); }} className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-teal-500 active:scale-95">
                  <Volume2 size={18} />
                </button>
              </div>
              {script.learning_tips && script.learning_tips.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-amber-600 uppercase mb-2 flex items-center gap-1"><Sparkles size={12}/> Tips Anali</div>
                  <ul className="text-xs text-slate-600 space-y-1 font-medium pl-2">
                    {(script.learning_tips || []).map((tip, idx) => (
                      <li 
                        key={idx} 
                        className="cursor-pointer hover:text-teal-600 transition-colors flex items-center gap-1.5"
                        onClick={(e) => { e.stopPropagation(); onSpeak(tip, false, true); }}
                        title="Escuchar con voz Premium"
                      >
                        <Volume2 size={10} className="text-amber-400" /> {tip}
                      </li>
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
};
