import React, { useRef, useState, useEffect } from 'react';
import { Camera, SwitchCamera, Info, Sparkles, X, Volume2, Loader2, AlertCircle, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeToolImage } from '../lib/gemini';
import { useAuth } from './AuthProvider';
import { ARObject } from '../types';
import { speak as globalSpeak } from '../lib/speech';

export default function ARCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<ARObject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos de tu navegador.");
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
    setDetectedObjects([]);
    
    // Configuración de Compresión de Imagen (Mayor Velocidad)
    const MAX_DIM = 640; 
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    let w = video.videoWidth;
    let h = video.videoHeight;
    
    if (w > h) {
      if (w > MAX_DIM) {
        h *= MAX_DIM / w;
        w = MAX_DIM;
      }
    } else {
      if (h > MAX_DIM) {
        w *= MAX_DIM / h;
        h = MAX_DIM;
      }
    }
    
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, w, h);
    
    // .toDataURL() congela con calidad reducida (0.5 max compresion sin perder contexto)
    const base64Image = canvas.toDataURL('image/jpeg', 0.5); 
    setFrozenFrame(base64Image); // Freeze image while processing immediately
    
    // Ejecución asíncrona no bloqueante
    try {
      const result = await analyzeToolImage(base64Image);
      if (result && result.objects && result.objects.length > 0) {
        setDetectedObjects(result.objects);
      } else {
        setError("Anali no encontró objetos tácticos útiles en esta imagen.");
        setFrozenFrame(null);
      }
    } catch (e) {
      setError("Fallo de red al analizar la imagen.");
      setFrozenFrame(null);
    }
    setAnalyzing(false);
  };

  const speak = (text: string) => {
    globalSpeak(text, 'en-US');
  };

  const resetView = () => {
    setDetectedObjects([]);
    setFrozenFrame(null);
    setError(null);
  };

  return (
    <div className="relative h-[85vh] bg-slate-50 overflow-hidden flex flex-col p-4 w-full max-w-4xl mx-auto">
      {/* Background Decoratives */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-300/20 pointer-events-none filter blur-[120px] rounded-full" />
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 z-10 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Ojo Táctico de Anali</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Escáner de Entorno</p>
          </div>
        </div>
        <button 
          onClick={toggleCamera} 
          className="p-3 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 active:scale-95 transition-all outline-none"
        >
          <SwitchCamera size={20} />
        </button>
      </div>

      {/* Viewfinder */}
      <div className={`relative bg-slate-200 rounded-[32px] overflow-hidden border-[6px] border-white shadow-xl z-0 isolate transition-all duration-300 ${detectedObjects.length > 0 ? "h-1/2 flex-shrink-0" : "flex-1"}`}>
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-slate-50">
            <div className="space-y-4 max-w-[200px]">
              <AlertCircle className="mx-auto text-rose-500" size={32} />
              <p className="text-slate-600 text-xs font-medium">{error}</p>
              <button 
                onClick={() => { setError(null); startCamera(); }}
                className="bg-teal-500 text-white px-6 py-3 rounded-full font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-md"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          frozenFrame ? (
            <img src={frozenFrame} className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85]" alt="Frozen capture" />
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )
        )}

        {/* Scan Overlay - Soft Grid */}
        <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between opacity-50 mix-blend-overlay">
          <div className="flex justify-between">
            <div className="w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-3xl" />
            <div className="w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-3xl" />
          </div>
          <div className="flex justify-between">
            <div className="w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-3xl" />
            <div className="w-12 h-12 border-b-4 border-r-4 border-white rounded-br-3xl" />
          </div>
        </div>

        {/* BOUNDING BOXES (AR Overlay) */}
        {frozenFrame && detectedObjects.map((obj, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15, type: 'spring' }}
            key={i}
            className="absolute border-2 border-teal-400 bg-teal-400/20 rounded-lg shadow-lg flex items-center justify-center cursor-pointer pointer-events-none"
            style={{
              left: `${obj.bbox?.x * 100}%`,
              top: `${obj.bbox?.y * 100}%`,
              width: `${obj.bbox?.w * 100}%`,
              height: `${obj.bbox?.h * 100}%`
            }}
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {obj.label_en}
            </div>
          </motion.div>
        ))}

        {/* Scanning Line */}
        {analyzing && (
          <motion.div 
            initial={{ top: '10%' }}
            animate={{ top: '90%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_20px_#2DD4BF] z-10 opacity-80"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls Container */}
      <div className={`pt-4 pb-2 flex justify-center z-10 ${detectedObjects.length > 0 ? "min-h-0" : "min-h-[100px]"}`}>
        {detectedObjects.length === 0 && !error && (
          <button 
            onClick={captureFrame}
            disabled={analyzing || !isCameraActive}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${analyzing ? 'bg-slate-200 scale-95' : 'bg-teal-500 shadow-xl shadow-teal-500/30 active:scale-90 hover:bg-teal-400'}`}
          >
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${analyzing ? 'border-slate-300' : 'border-white bg-teal-400'}`}>
              {analyzing ? <Loader2 className="animate-spin text-slate-500" size={32} /> : <Camera className="text-white ml-0.5" size={32} />}
            </div>
          </button>
        )}
      </div>

      {/* Info Card - Multiobject (Panel Inferior) */}
      <AnimatePresence>
        {detectedObjects.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 mt-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-xl overflow-y-auto custom-scrollbar flex flex-col"
          >
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white z-10 pb-2">
              <div className="space-y-1">
                <span className="text-teal-600 text-[10px] uppercase font-black tracking-widest">Análisis Multiobjeto</span>
                <h2 className="text-xl font-black text-slate-800 leading-tight">Múltiples hallazgos</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    alert("Objetos guardados en Estante Local.");
                    resetView();
                  }}
                  className="px-4 py-2 bg-teal-50 text-teal-600 font-bold text-[10px] uppercase tracking-wider rounded-full hover:bg-teal-100 transition-colors"
                >
                  Guardar Todos
                </button>
                <button 
                  onClick={resetView}
                  className="px-4 py-2 bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <X size={14} /> Nueva Foto
                </button>
              </div>
            </div>

            <div className="space-y-3 pb-8">
              {detectedObjects.map((obj, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group relative overflow-hidden active:bg-slate-100 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800 flex items-center gap-2">
                           <Maximize size={14} className="text-teal-500" /> {obj.label_en}
                        </span>
                        <span className="text-xs text-slate-500 italic font-medium">{obj.label_es}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); speak(obj.label_en); }} className="w-10 h-10 bg-teal-100/50 shrink-0 rounded-full flex items-center justify-center text-teal-600 active:scale-95 transition-transform hover:bg-teal-100">
                      <Volume2 size={16} />
                    </button>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-teal-50">
                     <p className="text-sm font-bold text-slate-700">"{obj.example_en}"</p>
                     <p className="text-[11px] text-slate-400 italic mt-1">{obj.example_es}</p>
                     <p className="text-xs text-teal-500 font-bold mt-2">👄 {obj.phonetic_tactic}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Thumbnail Overlay (Miniatura Profesional) */}
      <AnimatePresence>
        {frozenFrame && detectedObjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 4, x: 20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: -4, x: 20 }}
            className="absolute top-24 right-6 w-24 h-32 z-50 rounded-2xl overflow-hidden border-[4px] border-white shadow-2xl shadow-teal-900/20 pointer-events-none"
          >
            <img src={frozenFrame} className="w-full h-full object-cover" alt="Referencia Miniatura" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />
            
            {/* Punteros de los objetos en la miniatura */}
            {detectedObjects.map((obj, i) => (
               <div 
                 key={`thumb-${i}`}
                 className="absolute w-2 h-2 bg-teal-500 rounded-full border border-white shadow-sm"
                 style={{
                   left: `${(obj.bbox?.x || 0) * 100}%`,
                   top: `${(obj.bbox?.y || 0) * 100}%`,
                   transform: 'translate(-50%, -50%)' // Center the dot
                 }}
               />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
