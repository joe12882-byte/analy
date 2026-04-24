import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Volume2 } from 'lucide-react';
import AnaliAvatar, { AnaliEmotion } from './AnaliAvatar';
import { speak } from '../lib/speech';

interface CoachMarkProps {
  id: string;
  title: string;
  message: string;
  onClose: () => void;
  isVisible: boolean;
  emotion?: AnaliEmotion;
  position?: 'top' | 'bottom' | 'center';
}

export default function CoachMark({ 
  id, 
  title, 
  message, 
  onClose, 
  isVisible, 
  emotion = 'happy',
  position = 'bottom'
}: CoachMarkProps) {
  
  const handleSpeak = async () => {
    await speak(message, 'es-ES');
  };

  if (!isVisible) return null;

  const positionClasses = {
    top: 'top-24 left-1/2 -translate-x-1/2',
    bottom: 'bottom-32 left-1/2 -translate-x-1/2',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className={`fixed z-[100] w-[90%] max-w-sm ${positionClasses[position]}`}
      >
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-teal-400 overflow-hidden">
          <div className="bg-teal-500 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{title}</span>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-5 flex items-start gap-4">
            <AnaliAvatar emotion={emotion} size="sm" className="shrink-0" />
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                {message}
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleSpeak}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase hover:bg-teal-100 transition-colors"
                >
                  <Volume2 size={12} /> Escuchar Tip
                </button>
                <button 
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-full text-[10px] font-black uppercase hover:bg-slate-900 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
          
          {/* Triángulo del bocadillo */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-teal-400 rotate-45 ${position === 'bottom' ? '-bottom-2' : '-top-2 rotate-[225deg]'}`} />
        </div>
      </motion.div>
      
      {/* Overlay sutil para enfocar la atención */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 z-[90] backdrop-blur-[2px]"
        onClick={onClose}
      />
    </AnimatePresence>
  );
}
