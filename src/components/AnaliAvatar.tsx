import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import collageImg from '../assets/images/analy_master.png';

export type AnaliEmotion = 'neutral' | 'thinking' | 'success' | 'happy' | 'learning' | 'surprised' | 'concentrated' | 'snappy';

interface AnaliAvatarProps {
  emotion?: AnaliEmotion;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Mapa de posiciones para la cuadrícula 2x3 (Columnas x Filas)
 * Basado en el collage académico clásico.
 */
const EMOTION_POSITIONS: Record<AnaliEmotion, string> = {
  happy: '0% 0%',         // Top-left: Gesturo prumdo
  success: '0% 0%',
  thinking: '100% 0%',    // Top-right: Pinsing contulado
  learning: '100% 0%',
  surprised: '0% 50%',    // Middle-left: Gesturo de spetriza
  concentrated: '100% 50%', // Middle-right: Gesturo de concentrada
  snappy: '0% 100%',      // Bottom-left: Gesturo de snappy
  neutral: '100% 100%',   // Bottom-right: Gesturo de neutral
};

const SIZE_MAP = {
  xs: 'w-10 h-14',
  sm: 'w-14 h-20',
  md: 'w-24 h-32',
  lg: 'w-48 h-64',
  xl: 'w-64 h-80',
  '2xl': 'w-80 h-[400px]'
};

export default function AnaliAvatar({ emotion = 'neutral', className, size = 'md' }: AnaliAvatarProps) {
  const position = EMOTION_POSITIONS[emotion] || EMOTION_POSITIONS.neutral;

  return (
    <div className={`relative ${SIZE_MAP[size]} ${className || ''}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="w-full h-full rounded-lg overflow-hidden border-4 border-[#3D2B1F] shadow-2xl bg-white relative"
        >
          {/* El marco dorado clásico */}
          <div className="absolute inset-0 border-[6px] border-amber-600/30 pointer-events-none z-10" />
          
          <div 
            className="w-full h-full transition-all duration-1000 ease-in-out bg-slate-100"
            style={{
              backgroundImage: `url(${collageImg})`,
              backgroundSize: '200% 300%', // 2 columnas, 3 filas
              backgroundPosition: position,
              backgroundRepeat: 'no-repeat',
              filter: 'contrast(1.05) saturate(1.1)'
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
