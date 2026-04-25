import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Loader2, Save, BookOpen, Trash2, Sparkles } from 'lucide-react';
import { curateContent } from '../lib/gemini';
import { CurationEntry } from '../types';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { safeStorage } from '../lib/storage';

export default function UserLibrary() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [savedEntries, setSavedEntries] = useState<CurationEntry[]>([]);

  useEffect(() => {
    if (!user) return;

    const colRef = collection(db, 'users', user.uid, 'library');
    const q = query(colRef, orderBy('date', 'desc'));
    
    // Sincronización en tiempo real con Firestore
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as unknown as CurationEntry));
      setSavedEntries(items);
      
      // Update local storage as a mirror/fallback
      safeStorage.setItem('analy_local_intel', JSON.stringify(items));
    }, (err) => {
      if (err.code !== 'cancelled' && !err.message.includes('idle stream')) {
        console.error("Library sync error:", err);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleCurate = async () => {
    if (!input) return;
    setLoading(true);
    try {
      const result = await curateContent(input);
      setResults(result);
    } catch (err) {
      console.error("Curation Error:", err);
      alert("Error al procesar el contenido.");
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (tip: any) => {
    if (!user) return;
    const newEntry = {
      topic: tip.topic,
      content: tip.content,
      category: tip.category,
      sourceType: 'text',
      date: serverTimestamp()
    };
    
    try {
      const colRef = collection(db, 'users', user.uid, 'library');
      await addDoc(colRef, newEntry);
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'library', id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-teal-600">Mi Biblioteca</h2>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Tus extracciones tácticas personales</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
             <Search size={20} />
           </div>
           <h3 className="text-sm font-bold text-slate-800">Analizador Inteligente</h3>
        </div>
        <p className="text-xs text-slate-500 font-medium">Pega un texto o descripción aquí y Anali extraerá los mejores tips de inglés y vocabulario de forma automática.</p>
        
        <div className="relative group">
          <textarea 
            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 outline-none resize-none transition-all text-slate-700 font-medium"
            placeholder="Ejemplo: Cliente enojado me gritó porque la comida tardó 20 mins..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <button 
          onClick={handleCurate}
          disabled={loading || !input}
          className="w-full bg-teal-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 active:scale-95"
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
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-teal-500" />
              <h3 className="text-sm font-bold text-slate-800">Resultados del Análisis</h3>
            </div>
            <button onClick={() => setResults(null)} className="text-xs text-slate-500 font-semibold hover:text-slate-800 transition-colors">Limpiar</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {results.extractedTips?.map((tip: any, i: number) => (
              <div key={`tip-${i}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-slate-800">{tip.topic}</h4>
                  <button 
                    onClick={() => saveEntry(tip)}
                    className="p-2 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 hover:scale-105 transition-all shadow-sm active:scale-95"
                  >
                    <Save size={16} />
                  </button>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                   <p className="text-slate-600 text-sm italic font-medium leading-relaxed">"{tip.content}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedEntries.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Unidades en Reserva</h3>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">{savedEntries.length} Items</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {savedEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative group">
                <div className="flex items-center justify-between mb-2 w-full">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <span className="shrink-0 text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest truncate">
                      {entry.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-700 truncate">{entry.topic}</h4>
                  </div>
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mt-2 line-clamp-3 group-hover:line-clamp-none transition-all">"{entry.content}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results && !loading && savedEntries.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <BookOpen className="text-slate-300" size={64} strokeWidth={1.5} />
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Tu biblioteca está vacía</p>
        </div>
      )}
    </div>
  );
}
