import React, { useState, useEffect } from 'react';
import { Database, Search, ArrowRight, Trash2, FolderSync, ShieldAlert, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { CurationEntry } from '../types';
import VoiceSelector from './VoiceSelector';
import { safeStorage } from '../lib/storage';

export default function AdminVault() {
  const [intelDb, setIntelDb] = useState<CurationEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Load Intel from global intel queue / local intel
    const storedGlobal = safeStorage.parseJSON<any[]>('analy_global_intel', []);
    const storedUniversal = safeStorage.parseJSON<any[]>('analy_universal_scripts', []);
    const storedLocal = safeStorage.parseJSON<any[]>('analy_local_intel', []);

    let combined: any[] = [...storedGlobal];
    
    // Convert universal scripts to unified structure for view
    const u = storedUniversal.map((s: any) => ({
      id: s.id,
      topic: s.title,
      content: `EN: ${s.english} | ES: ${s.spanish} | ${s.context || ''}`,
      category: s.category,
      sourceType: 'system'
    }));
    combined = [...combined, ...u, ...storedLocal];

    // Deduplicate by ID
    const unique = Array.from(new Map(
      combined
        .filter(item => item && item.id)
        .map(item => [item.id, item])
    ).values());
    setIntelDb(unique as CurationEntry[]);
  }, []);

  const categories = Array.from(new Set(intelDb.map(i => i.category || 'uncategorized')));

  const deleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = intelDb.filter(entry => entry.id !== id);
    setIntelDb(updated);
    
    // We should ideally sync this back to localStorage files, but since it's an aggregated view:
    const cleanGlobal = safeStorage.parseJSON<any[]>('analy_global_intel', []).filter((x:any) => x.id !== id);
    const cleanUniversal = safeStorage.parseJSON<any[]>('analy_universal_scripts', []).filter((x:any) => x.id !== id);
    const cleanLocal = safeStorage.parseJSON<any[]>('analy_local_intel', []).filter((x:any) => x.id !== id);
    
    safeStorage.setItem('analy_global_intel', JSON.stringify(cleanGlobal));
    safeStorage.setItem('analy_universal_scripts', JSON.stringify(cleanUniversal));
    safeStorage.setItem('analy_local_intel', JSON.stringify(cleanLocal));
  };

  const filteredDb = selectedCategory ? intelDb.filter(i => i.category === selectedCategory) : intelDb;

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-teal-600 flex items-center gap-2">
          <Database size={24} /> Bóveda de Conocimiento
        </h2>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Cerebro Central de Anali</p>
      </div>

      {/* Acceso rápido a configuración de voz para el Master */}
      <div className="max-w-md">
         <VoiceSelector />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-4 py-2 rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm ${
            selectedCategory === null 
              ? 'bg-teal-500 text-white shadow-teal-500/20' 
              : 'bg-white text-slate-500 hover:text-teal-600 border border-slate-200'
          }`}
        >
          Todo ({intelDb.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm ${
              selectedCategory === cat 
                ? 'bg-teal-500 text-white shadow-teal-500/20' 
                : 'bg-white text-slate-500 hover:text-teal-600 border border-slate-200'
            }`}
          >
            {cat} ({intelDb.filter(i => i.category === cat).length})
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredDb.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50 bg-white rounded-3xl border border-slate-100 shadow-sm">
             <Filter size={48} className="text-slate-300" />
             <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Sin datos en esta categoría</p>
          </div>
        ) : (
          filteredDb.map(entry => (
            <div key={entry.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-teal-200 transition-colors relative overflow-hidden">
              <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-2 overflow-hidden">
                   <span className="shrink-0 text-[9px] bg-sky-50 text-sky-600 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-sky-100">
                     {entry.category || 'General'}
                   </span>
                   <h4 className="font-bold text-sm text-slate-700 truncate">{entry.topic}</h4>
                 </div>
                 <button 
                   onClick={(e) => deleteEntry(entry.id, e)}
                   className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-sm text-slate-600 font-medium leading-relaxed">
                   {entry.content}
                 </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
