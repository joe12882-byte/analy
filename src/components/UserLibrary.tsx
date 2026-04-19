import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Loader2, Save, BookOpen, Trash2 } from 'lucide-react';
import { curateContent } from '../lib/gemini';
import { CurationEntry } from '../types';

export default function UserLibrary() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [savedEntries, setSavedEntries] = useState<CurationEntry[]>([]);

  useEffect(() => {
    const savedIntel = localStorage.getItem('analy_local_intel');
    if (savedIntel) setSavedEntries(JSON.parse(savedIntel));
  }, []);

  const handleCurate = async () => {
    if (!input) return;
    setLoading(true);
    const result = await curateContent(input);
    setResults(result);
    setLoading(false);
  };

  const saveEntry = (tip: any) => {
    const newEntry: CurationEntry = {
      id: crypto.randomUUID(),
      topic: tip.topic,
      content: tip.content,
      category: tip.category,
      sourceType: 'text'
    };
    const updated = [newEntry, ...savedEntries];
    setSavedEntries(updated);
    localStorage.setItem('analy_local_intel', JSON.stringify(updated));
  };

  const deleteEntry = (id: string) => {
    const updated = savedEntries.filter(e => e.id !== id);
    setSavedEntries(updated);
    localStorage.setItem('analy_local_intel', JSON.stringify(updated));
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight uppercase italic text-[#00F0FF]">Mi Biblioteca</h2>
        <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">Tus extracciones tácticas personales</p>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <textarea 
            className="w-full h-40 bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-[#00F0FF] outline-none resize-none transition-all"
            placeholder="Pega un texto o descripción para extraer tácticas..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="absolute bottom-4 right-4 text-[9px] text-[#00F0FF] font-black mono-display">
            {input.length} BITS
          </div>
        </div>

        <button 
          onClick={handleCurate}
          disabled={loading || !input}
          className="w-full bg-[#00F0FF] text-[#0F0F0F] font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all disabled:opacity-30 disabled:grayscale uppercase tracking-widest text-xs"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Analizando datos tácticos...</span>
            </>
          ) : (
            <>
              <span>Extraer Inteligencia</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">Resultado del Análisis</h3>
            <button onClick={() => setResults(null)} className="text-[9px] text-gray-500 uppercase font-black">Limpiar</button>
          </div>

          <div className="grid gap-4">
            {results.extractedTips?.map((tip: any, i: number) => (
              <div key={i} className="analy-card p-5 space-y-3 relative group overflow-hidden border-[#00F0FF]/10 active:scale-[0.98] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full" />
                    <h4 className="font-black text-xs uppercase tracking-widest mono-display">{tip.topic}</h4>
                  </div>
                  <button 
                    onClick={() => saveEntry(tip)}
                    className="p-2 bg-[#00F0FF] text-[#0F0F0F] rounded-xl hover:scale-110 transition-all font-black"
                  >
                    <Save size={14} />
                  </button>
                </div>
                <p className="text-gray-400 text-sm italic font-medium leading-relaxed">"{tip.content}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedEntries.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Unidades en Reserva</h3>
            <span className="text-[10px] font-black text-gray-600 mono-display">{savedEntries.length} Items</span>
          </div>

          <div className="grid gap-4">
            {savedEntries.map((entry) => (
              <div key={entry.id} className="analy-card p-5 space-y-3 relative group overflow-hidden bg-black/40 border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-widest mono-display text-gray-300">{entry.topic}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full font-black uppercase">{entry.category}</span>
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

      {!results && !loading && savedEntries.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-10">
          <div className="relative">
            <BookOpen size={80} strokeWidth={1} />
            <Search className="absolute -bottom-2 -right-2 bg-[#0F0F0F] rounded-full p-2" size={32} />
          </div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase">Biblioteca Vacía</p>
        </div>
      )}
    </div>
  );
}
