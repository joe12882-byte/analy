import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCcw, Info, Sparkles, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeToolImage } from '../lib/gemini';
import { ToolInfo } from '../types';

export default function ARCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [toolInfo, setToolInfo] = useState<ToolInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Vision access restricted. Check permissions or open in a new tab.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setAnalyzing(true);
    setToolInfo(null);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    const result = await analyzeToolImage(base64Image);
    if (result) {
      setToolInfo({
        name: result.toolName,
        usage: result.briefUsage,
        phrases: result.phrases
      });
    } else {
      setError("Failed to sync context. Retry identification.");
    }
    setAnalyzing(false);
  };

  return (
    <div className="relative h-full bg-[#0F0F0F] overflow-hidden flex flex-col">
      {/* Viewfinder */}
      <div className="relative flex-1 bg-black overflow-hidden m-4 rounded-3xl border border-white/5">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="space-y-4">
              <p className="text-gray-500 text-xs italic">{error}</p>
              <button 
                onClick={startCamera}
                className="bg-[#00F0FF] text-[#0F0F0F] px-6 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"
              >
                Reconnect
              </button>
            </div>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover opacity-60"
          />
        )}

        {/* Scan Overlay */}
        <div className="absolute inset-0 border-[20px] border-[#0F0F0F]/80 pointer-events-none">
          <div className="w-full h-full border border-white/10 rounded-2xl relative">
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00F0FF]" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00F0FF]" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00F0FF]" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00F0FF]" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px] bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[80%] bg-white/5" />
          </div>
        </div>

        {/* HUD Data */}
        <div className="absolute top-6 left-6 flex flex-col gap-1">
          <span className="text-[8px] mono-display text-[#00F0FF]/60">Scanning Node</span>
          <span className="text-[10px] font-bold text-white tracking-widest">VIS-094-BRAIN</span>
        </div>

        {/* Scanning Line */}
        {analyzing && (
          <motion.div 
            initial={{ top: '10%' }}
            animate={{ top: '90%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-6 right-6 h-[1px] bg-[#00F0FF] shadow-[0_0_15px_#00F0FF] z-10"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="px-6 pb-6 pt-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] mono-display text-gray-500">Optical Load</span>
          <span className="text-[10px] font-bold text-white uppercase tracking-widest italic font-black">Sync Ready</span>
        </div>

        <button 
          onClick={captureFrame}
          disabled={analyzing || !isCameraActive}
          className={`relative w-24 h-24 rounded-full border border-white/10 flex items-center justify-center transition-all ${
            analyzing ? 'opacity-50 scale-90' : 'active:scale-95'
          }`}
        >
          <div className="w-16 h-16 bg-[#00F0FF] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)]">
            {analyzing ? <RefreshCcw className="animate-spin text-[#0F0F0F]" size={28} /> : <Sparkles className="text-[#0F0F0F]" size={28} />}
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t-2 border-[#00F0FF]/30 rounded-full"
          />
        </button>

        <div className="flex flex-col items-end">
          <span className="text-[8px] mono-display text-gray-500">Network Latency</span>
          <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest italic font-black">Stable</span>
        </div>
      </div>

      {/* Info Card Overlay */}
      <AnimatePresence>
        {toolInfo && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-[40px] p-8 pb-32 border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <span className="text-[#00F0FF] text-[10px] uppercase font-black tracking-[0.2em] mono-display">Identifier Match</span>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{toolInfo.name}</h2>
              </div>
              <button 
                onClick={() => setToolInfo(null)}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-all border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8 text-sm text-gray-300">
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-[#00F0FF]" />
                  <h3 className="text-white font-black uppercase text-[11px] tracking-widest mono-display">Context Extraction</h3>
                </div>
                <p className="text-[15px] leading-relaxed tracking-tight font-medium opacity-80">{toolInfo.usage}</p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#00F0FF]" />
                  <h3 className="text-white font-black uppercase text-[11px] tracking-widest mono-display">Tactical Phrases</h3>
                </div>
                <div className="grid gap-3">
                  {toolInfo.phrases.map((p, i) => (
                    <div key={i} className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5 font-mono text-xs flex justify-between items-center group relative overflow-hidden active:bg-[#00F0FF]/5 transition-all">
                      <div className="flex items-center gap-3">
                         <span className="text-[#00F0FF]/60">{i+1}.</span>
                         <span className="text-gray-300 font-bold group-active:text-[#00F0FF] transition-colors">{p}</span>
                      </div>
                      <Volume2 size={14} className="text-gray-600 group-hover:text-[#00F0FF] transition-colors" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
