import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface IntroSplashProps {
  onComplete: () => void;
  videoSrc: string;
}

export default function IntroSplash({ onComplete, videoSrc }: IntroSplashProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intentar forzar el inicio del video
  useEffect(() => {
    // Si el video no carga en 2 segundos, saltar
    const safetyTimer = setTimeout(() => {
      console.log("Video safety timeout triggered");
      onComplete();
    }, 2500);

    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setHasStarted(true);
        clearTimeout(safetyTimer);
      }).catch(err => {
        console.log("Autoplay blocked - waiting for interaction", err);
      });
    }
    
    return () => clearTimeout(safetyTimer);
  }, []);

  const handleVideoEnd = () => {
    onComplete();
  };

  const handleVideoError = (e: any) => {
    console.warn("Video source incompatible or missing, skipping intro...", e);
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        playsInline
        autoPlay
        muted={isMuted}
      />

      {/* Overlay de Degradado */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Controles y Saltar */}
      <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-between items-center">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <button 
          onClick={onComplete}
          className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full flex items-center gap-2 text-white border border-white/20 hover:bg-white/20 transition-all font-bold text-sm uppercase tracking-widest"
        >
          Saltar Intro <ArrowRight size={16} />
        </button>
      </div>

      {/* Indicador de Inicio si el Autoplay falla */}
      {!hasStarted && (
        <div 
          onClick={() => videoRef.current?.play().then(() => setHasStarted(true))}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 cursor-pointer"
        >
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-pulse border border-white/50">
             <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-2" />
          </div>
          <p className="text-white mt-4 font-black uppercase tracking-widest text-[10px]">Toca para iniciar ANALI</p>
        </div>
      )}
    </div>
  );
}
