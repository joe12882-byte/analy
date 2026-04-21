import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Mic, Send, Loader2, Sparkles, RefreshCcw, User, Volume2, ShieldAlert, Award } from 'lucide-react';
import { roleplayTurn, gradeRoleplay } from '../lib/gemini';
import { UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { speak as globalSpeak } from '../lib/speech';

interface RoleplayProps {
  userProfile: UserProfile | null;
  trustMode: string;
}

export default function RoleplayMode({ userProfile, trustMode }: RoleplayProps) {
  const [step, setStep] = useState<'setup' | 'active' | 'grading' | 'finished'>('setup');
  const [scenarioRole, setScenarioRole] = useState('Cliente Impaciente');
  const [difficulty, setDifficulty] = useState('Medio');
  const [maxTurns, setMaxTurns] = useState(4);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [gradeResult, setGradeResult] = useState<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check local storage for pre-configured scenario from voice intent
    const preConfig = localStorage.getItem('analy_nav_scenario');
    if (preConfig) {
      setScenarioRole(preConfig.charAt(0).toUpperCase() + preConfig.slice(1));
      localStorage.removeItem('analy_nav_scenario'); // clear after use
    }
  }, []);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const speak = (text: string) => {
    globalSpeak(text, 'en-US');
  };

  const startRoleplay = async () => {
    setStep('active');
    setIsProcessing(true);
    setMessages([]);
    const prof = userProfile?.occupation || 'general professional';
    
    // Iniciar con la primera linea del rol
    const result = await roleplayTurn(
      scenarioRole, prof, difficulty, trustMode, [], "Start the interaction."
    );
    
    if (result && !result.errorMsg) {
      setMessages([{ role: 'anali', ...result }]);
      speak(result.reply_en);
    }
    setIsProcessing(false);
  };

  const submitTurn = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    const newMsg = { role: 'user', text_en: text };
    const historySnapshot = [...messages, newMsg];
    setMessages(historySnapshot);
    setInput('');
    setIsProcessing(true);

    const apiHistory = historySnapshot.filter(m => m.role === 'anali').map(m => ({ role: 'model', text: m.reply_en }));
    const prof = userProfile?.occupation || 'general professional';

    const userTurnsCount = historySnapshot.filter(m => m.role === 'user').length;
    
    if (userTurnsCount >= maxTurns) {
       // Terminate automatically
       setStep('grading');
       const userLines = historySnapshot.filter(m => m.role === 'user').map(m => m.text_en);
       const grades = await gradeRoleplay(prof, scenarioRole, userLines);
       if (grades) {
         setGradeResult(grades);
         setStep('finished');
         // Save to DB
         if (userProfile?.uid) {
           await addDoc(collection(db, 'roleplay_sessions'), {
             user_id: userProfile.uid,
             profession: prof,
             scenario_role: scenarioRole,
             difficulty,
             mode: trustMode,
             max_turns: maxTurns,
             turns: historySnapshot,
             grade: grades,
             created_at: serverTimestamp()
           }).catch(console.error);
         }
       } else {
         alert("Hubo un error calificando el roleplay.");
         setStep('setup');
       }
    } else {
      const result = await roleplayTurn(
        scenarioRole, prof, difficulty, trustMode, apiHistory, text
      );
      if (result && !result.errorMsg) {
        setMessages(prev => [...prev, { role: 'anali', ...result }]);
        speak(result.reply_en);
      }
      setIsProcessing(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Micro no soportado");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.interimResults = true;
    
    recognition.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) submitTurn(final);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 min-h-[60vh] flex flex-col mb-20">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
          <Plane size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">Modo Vuelo</h2>
          <p className="text-xs text-slate-500 font-medium tracking-wide">Rol (Interacción Cliente)</p>
        </div>
      </div>

      {step === 'setup' && (
        <div className="space-y-6 flex-1">
          <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">El Cliente Será:</label>
               <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-400" value={scenarioRole} onChange={e => setScenarioRole(e.target.value)}>
                 <option>Cliente Impaciente</option>
                 <option>Cliente Perfeccionista (Picky)</option>
                 <option>Turista Confundido</option>
                 <option>Cliente VIP Demandante</option>
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dificultad:</label>
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-400" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                   <option>Fácil</option>
                   <option>Medio</option>
                   <option>Difícil</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Turnos Mínimos:</label>
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-400" value={maxTurns} onChange={e => setMaxTurns(Number(e.target.value))}>
                   <option value={4}>4 Turnos (Corto)</option>
                   <option value={6}>6 Turnos (Normal)</option>
                   <option value={8}>8 Turnos (Largo)</option>
                 </select>
              </div>
            </div>
          </div>
          <button onClick={startRoleplay} className="w-full bg-amber-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4 cursor-pointer hover:bg-amber-400">
            Despegar <Plane size={16} />
          </button>
        </div>
      )}

      {step === 'active' && (
        <div className="flex-1 flex flex-col">
           {/* Chat View */}
           <div className="flex-1 overflow-y-auto space-y-4 pb-4 custom-scrollbar max-h-[45vh]">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-amber-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200'}`}>
                      {m.role === 'anali' && <div className="text-[10px] font-black uppercase text-amber-600 mb-1 flex items-center gap-1"><ShieldAlert size={10}/> {m.emotion}</div>}
                      <p className="font-bold text-sm leading-snug">{m.role === 'user' ? m.text_en : m.reply_en}</p>
                      {m.role === 'anali' && (
                        <>
                          <p className="text-xs text-slate-500 italic mt-1">{m.reply_es}</p>
                          <p className="text-xs text-amber-600 mt-2 font-medium">👄 {m.phonetic_tactic}</p>
                        </>
                      )}
                   </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-sm border border-slate-200 flex gap-1 items-center h-12">
                     <Loader2 className="animate-spin text-slate-400" size={16} />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
           </div>
           
           {/* Input Area */}
           <div className="pt-4 border-t border-slate-100 flex gap-2">
             <input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 text-sm font-medium outline-none placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all" placeholder="Escribe en inglés..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitTurn(input)} disabled={isProcessing} />
             <button onClick={toggleMic} disabled={isProcessing} className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}>
               <Mic size={18} />
             </button>
             <button onClick={() => submitTurn(input)} disabled={isProcessing || !input.trim()} className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-amber-500 text-white shadow-md active:scale-95 disabled:opacity-50">
               {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
             </button>
           </div>
        </div>
      )}

      {step === 'grading' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
           <Loader2 className="animate-spin text-amber-500" size={48} />
           <p className="text-sm font-bold text-slate-500 animate-pulse text-center">Analizando vuelo...<br/>Creando rúbrica táctica</p>
        </div>
      )}

      {step === 'finished' && gradeResult && (
        <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[60vh]">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2"><Award size={32} /></div>
            <h3 className="text-2xl font-black text-slate-800">Vuelo Terminado</h3>
            <p className="text-sm text-slate-500 font-medium">Nota global: <span className="text-amber-600 font-black text-xl">{gradeResult.overall}%</span></p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             {Object.entries(gradeResult.scores || {}).map(([key, val]: any) => (
               <div key={key} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                 <span className="text-[10px] font-black uppercase text-slate-400">{key}</span>
                 <span className={`text-lg font-black ${val >= 80 ? 'text-teal-500' : val >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{val}%</span>
               </div>
             ))}
          </div>

          <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl">
             <h4 className="text-xs font-black uppercase text-teal-600 mb-2 flex items-center gap-1"><Sparkles size={14}/> Fortalezas</h4>
             <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4">{gradeResult.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
          </div>
          
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
             <h4 className="text-xs font-black uppercase text-rose-600 mb-2 flex items-center gap-1"><RefreshCcw size={14}/> A Mejorar</h4>
             <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4">{gradeResult.improvements?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
          </div>

          <div className="space-y-3">
             <h4 className="text-xs font-black uppercase text-slate-400">Correcciones Literales:</h4>
             {gradeResult.corrected_examples?.map((ex: any, i: number) => (
                <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-sm">
                   <p className="text-rose-500 font-medium line-through mb-1">"{ex.user}"</p>
                   <p className="text-teal-600 font-black text-base">{ex.better_en}</p>
                   <p className="text-amber-500 text-xs mt-1 font-medium">👄 {ex.phonetic_tactic}</p>
                   <p className="text-slate-500 text-xs mt-2 italic bg-slate-50 p-2 rounded-lg">{ex.tip}</p>
                </div>
             ))}
          </div>

          <button onClick={() => setStep('setup')} className="w-full bg-slate-800 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl active:scale-95 transition-all">
            Nuevo Vuelo
          </button>
        </div>
      )}
    </div>
  );
}
