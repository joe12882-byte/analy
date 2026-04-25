import React, { useState, useEffect, useRef } from 'react';
import { Youtube, Search, ArrowRight, Loader2, Save, Trash2, Database, Users, Shield, Calendar, Link2, Sparkles, Server, FileVideo, UploadCloud, Bell } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { analyzeVideoMethodology, extractFromYouTube } from '../lib/gemini';
import { CurationEntry, UserProfile, LearningUnit } from '../types';
import AdminVault from './AdminVault';
import { speak as globalSpeak } from '../lib/speech';
import { safeStorage } from '../lib/storage';

export default function AdminCurador() {
  const [input, setInput] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  
  // Video Analysis State
  const [videoProgress, setVideoProgress] = useState<{status: string, percent: number} | null>(null);
  const [videoMethodology, setVideoMethodology] = useState<any | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [savedEntries, setSavedEntries] = useState<CurationEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'intel' | 'users' | 'vault'>('intel');
  const [adoptMethodology, setAdoptMethodology] = useState(true);

  useEffect(() => {
    // Admin uses a global-like stash for processing
    const savedIntel = safeStorage.getItem('analy_global_intel');
    if (savedIntel) {
      try {
        setSavedEntries(JSON.parse(savedIntel));
      } catch {}
    }

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const userList = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserProfile[];
        setUsers(userList);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleCurate = async () => {
    if (!input) return;
    setLoading(true);
    // Use legacy logic or generic extraction for raw text
    alert("Funcionalidad de texto raw migrada a YouTube. Usa el campo de enlace para mejores resultados.");
    setLoading(false);
  };

  const handleYTExtract = async () => {
    if (!ytUrl) return;
    setLoading(true);
    try {
      const data = await extractFromYouTube(ytUrl);
      setResults(data);
    } catch (err) {
      console.error("YouTube Extraction Error:", err);
      alert("Error al extraer datos de YouTube.");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoProgress({ status: 'Cargando video...', percent: 10 });
    
    // Create local URL
    const url = URL.createObjectURL(file);
    if (videoRef.current) {
       videoRef.current.src = url;
       videoRef.current.load();
       // wait for metadata
       videoRef.current.onloadeddata = async () => {
           setVideoProgress({ status: 'Extrayendo cuadros analíticos...', percent: 30 });
           
           const frames: string[] = [];
           const canvas = document.createElement('canvas');
           const ctx = canvas.getContext('2d');
           if (!ctx) return;
           
           const duration = videoRef.current!.duration;
           // capture at 20%, 50%, 80% to get a good sense of the video
           const timepoints = [duration * 0.2, duration * 0.5, duration * 0.8];
           
           try {
             for (const targetTime of timepoints) {
                 videoRef.current!.currentTime = targetTime;
                 await new Promise<void>((res, rej) => {
                      const seekHandler = () => {
                          // make image small to stay under limits
                          canvas.width = Math.min(videoRef.current!.videoWidth, 640); 
                          canvas.height = (canvas.width / videoRef.current!.videoWidth) * videoRef.current!.videoHeight;
                          ctx.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
                          frames.push(canvas.toDataURL('image/jpeg', 0.5));
                          
                          videoRef.current!.removeEventListener('seeked', seekHandler);
                          res();
                      };
                      videoRef.current!.addEventListener('seeked', seekHandler);
                      // timeout safeguard
                      setTimeout(() => { videoRef.current!.removeEventListener('seeked', seekHandler); res(); }, 2000);
                 });
             }
             
             setVideoProgress({ status: 'Analizando con el Motor de Metodología de Analí...', percent: 60 });
             
             // Run Gemini architecture engine
             const analysis = await analyzeVideoMethodology(frames, "Filename: " + file.name + ". Extraer metodología técnica y crear escenarios.");
             
             if (analysis) {
                 setVideoProgress({ status: 'Diseño automático finalizado', percent: 100 });
                 setVideoMethodology(analysis);
                 
                 // Clear progress bar after a few seconds
                 setTimeout(() => setVideoProgress(null), 3000);

                 // Notification
                 const msg = '¡Joel, he procesado el video y diseñado nuevos retos con esa metodología! ¿Los revisamos?';
                 alert(msg);
                 globalSpeak(msg, 'es-ES');
             } else {
                 setVideoProgress({ status: 'Error procesando video.', percent: 0 });
                 setTimeout(() => setVideoProgress(null), 4000);
             }
           } catch(err) {
               setVideoProgress({ status: 'Error capturando cuadros.', percent: 0 });
               setTimeout(() => setVideoProgress(null), 4000);
           }
       };
    }
  };

  const saveToGlobalStore = async (item: any) => {
    try {
      const phraseEn = item.phrase_en || item.english;
      if (!phraseEn) return;

      const q = query(collection(db, 'learning_units'), where('phrase_en', '==', phraseEn));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        alert(`La frase "${phraseEn}" ya existe en la biblioteca. Evitando duplicado.`);
        return;
      }

      const newScript: Partial<LearningUnit> = {
        profession_id: item.profession_id || item.profession || 'general',
        category: item.category || 'professional',
        phrase_es: item.phrase_es || item.spanish || '',
        phrase_en: phraseEn,
        phonetic_tactic: item.phonetic_tactic || item.pronunciation || '',
        learning_tip: item.learning_tip || '',
        learning_tips: item.learning_tips || (item.learning_tip ? [item.learning_tip] : []),
        grammar_tags: item.grammar_tags || [],
        grammar_tag: item.grammar_tag || (item.grammar_tags && item.grammar_tags[0]) || 'Intel Reciente',
        difficulty: item.difficulty || 3,
        methodology_style: adoptMethodology ? 'extracted' : 'standard'
      };

      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'learning_units'), newScript);
      
      alert('¡Intel Inyectado exitosamente en Firestore!');
    } catch (err) {
      console.error("Error saving unit:", err);
      alert('Error al guardar. Revisa la consola.');
    }
  };

  const deleteEntry = (id: string) => {
    const updated = savedEntries.filter(e => e.id !== id);
    setSavedEntries(updated);
    safeStorage.setItem('analy_global_intel', JSON.stringify(updated));
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
          <h2 className="text-2xl font-bold text-teal-600">
            {activeTab === 'intel' ? 'Ingesta de Inteligencia' : 'Control de Usuarios'}
          </h2>
          <p className="text-slate-500 text-xs font-semibold uppercase">
            {activeTab === 'intel' ? 'Procesar Links de YouTube/TikTok/Redes' : 'Lista de Estudiantes'}
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('intel')}
            className={`p-2 rounded-lg transition-all ${activeTab === 'intel' ? 'bg-teal-500 text-white' : 'text-slate-400'}`}
          >
            <Database size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`p-2 rounded-lg transition-all ${activeTab === 'users' ? 'bg-teal-500 text-white' : 'text-slate-400'}`}
          >
            <Users size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('vault')}
            title="Master Knowledge Hub (Cerebro Compartido)"
            className={`p-2 rounded-lg transition-all ${activeTab === 'vault' ? 'bg-teal-500 text-white' : 'text-slate-400 bg-white border border-slate-200 hover:text-teal-500'}`}
          >
            <Server size={18} />
          </button>
        </div>
      </div>

      {activeTab === 'vault' ? (
        <div className="w-full">
           <AdminVault />
        </div>
      ) : activeTab === 'intel' ? (
        <>
          <div className="space-y-6">
            <video ref={videoRef} className="hidden" crossOrigin="anonymous" playsInline muted />

            {/* YouTube Ingest Engine */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                   <Youtube size={20} />
                 </div>
                 <h3 className="text-sm font-bold text-slate-800">Analizador Inteligente de Enlaces</h3>
               </div>
               
               <p className="text-xs text-slate-500 mb-4 font-medium">Pega un link de YouTube, Instagram, TikTok o Facebook. Anali extraerá los tips de inglés, gramática y vocabulario, categorizándolo por ti.</p>

               <div className="flex flex-col md:flex-row gap-3">
                 <div className="relative flex-1">
                   <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text"
                     placeholder="Pega el enlace aquí..."
                     value={ytUrl}
                     onChange={(e) => setYtUrl(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 outline-none transition-all"
                   />
                 </div>
                 <button 
                   onClick={handleYTExtract}
                   disabled={loading || !ytUrl}
                   className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-4 rounded-2xl font-bold tracking-wide disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center min-w-[200px] shadow-md shadow-teal-500/20"
                 >
                   {loading ? <Loader2 className="animate-spin" size={20} /> : 'Analizar Enlace'}
                 </button>
               </div>
            </div>

             <div className="relative group opacity-40 hover:opacity-100 transition-opacity">
              <div className="text-[9px] font-black text-gray-500 mb-2 uppercase tracking-widest">Entrada de Texto Plano (Legacy)</div>
              <textarea 
                className="w-full h-32 bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 text-sm focus:ring-1 focus:border-[#00F0FF] outline-none resize-none transition-all font-mono"
                placeholder="SYSTEM_KEY[PEGA_TRANSCRIPCION_AQUI]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            
            {/* Analizador de Metodología en Video */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                   <FileVideo size={20} />
                 </div>
                 <h3 className="text-sm font-bold text-slate-800">Motor Experimental de Metodología</h3>
               </div>
               
               <p className="text-xs text-slate-500 mb-4 font-medium">Sube un video enseñando una lección técnica. Analí examinará cómo explicas, absorberá la métrica (ritmo/ejemplos) y diseñará guiones automáticamente con ese estilo.</p>

               {/* Opción de Metodología Toggle */}
               <div className="flex items-center gap-3 p-3 bg-teal-100/50 rounded-2xl border border-teal-200 mb-4 animate-in fade-in zoom-in-95 duration-500">
                 <div 
                   onClick={() => setAdoptMethodology(!adoptMethodology)}
                   className={`w-10 h-6 rounded-full relative transition-all cursor-pointer shadow-inner ${adoptMethodology ? 'bg-teal-500' : 'bg-slate-300'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${adoptMethodology ? 'left-5' : 'left-1'}`} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">Adoptar esta Metodología</span>
                   <span className="text-[10px] text-teal-600 font-bold mt-1">Anali absorberá este ritmo de enseñanza.</span>
                 </div>
               </div>

               <div className="relative border-2 border-dashed border-indigo-100 bg-indigo-50/30 rounded-2xl p-8 hover:bg-indigo-50 transition-colors text-center">
                 <input 
                   type="file"
                   accept="video/mp4,video/quicktime,video/x-m4v"
                   onChange={handleVideoUpload}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <UploadCloud className="mx-auto text-indigo-400 mb-3" size={32} />
                 <p className="text-sm font-bold text-indigo-900">Selecciona o suelta tu video aquí</p>
                 <p className="text-xs font-semibold tracking-wide text-indigo-500 mt-1">Soporta MP4 y MOV (Max. Corto)</p>
               </div>

               {videoProgress && (
                 <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>{videoProgress.status}</span>
                      <span>{videoProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                       <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${videoProgress.percent}%` }} />
                    </div>
                 </div>
               )}
            </div>

            {videoMethodology && (
               <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 mt-4 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                 <div className="flex items-start gap-3 mb-4 border-b border-emerald-100 pb-3">
                   <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><Bell size={20} /></div>
                   <div>
                      <h3 className="text-emerald-800 font-bold leading-none mb-1">¡Nuevo Motor Pedagógico Activado!</h3>
                      <p className="text-emerald-600 text-xs font-medium">{videoMethodology.notification_msg}</p>
                   </div>
                 </div>

                 {videoMethodology.propose_new_role && (
                   <div className="bg-white p-3 rounded-xl border border-emerald-100 mb-4 shadow-sm flex items-center justify-between">
                     <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Sugerencia de Especialidad</span>
                       <span className="text-sm font-bold text-slate-700">Añadir rol: {videoMethodology.proposed_role_name}</span>
                     </div>
                     <button 
                       onClick={() => alert(`Rol de Especialidad "${videoMethodology.proposed_role_name}" programado para la siguiente sincronización de servidor.`)}
                       className="text-xs bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-600 transition-colors"
                     >
                       Crear Rol
                     </button>
                   </div>
                 )}

                 <div className="space-y-4">
                   <div className="bg-white/50 p-4 rounded-2xl border border-emerald-100">
                      <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2">Metodología Absorbida</h4>
                      <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                        {videoMethodology.methodology_analysis.analy_integration_summary}
                      </p>
                   </div>
                   
                   <div className="bg-white/50 p-4 rounded-2xl border border-emerald-100">
                      <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2">Nuevos Retos (Modo Vuelo)</h4>
                      <ul className="space-y-2">
                        {videoMethodology.roleplay_scenarios.map((scen: any, idx: number) => (
                           <li key={`scen-${idx}`} className="bg-white p-3 rounded-xl border border-slate-100">
                             <div className="flex items-center justify-between font-bold text-slate-700 text-sm mb-1">
                               <span>{scen.client_role}</span>
                               <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">{scen.difficulty}</span>
                             </div>
                             <p className="text-xs text-slate-500 font-medium">{scen.description_es}</p>
                           </li>
                        ))}
                      </ul>
                   </div>
                   
                   <div className="bg-white/50 p-4 rounded-2xl border border-emerald-100">
                      <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2">Nuevo Script (Modo Sombra)</h4>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                         <h5 className="font-bold text-slate-700 text-sm mb-1">{videoMethodology.shadow_script.title_es}</h5>
                         <p className="text-emerald-600 font-black mb-1">{videoMethodology.shadow_script.phrase_en}</p>
                         <p className="text-xs text-slate-500 italic mb-2">"{videoMethodology.shadow_script.phrase_es}"</p>
                         <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg">{videoMethodology.shadow_script.learning_tip}</p>
                      </div>
                   </div>
                 </div>
               </div>
            )}
            
          </div>

          {results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-500" />
                  <h3 className="text-sm font-bold text-slate-800">Lecciones Extraídas Automáticamente</h3>
                </div>
                <button onClick={() => setResults(null)} className="text-xs text-slate-500 font-semibold hover:text-slate-800 transition-colors">Limpiar Resultados</button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(results || []).map((item: any, i: number) => (
                  <div key={`result-${i}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold capitalize">
                        {item.category || item.grammar_tag || 'Intel'}
                      </div>
                      <button 
                        onClick={() => saveToGlobalStore(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-bold text-xs transition-all shadow-sm shadow-teal-500/20 active:scale-95"
                      >
                        <Save size={14} />
                        Guardar en Anali
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Frase Original / Contexto</div>
                        <p className="text-slate-800 font-medium text-sm">{item.phrase_es}</p>
                      </div>
                      <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                        <div className="text-xs text-teal-600 font-bold mb-1">Versión Anali (Inglés Táctico)</div>
                        <p className="text-teal-700 font-bold text-lg">{item.phrase_en}</p>
                        <p className="text-teal-600/70 text-xs italic mt-1 font-mono">{item.phonetic_tactic}</p>
                      </div>
                      {item.learning_tip && (
                        <div className="pt-2">
                          <div className="text-xs text-amber-500 font-bold mb-2">💡 Tip de Aprendizaje</div>
                          <p className="text-slate-600 text-sm bg-amber-50/50 p-3 rounded-xl leading-relaxed border border-amber-100/50">{item.learning_tip}</p>
                        </div>
                      )}
                      
                      {item.grammar_tags && item.grammar_tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                           {item.grammar_tags.map((tag: string, idx: number) => (
                             <span key={`tag-${idx}-${tag}`} className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase">{tag}</span>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedEntries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Historial de Ingesta</h3>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">{savedEntries.length} Items</span>
              </div>

              <div className="grid gap-4">
                {savedEntries.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-2xl p-5 space-y-3 relative group border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-800 truncate pr-4">{entry.topic}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase">{entry.category}</span>
                        <button 
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">"{entry.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in">
           <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Panel de Control Master</h3>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">{users.length} Registros</span>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 relative">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase">Estudiante</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase">Profesión</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase hover:text-teal-500 cursor-help transition-colors" title="Clave técnica para soporte">Clave</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase">Conversas</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase">Biblioteca</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase">Activo</th>
                  <th className="py-4 text-xs font-bold text-slate-500 uppercase text-right">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                           <span className="text-sm font-bold text-slate-800">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}` || 'Sin Nombre'}</span>
                           {u.role === 'master' && <Shield size={12} className="text-amber-500" />}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium tracking-tight">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full capitalize">
                        {u.occupation || 'Gral'}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200">
                        {u.support_code || '---'}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                        {u.conversations_count || 0}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {u.saved_objects_count || 0}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className="text-[10px] font-medium text-slate-500">
                        {u.last_login ? (u.last_login.toDate ? u.last_login.toDate() : new Date(u.last_login)).toLocaleDateString() : '--'}
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-medium">
                          {u.createdAt ? (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 text-slate-300">
              <Users size={80} strokeWidth={1} />
              <p className="text-sm font-bold uppercase tracking-widest">Sin Estudiantes Registrados</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'intel' && !results && !loading && savedEntries.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Database size={64} strokeWidth={1.5} className="text-slate-300" />
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Esperando Flujo de Entrada</p>
        </div>
      )}
    </div>
  );
}
