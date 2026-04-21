import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Volume2, Sparkles, Loader2, StopCircle } from 'lucide-react';
import { gradeShadow } from '../lib/gemini';
import { UserProfile, LearningUnit } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { speak as globalSpeak } from '../lib/speech';

interface ShadowProps {
  userProfile: UserProfile | null;
  learningUnits: LearningUnit[];
}

export default function ShadowMode({ userProfile, learningUnits }: ShadowProps) {
  const [selectedUnit, setSelectedUnit] = useState<LearningUnit | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  
  // Set first unit on load
  useEffect(() => {
    if (learningUnits.length > 0 && !selectedUnit) {
      setSelectedUnit(learningUnits[0]);
    }
  }, [learningUnits]);

  const speak = (text: string) => {
    globalSpeak(text, 'en-US');
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Microfóno no soportado");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.interimResults = true;
    setTranscript('');
    setGradeResult(null);
    
    recognition.onresult = (e: any) => {
      let temp = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        temp += e.results[i][0].transcript;
      }
      setTranscript(temp);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      // Hack: React state is stale in onend if not careful, but transcript is managed reactively?
      // Better to check the latest transcript.
      setTimeout(() => {
         const recognitionDiv = document.getElementById('shadow-transcript-hidden');
         const finalTxt = recognitionDiv?.innerText || '';
         if (finalTxt.length > 3) evaluateShadow(finalTxt);
      }, 500);
    };
    
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const evaluateShadow = async (audioTranscript: string) => {
    if (!selectedUnit) return;
    setIsProcessing(true);
    
    const result = await gradeShadow(selectedUnit.phrase_en, audioTranscript);
    if (result) {
      setGradeResult(result);
      if (userProfile?.uid) {
         await addDoc(collection(db, 'shadow_attempts'), {
           user_id: userProfile.uid,
           target_en: selectedUnit.phrase_en,
           user_transcript: audioTranscript,
           overall_score: result.overall,
           word_scores: result, 
           created_at: serverTimestamp()
         }).catch(console.error);
      }
    }
    setIsProcessing(false);
  };

  // Helper to colorize words
  const renderWordHighlighting = () => {
    if (!selectedUnit || !gradeResult) return null;
    const targetWords = selectedUnit.phrase_en.split(/\s+/);
    const matched = (gradeResult.matched_words || []).map((w: string) => w.toLowerCase());
    const missed = (gradeResult.missed_words || []).map((w: string) => w.toLowerCase());

    return (
      <div className="flex flex-wrap gap-2 text-2xl font-black mt-2">
        {targetWords.map((word, i) => {
          const clean = word.toLowerCase().replace(/[^\w]/g, '');
          let color = "text-slate-400"; // default neutral
          if (matched.includes(clean)) color = "text-teal-500 bg-teal-50 px-2 rounded-lg";
          else if (missed.includes(clean)) color = "text-rose-500 bg-rose-50 px-2 rounded-lg";
          return <span key={i} className={color}>{word}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 min-h-[60vh] flex flex-col mb-20 relative">
      {/* Hidden div to store real-time transcript for the onEnd callback closure */}
      <div id="shadow-transcript-hidden" className="hidden">{transcript}</div>

       <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
          <Mic size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">Modo Sombra</h2>
          <p className="text-xs text-slate-500 font-medium tracking-wide">Calificador de Pronunciación</p>
        </div>
      </div>

      {/* Horizontal Unit Picker */}
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-4 -mx-6 px-6 mb-4">
         {learningUnits.filter(u => u.phrase_en).map(unit => (
           <button 
             key={unit.id} 
             onClick={() => { setSelectedUnit(unit); setGradeResult(null); setTranscript(''); }}
             className={`shrink-0 max-w-[200px] text-left p-3 rounded-2xl border transition-all ${selectedUnit?.id === unit.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
           >
             <p className={`text-xs font-bold truncate ${selectedUnit?.id === unit.id ? 'text-indigo-600' : 'text-slate-600'}`}>{unit.phrase_en}</p>
             <p className="text-[10px] text-slate-400 truncate mt-1">{unit.phrase_es}</p>
           </button>
         ))}
      </div>

      {/* Target Card */}
      {selectedUnit && (
        <div className="flex-1 space-y-4">
           {!gradeResult ? (
             <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
               <button onClick={() => speak(selectedUnit.phrase_en)} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm active:scale-90 hover:bg-indigo-50 transition-all">
                 <Volume2 size={18} />
               </button>
               
               <div className="space-y-6 pt-2">
                 <div>
                   <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">🇬🇧 Inglés</p>
                   <p className="text-3xl font-black text-slate-800 leading-tight">{selectedUnit.phrase_en}</p>
                 </div>
                 <div className="bg-indigo-100/50 p-4 rounded-2xl border border-indigo-100/50">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1 flex items-center gap-1">🗣️ Fonética Táctica</p>
                    <p className="text-base font-bold text-indigo-800">{selectedUnit.phonetic_tactic}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">💬 Español Literal</p>
                   <p className="text-sm font-medium text-slate-600">{selectedUnit.phrase_es}</p>
                 </div>
               </div>
             </div>
           ) : (
             <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                   <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Resultado</p>
                   <div className="px-3 py-1 rounded-full bg-white font-black text-base shadow-sm text-indigo-600 border border-indigo-100">
                     {gradeResult.overall}% Precisión
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="bg-white p-4 rounded-2xl border border-slate-200">
                     {renderWordHighlighting()}
                   </div>
                   
                   {transcript && (
                     <p className="text-xs text-slate-400 italic">"Te escuché decir: {transcript}"</p>
                   )}

                   {gradeResult.tips && gradeResult.tips.length > 0 && (
                     <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                       <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2 flex items-center gap-1"><Sparkles size={12}/> Feedback Analí</h4>
                       <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
                          {gradeResult.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                       </ul>
                     </div>
                   )}
                </div>
             </div>
           )}

           {/* Grading State */}
           {isProcessing && (
              <div className="text-center py-4 flex flex-col items-center">
                 <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Evaluando Pronunciación...</p>
              </div>
           )}

           {/* Controls */}
           <div className="pt-4 flex justify-center">
             {!isProcessing && (
               <button 
                 onClick={gradeResult ? () => { setGradeResult(null); setTranscript(''); } : toggleMic} 
                 className={`w-full max-w-[200px] h-16 rounded-full flex items-center justify-center font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                   gradeResult 
                     ? 'bg-slate-800 text-white hover:bg-slate-700' 
                     : isListening 
                       ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30' 
                       : 'bg-indigo-500 text-white shadow-indigo-500/30 active:scale-95'
                 }`}
               >
                 {gradeResult ? 'Re-Intentar' : isListening ? <span className="flex items-center"><StopCircle className="inline mr-2" size={18} /> Escuchando...</span> : <span className="flex items-center"><Mic className="inline mr-2" size={18} /> Grabar Sombra</span>}
               </button>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
