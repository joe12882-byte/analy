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
 * Mapeo de la separación quirúrgica (recorte CSS) del collage 2x3.
 * Ajustamos el background-size y background-position para mostrar sólo el rostro.
 */
const EMOTION_SURGERY: Record<AnaliEmotion, { x: string, y: string }> = {
  // Fila 1
  happy:        { x: '5%', y: '2%' },    // Col 0, Fila 0
  success:      { x: '5%', y: '2%' },
  thinking:     { x: '95%', y: '2%' },   // Col 1, Fila 0
  learning:     { x: '95%', y: '2%' },
  
  // Fila 2
  surprised:    { x: '5%', y: '48%' },   // Col 0, Fila 1
  concentrated: { x: '95%', y: '48%' },  // Col 1, Fila 1
  
  // Fila 3
  snappy:       { x: '5%', y: '95%' },   // Col 0, Fila 2
  neutral:      { x: '95%', y: '95%' },  // Col 1, Fila 2
};

const SIZE_MAP = {
  xs: 'w-10 h-10',
  sm: 'w-14 h-14',
  md: 'w-24 h-24',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
  '2xl': 'w-80 h-80'
};

export default function AnaliAvatar({ emotion = 'neutral', className, size = 'md' }: AnaliAvatarProps) {
  const surgery = EMOTION_SURGERY[emotion] || EMOTION_SURGERY.neutral;

  return (
    <div className={`relative ${SIZE_MAP[size]} ${className || ''} rounded-full`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="w-full h-full rounded-full overflow-hidden border-4 border-amber-600/50 shadow-2xl bg-slate-100 relative"
        >
          <div 
            className="w-full h-full transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${collageImg})`,
              // Hacemos un zoom quirúrgico para enmarcar sólo la cara
              backgroundSize: '280% 420%', 
              backgroundPosition: `${surgery.x} ${surgery.y}`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

