import React, { useState, useEffect } from 'react';
import { Youtube, Search, ArrowRight, Loader2, Save, Trash2, Database, Users, Shield, Calendar, Link2, Sparkles, Server } from 'lucide-react';
import { extractFromYouTube } from '../lib/gemini';
import { CurationEntry, UserProfile, LearningUnit } from '../types';
import AdminVault from './AdminVault';

export default function AdminCurador() {
  const [input, setInput] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [savedEntries, setSavedEntries] = useState<CurationEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'intel' | 'users' | 'vault'>('intel');

  useEffect(() => {
    // Admin uses a global-like stash for processing
    const savedIntel = localStorage.getItem('analy_global_intel');
    if (savedIntel) setSavedEntries(JSON.parse(savedIntel));

    const globalUsers = localStorage.getItem('analy_global_users');
    if (globalUsers) setUsers(JSON.parse(globalUsers));
  }, []);

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
    const data = await extractFromYouTube(ytUrl);
    setResults(data);
    setLoading(false);
  };

  const saveToGlobalStore = (item: any) => {
    // Save to the universal scripts collection (simulated global DB)
    const existingScripts = JSON.parse(localStorage.getItem('analy_universal_scripts') || '[]');
    const newScript: LearningUnit = {
      id: crypto.randomUUID(),
      profession_id: 'general', // You could detect this or ask the admin
      category: item.category || 'professional',
      phrase_es: item.phrase_es || item.spanish,
      phrase_en: item.phrase_en || item.english,
      phonetic_tactic: item.phonetic_tactic || item.pronunciation,
      learning_tips: item.learning_tips || [item.significado],
      grammar_tag: item.grammar_tag || 'Intel Reciente',
      difficulty: item.difficulty || 3
    };

    localStorage.setItem('analy_universal_scripts', JSON.stringify([newScript, ...existingScripts]));
    
    // Also save to curation history for the master
    const newEntry: CurationEntry = {
      id: crypto.randomUUID(),
      topic: newScript.phrase_en.substring(0, 30),
      content: newScript.phrase_es,
      category: newScript.category,
      sourceType: 'video'
    };
    const updatedIntel = [newEntry, ...savedEntries];
    setSavedEntries(updatedIntel);
    localStorage.setItem('analy_global_intel', JSON.stringify(updatedIntel));
    
    alert('Intel Inyectado en la Base de Datos Global');
  };

  const deleteEntry = (id: string) => {
    const updated = savedEntries.filter(e => e.id !== id);
    setSavedEntries(updated);
    localStorage.setItem('analy_global_intel', JSON.stringify(updated));
  };

  if (activeTab === 'vault') {
    return (
      <div className="w-full">
         <div className="p-4 flex gap-2 border-b border-white/10">
           <button onClick={() => setActiveTab('intel')} className="text-xs font-black uppercase text-gray-500 hover:text-white px-4 py-2 border border-white/10 rounded-lg">Volver a Intel</button>
         </div>
         <AdminVault />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-[#00F0FF]">
            {activeTab === 'intel' ? 'Ingesta de Intel' : 'Control de Operativos'}
          </h2>
          <p className="text-gray-500 text-[10px] font-black tracking-widest uppercase italic">
            {activeTab === 'intel' ? 'Mando Admin: Alimentar Base de Conocimiento' : 'Vista Master: Recon de Usuarios'}
          </p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('intel')}
            className={`p-2 rounded-lg transition-all ${activeTab === 'intel' ? 'bg-[#00F0FF] text-[#0F0F0F]' : 'text-gray-500'}`}
          >
            <Database size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`p-2 rounded-lg transition-all ${activeTab === 'users' ? 'bg-[#00F0FF] text-[#0F0F0F]' : 'text-gray-500'}`}
          >
            <Users size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('vault')}
            title="Master Knowledge Hub (Cerebro Compartido)"
            className={`p-2 rounded-lg transition-all ${activeTab === 'vault' ? 'bg-[#00F0FF] text-[#0F0F0F]' : 'text-gray-500 bg-white/5 border border-white/10 hover:text-[#00F0FF]'}`}
          >
            <Server size={18} />
          </button>
        </div>
      </div>

      {activeTab === 'intel' ? (
        <>
          <div className="space-y-6">
            {/* YouTube Ingest Engine */}
            <div className="analy-card p-6 bg-[#00F0FF]/5 border-[#00F0FF]/20 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-[#00F0FF] text-[#0F0F0F] rounded-lg">
                   <Youtube size={20} />
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest">Motor de Ingesta Social</h3>
               </div>
               
               <div className="flex gap-3">
                 <div className="relative flex-1">
                   <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                   <input 
                     type="text"
                     placeholder="PEGA_ENLACE_YOUTUBE_AQUI"
                     value={ytUrl}
                     onChange={(e) => setYtUrl(e.target.value)}
                     className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-xs font-mono focus:border-[#00F0FF] outline-none"
                   />
                 </div>
                 <button 
                   onClick={handleYTExtract}
                   disabled={loading || !ytUrl}
                   className="bg-[#00F0FF] text-[#0F0F0F] px-6 rounded-xl font-black lowercase tracking-tighter disabled:opacity-30 transition-all active:scale-95"
                 >
                   {loading ? <Loader2 className="animate-spin" size={20} /> : 'Extraer Inteligencia'}
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
          </div>

          {results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#00F0FF]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">Inteligencia Táctica Extraída</h3>
                </div>
                <button onClick={() => setResults(null)} className="text-[9px] text-gray-500 uppercase font-black underline">Purgar Resultados</button>
              </div>

              <div className="grid gap-4">
                {results.map((item: any, i: number) => (
                  <div key={i} className="analy-card p-5 space-y-4 relative group overflow-hidden border-[#00F0FF]/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-[#00F0FF]/10 text-[#00F0FF] rounded text-[8px] font-black uppercase border border-[#00F0FF]/20">
                          {item.category}
                        </div>
                      </div>
                      <button 
                        onClick={() => saveToGlobalStore(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00F0FF] text-[#0F0F0F] rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-[0_0_15px_#00F0FF] transition-all"
                      >
                        <Database size={14} />
                        Inyectar en DB Global
                      </button>
                    </div>
                    
                    <div className="grid gap-3">
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase font-black mb-1">Lección/Original</div>
                        <p className="text-white font-medium text-sm">{item.phrase_es}</p>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#00F0FF] uppercase font-black mb-1">Softening Analy</div>
                        <p className="text-[#00F0FF] font-black text-base">{item.phrase_en}</p>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase font-black mb-1">Tips Pedagógicos</div>
                        {item.learning_tips?.map((tip: string, idx: number) => (
                           <p key={idx} className="text-gray-400 text-xs italic">- {tip}</p>
                        ))}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-[#00F0FF]/20 w-0 group-hover:w-full transition-all duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedEntries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Cola Global</h3>
                <span className="text-[10px] font-black text-gray-600 mono-display">{savedEntries.length} Items Pendientes</span>
              </div>

              <div className="grid gap-4">
                {savedEntries.map((entry) => (
                  <div key={entry.id} className="analy-card p-5 space-y-3 relative group overflow-hidden bg-black/40 border-white/5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs uppercase tracking-widest mono-display text-gray-300">{entry.topic}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-white/5 text-[#00F0FF] px-2 py-0.5 rounded-full font-black uppercase border border-[#00F0FF]/20">{entry.category}</span>
                        <button 
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm italic font-medium leading-relaxed">"{entry.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in">
           <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F0FF] italic">Panel de Control Master</h3>
            <span className="text-[10px] font-black text-gray-600 mono-display">{users.length} Registros</span>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 relative">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 text-[9px] font-black uppercase tracking-widest text-gray-500">Operativo</th>
                  <th className="py-4 text-[9px] font-black uppercase tracking-widest text-gray-500">Ocupación</th>
                  <th className="py-4 text-[9px] font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="py-4 text-[9px] font-black uppercase tracking-widest text-gray-500 text-right">Ext. Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase tracking-tight">{user.name}</span>
                        <span className="text-[10px] text-gray-600 font-mono lowercase">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded text-gray-400 uppercase italic">
                        {user.occupation}
                      </span>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-1.5">
                        <Shield size={10} className={user.role === 'master' ? 'text-[#00F0FF]' : 'text-gray-600'} />
                        <span className={`text-[9px] font-black uppercase ${user.role === 'master' ? 'text-[#00F0FF]' : 'text-gray-600'}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-gray-600">
                        <Calendar size={10} />
                        <span className="text-[9px] font-mono">
                          {user.registration_date ? new Date(user.registration_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-10">
              <Users size={80} strokeWidth={1} />
              <p className="text-[10px] font-black tracking-[0.3em] uppercase">Sin Operativos Registrados</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'intel' && !results && !loading && savedEntries.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-10">
          <Database size={80} strokeWidth={1} className="text-white" />
          <p className="text-[10px] font-black tracking-[0.3em] uppercase italic text-white">Esperando Flujo de Entrada</p>
        </div>
      )}
    </div>
  );
}
