import React, { useRef, useState, useEffect } from 'react';
import { Camera, SwitchCamera, Sparkles, X, Volume2, Loader2, AlertCircle, ScanText, Rocket, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeToolImage, translateImageAR } from '../lib/gemini';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { ARObject } from '../types';
import { speak as globalSpeak } from '../lib/speech';

export default function ARCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'identify' | 'translate'>('identify');
  const [detectedObjects, setDetectedObjects] = useState<ARObject[]>([]);
  const [textBlocks, setTextBlocks] = useState<any[]>([]); 
  const [showTranslateTip, setShowTranslateTip] = useState(false);
  const [savedItemsLocal, setSavedItemsLocal] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  useEffect(() => {
    try {
      const hasSeenTip = localStorage.getItem('analy_seen_translate_tip');
      if (!hasSeenTip && scanMode === 'translate') setShowTranslateTip(true);
    } catch (e) {
      if (scanMode === 'translate') setShowTranslateTip(true);
    }
  }, [scanMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setError("Permisos de cámara denegados. Activa la cámara en los ajustes de tu navegador.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setAnalyzing(true);
    setError(null);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w <= 0 || h <= 0) {
      setAnalyzing(false);
      return;
    }
    
    // Scale for Gemini to save bandwidth/performance
    const MAX_DIM = 1024; 
    if (w > h && w > MAX_DIM) { h *= MAX_DIM / w; w = MAX_DIM; }
    else if (h > MAX_DIM) { w *= MAX_DIM / h; h = MAX_DIM; }
    
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const capturedBase64 = canvas.toDataURL('image/jpeg', 0.6);
    setFrozenFrame(capturedBase64);

    try {
      if (scanMode === 'identify') {
        const result = await analyzeToolImage(capturedBase64);
        if (result?.objects?.length > 0) {
          setDetectedObjects(result.objects);
        } else {
          setError("Analí no encontró objetos claros aquí.");
        }
      } else {
        const result = await translateImageAR(capturedBase64, profile?.occupation);
        if (result?.blocks?.length > 0) {
          setTextBlocks(result.blocks);
        } else {
          setError("No se detectó texto legible. Prueba acercándote más o mejorando la iluminación.");
        }
      }
    } catch (e) {
      console.error("Capture Error:", e);
      setError("Error de conexión con Analí. Verifica tu internet.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetView = () => {
    setFrozenFrame(null);
    setError(null);
    setDetectedObjects([]);
    setTextBlocks([]);
    setSelectedBlock(null);
    setAnalyzing(false);
    startCamera();
  };

  const handleSaveItem = async (data: { label_en: string, label_es: string, phonetic_tactic: string, example_en: string, example_es: string, category?: string }) => {
    if (!profile?.uid) return;
    
    try {
      const { doc, updateDoc, increment, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        saved_objects_count: increment(1)
      });

      const savedRef = collection(db, 'users', profile.uid, 'saved_units');
      await addDoc(savedRef, {
        phrase_en: data.label_en,
        phrase_es: data.label_es,
        phonetic_tactic: data.phonetic_tactic,
        example_en: data.example_en || '',
        example_es: data.example_es || '',
        category: data.category || scanMode,
        profession: profile.occupation || 'general',
        saved_at: serverTimestamp(),
        source: 'scanner',
        type: scanMode === 'identify' ? 'object' : 'text'
      });

      setSavedItemsLocal(prev => [...prev, data.label_en]);
    } catch (e) {
      console.error("Error saving:", e);
    }
  };

  const speak = (text: string) => {
    globalSpeak(text, 'en-US').catch(() => {});
  };

  return (
    <div className="relative h-[90vh] bg-slate-50 overflow-hidden flex flex-col p-4 w-full max-w-4xl mx-auto text-quicksand">
      {/* Background Decoratives */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-300/20 pointer-events-none filter blur-[120px] rounded-full" />
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col gap-3 sticky top-0 z-20 mb-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Ojo Táctico de Anali</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${scanMode === 'identify' ? 'bg-teal-500' : 'bg-amber-500'}`} />
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                {scanMode === 'identify' ? 'Escáner de Objetos' : 'Traductor de Texto'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {(frozenFrame || error) && (
              <button 
                onClick={resetView}
                className="p-3 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-all"
              >
                <X size={18} />
              </button>
            )}
            <button 
              onClick={toggleCamera} 
              className="p-3 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 active:scale-95 transition-all outline-none"
            >
              <SwitchCamera size={18} />
            </button>
          </div>
        </div>

        {/* Mode Buttons */}
        <div className="flex gap-2 p-1 bg-slate-100/50 backdrop-blur-md rounded-2xl border border-white/50">
          <button 
            onClick={() => { setScanMode('identify'); resetView(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${scanMode === 'identify' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Camera size={14} /> Identificar
          </button>
          <button 
            onClick={() => { setScanMode('translate'); resetView(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${scanMode === 'translate' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <ScanText size={14} /> Traducir Texto
          </button>
        </div>
      </div>

      {/* Visor Area */}
      <div className={`relative bg-slate-200 rounded-[32px] overflow-hidden border-[6px] border-white shadow-xl z-0 isolate transition-all duration-300 ${ (detectedObjects.length > 0) ? "h-[45%]" : "flex-1"}`}>
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-50">
            <AlertCircle className="text-rose-500 mb-4" size={48} />
            <p className="text-slate-800 text-sm font-black mb-6">{error}</p>
            <button onClick={resetView} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95">Reintentar</button>
          </div>
        ) : (
          frozenFrame ? (
            <img src={frozenFrame} className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85]" alt="Capture" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          )
        )}

        {/* Scan line */}
        {analyzing && (
          <motion.div 
            initial={{ top: '10%' }}
            animate={{ top: '90%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className={`absolute left-0 right-0 h-1 z-10 opacity-80 ${scanMode === 'identify' ? 'bg-teal-400 shadow-[0_0_20px_#2DD4BF]' : 'bg-amber-400 shadow-[0_0_20px_#FBBF24]'}`}
          />
        )}

        {/* AR Overlays for Identify */}
        {frozenFrame && scanMode === 'identify' && detectedObjects.map((obj, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-teal-400 bg-teal-400/20 rounded-lg shadow-lg"
            style={{
              left: `${obj.bbox?.x * 100}%`,
              top: `${obj.bbox?.y * 100}%`,
              width: `${obj.bbox?.w * 100}%`,
              height: `${obj.bbox?.h * 100}%`
            }}
          />
        ))}

        {/* AR Overlays for Translate */}
        {frozenFrame && scanMode === 'translate' && textBlocks.map((block, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute bg-amber-500/90 backdrop-blur-md rounded-lg shadow-xl shadow-amber-500/20 flex flex-col items-center justify-center p-2 text-center border border-white/30 cursor-pointer overflow-hidden group ${selectedBlock === block ? 'ring-4 ring-white' : ''}`}
            style={{
              left: `${block.bbox.x * 100}%`,
              top: `${block.bbox.y * 100}%`,
              width: `${block.bbox.w * 100}%`,
              minWidth: '100px',
              height: 'auto'
            }}
            onClick={() => { setSelectedBlock(block); speak(block.original_en); }}
          >
             <p className="text-[10px] font-black text-white leading-tight uppercase tracking-tight">{block.translation_es}</p>
             <p className="text-[7px] font-bold text-amber-100 uppercase mt-1 opacity-60 italic">"{block.original_en}"</p>
          </motion.div>
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="py-6 flex flex-col items-center gap-4">
        {!frozenFrame && !error && (
          <button 
            onClick={captureFrame}
            disabled={analyzing || !isCameraActive}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 ${scanMode === 'identify' ? 'bg-teal-500' : 'bg-amber-500'}`}
          >
            <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
              {analyzing ? <Loader2 className="animate-spin text-white" size={32} /> : scanMode === 'identify' ? <Camera className="text-white" size={32} /> : <ScanText className="text-white" size={32} />}
            </div>
          </button>
        )}

        {frozenFrame && !selectedBlock && !detectedObjects.length && (
          <button 
            onClick={resetView}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95"
          >
             Nueva Foto / Limpiar
          </button>
        )}
      </div>

      {/* Bottom Panel for Identify / Translate Results */}
      <AnimatePresence>
        {(scanMode === 'identify' && detectedObjects.length > 0) || (scanMode === 'translate' && selectedBlock) ? (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="flex-1 bg-white rounded-t-[40px] p-6 shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-800 uppercase">
                {scanMode === 'identify' ? 'Objetos Detectados' : 'Traducción Detallada'}
              </h2>
              <button 
                onClick={() => {
                  if (scanMode === 'identify') resetView();
                  else setSelectedBlock(null);
                }} 
                className="p-2 bg-slate-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {scanMode === 'identify' ? (
                detectedObjects.map((obj, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black text-slate-800">{obj.label_en}</h3>
                        <p className="text-sm text-slate-500 font-bold">{obj.label_es}</p>
                      </div>
                      <button onClick={() => speak(obj.label_en)} className="p-3 bg-teal-500 text-white rounded-xl">
                        <Volume2 size={20} />
                      </button>
                    </div>
                    
                    <div className="bg-white p-3 rounded-2xl border border-teal-50 italic text-sm font-medium text-slate-600">
                      "{obj.example_en}"
                    </div>

                    <button 
                      onClick={() => handleSaveItem({
                        label_en: obj.label_en,
                        label_es: obj.label_es,
                        phonetic_tactic: obj.phonetic_tactic,
                        example_en: obj.example_en,
                        example_es: obj.example_es,
                        category: 'scanner_object'
                      })}
                      className="w-full py-3 bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Guardar en mi Biblioteca
                    </button>
                  </div>
                ))
              ) : selectedBlock && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedBlock.original_en}</h3>
                      <p className="text-base text-amber-600 font-black mt-1">{selectedBlock.translation_es}</p>
                      <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-tighter">[{selectedBlock.phonetic_tactic}]</p>
                    </div>
                    <button onClick={() => speak(selectedBlock.original_en)} className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg">
                      <Volume2 size={24} />
                    </button>
                  </div>

                  {selectedBlock.learning_tip && (
                    <div className="bg-white p-4 rounded-2xl border-l-4 border-amber-500 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tip de Analí:</p>
                      <p className="text-sm text-slate-700 italic">{selectedBlock.learning_tip}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSaveItem({
                        label_en: selectedBlock.original_en,
                        label_es: selectedBlock.translation_es,
                        phonetic_tactic: selectedBlock.phonetic_tactic,
                        example_en: '',
                        example_es: '',
                        category: 'scanner_text'
                      })}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Guardar Traducción
                    </button>
                    <button 
                      onClick={resetView}
                      className="py-4 px-6 bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Helper Tip */}
      <AnimatePresence>
        {showTranslateTip && scanMode === 'translate' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md"
          >
            <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl space-y-8 text-center animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-amber-500 rounded-[28px] mx-auto flex items-center justify-center rotate-6 shadow-xl">
                 <Rocket className="text-white" size={36} />
               </div>
               <div className="space-y-3">
                 <h3 className="text-2xl font-black text-slate-800 leading-tight">¡Traducción Táctica! 🎯</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Apunta la cámara a cualquier letrero o texto en inglés. Analí lo traducirá directamente sobre la imagen.</p>
               </div>
               <button 
                 onClick={() => { setShowTranslateTip(false); localStorage.setItem('analy_seen_translate_tip', 'true'); }}
                 className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest active:scale-95"
               >
                 ¡Vamos a ello!
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
